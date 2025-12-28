---
name: Animation Editor - Code-Based with Simple Controls
overview: Create a simple animation editor with code editing and basic controls. Users can paste/edit code functions or use simple controls to adjust animation properties. Supports duplicating, editing, and creating custom animations.
todos: []
---

# Animation Editor - Code-Based with Simple Controls

## Overview

Build a simple animation editor focused on code editing with optional simple controls. Users can paste or write JavaScript functions for animation behavior, or use basic controls for common properties. No complex visual path drawing or timeline editing.

## Core Architecture

### Single Interface

- **Code Editor**: Primary interface for writing/pasting JavaScript functions
- **Simple Controls**: Basic sliders/inputs for common properties (duration, loop, etc.)
- **Preview**: Real-time preview of animation
- **Templates**: Pre-made code templates for common patterns

## User Experience Design

### Editor Interface

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Animation Name] [Save] [Cancel]                             │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────────────────────────────┐ │
│ │              │  │  Code Editor (Monaco/CodeMirror)     │ │
│ │  Preview     │  │  ┌────────────────────────────────┐ │ │
│ │  Canvas      │  │  │ // Path Function                     │ │ │
│ │  (320x180)   │  │  │ function path(t, phase) {         │ │ │
│ │              │  │  │   return {                         │ │ │
│ │  [Play]      │  │  │     x: Math.sin(t * 2) * 0.5,     │ │ │
│ │  [Loop]      │  │  │     y: Math.cos(t * 2) * 0.5      │ │ │
│ │              │  │  │   };                               │ │ │
│ │  Controls:   │  │  │ }                                 │ │ │
│ │  - Density   │  │  └────────────────────────────────┘ │ │
│ │  - Scale     │  │  ┌────────────────────────────────┐ │ │
│ │  - Palette   │  │  │ // Scale Function                 │ │ │
│ │  - Sprite    │  │  │ function scale(t) {               │ │ │
│ └──────────────┘  │  │   return 1 + Math.sin(t * 4);     │ │ │
│                   │  │ }                                 │ │ │
│                   │  └────────────────────────────────┘ │ │
│                   │  ┌────────────────────────────────┐ │ │
│                   │  │ // Opacity Function (optional)    │ │ │
│                   │  │ function scale(t) {               │ │ │
│                   │  │   return 1 + Math.sin(t * 4);     │ │ │
│                   │  │ }                                 │ │ │
│                   │  └────────────────────────────────┘ │ │
│                   │  [Paste Code] [Clear] [Templates ▼]  │ │
│                   └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │  Simple Controls                                         │ │
│ │  - Duration: [2.5s] [Loop: ✓]                           │ │
│ │  - Expression Mode: [Math Expressions] [Full JavaScript]│ │
│ │  - Available Variables:                                 │ │
│ │    • t (time, 0-1)                                       │ │
│ │    • phase (sprite phase, 0-1)                         │ │
│ │    • layerIndex (0, 1, 2)                                │ │
│ │    • baseUnit (sprite size)                              │ │
│ │    • motionScale (intensity, 0-1.5)                      │ │
│ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**

1. **Code Editor**

   - Monaco Editor or CodeMirror integration
   - Syntax highlighting (JavaScript)
   - **Intelligent Auto-completion**: 
     - Suggests available variables (t, phase, layerIndex, baseUnit, motionScale)
     - Suggests Math functions (sin, cos, tan, pow, sqrt, etc.)
     - Suggests common expression patterns
     - Context-aware suggestions based on what user is typing
   - **Inline Tooltips**: 
     - Hover over variables to see descriptions and value ranges
     - Hover over functions to see syntax and examples
     - Hover over expressions to see what they produce
   - **Expression Suggestions Panel**: 
     - Sidebar or dropdown with common expression patterns
     - Click to insert expressions
     - Examples: "Sine wave", "Circular motion", "Linear interpolation", etc.
   - Error detection and inline warnings
   - Multiple function tabs (path, scale, opacity)
   - Paste code button
   - Clear button
   - Template dropdown

