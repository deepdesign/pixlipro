# Complete Guide: Palette & Variance in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding Palette & Variance](#understanding-palette--variance)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Operations: Modify Palette & Variance Behavior](#operations-modify-palette--variance-behavior)
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

### What Are Palette & Variance?

**Palette** is the base color scheme used for sprites. Each palette contains 4-5 colors that define the visual theme.

**Variance** controls how much each sprite's color can drift away from the base palette colors. Higher variance creates more color variation and visual interest.

**Hue Shift** rotates all palette colors around the color wheel, creating different color moods while maintaining the palette's relationships.

Together, these controls allow fine-tuned color control over the entire canvas.

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── data/
│   │   └── palettes.ts               # ⭐ Palette definitions
│   │
│   ├── lib/
│   │   └── utils/
│   │       └── conversions.ts        # Variance conversion utilities
│   │
│   ├── components/
│   │   └── ControlPanel/
│   │       └── FxControls.tsx        # Palette & variance UI controls
│   │
│   ├── generator.ts                  # Core color calculation logic
│   └── App.tsx                       # Main application component
│
├── docs/
│   ├── palette-and-variance.md      # This file
│   └── adding-color-palettes.md     # Guide for adding palettes
│
└── package.json                      # Project dependencies
```

### Key Files for Palette & Variance

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/data/palettes.ts` | Palette definitions | ✅ **YES** - Add/change palettes |
| `src/generator.ts` | Color calculation and variance logic | ✅ **YES** - Modify variance formulas |
| `src/lib/utils/conversions.ts` | Variance UI ↔ Internal conversion | ✅ **YES** - Adjust variance range |
| `src/components/ControlPanel/FxControls.tsx` | UI controls | ❌ Already implemented |

---

## Understanding Palette & Variance

### Palette System

**How It Works:**
1. User selects a palette from the dropdown
2. Palette contains 4-5 base colors
3. Each sprite randomly selects one color from the palette
4. Selected color is then modified by variance and hue shift

**Palette Selection:**
- Located in Colours tab → "Palette & Variance" section
- Dropdown shows all available palettes with:
  - Category labels (Neon/Cyber, Warm/Fire, etc.)
  - 8x8px color preview squares
  - Alphabetical sorting within categories
- Custom palettes appear in "Custom" category

### Variance System

**UI Range:** 0-100% (displayed to user)  
**Internal Range:** 0-150 (used in calculations)

**How It Works:**
1. User adjusts "Sprite palette variance" slider (0-100%)
2. Value is converted to internal range (0-150)
3. Internal value is clamped to 0-1.5 (150% = 1.5 multiplier)
4. Each sprite's color is "jittered" using variance:
   - Hue shift: ±(variance × 60°)
   - Saturation shift: ±(variance × 50%)
   - Lightness shift: ±(variance × 40%)
5. Higher variance = more color variation

**Key Constants:**
```typescript
const PALETTE_VARIANCE_MIN = 0;
const PALETTE_VARIANCE_MAX = 150;  // Allows up to 150% variance
```

### Hue Shift System

**UI Range:** 0-100% (displayed to user)  
**Internal Range:** 0-360° (degrees around color wheel)

**How It Works:**
1. User adjusts "Sprite hue shift" slider (0-100%)
2. Value is converted to degrees: `(slider / 100) × 360°`
3. All palette colors are shifted by this amount
4. Color relationships are preserved (only hue changes)

**Example:**
- 0% = No shift (original colors)
- 25% = 90° shift (colors move 1/4 around wheel)
- 50% = 180° shift (colors move to opposite side)
- 100% = 360° shift (back to original, full rotation)

---

## File-by-File Breakdown

### 1. `src/data/palettes.ts` - Palette Definitions

**Location:** `src/data/palettes.ts`  
**Purpose:** Single source of truth for all color palettes

**What's in this file:**
```typescript
export interface Palette {
  id: string;
  name: string;
  colors: string[];  // 4-5 hex color codes
  category?: string;
}

export const palettes: Palette[] = [
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  // ... more palettes
];
```

**Key Points:**
- Each palette has 4-5 colors
- Colors are hex strings (e.g., `"#ff0000"`)
- Palettes can be organized by category
- See `docs/adding-color-palettes.md` for detailed guide

---

### 2. `src/lib/utils/conversions.ts` - Variance Conversion

**Location:** `src/lib/utils/conversions.ts`  
**Purpose:** Convert between UI slider values and internal variance values

