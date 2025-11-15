# Complete Guide: Managing Color Palettes in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding the Palette System](#understanding-the-palette-system)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Operations: Add, Change, Remove](#operations-add-change-remove)
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
- **Radix UI** for accessible components

### What Are Palettes?
Color palettes are collections of 4-5 colors that define the visual theme of the generated art. Each palette:
- Colors sprites on the canvas
- Can be used for canvas backgrounds
- Generates gradient variations automatically
- Appears in UI dropdown selectors with visual previews

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── data/                    # Data definitions
│   │   ├── palettes.ts         # ⭐ MAIN FILE - Palette definitions
│   │   ├── gradients.ts        # Auto-generated sprite gradients
│   │   ├── icons.ts            # Icon definitions
│   │   └── coolhue.ts         # Additional color utilities
│   │
│   ├── components/             # React components
│   │   ├── retroui/            # Retro UI component library
│   │   │   └── Select.tsx      # Dropdown select component
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   │
│   ├── App.tsx                 # Main application component
│   ├── generator.ts            # Canvas rendering & animation logic
│   ├── index.css               # Global styles (includes palette UI styles)
│   └── main.tsx                # Application entry point
│
├── docs/
│   └── adding-color-palettes.md  # This file
│
└── package.json                # Project dependencies
```

### Key Files for Palette Management

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/data/palettes.ts` | **Single source of truth** for all palettes | ✅ **YES** - Only file you edit |
| `src/data/gradients.ts` | Sprite gradient definitions | ❌ Auto-generated |
| `src/App.tsx` | UI selectors and palette options | ❌ Auto-generated from `palettes.ts` |
| `src/generator.ts` | Canvas rendering with palette colors | ❌ Uses palette data automatically |
| `src/index.css` | Styles for category labels & color previews | ❌ Already implemented |

---

## Understanding the Palette System

### Palette Data Structure

Every palette is a TypeScript object with this structure:

```typescript
interface Palette {
  id: string;           // Unique identifier (lowercase, no spaces)
  name: string;         // Display name shown in UI
  colors: string[];     // Array of 4-5 hex color codes
  category?: string;    // Optional: Groups palettes in dropdown
}
```

### Example Palette
```typescript
{
  id: "cyber",
  name: "Cyber Matrix",
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
  category: "Neon/Cyber"
}
```

### How Palettes Are Used

1. **Sprite Coloring**: Each sprite on the canvas uses colors from the selected palette
2. **Canvas Background**: The canvas can use a palette color (solid) or gradient
3. **Gradient Generation**: Each palette color automatically generates gradient variations
4. **UI Display**: Palettes appear in dropdowns with:
   - Category grouping (if categorized)
   - 8x8px color preview squares
   - Alphabetical sorting within categories

---

## File-by-File Breakdown

### 1. `src/data/palettes.ts` - The Main File

**Location:** `src/data/palettes.ts`  
**Purpose:** Single source of truth for all color palettes

**What's in this file:**
```typescript
// Type definition
export interface Palette {
  id: string;
  name: string;
  colors: string[];
  category?: string;
}

// Array of all palettes (THIS IS WHAT YOU EDIT)
export const palettes: Palette[] = [
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  // ... more palettes
];

// Default palette ID (used as fallback)
export const defaultPaletteId = "neon";

// Helper functions
export const getPalette = (id: string) =>
  palettes.find((palette) => palette.id === id) ?? palettes[0];

export const getRandomPalette = () =>
  palettes[Math.floor(Math.random() * palettes.length)];
```

**Key Points:**
- This is the **ONLY file you manually edit** for palette management
- All palettes are in the `palettes` array
- Palettes are organized by category with comments
- The `defaultPaletteId` is used when a palette can't be found

---

### 2. `src/data/gradients.ts` - Auto-Generated Gradients

**Location:** `src/data/gradients.ts`  
**Purpose:** Generates gradient variations for each palette color

**How it works:**
1. Imports `palettes` from `palettes.ts`
2. `generatePaletteGradients()` function processes each palette
3. Creates a 3-color gradient for each color in the palette
4. Gradients are named: `"{Palette Name} - {First/Second/Third/etc}"`
5. Gradient IDs: `"{palette-id}_{color-index}"` (e.g., `"cyber_0"`, `"cyber_1"`)

