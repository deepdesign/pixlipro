---
name: Parallax Effect Refactor
overview: Refactor parallax from a movement mode into a toggleable effect that can be applied to any movement mode with position changes. The effect will scale animation speed and amplitude based on sprite size (depth), with optional continuous movement (spawn/despawn) for linear modes.
todos: []
---

# Para

llax Effect Refactor Plan

## Overview

Convert parallax from a standalone `MovementMode` into a toggleable enhancement effect (similar to rotation) that can be applied to any movement mode with position changes. The effect scales animation speed and amplitude based on sprite size to create depth perception.

## Architecture Changes

### 1. State Management (`src/generator.ts`)

**Add new state fields to `GeneratorState`:**

- `parallaxEnabled: boolean` - Toggle parallax effect on/off
- `parallaxAngle: number` - Movement direction angle (0-360°, only used for linear modes with continuous movement)
- `parallaxDepthEffect: number` - Speed difference between foreground/background (0-100)
- `parallaxContinuousMovement: boolean` - Enable spawn/despawn for linear modes (separate toggle)

**Remove from state:**

- Keep `parallaxAngle` and `parallaxDepthEffect` (reused for effect)
- Remove `parallax` from `MovementMode` type (or keep for backward compatibility initially)

**Update `DEFAULT_STATE`:**

```typescript
parallaxEnabled: false,
parallaxAngle: 0,
parallaxDepthEffect: 50,
parallaxContinuousMovement: false,
```



### 2. Movement Mode Filtering

**Create helper function to determine if mode supports parallax:**

```typescript
const MOVEMENT_MODES_WITH_POSITION = [
  "pulse-meander", "drift", "ripple", "zigzag", "cascade", 
  "spiral", "comet", "linear", "isometric", "triangular"
] as const;

function supportsParallax(mode: MovementMode): boolean {
  return MOVEMENT_MODES_WITH_POSITION.includes(mode as any);
}
```

**Exclude "pulse"** (no position movement, only scale)

### 3. Parallax Effect Application (`src/generator.ts`)

**Modify `computeMovementOffsets` to accept parallax parameters:**

```typescript
const computeMovementOffsets = (
  mode: MovementMode,
  data: {
    // ... existing params
    parallaxEnabled?: boolean;
    parallaxDepth?: number; // 0-1, from sprite scale
    parallaxDepthEffect?: number; // 0-100
    parallaxAngle?: number; // For linear modes with continuous movement
  }
): { offsetX: number; offsetY: number; scaleMultiplier: number }
```

**Apply parallax scaling within each movement mode case:**

- Calculate `depthSpeedMultiplier` from `parallaxDepth` and `parallaxDepthEffect`
- For oscillating modes: scale both `speedFactor` (time multiplier) AND amplitude (distance multipliers)
- For linear modes: if `parallaxContinuousMovement` is true, use angle-based direction; otherwise scale existing oscillation

**Example for drift mode:**

```typescript
case "drift": {
  let driftX = Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 0.8;
  let driftY = Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 0.9;
  
  // Apply parallax if enabled
  if (data.parallaxEnabled && data.parallaxDepth !== undefined) {
    const depthEffect = (data.parallaxDepthEffect ?? 50) / 100;
    const slowestMultiplier = 1.0 - depthEffect * 0.99; // 0.01 to 1.0
    const fastestMultiplier = 1.0;
    const depthSpeedMultiplier = slowestMultiplier + data.parallaxDepth * (fastestMultiplier - slowestMultiplier);
    
    // Scale speed (affects phased calculation)
    const parallaxSpeedFactor = depthSpeedMultiplier;
    // Scale amplitude (affects distance)
    const parallaxAmplitudeFactor = depthSpeedMultiplier;
    
    driftX *= parallaxAmplitudeFactor;
    driftY *= parallaxAmplitudeFactor;
    // Note: phased already includes speedFactor, so we'd need to adjust time calculation
  }
  
  const scaleMultiplier = clampScale(1 + Math.sin(phased * 0.016) * motionScale * 0.25);
  return { offsetX: driftX, offsetY: driftY, scaleMultiplier };
}
```

**Challenge:** Need to apply speed scaling to `phased` calculation, which happens before mode-specific code. May need to pass adjusted `phased` or apply speed multiplier within each case.

### 4. Linear Modes with Continuous Movement

**For linear, isometric, triangular modes when `parallaxContinuousMovement` is true:**

- Use world position tracking (like current parallax mode)
- Apply `parallaxAngle` for direction
- Use `stepSprite` from `parallax-math-robust.ts` for spawn/despawn
- Store positions in `parallaxPositions` Map (reuse existing)

**In draw loop (`src/generator.ts` ~line 3427):**

```typescript
// Check if parallax effect is enabled AND continuous movement is enabled for linear modes
const isLinearMode = ["linear", "isometric", "triangular"].includes(currentState.movementMode);
const useContinuousMovement = currentState.parallaxEnabled && 
                              currentState.parallaxContinuousMovement && 
                              isLinearMode;

if (useContinuousMovement) {
  // Use world position tracking and spawn/despawn logic
  // Similar to current parallax mode implementation
  // Apply parallaxAngle for direction
  // Use stepSprite for movement
} else {
  // Use standard computeMovementOffsets with parallax scaling applied
  movement = computeMovementOffsets(currentState.movementMode, {
    // ... existing params
    parallaxEnabled: currentState.parallaxEnabled,
    parallaxDepth: tile.parallaxDepth,
    parallaxDepthEffect: currentState.parallaxDepthEffect,
  });
}
```



