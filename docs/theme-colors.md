# Complete Guide: Theme Colors in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Understanding Theme Colors](#understanding-theme-colors)
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

### What Are Theme Colors?

Theme colors are accent colors applied to the **entire UI interface** (buttons, borders, highlights, backgrounds). They affect:
- **UI Elements**: Buttons, borders, panels, cards, status bars
- **Background Colors**: Page background in both light and dark modes
- **Text Colors**: Headings, links, hints, notes
- **Interactive Elements**: Selects, checkboxes, sliders
- **Accent Colors**: Primary, secondary, and muted color variations

**Important**: Theme colors do NOT affect canvas sprites or generated art - they only style the application interface.

---

## Project Structure

### Directory Tree
```
bitlab/
├── src/
│   ├── constants/                # Constants and type definitions
│   │   └── theme.ts            # ⭐ MAIN FILE - Theme color definitions
│   │
│   ├── hooks/                  # React hooks
│   │   └── useTheme.ts        # Theme state management & persistence
│   │
│   ├── components/             # React components
│   │   └── Header/            # Header component with theme selector
│   │       └── Header.tsx     # Theme color selector UI
│   │
│   ├── index.css              # ⭐ MAIN FILE - Theme color CSS variables
│   ├── App.tsx                # Main application component
│   └── main.tsx                # Application entry point
│
├── docs/
│   └── theme-colors.md         # This file
│
└── package.json                # Project dependencies
```

### Key Files for Theme Color Management

| File | Purpose | Manual Edit? |
|------|---------|--------------|
| `src/constants/theme.ts` | **Single source of truth** for theme color definitions | ✅ **YES** - Add new colors here |
| `src/index.css` | **CSS variables** for all theme colors (dark/light modes) | ✅ **YES** - Add CSS for new colors |
| `src/hooks/useTheme.ts` | Theme state management and localStorage persistence | ✅ **YES** - Update validation arrays |
| `src/components/Header/Header.tsx` | Theme selector UI component | ✅ **YES** - Update validation arrays |

---

## Understanding Theme Colors

### Available Theme Colors

BitLab currently supports **12 theme colors**:

1. **Amber** (Sunburst) - `#ffdb33` - Warm golden yellow
2. **Mint** (Neon Grid) - `#58f5c2` - Bright cyan-green
3. **Violet** (Nebula) - `#c99cff` - Soft purple
4. **Ember** (Ember Glow) - `#ff6b3d` - Vibrant orange-red
5. **Lagoon** (Lagoon Tide) - `#3ad7ff` - Bright cyan-blue
6. **Rose** (Rose Quartz) - `#ff7cc8` - Soft pink
7. **Battleship** (Battleship) - `#8b8b8b` - Neutral grey
8. **Cyan** (Electric Cyan) - `#00ffff` - Pure cyan
9. **Lime** (Lime Zest) - `#bfff00` - Bright yellow-green
10. **Coral** (Coral Reef) - `#ff7f50` - Warm coral-pink
11. **Indigo** (Deep Indigo) - `#4b0082` - Deep purple-blue
12. **Gold** (Metallic Gold) - `#ffd700` - Metallic gold

### How It Works

1. **Storage**: Theme color is stored in `localStorage` with key `"retro-theme-color"`
2. **Application**: Applied via CSS custom properties (`--accent-primary`, `--bg-base`, etc.)
3. **Persistence**: Automatically saved and restored on page load
4. **Scope**: Updates entire UI globally (buttons, backgrounds, text, etc.)

### Theme Color Structure

Each theme color requires **three CSS sections**:

1. **Base Color Variables** - Accent colors for UI elements
   ```css
   [data-theme-color="cyan"] {
     --accent-primary: #00ffff;
     --accent-primary-shadow: #008b8b;
     --accent-primary-contrast: #001a1a;
     /* ... more accent variables */
   }
   ```

2. **Dark Mode Variables** - Backgrounds, text, panels for dark theme
   ```css
   [data-theme-color="cyan"][data-theme="dark"] {
     --bg-base: #001a1a;
     --bg-top: #002d2d;
     --text-primary: #e6ffff;
     /* ... more dark mode variables */
   }
   ```

3. **Light Mode Variables** - Backgrounds, text, panels for light theme
   ```css
   [data-theme-color="cyan"][data-theme="light"] {
     --bg-base: #e6ffff;
     --bg-top: #ffffff;
     --text-primary: #001a1a;
     /* ... more light mode variables */
   }
   ```

