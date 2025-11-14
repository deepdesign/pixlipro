# <picture><source media="(prefers-color-scheme: dark)" srcset="public/bitlab-logo-white.svg"><source media="(prefers-color-scheme: light)" srcset="public/bitlab-logo-black.svg"><img alt="BitLab" src="public/bitlab-logo-black.svg"></picture>

<br />

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/favicon/svg/bitlab-b-logo-white.svg" />
    <source media="(prefers-color-scheme: light)" srcset="public/favicon/svg/bitlab-b-logo-black.svg" />
    <img
      src="public/favicon/svg/bitlab-b-logo-black.svg"
      alt="BitLab modular logomark"
      width="120"
    />
  </picture>
</p>

## 🎨 Generative Pixel Playground

BitLab is a vibrant generative art workbench built with React, p5.js, Tailwind, and RetroUI. Mix pixel iconography, palette theory, and motion envelopes to compose shimmering sprite tapestries in real time.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=20232A" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/p5.js-1.9-DD4444?style=for-the-badge&logo=processingfoundation&logoColor=white" alt="p5.js" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/RetroUI-Custom-ffce02?style=for-the-badge&logo=figma&logoColor=111" alt="RetroUI" />
</p>

<p align="center">
  <img src="public/screengrabs/Screenshot%202025-11-10%20105941.png" width="48%" alt="BitLab Canvas view" />
  <img src="public/screengrabs/Screenshot%202025-11-10%20105947.png" width="48%" alt="BitLab Control panels" />
</p>

<p align="center">
  <em>Dial in palettes, density, motion envelopes, blend modes, and more from a single retro-inspired cockpit.</em>
</p>

---

### 📚 Table of Contents

- [✨ Highlights](#-highlights)
- [🗺 Experience Map](#-experience-map)
- [🚀 Quick Start](#-quick-start)
- [🛠 Commands](#-commands)
- [⚙️ Tech Stack](#️-tech-stack)
- [🗂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

<p align="center">
  <a href="https://bitlab.jamescutts.me/">
    <img
      src="https://img.shields.io/badge/Live%20Demo-bitlab.jamescutts.me-ff4f8b?style=for-the-badge&logo=debian&logoColor=white"
      alt="Live Demo"
    />
  </a>
</p>

---

## ✨ Highlights

- **Generative Sprite Canvas** – Multi-layer p5.js engine with dialed-in controls for density (UI 0–100 ≙ 50–1000%), scale base/spread, palette variance, opacity, and animation tempo.
- **Expanded Sprite Modes** – Tiles, circles, hexagons, rings, diamonds, stars, long neon scanlines, and more—each selectable via icon buttons for instant previews.
- **Motion Lab** – Density-driven layering paired with ten motion envelopes (sway → wavefront) and a master speed dial, now normalised so every mode feels punchy at the same slider value.
- **Rotation System** – Independent rotation offsets (Sprites tab) and spin animation (Motion tab) with per-sprite direction, speed and angle variance.
- **Blend Architectures** – Layer-specific blend modes (multiply, screen, hard light, overlay) with optional per-sprite randomisation.
- **Theme Designer** – System/light/dark cycling, six colourway accents, and RetroUI Box/Rounded chassis toggle applied across the entire shell.
- **Status HUD** – Live palette, sprite mode, blend, motion, density, and FPS read-outs follow you into fullscreen.
- **Instant Loader** – Lightweight inline bootstrapper renders the BitLab spinner before the bundle downloads, then hands off seamlessly to React once the generator is ready.
- **High-Resolution Export** – Export your canvas at any resolution with presets for social media, wallpapers, and print. Aspect ratio locking, custom dimensions, and high-quality PNG output with smooth scaling.
- **Tailwind Retro Components** – Buttons, Selects, Switches, Tabs, Cards, and Accordion rebuilt on the Tailwind spacing scale while honouring RetroUI tokens.
- **Footer Resources** – Slim footer featuring the BitLab logotype, quick access to RetroUI docs, p5.js, and `jamescutts.me`.

---

## 🗺 Experience Map

| Area             | Highlights                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**       | Accent selector, Box/Rounded toggle, and a cycling System → Light → Dark icon button.                                                                                                                                                   |
| **Control Deck** | Tabs for Sprites / Layers / Motion / FX (Motion and FX gain their own column at wide viewports). Sliders cover tile density, scale base/spread, rotation offsets, blend, palette variance, motion intensity, rotation speed, and animation speed. |
| **Sprite Selector** | Icon-buttons for each geometric mode line up beneath the "Generation" heading so you can audition shapes instantly. |
| **Status Bar / HUD** | Palette, sprite mode, blend, motion, density, and FPS badges anchor to the canvas edge alongside Randomise, Presets, Export, and Fullscreen buttons. In fullscreen they float as an auto-hiding HUD. |
| **Export Modal** | High-resolution export with dimension presets (Social, Wallpapers, Print), custom dimensions, aspect ratio locking, and PNG output. Animation pauses during export for crisp captures. |
| **Canvas**       | BitLab renders layered motion paths with depth-aware scaling, leaving the status HUD and fullscreen controls within reach. |
| **Footer**       | BitLab wordmark plus links to p5.js, RetroUI docs, and `jamescutts.me`. |

---

## 🚀 Quick Start

### Prerequisites

- Node.js **18.18+** (Node 20 LTS recommended)
- npm **9+**

### Installation

```bash
# clone the repository
git clone https://github.com/deepdesign/bitlab.git
cd bitlab

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

## ⚙️ Tech Stack

- [React 19](https://react.dev/) for a modern component model
- [Vite 7](https://vitejs.dev/) to power development and production builds
- [TypeScript](https://www.typescriptlang.org/) for confident refactors
- [p5.js](https://p5js.org/) driving the generative engine
- [Tailwind CSS](https://tailwindcss.com/) + [RetroUI](https://www.retroui.dev/) supplying the retro design system

## 🗂 Project Structure

```
├── public/
│   ├── bitlab-logo-black.svg
│   └── bitlab-logo-white.svg
├── src/
│   ├── App.tsx           # Main UI & state wiring
│   ├── generator.ts      # p5.js sprite logic & controller API
│   ├── components/       # Tailwind-first Retro components (Button, Select, Switch, Tabs, Card, Accordion, ExportModal, PresetManager)
│   ├── lib/              # Utility modules (responsiveLayout, exportService)
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

Bug reports and enhancement ideas are always welcome via [GitHub issues](https://github.com/deepdesign/bitlab/issues).

---

## 📜 License

All rights reserved. Please contact the maintainers at [deepdesign](https://github.com/deepdesign) for licensing discussions.
