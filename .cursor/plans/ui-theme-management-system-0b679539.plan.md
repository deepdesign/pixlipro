<!-- 0b679539-ee9e-4ad4-9282-01b5de414acd b929380e-42ee-40fe-b538-1bee1c74963d -->
# Pixelation and Color Quantization Effects

## Overview

Add a new "Pixelation" section to the FX controls panel with two separate effects:

1. **Pixelation**: Reduces canvas resolution by grouping pixels into blocks (retro game aesthetic)
2. **Color Quantization**: Reduces color palette to 8-bit or 16-bit color depth

These effects will be applied to the canvas after bloom but before noise/grain effects.

## Implementation Plan

### 1. Add State Management

**File**: `src/generator.ts`

- Add pixelation fields to `GeneratorState` interface (after noise settings):
  - `pixelationEnabled: boolean`
  - `pixelationSize: number` // 1-50 pixels (block size)
  - `colorQuantizationEnabled: boolean`
  - `colorQuantizationBits: number` // 4, 8, 16, or 24 (bit depth)
- Add defaults to `DEFAULT_STATE`:
  - `pixelationEnabled: false`
  - `pixelationSize: 4` // Default 4px blocks
  - `colorQuantizationEnabled: false`
  - `colorQuantizationBits: 8` // Default 8-bit

### 2. Create Pixelation Utility Functions

**File**: `src/lib/utils/fxPixelation.ts` (NEW)

Create utility functions for pixelation and color quantization:

- `applyPixelation(canvas: HTMLCanvasElement, blockSize: number): HTMLCanvasElement`
  - Downscale canvas by blockSize, then upscale back to original size
  - Uses `imageSmoothingEnabled: false` for crisp pixel blocks
  - Algorithm:

    1. Create temporary canvas at reduced resolution (width/blockSize, height/blockSize)
    2. Draw source canvas scaled down to temp canvas
    3. Draw temp canvas scaled up back to original canvas
    4. Disable image smoothing for both operations

- `applyColorQuantization(canvas: HTMLCanvasElement, bits: number): HTMLCanvasElement`
  - Reduce color depth by quantizing RGB values
  - Algorithm:

    1. Calculate color levels: `levels = Math.pow(2, bits / 3)` per channel (or use bit depth directly)
    2. For 8-bit: 256 colors total (6 bits red, 6 bits green, 6 bits blue = 64 levels per channel)
    3. For 16-bit: 65536 colors (5 bits red, 6 bits green, 5 bits blue = 32/64/32 levels)
    4. For 4-bit: 16 colors (4 levels per channel)
    5. Quantize each pixel: `Math.round(value / step) * step` where `step = 255 / (levels - 1)`
    6. Apply quantization to ImageData and put back to canvas

- `applyPixelationEffects(canvas: HTMLCanvasElement, pixelationSize: number, colorQuantizationBits: number | null): HTMLCanvasElement`
  - Apply both effects in sequence (pixelation first, then quantization if enabled)
  - Returns modified canvas

### 3. Add Controller Methods

**File**: `src/generator.ts`

Add methods to `SpriteController` interface:

- `setPixelationEnabled(enabled: boolean): void`
- `setPixelationSize(size: number): void`
- `setColorQuantizationEnabled(enabled: boolean): void`
- `setColorQuantizationBits(bits: number): void`

Implement in controller object (around line 4120, after noise methods):

- All use `applyState` with `{ recompute: false }` (effects are post-processing)
- Clamp `pixelationSize` to 1-50
- Clamp `colorQuantizationBits` to valid values (4, 8, 16, 24)

### 4. Apply Effects in Draw Function

**File**: `src/generator.ts` (in `p.draw` function, around line 3440)

Apply pixelation effects after bloom but before noise:

```typescript
// Apply Pixelation effects if enabled (after bloom, before noise)
if ((currentState.pixelationEnabled || currentState.colorQuantizationEnabled) && hasCanvas(p5Instance)) {
  const canvas = p5Instance.canvas as HTMLCanvasElement;
  if (canvas) {
    const pixelationSize = currentState.pixelationEnabled ? currentState.pixelationSize : 1;
    const quantizationBits = currentState.colorQuantizationEnabled ? currentState.colorQuantizationBits : null;
    applyPixelationEffects(canvas, pixelationSize, quantizationBits);
  }
}
```

### 5. Add UI Controls

**File**: `src/components/ControlPanel/FxControls.tsx`

Add new "Pixelation" section after Noise/Grain section (around line 200):

