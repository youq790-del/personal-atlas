# Personal narrative — questions, works, notes

Current direction recorded on 2026-11-04. The user's latest request takes priority: remove AI-sounding slogans throughout the site, reduce explanatory copy, and let artistic interactions reveal actual thought. Preserve the physical keyboard and elastic artwork system, along with content provenance and accessible alternatives.

## Identity and evidence

The subject is yo7, who values thinking and recording in science and engineering and also makes visual studies. Six supplied Blender files remain practice pieces. The complete user-supplied `yo7的堂吉诃德-公众号文章归档.zip` contains 25 published articles dated 2026-07-22 through 2026-11-03, with 342 local images, 32 inline SVGs and 25 real public article URLs. The previous six-article, text-only limitation no longer applies.

The articles include learning notes, observations and everyday life. They do not establish a degree, employer, award, commission or certification. The nine short quotations in ThinkingDesk have been checked against the source prose; the underlying technical arguments have not been individually audited or certified.

[Santioni Spirits](https://santionispirits.com/) informed expressive serif scale, chapter progression and direct content routes after the user's age confirmation. Its branding, products and assets are not copied. Earlier Naresh, Giats, SeamTransitions and Lusion references remain documented in REFERENCE-STUDY.md and ASSETS.md.

## Current content route

- Identify yo7 briefly and give visible routes to the person, works and writing. The keyboard is an invitation, not a prerequisite for finding content.
- The personal chapter uses “在学 / Blender / 日常”, actual work previews and short attributed quotations. Its labels and actions describe what is there; they do not construct a grand narrative about the author.
- Preserve complete viewing of all six Blender studies. The article area begins with ThinkingDesk: coffee, filter paper and a wave, each paired with a concrete question.
- Let visitors move a pendulum or its suspension point, bend a saddle surface, or change and pluck a wave. Buttons and range inputs provide equivalent controls without dragging. These are mathematical illustrations, visibly marked “示意，非实测”.
- Each topic reveals one of three verified short quotations. Coffee and paper keep observation, hypothesis and uncertainty distinct; the wave links observation, explanation and a further question. Never turn a tentative statement into a proven conclusion.
- Follow with the latest three articles, an expandable complete index and search. Open full articles in a stable reading modal, with a real public WeChat source link outside the iframe.
- Keep the closing account bookmark and reading route concise. A supplied email can use the real email route; chat remains secondary.

## Words and visual hierarchy

Prefer concrete prompts such as “换成手提，就稳了？” and short functional labels such as “拨一下”, “找一篇” and “微信原文”. Use the original author’s phrasing when quoting; preserve “可能” and “未确定”. Remove abstract summaries, inflated claims and repeated instructions. Do not rewrite the full articles in order to simplify the interface.

Newsreader shapes the name; Noto Serif SC supports Chinese headings and reading surfaces; Space Grotesk supports controls and metadata. Current article components are ThinkingDesk.tsx / thinking-desk.css and WeChatShelf.tsx / reading-room.css. Identity and personal-chapter styles remain in identity.css and personal-portrait.css. The generated design.json remains the earlier base-token snapshot.

The previous theme “让思考有形状”, the heading “一半在推演，一半在造形”, the long gallery manifesto and the old scattered-page disclosure are historical design choices. They are superseded and must not be used as current copy guidance.

## Interaction and reader contracts

Topic tabs support arrow keys, Home / End and visible focus. Keep the object, selected question, original quotation and source action close together. Models stop continuous motion when offscreen, when the page is hidden, or when motion is reduced; static states and direct reading remain usable. The site's single GSAP/Lenis motion system remains in place.

The public article index is fetched from `content/wechat.json` relative to the deployment base. Original bodies are not bundled into the main JavaScript payload. `openArticle?: { id: string; token: number }` supports direct reading from other sections; a new token can reopen the same article.

The complete reader loads a sanitized local HTML page in an iframe with an empty `sandbox` and `no-referrer`. Images, SVGs and formulas remain local and intact. The parent modal provides the verified source URL, Escape/close behavior and focus restoration. If a reader page is unavailable for an entry, preserve plain-text or source-link fallback. Do not claim the sandboxed internal popup link is the main external navigation route.

Artwork color exploration remains a fine-pointer reveal; touch, keyboard focus and reduced-motion show full original color. Original media is not modified. Account copying reports success only after the clipboard succeeds; failure retains a searchable account. No public homepage is fabricated from the `gh_` ID.

## Updating articles

The account backend confirms a personal, unverified account without official published-article API permission. The optional official API tooling is not an active feed for this account.

The user's latest requested cadence is every seven days. A Codex local heartbeat attached to the current task is planned, pending activation by the task owner. It depends on the computer and Codex running and the backend login remaining valid. This is weekly checking, not publication-triggered real-time synchronization. A failed or expired login must not be reported as a successful update.

New published articles can enter the public index after import and deployment. New featured thought connections require reading their actual contents; automatic keyword tags must not be presented as the author's intellectual progression. Only published material is eligible, with no drafts, session credentials or administrative URLs in public files.

## Status

This document records the current design and evidence, not browser or deployment acceptance. The task owner records this iteration's visual QA separately.
