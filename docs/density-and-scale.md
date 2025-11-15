# Complete Guide: Density & Scale in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding Density & Scale](#understanding-density--scale)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Operations: Modify Density & Scale Behavior](#operations-modify-density--scale-behavior)
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

### What Are Density & Scale?

**Density** controls how many sprites appear on the canvas. Higher density means more sprites, creating a busier, more complex composition.

**Scale** controls the size of sprites:
- **Scale Base**: The baseline size before any variation is applied
- **Scale Range**: The spread between smallest and largest sprites

Together, these controls determine the visual density and size distribution of sprites across the canvas.

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── lib/
│   │   └── utils/
│   │       └── conversions.ts      # ⭐ Conversion utilities (UI ↔ Internal)
│   │
│   ├── components/
│   │   └── ControlPanel/
│   │       └── SpriteControls.tsx  # UI controls for density & scale
│   │
│   ├── generator.ts                # Core density & scale calculation logic
│   └── App.tsx                     # Main application component
│
├── docs/
│   └── density-and-scale.md        # This file
│
└── package.json                    # Project dependencies
```

### Key Files for Density & Scale

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/generator.ts` | Core density & scale calculation logic | ✅ **YES** - Modify calculation formulas |
| `src/lib/utils/conversions.ts` | UI value ↔ Internal value conversions | ✅ **YES** - Adjust conversion ranges |
| `src/components/ControlPanel/SpriteControls.tsx` | UI sliders for density & scale | ❌ Uses conversion utilities |
| `src/types/generator.ts` | TypeScript types for state | ❌ Already defined |

---

## Understanding Density & Scale

### Density System

**UI Range:** 0-100% (displayed to user)  
**Internal Range:** 50-1000% (used in calculations)

**How It Works:**
1. User adjusts "Tile Density" slider (0-100%)
2. Value is converted to internal range (50-1000%)
3. Internal value determines how many tiles spawn per layer
4. Higher values = more tiles = busier canvas

**Layer System:**
- **Layer 0**: Always visible (threshold: 0)
- **Layer 1**: Appears when density ≥ 38%
- **Layer 2**: Appears when density ≥ 70%

Each layer can have up to 60 tiles, with density determining how many actually spawn.

### Scale System

**Scale Base:**
- **UI Range:** 0-100%
- **Internal Range:** 0.12 - 5.5 (relative to canvas size)
- Controls the baseline size of all sprites

**Scale Range:**
- **UI Range:** 0-100%
- **Internal Range:** 0-1 (multiplier for spread)
- Controls the difference between smallest and largest sprites
- 0% = all sprites same size (no variation)
- 100% = maximum size variation

**How It Works:**
1. Base scale is calculated from Scale Base slider
2. Spread is calculated from Scale Range slider
3. Each sprite gets a random scale within: `baseScale ± spread`
4. Final scale is clamped between MIN_TILE_SCALE (0.12) and MAX_TILE_SCALE (5.5)

---

## File-by-File Breakdown

### 1. `src/lib/utils/conversions.ts` - Conversion Utilities

**Location:** `src/lib/utils/conversions.ts`  
**Purpose:** Convert between UI slider values and internal calculation values

**What's in this file:**
```typescript
// Density conversion
const DENSITY_MIN = 50;
const DENSITY_MAX = 1000;

export const densityToUi = (value: number): number => {
  const bounded = clampValue(value, DENSITY_MIN, DENSITY_MAX);
  return Math.round(
    ((bounded - DENSITY_MIN) / (DENSITY_MAX - DENSITY_MIN)) * 100,
  );
};

export const uiToDensity = (value: number): number => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    DENSITY_MIN + (bounded / 100) * (DENSITY_MAX - DENSITY_MIN),
  );
};
```

**Key Points:**
- `densityToUi`: Converts internal value (50-1000) to UI value (0-100)
- `uiToDensity`: Converts UI value (0-100) to internal value (50-1000)
- Values are clamped to prevent out-of-range errors
- Rounding ensures clean integer values

---

### 2. `src/generator.ts` - Core Calculation Logic

**Location:** `src/generator.ts`  
**Purpose:** Calculate sprite density and scale values

**Key Constants:**
```typescript
const MIN_TILE_SCALE = 0.12;      // Minimum sprite size
const MAX_TILE_SCALE = 5.5;       // Maximum sprite size
const MAX_DENSITY_PERCENT_UI = 1000;  // Maximum internal density value
```

