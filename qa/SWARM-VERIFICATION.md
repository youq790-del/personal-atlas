# Automatic cursor opening — 2026-11-09

The restored comic-keyboard site now opens with its cursor reconstruction. The
previous bottom toolbar is removed completely. An Esc keycap and a short drawn
arrow accompany the transient exit cue; its timeline ends at 5.45 seconds. It is
decorative and independent from the persistent keyboard/touch exit control.

Reference README: https://github.com/DhvanilPatel/swarm-cursors. No reuse license
is provided there. Our overlay and rendering are independently implemented;
reference credit links now live in the navigation menu.

## Verification

- TypeScript and the production build pass.
- 34 tests pass, including all five swarm tests. The viewport regression now
  admits content at the bottom edge without reserving room for the deleted dock.
- The full test invocation still encounters the existing local esbuild ancestor
  directory access error before the five profile-identity tests can execute.
  Those tests and the ordinary full build remain required by the Pages workflow.
- No original content or media changed. The separate logo opening no longer
  mounts, preventing competing focus and entrance animations. The overlay is
  imported with the application rather than delayed behind a lazy boundary.
- Source review: Escape and skip unmount the overlay, restore prior inert state
  and useful focus, and remove the ticker, layout/theme observers and event listeners.
  Complete reconstruction, missing canvas, rendering failure and a change to
  reduced-motion all return control; reduced-motion initially bypasses opening.
- The hint never receives focus. Desktop Tab reveals a separate exit button;
  touch keeps that compact 44px-tall control visible. The existing Lenis remains
  the only scroll engine and the overlay does not lock vertical scrolling.
- Model, paint labels and rulers no longer reserve a bottom control area. Fonts
  and host size changes trigger fresh measurements. Saved light/dark themes are
  observed after initial mounting and update the mask palette. Hidden tabs suspend work;
  quiet completed viewports stop painting; density is capped at 1.5 and 40fps.
- WebGL shortcut and pointer guards continue to ignore active takeover. The
  global typed easter egg also ignores it. The existing page is interactive on
  exit, with the same original scroll position.

Browser preview is disabled in the app's Work settings. No desktop/mobile visual
or live interaction inspection is claimed. Build and public release verification
are reported separately; source/model checks do not substitute for visual QA.
