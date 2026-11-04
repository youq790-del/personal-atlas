# Asset provenance

- public/assets/keyboard/keycaps.glb, bongo-frames.glb, logos/, and public/assets/keycap-sounds/ are from [Naresh-Khatri/3d-portfolio](https://github.com/Naresh-Khatri/3d-portfolio). The MIT notice is preserved in licenses/Naresh-Khatri-MIT.txt; the page footer links back to the original. Default key labels now represent the user's six Blender studies and twelve site operations. The retained technology-logo assets and older fallback keyboard poster are not endorsements or verified personal skills.
- src/scene/ adapts the same repository's Chibi scene construction, GSAP choreography, key input, counter and adaptive graphics. The current adaptation adds explicit reading states and a user-triggered Skills cat mode. Adaptation notices remain in source.
- public/assets/keyboard/keyboard-poster.jpg is a still of the locally rendered adapted 3D scene, used for reduced motion and WebGL fallback.
- Solar icons by 480 Design (CC BY 4.0) are sourced from @iconify-json/solar; only the selected paths ship in solar-icons.json. [Source and license](https://icon-sets.iconify.design/solar/).
- Unbounded Variable, Space Grotesk Variable and Noto Sans SC Variable are self-hosted through Fontsource packages under SIL Open Font License. Fontsource package license notices are retained in licenses/.
- public/fonts/helvetiker_regular.typeface.json comes from the MIT reference project's font asset (original Three.js typeface format).
- `src/Brand.tsx` is an original OPEN SPACE geometric mark (two open rounded paths and a central point), reused in the header and opening. It is not the user’s supplied personal monogram, nor a Lusion or Giats logo.
- `src/SeamTransition.tsx` is an authored SVG cubic path with GSAP path-attribute interpolation. It borrows the continuous-edge idea of [SeamTransitions](https://tympanus.net/Demos/SeamTransitions); it does not contain that demo’s WebGL/shader implementation.
- `src/OpeningSequence.tsx` and `intro.css` implement an original short stroke/curtain opening inspired by the user’s [Lusion](https://lusion.co/) reference. [Giats](https://giats.me/) informs the open editorial layout; no identity or portfolio images from either site are included.
- The six main portfolio previews are now renders of user-supplied Blender studies, documented below. The separate profile/archive examples still use explicitly illustrative mathematical geometry where the user has not provided factual content. Neither those examples nor the retained technology logos are evidence of the user's skills, achievements or commissions.

- KineticSurface.tsx contains original mathematical geometry and a projected torus particle field. The Lusion About page informed responsive typography and the relationship between pointer, scroll energy and visual objects; no Lusion assets or shaders are copied. Cat artwork retains the existing MIT reference provenance.

## User-supplied Blender studies

The user supplied these six `.blend` files for the portfolio. They are presented as studies/practice, not verified commercial commissions or wholly original third-party character/brand designs. Titles in `src/portfolio.ts` are presentation titles; the table retains the source filenames. The `.blend` source files remain outside the public site and were never saved over by the preview workflow.

| Public folder | Source file | Web media and visible content |
| --- | --- | --- |
| `public/assets/works/particles/` | `70-苹果九月粒子logo/演示文件.blend` | `poster.webp`: Apple-logo-shaped particle/material study, rendered from its saved scene and camera. The Apple mark is the subject of a study, not this site's identity or an endorsement. |
| `public/assets/works/grass/` | `Blender 动漫风草地/grass Do It With Me.blend` | `poster.webp`: procedural stylized grass scene with packed textures and geometry nodes. |
| `public/assets/works/pop/` | `BLENDER波普风格/blend练习1.blend` and adjacent `mp40001-0110.mkv` | `poster.webp` and `film.mp4`: Gwen Stacy character animation with comic halftone and brush-like rendering. The source scene includes an externally supplied character and Mixamo-named action data; no original character-design claim is made. |
| `public/assets/works/liquid/` | `液态玻璃.blend` | `poster.webp`: layered transparent glass discs above a grid, rendered using the saved Cycles scene. |
| `public/assets/works/cloud/` | `yun.blend` | `poster.webp`: a pale procedural cloud form against a blue world. A temporary presentation camera was added to match the saved viewport direction because the source has no camera. |
| `public/assets/works/organic/` | `练习/有机方块.blend` | `poster.webp`: the saved geometry-node cube study at frame 22. Temporary studio lights were added because the source contains no lamps. |

All six public posters are WebP at 1280×720. Five were rendered in Blender 5.2.3 LTS using background mode, factory startup and disabled automatic script execution; the pop poster was extracted from the adjacent existing video. The pop film is 1280×720 H.264, 3.666 seconds, without audio, approximately 1.77 MB, with metadata moved to the start for browser playback. Only this study currently has exported moving media. A scene's configured frame range does not by itself establish that the displayed still is animated.

`preview.webp` files are extracted native Blender thumbnails retained for diagnostics; some contain editor views. They are not used as the main public artwork. Workspace scripts and inspection records are in `work/blender-previews/` relative to the task workspace, outside this site's public directory. No generated substitute artwork was used for these six studies. `WorkStage.tsx` adds original interface motion, pointer-responsive presentation and magnification to the rendered images; it does not reconstruct the six Blender scenes in WebGL.

## User's WeChat writing archive

The user confirmed the public account name **yo7的堂吉诃德** and original ID **gh_29c0b927a35c**. On 2026-11-04, the user supplied `yo7的堂吉诃德-公众号文章归档.zip`, which supersedes the earlier six-article text-only corpus for the website. The new archive contains 25 published articles from 2026-07-22 through 2026-11-03, each with HTML, Markdown, plain text, metadata and its real public WeChat URL.

`scripts/import-wechat-archive.py` imports the already-extracted archive using the Python standard library. It verifies saved image paths and recorded SHA-256 values, preserves the article body through a static markup/CSS allowlist, and produces `public/content/wechat.json` plus `public/content/articles/<id>/index.html` and adjacent `images/` directories. Article text is fetched as public data instead of being bundled into the main JavaScript. Readers are isolated in an empty sandbox iframe, with a restrictive CSP in the generated page; verified original-article navigation lives in the parent reader.

There are **342 saved image files** corresponding to 341 unique source image URLs, including **6 GIFs**, and **32 inline SVGs**. 《梨来》 has 31 SVGs and 《格林函数》 has one long SVG page. These visuals and image-based formulas remain part of the complete local reading experience. They are supplied article media, not newly generated site artwork. The archive itself and private local collection files are not published as website resources.

| Article | Archived publication date |
| --- | --- |
| 文末的设计太夯了 | 2026-11-03 |
| 前端设计流 | 2026-11-02 |
| 光为什么沿直线传播 | 2026-10-30 |
| 如何在骑车的时候将袋子里的咖啡稳稳拿捏 | 2026-10-29 |
| 波 | 2026-10-28 |
| 多维随机变量的分布 | 2026-10-27 |
| 指针与数组 | 2026-10-26 |
| 花两节水课看完边缘行者2，难平（评） | 2026-10-20 |
| breaking bad | 2026-10-19 |
| 波波与概率分布的结构 | 2026-10-15 |
| 常见离散随机分布 | 2026-10-14 |
| 我怎么证明我感受到了风 | 2026-10-10 |
| 找合适的随机变量 | 2026-10-08 |
| 反方向的钟 | 2026-10-07 |
| 淡 | 2026-09-29 |
| 嗯。。。 | 2026-09-28 |
| 零概率在条件概率中怎么处理 | 2026-09-24 |
| 无人飞机决策系统 | 2026-09-23 |
| 一二节课就开始想午饭吃什么了 | 2026-09-22 |
| 为什么字节跳动不叫bitdance或者PBdance | 2026-09-21 |
| 梨来 | 2026-08-17 |
| 在《痴迷》中怎么安全许愿 | 2026-08-06 |
| 格林函数 | 2026-07-30 |
| 留数 | 2026-07-24 |
| 在WAIC中没看懂transformer架构，但看到了具体到人 | 2026-07-22 |

All 25 source links are supplied public `https://mp.weixin.qq.com/s/<shortlink>` URLs, without query parameters. An account homepage has not been verified and is not fabricated from the account ID. Scripts, event attributes, remote resource loads, active embedded content and session-bearing links do not enter the generated reader. No WeChat session credentials, draft contents or private administrative URLs are public assets.

The former six article IDs remain stable: `writing-a06` (波), `writing-a05` (指针与数组), `writing-a04` (breaking bad), `writing-a03` (常见离散随机分布), `writing-a02` (我怎么证明我感受到了风), and `writing-a01` (反方向的钟). Other IDs derive from hashes of their public article URLs. The previous 2026-10-15 date for 《常见离散随机分布》 was a historical error; the supplied metadata establishes 2026-10-14.

## ThinkingDesk illustrations and quotations

`src/ThinkingDesk.tsx` creates original SVG mathematical illustrations for a pendulum and suspension point, a saddle surface and a traveling wave. These are interface illustrations inspired by questions in the user's writing, not measured reconstructions of the author's experiment or externally sourced scientific plots. Each model retains a visible “示意，非实测” note and accessible non-drag controls.

Nine short quotations, three per topic, were checked against the corresponding archive text. Their observation, hypothesis, uncertainty and further-question roles are editorial organization; no new research result or claim of technical review is implied. The underlying articles' mathematical and scientific arguments have not been individually verified in this work.

| Topic | Source article | Article ID |
| --- | --- | --- |
| Coffee and suspension | 如何在骑车的时候将袋子里的咖啡稳稳拿捏 | `wx-e9a08c5b62806c95` |
| Filter paper and curvature | breaking bad | `writing-a04` |
| Wave and squared quantities | 波 | `writing-a06` |

The full source-path and image mapping is retained in the task workspace's `work/wechat-corpus-index.json`; content interpretation and quotation locations are in `work/wechat-corpus-analysis.md`. These working records are distinct from the public article index.

## Update provenance and cadence

The archive is a complete supplied snapshot, not a live feed. The account backend confirms a personal, unverified account without official published-article API permission. The user's latest instruction is to check for updates every seven days through a Codex local heartbeat attached to this task. Activation remains pending at this documentation update; the task owner will enable it through the automation tool. Operation depends on the computer/Codex being available and the account backend login remaining valid. This cadence must not be described as real-time synchronization.

Future imports must retain actual publication dates, public source URLs, image provenance and the distinction between original writing and newly curated interactive questions. Only published articles are eligible for the public site.