```typescript
{/* Pixelation Section */}
<div className="section section--spaced">
  <hr className="section-divider border-t" />
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <TextWithTooltip
        id="pixelation-tip"
        text="Apply pixelation and color quantization for retro 8-bit/16-bit effects."
      >
        <h3 className="section-title">Pixelation</h3>
      </TextWithTooltip>
    </div>
  </div>
  
  {/* Pixelation Size Slider */}
  <ControlSlider
    id="pixelation-size"
    label="Pixelation Size"
    min={1}
    max={50}
    value={Math.round(spriteState.pixelationSize)}
    displayValue={`${Math.round(spriteState.pixelationSize)}px`}
    onChange={(value) => controller?.setPixelationSize(value)}
    disabled={!ready || !spriteState.pixelationEnabled}
    tooltip="Size of pixel blocks. Higher values create more blocky, retro look."
  />
  <div className="flex items-center justify-between gap-2 mt-2">
    <label htmlFor="pixelation-enabled" className="text-sm text-theme-secondary">
      Enable Pixelation
    </label>
    <Switch
      id="pixelation-enabled"
      checked={spriteState.pixelationEnabled}
      onCheckedChange={(checked) => controller?.setPixelationEnabled(checked)}
      disabled={!ready}
      aria-label="Enable pixelation"
    />
  </div>
  
  {/* Color Quantization Slider */}
  <ControlSlider
    id="color-quantization-bits"
    label="Color Depth"
    min={4}
    max={24}
    step={4}
    value={spriteState.colorQuantizationBits}
    displayValue={`${spriteState.colorQuantizationBits}-bit`}
    onChange={(value) => controller?.setColorQuantizationBits(value)}
    disabled={!ready || !spriteState.colorQuantizationEnabled}
    tooltip="Reduce color palette depth. Lower values (4-bit, 8-bit) create retro game aesthetic."
  />
  <div className="flex items-center justify-between gap-2 mt-2">
    <label htmlFor="color-quantization-enabled" className="text-sm text-theme-secondary">
      Enable Color Quantization
    </label>
    <Switch
      id="color-quantization-enabled"
      checked={spriteState.colorQuantizationEnabled}
      onCheckedChange={(checked) => controller?.setColorQuantizationEnabled(checked)}
      disabled={!ready}
      aria-label="Enable color quantization"
    />
  </div>
</div>
```

### 6. Export Utility Functions

**File**: `src/lib/utils/index.ts`

Add export:

```typescript
export { applyPixelationEffects, applyPixelation, applyColorQuantization } from "./fxPixelation";
```

### 7. Update Type Exports

**File**: `src/types/generator.ts` (if it exists) or ensure `GeneratorState` is exported from `src/generator.ts`

Ensure the updated `GeneratorState` interface is properly exported.

## Technical Notes

- **Pixelation Algorithm**: Uses canvas downscaling/upscaling with `imageSmoothingEnabled: false` for crisp pixel blocks. This is more performant than manual pixel averaging.
- **Color Quantization**: Uses ImageData manipulation for precise color reduction. The quantization formula ensures even distribution of color levels.
- **Performance**: Both effects operate on the final canvas, so they're post-processing effects that don't affect sprite computation. They should be fast enough for real-time preview.
- **Order of Operations**: Pixelation → Color Quantization → Noise/Grain (pixelation should happen before quantization to avoid artifacts)

## Testing Checklist

- [ ] Pixelation slider creates blocky pixel effect
- [ ] Color quantization reduces color palette correctly
- [ ] Both effects can be enabled independently
- [ ] Effects work together (pixelation + quantization)
- [ ] Effects don't impact performance significantly
- [ ] Effects persist when switching scenes/presets
- [ ] Default state has effects disabled
- [ ] Sliders are disabled when effects are off
- [ ] Tooltips provide helpful descriptions

### To-dos

- [x] Update ProjectorPage to create its own sprite controller instead of just displaying streamed frames
- [x] Sync projector window sprite controller state with main window via BroadcastChannel
- [x] Create themeStorage.ts with CustomTheme interface and CRUD functions
- [x] Create tailwindColors.ts with color maps for primary and accent colors
- [x] Create themeBuilder.ts to generate ThemeDefinition from color names
- [x] Update slate.ts default theme to use teal instead of mint green
- [x] Create themeApplier.ts to apply themes dynamically via CSS injection
- [x] Create ThemeTab.tsx component with theme list and management UI
- [x] Create ThemeModal.tsx for creating/editing themes
- [x] Add theme section to SettingsPage.tsx
- [x] Add theme item to SettingsSidebar.tsx
- [x] Initialize default theme on app load
- [x] Apply active theme on app initialization