2. **Simple Controls**

   - Duration input (seconds)
   - Loop toggle
   - Expression mode toggle (Math Expressions vs Full JavaScript)
   - **Variable Reference Panel**: 
     - Expandable panel showing all available variables
     - Click to insert variable into code
     - Shows value ranges and descriptions
     - Examples for each variable

3. **Templates**

   - Pre-made templates for common patterns
   - Examples: "Circular motion", "Sine wave", "Spiral", "Pulse", etc.
   - One-click apply templates
   - Template preview

4. **Preview Canvas**

   - **Reuses existing `AnimationThumbnail` component**
   - Same styling as animation browser previews (theme colors, simple square sprites)
   - Small size (160px default, matches browser thumbnails)
   - Shows real-time animation preview as user edits code
   - **Live updates**: Preview updates automatically as code changes (debounced)
   - **Error handling**: If code fails, preview shows error state or falls back gracefully
   - Positioned prominently (left side of editor) for easy visual feedback

## Data Structure

### Simplified CustomAnimation Interface

```typescript
export interface CustomAnimation {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
  
  // Code functions (required)
  codeFunctions: {
    path: string;      // JavaScript function string
    rotation?: string;  // Optional
    scale?: string;     // Optional
    opacity?: string;   // Optional
  };
  expressionMode: "math" | "javascript";
  
  // Simple properties
  duration: number; // seconds
  loop: boolean;
  
  // Metadata
  author?: string;
  tags?: string[];
  thumbnail?: string;
}
```

**Removed:**

- `path: AnimationPath` (no visual path drawing)
- `keyframes: AnimationKeyframe[]` (no timeline/keyframes)
- `editorMode` (no mode switching)

## Component Architecture

### Main Editor Component

**File:** `src/components/Animation/AnimationEditor.tsx`

**Props:**

```typescript
interface AnimationEditorProps {
  animation?: CustomAnimation; // If editing existing
  onSave: (animation: CustomAnimation) => void;
  onCancel: () => void;
}
```

**State Management:**

- Code functions (path, scale, opacity)
- Duration and loop settings
- Expression mode (math vs javascript)
- Preview settings
- Unsaved changes tracking

### Components

1. **CodeEditor** (`src/components/Animation/CodeEditor.tsx`)

   - Monaco Editor or CodeMirror integration
   - Syntax highlighting
   - Auto-completion
   - Error detection
   - Function tabs (path, rotation, scale, opacity)
   - Paste/Clear buttons

2. **SimpleControls** (`src/components/Animation/SimpleControls.tsx`)

   - Duration input
   - Loop toggle
   - Expression mode toggle
   - Variable reference list

3. **FunctionTemplates** (`src/components/Animation/FunctionTemplates.tsx`)

   - Template library
   - Preview of template result
   - One-click apply
   - Dropdown selector

4. **Animation Preview** (Reuses `AnimationThumbnail` component)

   - **Reuses existing `AnimationThumbnail` component** from `src/components/Animation/AnimationThumbnail.tsx`
   - Same styling and behavior as animation browser previews
   - Small size (160px default) - matches browser thumbnails
   - **Live updates**: Passes custom animation to component, which updates as code changes
   - **Real-time execution**: Component uses generator system to execute code functions
   - **Error handling**: Component handles errors gracefully (shows loading/error state)
   - **Consistent styling**: Uses theme colors, simple square sprites, same visual style
   - **No additional controls needed**: Component handles all preview logic internally

## Expression Building Assistance

### Auto-Completion & Suggestions

**Intelligent Code Completion:**

- **Variable Suggestions**: As user types, suggest available variables
  - Type `t` → suggests `t (time, 0-1)`
  - Type `phase` → suggests `phase (sprite phase offset, 0-1)`
  - Type `Math.` → suggests all available Math functions
- **Expression Patterns**: Suggest common patterns
  - Type `sin(` → suggests `Math.sin(t * Math.PI * 2)`
  - Type `lerp(` → suggests `lerp(0, 1, t)`
  - Type `{ x:` → suggests `{ x: ..., y: ... }` pattern for path function
- **Context-Aware**: Understands what function user is editing
  - In path function → suggests position patterns
  - In scale function → suggests scale patterns (0-2 range)
  - In opacity function → suggests opacity patterns (0-1 range)

