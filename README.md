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
- **11 Motion Modes** – Drift, pulse, pulse meander, ripple, zigzag, cascade, spiral, comet, linear, isometric, and triangular
- **Independent Animation Timelines** – Sprite hue rotation, palette cycling, and canvas hue rotation operate independently
- **Blend Modes** – Multiply, screen, hard light, overlay, soft light with per-sprite randomization
- **Visual Effects** – Depth of field, bloom, and noise/grain with multiple types including TV scanlines
- **Color Adjustments** – Saturation, brightness, and contrast controls for sprites and canvas

### 🎯 Sprite Collection
- **Geometric Shapes** – Tiles, circles, hexagons, diamonds, stars, scanlines, pixels, and more
- **SVG Sprite Support** – Load custom SVG sprites from collections with boolean operation support (cutouts)
- **Custom Sprite Management** – Create, rename, and delete custom sprite collections; upload or paste SVG code
- **SVG Optimization** – Automatic SVG optimization using SVGO for smaller file sizes
- **Multi-Select Toggle** – Click sprite buttons to toggle selection on/off. Select multiple sprites for random distribution
- **Empty Canvas** – Deselect all sprites to create an empty canvas
- **Automatic Collection Discovery** – Add folders to `public/sprites/` and sprites are automatically discovered and added
- **Random Sprite Mode** – Toggle to randomize sprite shapes across the canvas
- **Instant Preview** – Icon buttons for each sprite mode with live previews
- **Default Collection Pinned** – Default collection always appears first in the collection dropdown

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
- **Outline Mode** – Render sprites as strokes with adjustable width
- **Mixed Outline/Filled** – Randomly mix outlined and filled sprites with separate opacity controls
- **Outline Balance Slider** – Control the percentage of outlined vs filled sprites (0% = all filled, 50% = half/half, 100% = all outlined)

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
├── plans/                 # Feature plans and documentation (see plans/README.md)
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
- **Sprite Selection** – Choose from geometric shapes or SVG sprites (multi-select toggle)
- **Tile Density** – Control how many sprites appear (0–100%)
- **Scale Base** – Set the base size of sprites
- **Scale Spread** – Control size variation
- **Rotation** – Static rotation offsets
- **Rotation Amount** – Maximum rotation angle
- **Outline Mode** – Render sprites as strokes instead of fills
- **Outline Stroke Width** – Adjust stroke width (1–20px)
- **Mixed Outline/Filled** – Randomly mix outlined and filled sprites
- **Filled/Outlined Opacity** – Separate opacity controls when mixed mode is enabled

### Colours Tab
- **Sprite Palette** – Select color palette for sprites
- **Canvas Palette** – Select color palette for background
- **Palette Variance** – Adjust color variation
- **Color Adjustments** – Saturation, brightness, and contrast controls
- **Hue Shift** – Adjust overall color hue
- **Blend Mode** – Choose blend mode (with auto-randomization option)
- **Layer Opacity** – Control overall opacity
- **Canvas Background** – Solid colors or gradients with independent controls

### Motion Tab
- **Movement Mode** – Select from 11 motion types (including Pulse Meander mode)
- **Motion Intensity** – Master speed control
- **Rotation Animation** – Animated sprite rotation
- **Hue Rotation** – Rotate sprite colors through color wheel
- **Palette Cycling** – Smoothly cycle through palettes automatically
- **Canvas Hue Rotation** – Animate background colors

### FX Tab
- **Depth of Field** – Blur effects based on sprite distance from focus point
- **Bloom** – Bright glowing effect for bright areas
- **Noise & Grain** – Film grain, CRT, Bayer, static noise, or TV scanlines overlay

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

## 📝 Changelog

### v0.3.11 Beta (Latest)

**New Features:**
- Added halftone effect filter with adjustable dot size (1-64px), spacing, and shape options (circle, square, diamond)
- Halftone effect preserves original colors instead of converting to black and white

**Improvements:**
- Increased halftone dot size maximum from 20px to 64px
- Fixed halftone shape rotation - squares and diamonds now display correctly without unwanted rotation

**Removed:**
- Removed crosshatch filter (replaced by improved halftone effect)

### v0.3.10 Beta

**New Features:**
- Added halftone effect filter (initial implementation)

### v0.3.9 Beta

