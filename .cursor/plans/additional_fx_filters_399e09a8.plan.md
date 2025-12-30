---
name: Additional FX Filters
overview: Add new visual effect filters to the FX panel, focusing on performance-friendly implementations. Includes crosshatching, halftone, and canvas 2D context filters (grayscale, sepia, contrast, brightness, invert, posterize). All filters use efficient canvas operations to maintain 60fps.
todos:
  - id: add-canvas-filter-state
    content: Add canvasFilterEnabled, canvasFilterType, and canvasFilterAmount to GeneratorState
    status: completed
  - id: implement-canvas-filters
    content: Implement canvas 2D context filters (grayscale, sepia, contrast, brightness, saturate, invert, hue-rotate) in render loop
    status: completed
    dependencies:
      - add-canvas-filter-state
  - id: add-canvas-filter-ui
    content: Add Canvas Filters section to FxControls with type selector and amount slider
    status: completed
    dependencies:
      - implement-canvas-filters
  - id: add-crosshatch-state
    content: Add crosshatch state properties (enabled, type, angle, spacing, opacity) to GeneratorState
    status: completed
  - id: implement-crosshatch
    content: Create fxCrosshatch.ts utility to generate diagonal line patterns and overlay on canvas
    status: completed
    dependencies:
      - add-crosshatch-state
  - id: add-crosshatch-ui
    content: Add Crosshatching section to FxControls with type, angle, spacing, and opacity controls
    status: completed
    dependencies:
      - implement-crosshatch
  - id: add-halftone-state
    content: Add halftone state properties (enabled, dotSize, spacing, angle, shape) to GeneratorState
    status: completed
  - id: implement-halftone
    content: Create fxHalftone.ts utility to convert image to halftone dots with optimized pixel processing
    status: completed
    dependencies:
      - add-halftone-state
  - id: add-halftone-ui
    content: Add Halftone section to FxControls with dot size, spacing, angle, and shape controls
    status: completed
    dependencies:
      - implement-halftone
  - id: add-posterize-threshold-state
    content: Add posterize and threshold state properties to GeneratorState
    status: completed
  - id: implement-posterize-threshold
    content: Create fxPosterize.ts utility for posterize and threshold effects
    status: completed
    dependencies:
      - add-posterize-threshold-state
  - id: add-posterize-threshold-ui
    content: Add Posterize and Threshold sections to FxControls
    status: completed
    dependencies:
      - implement-posterize-threshold
---

# Additi

onal FX Filters

## Overview

Add new visual effect filters to enhance the artistic capabilities of the application. Focus on performance-friendly implementations that maintain 60fps using efficient canvas 2D context operations and optimized pixel manipulation.

## Current FX Filters

From `src/components/ControlPanel/FxControls.tsx`:

- **Depth of Field**: Blur based on sprite distance
- **Bloom**: Glowing effect on bright areas
- **Noise & Grain**: Film grain, CRT, Bayer dither, static, scanlines
- **Pixelation**: Retro game aesthetic with optional grid
- **Color Quantization**: Reduce color depth (4-bit, 8-bit, 16-bit, 24-bit)

## Research Findings

### react-image-filter Package

- React component library (not directly applicable to canvas-based app)
- Provides filters: grayscale, sepia, contrast, brightness, saturate, invert, hue-rotate
- These can be implemented using native canvas 2D context filters (hardware accelerated)

### Performance Considerations

- **Canvas 2D Context Filters** (`ctx.filter`): Hardware accelerated, very fast
- `grayscale()`, `sepia()`, `contrast()`, `brightness()`, `saturate()`, `invert()`, `hue-rotate()`
- **Overlay Patterns**: Efficient when using ImageData or canvas patterns
- Crosshatching, halftone, dot screen
- **Pixel Manipulation**: Moderate performance impact (like current noise implementation)
- Posterize, threshold, edge detection

## Proposed New Filters

### 1. Canvas 2D Context Filters (Hardware Accelerated - Best Performance)

**Implementation**: Use native `ctx.filter` property (hardware accelerated)**Filters:**

- **Grayscale**: Convert to black and white
- **Sepia**: Warm brownish tone
- **Contrast**: Adjust light/dark difference
- **Brightness**: Overall lightness/darkness
- **Saturate**: Color intensity
- **Invert**: Negative colors
- **Hue Rotate**: Shift colors around color wheel

**Performance**: ⚡ Excellent - Hardware accelerated, minimal CPU impact**State Properties:**

```typescript
canvasFilterEnabled: boolean;
canvasFilterType: "grayscale" | "sepia" | "contrast" | "brightness" | "saturate" | "invert" | "hue-rotate" | "none";
canvasFilterAmount: number; // 0-100 for most, 0-360 for hue-rotate
```



### 2. Crosshatching (Diagonal Lines Pattern)