**Implementation:**

```typescript
// Custom completion provider
const completionProvider = {
  provideCompletionItems: (model, position) => {
    const suggestions = [
      // Variables
      {
        label: 't',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: 't',
        documentation: 'Time (0-1, normalized). Represents animation progress.',
        detail: 'Variable: time'
      },
      {
        label: 'phase',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: 'phase',
        documentation: 'Sprite phase offset (0-1). Unique per sprite for variation.',
        detail: 'Variable: sprite phase'
      },
      // Common patterns
      {
        label: 'Sine Wave Pattern',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'Math.sin(t * Math.PI * 2) * 0.5',
        documentation: 'Creates a sine wave oscillation',
        detail: 'Pattern: sine wave'
      },
      {
        label: 'Circular Motion',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '{ x: Math.sin(t * Math.PI * 2) * 0.5, y: Math.cos(t * Math.PI * 2) * 0.5 }',
        documentation: 'Creates circular motion path',
        detail: 'Pattern: circular'
      },
      // ... more suggestions
    ];
    return { suggestions };
  }
};
```

### Tooltips & Hover Information

**Inline Documentation:**

- **Variable Tooltips**: Hover over `t` → shows "Time (0-1, normalized). Represents animation progress from start to end."
- **Function Tooltips**: Hover over `Math.sin` → shows "Returns the sine of an angle. Usage: Math.sin(angle). Returns value between -1 and 1."
- **Expression Tooltips**: Hover over complex expressions → shows what the expression evaluates to (with example values)

**Implementation:**

```typescript
const hoverProvider = {
  provideHover: (model, position) => {
    const word = model.getWordAtPosition(position);
    if (word) {
      const documentation = getDocumentation(word.word);
      if (documentation) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${word.word}**` },
            { value: documentation.description },
            { value: `**Example:** \`${documentation.example}\`` }
          ]
        };
      }
    }
  }
};
```

### Expression Suggestions Panel

**Sidebar Component:**

- **Common Patterns**: List of frequently used expressions
  - "Sine Wave": `Math.sin(t * Math.PI * 2) * 0.5`
  - "Circular Motion": `{ x: Math.sin(t * Math.PI * 2) * 0.5, y: Math.cos(t * Math.PI * 2) * 0.5 }`
  - "Linear Interpolation": `lerp(0, 1, t)`
  - "Pulse": `1 + Math.sin(t * Math.PI * 2) * 0.5`
  - "Ease In Out": `t * t * (3 - 2 * t)`
- **Click to Insert**: Clicking a suggestion inserts it at cursor position
- **Preview**: Shows what the expression produces (visual preview or value range)
- **Categorized**: Grouped by type (motion, scaling, easing, etc.)

**Component:**

```typescript
// src/components/Animation/ExpressionSuggestions.tsx
interface ExpressionSuggestion {
  name: string;
  category: 'motion' | 'scaling' | 'easing' | 'math';
  expression: string;
  description: string;
  preview?: string; // Visual preview or example output
}