**Example:**
```typescript
// For palette "Cyber Matrix" with colors ["#00ff41", "#00d4ff", ...]
// Generates:
// - "Cyber Matrix - First" (id: "cyber_0")
// - "Cyber Matrix - Second" (id: "cyber_1")
// - etc.
```

**You don't edit this file** - it automatically reads from `palettes.ts`

---

### 3. `src/App.tsx` - UI Components

**Location:** `src/App.tsx`  
**Purpose:** Main React component with UI selectors

**Key Code Sections:**

#### Palette Options Generation (Lines ~200-270)
```typescript
// Auto-generates dropdown options from palettes array
const PALETTE_OPTIONS = (() => {
  const categoryOrder = [
    "Neon/Cyber",
    "Warm/Fire",
    "Cool/Ocean",
    "Nature",
    "Soft/Pastel",
    "Dark/Mysterious",
  ];
  
  // Groups palettes by category
  // Sorts alphabetically within each category
  // Returns array with: { value, label, category, colors }
})();

// Canvas options include "auto" option first
const CANVAS_PALETTE_OPTIONS = [
  { value: "auto", label: "Palette (auto)" },
  ...PALETTE_OPTIONS,  // All palettes included
];
```

#### ControlSelect Component (Lines ~411-580)
This component handles:
- Category grouping with labels
- Color preview squares (8x8px)
- Dropdown rendering
- Option selection

**You don't edit this file** - it automatically reads from `palettes.ts`

---

### 4. `src/generator.ts` - Canvas Rendering

**Location:** `src/generator.ts`  
**Purpose:** Handles canvas drawing, sprite rendering, and animation

**How palettes are used:**
- **Sprite colors**: Uses palette colors to tint sprites
- **Canvas background (solid)**: Uses first color from selected palette
- **Canvas background (gradient)**: Uses first 3 colors from selected palette
- **Gradient direction**: Controlled by `canvasGradientDirection` setting

**Key Code Location:** Lines ~1026-1054 (canvas gradient rendering)

**You don't edit this file** - it automatically uses palette data

---

### 5. `src/index.css` - Styles

**Location:** `src/index.css`  
**Purpose:** Global CSS styles including palette UI styles

**Relevant Styles (Lines ~2485-2540):**
- `.control-select-category-label` - Category label styling
- `.control-select-color-preview` - Color preview container
- `.control-select-color-square` - 8x8px color squares
- `.control-dropdown-item-with-preview` - Item layout with previews

**You don't edit this file** - styles are already implemented

---

## Operations: Add, Change, Remove

### Operation 1: Adding a New Palette

#### Step-by-Step Instructions

1. **Open the palette file**
   ```
   File: src/data/palettes.ts
   ```

2. **Locate the appropriate category section**
   - Find the category comment (e.g., `// Neon/Cyber`)
   - Or add to the end if uncategorized

3. **Add the new palette object**
   ```typescript
   {
     id: "unique-id",        // Lowercase, no spaces, use hyphens
     name: "Display Name",   // Creative 1-2 word name
     colors: [               // 4-5 hex color strings
       "#color1",
       "#color2",
       "#color3",
       "#color4",
       "#color5"  // Optional 5th color
     ],
     category: "Category Name"  // Optional but recommended
   }
   ```

4. **Place it in the correct location**
   - Within the category section (if categorized)
   - Alphabetically within the category (optional, but recommended)
   - At the end if uncategorized

5. **Save the file**

#### Complete Example

**Before:**
```typescript
export const palettes: Palette[] = [
  // Neon/Cyber
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
    category: "Neon/Cyber",
  },
  // ... rest of palettes
];
```

**After (adding "Electric Storm"):**
```typescript
export const palettes: Palette[] = [
  // Neon/Cyber
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
    category: "Neon/Cyber",
  },
  {
    id: "electric-storm",  // ← NEW PALETTE
    name: "Electric Storm",
    colors: ["#ff00ff", "#00ffff", "#ffff00", "#ff0080"],
    category: "Neon/Cyber",
  },
  // ... rest of palettes
];
```

#### What Happens Automatically

After saving `palettes.ts`, the following happens automatically:

1. **Sprite Gradients** (`src/data/gradients.ts`)
   - `generatePaletteGradients()` processes the new palette
   - Creates gradients for each color
   - Gradients available via `getGradientsForPalette("electric-storm")`