**Density Calculation (Lines ~560-601):**
```typescript
const densityRatio = clamp(state.scalePercent / MAX_DENSITY_PERCENT_UI, 0, 1);
const layerThresholds = [0, 0.38, 0.7];  // When each layer appears

for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
  const threshold = layerThresholds[layerIndex] ?? 0.85;
  if (layerIndex > 0 && densityRatio < threshold) {
    continue;  // Skip layer if density too low
  }

  const normalizedDensity =
    layerIndex === 0
      ? densityRatio
      : clamp((densityRatio - threshold) / (1 - threshold), 0, 1);

  const maxTiles = 60;
  const minTiles = layerIndex === 0 ? 1 : 0;
  const desiredTiles = 1 + normalizedDensity * (maxTiles - 1);
  const tileTotal = Math.max(minTiles, Math.round(desiredTiles));
  
  // ... create tiles
}
```

**Scale Calculation (Lines ~560-657):**
```typescript
const baseScaleValue = clamp(state.scaleBase / 100, 0, 1);
const spreadValue = clamp(state.scaleSpread / 100, 0, 1);

const baseScale = lerp(MIN_TILE_SCALE, MAX_TILE_SCALE, baseScaleValue);
const minScaleFactor = lerp(baseScale, MIN_TILE_SCALE, spreadValue);
const maxScaleFactor = lerp(baseScale, MAX_TILE_SCALE, spreadValue);

// For each tile:
const scaleRange = Math.max(0, maxScaleFactor - minScaleFactor);
const scale =
  scaleRange < 1e-6
    ? baseScale
    : clamp(
        minScaleFactor + positionRng() * scaleRange,
        MIN_TILE_SCALE,
        MAX_TILE_SCALE,
      );
```

**Key Points:**
- Density determines tile count per layer (1-60 tiles)
- Scale is calculated per-tile using random distribution
- Layers appear progressively as density increases
- Scale is clamped to prevent too-small or too-large sprites

---

### 3. `src/components/ControlPanel/SpriteControls.tsx` - UI Controls

**Location:** `src/components/ControlPanel/SpriteControls.tsx`  
**Purpose:** UI sliders for density and scale controls

**Density Slider (Lines ~158-168):**
```typescript
<ControlSlider
  id="density-range"
  label="Tile Density"
  min={0}
  max={100}
  value={densityValueUi}
  displayValue={`${densityValueUi}%`}
  onChange={(value) => controller?.setScalePercent(uiToDensity(value))}
  disabled={!ready}
  tooltip="Controls how many tiles spawn per layer; higher values create a busier canvas."
/>
```

**Scale Base Slider (Lines ~169-179):**
```typescript
<ControlSlider
  id="scale-base"
  label="Scale Base"
  min={0}
  max={100}
  value={Math.round(spriteState.scaleBase)}
  displayValue={`${Math.round(spriteState.scaleBase)}%`}
  onChange={(value) => controller?.setScaleBase(value)}
  disabled={!ready}
  tooltip="Sets the baseline sprite size before any random spread is applied."
/>
```

**Scale Range Slider (Lines ~180-190):**
```typescript
<ControlSlider
  id="scale-range"
  label="Scale Range"
  min={0}
  max={100}
  value={Math.round(spriteState.scaleSpread)}
  displayValue={`${Math.round(spriteState.scaleSpread)}%`}
  onChange={(value) => controller?.setScaleSpread(value)}
  disabled={!ready}
  tooltip="Expands or tightens the difference between the smallest and largest sprites."
/>
```

**Key Points:**
- All sliders use 0-100% range for user-friendly values
- Density uses conversion utilities to map to internal range
- Scale Base and Scale Range use direct percentage values
- Tooltips explain what each control does

---

## Operations: Modify Density & Scale Behavior

### Changing Density Range

**To adjust the minimum/maximum density:**

1. Open `src/lib/utils/conversions.ts`
2. Modify the constants:
```typescript
const DENSITY_MIN = 50;   // Change minimum (default: 50)
const DENSITY_MAX = 1000; // Change maximum (default: 1000)
```

3. Update `MAX_DENSITY_PERCENT_UI` in `src/generator.ts` to match:
```typescript
const MAX_DENSITY_PERCENT_UI = 1000;  // Must match DENSITY_MAX
```

**Effects:**
- Lower `DENSITY_MIN`: Fewer sprites at minimum slider position
- Higher `DENSITY_MAX`: More sprites at maximum slider position

---

### Changing Scale Range

**To adjust the minimum/maximum sprite size:**

1. Open `src/generator.ts`
2. Modify the constants:
```typescript
const MIN_TILE_SCALE = 0.12;  // Minimum sprite size (default: 0.12)
const MAX_TILE_SCALE = 5.5;    // Maximum sprite size (default: 5.5)
```

**Effects:**
- Lower `MIN_TILE_SCALE`: Smaller minimum sprite size
- Higher `MAX_TILE_SCALE`: Larger maximum sprite size

**Note:** These values are relative to canvas size. A value of 1.0 means the sprite is the same size as the canvas.