const EXPRESSION_SUGGESTIONS: ExpressionSuggestion[] = [
  {
    name: 'Sine Wave',
    category: 'motion',
    expression: 'Math.sin(t * Math.PI * 2) * 0.5',
    description: 'Smooth oscillating motion',
    preview: 'Oscillates between -0.5 and 0.5'
  },
  {
    name: 'Circular Motion',
    category: 'motion',
    expression: '{ x: Math.sin(t * Math.PI * 2) * 0.5, y: Math.cos(t * Math.PI * 2) * 0.5 }',
    description: 'Moves in a circle',
    preview: 'Circular path with radius 0.5'
  },
  // ... more suggestions
];
```

### Variable Reference Panel

**Expandable Panel:**

- **Variable List**: All available variables with descriptions
- **Click to Insert**: Click variable name to insert at cursor
- **Value Ranges**: Shows min/max values for each variable
- **Examples**: Shows example usage for each variable

**Component:**

```typescript
// src/components/Animation/VariableReference.tsx
const VARIABLES = [
  {
    name: 't',
    type: 'number',
    range: '0 to 1',
    description: 'Normalized time representing animation progress',
    example: 't * 2 // Doubles the speed',
    usage: 'Use for time-based animations'
  },
  {
    name: 'phase',
    type: 'number',
    range: '0 to 1',
    description: 'Unique phase offset per sprite for variation',
    example: 'Math.sin(t * Math.PI * 2 + phase)',
    usage: 'Add to time-based functions for sprite variation'
  },
  // ... more variables
];
```

### Expression Builder Helper

**Guided Expression Building:**

- **Step-by-step Builder**: For novices, provide a guided builder
  - Select pattern type (sine, linear, circular, etc.)
  - Adjust parameters with sliders
  - See live preview
  - Generate code from selections
- **Expression Templates**: Pre-filled templates with placeholders
  - User can adjust values without writing full syntax
  - Example: `Math.sin(t * [frequency]) * [amplitude]`
  - Placeholders are highlighted and editable

## Implementation Details

### Code Execution & Safety

**Sandboxing:**

- Use Function constructor with limited scope
- Whitelist allowed functions (Math.*, etc.)
- Block dangerous operations (eval, require, etc.)
- Timeout for execution (prevent infinite loops)

**Available Variables:**

```javascript
// In code functions, these are available:
t        // Time (0-1, normalized)
phase    // Sprite phase offset (0-1)
layerIndex // Layer number (0, 1, 2)
baseUnit // Base sprite size unit
motionScale // Motion intensity (0-1.5)
```

**Available Functions:**

```javascript
// Math functions
Math.sin, Math.cos, Math.tan
Math.pow, Math.sqrt, Math.abs
Math.min, Math.max, Math.PI

// Custom helpers
lerp(a, b, t) // Linear interpolation
smoothstep(t) // Smooth curve 0-1
```

### Expression Mode

**Math Expressions Mode:**

- Simple expressions like `sin(t * 2) * 0.5`
- Auto-wraps in function: `function path(t, phase) { return sin(t * 2) * 0.5; }`
- Limited to mathematical operations

**Full JavaScript Mode:**

- Complete functions with logic
- Full JavaScript capabilities (within sandbox)
- More flexible but requires function syntax

### Templates

**Template Structure:**

```typescript
interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  codeFunctions: {
    path: string;
    scale?: string;
    opacity?: string;
  };
}
```

**Example Templates:**

- **Circular Motion**: `{ x: Math.sin(t * Math.PI * 2) * 0.5, y: Math.cos(t * Math.PI * 2) * 0.5 }`
- **Sine Wave**: `{ x: t, y: Math.sin(t * Math.PI * 4) * 0.3 }`
- **Pulse**: `{ x: 0, y: 0 }` with scale: `1 + Math.sin(t * Math.PI * 2) * 0.5`
- **Spiral**: `{ x: Math.sin(t * Math.PI * 4) * t * 0.5, y: Math.cos(t * Math.PI * 4) * t * 0.5 }`

## User Workflows

### Creating New Animation

1. Click "Create New" → Editor opens
2. See code editor with default template on right, **preview thumbnail on left** (reuses AnimationThumbnail)
3. **Preview automatically starts playing** with default template animation
4. Either:

   - Select a template from dropdown (preview updates immediately)
   - Paste custom code (preview updates as you paste)
   - Write code manually (preview updates in real-time as you type)

5. **Watch preview thumbnail** to see animation changes visually (same style as browser)
6. Adjust duration and loop settings (preview updates)
7. Save with name

### Editing Existing Animation

1. Click "Edit" on animation card
2. Editor opens with existing code on right, **preview thumbnail showing current animation on left**
3. **Preview automatically plays** the existing animation (using AnimationThumbnail component)
4. Modify code functions
5. **Watch preview update in real-time** as you edit (same styling as browser previews)
6. Adjust settings (duration, loop)
7. **See visual feedback** immediately for all changes
8. Save changes

### Using Templates

1. Click "Templates" dropdown
2. Browse available templates
3. Click template to apply
4. Code editor updates with template code
5. Customize as needed

## Integration Points

### Preview Integration

**File:** `src/components/Animation/AnimationEditor.tsx`

The preview reuses the existing `AnimationThumbnail` component for consistency:

1. **Reuse Existing Component**: Use `AnimationThumbnail` component (already handles all preview logic)
2. **Pass Custom Animation**: Create a temporary `CustomAnimation` object from current code
3. **Live Updates**: As code changes, create new animation object and pass to component
4. **Automatic Updates**: Component handles all preview rendering, styling, and error states

**Preview Implementation:**

```typescript
// In AnimationEditor component
import { AnimationThumbnail } from "@/components/Animation/AnimationThumbnail";

