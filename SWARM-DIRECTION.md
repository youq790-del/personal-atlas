# Cursor takeover — 2026-11-09

Keep the restored comic-keyboard website. Start its temporary cursor takeover
on every page load, unless reduced motion is enabled. The original layout, fonts,
real videos, WebGL keyboard and complete articles remain underneath. The header
and menu offer replay after exit. This replaces the earlier opt-in-only decision
and the separate initial logo curtain, per the latest user request.

Three simulated tools lay out text, media and controls. Scrolling admits the next
pieces; short type reveals, dragged media frames, alignment guides and measured
dimensions describe the assembly. No bottom dock, counters, progress, pause or
speed controls remain. A tilted Esc keycap, drawn arrow and handwritten “随时接手”
cue appear briefly and fade after roughly five seconds. Escape always exits even
after the cue disappears. A compact skip button remains on touch devices and is
revealed by keyboard focus on desktop. Completed reconstruction, canvas failure
or switching to reduced motion also returns control automatically. The page
retains its current scroll position and restores useful focus on exit.

Use the site's Bricolage / Noto / WenKai typography and inherited light/dark page
palette. Blue #579bff marks selection, coral #ff987b and lilac #c0a1ff distinguish
simulated cursor tools. No persistent control panel or new page layout.

Implementation: original GSAP-driven canvas UI mask with transparent windows
over measured DOM bounds. The media behind each window stays live. Text windows
follow real glyph bounds, preserving original semantics and line breaks. No DOM
content is replaced, no screenshot extension is required, no visitor input or
article iframe content is inspected. Only explicit presentation selectors are
eligible. The existing Lenis instance remains the only scroll engine. Reduced
motion bypasses the opening entirely; hidden tabs suspend the demo. The overlay
loads with the application so its Escape handler does not depend on a lazy chunk.

Reference: https://github.com/DhvanilPatel/swarm-cursors, README inspected on
2026-11-09. It credits Joel Califa's Swarm and explicitly says there is no reuse
license. This project uses the high-level concept only: none of its source,
cursor assets, names, physics or renderer is copied. Both references are linked
from the navigation menu. Our overlay is independently implemented for this site.

Browser inspection was disabled in the app's Work settings earlier in this task.
Build, model tests and source verification do not substitute for visual QA.
