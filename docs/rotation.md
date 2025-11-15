# Complete Guide: Rotation in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding Rotation](#understanding-rotation)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Operations: Modify Rotation Behavior](#operations-modify-rotation-behavior)
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

### What Is Rotation?

Rotation in BitLab has two independent systems:

1. **Rotation Offsets** (Sprites tab): Static rotation angles applied to sprites
   - Controlled by "Allow Rotation Offsets" toggle and "Rotation Amount" slider
   - Each sprite gets a random rotation offset (0° to max angle)
   - No animation - sprites stay at their assigned angle

2. **Rotation Animation** (Motion tab): Animated spinning of sprites
   - Controlled by "Animated Rotation" toggle and "Rotation Speed" slider
   - Sprites continuously rotate at varying speeds
   - Each sprite can rotate clockwise or counter-clockwise

These systems work independently and can be combined for complex rotation effects.

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── components/
│   │   └── ControlPanel/
│   │       ├── SpriteControls.tsx      # Rotation offset controls
│   │       └── MotionControls.tsx      # Rotation animation controls
│   │
│   ├── generator.ts                    # Core rotation calculation & rendering
│   └── App.tsx                         # Main application component
│
├── docs/
│   └── rotation.md                    # This file
│
└── package.json                        # Project dependencies
```

### Key Files for Rotation

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/generator.ts` | Rotation calculation and rendering logic | ✅ **YES** - Modify rotation formulas |
| `src/components/ControlPanel/SpriteControls.tsx` | Rotation offset UI controls | ❌ Already implemented |
| `src/components/ControlPanel/MotionControls.tsx` | Rotation animation UI controls | ❌ Already implemented |
| `src/types/generator.ts` | TypeScript types for rotation state | ❌ Already defined |

---

## Understanding Rotation

### Rotation Offset System

**Location:** Sprites tab → Rotation section

**Controls:**
- **Allow Rotation Offsets** (Toggle): Enable/disable static rotation
- **Rotation Amount** (Slider): Maximum rotation angle (0-180°)

**How It Works:**
1. When enabled, each sprite gets a random rotation offset
2. Offset is calculated as: `rotationBase = rotationRange * randomMultiplier`
3. `rotationRange` = `rotationAmount` converted to radians (0-180° → 0-π radians)
4. `randomMultiplier` = random value between -1 and 1
5. Final offset = `rotationRange * randomMultiplier` (can be negative or positive)
6. Sprite is rotated by this offset and stays fixed

**Key Constants:**
```typescript
const MAX_ROTATION_DEGREES = 180;  // Maximum rotation angle
```

### Rotation Animation System

**Location:** Motion tab → Rotation section

**Controls:**
- **Animated Rotation** (Toggle): Enable/disable spinning animation
- **Rotation Speed** (Slider): Animation speed (0-100%)

**How It Works:**
1. When enabled, each sprite continuously rotates
2. Speed is calculated as: `rotationSpeed = baseSpeed * multiplier * direction`
3. `baseSpeed` = slider value (0-100%) converted to radians per frame
4. `multiplier` = random value between 0.6 and 1.2 (per-sprite variation)
5. `direction` = 1 or -1 (clockwise or counter-clockwise, random per sprite)
6. Rotation accumulates over time: `angle = rotationBase + rotationSpeed * time`

**Key Constants:**
```typescript
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.05;  // ≈ 4.5°/s at 100%
```

### Combined Rotation

When both systems are enabled:
- Sprite starts with a static offset (from Rotation Amount)
- Sprite continuously rotates from that offset (from Rotation Speed)
- Final angle = `rotationOffset + (rotationSpeed * time)`

---

## File-by-File Breakdown

### 1. `src/generator.ts` - Core Rotation Logic

**Location:** `src/generator.ts`  
**Purpose:** Calculate rotation values and apply them during rendering

**Key Constants:**
```typescript
const MAX_ROTATION_DEGREES = 180;
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.05;  // ≈ 4.5°/s at 100%
```

