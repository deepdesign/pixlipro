# <picture><source media="(prefers-color-scheme: dark)" srcset="public/bitlab-logo-white.svg"><source media="(prefers-color-scheme: light)" srcset="public/bitlab-logo-black.svg"><img alt="BitLab" src="public/bitlab-logo-black.svg"></picture>

<br />

## 🎨 Generative Pixel Playground

BitLab is a vibrant generative art workbench built with React, p5.js, Tailwind, and RetroUI. Mix pixel iconography, palette theory, and motion envelopes to compose shimmering sprite tapestries in real time.

<p align="center">
  <img src="public/screengrabs/Screenshot%202025-11-10%20105941.png" width="48%" alt="BitLab Canvas view" />
  <img src="public/screengrabs/Screenshot%202025-11-10%20105947.png" width="48%" alt="BitLab Control panels" />
</p>

<p align="center">
  <em>Dial in palettes, sprite density, motion envelopes, blend modes, and more from a single retro-inspired cockpit.</em>
</p>

---

### 📚 Table of Contents

- [✨ Highlights](#-highlights)
- [🗺 Experience Map](#-experience-map)
- [🚀 Quick Start](#-quick-start)
- [🛠 Commands](#-commands)
- [🎨 Sprite Packs](#-sprite-packs)
- [⚙️ Tech Stack](#️-tech-stack)
- [🗂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

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

- **Generative Sprite Canvas** – Multi-layer p5.js engine with dialed-in controls for density (50 → 1,000% under the hood), scale spread, palette variance, opacity, and animation tempo.
- **Expanded Sprite Modes** – Tiles, circles, hexagons, rings, diamonds, neon trails, comet bursts, and a long-form scanline.
- **Motion Lab** – Density-driven layering paired with ten motion envelopes (sway → wavefront) and a master speed dial.
- **Rotation System** – Independent rotation offsets (Sprites tab) and spin animation (Motion tab) with per-sprite direction, speed and angle variance.
- **Blend Architectures** – Layer-specific blend modes (multiply, screen, hard light, overlay) with optional per-sprite randomisation.
- **Theme Designer** – System/light/dark cycling, six colourway accents, and RetroUI Box/Rounded chassis toggle applied across the entire shell.
- **Status Chips** – Live palette, sprite mode, blend, motion, and FPS read-outs for reproducibility.
- **Tailwind Retro Components** – Buttons, Selects, Switches, Tabs, and Cards rebuilt on the Tailwind spacing scale while honouring RetroUI tokens.
- **Footer Resources** – Slim footer featuring the BitLab logotype, quick access to RetroUI docs, p5.js, and `jamescutts.me`.

---

## 🗺 Experience Map

| Area             | Highlights                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**       | Accent selector, Box/Rounded toggle, and a cycling System → Light → Dark icon button.                                                                                                                                                   |
| **Control Deck** | Tabs for Sprites / Layers / Motion (Motion gets a dedicated column at ≥ 1760px). Sliders cover tile density (0–100 UI), scale spread, rotation offsets, blend, palette variance, motion intensity, rotation speed, and animation speed. |
| **Icon Mode**    | A contextual panel appears with preview tile + label, keeping the dropdown and icon asset list within easy reach.                                                                                                                       |
| **Utilities**    | Reset (link variant) alongside a full-width “Save Preset” button, plus Randomise All in each tab footer.                                                                                                                                |
| **Canvas**       | BitLab renders layer stacks with subtle depth, then reports palette, mode, blend, motion, and FPS in pixel-perfect status chips.                                                                                                        |
| **Footer**       | BitLab wordmark plus links to p5.js, RetroUI docs, and `jamescutts.me`.                                                                                                                                                                 |

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

## 🎨 Sprite Packs

Drop additional SVG assets into `public/sprites/`. Vite serves these automatically at `/sprites/<folder>/<filename>.svg`, so pointing the sprite selector at new packs is as simple as adding metadata.

---

## ⚙️ Tech Stack

- [React 19](https://react.dev/) for a modern component model
- [Vite 7](https://vitejs.dev/) to power development and production builds
- [TypeScript](https://www.typescriptlang.org/) for confident refactors
- [p5.js](https://p5js.org/) driving the generative engine
- [Tailwind CSS](https://tailwindcss.com/) + [RetroUI](https://www.retroui.dev/) supplying the retro design system
- Custom SVG packs for the bundled icon sprite library

---

## 🗂 Project Structure

```
├── public/
│   ├── bitlab-logo-black.svg
│   ├── bitlab-logo-white.svg
│   └── sprites/
│       └── sprites-pack/              # Drop-in slot for additional SVG sprite packs
├── src/
│   ├── App.tsx           # Main UI & state wiring
│   ├── generator.ts      # p5.js sprite logic & controller API
│   ├── components/       # Tailwind-first Retro components (Button, Select, Switch, Tabs, Card)
│   ├── data/             # palettes & icon metadata
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