4. **Body Background Rule** - Ensures body uses theme background in dark mode
   ```css
   html[data-theme="dark"][data-theme-color="cyan"] body {
     background: var(--bg-top);
   }
   ```

---

## File-by-File Breakdown

### 1. `src/constants/theme.ts` - Theme Color Definitions

**Location:** `src/constants/theme.ts`  
**Purpose:** TypeScript type definitions and theme color options

**Key Exports:**
- `ThemeColor` - Union type of all theme color IDs
- `THEME_COLOR_OPTIONS` - Array of theme options for UI selector
- `THEME_COLOR_PREVIEW` - Hex color codes for preview squares

**Example:**
```typescript
export type ThemeColor = "amber" | "mint" | "violet" | "ember" | "lagoon" | "rose" 
  | "battleship" | "cyan" | "lime" | "coral" | "indigo" | "gold";

export const THEME_COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  { value: "amber", label: "Sunburst" },
  { value: "mint", label: "Neon Grid" },
  // ... more colors
];

export const THEME_COLOR_PREVIEW: Record<ThemeColor, string> = {
  amber: "#ffdb33",
  mint: "#58f5c2",
  // ... more colors
};
```

### 2. `src/index.css` - Theme Color CSS Variables

**Location:** `src/index.css`  
**Purpose:** CSS custom properties for all theme colors

**Structure:**
1. **Base color variables** (lines ~275-357) - Accent colors
2. **Dark mode variables** (lines ~359-1149) - Dark theme backgrounds/text
3. **Light mode variables** (lines ~827-1149) - Light theme backgrounds/text
4. **Body background rules** (lines ~1202-1224) - Dark mode body backgrounds

**Key CSS Variables:**
- `--accent-primary` - Main accent color (buttons, borders)
- `--accent-primary-shadow` - Shadow color for buttons
- `--accent-primary-contrast` - Text color on accent background
- `--bg-base` - Base background color (gradient bottom)
- `--bg-top` - Top background color (gradient top)
- `--text-primary` - Main text color
- `--text-muted` - Muted/secondary text color
- `--panel-bg` - Panel/card background
- `--panel-border` - Panel/card border
- `--panel-shadow` - Panel/card shadow

### 3. `src/hooks/useTheme.ts` - Theme Management Hook

**Location:** `src/hooks/useTheme.ts`  
**Purpose:** Theme state management and localStorage persistence

**Key Features:**
- Loads theme color from localStorage on mount
- Applies theme to document via `data-theme-color` attribute
- Persists theme changes to localStorage
- Validates theme color against allowed values

**Key Functions:**
- `getStoredThemeColor()` - Reads from localStorage, validates, defaults to "amber"
- `useTheme()` - React hook that manages theme state

### 4. `src/components/Header/Header.tsx` - Theme Selector UI

**Location:** `src/components/Header/Header.tsx`  
**Purpose:** UI component for selecting theme color

**Key Features:**
- Dropdown selector with all theme colors
- Color preview squares next to each option
- Updates theme on selection
- Shows current theme color

**Key Functions:**
- `handleThemeSelect()` - Validates and applies selected theme color

---

## Operations: Add, Change, Remove

### Adding a New Theme Color

**Step 1: Add to Type Definition**
1. Open `src/constants/theme.ts`
2. Add new color ID to `ThemeColor` union type:
```typescript
export type ThemeColor = "amber" | "mint" | /* ... */ | "newcolor";
```

**Step 2: Add to Options Array**
1. Still in `src/constants/theme.ts`
2. Add to `THEME_COLOR_OPTIONS`:
```typescript
export const THEME_COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  // ... existing colors
  { value: "newcolor", label: "New Color Name" },
];
```

**Step 3: Add Preview Color**
1. Still in `src/constants/theme.ts`
2. Add to `THEME_COLOR_PREVIEW`:
```typescript
export const THEME_COLOR_PREVIEW: Record<ThemeColor, string> = {
  // ... existing colors
  newcolor: "#hexcolor",
};
```

**Step 4: Update Validation Arrays**
1. Open `src/hooks/useTheme.ts`
2. Add new color to `validColors` array in `getStoredThemeColor()`:
```typescript
const validColors: ThemeColor[] = [
  "amber", "mint", /* ... */, "newcolor",
];
```

3. Open `src/components/Header/Header.tsx`
4. Add new color to `validColors` array in `handleThemeSelect()`:
```typescript
const validColors = [
  "amber", "mint", /* ... */, "newcolor",
];
```

