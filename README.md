# <picture><source media="(prefers-color-scheme: dark)" srcset="public/logo/SVG/pixli-logo-white.svg"><source media="(prefers-color-scheme: light)" srcset="public/logo/SVG/pixli-logo-black.svg"><img alt="Pixli: generative art toy" src="public/logo/SVG/pixli-logo-black.svg"></picture>

<br />

<p align="center">
</p>

## 🎨 generative art toy

Pixli is a vibrant generative art toy built with React, p5.js, Tailwind and RetroUI. Combine sprite iconography, colour palettes, blend modes and motion envelopes to compose shimmering, real‑time canvases.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=20232A" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/p5.js-1.9-DD4444?style=for-the-badge&logo=processingfoundation&logoColor=white" alt="p5.js" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/RetroUI-Custom-ffce02?style=for-the-badge&logo=figma&logoColor=111" alt="RetroUI" />
</p>

<p align="center">
  <img src="public/screengrabs/Screenshot%202025-11-16%20161543.png" width="90%" alt="Pixli screenshot" />
</p>

<p align="center">
  <em>Dial in palettes, density, motion envelopes, blend modes, and more from a single retro-inspired cockpit.</em>
</p>

---

### 📚 Table of contents

- [✨ Highlights](#-highlights)
- [🗺 Experience Map](#-experience-map)
- [🎨 Custom Palettes](#-custom-palettes)
- [🚀 Quick Start](#-quick-start)
- [🛠 Commands](#-commands)
- [⚙️ Tech Stack](#️-tech-stack)
- [🗂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

<p align="center">
  <a href="https://pixli.jamescutts.me/">
    <img
      src="https://img.shields.io/badge/Live%20Demo-pixli.jamescutts.me-ff4f8b?style=for-the-badge&logo=debian&logoColor=white"
      alt="Live Demo"
    />
  </a>
</p>

---

## ✨ Highlights

- **Generative sprite canvas** – Multi-layer p5.js engine with dialled‑in controls for density (UI 0–100 ≙ 50–1800%), scale base/spread, palette variance, opacity, and animation tempo.
- **Expanded Sprite Modes** – Tiles, circles, hexagons, rings, diamonds, stars, long neon scanlines, pixels (3x3 grid), and more—each selectable via icon buttons for instant previews.
- **Random Sprites** – Toggle to randomize sprite shapes across the canvas, with a refresh button to re-roll the selection instantly.
- **Motion Lab** – Density-driven layering paired with ten motion envelopes (drift, pulse, ripple, zigzag, cascade, spiral, comet, linear, isometric, triangular) and a master speed dial, now normalised so every mode feels balanced at the same slider value. Animation speeds have been fine-tuned for optimal control and visual comfort.
- **Rotation System** – Independent rotation offsets (Sprites tab) and spin animation (Motion tab) with per-sprite direction, speed and angle variance.
- **Blend Architectures** – Layer-specific blend modes (multiply, screen, hard light, overlay) with optional per-sprite randomisation.
- **Custom palette management** – Create custom colour palettes from images (upload or URL), extract dominant colours using k-means clustering, and manage up to 10 custom palettes. Custom palettes automatically generate gradients and work with canvas backgrounds (solid and gradient modes), just like built‑in palettes. Export/import palettes as JSON for easy sharing.
- **Organised colour palettes** – 20+ built‑in palettes organised by category (Neon/Cyber, Warm/Fire, Cool/Ocean, Nature, Soft/Pastel, Dark/Mysterious) with colour preview squares in dropdowns.
- **Theme Designer** – System/light/dark cycling, 11 colourway accents (Sunburst, Neon Grid, Nebula, Ember Glow, Lagoon Tide, Rose Quartz, Battleship, Electric Cyan, Midnight, Deep Indigo, Metallic Gold), and RetroUI Box/Rounded chassis toggle applied across the entire shell. Each theme uses a two-hue color system based on color theory, with complementary secondary hues for enhanced visual depth. Custom backgrounds, shadows, and UI styling for both light and dark modes.
- **Status HUD** – Live palette, sprite mode, blend, motion, density, and FPS read-outs follow you into fullscreen.
- **Instant Loader** – Lightweight inline bootstrapper renders the Pixli spinner before the bundle downloads, then hands off seamlessly to React once the generator is ready.
- **Share & Export** – Unified share and export modal with canvas preview. Share via Web Share API, copy to clipboard, or download directly. High-resolution export with presets for social media, wallpapers, and print. Aspect ratio locking, custom dimensions, and high-quality PNG output with smooth scaling.
- **Tailwind Retro Components** – Buttons, Selects, Switches, Tabs, Cards, Input, Label, and Accordion rebuilt on the Tailwind spacing scale while honouring RetroUI tokens.
- **Modular Architecture** – Clean codebase structure with extracted hooks (`useTheme`, `useFullscreen`, `useSpriteController`), reusable components (`StatusBar`, `Header`, `ControlPanel`), and organized utilities. App.tsx reduced from ~2,800 lines to ~770 lines (72% reduction).
- **Code Quality** – Type-safe codebase with proper error handling, memory management, and cleanup. Debug code gated behind development mode. Comprehensive documentation for all features.
- **Versioning** – Automatic version injection from package.json displayed in the footer.
- **Footer Resources** – Slim footer featuring the Pixli logotype, version number, quick access to RetroUI docs, p5.js, and `jamescutts.me`.

---

## 🗺 Experience map

| Area             | Highlights                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**       | Accent selector, Box/Rounded toggle, and a cycling System → Light → Dark icon button.                                                                                                                                                   |
| **Control Deck** | Tabs for Sprites / Layers / Motion / FX (Motion and FX gain their own column at wide viewports). Sliders cover tile density, scale base/spread, rotation offsets, blend, palette variance, motion intensity, rotation speed, and animation speed. |
| **Sprite Selector** | Icon-buttons for each geometric mode line up beneath the "Generation" heading so you can audition shapes instantly. |
| **Status Bar / HUD** | Palette, sprite mode, blend, motion, density, and FPS badges anchor to the canvas edge alongside Randomise, Presets, Share & Export, and Fullscreen buttons. In fullscreen they float as an auto-hiding HUD. |
| **Share & Export Modal** | Unified modal with canvas preview, quick share (Web Share API), copy to clipboard, and download options. High-resolution export with dimension presets (Social, Wallpapers, Print), custom dimensions, aspect ratio locking, and PNG output. Animation pauses during export for crisp captures. |
| **Custom Palette Manager** | Tabbed interface (Upload/URL/Import) for creating palettes from images. Extract colors, name your palette, export as JSON, and import shared palettes. Manage up to 10 custom palettes with edit, delete, and export options. |
| **Canvas**       | Pixli renders layered motion paths with depth-aware scaling, leaving the status HUD and fullscreen controls within reach. |
| **Footer**       | Pixli wordmark, version number, plus links to p5.js, RetroUI docs, and `jamescutts.me`. |

---

## 🎨 Custom palettes

Pixli includes a powerful custom palette management system that lets you create colour palettes from your own images.

### Creating Custom Palettes

1. **From image upload** – Click the palette management button (📷 icon) next to the palette selector, then use the "Upload" tab to select an image file from your device.
2. **From image URL** – Use the "URL" tab to paste an image URL. Pixli will extract colours from the image.
3. **From JSON Import** – Use the "Import" tab to load a previously exported palette JSON file.

### Features

- **Smart colour extraction** – Uses k-means clustering to extract 5 dominant colours from images
- **Up to 10 Custom Palettes** – Store and manage multiple custom palettes
- **Automatic gradient generation** – Custom palettes automatically generate gradients for sprite fills, just like built‑in palettes
- **Canvas background support** – Use custom palettes for canvas backgrounds in both solid and gradient modes
- **Export & share** – Export any palette as JSON to share with others
- **Import palettes** – Import shared palette JSON files to use others' colour schemes
- **Edit & delete** – Rename or remove custom palettes as needed
- **Category organisation** – Custom palettes appear in a "Custom" category in the palette dropdown
- **Colour previews** – See colour swatches in both the manager and dropdown selectors

### Palette JSON Format

```json
{
  "name": "My Palette",
  "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"]
}
```

---

## 🚀 Quick start

### Prerequisites

- Node.js **18.18+** (Node 20 LTS recommended)
- npm **9+**

### Installation

```bash
# clone the repository
git clone https://github.com/deepdesign/pixli.git
cd pixli

# install dependencies
npm install

# start the development server
npm run dev
```

Open `http://localhost:5173` and start sculpting sprites.

### Production Build

```bash
npm run build
# optional: preview production output
npm run preview
```

The build artifacts land in `/dist` ready for static hosting.

---

## 🛠 Commands

| Command           | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `npm run dev`     | Launch Vite dev server with lightning-fast HMR.                |
| `npm run build`   | Type-checks with `tsc` and emits optimised production bundles. |
| `npm run preview` | Serves the production build locally.                           |

---

## ⚙️ Tech stack

- [React 19](https://react.dev/) for a modern component model
- [Vite 7](https://vitejs.dev/) to power development and production builds
- [TypeScript](https://www.typescriptlang.org/) for confident refactors
- [p5.js](https://p5js.org/) driving the generative engine
- [Tailwind CSS](https://tailwindcss.com/) + [RetroUI](https://www.retroui.dev/) supplying the retro design system

## 🗂 Project structure

```
├── public/
│   ├── pixli-logo-black.svg
│   └── pixli-logo-white.svg
├── src/
│   ├── App.tsx           # Main UI & state wiring
│   ├── generator.ts      # p5.js sprite logic & controller API
│   ├── components/       # Tailwind-first Retro components (Button, Select, Switch, Tabs, Card, Accordion, ExportModal, PresetManager, CustomPaletteManager)
│   ├── components/retroui/ # RetroUI components (Input, Label, Button, Select, Switch, Tabs, etc.)
│   ├── lib/              # Utility modules (responsiveLayout, exportService, customPaletteStorage, imageColorExtractor)
│   ├── data/             # palettes & supporting data
│   └── index.css         # Tailwind import + RetroUI overrides
├── index.html            # Entry HTML + favicon
├── package.json
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository and create a feature branch (`git checkout -b feature/your-idea`).
2. Run `npm run dev` and ensure changes pass `npm run build` before committing.
3. Submit a pull request describing the tweak, referencing any issues.

Bug reports and enhancement ideas are always welcome via [GitHub issues](https://github.com/deepdesign/pixli/issues).

---

## 📜 Licence

All rights reserved. Please contact the maintainers at [deepdesign](https://github.com/deepdesign) for licensing discussions.
