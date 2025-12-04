# Theme Refinement Changes Summary

## 1. Replace Grey/Zinc with Slate in Dark Theme

All instances of grey or zinc colors should be replaced with slate equivalents:
- gray-800 → slate-800 (#1e293b)
- gray-700 → slate-700 (#334155)
- zinc-50 → white (#ffffff) 
- zinc-400 → slate-400 (#94a3b8)
- zinc-500 → slate-500 (#64748b)
- zinc-200 → slate-200 (#e2e8f0)
- zinc-300 → slate-300 (#cbd5e1)

## 2. Slider Thumb Color

- Dark mode: slate-400 (#94a3b8)
- Light mode: white (#ffffff)

## 3. Switch Thumb Color

- Dark mode: slate-400 (#94a3b8)  
- Light mode: white (#ffffff)

## 4. Icon Button Hover States

- Background: Use `--icon-bg` with hover variant (slate-700 in dark mode)
- Need to add CSS variable for hover: `--icon-hover`

## 5. Component Background Alignment

All should use same token (`--icon-bg`):
- Switch lozenge background (off state)
- Slider track/channel background
- Button backgrounds (secondary, background variants)
- Icon button backgrounds

## 6. Dropdown Border

Check Select component - may have hardcoded white border that needs theme color

## 7. Icon Colors

All icons (chevrons, etc.) should use theme colors:
- Default: `--text-muted` (slate-400 in dark mode)
- Hover: `--text-primary` or `--text-heading`

## 8. Catalyst CSS Migration

Move Catalyst-specific styles to theme tokens and remove hardcoded colors.

