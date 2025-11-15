# Animation Speed Normalization Strategy (Current Implementation)

## Summary

Animation speeds are now normalized across movement modes by applying per-mode speed multipliers inside the `p.draw` loop of `src/generator.ts`. These multipliers are tuned so that every mode feels balanced when the UI slider is set to the same value, while still preserving each mode's character. Additional smoothing keeps animation changes responsive without “jiggling” when the slider is adjusted.

## Why Normalization Was Needed

Each movement mode (e.g. `sway`, `spiral`, `drift`) relies on different internal time coefficients. Before normalization this meant, for example, that:

- `drift` barely moved at 100% speed,
- `wavefront` and `spiral` were far faster than expected at the same slider position, and
- switching modes created sharp perceived jumps in motion.

Normalizing ensures 100% feels like the same “energy” level across modes, so the slider delivers predictable results.

## Implemented Approach

### 1. Mode-Specific Multipliers

We introduced a `MOVEMENT_SPEED_MULTIPLIERS` map tuned through testing:

```ts
const MOVEMENT_SPEED_MULTIPLIERS: Record<MovementMode, number> = {
  sway: 2.0,
  drift: 1.625,
  cascade: 2.9,
  comet: 3.0,
  ripple: 3.25,
  spiral: 4.4,
  orbit: 1.1,
  zigzag: 2.2,
  pulse: 1.6,
  wavefront: 10.0,
};
```

Higher values indicate modes that were previously too fast (e.g. `wavefront`, `spiral`). Lower values belong to modes that needed a boost (e.g. `drift`, `orbit`).

### 2. Applying Multipliers in `p.draw`

Inside the render loop we take the player-facing slider value, convert it to the internal speed range (0–12.5) and divide by the multiplier for the active mode:

```ts
const modeSpeedMultiplier =
  MOVEMENT_SPEED_MULTIPLIERS[state.movementMode] ?? 1.0;
const baseSpeedFactor = Math.max(state.motionSpeed / MOTION_SPEED_MAX_INTERNAL, 0);
targetSpeedFactor = baseSpeedFactor / modeSpeedMultiplier;
```

Dividing ensures a larger multiplier slows the mode down, while smaller multipliers make slower modes livelier.

### 3. Responsive, Smooth Speed Changes

- Animation time accumulates continuously and we lerp (`0.95` factor) towards the new `targetSpeedFactor`.  
- An average speed factor per frame keeps transitions fast but prevents visual jumps.  
- The slider itself maps 0–100% in the UI to 0–12.5 internally, matching recent UX decisions.

Together these changes remove the “jiggle” reported previously when tweaking the slider mid-animation.

## Validation Checklist

1. **Consistency:** At 100% slider value all modes now move with similar perceived velocity.
2. **Range:** `drift` and `orbit` finally feel responsive, while `wavefront`, `spiral`, and `comet` slowed to controllable speeds.
3. **Smoothing:** Rapid slider changes no longer cause sprite jumps or restarts.
4. **Interaction:** The normalization respects fullscreen HUD controls and works with HUD auto-hide logic.

## Future Tweaks

- Values can still be fine-tuned with user feedback; the map is centrally defined for quick adjustments.
- Advanced settings could expose per-mode multipliers for power users.
- A “Normalize Speeds” toggle could restore legacy behaviour if ever requested.

## Related Enhancements

To address modes that appeared visually sparse even after speed normalization, we also introduced `MOVEMENT_SCALE_MULTIPLIERS` (see `generator.ts`) so large-radius patterns like `spiral` and `orbit` render larger sprites and better fill the canvas.

---

**Reference Files**

- `src/generator.ts` (animation timing, movement multipliers, smoothing logic)
- `src/App.tsx` (UI slider scaling and HUD controls)

