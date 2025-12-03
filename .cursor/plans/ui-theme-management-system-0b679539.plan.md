<!-- 0b679539-ee9e-4ad4-9282-01b5de414acd 5d78568e-593d-42b8-b86f-7b5fd97931d3 -->
# UI Theme Management System

## Overview

Add a new "Theme" tab in Settings where users can manage UI themes. Users can select primary (slate/gray/zinc/neutral) and accent (Tailwind colors) colors, create custom themes, and apply them. The default "Slate + Teal" theme is uneditable/undeletable.

## Implementation Steps

### 1. Create Theme Storage System

**File**: `src/lib/storage/themeStorage.ts`

- Create `CustomTheme` interface with: `id`, `name`, `primaryColor`, `accentColor`, `isDefault`, `createdAt`, `updatedAt`
- Implement storage functions: `getAllThemes()`, `saveTheme()`, `updateTheme()`, `deleteTheme()`, `getTheme()`
- Use localStorage key: `"pixli-custom-themes"`
- Default theme ID: `"default-slate-teal"`

### 2. Create Tailwind Color Map

**File**: `src/lib/theme/tailwindColors.ts`

- Export color maps for primary colors: `slate`, `gray`, `zinc`, `neutral` (shades 50-950)
- Export color maps for accent colors: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose` (shades 50-950)
- Use Tailwind 4 color values (OKLCH format or hex equivalents)
- Export helper functions: `getPrimaryColorShade()`, `getAccentColorShade()`, `getAccentColorName()`

### 3. Create Theme Generator from Colors

**File**: `src/lib/theme/themeBuilder.ts`

- Create `buildThemeFromColors()` function that takes `primaryColor` (slate/gray/zinc/neutral) and `accentColor` (Tailwind color name)
- Generate `ThemeDefinition` using existing template structure
- Map Tailwind shades to theme properties:
  - Primary: Use shades 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 for backgrounds, text, borders, tints
  - Accent: Use shade 400 for base, shade 600 for shadow, shade 900 for contrast text
- Return complete `ThemeDefinition` with dark and light mode variants

### 4. Update Default Theme to Teal

**File**: `src/lib/theme/themes/slate.ts`

- Change accent `base` from `#58f5c2` (mint) to teal-400: `#2dd4bf` (or closest Tailwind teal-400 equivalent)
- Update accent `shadow` to teal-600: `#0d9488`
- Update accent `contrast` to teal-900: `#134e4a`
- Update comments to reflect "teal" instead of "mint/green"

**File**: `src/index.css`

- Update accent color CSS variables to use teal values
- Update comments

### 5. Create Theme Application System

**File**: `src/lib/theme/themeApplier.ts`

- Create `applyTheme()` function that takes a `CustomTheme`
- Use `buildThemeFromColors()` to generate `ThemeDefinition`
- Use `generateThemeCSS()` and `generateSemanticCSS()` to create CSS variables
- Inject CSS variables into document via `<style>` tag or update root element
- Store active theme ID in localStorage: `"pixli-active-theme-id"`
- Create `getActiveTheme()` to retrieve current theme

### 6. Create ThemeTab Component

**File**: `src/components/Settings/ThemeTab.tsx`

- Display list of themes (default + custom)
- Show theme preview cards with primary/accent color swatches
- Actions per theme:
  - **Apply**: Button to activate theme
  - **Edit**: Open edit modal (disabled for default)
  - **Rename**: Inline rename (disabled for default)
  - **Delete**: Delete button (disabled for default)
- "Create New Theme" button opens creation modal
- Use Tailwind-styled components following existing patterns

### 7. Create Theme Creation/Edit Modal

**File**: `src/components/Settings/ThemeModal.tsx`

- Form fields:
  - **Name**: Text input
  - **Primary Color**: Select dropdown (slate, gray, zinc, neutral)
  - **Accent Color**: Select dropdown with color swatches (red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose)
- Live preview of theme colors
- Save/Cancel buttons
- For edit mode: Pre-fill with existing theme data

### 8. Update Settings Page

**File**: `src/pages/SettingsPage.tsx`

- Add `"theme"` case to `renderContent()` switch
- Render `ThemeTab` wrapped in `SettingsSectionWrapper`

### 9. Update Settings Sidebar

**File**: `src/components/Settings/SettingsSidebar.tsx`

- Add theme icon import (e.g., `Paintbrush` from lucide-react)
- Add theme item to `configurationItems` array:
  ```typescript
  { id: "theme", label: "Theme", icon: Paintbrush }
  ```


### 10. Initialize Default Theme

**File**: `src/lib/theme/themeStorage.ts` (or separate init file)

- On first load, check if default theme exists
- If not, create default theme: `{ id: "default-slate-teal", name: "Slate + Teal", primaryColor: "slate", accentColor: "teal", isDefault: true }`
- Ensure default theme cannot be deleted or edited (enforce in UI and storage functions)

### 11. Apply Theme on App Load

**File**: `src/App.tsx` or `src/main.tsx`

- On app initialization, call `getActiveTheme()` or default to `"default-slate-teal"`
- Apply theme using `applyTheme()`
- Listen for theme changes and re-apply

## File Structure

```
src/
├── lib/
│   ├── storage/
│   │   └── themeStorage.ts          (NEW)
│   └── theme/
│       ├── tailwindColors.ts        (NEW)
│       ├── themeBuilder.ts          (NEW)
│       ├── themeApplier.ts          (NEW)
│       ├── themes/
│       │   └── slate.ts             (UPDATE)
│       ├── template.ts              (existing)
│       └── generator.ts             (existing)
├── components/
│   └── Settings/
│       ├── ThemeTab.tsx              (NEW)
│       └── ThemeModal.tsx            (NEW)
└── pages/
    └── SettingsPage.tsx              (UPDATE)
```

## Design Considerations

- Follow existing Tailwind 4 patterns and component structure
- Use established color rules (tint system, border relationships)
- Theme cards should show color swatches for visual preview
- Modal should use existing modal/dialog patterns
- Color selectors should display Tailwind color swatches
- Default theme should be visually distinct (e.g., badge or different styling)

## Testing Checklist

- [ ] Default theme cannot be deleted
- [ ] Default theme cannot be edited
- [ ] Custom themes can be created, edited, renamed, deleted
- [ ] Theme application updates UI immediately
- [ ] Theme persists across page reloads
- [ ] All Tailwind color options work correctly
- [ ] Dark and light modes both work with custom themes
- [ ] Theme preview shows accurate colors

### To-dos

- [ ] Create themeStorage.ts with CustomTheme interface and CRUD functions
- [ ] Create tailwindColors.ts with color maps for primary and accent colors
- [ ] Create themeBuilder.ts to generate ThemeDefinition from color names
- [ ] Update slate.ts default theme to use teal instead of mint green
- [ ] Create themeApplier.ts to apply themes dynamically via CSS injection
- [ ] Create ThemeTab.tsx component with theme list and management UI
- [ ] Create ThemeModal.tsx for creating/editing themes
- [ ] Add theme section to SettingsPage.tsx
- [ ] Add theme item to SettingsSidebar.tsx
- [ ] Initialize default theme on app load
- [ ] Apply active theme on app initialization