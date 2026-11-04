# Printed keyboard

The keyboard uses the existing, licensed Naresh Khatri geometry/scene placement and our original Three.js renderer. Saeed Kolivand's portfolio was studied as a technique reference: `lib/toon.ts` uses discrete light bands; `shaders/PrintEffect.ts` combines halftone, hatch and edges; `shaders/pressMaterials.ts` uses material-space patterns. No reference shader, artwork, logo, character or prose is copied. Its current repository has no explicit reuse license.

`print-material.ts` draws three hard light regions, object-locked antialiased dots and hatch marks. An expanded backface pass adds dark outlines. Casework has a paper top and indigo sidewalls. The key palette is restricted to paper, ink, lemon, pink and periwinkle; each key carries its real Chinese label and resolved physical shortcut.

`ComicScene.tsx` interprets only the keyboard's supported document nodes and provides the existing host API to `motion.ts`, preserving rotation, spring response, press state, counter and cat frames. It renders on demand, caps DPR, stops for hidden documents/reading sections, skips invisible duplicated 3D captions, and disposes its listeners, tweens, geometry, materials and textures. Article and footer interactions remain semantic HTML outside the canvas. The contact section now keeps the keyboard hidden.

No new dependencies are required. The static poster must be captured from this renderer and replace `public/assets/keyboard/keyboard-poster.jpg` during browser QA, so reduced-motion and WebGL fallback share the same visual treatment.
