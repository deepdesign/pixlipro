# Custom Animation Designer & Management Plan

## Overview

Enhance the Animation page to allow users to:
- View all default animations
- Adjust/tweak animation parameters in a visual and intuitive way (graphs, sliders)
- Create their own animations with full path drawing, keyframes, bezier curves, and timing
- Experience an intuitive and fun interface suitable for novice users

---

## Core Features

### 1. Default Animation Browser
- **Thumbnail Grid**: Display all default animations in a visual grid
- **Animation Cards**: Each card shows a thumbnail preview, name, and description
- **Quick Select**: Click to select and use a default animation
- **Read-Only**: Default animations cannot be edited (preserve original behavior)

### 2. Custom Animation Creation
- **Full Path Drawing**: Draw custom paths for sprite movement
- **Keyframe System**: Set keyframes at specific time points
- **Bezier Curves**: Create smooth curves using bezier control points
- **Timing Controls**: Adjust speed, easing, and duration
- **Visual Timeline**: Timeline editor for managing keyframes and paths

### 3. Animation Library Management
- **Separate Storage**: Store custom animations separately from defaults
- **Export/Import**: Export animations as JSON files (consistent with palettes and sequences)
- **Duplication**: Duplicate any animation (default or custom) and rename
- **Naming**: Custom animations can be renamed (defaults can be renamed after duplication)
- **Delete**: Remove custom animations from the library

### 4. Visual Parameter Controls
- **Graph-Based Editing**: Visual graphs for parameter visualization
- **Interactive Sliders**: Real-time parameter adjustment with visual feedback
- **Parameter Categories**:
  - Movement path (X/Y coordinates, curves)
  - Timing (speed, duration, easing)
  - Rotation (keyframes, bezier curves)
  - Scale (keyframes, bezier curves)
  - Other animation properties

### 5. Animation Preview System
- **Thumbnail Grid**: Browse animations with live preview thumbnails
- **Interactive Canvas**: Detailed editing canvas for path drawing and keyframe editing
- **Mini Preview Canvas**: Preview custom animation with basic controls:
  - Sprite density
  - Scale
  - Range
  - Palette selection
  - Sprite shape selection
- **Real-Time Preview**: See animation changes in real-time

---

## Implementation Plan

### Phase 1: Animation Browser & Default Animations

**Files to Create:**
- `src/components/Animation/AnimationBrowser.tsx` - Grid view of animations
- `src/components/Animation/AnimationCard.tsx` - Individual animation card component
- `src/lib/storage/animationStorage.ts` - Storage system for custom animations
- `src/constants/animations.ts` - Default animation definitions

**Features:**
- Display default animations in a responsive grid
- Animation cards with thumbnails and metadata
- Select animation to use it in the generator
- Non-editable default animations

### Phase 2: Custom Animation Data Structure

**File:** `src/types/animations.ts` (new)

**Data Structure:**
```typescript
interface CustomAnimation {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
  
  // Path definition
  path: AnimationPath;
  
  // Timing
  duration: number; // seconds
  loop: boolean;
  
  // Keyframes
  keyframes: AnimationKeyframe[];
  
  // Metadata
  author?: string;
  tags?: string[];
}

interface AnimationPath {
  type: "linear" | "bezier" | "spline" | "custom";
  points: PathPoint[];
  closed: boolean;
}

interface PathPoint {
  x: number;
  y: number;
  controlPoint1?: { x: number; y: number }; // For bezier curves
  controlPoint2?: { x: number; y: number }; // For bezier curves
  time: number; // Normalized 0-1
}

interface AnimationKeyframe {
  id: string;
  time: number; // Normalized 0-1
  properties: {
    rotation?: number;
    scale?: number;
    opacity?: number;
    // Additional animatable properties
  };
  easing?: EasingFunction;
}

type EasingFunction = 
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "bezier"; // Custom bezier curve
```

### Phase 3: Path Drawing & Editing Tools

**Files to Create:**
- `src/components/Animation/PathEditor.tsx` - Interactive path drawing canvas
- `src/components/Animation/BezierEditor.tsx` - Bezier curve editor
- `src/lib/utils/pathInterpolation.ts` - Path interpolation utilities
- `src/lib/utils/bezierUtils.ts` - Bezier curve utilities

**Features:**
- Draw paths by clicking to add points
- Drag points to adjust path
- Add/remove bezier control points
- Smooth path interpolation
- Visual guides and snapping

### Phase 4: Keyframe Timeline Editor

