# Complete Guide: Sprite Shapes in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding the Sprite Shape System](#understanding-the-sprite-shape-system)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Operations: Add, Change, Remove Shapes](#operations-add-change-remove-shapes)
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

### What Are Sprite Shapes?

Sprite shapes are the geometric primitives that make up the visual elements on the canvas. Each shape:
- Defines the visual appearance of individual sprites
- Can be selected via icon buttons in the UI
- Supports both solid color and gradient fills
- Works with rotation, scaling, and motion animations
- Can be randomized across the canvas when "Random sprites" is enabled

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── constants/                  # Constants and definitions
│   │   └── sprites.ts              # ⭐ MAIN FILE - Sprite mode definitions
│   │
│   ├── types/                      # TypeScript type definitions
│   │   └── generator.ts            # SpriteMode type definition
│   │
│   ├── components/                 # React components
│   │   ├── ControlPanel/
│   │   │   ├── SpriteControls.tsx  # UI controls for sprite selection
│   │   │   └── shared/
│   │   │       └── ShapeIcon.tsx   # SVG icon rendering for shapes
│   │   └── ...
│   │
│   ├── generator.ts                # Canvas rendering & shape drawing logic
│   └── App.tsx                     # Main application component
│
├── docs/
│   └── sprite-shapes.md            # This file
│
└── package.json                    # Project dependencies
```

### Key Files for Sprite Shape Management

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/constants/sprites.ts` | **Single source of truth** for all sprite shapes | ✅ **YES** - Only file you edit for shape definitions |
| `src/types/generator.ts` | TypeScript type for `SpriteMode` | ✅ **YES** - Add new shape to union type |
| `src/generator.ts` | Shape rendering logic (Canvas 2D & p5.js) | ✅ **YES** - Add rendering code for new shapes |
| `src/components/ControlPanel/shared/ShapeIcon.tsx` | SVG icon rendering for UI buttons | ✅ **YES** - Add icon rendering for new shapes |
| `src/components/ControlPanel/SpriteControls.tsx` | UI component with shape selection buttons | ❌ Auto-generated from `sprites.ts` |

---

## Understanding the Sprite Shape System

### Sprite Shape Data Structure

Every sprite shape is defined in the `SPRITE_MODES` array with this structure:

```typescript
{
  value: SpriteMode;        // Unique identifier (lowercase, matches type)
  label: string;            // Display name shown in UI
  description: string;      // Tooltip/description text
}
```

### Example Shape Definition

```typescript
{
  value: "star",
  label: "Star",
  description: "Bursting motifs that radiate from the centre",
}
```

### Available Shapes

BitLab currently supports **13 sprite shapes**:

1. **Rounded** - Soft-edged tiles with rounded corners
2. **Circle** - Perfect circular orbs
3. **Square** - Classic square tiles
4. **Triangle** - Three-sided directional shapes
5. **Hexagon** - Six-sided honeycomb tiles
6. **Ring** - Hollow circular outlines
7. **Diamond** - Four-sided diamond shapes
8. **Star** - Ten-pointed star bursts
9. **Line** - Long horizontal scanlines
10. **Pentagon** - Five-sided balanced shapes
11. **Asterisk** - Radiating cross patterns
12. **Cross** - Plus sign shapes
13. **Pixels** - 3x3 grid of squares with spacing

### How Shapes Are Used

1. **UI Selection**: Users select shapes via icon buttons in the Sprites tab
2. **Canvas Rendering**: Each sprite on the canvas uses the selected shape (or random if enabled)
3. **Icon Display**: Shape icons appear in the UI for visual selection
4. **Random Mode**: When "Random sprites" is enabled, each sprite gets a random shape from the available selection

---

## File-by-File Breakdown

### 1. `src/constants/sprites.ts` - The Main File

**Location:** `src/constants/sprites.ts`  
**Purpose:** Single source of truth for all sprite shape definitions

