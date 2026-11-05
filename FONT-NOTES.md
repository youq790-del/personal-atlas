# Typeface roles and web delivery

Updated 2026-11-04. Typography now has three roles, defined in `src/typography.css`.

| Role | Typeface | Use |
| --- | --- | --- |
| `--font-display` | Bricolage Grotesque | Latin name, opening signature, section words, large display lettering |
| `--font-personal` | LXGW WenKai web subset, named Yo7 WenKai | Chinese introduction, short quotations, work and article titles |
| `--font-ui`, `--font-reading` | Noto Sans SC Variable | Buttons, controls, dates, metadata, longer text and article-text fallback |

The display face has a less formal rhythm and more distinct shapes than the previous mixed serif/sans treatments. WenKai is confined to personal statements and short titles; it is not applied to the full reading body. Font synthesis remains disabled. Chinese personal text uses the actual regular weight and normal spacing, rather than artificially squeezing or emboldening handwritten strokes.

The hero name uses Bricolage 700 at `1.08` line-height with small block padding and visible overflow. Desktop and mobile no longer use the former `0.75 / 0.73` line boxes. The large Made heading also uses an uncropped `1.03` line-height. Existing motion and content are unchanged by this typography pass.

## Sources and licences

- Bricolage Grotesque by Mathieu Triay / The Bricolage Grotesque Project Authors: [official source](https://github.com/ateliertriay/bricolage), SIL Open Font License 1.1. Downloaded official `fonts/webfonts/BricolageGrotesque[opsz,wdth,wght].woff2`; repository tree verified at `84745e5b96261ae5f8c6c856e262fe78d1d6efdd`. Licence: `public/fonts/BRICOLAGE-OFL.txt`.
- LXGW WenKai by LXGW, based on Klee: [official source](https://github.com/lxgw/LxgwWenKai), SIL Open Font License 1.1. Downloaded official `fonts/TTF/LXGWWenKai-Regular.ttf`; repository tree verified at `da0fdf92a0adc5d83c82ecde06d6665c97a2a45e`. Licence: `public/fonts/WENKAI-OFL.txt`.
- Noto Sans SC: existing self-hosted `@fontsource-variable/noto-sans-sc` package, currently installed 5.3.1. SIL Open Font License 1.1, copied to `public/fonts/NOTO-SANS-SC-OFL.txt`.

The WenKai subset is renamed internally to **Yo7 WenKai** to distinguish this modified delivery file from the full original family. It is a website-only WOFF2 subset, not an installable desktop font. Original copyright and licence name records remain present.

## Asset budget and subsets

| Delivered file | Weight | Bytes |
| --- | --- | ---: |
| `bricolage-display-regular.woff2` | 400 | 31,776 |
| `bricolage-display-semibold.woff2` | 600 | 31,856 |
| `bricolage-display-bold.woff2` | 700 | 31,672 |
| `yo7-wenkai-text.woff2` | 400 | 253,248 |
| Total new font data | | **348,552** |

Bricolage is instantiated at optical size 48 and normal width 100, then subset to Latin/Latin Extended, punctuation, currency and mathematical symbols supported by the source. The three WOFF2 files are static fonts: no unused variable axes ship.

WenKai contains 1,130 requested Unicode characters, with no missing source characters. The subset includes Chinese characters and punctuation found in project TypeScript/TSX/JS and published article title/summary/excerpt/description fields. Latin is intentionally excluded from this face so mixed text keeps a consistent sans fallback. If a future article title introduces an uncovered character, the browser falls back to Noto Sans SC; content does not become blank. Rebuild this subset after substantial copy changes to keep title styles consistent.

The original 25.9 MB WenKai TTF and build tools stay outside the web project under the task's `work/font-sources` and `work/font-tools` directories. They are not copied to `public` or `dist`. Subsets were generated with fontTools 4.61.1 and Brotli 1.2.1; the working source directory contains `font-subset-manifest.json` with codepoint counts and SHA-256 checksums.

Noto Sans SC retains its existing complete Unicode-range shards for future writing. The build contains approximately 4.5 MB of those font assets, fetched by browsers only for ranges they actually render, rather than loading a full CJK font on entry. Removing Newsreader, Space Grotesk, Unbounded and Noto Serif imports prevents their previous asset families from entering the CSS build.

All four new fonts use `font-display: swap` and same-site paths. Vite rewrites those paths to `../fonts/…` in the generated CSS, preserving GitHub Pages subdirectory deployment. No external font service is requested.

## Verification and limits

TypeScript and Vite production build with `--configLoader native` pass. Built CSS has no old font-family names, and every new URL resolves to a generated WOFF2 asset. The subset cmap includes all requested WenKai characters. Browser visual verification is pending: the computer-use safety check could not confidently determine the current browser URL on Windows and stopped UI access for this turn.

Archived full articles are isolated HTML documents inside an iframe. Their preserved internal typography is unaffected by site CSS and still follows the existing archive template. This pass changes the site's reading fallback to Noto Sans SC without rewriting archived article bodies or import logic.
