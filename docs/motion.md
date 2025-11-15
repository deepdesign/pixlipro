# Complete Guide: Motion in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Motion](#understanding-motion)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Operations: Modify Motion](#operations-modify-motion)
5. [Data Flow & Dependencies](#data-flow--dependencies)
6. [Testing & Verification](#testing--verification)
7. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** uses motion modes to animate sprites across the canvas, creating dynamic, living compositions.

### What Is Motion?

Motion controls how sprites move and animate on the canvas. Each motion mode creates a different animation pattern (sway, drift, spiral, etc.).

**Motion Intensity** controls how far sprites travel within their movement path.

**Motion Speed** controls how fast sprites move along their path.

---

## Understanding Motion

### Available Motion Modes

1. **Pulse** - Pulsing in/out motion
2. **Drift** - Gentle floating motion
3. **Ripple** - Wave-like motion
4. **Zigzag** - Angular back-and-forth motion
5. **Cascade** - Flowing downward motion
6. **Spiral Orbit** - Circular spiral motion
7. **Comet Trail** - Trailing motion effect
8. **Linear** - Straight-line motion
9. **Isometric** - Hexagonal grid motion

### Motion Intensity

**UI Range:** 0-100%  
**Internal Range:** 0-1 (multiplier)

**How It Works:**
- Controls the distance sprites travel
- Higher intensity = sprites move farther
- Applied as a multiplier to movement calculations

### Motion Speed

**UI Range:** 0-100%  
**Internal Range:** 0-12.5 (speed factor)

**How It Works:**
- Controls animation speed
- Normalized across all motion modes
- Higher speed = faster animation
- Uses mode-specific multipliers for balanced feel

**Speed Normalization:**
Each motion mode has a speed multiplier to ensure 100% feels the same across all modes:
- `sway`: 2.0x
- `drift`: 1.625x
- `cascade`: 2.9x
- `comet`: 3.0x
- `ripple`: 3.25x
- `spiral`: 4.4x
- `orbit`: 1.1x
- `zigzag`: 2.2x
- `pulse`: 1.6x
- `wavefront`: 10.0x

---

## File-by-File Breakdown

### 1. `src/constants/movement.ts` - Motion Mode Definitions

**Location:** `src/constants/movement.ts`  
**Purpose:** List of available motion modes

```typescript
export const MOVEMENT_MODES: Array<{ value: MovementMode; label: string }> = [
  { value: "pulse", label: "Pulse" },
  { value: "drift", label: "Drift" },
  { value: "ripple", label: "Ripple" },
  { value: "zigzag", label: "Zigzag" },
  { value: "cascade", label: "Cascade" },
  { value: "spiral", label: "Spiral Orbit" },
  { value: "comet", label: "Comet Trail" },
  { value: "linear", label: "Linear" },
  { value: "isometric", label: "Isometric" },
];
```

### 2. `src/generator.ts` - Motion Calculation

**Location:** `src/generator.ts`  
**Purpose:** Calculate movement offsets for each sprite

**Movement Calculation Function (Lines ~349-527):**
```typescript
const computeMovementOffsets = (
  mode: MovementMode,
  data: {
    time: number;
    phase: number;
    motionScale: number;
    layerIndex: number;
    baseUnit: number;
    layerTileSize: number;
    speedFactor: number;
  },
): { offsetX: number; offsetY: number; scaleMultiplier: number } => {
  // Calculates X/Y offsets based on motion mode
  // Each mode has unique calculation logic
  // Returns offsetX, offsetY, and optional scaleMultiplier
};
```

**Speed Normalization (Lines ~990-1006):**
```typescript
const MOTION_SPEED_MAX_INTERNAL = 12.5;
const MOVEMENT_SPEED_MULTIPLIERS: Record<MovementMode, number> = {
  sway: 2.0,
  drift: 1.625,
  // ... other modes
};

const modeSpeedMultiplier = MOVEMENT_SPEED_MULTIPLIERS[currentState.movementMode] ?? 1.0;
const baseSpeedFactor = Math.max(currentState.motionSpeed / MOTION_SPEED_MAX_INTERNAL, 0);
const targetSpeedFactor = baseSpeedFactor / modeSpeedMultiplier;
```

### 3. `src/components/ControlPanel/MotionControls.tsx` - UI Controls

**Location:** `src/components/ControlPanel/MotionControls.tsx`  
**Purpose:** UI controls for motion

**Movement Mode Selector:**
```typescript
<ControlSelect
  id="movement-mode"
  label="Movement"
  value={spriteState.movementMode}
  onChange={(value) => onMovementSelect(value as MovementMode)}
  options={MOVEMENT_MODES.map((mode) => ({
    value: mode.value,
    label: mode.label,
  }))}
  tooltip="Select the animation path applied to each sprite layer."
/>
```

**Motion Intensity Slider:**
```typescript
<ControlSlider
  id="motion-range"
  label="Motion Intensity"
  min={0}
  max={100}
  value={Math.round(spriteState.motionIntensity)}
  displayValue={`${Math.round(spriteState.motionIntensity)}%`}
  onChange={(value) => controller?.setMotionIntensity(value)}
  tooltip="Adjust how far sprites travel within their chosen movement path."
/>
```

**Motion Speed Slider:**
```typescript
<ControlSlider
  id="motion-speed"
  label="Motion Speed"
  min={0}
  max={100}
  value={speedToUi(spriteState.motionSpeed)}
  displayValue={`${speedToUi(spriteState.motionSpeed)}%`}
  onChange={(value) => controller?.setMotionSpeed(uiToSpeed(value))}
  tooltip="Control the speed of sprite animation (normalized across all movement modes)."
/>
```

---

## Operations: Modify Motion

### Adding a New Motion Mode

**Step 1: Add to Type Definition**
1. Open `src/types/generator.ts`
2. Add to `MovementMode` union type

**Step 2: Add to Constants**
1. Open `src/constants/movement.ts`
2. Add to `MOVEMENT_MODES` array

**Step 3: Add Speed Multiplier**
1. Open `src/generator.ts`
2. Add to `MOVEMENT_SCALE_MULTIPLIERS` (if needed)
3. Add to `MOVEMENT_SPEED_MULTIPLIERS`

**Step 4: Implement Movement Logic**
1. Open `src/generator.ts`
2. Add case to `computeMovementOffsets()` function
3. Implement offset calculation for new mode

---

### Changing Speed Multipliers

**To adjust speed normalization:**

1. Open `src/generator.ts`
2. Find `MOVEMENT_SPEED_MULTIPLIERS` (around line 250):
```typescript
const MOVEMENT_SPEED_MULTIPLIERS: Record<MovementMode, number> = {
  drift: 1.625,  // Adjust this value
  // ... other modes
};
```

**Effects:**
- Higher multiplier: Mode becomes slower at same slider value
- Lower multiplier: Mode becomes faster at same slider value

---

## Data Flow & Dependencies

### How Motion Flows Through the System

```
1. User selects motion mode and adjusts intensity/speed
   ↓
2. MotionControls calls controller methods
   ↓
3. generator.ts updates state.movementMode/motionIntensity/motionSpeed
   ↓
4. computeMovementOffsets() calculates movement for each sprite
   ↓
5. p.draw() applies movement offsets during rendering
   ↓
6. Canvas displays animated sprites
```

---

## Testing & Verification

### Testing Checklist

- [ ] Motion mode selector works (all modes available)
- [ ] Motion intensity slider works (0-100%)
- [ ] Motion speed slider works (0-100%)
- [ ] Each motion mode creates unique animation
- [ ] Speed feels balanced across all modes
- [ ] Intensity affects travel distance
- [ ] Speed affects animation speed
- [ ] No console errors
- [ ] TypeScript compilation succeeds

---

## Best Practices

### Motion Mode Guidelines

1. **Drift**: Good for gentle, organic motion
2. **Spiral**: Good for dynamic, energetic motion
3. **Pulse**: Good for rhythmic, breathing effects
4. **Linear**: Good for directional, purposeful motion

### Speed Normalization

1. **Balanced Feel**: All modes should feel similar at 100% speed
2. **Multipliers**: Tuned through testing for optimal feel
3. **Smooth Interpolation**: Speed changes smoothly without jumps

---

## Summary

The motion system provides:
- **9 Motion Modes**: Various animation patterns
- **Intensity Control**: Adjust travel distance (0-100%)
- **Speed Control**: Adjust animation speed (0-100%, normalized)
- **Smooth Animation**: Frame-rate independent, smooth motion

**Key Files:**
- `src/constants/movement.ts` - Motion mode definitions
- `src/generator.ts` - Motion calculation logic
- `src/components/ControlPanel/MotionControls.tsx` - UI controls

**Key Features:**
- Mode selection
- Intensity control
- Speed control (normalized)
- Per-sprite phase variation