**What's in this file:**
```typescript
import type { SpriteMode } from "../types/generator";

export const SPRITE_MODES: Array<{
  value: SpriteMode;
  label: string;
  description: string;
}> = [
  {
    value: "rounded",
    label: "Rounded",
    description: "Soft-edged tiles that stack into cosy mosaics",
  },
  {
    value: "circle",
    label: "Circle",
    description: "Looping orbs with smooth silhouettes",
  },
  // ... more shapes
];
```

**Key Points:**
- This is the **ONLY file you manually edit** for shape definitions
- All shapes are in the `SPRITE_MODES` array
- Each shape must have a unique `value` that matches the `SpriteMode` type
- The `label` appears in the UI
- The `description` is used for tooltips

---

### 2. `src/types/generator.ts` - Type Definition

**Location:** `src/types/generator.ts`  
**Purpose:** TypeScript type definition for sprite modes

**What's in this file:**
```typescript
export type SpriteMode =
  | "rounded"
  | "circle"
  | "square"
  | "triangle"
  | "hexagon"
  | "ring"
  | "diamond"
  | "star"
  | "line"
  | "pentagon"
  | "asterisk"
  | "cross"
  | "pixels";
```

**Key Points:**
- This is a **union type** - all possible sprite mode values
- Must include every shape value from `SPRITE_MODES`
- TypeScript will error if a shape is missing from this type

---

### 3. `src/generator.ts` - Rendering Logic

**Location:** `src/generator.ts`  
**Purpose:** Canvas rendering and shape drawing

**Key Code Sections:**

#### Shape Mode Array (Line ~170)
```typescript
const shapeModes: ShapeMode[] = [
  "rounded",
  "circle",
  "square",
  "triangle",
  "hexagon",
  "ring",
  "diamond",
  "star",
  "line",
  "pentagon",
  "asterisk",
  "cross",
  "pixels",
];
```

#### Shape Rendering - Canvas 2D (Lines ~1218-1353)
```typescript
switch (tile.shape) {
  case "rounded": {
    const cornerRadius = shapeSize * 0.3;
    const x = -shapeSize / 2;
    const y = -shapeSize / 2;
    ctx.roundRect(x, y, shapeSize, shapeSize, cornerRadius);
    break;
  }
  case "circle":
    ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
    break;
  // ... more cases
}
```

#### Shape Rendering - p5.js (Lines ~1358-1494)
```typescript
switch (tile.shape) {
  case "rounded": {
    const cornerRadius = shapeSize * 0.3;
    p.rectMode(p.CENTER);
    p.rect(0, 0, shapeSize, shapeSize, cornerRadius);
    break;
  }
  case "circle":
    p.circle(0, 0, shapeSize);
    break;
  // ... more cases
}
```

**Key Points:**
- Shapes are rendered in **two places**: Canvas 2D context (for gradients) and p5.js (for solid colors)
- Both rendering paths must support the new shape
- Shapes are drawn centered at (0, 0) after translation
- `shapeSize` is the base size, which can be scaled by motion and layer multipliers

---

### 4. `src/components/ControlPanel/shared/ShapeIcon.tsx` - Icon Rendering

**Location:** `src/components/ControlPanel/shared/ShapeIcon.tsx`  
**Purpose:** SVG icon rendering for shape selection buttons

**What's in this file:**
```typescript
export function ShapeIcon({ shape, size = 24 }: ShapeIconProps) {
  const renderShape = () => {
    switch (shape) {
      case "circle":
        return (
          <circle cx={center} cy={center} r={radius * 1.2} fill="currentColor" />
        );
      case "square":
        return <rect x={4} y={4} width={16} height={16} fill="currentColor" />;
      // ... more cases
    }
  };
  
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      {renderShape()}
    </svg>
  );
}
```

**Key Points:**
- Icons are 24x24px SVG elements
- Use `currentColor` for fill to respect theme colors
- Icons should be visually distinct and recognizable
- Match the visual style of the actual rendered shape

---

### 5. `src/components/ControlPanel/SpriteControls.tsx` - UI Component

**Location:** `src/components/ControlPanel/SpriteControls.tsx`  
**Purpose:** UI component with shape selection buttons

**Key Code Sections:**