**New Features:**
- Added default sprite collections to Sprites page with lock icons (read-only)
- Default collections now visible alongside custom collections for browsing all available sprites

**Improvements:**
- Fixed SVG frame removal for imported/pasted SVG code - frames are now automatically removed
- Fixed modal styling - consistent background colors, borders, and backdrop overlay
- Fixed theme colors for sprite previews - default collections now use theme-aware colors (tint50 in dark mode, textPrimary in light mode)
- Fixed custom collections being incorrectly identified as file-based collections
- Improved SVG processing pipeline for both custom and default collections

### v0.3.8 Beta

**Improvements:**
- Enhanced SVG optimization and frame removal for imported sprites
- Improved modal UI consistency

### v0.3.7 Beta

**Improvements:**
- Fixed lock icon buttons in control panel to use link-icon-destructive variant with correct styling
- Reduced lock icon size from 24px to 16px to match standard icon button sizes
- Fixed palette icon color in selected state in main vertical navigation (all SVG elements now use correct color)
- Updated circle buttons to only contain icons, defaulting to X icon
- Improved SVG color inheritance for all icon buttons in selected state

### v0.3.6 Beta

**Improvements:**
- Removed accessibility focus highlighting (focus rings/halos) from all UI components
- Organized documentation: moved stray .md files to docs/, created audits/ and migration-history/ subdirectories
- Removed empty component folders (Onboarding, retroui)

### v0.3.5 Beta

**Improvements:**
- Organized plan files into `plans/` directory with proper naming conventions
- Cleaned up temporary worktree files and stray files from root directory
- Updated project documentation structure

### v0.3.4 Beta

**Improvements:**
- Fixed projector mode connection issues - projector window now properly syncs with main canvas
- Improved BroadcastChannel communication reliability between main window and projector window
- Added window.postMessage fallback for cross-window communication
- Code cleanup: removed excessive debug logging and simplified projector mode implementation
- Improved error handling and retry logic for projector mode initialization

### v0.3.3 Beta

**New Features:**
- Added pixelation effect with adjustable block size (1-50px)
- Added colour quantization effect with adjustable bit depth (4-bit, 8-bit, 16-bit, 24-bit)
- Added lines ratio slider to control ratio of line sprites to other sprites (0-100%, where 100% = 10x more lines)
- Line sprites are now twice as long (20x width instead of 10x)

**Improvements:**
- Separated pixelation and colour quantization into independent FX sections
- Lines ratio slider only appears when line sprite is selected
- Updated palette colours: Ember Glow and Molten Core are now more distinct
- Removed "Snow White" and "Black Panther" palettes and "Black & White" category
- Hidden blinking cursor across app while preserving copy/paste functionality
- Standardized heading positions and gaps across all settings screens
- Improved sprite performance when switching collections and selecting sprites

### v0.3.2 Beta

**Improvements:**
- Fixed footer positioning to stick to bottom of viewport in settings page
- Added top margin above footer to prevent cards from touching it
- Removed transition animations that caused lag during window resizing

### v0.3.1 Beta

**New Features:**
- Added Canvas adjustment sliders (Hue, Saturation, Brightness, Contrast) matching Palette section controls
- Created "Black & White" category for Black Panther and Snow White palettes

**Improvements:**
- Fixed background color bug for monochrome palettes (Black Panther, Snow White) - background now correctly uses palette colors
- Fixed sprite icon button sizing to 16px (was incorrectly 20px)
- Fixed animation thumbnail generation with proper primary/secondary sprite control
- Improved animation calculations for zigzag, cascade, drift, and ripple modes
- Added lazy loading for animation thumbnails to improve performance
- Updated animation card UI with lock icons and waveform information

### v1.3.0

**New Features:**
- Added Animation page to navigation
- Added TV Scanlines as a noise/grain type option
- Added panel headings (Shape, Colour, Motion, FX) for better organization
- Improved palette cycling with smooth transitions (no more jumps)

**Improvements:**
- Fixed color adjustments (Saturation, Brightness, Contrast) for sprites and canvas
- Enhanced canvas background controls with independent color adjustments
- Improved UI hierarchy with panel and section headings

**Removed:**
- Motion Blur effect
- Chromatic Aberration effect
- Distortion effect
- Glow effect
- Trails & Echoes effect
- Animated noise toggle (noise is now always animated)

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
