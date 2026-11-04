#!/usr/bin/env python3
"""Import an already-extracted WeChat archive; only Python's stdlib is required.

Usage: python scripts/import-wechat-archive.py /path/to/extracted/archive
The importer never executes archive content or fetches remote assets. Readers use
a tag/attribute/CSS allowlist and a restrictive CSP; embed with an empty sandbox.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import parse_qsl, unquote, urlsplit

LEGACY_IDS = {
    "波": "writing-a06", "指针与数组": "writing-a05", "breaking bad": "writing-a04",
    "常见离散随机分布": "writing-a03", "我怎么证明我感受到了风": "writing-a02",
    "反方向的钟": "writing-a01",
}
PRIVATE_QUERY = re.compile(r"^(?:access_token|token|appmsg_token|pass_ticket|key|uin|wxtoken|exportkey|tempkey)$", re.I)
HTML_TAGS = set("article section div p span strong b em i u s del small sub sup br hr h1 h2 h3 h4 h5 h6 blockquote pre code ol ul li dl dt dd table thead tbody tfoot tr td th caption colgroup col a img figure figcaption ruby rt rp details summary".split())
SVG_TAGS = set("svg g path rect circle ellipse line polyline polygon text tspan textpath defs lineargradient radialgradient stop pattern clippath mask symbol use title desc".split())
MATH_TAGS = set("math semantics annotation mrow mi mn mo mtext mfrac msqrt mroot msup msub msubsup munderover mover munder mtable mtr mtd mfenced mspace".split())
ALLOWED_TAGS = HTML_TAGS | SVG_TAGS | MATH_TAGS
BLOCKED_TAGS = set("script style iframe object embed form input button textarea select option link meta base template noscript audio video source track canvas foreignobject animate animatemotion animatetransform set discard".split())
VOID_TAGS = set("area base br col embed hr img input link meta param source track wbr".split())
COMMON_ATTRS = set("class id title lang dir role aria-label aria-hidden style".split())
SVG_ATTRS = set("x y x1 y1 x2 y2 cx cy r rx ry dx dy d points width height viewbox preserveaspectratio transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset opacity font-size font-family font-weight font-style text-anchor dominant-baseline letter-spacing textlength lengthadjust offset stop-color stop-opacity gradientunits gradienttransform spreadmethod patternunits patterncontentunits patterntransform clippathunits maskunits maskcontentunits clip-path mask vector-effect href xlink:href".split())
MATH_ATTRS = set("display mathvariant mathsize mathcolor mathbackground encoding columnalign rowalign columnspacing rowspacing fence separator stretchy symmetric lspace rspace accent accentunder scriptlevel displaystyle".split())
CASE_TAGS = {"lineargradient": "linearGradient", "radialgradient": "radialGradient", "clippath": "clipPath", "textpath": "textPath"}
CASE_ATTRS = {k.lower(): k for k in "viewBox preserveAspectRatio textLength lengthAdjust gradientUnits gradientTransform spreadMethod patternUnits patternContentUnits patternTransform clipPathUnits maskUnits maskContentUnits".split()}
CSS_PROPERTIES = set("color background background-color font font-family font-size font-style font-weight font-variant font-variant-caps font-variant-ligatures line-height letter-spacing word-spacing text-align text-indent text-transform text-decoration text-decoration-color text-decoration-style text-decoration-thickness white-space overflow-wrap word-break vertical-align display box-sizing visibility width min-width max-width height min-height max-height aspect-ratio margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left border border-top border-right border-bottom border-left border-width border-style border-color border-radius border-bottom-left-radius border-bottom-right-radius border-top-left-radius border-top-right-radius border-collapse border-spacing overflow overflow-x overflow-y list-style list-style-type float clear flex flex-flow flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self justify-content gap transform transform-origin -webkit-transform -webkit-transform-origin -webkit-text-stroke-width orphans widows fill stroke stroke-width opacity".split())


def public_link(value: str) -> str:
    """Keep only public article URLs; discard links containing session data."""
    try:
        parsed = urlsplit(value.strip())
        if parsed.scheme != "https" or parsed.hostname != "mp.weixin.qq.com" or parsed.username or parsed.password or parsed.port:
            return ""
        if any(PRIVATE_QUERY.match(key) for key, _ in parse_qsl(parsed.query)):
            return ""
        if re.fullmatch(r"/s/[A-Za-z0-9_-]+/?", parsed.path):
            return parsed._replace(fragment="").geturl()
        query = dict(parse_qsl(parsed.query))
        if parsed.path == "/s" and query.get("__biz") and query.get("mid"):
            return parsed._replace(fragment="").geturl()
    except (ValueError, TypeError):
        pass
    return ""


def local_image_path(value: str) -> str:
    if not isinstance(value, str) or "\\" in value or re.search(r"[\x00-\x20\x7f]", value):
        return ""
    decoded = unquote(value)
    path = PurePosixPath(decoded)
    if len(path.parts) != 2 or path.parts[0] != "images" or not re.fullmatch(r"[\w.-]+\.(?:png|jpe?g|gif|webp|avif)", path.name, re.I):
        return ""
    return path.as_posix()


def safe_css(value: str) -> str:
    """Preserve typography/layout, never arbitrary CSS resources or code."""
    safe = []
    for declaration in value.split(";"):
        if ":" not in declaration:
            continue
        name, val = declaration.split(":", 1)
        name, val = name.strip().lower(), val.strip()
        if name not in CSS_PROPERTIES or not val or len(val) > 1000:
            continue
        if re.search(r"[\\@{}<>\x00-\x08\x0b\x0c\x0e-\x1f]|/\*|\*/|expression\s*\(|(?:url|image-set|var|attr)\s*\(|(?:javascript|vbscript|data|https?)\s*:", val, re.I):
            continue
        safe.append(f"{name}:{val}")
    return ";".join(safe)


class ArticleSanitizer(HTMLParser):
    """Emit only the article.content subtree with a small static markup surface."""
    def __init__(self, image_paths: set[str]):
        super().__init__(convert_charrefs=True)
        self.image_paths = image_paths
        self.output: list[str] = []
        self.stack: list[tuple[str, str | None, bool]] = []
        self.capturing = False
        self.finished = False
        self.blocked = 0
        self.found = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if not self.capturing:
            if self.finished or tag != "article" or "content" not in (values.get("class") or "").split():
                return
            self.capturing = self.found = True
        blocked = bool(self.blocked or tag in BLOCKED_TAGS)
        emitted = CASE_TAGS.get(tag, tag) if tag in ALLOWED_TAGS and not blocked else None
        if emitted:
            clean = self.clean_attrs(tag, attrs)
            # Empty-sandbox readers cannot open another browsing context. Keep
            # article references as text, with the parent toolbar providing the
            # working source link; do not leave keyboard-focusable dead links.
            if tag == "a" and dict(clean).get("href", "").startswith("https://"):
                emitted = "span"
                clean = [(key, value) for key, value in clean if key not in {"href", "target", "rel", "role"}]
                classes = dict(clean).get("class", "")
                clean = [(key, value) for key, value in clean if key != "class"]
                clean.append(("class", (classes + " archive-reference").strip()))
            if tag == "img" and "src" not in dict(clean):
                emitted = None
            else:
                rendered = "".join(f' {key}="{html.escape(value, quote=True)}"' for key, value in clean)
                self.output.append(f"<{emitted}{rendered}>")
        if tag not in VOID_TAGS:
            self.stack.append((tag, emitted, blocked))
            if blocked:
                self.blocked += 1

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        if not self.capturing:
            return
        index = next((i for i in range(len(self.stack) - 1, -1, -1) if self.stack[i][0] == tag), None)
        if index is None:
            return
        for _, emitted, blocked in reversed(self.stack[index:]):
            if emitted:
                self.output.append(f"</{emitted}>")
            if blocked:
                self.blocked -= 1
        del self.stack[index:]
        if not self.stack:
            self.capturing, self.finished = False, True

    def handle_data(self, data: str) -> None:
        if self.capturing and not self.blocked:
            self.output.append(html.escape(data, quote=False))

    def clean_attrs(self, tag: str, attrs: list[tuple[str, str | None]]) -> list[tuple[str, str]]:
        allowed = COMMON_ATTRS.copy()
        if tag in SVG_TAGS:
            allowed |= SVG_ATTRS
        if tag in MATH_TAGS:
            allowed |= MATH_ATTRS
        allowed |= {"a": {"href"}, "img": {"src", "alt", "width", "height"}, "ol": {"start"}, "li": {"value"}, "td": {"rowspan", "colspan"}, "th": {"rowspan", "colspan", "scope"}}.get(tag, set())
        result = {}
        for key, value in attrs:
            if key not in allowed or value is None or len(value) > 24000 or re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", value):
                continue
            if key == "style":
                value = safe_css(value)
            elif key == "src":
                value = local_image_path(value)
                if value not in self.image_paths:
                    value = ""
            elif key in {"href", "xlink:href"}:
                if re.fullmatch(r"#[A-Za-z_][\w:.-]*", value):
                    pass
                elif tag == "a":
                    value = public_link(value)
                else:
                    value = ""
            elif key in {"fill", "stroke", "clip-path", "mask"}:
                if "url" in value.lower() and not re.fullmatch(r"url\(#[A-Za-z_][\w:.-]*\)", value):
                    value = ""
                elif re.search(r"[\\@{}<>]|(?:javascript|https?|data):", value, re.I):
                    value = ""
            elif key in {"id", "class"}:
                if not re.fullmatch(r"[\w: .-]{1,300}", value):
                    value = ""
            if value:
                result[CASE_ATTRS.get(key, key)] = value
        if tag == "img":
            result.update(loading="lazy", decoding="async")
        if tag == "a" and result.get("href", "").startswith("https://"):
            result.update(target="_blank", rel="noopener noreferrer")
        return list(result.items())

    def result(self) -> str:
        if not self.found:
            raise ValueError("Missing article.content in archive HTML")
        for _, emitted, _ in reversed(self.stack):
            if emitted:
                self.output.append(f"</{emitted}>")
        self.stack.clear()
        return "".join(self.output)


READER_CSS = """
:root{color-scheme:light}*{box-sizing:border-box}html{background:#e9ece8;color:#192532}
body{margin:0;font-family:Georgia,'Noto Serif SC','Songti SC','Microsoft YaHei',serif;line-height:1.95}
main:target>header,main:target>footer{display:none}main:target{padding-top:20px}main{max-width:800px;margin:0 auto;padding:42px 38px 96px;overflow-wrap:anywhere}
.archive-reference{text-decoration:underline;text-underline-offset:4px;cursor:text}.reader-link-note{font:12px/1.8 system-ui,sans-serif;color:#64695b;margin:0 0 22px}.reader-link-note .embedded-reference-help{display:none}main:target .reader-link-note .embedded-reference-help{display:inline}main:target .reader-link-note .standalone-reference-help{display:none}
header{margin-bottom:38px;border-bottom:1px solid #b4b5a5;padding-bottom:24px}
h1{font-size:clamp(25px,4vw,38px);font-weight:500;line-height:1.4;margin:12px 0 16px}
.byline{font:12px/1.6 system-ui,sans-serif;letter-spacing:.06em;color:#64695b}
a{color:#3e624e;text-underline-offset:4px}.content{font-size:16px;overflow-wrap:anywhere}
.content img{max-width:100%!important;height:auto!important;display:block;margin:18px auto}
.content svg{max-width:100%;height:auto}.content pre{overflow:auto;background:#ebe9df;padding:16px;white-space:pre-wrap;font:13px/1.7 monospace}
.content pre>code{display:block;min-height:1.7em;white-space:pre-wrap}.content table{border-collapse:collapse;max-width:100%}
.content td,.content th{border:1px solid #bdbfb1;padding:7px}.content blockquote{margin:20px 0;padding:0 18px;border-left:2px solid #82917a}
.code-snippet__keyword,.code-snippet__type{color:#8c315d}.code-snippet__string{color:#337a51}.code-snippet__comment{color:#777}.code-snippet__number{color:#6b5fa7}
footer{margin-top:48px;padding-top:18px;border-top:1px solid #c9cabc;font:12px/1.7 system-ui,sans-serif;color:#64695b}
@media(max-width:600px){main{padding:24px 20px 60px}.content{font-size:15px}}
"""


def reader_document(title: str, date: str, source_url: str, content: str) -> str:
    escape = lambda text: html.escape(text, quote=True)
    csp = "default-src 'none'; script-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'"
    reference_note = ''
    if re.search(r'class="[^"]*\barchive-reference\b', content):
        reference_note = '<p class="reader-link-note">下划线为文中引用。<span class="embedded-reference-help">相关链接请从上方「微信原文」打开。</span><span class="standalone-reference-help">相关链接请在页尾「在微信中读」中打开。</span></p>'
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="{escape(csp)}"><title>{escape(title)} · yo7</title><style>{READER_CSS}</style></head><body><main id="read"><header><div class="byline">yo7的堂吉诃德 · {escape(date)}</div><h1>{escape(title)}</h1></header>{reference_note}{content}<footer>原文归档 · <a href="{escape(source_url)}" target="_blank" rel="noopener noreferrer">在微信中读</a></footer></main></body></html>'''


def import_archive(archive: Path, output: Path, index_output: Path | None = None) -> dict:
    archive, output = archive.resolve(), output.resolve()
    metadata_files = sorted(archive.glob("已发表/*/*/metadata.json"))
    if not metadata_files:
        raise ValueError("No published metadata.json files found in extracted archive")
    prepared = []
    ids, urls = set(), set()
    for metadata_file in metadata_files:
        directory = metadata_file.parent
        metadata = json.loads(metadata_file.read_text(encoding="utf-8-sig"))
        title = str(metadata["title"])
        source_url = public_link(metadata["url"])
        if not source_url:
            raise ValueError(f"Invalid public source URL: {title}")
        article_id = LEGACY_IDS.get(title, "wx-" + hashlib.sha256(source_url.encode()).hexdigest()[:16])
        if article_id in ids or source_url in urls:
            raise ValueError(f"Duplicate article: {title}")
        ids.add(article_id); urls.add(source_url)
        date = str(metadata["date_iso"])[:10]
        datetime.strptime(date, "%Y-%m-%d")
        image_paths = set()
        for image in metadata.get("images", []):
            relative = local_image_path(image.get("path", ""))
            if not relative or not image.get("saved"):
                raise ValueError(f"Unsaved or unsafe image: {title}")
            source = (directory / relative).resolve()
            if not source.is_relative_to(directory.resolve()) or not source.is_file():
                raise ValueError(f"Missing image: {title} / {relative}")
            if hashlib.sha256(source.read_bytes()).hexdigest() != image.get("sha256"):
                raise ValueError(f"Image checksum mismatch: {title} / {relative}")
            image_paths.add(relative)
        sanitizer = ArticleSanitizer(image_paths)
        sanitizer.feed((directory / "article.html").read_text(encoding="utf-8-sig"))
        sanitizer.close()
        content = sanitizer.result()
        body = (directory / "article.txt").read_text(encoding="utf-8-sig").strip()
        excerpt = next((line.strip() for line in body.splitlines() if len(line.strip()) >= 15), "")
        if len(excerpt) > 135:
            excerpt = excerpt[:134].rstrip() + "…"
        article = {"id": article_id, "title": title, "url": source_url, "publishedAt": date, "excerpt": excerpt, "body": body, "readerPath": f"content/articles/{article_id}/index.html", "source": "archive"}
        prepared.append((directory, article, image_paths, reader_document(title, date, source_url, content)))
    # Validate the whole archive before publishing any generated file.
    output.mkdir(parents=True, exist_ok=True)
    articles, index = [], []
    for directory, article, image_paths, document in prepared:
        destination = output / "articles" / article["id"]
        destination.mkdir(parents=True, exist_ok=True)
        for relative in sorted(image_paths):
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(directory / relative, target)
        (destination / "index.html").write_text(document, encoding="utf-8")
        articles.append(article)
        index.append({"sequence": int(directory.name.split("_", 1)[0]), "id": article["id"], "title": article["title"], "publishedAt": article["publishedAt"], "sourceUrl": article["url"], "sourceDirectory": directory.as_posix(), "htmlPath": (directory / "article.html").as_posix(), "textPath": (directory / "article.txt").as_posix(), "readerPath": article["readerPath"], "imageCount": len(image_paths), "images": [f"content/articles/{article['id']}/{image}" for image in sorted(image_paths)]})
    collection = {"name": "yo7的堂吉诃德", "accountId": "gh_29c0b927a35c", "source": "archive", "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), "articles": sorted(articles, key=lambda article: article["publishedAt"], reverse=True)}
    (output / "wechat.json").write_text(json.dumps(collection, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if index_output:
        index_output.parent.mkdir(parents=True, exist_ok=True)
        index_output.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"articles": len(articles), "images": sum(len(paths) for _, _, paths, _ in prepared), "output": output.as_posix()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "public" / "content")
    parser.add_argument("--index-output", type=Path)
    args = parser.parse_args()
    print(json.dumps(import_archive(args.archive, args.output, args.index_output), ensure_ascii=False))
