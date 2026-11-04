"""Safety checks for importing untrusted archive HTML (stdlib only)."""
import importlib.util
import sys
import unittest
from pathlib import Path

script = Path(__file__).resolve().parents[1] / "scripts" / "import-wechat-archive.py"
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("wechat_import", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def sanitize(fragment, images=()):
    parser = module.ArticleSanitizer(set(images))
    parser.feed('<article class="content">' + fragment + '</article>')
    parser.close()
    return parser.result()


class ArchiveImportSafety(unittest.TestCase):
    def test_active_content_and_events_are_removed(self):
        result = sanitize('<script>alert(1)</script><iframe src="https://evil.test">secret</iframe><form><input></form><p onclick="alert(1)">正文</p><svg><animate attributeName="href" to="javascript:alert(1)"></animate><text>公式</text></svg>')
        self.assertNotIn("alert", result)
        self.assertNotIn("iframe", result)
        self.assertNotIn("secret", result)
        self.assertNotIn("onclick", result)
        self.assertNotIn("animate", result)
        self.assertIn("正文", result)
        self.assertIn("公式", result)

    def test_images_must_be_validated_local_files(self):
        result = sanitize('<img src="https://evil.test/x.png"><img src="images/%2e%2e/x.png"><img src="images/missing.png"><img src="images/one.png" onerror="alert(1)">', {"images/one.png"})
        self.assertEqual(result.count("<img"), 1)
        self.assertIn('src="images/one.png"', result)
        self.assertNotIn("onerror", result)

    def test_css_cannot_load_external_content(self):
        css = module.safe_css(r"color:red;background:url(https://evil.test/a);width:expression(alert(1));font-family:\75rl(x);background-image:image-set('https://evil.test/a');transform:scale(.8);padding:12px")
        self.assertEqual(css, "color:red;transform:scale(.8);padding:12px")

    def test_link_policy_rejects_secrets_and_scripts(self):
        result = sanitize('<a href="javascript:alert(1)">a</a><a href="https://mp.weixin.qq.com/s/abc?token=secret">b</a><a href="//evil.test">c</a><a href="https://mp.weixin.qq.com/s/abc">原文</a><a href="#diagram">图</a>')
        self.assertNotIn("secret", result)
        self.assertNotIn("javascript", result)
        self.assertNotIn("evil", result)
        self.assertEqual(result.count("href="), 1)
        self.assertIn('<span class="archive-reference">原文</span>', result)

    def test_embedded_references_are_inert_and_only_linked_articles_get_a_hint(self):
        content = sanitize('<a href="https://mp.weixin.qq.com/s/abc"><strong>相关文章</strong></a><a href="#formula">公式</a>')
        self.assertNotIn('href="https://', content)
        self.assertNotIn('target=', content)
        self.assertIn('<span class="archive-reference"><strong>相关文章</strong></span>', content)
        self.assertIn('href="#formula"', content)
        linked = module.reader_document('标题', '2026-11-04', 'https://mp.weixin.qq.com/s/source', content)
        plain = module.reader_document('标题', '2026-11-04', 'https://mp.weixin.qq.com/s/source', sanitize('<p>正文</p>'))
        self.assertIn('<p class="reader-link-note">', linked)
        self.assertNotIn('<p class="reader-link-note">', plain)
        self.assertIn('main:target>header,main:target>footer{display:none}', linked)

    def test_svg_geometry_and_math_remain(self):
        result = sanitize('<svg viewBox="0 0 100 100"><defs><linearGradient id="paint"><stop offset="0" stop-color="#eee"/></linearGradient></defs><path d="M0 0L10 10" fill="url(#paint)"/><text x="12">ξ</text></svg><math><mfrac><mi>x</mi><mn>2</mn></mfrac></math>')
        self.assertIn('viewBox="0 0 100 100"', result)
        self.assertIn("<linearGradient", result)
        self.assertIn('fill="url(#paint)"', result)
        self.assertIn("<mfrac>", result)
        self.assertIn("ξ", result)

    def test_outside_article_and_foreign_objects_are_not_imported(self):
        parser = module.ArticleSanitizer(set())
        parser.feed('<p>outside</p><article class="content"><svg><foreignObject><iframe srcdoc="bad">hidden</iframe></foreignObject></svg>inside</article><p>after</p>')
        self.assertEqual(parser.result(), '<article class="content"><svg></svg>inside</article>')


if __name__ == "__main__":
    unittest.main()
