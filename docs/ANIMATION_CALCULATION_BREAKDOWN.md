# Animation Calculation Breakdown

## Summary

- **Math-based animations (Default)**: 11 animations
- **Path-based animations (Custom)**: 0 (not yet implemented - Phase 3+)

All current animations use mathematical functions to calculate position offsets and scale multipliers in real-time.

---

## Default Animations (Math-Based)

All 11 default animations are calculated using mathematical functions in `computeMovementOffsets()` in `src/generator.ts`. Each animation uses trigonometric functions (sine, cosine) and other mathematical operations to create movement patterns.

### 1. **Pulse** (`pulse`)
- **Type**: Math-based (sine wave)
- **Calculation**:
  - Uses `Math.sin(phased * 0.08)` for smooth pulsing
  - Applies pulse to **scale only** (no position movement)
  - Scale multiplier: `1 + pulse * 0.55` (clamped to min 0.35)
  - **No X/Y movement** - sprites stay in place and pulse in/out

### 2. **Pulse Meander** (`pulse-meander`)
- **Type**: Math-based (sine/cosine waves)
- **Calculation**:
  - Combines pulse scale animation with meandering movement
  - Pulse: `Math.sin(phased * 0.08)` for scale
  - Meander X: `Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 0.55`
  - Meander Y: `Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 0.6`
  - Different frequencies for X and Y create organic wandering motion

### 3. **Drift** (`drift`)
- **Type**: Math-based (sine/cosine waves)
- **Calculation**:
  - Gentle floating motion using sine/cosine
  - X: `Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 0.45`
  - Y: `Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 0.5`
  - Scale: `1 + Math.sin(phased * 0.016) * motionScale * 0.16`

### 4. **Ripple** (`ripple`)
- **Type**: Math-based (sine/cosine waves with layer-based wave propagation)
- **Calculation**:
  - Wave-like motion that propagates through layers
  - Wave: `Math.sin(phased * 0.04 + layerIndex * 0.6)`
  - Radius: `baseUnit * (0.6 + motionScale * 0.9)`
  - X: `Math.cos(phase * 1.2 + phased * 0.015) * radius * wave * 0.35`
  - Y: `Math.sin(phase * 1.35 + phased * 0.02) * radius * wave * 0.35`
  - Scale varies with wave amplitude

### 5. **Zigzag** (`zigzag`)
- **Type**: Math-based (triangular wave + sine)
- **Calculation**:
  - Angular back-and-forth motion using triangular wave
  - Triangular wave: `(2 / Math.PI) * Math.asin(Math.sin(zig))`
  - Sweep: `Math.sin(zig * 1.35)`
  - X: `tri * layerTileSize * 0.35 * motionScale + sweep * baseUnit * 0.2 * motionScale`
  - Y: `Math.sin(zig * 0.9 + layerIndex * 0.4 + phase * 0.4) * layerTileSize * 0.22 * motionScale`
  - Scale: `1 + Math.cos(zig * 1.1) * 0.18 * motionScale`

### 6. **Cascade** (`cascade`)
- **Type**: Math-based (sine/cosine waves with downward drift)
- **Calculation**:
  - Flowing downward motion
  - Wave: `Math.sin(cascadeTime)`
  - Drift: `(1 - Math.cos(cascadeTime)) * 0.5` (creates downward flow)
  - Y: `(drift * 2 - 1) * layerTileSize * 0.4 * (1 + layerIndex * 0.12) * motionScale`
  - X: `wave * baseUnit * 0.3 * motionScale`
  - Scale varies with cascade time

### 7. **Spiral Orbit** (`spiral`)
- **Type**: Math-based (polar coordinates - cosine/sine)
- **Calculation**:
  - Circular spiral motion using polar coordinates
  - Radius: `baseUnit * (0.45 + layerIndex * 0.15 + motionScale * 0.85)`
  - Angle: `phased * (0.04 + layerIndex * 0.02)`
  - Spiral factor: `1 + Math.sin(angle * 0.5) * 0.25` (expanding/contracting)
  - X: `Math.cos(angle) * radius * spiralFactor`
  - Y: `Math.sin(angle) * radius * spiralFactor`
  - Scale: `1 + Math.cos(angle * 0.7) * motionScale * 0.25`