**Step 5: Add Base Color CSS Variables**
1. Open `src/index.css`
2. Find the section after `[data-theme-color="gold"]` (around line 357)
3. Add base color variables:
```css
[data-theme-color="newcolor"] {
  --accent-primary: #hexcolor;
  --accent-primary-shadow: #darkerhex;
  --accent-primary-contrast: #textcolor;
  --accent-secondary-bg: rgba(/* appropriate rgba */);
  --accent-secondary-text: #lighttext;
  --accent-secondary-shadow: #darkshadow;
  --accent-secondary-border: #hexcolor;
  --accent-muted-bg: rgba(/* appropriate rgba */);
  --accent-muted-text: #mutedtext;
  --accent-muted-shadow: #darkshadow;
  --accent-muted-border: #borderhex;
}
```

**Step 6: Add Dark Mode CSS Variables**
1. Still in `src/index.css`
2. Find the section after `[data-theme-color="gold"][data-theme="light"]` (around line 1149)
3. Add dark mode variables:
```css
[data-theme-color="newcolor"][data-theme="dark"] {
  --bg-base: #darkbase;
  --bg-top: #darktop;
  --text-primary: #lighttext;
  --text-muted: rgba(/* muted text with opacity */);
  --text-subtle: rgba(/* subtle text with opacity */);
  --heading-color: rgba(/* heading with opacity */);
  --hint-color: rgba(/* hint with opacity */);
  --panel-bg: rgba(/* panel background */);
  --panel-border: rgba(/* panel border */);
  --panel-shadow: rgba(/* panel shadow */);
  --card-bg: rgba(/* card background */);
  --card-border: rgba(/* card border */);
  --card-shadow: rgba(/* card shadow */);
  --status-bg: rgba(/* status background */);
  --status-border: rgba(/* status border */);
  --status-shadow: rgba(/* status shadow */);
  --icon-bg: rgba(/* icon background */);
  --icon-border: rgba(/* icon border */);
  --select-bg: rgba(/* select background */);
  --select-border: rgba(/* select border */);
  --select-hover: rgba(/* select hover */);
  --select-active: rgba(/* select active */);
  --select-shadow: rgba(/* select shadow */);
  --checkbox-bg: rgba(/* checkbox background */);
  --checkbox-border: rgba(/* checkbox border */);
  --notes-text: #notestext;
  --link-color: #linkcolor;
  --link-hover: #linkhover;
  --slider-track-strong: rgba(/* slider track strong */);
  --slider-track-muted: rgba(/* slider track muted */);
  --slider-thumb-bg: #thumbbackground;
  --slider-thumb-border: rgba(/* thumb border */);
  --slider-thumb-shadow: rgba(/* thumb shadow */);
}
```

**Step 7: Add Light Mode CSS Variables**
1. Still in `src/index.css`
2. Add light mode variables right after dark mode:
```css
[data-theme-color="newcolor"][data-theme="light"] {
  --bg-base: #lightbase;
  --bg-top: #ffffff;
  --text-primary: #darktext;
  /* ... same structure as dark mode but with light colors */
}
```

**Step 8: Add Body Background Rule**
1. Still in `src/index.css`
2. Find the section after `html[data-theme="dark"][data-theme-color="gold"] body` (around line 1224)
3. Add body background rule:
```css
html[data-theme="dark"][data-theme-color="newcolor"] body {
  background: var(--bg-top);
}
```

### Changing an Existing Theme Color

**To change colors:**
1. Update `THEME_COLOR_PREVIEW` in `src/constants/theme.ts` (if preview color changes)
2. Update CSS variables in `src/index.css`:
   - Base color variables (`[data-theme-color="..."]`)
   - Dark mode variables (`[data-theme-color="..."][data-theme="dark"]`)
   - Light mode variables (`[data-theme-color="..."][data-theme="light"]`)

**To change display name:**
1. Update `THEME_COLOR_OPTIONS` in `src/constants/theme.ts`

### Removing a Theme Color

**Step 1: Remove from Type Definition**
1. Open `src/constants/theme.ts`
2. Remove color ID from `ThemeColor` union type

**Step 2: Remove from Options**
1. Still in `src/constants/theme.ts`
2. Remove from `THEME_COLOR_OPTIONS` array
3. Remove from `THEME_COLOR_PREVIEW` object

**Step 3: Remove from Validation Arrays**
1. Open `src/hooks/useTheme.ts`
2. Remove from `validColors` array in `getStoredThemeColor()`
3. Open `src/components/Header/Header.tsx`
4. Remove from `validColors` array in `handleThemeSelect()`