// Create temporary animation object from current code
const previewAnimation: CustomAnimation = useMemo(() => {
  if (!codeFunctions?.path) {
    return null; // No preview if no path function
  }
  
  return {
    id: 'preview-temp',
    name: 'Preview',
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    codeFunctions,
    expressionMode,
    duration,
    loop,
  };
}, [codeFunctions, expressionMode, duration, loop]);

// Render preview using existing component
<AnimationThumbnail 
  animation={previewAnimation || getDefaultTemplateAnimation()} 
  size={160} 
/>
```

**Preview Features:**

- **Reuses `AnimationThumbnail`**: Same component used in animation browser
- **Consistent Styling**: Theme colors, simple square sprites, same visual style
- **Small Size**: 160px default (matches browser thumbnails)
- **Real-Time Updates**: Updates automatically as code changes (component handles debouncing)
- **Error Handling**: Component gracefully handles invalid code (shows loading/error state)
- **No Extra Controls**: Component handles all preview logic internally
- **Positioned Prominently**: Left side of editor for easy visual feedback

### With Generator

**File:** `src/generator.ts`

**Modify `computeMovementOffsets`:**

```typescript
// Check if custom animation is set
if (currentState.customAnimationId) {
  const animation = getAnimationById(currentState.customAnimationId);
  if (animation && !animation.isDefault) {
    const customAnim = animation as CustomAnimation;
    
    // Execute code functions
    if (customAnim.codeFunctions?.path) {
      const pathFn = eval(`(${customAnim.codeFunctions.path})`);
      const pos = pathFn(time, phase);
      return {
        offsetX: pos.x * baseUnit * motionScale,
        offsetY: pos.y * baseUnit * motionScale,
        scaleMultiplier: customAnim.codeFunctions.scale 
          ? eval(`(${customAnim.codeFunctions.scale})`)(time)
          : 1.0
      };
    }
  }
}

// Fall back to movement mode
return computeMovementOffsets(currentState.movementMode, data);
```

### With Animation Storage

**File:** `src/lib/storage/animationStorage.ts`

- Support `codeFunctions` field
- Migration for existing animations (if any)
- Validation for code functions

## Files to Create/Modify

### New Components

1. `src/components/Animation/AnimationEditor.tsx` - Main editor (reuses AnimationThumbnail for preview)
2. `src/components/Animation/CodeEditor.tsx` - Code editor component with auto-completion
3. `src/components/Animation/SimpleControls.tsx` - Simple controls panel
4. `src/components/Animation/FunctionTemplates.tsx` - Template library
5. `src/components/Animation/ExpressionSuggestions.tsx` - Expression suggestions sidebar
6. `src/components/Animation/VariableReference.tsx` - Variable reference panel
7. `src/components/Animation/ExpressionBuilder.tsx` - Guided expression builder (optional)

**Note:** Preview uses existing `AnimationThumbnail` component - no new preview component needed

### Utilities

1. `src/lib/utils/codeSandbox.ts` - Safe code execution
2. `src/lib/utils/movementModeToAnimation.ts` - Convert movement modes to code functions
3. `src/lib/utils/codeCompletion.ts` - Auto-completion provider for code editor
4. `src/lib/utils/codeHover.ts` - Hover/tooltip provider for code editor
5. `src/lib/utils/expressionSuggestions.ts` - Expression suggestion data and helpers

### Types

1. `src/types/animations.ts` - Simplify CustomAnimation interface

### Modified Files

1. `src/pages/AnimationPage.tsx` - Open editor on create/edit
2. `src/generator.ts` - Support custom animation execution
3. `src/lib/storage/animationStorage.ts` - Support code functions

## Implementation Phases

### Phase 1: Basic Editor

- Code editor integration
- Simple controls (duration, loop)
- **Preview using existing `AnimationThumbnail` component**
- **Real-time code execution and preview updates** (component handles this)
- Save/load functionality
- Basic auto-completion (variables and Math functions)

### Phase 2: Code Execution & Assistance

- Code sandbox
- Function execution
- Error handling
- Live preview
- Enhanced auto-completion (expression patterns)
- Tooltips and hover information
- Variable reference panel

### Phase 3: Templates & Suggestions

- Template library
- Template selector
- One-click apply
- Expression suggestions panel
- Expression builder helper (optional)

### Phase 4: Integration

- Generator integration
- Animation execution
- Performance optimization

## Animation Browser Tabs & Organization

### Tab System

**File:** `src/pages/AnimationPage.tsx`

The Animation page should have two tabs:

- **Default**: Shows all default animations (read-only, can be duplicated)
- **Custom**: Shows user-created custom animations (editable, deletable)

**Tab Implementation:**

```typescript
interface AnimationPageState {
  activeTab: "default" | "custom";
}