**What's in this file:**
```typescript
const PALETTE_VARIANCE_MIN = 0;
const PALETTE_VARIANCE_MAX = 150;  // Increased from 100 to allow more variance

export const varianceToUi = (value: number): number => {
  const bounded = clampValue(value, PALETTE_VARIANCE_MIN, PALETTE_VARIANCE_MAX);
  return Math.round(
    ((bounded - PALETTE_VARIANCE_MIN) / (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN)) *
      100,
  );
};

export const uiToVariance = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    PALETTE_VARIANCE_MIN + (bounded / 100) * (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN),
  );
};
```

**Key Points:**
- `varianceToUi`: Converts internal value (0-150) to UI value (0-100)
- `uiToVariance`: Converts UI value (0-100) to internal value (0-150)
- Values are clamped to prevent out-of-range errors

---

### 3. `src/generator.ts` - Color Calculation Logic

**Location:** `src/generator.ts`  
**Purpose:** Calculate final sprite colors with variance and hue shift

**Key Functions:**

#### Hue Shift (Lines ~314-317):
```typescript
const shiftHue = (hex: string, hueShiftDegrees: number) => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + hueShiftDegrees, s, l);
};
```

#### Color Jittering (Lines ~330-336):
```typescript
const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  const hueShift = (random() - 0.5) * variance * 60;
  const satShift = (random() - 0.5) * variance * 50;
  const lightShift = (random() - 0.5) * variance * 40;
  return hslToHex(h + hueShift, s + satShift, l + lightShift);
};
```

#### Palette Processing (Lines ~532-548):
```typescript
const computeSprite = (state: GeneratorState): PreparedSprite => {
  const palette = getPalette(state.paletteId);
  const originalPaletteColors = palette.colors;
  
  // Allow variance up to 1.5 (150% internal value) for more color variation
  const variance = clamp(state.paletteVariance / 100, 0, 1.5);
  
  const colorRng = createMulberry32(hashSeed(`${state.seed}-color`));
  
  // Apply global hue shift to palette colors (0-100 maps to 0-360 degrees)
  const hueShiftDegrees = (state.hueShift / 100) * 360;
  const shiftedPalette = originalPaletteColors.map((color) =>
    shiftHue(color, hueShiftDegrees),
  );
  
  // Apply variance to each color
  const chosenPalette = shiftedPalette.map((color) =>
    jitterColor(color, variance, colorRng),
  );
  
  // ... use chosenPalette for sprite coloring
};
```

**Key Points:**
- Hue shift is applied first (to all palette colors)
- Variance is applied per-sprite (each sprite gets different jitter)
- Variance affects hue, saturation, and lightness
- Random number generator ensures deterministic results (same seed = same colors)

---

### 4. `src/components/ControlPanel/FxControls.tsx` - UI Controls

**Location:** `src/components/ControlPanel/FxControls.tsx`  
**Purpose:** UI controls for palette selection and variance

**Palette Selector (Lines ~90-121):**
```typescript
<ControlSelect
  id="palette-select"
  label="Palette & Variance"
  value={currentPaletteId}
  onItemPointerDown={onPaletteOptionSelect}
  disabled={!ready}
  options={paletteOptions}
  tooltip="Select the core palette used for tinting sprites before variance is applied."
  currentLabel={currentPaletteName}
  locked={lockedSpritePalette}
  onLockToggle={() => onLockSpritePalette(!lockedSpritePalette)}
  prefixButton={/* Custom palette manager button */}
/>
```

**Variance Slider (Lines ~141-153):**
```typescript
<ControlSlider
  id="palette-range"
  label="Sprite palette variance"
  min={0}
  max={100}
  value={varianceToUi(spriteState.paletteVariance)}
  displayValue={`${varianceToUi(spriteState.paletteVariance)}%`}
  onChange={(value) =>
    controller?.setPaletteVariance(uiToVariance(value))
  }
  disabled={!ready}
  tooltip="Controls how much each colour can drift away from the base palette swatches."
/>
```

**Hue Shift Slider (Lines ~154-164):**
```typescript
<ControlSlider
  id="hue-shift"
  label="Sprite hue shift"
  min={0}
  max={100}
  value={spriteState.hueShift ?? 0}
  displayValue={`${spriteState.hueShift ?? 0}%`}
  onChange={(value) => controller?.setHueShift(value)}
  disabled={!ready}
  tooltip="Shifts all palette colors around the color wheel (0-360°)."
/>
```

**Key Points:**
- Palette selector shows categories and color previews
- Variance slider uses conversion utilities
- Hue shift slider uses direct percentage values
- All controls have clear tooltips

---

## Operations: Modify Palette & Variance Behavior

### Changing Variance Range

**To adjust the maximum variance:**

