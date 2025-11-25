# <picture><source media="(prefers-color-scheme: dark)" srcset="public/logo/SVG/pixli-logo-white.svg"><source media="(prefers-color-scheme: light)" srcset="public/logo/SVG/pixli-logo-black.svg"><img alt="Pixli: generative art toy" src="public/logo/SVG/pixli-logo-black.svg"></picture>

<br />

<p align="center">
  <strong>Professional generative art tool for projectors, VFX, and live events</strong>
</p>

## 🎨 Pixli Pro

Pixli Pro is a professional-grade generative art application built for nightclub projectionists, visual designers, and live event professionals. Built with React, p5.js, Tailwind CSS, and Catalyst UI components, Pixli Pro combines powerful sprite generation, color palettes, blend modes, and motion envelopes to create stunning real-time visual canvases optimized for projection displays.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=20232A" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/p5.js-2.0-DD4444?style=for-the-badge&logo=processingfoundation&logoColor=white" alt="p5.js" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Catalyst-UI-FF6B6B?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Catalyst UI" />
</p>

---

## ✨ Key Features

### 🎬 Professional Projection Support
- **16:9 Aspect Ratio** – Default canvas optimized for standard projector displays (1920×1080)
- **Multiple Aspect Ratios** – Support for 16:9, 21:9, 16:10, and custom configurations
- **Full-Screen HUD** – Auto-hiding status bar with live metrics in fullscreen mode
- **High-Resolution Export** – Export at any resolution with presets for social media, wallpapers, and print

### 🎨 Advanced Generative Engine
- **Multi-Layer Sprite System** – Density-driven layering with up to 3 layers
- **10 Motion Modes** – Drift, pulse, ripple, zigzag, cascade, spiral, comet, linear, isometric, and triangular
- **Independent Animation Timelines** – Sprite hue rotation, palette cycling, and canvas hue rotation operate independently
- **Blend Modes** – Multiply, screen, hard light, overlay, soft light with per-sprite randomization
- **Depth of Field** – Optional blur effects for depth perception

### 🎯 Sprite Collection
- **Geometric Shapes** – Tiles, circles, hexagons, rings, diamonds, stars, scanlines, pixels, and more
- **SVG Sprite Support** – Load custom SVG sprites from collections
- **Random Sprite Mode** – Toggle to randomize sprite shapes across the canvas
- **Instant Preview** – Icon buttons for each sprite mode with live previews

### 🎨 Color & Palette System
- **20+ Built-in Palettes** – Organized by category (Neon/Cyber, Warm/Fire, Cool/Ocean, Nature, Soft/Pastel, Dark/Mysterious)
- **Custom Palette Manager** – Create palettes from images (upload or URL) using k-means clustering
- **Palette Export/Import** – Share palettes as JSON files
- **Palette Variance** – Adjustable color variation for dynamic effects
- **Automatic Gradients** – Custom palettes generate gradients automatically

### 🎛 Professional Controls
- **Density Control** – Fine-tuned density slider (0–100% UI maps to 50–1800% internal)
- **Scale System** – Base scale and spread controls for sprite sizing
- **Rotation** – Independent rotation offsets and animated spin with per-sprite variance
- **Motion Intensity** – Master speed dial normalized across all motion modes
- **Layer Opacity** – Per-layer opacity control

### 🎨 Theme System
- **11 Colorway Accents** – Sunburst, Neon Grid, Nebula, Ember Glow, Lagoon Tide, Rose Quartz, Battleship, Electric Cyan, Lime Zest, Deep Indigo, Metallic Gold
- **Light/Dark Modes** – System, light, and dark theme support
- **Dynamic Theming** – Theme colors applied across all UI components
- **Consistent Design** – Catalyst UI components with custom styling

### 📊 Status & Monitoring
- **Live Status HUD** – Real-time display of palette, sprite mode, blend mode, motion mode, density, and FPS
- **Fullscreen Mode** – Auto-hiding HUD that appears on hover
- **Performance Monitoring** – FPS counter and performance metrics

### 💾 Preset Management
- **Save & Load Presets** – Store unlimited presets in localStorage
- **Preset Export/Import** – Share presets as JSON files
- **Quick Randomize** – One-click randomization of all parameters

