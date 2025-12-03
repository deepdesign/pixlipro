# Comprehensive Theme Migration Plan

## Overview

This plan ensures ALL colors across the entire application use the theme system, with NO hardcoded colors. The theme system supports:
- **Primary color**: Currently slate (neutral base)
- **Highlight color**: Currently green (#58f5c2)
- Both dark and light modes
- Future themes using Tailwind base colors (e.g., Indigo primary + Yellow highlight)

## Current State Analysis

### Hardcoded Colors Found

**Total Matches**: 1,045+ instances across:
- Hex color codes (#ffffff, #000000, etc.)
- Tailwind hardcoded classes (bg-slate-*, text-slate-*, border-slate-*, etc.)
- Status colors (red, yellow, blue, green for alerts/warnings)
- Palette definitions (acceptable - these are user data)

### Critical Areas Requiring Migration

1. **Status/Warning Colors** (HIGH PRIORITY)
   - Error states: `text-red-600`, `text-red-400`
   - Warning states: `text-yellow-500`, `bg-yellow-50`
   - Success states: `text-green-500`
   - Info states: `text-blue-500`, `bg-blue-600`
   
   **Solution**: Create theme-aware status color variables

2. **Interactive States** (HIGH PRIORITY)
   - Hover states with hardcoded colors
   - Active states
   - Selected states
   - Disabled states

3. **Component Borders/Dividers** (HIGH PRIORITY)
   - Hardcoded border colors
   - Divider lines

4. **Text Colors** (HIGH PRIORITY)
   - Primary text
   - Muted text
   - Subtle text
   - Heading colors

5. **Background Colors** (HIGH PRIORITY)
   - Panel backgrounds
   - Card backgrounds
   - Status backgrounds
   - Icon button backgrounds

## Theme System Architecture

### Current Structure

The theme system uses CSS variables with semantic naming:

```
--theme-primary-*       (Highlight color - green)
--theme-secondary-*     (Primary color - slate)
--theme-supporting-*    (White/Black)
```

### Required Enhancements

1. **Status Color Variables**
   - Need error, warning, success, info variants
   - Should work with both primary and highlight colors
   - Support dark/light modes

2. **Theme Mapping System**
   - Map Tailwind color names to theme variables
   - Enable dynamic theme switching
   - Support multiple color themes

## Migration Strategy

### Phase 1: Foundation (Immediate)
1. ✅ Audit complete - document all hardcoded colors
2. Create comprehensive theme variable system
3. Add status color variables
4. Create utility classes for common patterns

### Phase 2: Core Components (Priority 1)
Migrate in this order:
1. Layout components (AppSidebar, SettingsSidebar, Header, Footer)
2. Settings pages (all tabs)
3. Control panels
4. UI primitives (Button, Input, Select, etc.)

### Phase 3: Feature Components (Priority 2)
1. Animation components
2. Sprite components
3. Sequence components
4. Scene components

### Phase 4: Advanced Components (Priority 3)
1. Modals/Dialogs
2. Tooltips
3. Messages/Alerts
4. Dropdowns/Comboboxes

### Phase 5: Polish & Verification (Final)
1. Verify all colors work in dark/light mode
2. Test theme switching
3. Accessibility checks
4. Documentation

## File-by-File Migration Checklist

### High Priority Files

- [ ] `src/components/Sprites/CollectionSidebar.tsx` - Red delete button
- [ ] `src/components/Animation/AnimationCard.tsx` - Red delete button hover
- [ ] `src/components/Settings/RemoteControlTab.tsx` - Green connection indicator
- [ ] `src/components/Settings/PerformanceTab.tsx` - Status indicators (red, yellow, blue)
- [ ] `src/components/Settings/DisplayTab.tsx` - Red reset button
- [ ] `src/components/Sequences/SequenceSceneCard.tsx` - Red error text
- [ ] `src/components/SequencePlayer.tsx` - Blue progress bar
- [ ] `src/components/SequenceManager.tsx` - Red/yellow warning messages
- [ ] `src/components/Sprites/SpriteCard.tsx` - Red delete button, hardcoded hex in SVG processing
- [ ] `src/components/ShowTimer.tsx` - Red warning text
- [ ] `src/components/SequenceListTable.tsx` - Hardcoded slate colors

### Medium Priority Files

- [ ] All Settings page components
- [ ] Control panel components
- [ ] Modal/Dialog components
- [ ] Form components

### Lower Priority Files

- [ ] Palette definitions (acceptable - user data)
- [ ] Generator.ts canvas colors (acceptable - dynamic generation)

## Status Color System

### Requirements

Status colors need to:
1. Work with any theme (slate, indigo, etc.)
2. Maintain appropriate contrast in dark/light modes
3. Be semantically meaningful (error = red concept, but themed)

### Proposed Solution

Use highlight color variants for status:
- Error: Use a red-tinted version of highlight color OR separate error variable
- Warning: Use a yellow-tinted version
- Success: Use highlight color itself
- Info: Use a blue-tinted version

OR create theme-aware status variables that adapt to the current theme.

## Implementation Steps

1. **Create Status Color Variables**
   ```css
   --status-error: [themed red]
   --status-warning: [themed yellow]
   --status-success: [highlight color]
   --status-info: [themed blue]
   ```

2. **Create Utility Classes**
   ```css
   .text-status-error { color: var(--status-error); }
   .bg-status-error { background-color: var(--status-error); }
   .border-status-error { border-color: var(--status-error); }
   ```

3. **Migrate Components Systematically**
   - One file at a time
   - Test after each migration
   - Document changes

4. **Verify Theme Compatibility**
   - Test with slate theme
   - Test with future indigo/yellow theme
   - Test dark/light modes

## Success Criteria

✅ Zero hardcoded hex colors in component files (except user data like palettes)
✅ Zero hardcoded Tailwind color classes (bg-slate-*, text-slate-*, etc.)
✅ All colors work in both dark and light modes
✅ Theme can be switched between different color schemes
✅ Status colors are theme-aware
✅ All interactive states use theme variables
✅ Documentation complete

## Notes

- Palette definitions in `src/data/palettes.ts` are USER DATA and can contain hardcoded colors
- Canvas rendering colors in `generator.ts` are DYNAMIC and calculated - these are acceptable
- Focus on UI component colors only