1. Open `src/lib/utils/conversions.ts`
2. Modify the constant:
```typescript
const PALETTE_VARIANCE_MAX = 150;  // Change this value
```

3. Update the clamp in `src/generator.ts` (around line 537):
```typescript
const variance = clamp(state.paletteVariance / 100, 0, 1.5);  // Adjust if needed
```

**Effects:**
- Lower value: Less color variation possible
- Higher value: More color variation possible (up to 200% = 2.0 multiplier)

---

### Changing Variance Jitter Amounts

**To adjust how much variance affects hue/saturation/lightness:**

1. Open `src/generator.ts`
2. Find the `jitterColor` function (around line 330)
3. Modify the multipliers:
```typescript
const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  const hueShift = (random() - 0.5) * variance * 60;      // Change 60
  const satShift = (random() - 0.5) * variance * 50;      // Change 50
  const lightShift = (random() - 0.5) * variance * 40;     // Change 40
  return hslToHex(h + hueShift, s + satShift, l + lightShift);
};
```

**Effects:**
- Higher multipliers: More dramatic color shifts
- Lower multipliers: More subtle color shifts

**Example:** To make variance affect hue more:
```typescript
const hueShift = (random() - 0.5) * variance * 90;  // Increased from 60 to 90
```

---

### Changing Hue Shift Range

**To adjust the maximum hue shift:**

The hue shift range is fixed at 0-360° (full color wheel rotation), which is appropriate. If you want to limit it:

1. Open `src/generator.ts`
2. Find the hue shift calculation (around line 542):
```typescript
const hueShiftDegrees = (state.hueShift / 100) * 360;
```

3. Modify the multiplier:
```typescript
// To limit to 180° (half rotation):
const hueShiftDegrees = (state.hueShift / 100) * 180;

// To allow 2 full rotations (720°):
const hueShiftDegrees = (state.hueShift / 100) * 720;
```

**Effects:**
- Lower multiplier: Less hue shift range
- Higher multiplier: More hue shift range (can create color cycling effects)

---

## Data Flow & Dependencies

### How Palette & Variance Flow Through the System

```
1. User selects palette from dropdown
   ↓
2. FxControls calls onPaletteOptionSelect(paletteId)
   ↓
3. App.tsx calls controller.usePalette(paletteId)
   ↓
4. generator.ts updates state.paletteId
   ↓
5. computeSprite() loads palette from palettes.ts
   ↓
6. Hue shift is applied to all palette colors
   ↓
7. Variance is applied per-sprite (jittering)
   ↓
8. Each sprite gets a random color from processed palette
   ↓
9. p.draw() renders sprites with final colors
   ↓
10. Canvas displays sprites with palette colors + variance
```

### Dependencies

- **Palette definitions** → Loaded from `palettes.ts`
- **Variance conversion** → Uses conversion utilities
- **Color calculations** → HSL color space for hue/saturation/lightness
- **Random number generator** → Deterministic RNG for consistent results

---

## Code Examples

### Example: More Subtle Variance

**Goal:** Reduce color variation (make variance less dramatic)

**Update Generator (`src/generator.ts`):**
```typescript
const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  // Reduce multipliers by half
  const hueShift = (random() - 0.5) * variance * 30;      // Was 60
  const satShift = (random() - 0.5) * variance * 25;      // Was 50
  const lightShift = (random() - 0.5) * variance * 20;     // Was 40
  return hslToHex(h + hueShift, s + satShift, l + lightShift);
};
```

**Result:** Variance creates more subtle color shifts, staying closer to base palette colors.

---

### Example: Variance Only Affects Hue

**Goal:** Make variance only shift hue, not saturation or lightness

**Update Generator (`src/generator.ts`):**
```typescript
const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  const hueShift = (random() - 0.5) * variance * 60;
  // Remove saturation and lightness shifts
  return hslToHex(h + hueShift, s, l);  // Keep s and l unchanged
};
```

**Result:** Variance only creates hue shifts, maintaining saturation and lightness of base colors.

---

### Example: Custom Variance Range

**Goal:** Allow variance from 0-200% (instead of 0-150%)

**1. Update Conversion Utilities (`src/lib/utils/conversions.ts`):**
```typescript
const PALETTE_VARIANCE_MAX = 200;  // Changed from 150
```

**2. Update Generator Clamp (`src/generator.ts`):**
```typescript
const variance = clamp(state.paletteVariance / 100, 0, 2.0);  // Changed from 1.5 to 2.0
```

**Result:** Slider still shows 0-100%, but maps to 0-200% internally, allowing more color variation.

