# Complete Guide: Blend Modes & Opacity in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Blend Modes & Opacity](#understanding-blend-modes--opacity)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Operations: Modify Blend & Opacity](#operations-modify-blend--opacity)
5. [Data Flow & Dependencies](#data-flow--dependencies)
6. [Testing & Verification](#testing--verification)
7. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** uses blend modes and opacity to control how sprite layers composite together, creating depth and visual interest.

### What Are Blend Modes & Opacity?

**Blend Modes** control how sprites combine when they overlap. Different modes create different visual effects (multiply darkens, screen lightens, etc.).

**Opacity** controls the transparency of sprite layers. Lower opacity makes sprites more transparent, allowing underlying layers to show through.

**Blend Mode Auto** randomly assigns blend modes to each sprite/layer, creating varied visual effects.

---

## Understanding Blend Modes & Opacity

### Available Blend Modes

1. **NONE** (Normal) - Standard blending, no special effect
2. **MULTIPLY** - Darkens underlying colors
3. **SCREEN** - Lightens underlying colors
4. **HARD_LIGHT** - Strong contrast effect
5. **OVERLAY** - Combines multiply and screen
6. **SOFT_LIGHT** - Softer contrast effect
7. **DARKEST** - Uses darkest color from both
8. **LIGHTEST** - Uses lightest color from both

### Opacity System

**UI Range:** 15-100% (displayed to user)  
**Internal Range:** 0.12-1.0 (used in calculations)

**How It Works:**
- Each layer has a base opacity (from slider)
- Individual sprites get random opacity variation (±35%)
- Final opacity is clamped between 0.12 and 0.95
- Lower opacity = more transparent = more underlying layers visible

### Blend Mode Auto

When enabled:
- Each layer gets a random blend mode from the pool
- Each sprite can also get a random blend mode
- Creates varied, unpredictable visual effects
- Good for organic, natural-looking compositions

---

## File-by-File Breakdown

### 1. `src/constants/blend.ts` - Blend Mode Definitions

**Location:** `src/constants/blend.ts`  
**Purpose:** List of available blend modes

```typescript
export const BLEND_MODES: BlendModeOption[] = [
  "NONE",
  "MULTIPLY",
  "SCREEN",
  "HARD_LIGHT",
  "OVERLAY",
  "SOFT_LIGHT",
  "DARKEST",
  "LIGHTEST",
];
```

### 2. `src/generator.ts` - Blend Mode Application

**Location:** `src/generator.ts`  
**Purpose:** Apply blend modes during rendering

**Blend Mode Map (Lines ~1065-1074):**
```typescript
const blendMap: Record<BlendModeKey, p5.BLEND_MODE> = {
  NONE: p.BLEND,
  MULTIPLY: p.MULTIPLY,
  SCREEN: p.SCREEN,
  HARD_LIGHT: p.HARD_LIGHT ?? p.OVERLAY,
  OVERLAY: p.OVERLAY,
  SOFT_LIGHT: p.SOFT_LIGHT ?? p.OVERLAY,
  DARKEST: p.DARKEST ?? p.BLEND,
  LIGHTEST: p.LIGHTEST ?? p.BLEND,
};
```

**Opacity Calculation (Lines ~580-611):**
```typescript
const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1);
// ...
const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95);
```

**Blend Mode Assignment (Lines ~607-610, 667-669):**
```typescript
const layerBlendMode: BlendModeKey = state.blendModeAuto
  ? (blendModePool[Math.floor(Math.random() * blendModePool.length)] ?? "NONE")
  : state.blendMode;

const tileBlend = state.blendModeAuto
  ? (blendModePool[Math.floor(rng() * blendModePool.length)] ?? "NONE")
  : state.blendMode;
```

### 3. `src/components/ControlPanel/FxControls.tsx` - UI Controls

**Location:** `src/components/ControlPanel/FxControls.tsx`  
**Purpose:** UI controls for blend modes and opacity

**Opacity Slider (Lines ~232-242):**
```typescript
<ControlSlider
  id="opacity-range"
  label="Layer Opacity"
  min={15}
  max={100}
  value={Math.round(spriteState.layerOpacity)}
  displayValue={`${Math.round(spriteState.layerOpacity)}%`}
  onChange={(value) => controller?.setLayerOpacity(value)}
  disabled={!ready}
  tooltip="Sets the base transparency for each rendered layer before blending."
/>
```

**Blend Mode Selector (Lines ~243-257):**
```typescript
<ControlSelect
  id="blend-mode"
  label="Blend Mode"
  value={spriteState.blendMode as string}
  onChange={(value) => onBlendSelect(value as BlendModeOption)}
  disabled={!ready || spriteState.blendModeAuto}
  options={BLEND_MODES.map((mode) => ({
    value: mode,
    label: formatBlendMode(mode),
  }))}
  tooltip="Choose the compositing mode applied when layers draw over each other."
  currentLabel={formatBlendMode(spriteState.blendMode as BlendModeOption)}
  locked={lockedBlendMode}
  onLockToggle={() => onLockBlendMode(!lockedBlendMode)}
/>
```

**Blend Mode Auto Toggle (Lines ~258-275):**
```typescript
<div className="control-field control-field--spaced">
  <div className="switch-row" style={{ gap: "0.75rem" }}>
    <Switch
      id="blend-mode-auto"
      checked={spriteState.blendModeAuto}
      onCheckedChange={onBlendAutoToggle}
      disabled={!ready}
      aria-labelledby="blend-mode-auto-label"
    />
    <div className="field-heading-left">
      <span className="field-label" id="blend-mode-auto-label">
        Random blend modes
      </span>
      <TooltipIcon
        id="blend-mode-auto-tip"
        text="Randomly assign blend modes to each layer and sprite for varied effects."
        label="Random blend modes"
      />
    </div>
  </div>
</div>
```

---

## Operations: Modify Blend & Opacity

### Adding a New Blend Mode

**Step 1: Add to Type Definition**
1. Open `src/types/generator.ts`
2. Add to `BlendModeOption` union type

**Step 2: Add to Constants**
1. Open `src/constants/blend.ts`
2. Add to `BLEND_MODES` array

**Step 3: Add to Blend Map**
1. Open `src/generator.ts`
2. Add to `blendMap` (around line 1065)
3. Use p5.js blend mode constant or fallback

**Step 4: Add Formatting**
1. Open `src/lib/utils/formatting.ts`
2. Add case to `formatBlendMode()` function

---

### Changing Opacity Range

**To adjust minimum/maximum opacity:**

1. Open `src/generator.ts`
2. Find opacity calculation (around line 580):
```typescript
const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1);
```

3. Modify clamp values:
```typescript
const opacityBase = clamp(state.layerOpacity / 100, 0.2, 1);  // Higher minimum
```

4. Update UI slider min in `FxControls.tsx`:
```typescript
min={20}  // Match minimum opacity
```

---

### Changing Opacity Variation

**To adjust how much opacity varies between sprites:**

1. Open `src/generator.ts`
2. Find opacity variation (around line 611):
```typescript
const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95);
```

3. Modify variation multiplier:
```typescript
// Current: ±35% variation
// To reduce: ±20% variation
const opacity = clamp(opacityBase + (rng() - 0.5) * 0.2, 0.12, 0.95);
```

---

## Data Flow & Dependencies

### How Blend & Opacity Flow Through the System

```
1. User adjusts opacity/blend mode in UI
   ↓
2. FxControls calls controller methods
   ↓
3. generator.ts updates state.layerOpacity/blendMode/blendModeAuto
   ↓
4. computeSprite() calculates opacity and assigns blend modes
   ↓
5. p.draw() applies blend mode and opacity during rendering
   ↓
6. Canvas displays sprites with blend effects
```

---

## Testing & Verification

### Testing Checklist

- [ ] Opacity slider works (15-100% range)
- [ ] Blend mode selector works (all modes available)
- [ ] Blend mode auto toggle works
- [ ] Opacity affects sprite transparency
- [ ] Different blend modes create different effects
- [ ] Blend mode auto creates varied effects
- [ ] No console errors
- [ ] TypeScript compilation succeeds

---

## Best Practices

### Blend Mode Guidelines

1. **NONE**: Use for standard, predictable blending
2. **MULTIPLY**: Good for darkening effects
3. **SCREEN**: Good for lightening effects
4. **AUTO**: Use for organic, varied compositions

### Opacity Guidelines

1. **Range**: 15-100% provides good control
2. **Variation**: ±35% variation creates natural look
3. **Minimum**: 0.12 minimum prevents invisible sprites
4. **Maximum**: 0.95 maximum prevents fully opaque (allows some transparency)

---

## Summary

The blend mode and opacity system provides:
- **8 Blend Modes**: Various compositing effects
- **Opacity Control**: Adjust layer transparency (15-100%)
- **Auto Mode**: Random blend modes for varied effects
- **Per-Sprite Variation**: Each sprite gets unique opacity

**Key Files:**
- `src/constants/blend.ts` - Blend mode definitions
- `src/generator.ts` - Blend mode application
- `src/components/ControlPanel/FxControls.tsx` - UI controls

**Key Features:**
- Layer opacity control
- Blend mode selection
- Blend mode auto (random assignment)
- Per-sprite opacity variation

