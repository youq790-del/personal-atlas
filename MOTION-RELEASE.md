# Motion and typography verification — 2026-11-04

Implemented locally. Publication is blocked by unavailable GitHub authentication in this execution environment; the public site still serves the previous release. This record does not claim production verification of the new version.

## Delivered media

| Study | Frames | FPS | Seconds | Bytes |
| --- | ---: | ---: | ---: | ---: |
| Particle Logo | 121 | 24 | 5.042 | 2,466,811 |
| Grass | 144 | 24 | 6 | 1,965,916 |
| Pop (existing) | 110 | 30 | 3.667 | 1,770,912 |
| Liquid (presentation orbit) | 72 | 24 | 3 | 116,285 |
| Cloud (presentation orbit) | 96 | 24 | 4 | 983,846 |
| Organic | 144 | 24 | 6 | 127,161 |

All six MP4s fully decoded with FFmpeg without errors. Each file has the expected frame count and every decoded frame has a different hash. All use H.264/yuv420p with the `moov` index before `mdat` for fast start. Representative raw frames were visually inspected and contact sheets compared; four clips preserve source time logic and two explicitly label new presentation camera movement. No source files were saved or changed.

## Code and assets

- TypeScript passes. Vite production build passes with `--configLoader native`, avoiding this Windows sandbox's ancestor-directory scan restriction.
- 29 normal Node tests passed. Five profile migration cases passed using the same test assertions with a project-scoped esbuild resolver; their standard loader was blocked by Windows parent-directory access. Seven Python importer tests passed.
- All four new font URLs resolve in the build, with no former display families bundled. New font files total 348,552 bytes; OFL notices are distributed with them. Existing archived article HTML and text are unchanged.
- Source review covers visible-only playback, hidden-document pause, reduced-motion/save-data autoplay restrictions, explicit play, persistent manual pause, loading/error posters, accessible seeking, Escape propagation and cleanup.
- The local preview is served at `http://127.0.0.1:4174/`; HTTP checks confirm the page, JavaScript, WOFF2 fonts and video responses. Local HTTP availability is not browser playback or layout verification.

## Remaining verification

Computer Use stopped because its Windows safety check could not confidently identify the current browser URL. No further UI automation was attempted. Desktop/mobile layout, actual in-browser video playback and pointer/keyboard behavior have not been visually validated for this revision.

Git HTTPS push preflight failed because Windows Credential Manager was unavailable to this execution account; SSH authentication also failed. Restore normal GitHub authentication, then push the local commit to `main`. Wait for that exact commit's Pages deployment and check the public page, new fonts and all six media URLs. Do not treat the existing site's HTTP 200 as a new deployment.