**Files to Create:**
- `src/components/Animation/KeyframeTimeline.tsx` - Timeline editor component
- `src/components/Animation/KeyframeEditor.tsx` - Individual keyframe editor
- `src/lib/utils/keyframeInterpolation.ts` - Keyframe interpolation

**Features:**
- Visual timeline with playhead
- Drag keyframes on timeline
- Add/delete keyframes
- Adjust keyframe properties (rotation, scale, opacity)
- Easing function selection per keyframe
- Zoom and pan timeline

### Phase 5: Animation Preview System

**Files to Create:**
- `src/components/Animation/AnimationPreview.tsx` - Mini preview canvas
- `src/components/Animation/PreviewControls.tsx` - Preview control panel
- `src/hooks/useAnimationPreview.ts` - Preview hook

**Features:**
- Mini canvas showing animation preview
- Basic controls: density, scale, range, palette, sprite shape
- Real-time preview updates
- Play/pause/loop controls
- Thumbnail generation for grid view

### Phase 6: Animation Library UI

**Files to Create:**
- `src/components/Animation/AnimationLibrary.tsx` - Library management
- `src/components/Animation/DuplicateAnimationModal.tsx` - Duplication modal
- `src/components/Animation/AnimationEditor.tsx` - Main editor component

**Features:**
- View all animations (default + custom)
- Create new custom animation
- Edit custom animations
- Duplicate and rename animations
- Delete custom animations
- Export/import animations

### Phase 7: Visual Parameter Controls

**Files to Create:**
- `src/components/Animation/ParameterGraph.tsx` - Graph visualization
- `src/components/Animation/ParameterControls.tsx` - Parameter control panel
- `src/lib/utils/graphUtils.ts` - Graph rendering utilities

**Features:**
- Visual graphs for parameter changes over time
- Interactive point editing on graphs
- Real-time parameter adjustment
- Multiple parameter tracks

### Phase 8: Integration with Generator

**Files to Modify:**
- `src/generator.ts` - Add support for custom animation paths
- `src/types/generator.ts` - Add animation type to GeneratorState

**Features:**
- Apply custom animations to sprite movement
- Interpolate between keyframes
- Follow custom paths with bezier curves
- Support for animation speed and looping

---

## User Experience Flow

### Browsing Animations
1. User navigates to Settings > Animation
2. Sees grid of default animations with thumbnails
3. Clicks on an animation card to select it
4. Animation is applied to the canvas

### Creating Custom Animation
1. User clicks "Create New Animation" button
2. Editor opens with:
   - Path drawing canvas (left/center)
   - Parameter controls (right)
   - Timeline editor (bottom)
   - Mini preview (top right)
3. User draws path by clicking on canvas
4. User adds keyframes on timeline
5. User adjusts parameters using graphs/sliders
6. User previews animation in mini canvas
7. User saves animation with a name

### Editing Animation
1. User selects a custom animation from library
2. Editor opens with existing path and keyframes
3. User modifies path, keyframes, or parameters
4. Changes preview in real-time
5. User saves changes

### Duplicating Animation
1. User right-clicks or uses menu on animation card
2. Selects "Duplicate"
3. Modal opens asking for new name
4. Duplicate is created (editable if it was default)

---

## Technical Details

### Storage
- **Location**: `localStorage` with key `pixli-animations`
- **Format**: JSON array of `CustomAnimation` objects
- **Import/Export**: JSON file format (consistent with palettes/sequences)

### Path Interpolation
- Linear interpolation between points
- Bezier curve interpolation for smooth curves
- Spline interpolation for complex paths
- Normalized time (0-1) for animation progress

### Keyframe Interpolation
- Linear interpolation between keyframes
- Easing functions for smooth transitions
- Bezier easing for custom curves
- Support for multiple properties per keyframe

### Performance
- Thumbnails generated on save (not real-time)
- Preview canvas uses reduced quality for performance
- Path calculations cached where possible
- Use requestAnimationFrame for smooth preview

---

## UI Components

### Animation Browser Grid
- Responsive grid layout (similar to sprite grid)
- Animation cards with:
  - Thumbnail preview
  - Animation name
  - Description
  - Default/Custom badge
  - Action buttons (edit, duplicate, delete)

### Path Editor Canvas
- Interactive canvas for drawing paths
- Point markers with drag handles
- Bezier control point handles
- Grid and snapping guides
- Zoom and pan controls

### Timeline Editor
- Horizontal timeline with time markers
- Keyframe markers on timeline
- Playhead indicator
- Drag keyframes to adjust timing
- Add/delete keyframes
- Property tracks for each animatable property