**Rotation Offset Calculation (Lines ~569-660):**
```typescript
// Always calculate rotation range based on rotationAmount, regardless of rotationEnabled
// This allows toggling rotationEnabled without regenerating sprites
const rotationRange = degToRad(clamp(state.rotationAmount, 0, MAX_ROTATION_DEGREES));
const rotationSpeedBase = clamp(state.rotationSpeed, 0, 100) / 100;

// For each tile:
const rotationBaseMultiplier = rotationRange > 0 ? (positionRng() - 0.5) * 2 : 0;
const rotationBase = rotationRange * rotationBaseMultiplier;
const rotationDirection = positionRng() > 0.5 ? 1 : -1;
const rotationSpeedMultiplier = rotationSpeedBase > 0 ? (0.6 + positionRng() * 0.6) : 0;
const rotationSpeedValue =
  rotationSpeedBase > 0
    ? rotationSpeedBase * ROTATION_SPEED_MAX * rotationSpeedMultiplier
    : 0;
```

**Rotation Application (Lines ~1137-1151):**
```typescript
const rotationTime = scaledAnimationTime; // Use smoothly accumulating scaled time
// Recalculate rotation speed dynamically from currentState (no regeneration needed)
const rotationSpeedBase = clamp(currentState.rotationSpeed, 0, 100) / 100;
const rotationSpeed = currentState.rotationAnimated && rotationSpeedBase > 0
  ? rotationSpeedBase * ROTATION_SPEED_MAX * tile.rotationSpeedMultiplier
  : 0;
// Recalculate rotation base dynamically from currentState (no regeneration needed)
const rotationRange = degToRad(clamp(currentState.rotationAmount, 0, MAX_ROTATION_DEGREES));
const rotationBase = rotationRange * tile.rotationBaseMultiplier;
const rotationAngle =
  (currentState.rotationEnabled ? rotationBase : 0) +
  rotationSpeed * tile.rotationDirection * rotationTime;
if (rotationAngle !== 0) {
  p.rotate(rotationAngle);
}
```

**Key Points:**
- Rotation values are calculated per-tile during sprite computation
- Rotation is applied dynamically during rendering (no regeneration needed)
- Both offset and animation can be toggled without regenerating sprites
- Rotation accumulates smoothly over time using `scaledAnimationTime`

---

### 2. `src/components/ControlPanel/SpriteControls.tsx` - Rotation Offset UI

**Location:** `src/components/ControlPanel/SpriteControls.tsx`  
**Purpose:** UI controls for rotation offsets

**Rotation Toggle (Lines ~196-215):**
```typescript
<div className="control-field control-field--rotation">
  <div className="switch-row" style={{ gap: "0.75rem" }}>
    <Switch
      id="rotation-toggle"
      checked={spriteState.rotationEnabled}
      onCheckedChange={onRotationToggle}
      disabled={!ready}
      aria-labelledby="rotation-toggle-label"
    />
    <div className="field-heading-left">
      <span className="field-label" id="rotation-toggle-label">
        Allow Rotation Offsets
      </span>
      <TooltipIcon
        id="rotation-toggle-tip"
        text="Allow sprites to inherit a static rotation offset based on the slider below."
        label="Allow Rotation Offsets"
      />
    </div>
  </div>
</div>
```

**Rotation Amount Slider (Lines ~217-234):**
```typescript
{spriteState.rotationEnabled && (
  <div className="rotation-slider-wrapper" style={{ marginBottom: "1.5rem" }}>
    <ControlSlider
      id="rotation-amount"
      label="Rotation Amount"
      min={0}
      max={180}
      value={Math.round(spriteState.rotationAmount)}
      displayValue={`${Math.round(spriteState.rotationAmount)}°`}
      onChange={onRotationAmountChange}
      disabled={!ready}
      tooltip="Set the maximum angle sprites can rotate (distributed randomly, no animation)."
    />
  </div>
)}
```

**Key Points:**
- Toggle enables/disables rotation offsets
- Slider only appears when toggle is enabled
- Slider range: 0-180 degrees
- Value displayed in degrees (°)

---

### 3. `src/components/ControlPanel/MotionControls.tsx` - Rotation Animation UI

**Location:** `src/components/ControlPanel/MotionControls.tsx`  
**Purpose:** UI controls for rotation animation

