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

The user confirmed the public account name **yo7的堂吉诃德** and original ID **gh_29c0b927a35c** during this task. `src/archived-writing.ts` imports six pieces from the user's existing local article corpus, recorded by the `yo7-wechat-voice` corpus manifest. Titles, dates and supplied body text are retained:

| Article | Archived publication date |
| --- | --- |
| 波 | 2026-10-28 |
| 指针与数组 | 2026-10-26 |
| breaking bad | 2026-10-19 |
| 常见离散随机分布 | 2026-10-15 |
| 我怎么证明我感受到了风 | 2026-10-10 |
| 反方向的钟 | 2026-10-07 |

These are supplied local archives, not a live WeChat feed. Public homepage/article URLs are still missing and have not been fabricated. The interface provides account-name/ID copying and marks original links as pending. Source images and image-only formulas were not in the archive; explicit missing-figure notes remain. No unverified cover images, screenshots, QR codes, WeChat session credentials or private administrative URLs are bundled. Adding a valid public URL later enables the original-article link while retaining the local reading text.
