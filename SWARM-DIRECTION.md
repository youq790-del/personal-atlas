# Cursor takeover — 2026-11-09

Keep the restored comic-keyboard website as the default experience. Add an
explicit “光标接管” action in the header and menu. This opens a temporary visual
reconstruction of the current page, with the original layout, fonts, real videos,
WebGL keyboard and complete articles underneath. It never runs automatically.

Three simulated tools lay out text, media and controls. Scrolling admits the next
pieces; short type reveals, dragged media frames, alignment guides and measured
dimensions describe the assembly. A small dock offers pause, speed, replay and
return to the website. Escape always exits. The page retains its original scroll
position and becomes interactive again on exit. Counts represent placed pieces.

Use the site's Bricolage / Noto / WenKai typography and inherited light/dark page
palette. Blue #579bff marks selection, coral #ff987b and lilac #c0a1ff distinguish
simulated cursor tools. One restrained toolbar; no new page layout or card system.

Implementation: original GSAP-driven canvas UI mask with transparent windows
over measured DOM bounds. The media behind each window stays live. Text windows
follow real glyph bounds, preserving original semantics and line breaks. No DOM
content is replaced, no screenshot extension is required, no visitor input or
article iframe content is inspected. Only explicit presentation selectors are
eligible. The existing Lenis instance remains the only scroll engine. Reduced
motion shows the completed state; hidden tabs suspend the demo.

Reference: https://github.com/DhvanilPatel/swarm-cursors, README inspected on
2026-11-09. It credits Joel Califa's Swarm and explicitly says there is no reuse
license. This project uses the high-level concept only: none of its source,
cursor assets, names, physics or renderer is copied. Both references are linked
from the demo. Our overlay is independently implemented for this specific site.

Browser inspection was disabled in the app's Work settings earlier in this task.
Build, model tests and source verification do not substitute for visual QA.