**Animated Rotation Toggle (Lines ~80-100):**
```typescript
<div className="control-field">
  <div className="switch-row" style={{ gap: "0.75rem" }}>
    <Switch
      id="rotation-animated-toggle"
      checked={spriteState.rotationAnimated}
      onCheckedChange={onRotationAnimatedToggle}
      disabled={!ready}
      aria-labelledby="rotation-animated-toggle-label"
    />
    <div className="field-heading-left">
      <span className="field-label" id="rotation-animated-toggle-label">
        Animated Rotation
      </span>
      <TooltipIcon
        id="rotation-animated-toggle-tip"
        text="Enable continuous spinning animation for all sprites."
        label="Animated Rotation"
      />
    </div>
  </div>
</div>
```

**Rotation Speed Slider (Lines ~101-115):**
```typescript
{spriteState.rotationAnimated && (
  <ControlSlider
    id="rotation-speed"
    label="Rotation Speed"
    min={0}
    max={100}
    value={speedToUi(spriteState.rotationSpeed)}
    displayValue={`${speedToUi(spriteState.rotationSpeed)}%`}
    onChange={onRotationSpeedChange}
    disabled={!ready}
    tooltip="Control how fast sprites spin (each sprite rotates at a slightly different speed)."
  />
)}
```

**Key Points:**
- Toggle enables/disables rotation animation
- Slider only appears when toggle is enabled
- Slider uses conversion utility (`speedToUi`) for display
- Value displayed as percentage (%)

---

## Operations: Modify Rotation Behavior

### Changing Maximum Rotation Angle

**To adjust the maximum rotation offset:**

1. Open `src/generator.ts`
2. Find the constant (around line 14):
```typescript
const MAX_ROTATION_DEGREES = 180;  // Change this value
```

3. Update the slider max in `SpriteControls.tsx`:
```typescript
<ControlSlider
  id="rotation-amount"
  label="Rotation Amount"
  min={0}
  max={180}  // Change to match MAX_ROTATION_DEGREES
  // ...
/>
```

**Effects:**
- Lower value: Less rotation variation
- Higher value: More rotation variation (up to 360° for full rotation)

---

### Changing Rotation Speed Range

**To adjust the maximum rotation speed:**

1. Open `src/generator.ts`
2. Find the constant (around line 16):
```typescript
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.05;  // Change multiplier
```

**Effects:**
- Lower multiplier: Slower rotation at 100% speed
- Higher multiplier: Faster rotation at 100% speed

**Example:** To double the speed:
```typescript
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.1;  // Double the multiplier
```

---

### Changing Rotation Speed Variation

**To adjust how much rotation speed varies between sprites:**

1. Open `src/generator.ts`
2. Find the rotation speed multiplier calculation (around line 662):
```typescript
const rotationSpeedMultiplier = rotationSpeedBase > 0 ? (0.6 + positionRng() * 0.6) : 0;
```

3. Modify the range:
```typescript
// Current: 0.6 to 1.2 (0.6 + 0.6)
// To make variation smaller: 0.8 to 1.0 (0.8 + 0.2)
const rotationSpeedMultiplier = rotationSpeedBase > 0 ? (0.8 + positionRng() * 0.2) : 0;

// To make variation larger: 0.3 to 1.5 (0.3 + 1.2)
const rotationSpeedMultiplier = rotationSpeedBase > 0 ? (0.3 + positionRng() * 1.2) : 0;
```

**Effects:**
- Smaller range: More uniform rotation speeds
- Larger range: More varied rotation speeds

---

### Changing Rotation Direction Distribution

**To adjust the ratio of clockwise vs counter-clockwise rotation:**

1. Open `src/generator.ts`
2. Find the rotation direction calculation (around line 661):
```typescript
const rotationDirection = positionRng() > 0.5 ? 1 : -1;
```

3. Modify the threshold:
```typescript
// Current: 50/50 split
// To favor clockwise (75%): 0.25 threshold
const rotationDirection = positionRng() > 0.25 ? 1 : -1;

// To favor counter-clockwise (75%): 0.75 threshold
const rotationDirection = positionRng() > 0.75 ? 1 : -1;
```

**Effects:**
- Lower threshold: More clockwise rotation
- Higher threshold: More counter-clockwise rotation

---

