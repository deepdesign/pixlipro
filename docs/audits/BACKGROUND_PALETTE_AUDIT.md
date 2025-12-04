# Background Palette Application Audit

## Overview

This document breaks down how palettes are applied to the canvas background in Pixli Pro.

## Current Implementation

### 1. Background Color Selection

**Location:** `src/generator.ts` - `computeSprite()` function (lines ~842-851)

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

**Key Points:**
- Background always uses `colors[0]` (first color) from the selected palette
- If `backgroundMode === "auto"`, uses the sprite palette
- Otherwise uses the specified palette ID
- Applies hue shift and brightness adjustments

### 2. Background Rendering in Draw Loop

**Location:** `src/generator.ts` - `p.draw()` function (lines ~2198-2324)

#### Solid Background Mode

```typescript
const getBaseBackgroundColor = () => {
  const bgPaletteId = resolveBackgroundPaletteId();
  const bgPalette = getPalette(bgPaletteId);
  return bgPalette.colors[0] ?? getPalette(currentState.paletteId).colors[0];
};

const baseBackgroundColor = getBaseBackgroundColor();
const animatedBackground = applyCanvasAdjustments(baseBackgroundColor);
```

**Key Points:**
- Always uses `colors[0]` from the palette
- Applies animated hue shift and brightness each frame
- Supports black background override (from localStorage)

#### Gradient Background Mode

```typescript
const gradientPalette = getPalette(resolveGradientPaletteId());
const baseBgColor = getBaseBackgroundColor();
const gradientSourceColors =
  gradientPalette.colors.length > 0
    ? gradientPalette.colors.slice(0, 3)  // Uses first 3 colors
    : [baseBgColor];
```

**Key Points:**
- Uses first 3 colors from palette (`colors.slice(0, 3)`)
- Falls back to base background color if palette is empty
- Applies hue shift and brightness to each gradient color

### 3. Background Mode Resolution

**Location:** `src/generator.ts` - `p.draw()` function (line ~2198)

```typescript
const resolveBackgroundPaletteId = () =>
  currentState.backgroundMode === "auto"
    ? (currentState.paletteCycleEnabled ? activePalette.id : currentState.paletteId)
    : currentState.backgroundMode;
```

**Key Points:**
- "auto" mode uses sprite palette
- If palette cycling is enabled, uses the active cycled palette
- Otherwise uses the explicitly set background palette

### 4. Palette Change Handler

**Location:** `src/generator.ts` - `usePalette()` method (lines ~3715-3719)

```typescript
usePalette: (paletteId: PaletteId) => {
  if (getPalette(paletteId)) {
    applyState({ paletteId });
  }
},
```

**Key Points:**
- Simply updates `paletteId` in state
- Does NOT randomize background color index
- Background will use `colors[0]` from new palette

### 5. Re-apply Palette Handler

**Location:** `src/generator.ts` - `refreshPaletteApplication()` method (lines ~3448-3454)

```typescript
refreshPaletteApplication: () => {
  // Re-apply the current palette randomly across sprites without regenerating them
  const newColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  applyState({ colorSeedSuffix: newColorSeedSuffix }, { recompute: true });
},
```

**Key Points:**
- Only randomizes sprite colors (via `colorSeedSuffix`)
- Does NOT randomize background color
- Does NOT regenerate sprite positions/shapes

## Issues Identified

1. **Background always uses first color**: No randomization of which palette color is used
2. **Re-apply palette doesn't affect background**: Only randomizes sprite colors
3. **Palette change doesn't randomize background**: Always uses `colors[0]` from new palette

## Proposed Changes

### 1. Add Background Color Index to State

Add `backgroundColorIndex: number` to `GeneratorState`:
- Tracks which color from the palette is used for background
- For solid mode: single index (0 to palette.length - 1)
- For gradient mode: uses starting index, then takes next 3 colors (wrapping)

### 2. Update Background Color Selection

**In `computeSprite()`:**
- Use `state.backgroundColorIndex` instead of always `colors[0]`
- Wrap index to valid range: `index % palette.colors.length`

**In `getBaseBackgroundColor()`:**
- Use `currentState.backgroundColorIndex` instead of always `colors[0]`
- Wrap index to valid range

### 3. Seeded RNG for Theme Consistency

**Create `calculateBackgroundColorIndex()` helper:**
- Uses seeded RNG based on `seed` and `backgroundPaletteId`
- Ensures background color always matches the theme/seed
- Formula: `createMulberry32(hashSeed(\`${seed}-background-color-${backgroundPaletteId}\`))`

### 4. Update Re-apply Palette

**In `refreshPaletteApplication()`:**
- Randomize `backgroundColorIndex` when re-applying palette
- Use `calculateBackgroundColorIndex()` with current seed to match theme

### 5. Update Palette Change Handler

**In `usePalette()`:**
- Randomize `backgroundColorIndex` when palette changes
- Use `calculateBackgroundColorIndex()` with current seed
- Handles both "auto" mode (sprite palette) and specific background palette

### 6. Update Background Mode Handler

**In `setBackgroundMode()`:**
- Randomize `backgroundColorIndex` when background mode changes
- Use `calculateBackgroundColorIndex()` with current seed

### 7. Update Randomize Functions

**In `randomizeAll()` and `randomizeColors()`:**
- Recalculate `backgroundColorIndex` using seeded RNG
- Ensures background color matches new seed/theme

### 8. Gradient Mode Implementation

For gradient mode:
- Use `backgroundColorIndex` as starting point
- Take next 3 colors from palette (wrapping around)
- Maintains palette coherence while allowing variation

## Implementation Status

✅ **COMPLETED**

1. ✅ Added `backgroundColorIndex` to `GeneratorState` interface
2. ✅ Added default value to `DEFAULT_STATE` (0 for backward compatibility)
3. ✅ Created `calculateBackgroundColorIndex()` helper function using seeded RNG
4. ✅ Updated `computeSprite()` to use `backgroundColorIndex`
5. ✅ Updated `getBaseBackgroundColor()` to use `backgroundColorIndex`
6. ✅ Updated `refreshPaletteApplication()` to randomize `backgroundColorIndex` with seeded RNG
7. ✅ Updated `usePalette()` to randomize `backgroundColorIndex` with seeded RNG
8. ✅ Updated `setBackgroundMode()` to randomize `backgroundColorIndex` with seeded RNG
9. ✅ Updated `randomizeAll()` to recalculate `backgroundColorIndex` with seeded RNG
10. ✅ Updated `randomizeColors()` to recalculate `backgroundColorIndex` with seeded RNG
11. ✅ For gradient mode, calculate indices from `backgroundColorIndex` (wrapping)

## Key Benefits

- **Theme Consistency**: Background color always matches the seed/theme
- **Deterministic**: Same seed always produces same background color selection
- **Automatic Randomization**: Background color randomizes when palette or mode changes
- **Re-apply Support**: "Re-apply palette" button also randomizes background color
- **Backward Compatible**: Defaults to index 0 for existing presets