### 📤 Export & Share
- **High-Resolution Export** – Export at any custom dimensions
- **Aspect Ratio Locking** – Maintain aspect ratio when resizing
- **Export Presets** – Quick presets for social media, wallpapers, and print
- **Web Share API** – Native sharing on supported devices
- **Copy to Clipboard** – Quick copy for social media

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.18+ (Node 20 LTS recommended)
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/deepdesign/pixlipro.git
cd pixlipro

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5174` (default port).

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build artifacts will be in the `/dist` directory, ready for static hosting.

---

## 🛠 Available Commands

| Command           | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `npm run dev`     | Launch Vite dev server with HMR on port 5174                  |
| `npm run build`   | Type-check with TypeScript and build optimized production bundles |
| `npm run preview` | Serve the production build locally                            |
| `npm run generate:collections` | Generate sprite collection metadata |

---

## ⚙️ Tech Stack

- **[React 19](https://react.dev/)** – Modern component architecture with hooks
- **[Vite 7](https://vitejs.dev/)** – Lightning-fast build tool and dev server
- **[TypeScript 5.9](https://www.typescriptlang.org/)** – Type-safe development
- **[p5.js 2.0](https://p5js.org/)** – Generative graphics engine
- **[Tailwind CSS 4.1](https://tailwindcss.com/)** – Utility-first CSS framework
- **[Catalyst UI](https://catalyst.tailwindui.com/)** – Professional UI component library
- **[Radix UI](https://www.radix-ui.com/)** – Accessible component primitives
- **[Lucide React](https://lucide.dev/)** – Beautiful icon library

---

## 🗂 Project Structure

```
pixlipro/
├── public/
│   └── logo/              # Pixli logo assets
├── src/
│   ├── App.tsx            # Main application component
│   ├── generator.ts       # p5.js sprite engine & controller
│   ├── components/
│   │   ├── catalyst/      # Catalyst UI components
│   │   ├── layout/        # Layout components (AppLayout, AppSidebar, Header)
│   │   ├── ControlPanel/  # Control panel components
│   │   ├── StatusBar/     # Status bar component
│   │   └── ...            # Other components
│   ├── constants/         # Constants and type definitions
│   ├── data/              # Palettes, gradients, sprite collections
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components (Help, Settings)
│   ├── types/             # TypeScript type definitions
│   └── index.css          # Global styles and Tailwind imports
├── plans/                 # Feature plans and documentation
├── docs/                  # Technical documentation
├── package.json
└── README.md
```

---

## 🎯 Use Cases

### Nightclub Projection
- Create dynamic visual backgrounds for DJ sets
- Sync with music using motion intensity controls
- Export high-resolution content for projection mapping
- Fullscreen mode for live performances

### Visual Effects
- Generate abstract backgrounds for video production
- Create texture overlays with blend modes
- Export sequences for post-production
- Custom aspect ratios for various display formats

### Live Events
- Real-time visual generation during events
- Preset management for quick scene changes
- High-resolution export for LED walls
- Mobile-friendly interface for remote control

### Art & Design
- Explore color palettes and compositions
- Generate unique patterns and textures
- Export artwork for print or digital use
- Custom sprite collections for branding

---

## 🎨 Custom Palettes

Pixli Pro includes a powerful custom palette management system:

### Creating Palettes

1. **From Image Upload** – Upload an image file and extract dominant colors
2. **From Image URL** – Paste an image URL to extract colors remotely
3. **From JSON Import** – Import previously exported palette files

### Features

- **Smart Color Extraction** – Uses k-means clustering to extract 5 dominant colors
- **Up to 10 Custom Palettes** – Store and manage multiple palettes
- **Automatic Gradients** – Custom palettes generate gradients automatically
- **Export & Share** – Export palettes as JSON to share with others
- **Canvas Background Support** – Use custom palettes for backgrounds

---

## 🎛 Controls Overview

### Sprites Tab
- **Sprite Selection** – Choose from geometric shapes or SVG sprites
- **Tile Density** – Control how many sprites appear (0–100%)
- **Scale Base** – Set the base size of sprites
- **Scale Spread** – Control size variation
- **Rotation** – Static rotation offsets
- **Rotation Amount** – Maximum rotation angle

### Colours Tab
- **Sprite Palette** – Select color palette for sprites
- **Canvas Palette** – Select color palette for background
- **Palette Variance** – Adjust color variation
- **Blend Mode** – Choose blend mode (with auto-randomization option)
- **Layer Opacity** – Control overall opacity

### Motion Tab
- **Movement Mode** – Select from 10 motion types
- **Motion Intensity** – Master speed control
- **Rotation Animation** – Animated sprite rotation
- **Hue Rotation** – Rotate sprite colors through color wheel
- **Palette Cycling** – Cycle through palettes automatically
- **Canvas Hue Rotation** – Animate background colors

---

## 🎨 Aspect Ratios

Pixli Pro supports multiple aspect ratios optimized for different display types:

- **16:9 (Widescreen)** – Standard for most projectors and displays (default)
- **21:9 (Ultra-Wide)** – Immersive displays and edge-blended setups
- **16:10 (WUXGA)** – Professional projectors with more vertical space
- **Custom** – Define your own aspect ratio for unique setups

---

## 📱 Responsive Design

- **Desktop Layout** – Sidebar with controls, main canvas area
- **Mobile Layout** – Stacked layout with controls above canvas
- **Touch Optimized** – 44×44px minimum touch targets
- **Fullscreen Mode** – Optimized for projection displays

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure `npm run build` passes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing component patterns
- Maintain accessibility standards
- Test on multiple browsers
- Update documentation as needed

---

## 📜 License

All rights reserved. Please contact [deepdesign](https://github.com/deepdesign) for licensing discussions.

---

## 🔗 Links

- **Repository**: [https://github.com/deepdesign/pixlipro](https://github.com/deepdesign/pixlipro)
- **Issues**: [https://github.com/deepdesign/pixlipro/issues](https://github.com/deepdesign/pixlipro/issues)

---

## 🙏 Acknowledgments

- Built with [p5.js](https://p5js.org/) for generative graphics
- UI components from [Catalyst UI](https://catalyst.tailwindui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Vite](https://vitejs.dev/) and [React](https://react.dev/)

---

<p align="center">
  <strong>Made with ❤️ for the creative community</strong>
</p>