## Data Flow & Dependencies

### How Rotation Flows Through the System

```
1. User adjusts rotation controls in UI
   ↓
2. SpriteControls/MotionControls call controller methods
   ↓
3. generator.ts updates state.rotationEnabled/rotationAmount/rotationAnimated/rotationSpeed
   ↓
4. computeSprite() calculates rotationBase and rotationSpeed per tile
   ↓
5. p.draw() recalculates rotation angle dynamically
   ↓
6. p.rotate() applies rotation to sprite
   ↓
7. Canvas displays rotated sprites
```

### Dependencies

- **Rotation offset system** → Independent from animation system
- **Rotation animation system** → Independent from offset system
- **Time accumulation** → Uses `scaledAnimationTime` for smooth rotation
- **Random number generator** → Used for per-sprite variation

---

## Code Examples

### Example: Uniform Rotation Speed

**Goal:** Make all sprites rotate at the same speed (no variation)

**Update Generator (`src/generator.ts`):**
```typescript
// Change from: (0.6 + positionRng() * 0.6) = 0.6 to 1.2
// To: 1.0 (no variation)
const rotationSpeedMultiplier = rotationSpeedBase > 0 ? 1.0 : 0;
```

**Result:** All sprites rotate at exactly the same speed when slider is at the same value.

---

### Example: Faster Maximum Rotation Speed

**Goal:** Double the maximum rotation speed

**Update Generator (`src/generator.ts`):**
```typescript
// Change from: (Math.PI / 2) * 0.05 ≈ 0.0785 rad/frame
// To: (Math.PI / 2) * 0.1 ≈ 0.157 rad/frame
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.1;
```

**Result:** At 100% speed, sprites rotate twice as fast.

---

### Example: All Sprites Rotate Same Direction

**Goal:** Make all sprites rotate clockwise

**Update Generator (`src/generator.ts`):**
```typescript
// Change from: positionRng() > 0.5 ? 1 : -1
// To: Always 1 (clockwise)
const rotationDirection = 1;
```

**Result:** All sprites rotate clockwise, no counter-clockwise rotation.

---

### Example: Rotation Only at Specific Angles

**Goal:** Sprites can only rotate to 0°, 90°, 180°, or 270°

**Update Generator (`src/generator.ts`):**
```typescript
// In computeSprite(), modify rotationBase calculation:
const rotationBaseMultiplier = rotationRange > 0 
  ? Math.floor(positionRng() * 4) / 3 - 0.5  // -0.5, -0.167, 0.167, 0.5
  : 0;
const rotationBase = rotationRange * rotationBaseMultiplier;

// Then snap to nearest 90° angle:
const snappedBase = Math.round(rotationBase / (Math.PI / 2)) * (Math.PI / 2);
```

**Result:** Sprites only appear at cardinal directions (0°, 90°, 180°, 270°).

---

## Testing & Verification

### Testing Checklist

After modifying rotation behavior:

- [ ] Rotation offset toggle works
- [ ] Rotation amount slider works (0-180°)
- [ ] Rotation offset applies correctly to sprites
- [ ] Rotation offset is static (no animation)
- [ ] Animated rotation toggle works
- [ ] Rotation speed slider works (0-100%)
- [ ] Rotation animation is smooth and continuous
- [ ] Rotation speed varies between sprites
- [ ] Sprites rotate in both directions (clockwise and counter-clockwise)
- [ ] Combined rotation (offset + animation) works correctly
- [ ] Rotation can be toggled without regenerating sprites
- [ ] No console errors
- [ ] TypeScript compilation succeeds

### Visual Testing

1. **Rotation Offset Testing:**
   - Enable "Allow Rotation Offsets"
   - Set "Rotation Amount" to 0° → Sprites should not be rotated
   - Set "Rotation Amount" to 90° → Sprites should be rotated up to 90°
   - Set "Rotation Amount" to 180° → Sprites should be rotated up to 180°
   - Verify sprites stay at fixed angles (no animation)

