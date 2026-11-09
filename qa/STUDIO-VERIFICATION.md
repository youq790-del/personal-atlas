# Reconstruction portfolio — 2026-11-09

The new default page is a DOM-based reconstruction demonstration inspired by
saai.pro's information sequence and cursor choreography. Reference HTML, CSS,
initialization code and publicly delivered reconstruction engine were inspected;
no source/assets or identity copied. Visual browser use was disabled in Work
settings. No browser-based screenshot, responsive, keyboard or interaction test
is claimed for this version.

## Implemented and source-reviewed

- Three simulated cursor lanes, actual measured dimensions and completed-object
  progress; scroll entrances per section and per work. Pause, Escape/skip, replay,
  hidden/offscreen pause, and reduced-motion final states.
- Accessible complete text accompanies the decorative per-character typing.
  Interaction settles the section before a control is used.
- Six genuine local Blender videos; four animation studies, two camera
  presentations. Category filters retain stable sections; film/method/source
  layers use exact local source filenames. Previews pause behind dialogs.
- Published writing and local profile merging preserved. All 25 existing complete
  readers, media and original URLs untouched. Three question summaries and quotes
  checked against the original articles. Counts derive from data.
- New styles load separately from the complete legacy keyboard mode. Only one
  Lenis instance per active route. Theme, contact copy fallback, article search,
  profile editor and customized non-template entries retained.
- Independent source review fixed paused-video state after skip, missing icon
  glyphs, dialog-size CSS conflicts, dark-mode reader contrast, and accessible
  paragraph text.

## Checks

- TypeScript: passed.
- Production build: passed with native Vite config loading.
- Independent ReactDOMServer render of the actual Vite SSR bundle passed:
  seven video elements (hero + six projects), six stable project slots, eleven
  construction sections, twenty-six targets, six complete accessible typing
  labels, thirty-three decorative cursor nodes, correct 25-article count, and
  unique section IDs. This is a static rendering check, not browser execution.
- Node suites: 32 tests passed directly, including three new reconstruction
  schedule/Unicode/cursor-boundary tests. The existing five profile-identity tests
  passed unchanged through a Vite-generated module instead of esbuild's resolver:
  this machine denies esbuild's ancestor-directory scan. The normal GitHub
  workflow remains responsible for running the standard full command.
- Desktop/mobile CSS has explicit breakpoints at 1150/850/600px, native hidden
  states and semantic controls. This source review is not visual validation.

Deployment and public artifact checks are recorded by the task after pushing.
