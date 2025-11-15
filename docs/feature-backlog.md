# Feature Backlog

_Last updated: 2025-01-18_

## 1. Preset Management ✅ **COMPLETED**

### 1.1 Local Preset Storage (Cookies/LocalStorage) ✅

- **Status:** ✅ **Implemented** - See `docs/presets.md` for details
- **Goal:** Save, name, load, and delete presets locally.
- **Technical Guidance:**
  - Prefer `localStorage` or IndexedDB via [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) over cookies (larger quota, not sent with requests).
  - Preset schema should capture seed, palette, sliders, toggles, icon selection, and timestamp.
  - Provide UI for naming, overwriting, deleting, and optionally exporting/importing presets as JSON.

## 2. Export Enhancements ✅ **COMPLETED**

### 2.1 Arbitrary Output Dimensions ✅

- **Status:** ✅ **Implemented** - See `docs/export.md` for details
- **Goal:** Export to any user-specified pixel dimensions while preserving input aspect ratio via cropping.
- **Technical Guidance:**
  - Render to an off-screen p5 graphics buffer sized to the requested output, then crop/scale as needed.
  - Use `graphics.drawingContext.getImageData` or `canvas.toBlob()` for efficient downloads.
  - Validate huge export sizes (warn about >8K) and surface progress indicators for large renders.

## 3. Keyboard Shortcuts

### 3.1 Keyboard Shortcut Implementation

- **Goal:** Add keyboard shortcuts for frequently used actions to improve workflow efficiency.
- **Useful Shortcuts to Implement:**
  - **`R`** - Randomise all (quick iteration without moving mouse)
  - **`F`** or **`F11`** - Toggle fullscreen mode
  - **`P`** - Open Presets manager
  - **`T`** - Cycle theme mode (System → Light → Dark)
  - **`1`, `2`, `3`** - Switch between control tabs (Sprites, Layers, Motion)
  - **`ESC`** - Exit fullscreen / Close modals
  - **`S`** - Screenshot/Export (when implemented)
- **Technical Guidance:**
  - Use React's `useEffect` with `keydown` event listeners, checking for modifier keys (Ctrl/Cmd) when needed.
  - Prevent default browser shortcuts (e.g., `F11` fullscreen) only when necessary, or use `Ctrl/Cmd + F` instead.
  - Store shortcuts in a centralized config object for easy maintenance and documentation.
  - Use [`react-hotkeys-hook`](https://github.com/Johann-S/react-hotkeys-hook) or [`use-hotkeys`](https://github.com/reecelucas/react-use-hotkeys) for declarative shortcut handling.
  - Ensure shortcuts don't conflict with browser defaults or accessibility tools.
  - Disable shortcuts when modals are open or when user is typing in inputs.
- **Tooltip Integration:**
  - Display keyboard shortcuts in hover tooltips alongside function names (e.g., "Randomise all (R)").
  - Update existing tooltip components to accept an optional `shortcut` prop.
  - Show shortcuts in a subtle, secondary style (e.g., grayed out, smaller font) within tooltips.
  - Consider a keyboard shortcuts help modal (accessible via `?` or `Ctrl/Cmd + /`) listing all available shortcuts.

## 4. Fullscreen Presentation Mode ✅ **COMPLETED**

### 4.1 Fullscreen Toggle with Minimal HUD ✅

- **Status:** ✅ **Implemented** - Fullscreen mode with auto-hiding HUD is working
- **Goal:** Fullscreen canvas with Randomise/Close controls appearing on mouse movement.
- **Technical Guidance:**
  - Use the [Fullscreen API](https://developer.mozilla.org/docs/Web/API/Fullscreen_API) on the canvas wrapper.
  - Overlay a small HUD animated via Tailwind/Framer Motion; auto-hide after inactivity.
  - Ensure ESC and the Close button exit fullscreen cleanly.

## 5. FX Tab Expansion

### 5.1 Shader Effects

- **Goal:** Optional WebGL post-processing layer (CRT bloom, scanlines, chromatic aberration).
- **Technical Guidance:**
  - Evaluate [pixi.js filters](https://pixijs.io/pixi-filters/) or [`@react-three/postprocessing`](https://github.com/pmndrs/react-postprocessing) if we lean on `three.js`/react-three-fiber.
  - For lightweight custom passes, consider [`regl`](https://github.com/regl-project/regl) or GLSL modules via [`glslify`](https://github.com/glslify/glslify).
  - Ensure graceful fallback when WebGL is unavailable (toggle off FX tab features).

### 5.2 Noise & Dither Overlays

- **Goal:** Layer grain, CRT noise, or Bayer dithering on top of the sprite canvas.
- **Technical Guidance:**
  - Implement as p5 shader overlay or secondary canvas blended with CSS mix-blend modes.
  - Libraries: [`simplex-noise`](https://github.com/jwagner/simplex-noise), [`glsl-noise`](https://github.com/stegu/webgl-noise).
  - Expose controls for noise strength, pattern selection, animation speed.

### 5.3 Interactive Modes (Gravity / Cursor Forces)

- **Goal:** Cursor-driven attract/repulse behaviours and gravity wells.
- **Technical Guidance:**
  - Extend `generator.ts` movement updates with pointer events (track cursor in React state).
  - Use p5 vectors or integrate a lightweight physics helper such as [`planck.js`](https://piqnt.com/planck.js/).
  - Preserve deterministic behaviour by seeding force randomisation.

### 5.4 Physics-Augmented Animations

- **Goal:** Incorporate velocity, acceleration, damping, and collisions into sprite movement.
- **Technical Guidance:**
  - Depending on complexity, either roll custom Euler integration or adopt [`matter-js`](https://brm.io/matter-js/).
  - Budget for performance: provide max sprite counts and disable collisions when excessive.

### 5.5 Particle Effects

- **Goal:** Emit spark, trail, or glow particles around sprites.
- **Technical Guidance:**
  - Potential options: native p5 particle system, [`tsparticles`](https://particles.js.org/), `three.js` `Points`.
  - Sync particle palettes with active theme colours; allow toggles for lifetime, spawn rate, dispersion.

## 6. Technology Summary

| Feature Area       | Suggested Libraries / Tools                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Preset Storage     | `localStorage`, `idb-keyval`, optional `zustand`/`redux-persist` for state serialisation         |
| Arbitrary Exports  | Off-screen p5 buffers, `canvas.toBlob`, progress indicators                                      |
| Keyboard Shortcuts | `react-hotkeys-hook`, `use-hotkeys`, or native `useEffect` with `keydown` listeners              |
| Fullscreen Mode    | Fullscreen API, Tailwind overlays, optional Framer Motion for HUD transitions                    |
| Shader FX          | `pixi.js` filters, `three.js` + `@react-three/postprocessing`, `regl`, custom GLSL via `glslify` |
| Noise Overlays     | p5 shaders, CSS blend modes, `simplex-noise`, `glsl-noise`                                       |
| Interactive Modes  | Pointer events, p5 vectors, `planck.js` or custom physics integrators                            |
| Physics Animations | `matter-js`, `planck.js`, custom Euler/Verlet integration                                        |
| Particle Effects   | p5 particle patterns, `tsparticles`, `three.js` point materials                                  |

## 7. Next Steps

1. Scope persistence layer for presets (decide between cookie fallback vs. localStorage primary).
2. Implement keyboard shortcuts with tooltip integration.
3. Implement export modal enhancements and validate large-output workflow.
4. Prototype fullscreen HUD behaviour and input handling.
5. Plan shader/FX tab architecture and performance budgets.
6. Schedule technical spikes for physics-driven FX (interactive modes, particles).