2. **UI Selectors** (`src/App.tsx`)
   - `PALETTE_OPTIONS` includes the new palette
   - `CANVAS_PALETTE_OPTIONS` includes the new palette
   - Appears in "Sprite palette" dropdown
   - Appears in "Canvas" dropdown (after "Palette (auto)")

3. **Category Grouping** (`src/App.tsx` - `ControlSelect`)
   - Groups under "Neon/Cyber" category
   - Category label appears above the group
   - Sorted alphabetically within category

4. **Color Preview Squares** (`src/App.tsx` - `ControlSelect`)
   - 8x8px squares displayed for each color
   - Appears before palette name in dropdown

5. **Canvas Rendering** (`src/generator.ts`)
   - Can use palette for sprite colors
   - Can use palette for canvas background
   - Gradient mode uses first 3 colors

**No other files need changes!**

---

### Operation 2: Changing an Existing Palette

#### What Can Be Changed

| Property | Can Change? | Notes |
|----------|-------------|-------|
| `name` | ✅ Yes | Display name in UI |
| `colors` | ✅ Yes | Add/remove/change colors |
| `category` | ✅ Yes | Move to different category |
| `id` | ⚠️ **WARNING** | Breaks saved states and references |

#### Step-by-Step Instructions

1. **Open the palette file**
   ```
   File: src/data/palettes.ts
   ```

2. **Find the palette by ID**
   - Search for the `id` value (e.g., `"cyber"`)
   - Or search for the `name` value

3. **Make your changes**
   - Update `name` for display name
   - Update `colors` array for color changes
   - Update `category` to move categories
   - **DO NOT change `id`** unless you understand the consequences

4. **Save the file**

#### Examples

**Example 1: Changing Name and Colors**
```typescript
// Before
{
  id: "cyber",
  name: "Cyber Matrix",
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
  category: "Neon/Cyber",
}

// After
{
  id: "cyber",  // ← Keep same ID
  name: "Cyber Grid",  // ← Changed name
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00"],  // ← Removed white
  category: "Neon/Cyber",
}
```

**Example 2: Moving to Different Category**
```typescript
// Before
{
  id: "cyber",
  name: "Cyber Matrix",
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
  category: "Neon/Cyber",
}

// After
{
  id: "cyber",
  name: "Cyber Matrix",
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
  category: "Cool/Ocean",  // ← Changed category
}
```

**Example 3: Adding More Colors**
```typescript
// Before
{
  id: "cyber",
  name: "Cyber Matrix",
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00"],
  category: "Neon/Cyber",
}

// After
{
  id: "cyber",
  name: "Cyber Matrix",
  colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],  // ← Added white
  category: "Neon/Cyber",
}
```

#### What Happens Automatically

- ✅ Sprite gradients regenerated with new colors
- ✅ UI selectors update with new name/colors
- ✅ Category grouping updates if category changed
- ✅ Color preview squares update with new colors
- ✅ Canvas gradients use updated colors

**No other files need changes!**

---

### Operation 3: Removing a Palette

#### Step-by-Step Instructions

1. **Open the palette file**
   ```
   File: src/data/palettes.ts
   ```

2. **Find the palette**
   - Search for the `id` or `name`
   - Locate the entire palette object

