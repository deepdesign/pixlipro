# Complete Guide: Canvas Background in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding Canvas Background](#understanding-canvas-background)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Operations: Modify Canvas Behavior](#operations-modify-canvas-behavior)
6. [Data Flow & Dependencies](#data-flow--dependencies)
7. [Code Examples](#code-examples)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** is a React + TypeScript web application for creating generative art with animated sprites. It uses:
- **React 19** for UI components
- **TypeScript** for type safety
- **p5.js** for canvas rendering and animation
- **Vite** as the build tool
- **Tailwind CSS** for styling
- **RetroUI** for UI components

### What Is Canvas Background?

The canvas background is the color or gradient that appears behind all sprites. It can be:
- **Solid Color**: Single color from a palette
- **Gradient**: Multi-color gradient from a palette

The canvas background is independent from sprite colors and can use a different palette for visual contrast.

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── components/
│   │   └── ControlPanel/
│   │       └── FxControls.tsx        # Canvas background UI controls
│   │
│   ├── generator.ts                  # Core canvas rendering logic
│   └── App.tsx                       # Main application component
│
├── docs/
│   └── canvas.md                     # This file
│
└── package.json                      # Project dependencies
```

### Key Files for Canvas Background

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/generator.ts` | Canvas background rendering logic | ✅ **YES** - Modify rendering code |
| `src/components/ControlPanel/FxControls.tsx` | UI controls | ❌ Already implemented |
| `src/data/palettes.ts` | Palette definitions (used for backgrounds) | ✅ **YES** - Add palettes |

---

## Understanding Canvas Background

### Background Modes

**Auto Mode:**
- Uses the same palette as sprites
- Automatically updates when sprite palette changes
- Good for cohesive color schemes

**Specific Palette Mode:**
- Uses a specific palette (independent from sprites)
- Allows contrast between sprites and background
- Good for visual separation

### Fill Modes

**Solid Color:**
- Uses the first color from the selected palette
- Applies hue shift and brightness adjustments
- Simple, clean background

**Gradient:**
- Uses up to 3 colors from the selected palette
- Creates a linear gradient across the canvas
- Gradient direction can be adjusted (0-360°)

### Canvas Adjustments

**Hue Shift:**
- Rotates canvas colors around the color wheel (0-360°)
- Independent from sprite hue shift
- Allows fine-tuning canvas color mood

**Brightness:**
- Adjusts canvas brightness (0-100%)
- 0% = darkest, 100% = brightest
- 50% = original brightness

---

## File-by-File Breakdown

### 1. `src/generator.ts` - Canvas Rendering Logic

**Location:** `src/generator.ts`  
**Purpose:** Render canvas background (solid or gradient)

**Background Calculation (Lines ~549-558):**
```typescript
const backgroundPaletteId =
  state.backgroundMode === "auto" ? state.paletteId : state.backgroundMode;
const backgroundPalette = getPalette(backgroundPaletteId);
const backgroundBase = backgroundPalette.colors[0] ?? originalPaletteColors[0];
const backgroundHueShiftDegrees = (state.backgroundHueShift / 100) * 360;
const background = applyHueAndBrightness(
  backgroundBase,
  backgroundHueShiftDegrees,
  state.backgroundBrightness,
);
```

**Canvas Rendering (Lines ~1013-1063):**
```typescript
// Handle canvas background (gradient or solid)
if (currentState.canvasFillMode === "gradient") {
  // Calculate gradient line for full canvas
  const gradientLine = calculateGradientLine(
    currentState.canvasGradientDirection,
    p.width,
    p.height,
  );
  const gradient = ctx.createLinearGradient(
    gradientLine.x0,
    gradientLine.y0,
    gradientLine.x1,
    gradientLine.y1,
  );

  const resolveGradientPaletteId = () => {
    if (currentState.canvasGradientMode === "auto") {
      return resolveBackgroundPaletteId();
    }
    return currentState.canvasGradientMode;
  };
  const gradientPalette = getPalette(resolveGradientPaletteId());
  const gradientSourceColors =
    gradientPalette.colors.length > 0
      ? gradientPalette.colors.slice(0, 3)
      : [prepared.background];
  const gradientColors = gradientSourceColors
    .map((color) => applyCanvasAdjustments(color))
    .filter(Boolean);

  const usableGradientColors =
    gradientColors.length > 1
      ? gradientColors
      : gradientColors.length === 1
      ? [...gradientColors, gradientColors[0]]
      : [prepared.background, prepared.background];

  usableGradientColors.forEach((color, index) => {
    const stop =
      usableGradientColors.length > 1
        ? index / (usableGradientColors.length - 1)
        : 0;
    gradient.addColorStop(stop, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, p.width, p.height);
} else {
  // Solid background
  p.background(prepared.background);
}
```

**Key Points:**
- Solid mode uses p5.js `background()` function
- Gradient mode uses Canvas 2D `createLinearGradient()`
- Gradient uses up to 3 colors from palette
- Both modes apply hue shift and brightness

---

### 2. `src/components/ControlPanel/FxControls.tsx` - UI Controls

**Location:** `src/components/ControlPanel/FxControls.tsx`  
**Purpose:** UI controls for canvas background

**Canvas Selector (Lines ~170-185):**
```typescript
<ControlSelect
  id={isCanvasGradient ? "canvas-gradient" : "background-mode"}
  label="Canvas"
  value={spriteState.backgroundMode}
  onChange={handleCanvasPaletteChange}
  disabled={!ready}
  options={canvasPaletteOptions}
  tooltip={
    isCanvasGradient
      ? "Choose the theme for the canvas gradient background."
      : "Choose the colour applied behind the canvas."
  }
  currentLabel={currentCanvasLabel}
  locked={lockedCanvasPalette}
  onLockToggle={() => onLockCanvasPalette(!lockedCanvasPalette)}
/>
```

**Gradient Toggle (Lines ~186-204):**
```typescript
<div className="control-field">
  <div className="switch-row" style={{ gap: "0.75rem" }}>
    <Switch
      checked={isCanvasGradient}
      onCheckedChange={(checked) =>
        controller?.setCanvasFillMode(checked ? "gradient" : "solid")
      }
      disabled={!ready}
    />
    <div className="field-heading-left">
      <span className="field-label">Use gradients</span>
      <TooltipIcon
        id="canvas-fill-mode-tip"
        text="Enable gradient fills for canvas background instead of solid color."
        label="Use gradients"
      />
    </div>
  </div>
</div>
```

**Hue Shift Slider (Lines ~205-215):**
```typescript
<ControlSlider
  id="background-hue-shift"
  label="Canvas hue shift"
  min={0}
  max={100}
  value={Math.round(spriteState.backgroundHueShift ?? 0)}
  displayValue={`${Math.round(spriteState.backgroundHueShift ?? 0)}%`}
  onChange={(value) => controller?.setBackgroundHueShift(value)}
  disabled={!ready}
  tooltip="Shifts the canvas colors around the color wheel (0-360°)."
/>
```

**Brightness Slider (Lines ~216-226):**
```typescript
<ControlSlider
  id="background-brightness"
  label="Canvas brightness"
  min={0}
  max={100}
  value={Math.round(spriteState.backgroundBrightness ?? 50)}
  displayValue={`${Math.round(spriteState.backgroundBrightness ?? 50)}%`}
  onChange={(value) => controller?.setBackgroundBrightness(value)}
  disabled={!ready}
  tooltip="Adjusts the canvas brightness (0% = darkest, 100% = brightest)."
/>
```

**Key Points:**
- Canvas selector shows "Palette (auto)" option plus all palettes
- Gradient toggle switches between solid and gradient modes
- Hue shift and brightness work for both modes

---

## Operations: Modify Canvas Behavior

### Changing Default Background Mode

**To set a different default background:**

1. Open `src/generator.ts`
2. Find `DEFAULT_STATE` (around line 181):
```typescript
backgroundMode: "auto",  // Change to specific palette ID
```

**Example:**
```typescript
backgroundMode: "neon",  // Always use Neon Pop palette by default
```

---

### Changing Default Brightness

**To set a different default brightness:**

1. Open `src/generator.ts`
2. Find `DEFAULT_STATE` (around line 198):
```typescript
backgroundBrightness: 50,  // Change this value (0-100)
```

**Example:**
```typescript
backgroundBrightness: 30,  // Darker default background
```

---

### Changing Gradient Color Count

**To use more/fewer colors in gradients:**

1. Open `src/generator.ts`
2. Find gradient color selection (around line 1035):
```typescript
const gradientSourceColors =
  gradientPalette.colors.length > 0
    ? gradientPalette.colors.slice(0, 3)  // Change 3 to desired count
    : [prepared.background];
```

**Example:**
```typescript
// Use all palette colors (up to 5):
const gradientSourceColors =
  gradientPalette.colors.length > 0
    ? gradientPalette.colors  // Use all colors
    : [prepared.background];
```

---

## Data Flow & Dependencies

### How Canvas Background Flows Through the System

```
1. User selects canvas palette and mode in UI
   ↓
2. FxControls calls controller methods
   ↓
3. generator.ts updates state.backgroundMode/canvasFillMode/etc.
   ↓
4. computeSprite() calculates background color
   ↓
5. p.draw() renders canvas background (solid or gradient)
   ↓
6. Canvas displays background behind sprites
```

### Dependencies

- **Palette system** → Canvas uses palettes for colors
- **Gradient calculation** → Uses `calculateGradientLine()` utility
- **Color adjustments** → Uses `applyHueAndBrightness()` function

---

## Code Examples

### Example: Custom Gradient Direction

**Goal:** Set gradient to always go diagonal (45°)

**Update Generator (`src/generator.ts`):**
```typescript
// In canvas rendering, replace:
const gradientLine = calculateGradientLine(
  currentState.canvasGradientDirection,
  p.width,
  p.height,
);

// With fixed 45° direction:
const gradientLine = calculateGradientLine(45, p.width, p.height);
```

**Result:** Gradient always goes diagonal, regardless of `canvasGradientDirection` setting.

---

### Example: Darker Default Background

**Goal:** Make default background darker (better for neon sprites)

**Update Generator (`src/generator.ts`):**
```typescript
export const DEFAULT_STATE: GeneratorState = {
  // ... other defaults
  backgroundBrightness: 20,  // Changed from 50 to 20 (darker)
};
```

**Result:** New compositions start with darker backgrounds.

---

## Testing & Verification

### Testing Checklist

After modifying canvas behavior:

- [ ] Canvas selector works (shows all palettes)
- [ ] "Palette (auto)" option works
- [ ] Solid mode displays single color
- [ ] Gradient mode displays gradient
- [ ] Gradient toggle switches modes correctly
- [ ] Hue shift slider works (0-100%)
- [ ] Brightness slider works (0-100%)
- [ ] Canvas updates immediately when settings change
- [ ] Custom palettes work for canvas
- [ ] No console errors
- [ ] TypeScript compilation succeeds

### Visual Testing

1. **Solid Mode Testing:**
   - Select different palettes → Background should change color
   - Adjust hue shift → Background color should rotate
   - Adjust brightness → Background should get darker/lighter

2. **Gradient Mode Testing:**
   - Enable gradients → Background should show gradient
   - Select different palettes → Gradient colors should change
   - Adjust hue shift → Gradient colors should rotate
   - Adjust brightness → Gradient should get darker/lighter

---

## Troubleshooting

### Problem: Canvas background not showing

**Possible Causes:**
1. Background mode not set
2. Palette not found
3. Rendering error

**Solutions:**
1. Check browser console for errors
2. Verify `backgroundMode` is set correctly
3. Verify palette exists in `palettes.ts`
4. Check canvas rendering code

---

### Problem: Gradient not working

**Possible Causes:**
1. Gradient mode not enabled
2. Palette has no colors
3. Gradient calculation error

**Solutions:**
1. Check "Use gradients" toggle is enabled
2. Verify palette has colors
3. Check `calculateGradientLine()` function
4. Verify Canvas 2D context is available

---

## Best Practices

### Canvas Background Guidelines

1. **Contrast**: Use contrasting palette for background vs sprites
2. **Brightness**: Darker backgrounds (20-40%) work well for bright sprites
3. **Gradients**: Use gradients for more visual interest
4. **Auto Mode**: Use "auto" for cohesive color schemes

### Performance Considerations

1. **Solid vs Gradient**: Solid backgrounds are faster to render
2. **Gradient Complexity**: More colors = more computation (but minimal impact)

---

## Summary

The canvas background system provides:
- **Flexible Color Control**: Use any palette for background
- **Solid or Gradient**: Choose between single color or gradient
- **Fine-Tuning**: Adjust hue shift and brightness independently
- **Auto Mode**: Automatically match sprite palette

**Key Files:**
- `src/generator.ts` - Canvas rendering logic
- `src/components/ControlPanel/FxControls.tsx` - UI controls

**Key Features:**
- Solid color mode (single palette color)
- Gradient mode (multi-color gradient)
- Hue shift (0-360° rotation)
- Brightness adjustment (0-100%)

The system automatically handles:
- Palette loading and selection
- Gradient generation from palette colors
- Color adjustments (hue shift, brightness)
- Mode switching (solid ↔ gradient)