### 5. Z-Ordering

**When parallax is enabled, sort tiles by depth before rendering:**

```typescript
const tilesToRender = currentState.parallaxEnabled
  ? [...layer.tiles].sort((a, b) => (a.parallaxDepth ?? 0.5) - (b.parallaxDepth ?? 0.5))
  : layer.tiles;
```

**Move this logic** from parallax-mode-specific to parallax-effect-specific.

### 6. Sprite Depth Calculation

**Keep existing depth calculation** (based on scale):

```typescript
const parallaxDepth = state.parallaxEnabled 
  ? clamp((scale - MIN_TILE_SCALE) / (MAX_TILE_SCALE - MIN_TILE_SCALE), 0, 1)
  : undefined;
```

**Apply to all sprites when parallax is enabled**, not just parallax mode.

### 7. UI Changes (`src/components/ControlPanel/MotionControls.tsx`)

**Add new "Parallax Effect" section** (similar to rotation section):

- Toggle switch: "Enable parallax effect"
- Conditional rendering: Only show when current mode supports parallax
- Angle slider: "Parallax angle" (0-360°, with 45° snap toggle)
- Depth effect slider: "Depth effect" (0-100%)
- Continuous movement toggle: "Continuous movement" (only shown for linear/isometric/triangular modes)

**Structure:**

```typescript
{supportsParallax(spriteState.movementMode) && (
  <div className="control-section">
    <h3>Parallax Effect</h3>
    <Switch 
      id="parallax-enabled"
      checked={spriteState.parallaxEnabled ?? false}
      onCheckedChange={(checked) => controller?.setParallaxEnabled(checked)}
    />
    {spriteState.parallaxEnabled && (
      <>
        <ControlSlider id="parallax-angle" ... />
        <ControlSlider id="parallax-depth-effect" ... />
        {["linear", "isometric", "triangular"].includes(spriteState.movementMode) && (
          <Switch id="parallax-continuous" ... />
        )}
      </>
    )}
  </div>
)}
```

**Remove parallax-specific controls** from movement mode section (they move to parallax effect section).

### 8. Controller Methods (`src/generator.ts`)

**Add new controller methods:**

```typescript
setParallaxEnabled: (enabled: boolean) => {
  applyState({ parallaxEnabled: enabled }, { recompute: true });
},
setParallaxAngle: (angle: number) => {
  const clampedAngle = ((angle % 360) + 360) % 360;
  applyState({ parallaxAngle: clampedAngle }, { recompute: false });
},
setParallaxDepthEffect: (value: number) => {
  applyState({ parallaxDepthEffect: clamp(value, 0, 100) }, { recompute: false });
},
setParallaxContinuousMovement: (enabled: boolean) => {
  applyState({ parallaxContinuousMovement: enabled }, { recompute: true });
},
```



### 9. Backward Compatibility

**Migration strategy:**

- If old state has `movementMode === "parallax"`, automatically:
- Set `movementMode` to "drift" (or user's last non-parallax mode)
- Set `parallaxEnabled` to `true`
- Set `parallaxContinuousMovement` to `true`
- Preserve `parallaxAngle` and `parallaxDepthEffect` values

**In `applyState` or state initialization:**

```typescript
if (state.movementMode === "parallax") {
  state.movementMode = "drift"; // or get from history
  state.parallaxEnabled = true;
  state.parallaxContinuousMovement = true;
}
```



### 10. Testing Considerations

**Test cases:**

- Parallax effect with each movement mode (except pulse)
- Continuous movement toggle for linear modes
- Angle changes for continuous movement
- Depth effect slider at various values
- Z-ordering (smaller sprites behind larger)
- Spawn/despawn for continuous movement
- Backward compatibility with old parallax mode

## Implementation Order

1. **Phase 1: State & Types**

- Add new state fields
- Update types
- Add controller methods

2. **Phase 2: Core Logic**

- Modify `computeMovementOffsets` to accept parallax params
- Apply parallax scaling to each movement mode
- Implement continuous movement for linear modes

3. **Phase 3: UI**

- Add parallax effect section to MotionControls
- Remove parallax from movement mode selector (or keep for migration)
- Add conditional rendering

4. **Phase 4: Cleanup**

- Remove parallax mode-specific code
- Add backward compatibility migration
- Update documentation

## Potential Issues

1. **Speed scaling complexity**: Applying depth-based speed to `phased` calculation may require refactoring time calculation in each mode.
2. **Amplitude scaling**: Some modes use multiple amplitude calculations - need to scale all consistently.
3. **Continuous movement integration**: Reusing spawn/despawn logic for linear modes requires careful integration with existing movement calculations.
4. **Performance**: Sorting tiles by depth on every frame when parallax is enabled (already done for parallax mode, so no new cost).
5. **Mode compatibility**: Some modes might not work well with parallax (e.g., spiral might look odd with depth-based speed). User can disable if needed.

## Files to Modify

- `src/generator.ts` - Core logic, state, controller methods
- `src/components/ControlPanel/MotionControls.tsx` - UI controls