3. **Remove the palette object**
   - Delete the entire object (including the comma if it's not the last item)
   - Or comment it out if you want to keep it for reference

4. **Save the file**

#### Example

**Before:**
```typescript
export const palettes: Palette[] = [
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  {
    id: "cyber",  // ← PALETTE TO REMOVE
    name: "Cyber Matrix",
    colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
    category: "Neon/Cyber",
  },
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
    category: "Neon/Cyber",
  },
];
```

**After:**
```typescript
export const palettes: Palette[] = [
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  // Removed "cyber" palette
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
    category: "Neon/Cyber",
  },
];
```

#### What Happens Automatically

- ✅ Removed from `PALETTE_OPTIONS` in `src/App.tsx`
- ✅ Removed from `CANVAS_PALETTE_OPTIONS` in `src/App.tsx`
- ✅ No longer appears in UI dropdowns
- ✅ Category grouping updates (category label removed if it was the last palette)

#### Important Warnings

⚠️ **User Impact:**
- If a user has this palette selected, they'll fall back to `defaultPaletteId` ("neon")
- Saved presets referencing this palette ID will need to handle the missing palette
- The app uses `getPalette(id)` which falls back to `palettes[0]` if not found

⚠️ **Cleanup (Optional):**
- Sprite gradients for this palette remain in `src/data/gradients.ts` but are unused
- You can manually remove them if desired, but it's not required

---

## Data Flow & Dependencies

### How Data Flows Through the System

```
┌─────────────────────────────────────┐
│  src/data/palettes.ts               │
│  (Single Source of Truth)            │
│  - palettes array                    │
│  - Palette interface                 │
└──────────────┬──────────────────────┘
               │
               │ Imported by:
               │
    ┌──────────┴──────────┬──────────────┬──────────────┐
    │                      │              │              │
    ▼                      ▼              ▼              ▼
┌──────────┐        ┌──────────┐   ┌──────────┐  ┌──────────┐
│gradients.│        │ App.tsx  │   │generator.│  │  Other   │
│   ts     │        │          │   │    ts    │  │  files   │
└──────────┘        └──────────┘   └──────────┘  └──────────┘
    │                      │              │
    │                      │              │
    ▼                      ▼              ▼
Auto-generates      Auto-generates    Uses palette
sprite gradients    UI options       for rendering
```

### Dependency Chain

1. **`palettes.ts`** (you edit this)
   ↓
2. **`gradients.ts`** (auto-generates from `palettes.ts`)
   ↓
3. **`App.tsx`** (auto-generates options from `palettes.ts`)
   ↓
4. **`generator.ts`** (uses palette data for rendering)
   ↓
5. **UI Components** (display palettes with categories & previews)

### Import Relationships

```typescript
// src/data/gradients.ts
import { palettes, type Palette } from "./palettes";

// src/App.tsx
import { palettes } from "./data/palettes";

// src/generator.ts
import { getPalette, defaultPaletteId } from "./data/palettes";
```

---

## Code Examples

### Example 1: Complete Palette Addition

**File: `src/data/palettes.ts`**

```typescript
export const palettes: Palette[] = [
  // Neon/Cyber
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
    category: "Neon/Cyber",
  },
  {
    id: "electric-storm",  // ← NEW
    name: "Electric Storm",
    colors: ["#ff00ff", "#00ffff", "#ffff00", "#ff0080", "#8000ff"],
    category: "Neon/Cyber",
  },
  // ... rest of palettes
];
```

### Example 2: Category Organization

**File: `src/data/palettes.ts`**

```typescript
export const palettes: Palette[] = [
  // Neon/Cyber - Bright, high-contrast neon colors
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  {
    id: "cyber",
    name: "Cyber Matrix",
    colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
    category: "Neon/Cyber",
  },
  
  // Warm/Fire - Warm tones (reds, oranges, yellows)
  {
    id: "sunset",
    name: "Sunset Drive",
    colors: ["#ff7b00", "#ff5400", "#ff0054", "#ad00ff", "#6300ff"],
    category: "Warm/Fire",
  },
  {
    id: "lava",
    name: "Molten Core",
    colors: ["#ff0000", "#ff4500", "#ff8c00", "#ffd700", "#ffff00"],
    category: "Warm/Fire",
  },
  
  // Cool/Ocean - Cool tones (blues, teals, aquas)
  {
    id: "oceanic",
    name: "Oceanic Pulse",
    colors: ["#031a6b", "#033860", "#087ca7", "#3fd7f2", "#9ef6ff"],
    category: "Cool/Ocean",
  },
  
  // ... more categories
];
```

### Example 3: Uncategorized Palette

**File: `src/data/palettes.ts`**

```typescript
export const palettes: Palette[] = [
  // ... categorized palettes ...
  
  // Uncategorized palettes (appear in "Other" group)
  {
    id: "custom-palette",
    name: "Custom Colors",
    colors: ["#123456", "#789abc", "#def012", "#345678"],
    // No category property - appears in "Other" group
  },
];
```

---

## Testing & Verification

### Testing Checklist

After adding, changing, or removing a palette, verify the following:

#### 1. Sprite Palette Selector
**Location:** "Colours" tab → "Palette & Variance" section

**Steps:**
1. Open the "Sprite palette" dropdown
2. Verify the palette appears/disappears/updates correctly
3. Check category grouping:
   - If categorized: appears under correct category label
   - If uncategorized: appears in "Other" group at end
4. Verify color preview squares:
   - 8x8px squares visible next to palette name
   - Shows all colors from palette (4-5 squares)
5. Select the palette
6. Verify sprites on canvas change colors

**Expected Result:**
- Palette appears in correct category
- Color previews visible
- Selecting changes sprite colors

#### 2. Sprite Gradients
**Location:** "Colours" tab → "Palette & Variance" section

**Steps:**
1. Enable "Use gradients" switch
2. Select your palette
3. Verify sprites use gradient fills
4. Check that each sprite gets a different gradient

**Expected Result:**
- Gradients work with the palette
- Each sprite has a unique gradient

#### 3. Canvas Palette (Solid)
**Location:** "Colours" tab → "Canvas" section

**Steps:**
1. Open the "Canvas" dropdown
2. Verify palette appears (after "Palette (auto)" option)
3. Check category grouping and color previews
4. Select the palette
5. Verify canvas background changes color

**Expected Result:**
- Palette appears in dropdown
- Selecting changes canvas background to first palette color

#### 4. Canvas Gradients
**Location:** "Colours" tab → "Canvas" section

**Steps:**
1. Enable "Use gradients" switch in Canvas section
2. Select your palette in Canvas dropdown
3. Verify gradient uses palette colors
4. Check gradient direction (adjustable via slider)

**Expected Result:**
- Canvas shows gradient using first 3 colors from palette
- Gradient direction can be adjusted

---

## Troubleshooting

### Problem: Palette doesn't appear in dropdown

**Possible Causes:**
1. Syntax error in `palettes.ts`
2. Missing comma between palette objects
3. Invalid color format
4. TypeScript compilation error

**Solutions:**
1. Check browser console for errors
2. Verify TypeScript compilation: `npm run build`
3. Check palette object syntax matches interface
4. Verify all colors are valid hex strings (e.g., `"#ff0000"`)

### Problem: Color preview squares not showing

**Possible Causes:**
1. `colors` array is empty or missing
2. CSS styles not loaded
3. Component rendering issue

**Solutions:**
1. Verify `colors` array has 4-5 hex color strings
2. Check browser DevTools for CSS errors
3. Verify `ControlSelect` component receives `colors` in options

### Problem: Category label not appearing

**Possible Causes:**
1. `category` property missing or incorrect
2. Category name doesn't match predefined categories
3. Component grouping logic issue

**Solutions:**
1. Verify `category` property exists and matches one of:
   - "Neon/Cyber"
   - "Warm/Fire"
   - "Cool/Ocean"
   - "Nature"
   - "Soft/Pastel"
   - "Dark/Mysterious"
2. Check `ControlSelect` component grouping logic
3. Uncategorized palettes appear in "Other" group

### Problem: Gradients not working

**Possible Causes:**
1. `generatePaletteGradients()` not called
2. Palette ID mismatch
3. Gradient generation error

**Solutions:**
1. Verify `gradients.ts` imports `palettes` correctly
2. Check `getGradientsForPalette()` function
3. Verify palette ID matches between palette and gradient

### Problem: Canvas not using palette colors

**Possible Causes:**
1. Canvas mode not set correctly
2. Palette selection not applied
3. Rendering logic issue

**Solutions:**
1. Verify canvas mode (solid vs gradient)
2. Check `generator.ts` canvas rendering code
3. Verify palette selection in UI

### Problem: TypeScript errors after changes

**Possible Causes:**
1. Interface mismatch
2. Type errors in palette object
3. Import/export issues

**Solutions:**
1. Verify palette object matches `Palette` interface
2. Check all required properties present
3. Run `npm run build` to see detailed errors
4. Verify imports in other files

---

## Best Practices

### ID Naming
- ✅ Use lowercase
- ✅ Use hyphens for multi-word IDs: `"electric-storm"` not `"electricStorm"`
- ✅ Keep IDs descriptive but short
- ✅ **Never change an ID** once published (breaks saved states)
- ❌ Don't use spaces or special characters
- ❌ Don't use camelCase or PascalCase

**Good Examples:**
- `"neon-pop"`
- `"electric-storm"`
- `"midnight-void"`

**Bad Examples:**
- `"Neon Pop"` (spaces, uppercase)
- `"neonPop"` (camelCase)
- `"neon_pop"` (underscores)

### Color Selection
- ✅ Use 4-5 colors per palette (optimal variety)
- ✅ Choose colors that work well together:
  - Complementary (opposites on color wheel)
  - Analogous (adjacent colors)
  - Triadic (three evenly spaced colors)
- ✅ Ensure good contrast for visibility
- ✅ Include mix of light and dark colors for depth
- ✅ Use hex format: `"#rrggbb"` (e.g., `"#ff0000"` for red)
- ❌ Don't use too few colors (less than 3)
- ❌ Don't use too many colors (more than 5)

**Good Examples:**
```typescript
colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"]  // 5 colors, good contrast
colors: ["#ff0000", "#00ff00", "#0000ff"]  // 3 colors, primary colors
```

**Bad Examples:**
```typescript
colors: ["#ff0000"]  // Too few colors
colors: ["#ff0000", "#ff0001", "#ff0002", "#ff0003", "#ff0004", "#ff0005", "#ff0006"]  // Too many, too similar
```

### Category Selection
- ✅ Pick category that best matches palette aesthetic
- ✅ Use existing categories when possible
- ✅ Leave uncategorized if unsure (appears in "Other" group)
- ❌ Don't create new category names (won't be grouped properly)