// Tab UI component
<Tabs>
  <Tab id="default" label="Default" />
  <Tab id="custom" label="Custom" />
</Tabs>
```

### Default Tab

- Displays all default animations from `DEFAULT_ANIMATIONS`
- Each animation card shows:
  - Thumbnail preview
  - Animation name
  - Description
  - Lock icon (indicating read-only)
  - "Duplicate" button (hover/action menu)
- Default animations cannot be edited or deleted
- Clicking "Duplicate" creates a copy in the Custom tab

### Custom Tab

- Displays all custom animations from `getAllCustomAnimations()`
- Each animation card shows:
  - Thumbnail preview
  - Animation name
  - Description (if provided)
  - "Edit" button
  - "Duplicate" button
  - "Delete" button
- Custom animations are fully editable and deletable
- **Empty State**: When no custom animations exist, show:
  ```typescript
  <EmptyState>
    <Icon name="sparkles" />
    <Title>No custom animations yet</Title>
    <Description>
      Create your first custom animation or duplicate a default one to get started.
    </Description>
    <Button onClick={handleCreateNew}>Create New Animation</Button>
  </EmptyState>
  ```


### Duplication Behavior

**File:** `src/lib/storage/animationStorage.ts`

When duplicating a default animation:

1. Create a new `CustomAnimation` from the `DefaultAnimation`
2. Set `isDefault: false`
3. Generate new unique `id`
4. Set name to: `"{originalName} custom"` (e.g., "Pulse custom", "Parallax custom")
5. Convert movement mode to code functions using helper
6. Save to custom animations storage
7. Switch to Custom tab and select the new animation

**Duplication Logic:**

```typescript
export function duplicateAnimation(animation: Animation, newName?: string): CustomAnimation {
  if (animation.isDefault) {
    const defaultAnim = animation as DefaultAnimation;
    // Convert default animation to custom animation
    const codeFunctions = movementModeToCodeFunctions(defaultAnim.movementMode);
    const customAnim: CustomAnimation = {
      id: generateId(),
      name: newName || `${defaultAnim.name} custom`,
      description: `Custom version of ${defaultAnim.name}`,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      codeFunctions,
      expressionMode: "javascript",
      duration: 2.0,
      loop: true,
    };
    saveCustomAnimation(customAnim);
    return customAnim;
  } else {
    // Duplicate existing custom animation
    // ... existing logic
  }
}
```

### Populating Editor from Existing Animation Settings

When opening the animation editor (for editing or creating from duplicate):

**File:** `src/components/Animation/AnimationEditor.tsx`

**For Duplicated Default Animations:**

1. Extract movement mode from the default animation
2. Convert movement mode to code functions using `movementModeToCodeFunctions()`
3. Populate editor with:

   - Code functions derived from movement mode
   - Default duration (2.0 seconds)
   - Default loop (true)

**Helper Functions:**

```typescript
// src/lib/utils/movementModeToAnimation.ts
export function movementModeToCodeFunctions(mode: MovementMode): {
  path: string;
  rotation?: string;
  scale?: string;
  opacity?: string;
} {
  switch (mode) {
    case "pulse":
      return {
        path: "function path(t, phase) { return { x: 0, y: 0 }; }",
        scale: "function scale(t) { return 1 + Math.sin(t * Math.PI * 2) * 0.55; }",
      };
    case "parallax":
      return {
        path: "function path(t, phase) { return { x: t - 0.5, y: 0 }; }",
      };
    case "spiral":
      return {
        path: "function path(t, phase) { const angle = t * Math.PI * 4 + phase; const radius = t * 0.5; return { x: Math.sin(angle) * radius, y: Math.cos(angle) * radius }; }",
      };
    // ... other modes
  }
}
```

**Editor Initialization:**

```typescript
// In AnimationEditor component
useEffect(() => {
  if (animation) {
    if (animation.isDefault) {
      // This shouldn't happen (defaults can't be edited)
      // But if duplicating, convert to custom first
      const defaultAnim = animation as DefaultAnimation;
      const codeFunctions = movementModeToCodeFunctions(defaultAnim.movementMode);
      setEditorState({
        codeFunctions,
        expressionMode: "javascript",
        duration: 2.0,
        loop: true,
      });
    } else {
      // Load existing custom animation
      const customAnim = animation as CustomAnimation;
      setEditorState({
        codeFunctions: customAnim.codeFunctions,
        expressionMode: customAnim.expressionMode,
        duration: customAnim.duration,
        loop: customAnim.loop,
      });
    }
  } else {
    // New animation - start with default template
    setEditorState(getDefaultEditorState());
  }
}, [animation]);
```

### Modified Files

1. **`src/pages/AnimationPage.tsx`**

   - Add tab state management
   - Filter animations by tab (default vs custom)
   - Handle tab switching
   - Show empty state in Custom tab when no custom animations exist

2. **`src/components/Animation/AnimationBrowser.tsx`**

   - Accept `filter` prop to show only default or custom animations
   - Update to work with tab filtering

3. **`src/lib/storage/animationStorage.ts`**

   - Update `duplicateAnimation` to handle default → custom conversion
   - Add helper to generate "custom" suffix names
   - Ensure duplicated animations appear in custom storage

4. **`src/lib/utils/movementModeToAnimation.ts`** (new)

   - Convert movement modes to code functions
   - Create default code functions for each mode

5. **`src/components/Animation/AnimationEditor.tsx`**

   - Initialize editor state from duplicated default animations
   - Populate editor with converted code functions
   - Handle both new and existing custom animations

## UX Considerations

### For Novices

- **Templates**: Pre-made code templates to start from
- **Simple Controls**: Basic duration/loop controls
- **Clear Examples**: Well-commented template code
- **Error Messages**: Helpful error messages with suggestions
- **Expression Suggestions**: Click-to-insert common patterns
- **Variable Reference**: Easy access to available variables with examples
- **Tooltips**: Hover to learn about variables and functions
- **Guided Builder**: Optional step-by-step expression builder
- **Visual Preview**: Preview thumbnail (reuses AnimationThumbnail) shows exactly what the animation looks like
- **Live Feedback**: See changes immediately as you edit code - no guessing
- **Consistent Styling**: Preview matches browser thumbnails (theme colors, simple sprites)

### For Advanced Users

- **Full Code Access**: Complete JavaScript functions
- **Paste Support**: Easy code pasting
- **Quick Access**: Keyboard shortcuts
- **Documentation**: Inline help for available functions
- **Smart Auto-completion**: Context-aware suggestions
- **Expression Patterns**: Quick insertion of common patterns
- **Hover Documentation**: Quick reference without leaving editor
- **Real-Time Preview**: See code execution results instantly in preview thumbnail
- **Consistent Experience**: Preview matches browser thumbnails for familiar visual feedback

### For Both

- **Consistent UI**: Matches app design system
- **Responsive**: Works on different screen sizes
- **Accessible**: Keyboard navigation, screen readers
- **Fast**: Smooth interactions, no lag
- **Reliable**: Auto-save, error recovery