**Step 4: Remove CSS**
1. Open `src/index.css`
2. Remove base color variables (`[data-theme-color="..."]`)
3. Remove dark mode variables (`[data-theme-color="..."][data-theme="dark"]`)
4. Remove light mode variables (`[data-theme-color="..."][data-theme="light"]`)
5. Remove body background rule (`html[data-theme="dark"][data-theme-color="..."] body`)

---

## Data Flow & Dependencies

### Theme Color Flow

```
User selects theme color
    ↓
Header.tsx → handleThemeSelect()
    ↓
useTheme.ts → setThemeColor()
    ↓
localStorage.setItem("retro-theme-color", color)
    ↓
document.setAttribute("data-theme-color", color)
    ↓
CSS variables applied via [data-theme-color="..."] selectors
    ↓
UI updates globally (buttons, backgrounds, text, etc.)
```

### Dependencies

- **`src/constants/theme.ts`** → Defines types and options
- **`src/hooks/useTheme.ts`** → Uses `THEME_COLOR_STORAGE_KEY` from `theme.ts`
- **`src/components/Header/Header.tsx`** → Uses `THEME_COLOR_OPTIONS` from `theme.ts`
- **`src/index.css`** → Uses `[data-theme-color]` attribute set by `useTheme.ts`

---

## Code Examples

### Example: Complete Theme Color Definition

**In `src/constants/theme.ts`:**
```typescript
export type ThemeColor = "amber" | "mint" | "newcolor";

export const THEME_COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  { value: "amber", label: "Sunburst" },
  { value: "mint", label: "Neon Grid" },
  { value: "newcolor", label: "New Color" },
];

export const THEME_COLOR_PREVIEW: Record<ThemeColor, string> = {
  amber: "#ffdb33",
  mint: "#58f5c2",
  newcolor: "#ff00ff",
};
```

**In `src/index.css`:**
```css
/* Base color variables */
[data-theme-color="newcolor"] {
  --accent-primary: #ff00ff;
  --accent-primary-shadow: #990099;
  --accent-primary-contrast: #ffffff;
  --accent-secondary-bg: rgba(80, 0, 80, 0.85);
  --accent-secondary-text: #ffb3ff;
  --accent-secondary-shadow: #4d004d;
  --accent-secondary-border: #ff00ff;
  --accent-muted-bg: rgba(60, 0, 60, 0.82);
  --accent-muted-text: #ff66ff;
  --accent-muted-shadow: #330033;
  --accent-muted-border: #cc00cc;
}

/* Dark mode */
[data-theme-color="newcolor"][data-theme="dark"] {
  --bg-base: #1a001a;
  --bg-top: #2d002d;
  --text-primary: #ffe6ff;
  --text-muted: rgba(255, 179, 255, 0.78);
  --text-subtle: rgba(255, 179, 255, 0.48);
  --heading-color: rgba(255, 204, 255, 0.85);
  --hint-color: rgba(230, 128, 230, 0.65);
  --panel-bg: rgba(30, 0, 30, 0.76);
  --panel-border: rgba(255, 0, 255, 0.24);
  --panel-shadow: rgba(20, 0, 20, 0.9);
  /* ... more variables */
}

/* Light mode */
[data-theme-color="newcolor"][data-theme="light"] {
  --bg-base: #ffe6ff;
  --bg-top: #ffffff;
  --text-primary: #1a001a;
  --text-muted: rgba(102, 0, 102, 0.7);
  --text-subtle: rgba(102, 0, 102, 0.45);
  /* ... more variables */
}

/* Body background */
html[data-theme="dark"][data-theme-color="newcolor"] body {
  background: var(--bg-top);
}
```

---

## Testing & Verification

### Testing Checklist

After adding or modifying a theme color:

- [ ] **TypeScript Compilation**: No type errors
- [ ] **Theme Appears in Selector**: New color shows in header dropdown
- [ ] **Preview Color Correct**: Preview square matches theme color
- [ ] **Theme Applies**: Selecting theme updates UI elements
- [ ] **Background Changes**: Page background updates in dark/light modes
- [ ] **Buttons Styled**: Buttons use theme accent color
- [ ] **Borders Styled**: Panel/card borders use theme color
- [ ] **Text Readable**: Text has good contrast in both modes
- [ ] **Persistence**: Theme persists after page reload
- [ ] **No Console Errors**: No JavaScript or CSS errors
- [ ] **All Modes Work**: Test both dark and light themes
- [ ] **Validation Works**: Invalid theme colors are rejected