---

## Testing & Verification

### Testing Checklist

After modifying palette or variance behavior:

- [ ] Palette selector works (shows all palettes)
- [ ] Palette selection applies to sprites
- [ ] Variance slider works (0-100% range)
- [ ] Variance creates color variation
- [ ] Variance = 0% shows exact palette colors
- [ ] Variance = 100% shows maximum variation
- [ ] Hue shift slider works (0-100% range)
- [ ] Hue shift rotates colors around color wheel
- [ ] Hue shift = 0% shows original colors
- [ ] Hue shift = 100% shows full rotation (back to original)
- [ ] Combined variance + hue shift works correctly
- [ ] Custom palettes work with variance and hue shift
- [ ] Gradients work with variance and hue shift
- [ ] No console errors
- [ ] TypeScript compilation succeeds

### Visual Testing

1. **Palette Testing:**
   - Select different palettes → Sprites should change colors
   - Verify palette colors match selected palette
   - Test custom palettes

2. **Variance Testing:**
   - Set variance to 0% → Sprites should use exact palette colors
   - Set variance to 50% → Sprites should show moderate variation
   - Set variance to 100% → Sprites should show maximum variation
   - Verify variation is random (different sprites have different colors)

3. **Hue Shift Testing:**
   - Set hue shift to 0% → Colors should be original
   - Set hue shift to 25% → Colors should shift 90° around wheel
   - Set hue shift to 50% → Colors should shift 180° (opposites)
   - Set hue shift to 100% → Colors should return to original (full rotation)

---

## Troubleshooting

### Problem: Palette colors not applying

**Possible Causes:**
1. Palette not found
2. State not updating
3. Color calculation error

**Solutions:**
1. Check browser console for errors
2. Verify palette ID exists in `palettes.ts`
3. Verify `getPalette()` function works
4. Check that `state.paletteId` is updating

---

### Problem: Variance not working

**Possible Causes:**
1. Variance set to 0%
2. Conversion error
3. Jitter calculation error

**Solutions:**
1. Check variance slider is > 0%
2. Verify `uiToVariance()` conversion works
3. Check `jitterColor()` function
4. Verify random number generator is working

---

### Problem: Hue shift not working

**Possible Causes:**
1. Hue shift set to 0%
2. Color conversion error
3. HSL calculation error

**Solutions:**
1. Check hue shift slider is > 0%
2. Verify `shiftHue()` function works
3. Check HSL to hex conversion
4. Verify hue shift calculation

---

## Best Practices

### Palette Guidelines

1. **Color Count**: Use 4-5 colors per palette (optimal variety)
2. **Color Relationships**: Choose colors that work well together
3. **Contrast**: Ensure good contrast for visibility
4. **Categories**: Organize palettes by aesthetic (Neon/Cyber, Warm/Fire, etc.)

### Variance Guidelines

1. **Range**: 0-150% internal range provides good control
2. **Jitter Amounts**: Current multipliers (60/50/40) create balanced variation
3. **Deterministic**: Use seed-based RNG for consistent results
4. **Per-Sprite**: Each sprite gets unique variance (not per-palette)

### Hue Shift Guidelines

1. **Full Rotation**: 0-360° range allows complete color wheel rotation
2. **Preserve Relationships**: Only shifts hue, maintains saturation/lightness
3. **Global Effect**: Applies to all palette colors uniformly
4. **Cyclic**: 100% = 360° = back to original (full cycle)

### Performance Considerations

1. **Color Calculations**: HSL conversions are fast, no performance impact
2. **Deterministic RNG**: Seed-based RNG ensures consistent results
3. **Caching**: Palette colors are processed once per sprite computation

---

## Summary

The palette and variance system in BitLab provides:
- **Flexible Color Control**: Select from many palettes or create custom ones
- **Color Variation**: Variance creates unique colors per sprite
- **Hue Shifting**: Rotate entire palette around color wheel
- **Deterministic Results**: Same seed = same colors (for presets)

**Key Files:**
- `src/data/palettes.ts` - Palette definitions
- `src/lib/utils/conversions.ts` - Variance conversion utilities
- `src/generator.ts` - Color calculation logic
- `src/components/ControlPanel/FxControls.tsx` - UI controls

**Key Constants:**
- `PALETTE_VARIANCE_MIN` / `PALETTE_VARIANCE_MAX` - Variance range (0-150)
- Variance multipliers: 60 (hue), 50 (saturation), 40 (lightness)

The system automatically handles:
- Palette loading and selection
- Hue shift application
- Per-sprite variance jittering
- Color space conversions (HSL ↔ Hex)