#### Shape Button Rendering (Lines ~40-150)
```typescript
<div className="shape-buttons">
  {SPRITE_MODES.map((mode) => (
    <button
      key={mode.value}
      onClick={() => onModeChange(mode.value)}
      className={/* ... */}
      aria-label={mode.label}
    >
      <ShapeIcon shape={mode.value} />
    </button>
  ))}
</div>
```

**Key Points:**
- Buttons are auto-generated from `SPRITE_MODES` array
- Each button uses `ShapeIcon` for visual representation
- Clicking a button calls `onModeChange` with the shape value
- The active shape is highlighted visually

---

## Operations: Add, Change, Remove Shapes

### Adding a New Shape

**Step 1: Add to Type Definition**
1. Open `src/types/generator.ts`
2. Add the new shape value to the `SpriteMode` union type:
```typescript
export type SpriteMode =
  | "rounded"
  | "circle"
  // ... existing shapes
  | "pixels"
  | "newshape";  // ← Add your new shape here
```

**Step 2: Add to Constants**
1. Open `src/constants/sprites.ts`
2. Add the new shape to the `SPRITE_MODES` array:
```typescript
export const SPRITE_MODES: Array<{...}> = [
  // ... existing shapes
  {
    value: "newshape",
    label: "New Shape",
    description: "Description of what this shape does",
  },
];
```

**Step 3: Add to Shape Modes Array**
1. Open `src/generator.ts`
2. Find the `shapeModes` array (around line 170)
3. Add the new shape value:
```typescript
const shapeModes: ShapeMode[] = [
  // ... existing shapes
  "pixels",
  "newshape",  // ← Add here
];
```

**Step 4: Add Rendering Logic (Canvas 2D)**
1. Open `src/generator.ts`
2. Find the Canvas 2D rendering switch statement (around line 1218)
3. Add a case for your new shape:
```typescript
case "newshape": {
  // Your rendering code using ctx (Canvas 2D context)
  // Shapes are drawn centered at (0, 0)
  // Use shapeSize for dimensions
  ctx.rect(-shapeSize / 2, -shapeSize / 2, shapeSize, shapeSize);
  break;
}
```

**Step 5: Add Rendering Logic (p5.js)**
1. Still in `src/generator.ts`
2. Find the p5.js rendering switch statement (around line 1358)
3. Add a case for your new shape:
```typescript
case "newshape": {
  // Your rendering code using p (p5 instance)
  // Shapes are drawn centered at (0, 0)
  // Use shapeSize for dimensions
  p.rectMode(p.CENTER);
  p.rect(0, 0, shapeSize, shapeSize);
  break;
}
```

**Step 6: Add Icon Rendering**
1. Open `src/components/ControlPanel/shared/ShapeIcon.tsx`
2. Find the `renderShape()` function
3. Add a case for your new shape:
```typescript
case "newshape":
  return <rect x={4} y={4} width={16} height={16} fill="currentColor" />;
```

**Step 7: Test**
1. Run the development server: `npm run dev`
2. Navigate to the Sprites tab
3. Verify the new shape appears as a button
4. Click the button and verify it renders on the canvas
5. Test with both solid colors and gradients
6. Test with rotation enabled
7. Test with "Random sprites" enabled

---

### Changing an Existing Shape

**To change the label or description:**
1. Open `src/constants/sprites.ts`
2. Find the shape in the `SPRITE_MODES` array
3. Update the `label` or `description` field

**To change the rendering:**
1. Open `src/generator.ts`
2. Find the Canvas 2D rendering case (around line 1218)
3. Modify the rendering code
4. Find the p5.js rendering case (around line 1358)
5. Modify the rendering code to match

**To change the icon:**
1. Open `src/components/ControlPanel/shared/ShapeIcon.tsx`
2. Find the shape case in `renderShape()`
3. Update the SVG rendering code

---

### Removing a Shape

**Step 1: Remove from Constants**
1. Open `src/constants/sprites.ts`
2. Remove the shape from the `SPRITE_MODES` array