### Manual Testing Steps

1. **Open Application**: Start dev server (`npm run dev`)
2. **Open Theme Selector**: Click theme color dropdown in header
3. **Select New Theme**: Choose the new theme color
4. **Verify UI Updates**: Check buttons, borders, backgrounds update
5. **Toggle Dark/Light**: Switch theme mode, verify both work
6. **Reload Page**: Verify theme persists
7. **Check Console**: Ensure no errors

---

## Troubleshooting

### Theme Color Not Appearing in Selector

**Problem**: New theme color doesn't show in dropdown

**Solutions**:
1. Check `THEME_COLOR_OPTIONS` includes new color
2. Verify `ThemeColor` type includes new color ID
3. Check for TypeScript compilation errors
4. Restart dev server

### Theme Color Not Applying

**Problem**: Selecting theme doesn't update UI

**Solutions**:
1. Check CSS variables are defined in `src/index.css`
2. Verify `[data-theme-color="..."]` selector matches color ID
3. Check browser DevTools for CSS variable values
4. Verify `useTheme.ts` applies theme to document
5. Check localStorage for stored theme value

### Background Not Changing

**Problem**: Page background doesn't update with theme

**Solutions**:
1. Verify `--bg-base` and `--bg-top` are defined for dark/light modes
2. Check body background rule exists: `html[data-theme="dark"][data-theme-color="..."] body`
3. Verify `data-theme-color` attribute is set on document
4. Check CSS specificity (more specific selectors override)

### Colors Look Wrong

**Problem**: Theme colors don't match expected appearance

**Solutions**:
1. Check `THEME_COLOR_PREVIEW` matches actual accent color
2. Verify contrast ratios for accessibility
3. Test in both dark and light modes
4. Adjust CSS variable values for better harmony

### Theme Not Persisting

**Problem**: Theme resets to default on page reload

**Solutions**:
1. Check `useTheme.ts` loads from localStorage on mount
2. Verify localStorage key matches: `"retro-theme-color"`
3. Check browser allows localStorage (not in private mode)
4. Verify validation allows the theme color

---

## Best Practices

### Color Selection Guidelines

1. **Contrast**: Ensure good contrast between text and backgrounds
   - Dark mode: Light text on dark backgrounds
   - Light mode: Dark text on light backgrounds

2. **Accessibility**: Test with accessibility tools
   - WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
   - Color blindness considerations

3. **Harmony**: Choose colors that work well together
   - Accent color should complement backgrounds
   - Secondary and muted colors should be variations of accent

4. **Consistency**: Follow existing theme patterns
   - Similar opacity values for rgba colors
   - Consistent shadow depths
   - Matching border styles

### CSS Variable Guidelines

1. **Naming**: Use consistent naming convention
   - `--accent-primary` for main accent
   - `--bg-base` and `--bg-top` for backgrounds
   - `--text-primary`, `--text-muted`, `--text-subtle` for text

2. **Opacity**: Use appropriate opacity values
   - Backgrounds: 0.75-0.95 for panels/cards
   - Text: 0.45-0.78 for muted/subtle text
   - Borders: 0.18-0.45 for panel/card borders

3. **Shadows**: Maintain consistent shadow styles
   - Panel shadows: rgba with high opacity (0.85-0.9)
   - Button shadows: Use accent shadow color

### Code Organization

1. **Order**: Keep CSS in logical order
   - Base color variables first
   - Dark mode variables second
   - Light mode variables third
   - Body background rules last

2. **Grouping**: Group related variables together
   - Background variables together
   - Text variables together
   - Panel/card variables together

3. **Comments**: Add comments for complex color calculations
   - Explain color choices if non-obvious
   - Note any special considerations

---

## Summary

The theme color system provides:
- **12 Color Options**: Various accent colors for UI customization
- **Visual Previews**: Color squares in selector dropdown
- **Persistence**: Saves to localStorage, restores on load
- **Global Application**: Updates entire UI (buttons, backgrounds, text, etc.)
- **Dark/Light Support**: Full support for both theme modes
- **Accessibility**: Proper contrast ratios and color choices

**Key Files:**
- `src/constants/theme.ts` - Theme color definitions and types
- `src/index.css` - CSS variables for all theme colors
- `src/hooks/useTheme.ts` - Theme state management
- `src/components/Header/Header.tsx` - Theme selector UI

**Key Features:**
- Theme color selection
- Color previews in dropdown
- localStorage persistence
- Global UI updates
- Dark/light mode support
- Background color changes
- Full UI styling