### Parameter Graphs
- Line/curve graphs showing parameter values over time
- Interactive points on graphs
- Multiple property graphs in vertical layout
- Zoom and pan for detailed editing

### Mini Preview Canvas
- Small canvas (e.g., 320x180px)
- Shows animation preview
- Basic controls panel:
  - Density slider
  - Scale slider
  - Range slider
  - Palette selector
  - Sprite shape selector
- Play/pause/loop controls

---

## Integration Points

### With Generator
- Add `customAnimationId` to `GeneratorState`
- Modify movement calculation to use custom path if set
- Interpolate keyframe properties (rotation, scale, etc.)
- Support animation speed multiplier

### With Settings Navigation
- Animation page in Settings sidebar under "Content Management"
- Consistent with other content pages (Sprites, Palettes, etc.)
- Full-width layout like other content pages

### With Existing Systems
- Use same storage pattern as palettes and sequences
- Export/import format consistent with other exports
- Follow same naming conventions and patterns

---

## Default Animations

Default animations should include:
1. **Pulse** - Pulsing in/out motion
2. **Drift** - Gentle floating motion
3. **Ripple** - Wave-like motion
4. **Zigzag** - Angular back-and-forth motion
5. **Cascade** - Flowing downward motion
6. **Spiral Orbit** - Circular spiral motion
7. **Comet Trail** - Trailing motion effect
8. **Linear** - Straight-line motion
9. **Isometric** - Hexagonal grid motion
10. **Perspective** - Tiles emit from center
11. **Wavefront** - Wave propagation motion

Each default animation should:
- Be non-editable (but can be duplicated)
- Have a thumbnail preview
- Include a description
- Match existing movement modes

---

## Polish & UX

### Visual Design
- Use Tailwind CSS components throughout
- Match existing design system and spacing
- Consistent card styling with other content pages
- Smooth transitions and animations

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Clear focus indicators

### Performance
- Lazy load animation data
- Optimize thumbnail generation
- Use virtual scrolling for large animation lists
- Debounce parameter updates

### User Guidance
- Tooltips explaining features
- Helpful descriptions for default animations
- Tutorial/guided tour for first-time users
- Clear visual feedback for actions

---

## Files to Create

### Components
1. `src/components/Animation/AnimationBrowser.tsx`
2. `src/components/Animation/AnimationCard.tsx`
3. `src/components/Animation/AnimationEditor.tsx`
4. `src/components/Animation/PathEditor.tsx`
5. `src/components/Animation/BezierEditor.tsx`
6. `src/components/Animation/KeyframeTimeline.tsx`
7. `src/components/Animation/KeyframeEditor.tsx`
8. `src/components/Animation/AnimationPreview.tsx`
9. `src/components/Animation/PreviewControls.tsx`
10. `src/components/Animation/ParameterGraph.tsx`
11. `src/components/Animation/ParameterControls.tsx`
12. `src/components/Animation/AnimationLibrary.tsx`
13. `src/components/Animation/DuplicateAnimationModal.tsx`

### Utilities
1. `src/lib/storage/animationStorage.ts`
2. `src/lib/utils/pathInterpolation.ts`
3. `src/lib/utils/bezierUtils.ts`
4. `src/lib/utils/keyframeInterpolation.ts`
5. `src/lib/utils/graphUtils.ts`

### Types
1. `src/types/animations.ts`

### Constants
1. `src/constants/animations.ts`

### Hooks
1. `src/hooks/useAnimationPreview.ts`

---

## Implementation Priority

1. **Phase 1**: Animation Browser & Default Animations (Foundation)
2. **Phase 2**: Custom Animation Data Structure (Data layer)
3. **Phase 5**: Animation Preview System (Visual feedback)
4. **Phase 6**: Animation Library UI (Management)
5. **Phase 3**: Path Drawing & Editing Tools (Core creation)
6. **Phase 4**: Keyframe Timeline Editor (Advanced editing)
7. **Phase 7**: Visual Parameter Controls (Polish)
8. **Phase 8**: Integration with Generator (Final integration)

---

## Notes

- Default animations should match existing movement modes in the generator
- Custom animations should be exportable/importable like palettes and sequences
- UI should be intuitive for novice users while providing advanced features
- Consider using charting libraries (e.g., recharts, visx) for parameter graphs
- Path editor should feel similar to vector editing tools (like Figma/Illustrator)
- Timeline editor should feel similar to video editing software