**Step 2: Remove from Type Definition**
1. Open `src/types/generator.ts`
2. Remove the shape value from the `SpriteMode` union type

**Step 3: Remove from Shape Modes Array**
1. Open `src/generator.ts`
2. Remove the shape from the `shapeModes` array

**Step 4: Remove Rendering Logic**
1. Open `src/generator.ts`
2. Remove the Canvas 2D case (around line 1218)
3. Remove the p5.js case (around line 1358)

**Step 5: Remove Icon Rendering**
1. Open `src/components/ControlPanel/shared/ShapeIcon.tsx`
2. Remove the shape case from `renderShape()`

**Step 6: Test**
1. Run the development server
2. Verify the shape no longer appears in the UI
3. Verify existing presets with the removed shape still work (they'll fall back to "rounded")

---

## Data Flow & Dependencies

### How Shapes Flow Through the System

```
1. User clicks shape button in UI
   ↓
2. SpriteControls calls onModeChange(newShape)
   ↓
3. App.tsx calls controller.setSpriteMode(newShape)
   ↓
4. generator.ts updates state.spriteMode
   ↓
5. computeSprite() uses state.spriteMode to determine activeShape
   ↓
6. Each tile gets assigned the activeShape (or random if enabled)
   ↓
7. p.draw() renders each tile using the shape rendering switch
   ↓
8. Canvas displays the new shapes
```

### Dependencies

- **SPRITE_MODES** → Used by `SpriteControls` to generate UI buttons
- `SpriteMode` type → Used throughout the codebase for type safety
- `shapeModes` array → Used by `computeSprite()` for random shape selection
- Rendering switch statements → Used by `p.draw()` to render shapes

---

## Code Examples

### Example: Adding a "Heart" Shape

**1. Type Definition (`src/types/generator.ts`):**
```typescript
export type SpriteMode =
  | "rounded"
  // ... existing shapes
  | "heart";  // ← Add
```

**2. Constants (`src/constants/sprites.ts`):**
```typescript
{
  value: "heart",
  label: "Heart",
  description: "Romantic heart shapes for love-themed compositions",
},
```

**3. Shape Modes Array (`src/generator.ts`):**
```typescript
const shapeModes: ShapeMode[] = [
  // ... existing shapes
  "heart",  // ← Add
];
```

**4. Canvas 2D Rendering (`src/generator.ts`):**
```typescript
case "heart": {
  // Draw heart using bezier curves
  ctx.beginPath();
  const topCurveHeight = shapeSize * 0.3;
  const topCurveWidth = shapeSize * 0.5;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(
    -topCurveWidth, -topCurveHeight,
    -topCurveWidth, shapeSize * 0.5,
    0, shapeSize * 0.5
  );
  ctx.bezierCurveTo(
    topCurveWidth, shapeSize * 0.5,
    topCurveWidth, -topCurveHeight,
    0, topCurveHeight
  );
  ctx.closePath();
  break;
}
```

**5. p5.js Rendering (`src/generator.ts`):**
```typescript
case "heart": {
  // Draw heart using bezier curves
  const topCurveHeight = shapeSize * 0.3;
  const topCurveWidth = shapeSize * 0.5;
  p.beginShape();
  p.vertex(0, topCurveHeight);
  p.bezierVertex(
    -topCurveWidth, -topCurveHeight,
    -topCurveWidth, shapeSize * 0.5,
    0, shapeSize * 0.5
  );
  p.bezierVertex(
    topCurveWidth, shapeSize * 0.5,
    topCurveWidth, -topCurveHeight,
    0, topCurveHeight
  );
  p.endShape(p.CLOSE);
  break;
}
```

**6. Icon Rendering (`src/components/ControlPanel/shared/ShapeIcon.tsx`):**
```typescript
case "heart": {
  // Simple heart icon using path
  return (
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="currentColor"
    />
  );
}
```

---

## Testing & Verification

### Testing Checklist

After adding, changing, or removing a shape:

- [ ] Shape appears in the UI as a button
- [ ] Clicking the button selects the shape
- [ ] Shape renders correctly on the canvas (solid color)
- [ ] Shape renders correctly with gradients enabled
- [ ] Shape works with rotation enabled
- [ ] Shape works with rotation animation enabled
- [ ] Shape scales correctly with Scale Base slider
- [ ] Shape scales correctly with Scale Range slider
- [ ] Shape works with "Random sprites" enabled
- [ ] Shape works with all movement modes
- [ ] Shape works with all blend modes
- [ ] Shape icon is visually distinct and recognizable
- [ ] TypeScript compilation succeeds without errors
- [ ] No console errors in browser

### Visual Testing

1. **Basic Rendering**: Select the shape and verify it appears on canvas
2. **Gradient Mode**: Enable gradients and verify the shape uses gradients correctly
3. **Rotation**: Enable rotation and verify the shape rotates correctly
4. **Scaling**: Adjust scale sliders and verify the shape scales proportionally
5. **Random Mode**: Enable "Random sprites" and verify the shape appears randomly

---

## Troubleshooting

### Shape Not Appearing in UI

**Problem:** Shape button doesn't show up in the Sprites tab

**Solutions:**
1. Check that the shape is in `SPRITE_MODES` array in `src/constants/sprites.ts`
2. Verify the `value` matches the `SpriteMode` type exactly
3. Check browser console for TypeScript errors
4. Restart the development server

### Shape Not Rendering on Canvas

**Problem:** Shape button works but nothing appears on canvas

**Solutions:**
1. Check that the shape is in the `shapeModes` array in `src/generator.ts`
2. Verify both Canvas 2D and p5.js rendering cases exist
3. Check browser console for JavaScript errors
4. Verify the rendering code uses correct coordinates (centered at 0, 0)

### TypeScript Errors

**Problem:** TypeScript compilation fails

**Solutions:**
1. Ensure the shape value is in the `SpriteMode` union type
2. Check for typos in shape value strings (must match exactly)
3. Verify all files are saved
4. Run `npm run build` to see full error messages

### Icon Not Displaying

**Problem:** Shape button shows but icon is missing

**Solutions:**
1. Check that the shape case exists in `ShapeIcon.tsx`
2. Verify the SVG code is valid
3. Check browser console for rendering errors
4. Ensure the icon uses `currentColor` for fill

---

## Best Practices

### Shape Design Guidelines

1. **Keep It Simple**: Shapes should be recognizable at small sizes
2. **Center at Origin**: Always draw shapes centered at (0, 0)
3. **Use shapeSize**: Base all dimensions on the `shapeSize` parameter
4. **Support Both Renderers**: Always implement both Canvas 2D and p5.js versions
5. **Match Visual Style**: Icons should match the rendered shape's appearance

### Code Organization

1. **Single Source of Truth**: `SPRITE_MODES` array is the only place to define shapes
2. **Type Safety**: Always update the `SpriteMode` type when adding shapes
3. **Consistent Naming**: Use lowercase, descriptive names (e.g., "rounded", not "Rounded")
4. **Documentation**: Add clear descriptions for each shape

### Performance Considerations

1. **Efficient Rendering**: Use simple shapes for better performance
2. **Avoid Complex Paths**: Complex bezier curves can slow down rendering
3. **Test with High Density**: Verify shapes perform well with many sprites

### Future Enhancements

Potential improvements for the shape system:
- Custom shape uploads (SVG import)
- Shape-specific properties (e.g., star point count)
- Animated shape variants
- Shape presets/combinations

---

## Summary

The sprite shape system in BitLab is designed to be:
- **Extensible**: Easy to add new shapes
- **Type-Safe**: TypeScript ensures consistency
- **Performant**: Efficient rendering for many sprites
- **User-Friendly**: Visual selection with icons

To add a new shape, you need to:
1. Add to type definition
2. Add to constants array
3. Add to shape modes array
4. Add Canvas 2D rendering
5. Add p5.js rendering
6. Add icon rendering
7. Test thoroughly

The system automatically handles:
- UI button generation
- Random shape selection
- Shape assignment to tiles
- Integration with rotation, scaling, and motion