---

### Changing Layer Thresholds

**To adjust when layers appear:**

1. Open `src/generator.ts`
2. Find the `layerThresholds` array (around line 582):
```typescript
const layerThresholds = [0, 0.38, 0.7];  // Density thresholds for layers
```

3. Modify the values:
```typescript
const layerThresholds = [0, 0.3, 0.6];  // Layers appear earlier
// or
const layerThresholds = [0, 0.5, 0.8];  // Layers appear later
```

**Effects:**
- Lower thresholds: Layers appear at lower density values
- Higher thresholds: Layers appear at higher density values

---

### Changing Maximum Tiles Per Layer

**To adjust how many tiles can spawn per layer:**

1. Open `src/generator.ts`
2. Find the `maxTiles` constant (around line 598):
```typescript
const maxTiles = 60;  // Maximum tiles per layer
```

3. Modify the value:
```typescript
const maxTiles = 100;  // More tiles per layer
```

**Effects:**
- Higher values: More tiles can spawn (requires higher density to see them all)
- Lower values: Fewer tiles maximum (easier to reach maximum)

---

## Data Flow & Dependencies

### How Density & Scale Flow Through the System

```
1. User adjusts slider in UI
   ↓
2. SpriteControls calls controller.setScalePercent/setScaleBase/setScaleSpread
   ↓
3. generator.ts updates state.scalePercent/scaleBase/scaleSpread
   ↓
4. computeSprite() calculates densityRatio and scale values
   ↓
5. Density determines tile count per layer
   ↓
6. Scale determines size of each tile
   ↓
7. p.draw() renders tiles with calculated positions and sizes
   ↓
8. Canvas displays sprites with new density and scale
```

### Dependencies

- **Conversion utilities** → Used by UI to convert between display and internal values
- **Generator state** → Stores current density and scale values
- **Random number generator** → Used to assign random scales to tiles
- **Layer system** → Density determines which layers are visible

---

## Code Examples

### Example: Custom Density Range

**Goal:** Allow density from 0-2000% (double the current maximum)

**1. Update Conversion Utilities (`src/lib/utils/conversions.ts`):**
```typescript
const DENSITY_MIN = 50;
const DENSITY_MAX = 2000;  // Changed from 1000

export const densityToUi = (value: number): number => {
  const bounded = clampValue(value, DENSITY_MIN, DENSITY_MAX);
  return Math.round(
    ((bounded - DENSITY_MIN) / (DENSITY_MAX - DENSITY_MIN)) * 100,
  );
};

export const uiToDensity = (value: number): number => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    DENSITY_MIN + (bounded / 100) * (DENSITY_MAX - DENSITY_MIN),
  );
};
```

**2. Update Generator Constant (`src/generator.ts`):**
```typescript
const MAX_DENSITY_PERCENT_UI = 2000;  // Changed from 1000
```

**Result:** Slider still shows 0-100%, but maps to 50-2000% internally, allowing twice as many sprites at maximum.

---

### Example: Uniform Sprite Sizes

**Goal:** Make all sprites the same size (no variation)

**Solution:** Set Scale Range slider to 0%

**How it works:**
- When `scaleSpread` is 0, `spreadValue` becomes 0
- `minScaleFactor` and `maxScaleFactor` both equal `baseScale`
- All tiles get the same scale value

**Code path:**
```typescript
const spreadValue = clamp(0 / 100, 0, 1);  // = 0
const minScaleFactor = lerp(baseScale, MIN_TILE_SCALE, 0);  // = baseScale
const maxScaleFactor = lerp(baseScale, MAX_TILE_SCALE, 0);  // = baseScale
const scaleRange = Math.max(0, baseScale - baseScale);  // = 0
const scale = baseScale;  // All tiles same size
```

---

### Example: Custom Layer Thresholds

**Goal:** Make layers appear at 25%, 50%, 75% density

**Update Generator (`src/generator.ts`):**
```typescript
const layerThresholds = [0, 0.25, 0.5, 0.75];  // Custom thresholds
const layerCount = 4;  // Add one more layer
```

**Result:**
- Layer 0: Always visible (0% threshold)
- Layer 1: Appears at 25% density
- Layer 2: Appears at 50% density
- Layer 3: Appears at 75% density

---

## Testing & Verification

### Testing Checklist

After modifying density or scale behavior:

- [ ] Density slider works (0-100% range)
- [ ] Scale Base slider works (0-100% range)
- [ ] Scale Range slider works (0-100% range)
- [ ] Minimum density shows at least 1 sprite
- [ ] Maximum density shows many sprites (60+ per layer)
- [ ] Layers appear at correct density thresholds
- [ ] Scale Base affects sprite size correctly
- [ ] Scale Range creates size variation when > 0%
- [ ] Scale Range = 0% makes all sprites same size
- [ ] Sprites don't become too small (< MIN_TILE_SCALE)
- [ ] Sprites don't become too large (> MAX_TILE_SCALE)
- [ ] Conversion utilities work correctly (UI ↔ Internal)
- [ ] No console errors
- [ ] TypeScript compilation succeeds

