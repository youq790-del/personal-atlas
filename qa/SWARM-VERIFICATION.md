# Optional cursor takeover — 2026-11-09

This change adds a lazy-loaded visual demonstration to the restored comic-keyboard
site. It does not replace the homepage. Navigation/menu launch it explicitly.

Reference README inspected: https://github.com/DhvanilPatel/swarm-cursors. Its
License section says no reuse license is currently provided. Our code, cursor
rendering, scheduler and live masking implementation are independently written;
no upstream source or artwork is shipped. The demonstration credits the concept
and Joel Califa's original Swarm.

## Verification

- TypeScript and production build pass.
- Five new scheduler/Unicode/viewport tests pass: cursor lane exclusivity,
  offscreen playhead preservation, paused time and capped background deltas,
  grapheme-safe ranges, and screen/dock bounds.
- Existing keyboard, published-writing, WeChat ingestion and realtime tests pass
  (34 tests with the five new tests included; five separate profile-identity
  tests are not rerun locally because profile code is unchanged and esbuild's
  ancestor scan is blocked on this machine). GitHub's deployment runs the entire
  normal suite.
- Default page retains original markup apart from the header/menu launcher and
  lazy overlay mount. No original content/media changed. Existing WebGL shortcut
  and pointer handlers explicitly ignore active takeover; ordinary keyboard
  operation resumes when its portal unmounts.
- Modal focus is contained during the visual demo; original page uses reversible
  inert state. Exit removes listeners/ticker, clears its canvas and restores the
  triggering control. Scrolling continues through the one existing Lenis instance.
- Reduced-motion shows the completed page, not a shortened animation. Background
  tabs stop the demo; offscreen tasks release cursor lanes; quiet completed views
  stop repainting. Canvas density capped at 1.5, painting at at most 40fps.
- Source selectors are an explicit allowlist. Chat, editable profile, inputs and
  article iframe contents are not read or serialized. Rendered media stays live;
  a temporary drag image uses already-decoded page media without exporting pixels.

Browser preview is disabled in the app's Work settings. No real desktop/mobile
visual or interaction inspection is claimed; responsive rules and lifecycle were
reviewed in source. Deployment/public asset results are reported separately.