### 8. **Comet Trail** (`comet`)
- **Type**: Math-based (orbital path with tail effect)
- **Calculation**:
  - Trailing motion effect with orbital path
  - Path length: `layerTileSize * (0.85 + layerIndex * 0.28 + motionScale * 1.2)`
  - Travel: `phased * (0.035 + layerIndex * 0.01)`
  - Orbital: `travel + phase`
  - Tail: `(Math.sin(travel * 0.9 + phase * 0.6) + 1) * 0.5` (0-1 range)
  - X: `Math.cos(orbital) * pathLength`
  - Y: `Math.sin(orbital * 0.75) * pathLength * 0.48`
  - Scale: `0.65 + tail * motionScale * 0.55` (creates trailing effect)

### 9. **Linear** (`linear`)
- **Type**: Math-based (straight-line motion at fixed angles)
- **Calculation**:
  - Straight-line motion in 8 directions (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
  - Direction: Based on phase, picks from 8 angles
  - Parallax: Speed relative to sprite size (smaller sprites move slower)
  - Oscillation: `Math.sin(phased * 0.04 + phase * 0.1)` for smooth back-and-forth
  - Travel: `oscillation * maxDistance`
  - X: `Math.cos(angle) * travel`
  - Y: `Math.sin(angle) * travel`
  - **No scale variation**

### 10. **Isometric** (`isometric`)
- **Type**: Math-based (hexagonal grid pattern)
- **Calculation**:
  - Hexagonal grid motion pattern
  - Uses 4 angled edges of a hexagon: 30°, 150°, 210°, 330°
  - Direction: Based on phase, picks from 4 hexagon edge angles
  - Parallax: Speed relative to sprite size
  - Oscillation: `Math.sin(phased * 0.04)` for smooth motion
  - Travel: `oscillation * maxDistance`
  - X: `Math.cos(angle) * travel`
  - Y: `Math.sin(angle) * travel`
  - **No scale variation**

### 11. **Triangular** (`triangular`)
- **Type**: Math-based (triangular edge pattern)
- **Calculation**:
  - Triangular edge movement pattern
  - Uses 3 edges of equilateral triangle: 120° (left), 0° (bottom), 60° (right)
  - Direction: Based on phase, picks from 3 triangle edge angles
  - Parallax: Speed relative to sprite size
  - Oscillation: `Math.sin(phased * 0.04)` for smooth motion
  - Travel: `oscillation * maxDistance`
  - X: `Math.cos(angle) * travel`
  - Y: `Math.sin(angle) * travel`
  - **No scale variation**

---

## Custom Animations (Path-Based) - Not Yet Implemented

Custom animations will use **path-based** calculations when Phase 3+ is implemented:

- **Path Types**: `linear`, `bezier`, `spline`, `custom`
- **Path Points**: Defined with X/Y coordinates and optional bezier control points
- **Keyframes**: Animation properties (rotation, scale, opacity) at specific time points
- **Easing Functions**: `linear`, `ease-in`, `ease-out`, `ease-in-out`, `bezier`

Currently, custom animations fall back to "pulse" movement mode until the path system is implemented.

---

## How Animations Are Applied

1. **Default Animations**: 
   - Map to `MovementMode` values
   - Calculated in real-time using `computeMovementOffsets()`
   - Each sprite gets position offsets (X, Y) and scale multiplier per frame
   - Uses `time`, `phase`, `motionScale`, `layerIndex`, and `baseUnit` as inputs

2. **Custom Animations** (Future):
   - Will use `AnimationPath` with `PathPoint[]` to define movement
   - Interpolated along the path based on animation time
   - Keyframes will control rotation, scale, and opacity at specific times
   - Bezier curves will provide smooth path interpolation

---

## Technical Details

### Input Parameters for `computeMovementOffsets()`:
- `time`: Current animation time (scaled by speed)
- `phase`: Per-sprite phase offset (for variation)
- `motionScale`: Motion intensity (0-1.5)
- `layerIndex`: Layer number (0, 1, or 2)
- `baseUnit`: Base sprite size unit
- `layerTileSize`: Base tile size for the layer
- `speedFactor`: Speed multiplier

### Output:
- `offsetX`: X position offset from base position
- `offsetY`: Y position offset from base position
- `scaleMultiplier`: Scale multiplier (applied to sprite size)

---

## Current Status

- ✅ **11 Math-based animations** (all default animations)
- ❌ **0 Path-based animations** (custom path system not yet implemented)
- 📝 **Custom animations** currently use fallback "pulse" mode until Phase 3+ is complete