### Visual Testing

1. **Density Testing:**
   - Set density to 0% → Should see 1 sprite
   - Set density to 50% → Should see multiple sprites
   - Set density to 100% → Should see many sprites (60+ per layer)

2. **Scale Base Testing:**
   - Set Scale Base to 0% → Sprites should be very small
   - Set Scale Base to 50% → Sprites should be medium size
   - Set Scale Base to 100% → Sprites should be very large

3. **Scale Range Testing:**
   - Set Scale Range to 0% → All sprites should be same size
   - Set Scale Range to 50% → Sprites should vary in size
   - Set Scale Range to 100% → Sprites should have maximum size variation

---

## Troubleshooting

### Problem: Density slider doesn't change sprite count

**Possible Causes:**
1. Conversion utilities not working
2. State not updating
3. `computeSprite()` not recalculating

**Solutions:**
1. Check browser console for errors
2. Verify `uiToDensity()` is being called
3. Verify `controller.setScalePercent()` is working
4. Check that `computeSprite()` is called after state change

---

### Problem: Scale sliders don't affect sprite size

**Possible Causes:**
1. State not updating
2. Scale calculation not running
3. Rendering not using calculated scale

**Solutions:**
1. Check browser console for errors
2. Verify `controller.setScaleBase()` and `setScaleSpread()` are working
3. Check that `computeSprite()` recalculates scale values
4. Verify rendering uses `tile.scale` value

---

### Problem: Sprites too small or too large

**Possible Causes:**
1. Scale constants out of range
2. Calculation error
3. Clamping not working

**Solutions:**
1. Check `MIN_TILE_SCALE` and `MAX_TILE_SCALE` values
2. Verify scale calculation in `computeSprite()`
3. Check that `clamp()` is applied correctly
4. Adjust constants if needed

---

### Problem: Layers not appearing at expected density

**Possible Causes:**
1. Threshold values incorrect
2. Density calculation error
3. Layer logic issue

**Solutions:**
1. Check `layerThresholds` array values
2. Verify density calculation in `computeSprite()`
3. Check layer visibility logic
4. Test with known density values

---

## Best Practices

### Density Guidelines

1. **Reasonable Range**: Keep density range between 50-2000% for good control
2. **Layer Thresholds**: Space thresholds evenly (e.g., 0, 0.33, 0.66)
3. **Maximum Tiles**: 60 tiles per layer is a good balance (not too many, not too few)
4. **Progressive Appearance**: Layers should appear progressively as density increases

### Scale Guidelines

1. **Size Limits**: Keep MIN_TILE_SCALE ≥ 0.1 and MAX_TILE_SCALE ≤ 10.0
2. **Base Scale**: 0.12-5.5 range works well for most compositions
3. **Spread Range**: 0-100% gives good control over size variation
4. **Clamping**: Always clamp final scale values to prevent extremes

### Performance Considerations

1. **High Density**: Many sprites (100+) can impact performance
2. **Large Sprites**: Very large sprites (>5.0 scale) can cause rendering issues
3. **Layer Count**: More layers = more sprites = slower rendering
4. **Optimization**: Consider culling off-screen sprites for very high density

### User Experience

1. **Slider Range**: 0-100% is intuitive for users
2. **Tooltips**: Clear tooltips help users understand controls
3. **Visual Feedback**: Immediate canvas updates show changes
4. **Default Values**: Good defaults (e.g., 72% base, 62% spread) provide nice starting point

---

## Summary

The density and scale system in BitLab provides:
- **Flexible Control**: Adjust sprite count and size independently
- **Layer System**: Progressive layer appearance based on density
- **Size Variation**: Random scale distribution for visual interest
- **User-Friendly**: Simple 0-100% sliders with clear tooltips

**Key Files:**
- `src/lib/utils/conversions.ts` - UI ↔ Internal value conversion
- `src/generator.ts` - Core calculation logic
- `src/components/ControlPanel/SpriteControls.tsx` - UI controls

**Key Constants:**
- `DENSITY_MIN` / `DENSITY_MAX` - Density range
- `MIN_TILE_SCALE` / `MAX_TILE_SCALE` - Scale limits
- `layerThresholds` - When layers appear
- `maxTiles` - Maximum tiles per layer

The system automatically handles:
- Value conversion between UI and internal ranges
- Layer visibility based on density
- Random scale distribution
- Clamping to prevent extremes

