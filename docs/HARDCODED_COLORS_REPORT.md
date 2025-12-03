# Hardcoded Colors & Non-Slate Tints Report

## Summary

This document lists all hardcoded colors and non-slate tints found in the codebase. Migration decisions have been made and implementation is in progress.

## Decisions Made

### 1. Status Colors (RAG System)
**Decision:** Use Tailwind RAG colors (Red, Amber, Green) for status indicators. Use slate for info.

- **Error:** Keep red (`red-500` / `red-600`) - RAG aligned
- **Warning:** Keep amber/yellow (`amber-500` / `yellow-500`) - RAG aligned  
- **Success:** Keep green (already uses accent mint, but can use `green-500`/`green-600`) - RAG aligned
- **Info:** Use slate tints (not RAG aligned) - `slate-400` / `slate-500`

**Implementation:** Status colors will use Tailwind's standard color palette for RAG (red, amber, green) and slate for info.

### 2. Link Colors
**Decision:** Use accent color (mint green)

- Replace blue link colors with accent color (`--theme-primary-base`)

### 3. Supporting Colors (White/Black)
**Decision:** Use slate-50 for white AND slate-950 for black

- `--theme-supporting-light: #f8fafc` (slate-50) - replaces `#ffffff`
- `--theme-supporting-dark: #020617` (slate-950) - replaces `#000000`

### 4. Button/Badge Color Variants
**Decision:** Preserve color variants (Tailwind colors for optional decorative use)

**Explanation:**
These are Tailwind's built-in color variants (red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose) used in:
- `src/components/ui/button.tsx` - Optional decorative button colors
- `src/components/ui/badge.tsx` - Optional decorative badge colors
- `src/components/ui/checkbox.tsx` - Optional checkbox colors
- `src/components/ui/radio.tsx` - Optional radio colors
- `src/components/ui/switch.tsx` - Optional switch colors

These are **optional variants** for user-selected decorative purposes (like colored badges, accent buttons, etc.). They're not part of the core theme but remain available as utility options. The default variants (dark/zinc, white, etc.) use theme variables, while these optional colors use Tailwind's standard palette.

**Action:** Keep as-is (Tailwind colors), but ensure any hardcoded white/black references within them use slate equivalents.

### 5. Hardcoded White (#ffffff)
**Decision:** Replace ALL `#ffffff` with slate-50 (`#f8fafc`)

**Locations to update:**
- `src/index.css` - `--color-white` and `--theme-supporting-light`
- `src/lib/services/spriteImageLoader.ts` - Multiple `#ffffff` instances
- `src/lib/utils/qrCode.ts` - `#FFFFFF`
- `src/lib/theme/themes/slate.ts` - Multiple `#ffffff` instances
- Button/badge color variants - replace `var(--color-white)` with slate-50
- All component files using `#ffffff` or `white`

### 6. Non-Slate Colors in Components
**Decision:** Replace ALL non-slate colors with slate equivalents using theme variables

**Files to update:**
- `src/components/ControlPanel/shared/FlowbiteTooltip.tsx` - Replace `gray-*` with slate equivalents
- `src/components/ControlPanel/shared/TextWithTooltip.tsx` - Replace `gray-*` with slate equivalents
- `src/components/ui/ButtonGroup.tsx` - Replace `slate-950/10`, `white/10`, etc. with theme variables
- `src/pages/MobileRemote.tsx` - Replace `gray-*` and `zinc-*` with slate equivalents
- Any other files with hardcoded non-slate colors

## Migration Status

- [ ] Update status colors (RAG: red, amber, green; Info: slate)
- [ ] Update link colors to use accent (mint)
- [ ] Replace all white (#ffffff) with slate-50 (#f8fafc)
- [ ] Replace all black (#000000) with slate-950 (#020617)
- [ ] Update non-slate colors in components to slate equivalents
- [ ] Update button/badge variants to use slate-50 instead of white
- [ ] Test in both dark and light modes

## Hardcoded Colors Found - Detailed List

### In Theme System (src/index.css)

#### Supporting Colors
- `--color-white: #ffffff` → Replace with `#f8fafc` (slate-50)
- `--theme-supporting-light: #ffffff` → Replace with `#f8fafc` (slate-50)
- `--theme-supporting-dark: #000000` → Replace with `#020617` (slate-950)

#### Status Colors (RAG System)
- `--status-error: #ef4444` (red-500) → **KEEP** (RAG)
- `--status-warning: #eab308` (yellow-500) → **KEEP** (RAG)
- `--status-info: #3b82f6` (blue-500) → **CHANGE** to slate (not RAG)
- `--status-success: var(--theme-primary-base)` (mint) → **KEEP** (uses accent, RAG-aligned)

#### Link Colors
- Dark: `--theme-primary-link: #60a5fa` (blue-400) → **CHANGE** to accent color
- Light: `--theme-primary-link: #3b82f6` (blue-600) → **CHANGE** to accent color

### In Component Files

#### UI Primitives with Color Variants
**Status:** Keep variants but update white/black references to slate

1. **src/components/ui/button.tsx**
   - Keep all color variants (red, orange, amber, etc.)
   - Replace `var(--color-white)` with slate-50 in variants
   - These are optional decorative variants

2. **src/components/ui/badge.tsx**
   - Keep all color variants
   - Update hardcoded Tailwind classes to use slate where appropriate

#### Other Hardcoded Colors to Replace
1. **src/components/ControlPanel/shared/FlowbiteTooltip.tsx**
   - `bg-gray-900`, `bg-gray-800`, `bg-gray-700` → Replace with slate equivalents
   - `text-gray-900`, `text-gray-200` → Replace with theme variables
   - `border-gray-200`, `border-gray-600` → Replace with theme variables

2. **src/components/ControlPanel/shared/TextWithTooltip.tsx**
   - `bg-gray-900`, `bg-gray-700`, `text-white` → Replace with theme variables
   - `border-t-gray-900`, `border-t-gray-700` → Replace with theme variables

3. **src/components/ui/ButtonGroup.tsx**
   - `border-slate-950/10`, `dark:border-white/10` → Replace with theme variables
   - `bg-white`, `text-slate-950`, `dark:bg-slate-800`, `dark:text-white` → Replace with theme variables

4. **src/components/Settings/CustomPalettesTab.tsx**
   - `#000000` (black canvas background) → Replace with `var(--theme-supporting-dark)` or slate-950

5. **src/pages/ProjectorPage.tsx**
   - `bg-black`, `text-white` → Replace with slate equivalents

6. **src/pages/MobileRemote.tsx**
   - Multiple `gray-*` and `zinc-*` colors → Replace with slate equivalents

### In Service Files

1. **src/lib/services/spriteImageLoader.ts**
   - Multiple `#ffffff` hardcoded → Replace with slate-50 (`#f8fafc`)

2. **src/lib/utils/qrCode.ts**
   - `#FFFFFF` hardcoded → Replace with slate-50 (`#f8fafc`)

3. **src/lib/theme/themes/slate.ts**
   - Multiple `#ffffff` instances → Replace with slate-50 (`#f8fafc`)

## Next Steps

1. Update status colors (RAG for error/warning/success, slate for info)
2. Update link colors to accent (mint)
3. Replace all white (#ffffff) with slate-50 (#f8fafc)
4. Replace all black (#000000) with slate-950 (#020617)
5. Replace all gray/zinc colors with slate equivalents
6. Test in both dark and light modes
