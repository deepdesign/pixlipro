# ![ArtLab](public/artlab-logo-black.svg)

## Generative Pixel Playground

ArtLab is a generative art workbench built with React, p5.js, Tailwind, and RetroUI. Mix pixel iconography, palette theory, and motion envelopes to create richly layered sprite compositions in real time. ArtLab ships with theme cycling, palette randomisation, blend-mode experiments, and a curated icon library sourced from [pixelarticons](https://github.com/halfmage/pixelarticons).

---

### Table of Contents
- [Features](#features)
- [Experience Overview](#experience-overview)
- [Getting Started](#getting-started)
- [Available Commands](#available-commands)
- [Keyboard & UI Shortcuts](#keyboard--ui-shortcuts)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Generative Sprite Canvas** – Multi-layer sprite engine with p5.js, configurable density, scale, and motion profiles.
- **Icon Modes** – Quick access to curated pixel shapes (circle, square, triangle, hexagon) or a full icon selector fed from `pixelarticons`.
- **Blend Architectures** – Layer-specific blend modes (multiply, screen, hard light, overlay) with optional per-sprite randomisation.
- **Theme Designer** – One-click cycling between system/light/dark plus dropdowns for colour accent and corner shape.
- **Palette Lab** – Synthwave, neon, pastel and bespoke palettes with jitter controls to push hue, saturation, and luminance.
- **Session Metrics** – Live seed, palette, motif, blend mode, and FPS readouts for reproducibility.
- **Responsive RetroUI** – RetroUI components reskinned with Tailwind-driven theming for both desktop and tablet layouts.

---

## Experience Overview

| Area | Highlights |
| ---- | ---------- |
| **Header** | Animated ArtLab logomark and a cycling theme toggle (system → light → dark) alongside a GitHub star button. |
| **Controls Panel** | Split into sprite controls and FX tooling. Sliders adjust density, scale spread, palette variance, motion intensity, and layer opacity. |
| **Icon Selection** | When in **Icon** mode, a dropdown reveals the entire pixel icon catalogue with preview thumbnail. |
| **Utilities** | One-click randomisers for icons, palettes, scale, motion, blend, plus a full reset and “randomise all” macro. |
| **Theme Styling** | Toggle groups customise colourway (Amber, Mint, Violet) and chassis shape (Box or Rounded). |
| **Canvas** | p5.js renders layered sprites, with status chips reporting live seed, palette, motif, blend mode, and FPS. |
| **Session Notes** | Quick tips with links to pixelarticons, p5.js, and RetroUI docs for deeper exploration. |

---

## Getting Started

### Prerequisites
- Node.js **18.18+** (Node 20 LTS recommended)
- npm **9+**

### Installation
```bash
# clone the repository
git clone https://github.com/deepdesign/artlab.git
cd artlab

# install dependencies
npm install

# start the development server
npm run dev
```
Visit `http://localhost:5173` to explore the canvas.

### Production Build
```bash
npm run build
# optional: preview production output
npm run preview
```
The build artifacts land in `/dist` and are ready for static hosting.

---

## Available Commands
| Command | Description |
| ------- | ----------- |
| `npm run dev` | Launch Vite dev server with fast HMR. |
| `npm run build` | Type-check with `tsc` and emit optimised assets. |
| `npm run preview` | Serve the production build locally. |

---

## Keyboard & UI Shortcuts
- **Theme cycle** – Click the icon button in the header to iterate system → light → dark.
- **Randomise all** – Triggers new seed, palette, blend, and motion envelope with one click.
- **Icon shuffle** – “Icon” randomiser respects current sprite mode (pixel glass vs icon).

---

## Tech Stack
- [React 19](https://react.dev/) with functional components & hooks
- [Vite 7](https://vitejs.dev/) for lightning-fast dev & build tooling
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [p5.js](https://p5js.org/) powering the generative engine
- [pixel-retroui](https://www.npmjs.com/package/pixel-retroui) + [Tailwind CSS](https://tailwindcss.com/) for retro-flavoured UI components
- [pixelarticons](https://github.com/halfmage/pixelarticons) as the icon catalogue

---

## Project Structure
```
├── public/
│   ├── artlab-logo-black.svg
│   └── artlab-logo-white.svg
├── src/
│   ├── App.tsx           # Main UI & state wiring
│   ├── generator.ts      # p5.js sprite logic & controller API
│   ├── data/             # palettes & icon metadata
│   └── style.css         # Tailwind + RetroUI overrides
├── index.html            # Entry HTML + favicon
├── package.json
└── README.md
```

---

## Contributing
1. Fork the repository and create a feature branch (`git checkout -b feature/your-idea`).
2. Run `npm run dev` and ensure changes pass `npm run build` before committing.
3. Submit a pull request describing the tweak, referencing any issues.

Bug reports and enhancement ideas are always welcome via [GitHub issues](https://github.com/deepdesign/artlab/issues).

---

## License
All rights reserved. Please contact the maintainers at [deepdesign](https://github.com/deepdesign) for licensing discussions.