**Category Guide:**
- **Neon/Cyber**: Bright, high-contrast neon colors (cyans, magentas, greens)
- **Warm/Fire**: Warm tones (reds, oranges, yellows)
- **Cool/Ocean**: Cool tones (blues, teals, aquas)
- **Nature**: Earth and nature tones (greens, browns, earth colors)
- **Soft/Pastel**: Muted, soft pastel colors
- **Dark/Mysterious**: Dark, moody palettes (deep purples, dark blues)

### Organization
- ✅ Group palettes by category in `palettes.ts` for readability
- ✅ Add comments to separate category sections
- ✅ Keep related palettes together
- ✅ Sort alphabetically within categories (optional but recommended)
- ❌ Don't mix categories randomly

**Good Organization:**
```typescript
export const palettes: Palette[] = [
  // Neon/Cyber
  {
    id: "arcade",
    name: "Arcade Neon",
    // ...
  },
  {
    id: "cyber",
    name: "Cyber Matrix",
    // ...
  },
  {
    id: "neon",
    name: "Neon Pop",
    // ...
  },
  
  // Warm/Fire
  {
    id: "ember",
    name: "Ember Glow",
    // ...
  },
  // ...
];
```

### File Structure
- ✅ Only edit `src/data/palettes.ts`
- ✅ Let other files auto-update
- ✅ Test after changes
- ❌ Don't manually edit auto-generated files
- ❌ Don't edit `gradients.ts`, `App.tsx`, or `generator.ts` for palette changes