**Implementation**: Overlay diagonal line pattern using ImageData or canvas pattern**Options:**

- **Single direction**: Diagonal lines (45° or -45°)
- **Crosshatch**: Two directions crossing (45° and -45°)
- **Angle control**: User-adjustable angle (0-360°)
- **Line spacing**: Adjustable spacing between lines
- **Line opacity**: Control overlay intensity

**Performance**: ⚡ Good - Single ImageData generation, composited once per frame**State Properties:**

```typescript
crosshatchEnabled: boolean;
crosshatchType: "single" | "cross";
crosshatchAngle: number; // 0-360 degrees
crosshatchSpacing: number; // 1-50 pixels
crosshatchOpacity: number; // 0-100%
```



### 3. Halftone / Dot Screen

**Implementation**: Convert image to halftone dots (like newspaper printing)**Options:**

- **Dot size**: Adjustable dot radius
- **Dot spacing**: Distance between dots
- **Angle**: Screen angle (0°, 15°, 45°, 75°)
- **Shape**: Circle, square, diamond

**Performance**: ⚡ Moderate - Requires pixel-by-pixel processing, but can be optimized**State Properties:**

```typescript
halftoneEnabled: boolean;
halftoneDotSize: number; // 1-20 pixels
halftoneSpacing: number; // 2-50 pixels
halftoneAngle: number; // 0-360 degrees
halftoneShape: "circle" | "square" | "diamond";
```



### 4. Posterize

**Implementation**: Reduce number of color levels (like Photoshop posterize)**Options:**

- **Levels**: Number of color levels (2-256)

**Performance**: ⚡ Good - Simple pixel manipulation, similar to color quantization**State Properties:**

```typescript
posterizeEnabled: boolean;
posterizeLevels: number; // 2-256
```



### 5. Threshold

**Implementation**: Convert to pure black and white based on threshold**Options:**

- **Threshold**: Brightness cutoff (0-100%)

**Performance**: ⚡ Excellent - Very simple pixel operation**State Properties:**

```typescript
thresholdEnabled: boolean;
thresholdValue: number; // 0-100%
```



## Implementation Plan

### Phase 1: Canvas 2D Context Filters (Highest Priority - Best Performance)

**Files to Modify:**

- `src/generator.ts`: Add state properties, apply filters in render loop
- `src/components/ControlPanel/FxControls.tsx`: Add UI controls
- `src/types/generator.ts`: Update GeneratorState interface

**Implementation:**

```typescript
// In render loop, after other effects:
if (currentState.canvasFilterEnabled && currentState.canvasFilterType !== "none") {
  ctx.save();
  const filterValue = currentState.canvasFilterType === "hue-rotate"
    ? `${currentState.canvasFilterAmount}deg`
    : `${currentState.canvasFilterAmount}%`;
  ctx.filter = `${currentState.canvasFilterType}(${filterValue})`;
  ctx.drawImage(canvas, 0, 0);
  ctx.restore();
}
```



### Phase 2: Crosshatching

**Files to Create:**

- `src/lib/utils/fxCrosshatch.ts`: Crosshatch pattern generation

**Implementation:**

- Generate diagonal line pattern using ImageData
- Use `globalCompositeOperation` to overlay pattern
- Cache pattern when parameters don't change

### Phase 3: Halftone / Dot Screen

**Files to Create:**

- `src/lib/utils/fxHalftone.ts`: Halftone effect generation

**Implementation:**

- Convert image to halftone dots using pixel manipulation
- Optimize by processing in chunks or using Web Workers if needed

### Phase 4: Posterize & Threshold

**Files to Create:**

- `src/lib/utils/fxPosterize.ts`: Posterize and threshold effects

**Implementation:**

- Simple pixel manipulation similar to color quantization
- Very efficient - single pass through ImageData

## Performance Optimization Strategies

1. **Cache Generated Patterns**: Store crosshatch/halftone patterns when parameters don't change
2. **Conditional Processing**: Only apply filters when enabled
3. **Early Exit**: Skip processing if filter amount is 0
4. **Use Hardware Acceleration**: Prefer `ctx.filter` over manual pixel manipulation
5. **Optimize ImageData Operations**: Process in chunks, use typed arrays efficiently
6. **Profile Before Optimizing**: Test actual performance impact before premature optimization

## UI Design

Follow existing `FxControls.tsx` patterns:

- Toggle switch for each filter group
- Control sliders for adjustable parameters
- Use `TextWithTooltip` for descriptions
- Group related filters in collapsible sections
- Show filter preview/indicator when active

## Testing Considerations

1. Test with all filters enabled simultaneously
2. Test performance on lower-end devices
3. Verify filters work with existing effects (bloom, noise, pixelation)
4. Test filter combinations for visual artifacts
5. Profile frame rate with each filter enabled

## Migration Notes

- New filters are opt-in (disabled by default)