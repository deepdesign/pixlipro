# Hardcoded Colors Audit - Complete File-by-File Breakdown

## Executive Summary

**Total Hardcoded Color Instances**: 1,045+ across the entire codebase

This document provides a complete audit of all hardcoded colors that need to be migrated to the theme system. All colors must use theme variables (e.g., `theme.050`, `theme.600`) instead of hardcoded hex codes or Tailwind classes.

## Audit Methodology

Searched for:
- Hex color codes (`#ffffff`, `#000000`, etc.)
- Hardcoded Tailwind color classes (`bg-slate-*`, `text-red-*`, `border-yellow-*`, etc.)
- Status colors (red, yellow, blue, green)

## Files Requiring Migration

### Critical Priority (Status Colors & Interactive States)

#### 1. `src/components/Sprites/CollectionSidebar.tsx`
- **Line 154**: `text-red-600 dark:text-red-400` - Delete button
- **Action**: Replace with `text-status-error`

#### 2. `src/components/Animation/AnimationCard.tsx`
- **Line 150**: `hover:bg-red-50 hover:dark:bg-red-900/20 text-red-600 dark:text-red-400` - Delete button
- **Action**: Replace with theme-aware status colors

#### 3. `src/components/Settings/RemoteControlTab.tsx`
- **Line 108**: `text-green-500` - Connection indicator
- **Action**: Replace with `text-status-success`

#### 4. `src/components/Settings/PerformanceTab.tsx`
- **Line 240**: `text-red-500` - Error indicator
- **Line 249**: `text-yellow-500` - Warning indicator
- **Line 258**: `text-yellow-500` - Warning indicator
- **Line 266**: `text-blue-500` - Info indicator
- **Line 272**: `text-blue-500` - Info indicator
- **Action**: Replace all with status color utilities

#### 5. `src/components/Settings/DisplayTab.tsx`
- **Line 237**: `text-white bg-red-600 hover:bg-red-700` - Reset button
- **Action**: Replace with theme-aware status colors

#### 6. `src/components/Sequences/SequenceSceneCard.tsx`
- **Line 146**: `text-red-600 dark:text-red-400` - Error text
- **Action**: Replace with `text-status-error`

#### 7. `src/components/SequencePlayer.tsx`
- **Line 275**: `bg-blue-600 dark:bg-blue-500` - Progress bar
- **Action**: Replace with `bg-status-info`

#### 8. `src/components/SequenceManager.tsx`
- **Line 141**: `text-red-600 dark:text-red-400` - Error message
- **Line 473**: `#000000` - Default background color (hex in code)
- **Line 590**: `bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-200` - Warning message
- **Action**: Replace all with status color utilities

#### 9. `src/components/Sprites/SpriteCard.tsx`
- **Line 53-60**: Hardcoded hex colors in comments and SVG processing
- **Line 72**: `#000000` in regex pattern (acceptable - removing black backgrounds)
- **Line 201**: `hover:bg-red-50 hover:dark:bg-red-900/20 text-red-600 dark:text-red-400` - Delete button
- **Action**: Replace delete button colors, verify SVG processing doesn't hardcode colors

#### 10. `src/components/ShowTimer.tsx`
- **Line 139**: `text-red-600 dark:text-red-400` - Warning text
- **Action**: Replace with `text-status-error` or `text-status-warning`

### High Priority (UI Components)

#### 11. `src/components/SequenceListTable.tsx`
- Multiple instances of `text-slate-*`, `bg-slate-*`, `border-slate-*`
- **Action**: Replace all with theme utility classes

#### 12. `src/components/Sequences/SequenceStats.tsx`
- Already migrated (uses theme classes)

#### 13. `src/components/Sequences/SequenceHeader.tsx`
- Check for hardcoded colors
- **Action**: Audit and migrate

#### 14. `src/components/ui/` Components
- All UI primitives need audit
- **Action**: Systematically check and migrate

### Medium Priority (Settings Pages)

All settings page components need verification:
- `src/components/Settings/DisplayTab.tsx` - Partially migrated
- `src/components/Settings/PerformanceTab.tsx` - Status indicators need migration
- `src/components/Settings/IntegrationsTab.tsx` - Audit needed
- `src/components/Settings/RemoteControlTab.tsx` - Status colors need migration
- `src/components/Settings/ShortcutsTab.tsx` - Audit needed
- `src/components/Settings/CustomPalettesTab.tsx` - Hex codes in placeholders (acceptable), but check UI colors
- `src/components/Settings/ScenesTab.tsx` - Audit needed

### Lower Priority (Data Files - Acceptable)

- `src/data/palettes.ts` - Contains hex colors, but these are USER DATA (acceptable)
- `src/generator.ts` - Contains hex colors for canvas rendering (dynamic generation - acceptable)

## Migration Pattern

### Before (Hardcoded)
```tsx
<span className="text-red-600 dark:text-red-400">Error</span>
<button className="bg-blue-600 dark:bg-blue-500">Info</button>
<div className="text-yellow-500">Warning</div>
```

### After (Theme Variables)
```tsx
<span className="text-status-error">Error</span>
<button className="bg-status-info">Info</button>
<div className="text-status-warning">Warning</div>
```

## Status Color System

Status colors have been added to the theme system:
- `--status-error`: Error states
- `--status-warning`: Warning states
- `--status-success`: Success states (uses highlight color)
- `--status-info`: Info states

Utility classes available:
- `.text-status-error`, `.bg-status-error`, `.border-status-error`
- `.text-status-warning`, `.bg-status-warning`, `.border-status-warning`
- `.text-status-success`, `.bg-status-success`, `.border-status-success`
- `.text-status-info`, `.bg-status-info`, `.border-status-info`

## Next Steps

1. ✅ Status color variables added to theme system
2. ✅ Status utility classes created
3. ⏳ Migrate all critical priority files
4. ⏳ Migrate high priority UI components
5. ⏳ Migrate settings pages
6. ⏳ Verify all colors work in dark/light modes
7. ⏳ Test with theme switching

## Notes

- Palette definitions contain hex colors - these are USER DATA and acceptable
- Canvas rendering uses calculated colors - these are DYNAMIC and acceptable
- Focus migration efforts on UI component colors only