---

## Summary

### Quick Reference

**To add/change/remove palettes:**
1. Edit **ONLY** `src/data/palettes.ts`
2. All other files update automatically
3. Test using the checklist above

**Files that auto-update:**
- `src/data/gradients.ts` - Sprite gradients
- `src/App.tsx` - UI selectors and options
- `src/generator.ts` - Canvas rendering

**Files you never edit for palettes:**
- `src/data/gradients.ts`
- `src/App.tsx`
- `src/generator.ts`
- `src/index.css`

### Key Points

- ✅ **Single source of truth**: `src/data/palettes.ts`
- ✅ **Automatic features**: Gradients, UI options, category grouping, color previews
- ✅ **Type safety**: TypeScript interface ensures correct structure
- ✅ **Easy to use**: Just edit one file, everything else updates

### What Gets Auto-Generated

When you edit `palettes.ts`, the system automatically:
- ✅ Generates sprite gradients for each palette color
- ✅ Creates UI dropdown options with categories
- ✅ Displays color preview squares (8x8px)
- ✅ Groups palettes by category with labels
- ✅ Makes palettes available for canvas backgrounds
- ✅ Enables gradient generation for canvas

**That's it!** The system handles everything else. 🎨

---

## Additional Resources

### Related Files to Understand
- `src/App.tsx` - Main component structure
- `src/generator.ts` - Canvas rendering logic
- `src/data/gradients.ts` - Gradient generation algorithm
- `src/components/retroui/Select.tsx` - Dropdown component

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run build  # (includes TypeScript check)

# Preview production build
npm run preview
```

### Getting Help
- Check browser console for errors
- Verify TypeScript compilation
- Review this guide's troubleshooting section
- Check file imports and exports

---

**Last Updated:** 2025-01-18  
**Maintained By:** BitLab Development Team