2. **Rotation Animation Testing:**
   - Enable "Animated Rotation"
   - Set "Rotation Speed" to 0% → Sprites should not rotate
   - Set "Rotation Speed" to 50% → Sprites should rotate at medium speed
   - Set "Rotation Speed" to 100% → Sprites should rotate at maximum speed
   - Verify rotation is smooth and continuous
   - Verify some sprites rotate faster/slower than others
   - Verify some sprites rotate clockwise, others counter-clockwise

3. **Combined Rotation Testing:**
   - Enable both rotation offset and animation
   - Verify sprites start at offset angle and continue rotating
   - Verify rotation is smooth and continuous

---

## Troubleshooting

### Problem: Rotation offset not applying

**Possible Causes:**
1. Toggle not enabled
2. State not updating
3. Rotation calculation error

**Solutions:**
1. Check "Allow Rotation Offsets" toggle is enabled
2. Check browser console for errors
3. Verify `rotationEnabled` state is true
4. Verify `rotationBase` calculation in `computeSprite()`

---

### Problem: Rotation animation not working

**Possible Causes:**
1. Toggle not enabled
2. Speed set to 0%
3. Animation time not accumulating

**Solutions:**
1. Check "Animated Rotation" toggle is enabled
2. Check "Rotation Speed" slider is > 0%
3. Verify `rotationAnimated` state is true
4. Verify `scaledAnimationTime` is accumulating
5. Check rotation calculation in `p.draw()`

---

### Problem: Rotation is jittery or not smooth

**Possible Causes:**
1. Frame rate too low
2. Time accumulation issue
3. Rotation calculation error

**Solutions:**
1. Check frame rate (should be 60 FPS)
2. Verify `scaledAnimationTime` is accumulating smoothly
3. Check rotation calculation uses radians, not degrees
4. Verify `p.rotate()` is called before drawing shape

---

### Problem: All sprites rotate at same speed

**Possible Causes:**
1. Speed multiplier not varying
2. Calculation error

**Solutions:**
1. Check `rotationSpeedMultiplier` calculation
2. Verify random number generator is working
3. Check that multiplier range is correct (0.6 to 1.2)

---

## Best Practices

### Rotation Offset Guidelines

1. **Maximum Angle**: 180° is a good maximum (allows full range without redundancy)
2. **Random Distribution**: Uniform distribution (-1 to 1 multiplier) works well
3. **Toggle Behavior**: Can be toggled without regenerating sprites (good UX)

### Rotation Animation Guidelines

1. **Speed Range**: Current range (0.6-1.2x multiplier) provides good variation
2. **Maximum Speed**: ~4.5°/s at 100% is a good balance (not too fast, not too slow)
3. **Direction Mix**: 50/50 split between clockwise/counter-clockwise looks natural
4. **Smooth Accumulation**: Use `scaledAnimationTime` for frame-rate independent rotation

### Performance Considerations

1. **Dynamic Recalculation**: Rotation is recalculated each frame (no regeneration needed)
2. **Efficient Math**: Use radians for calculations, convert to degrees only for display
3. **Minimal Overhead**: Rotation calculation is fast, no performance impact

### User Experience

1. **Clear Controls**: Separate toggles for offset and animation
2. **Visual Feedback**: Immediate canvas updates show rotation changes
3. **Tooltips**: Clear tooltips explain what each control does
4. **Independent Systems**: Offset and animation work independently (can use one or both)

---

## Summary

The rotation system in BitLab provides:
- **Two Independent Systems**: Static offsets and animated rotation
- **Flexible Control**: Adjust rotation angle and speed independently
- **Per-Sprite Variation**: Each sprite has unique rotation properties
- **Smooth Animation**: Frame-rate independent rotation accumulation
- **No Regeneration**: Rotation can be toggled without regenerating sprites

**Key Files:**
- `src/generator.ts` - Core rotation calculation and rendering
- `src/components/ControlPanel/SpriteControls.tsx` - Rotation offset UI
- `src/components/ControlPanel/MotionControls.tsx` - Rotation animation UI

**Key Constants:**
- `MAX_ROTATION_DEGREES` - Maximum rotation offset (180°)
- `ROTATION_SPEED_MAX` - Maximum rotation speed (~4.5°/s)

The system automatically handles:
- Per-sprite rotation variation
- Smooth time accumulation
- Dynamic recalculation (no regeneration needed)
- Direction randomization

