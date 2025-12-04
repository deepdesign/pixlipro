# Theme Refinement Plan

## Tailwind Slate Color Palette

- slate-50: #f8fafc
- slate-100: #f1f5f9
- slate-200: #e2e8f0
- slate-300: #cbd5e1
- slate-400: #94a3b8
- slate-500: #64748b
- slate-600: #475569
- slate-700: #334155
- slate-800: #1e293b
- slate-900: #0f172a
- slate-950: #020617

## Requirements

1. **Remove greys/zinc from dark theme** - Use only slate tints, white, or highlight color
2. **Restore hover states on icon buttons** - Use theme colors
3. **Slider thumb and switch thumb** - Use slate-400 in dark mode
4. **Align component backgrounds** - Switch lozenge, slider channel, button backgrounds should use same token
5. **Fix dropdown white border** - Check if Tailwind default
6. **Ensure all icons use theme colors** - Chevrons, etc.
7. **Migrate Catalyst CSS** - Move to theme tokens, remove Catalyst-specific CSS
8. **Follow Tailwind best practices** - Align with Tailwind themes and consistent tint usage

## Color Alignment Strategy

### Shared Background Token
All these should use the same color:
- Switch lozenge background (off state)
- Slider track/channel background
- Button backgrounds (secondary, background variants)
- Icon button backgrounds

**Proposed token**: `--icon-bg` / `--theme-secondary-icon`

### Slider/Switch Thumb
- Dark mode: slate-400 (#94a3b8)
- Light mode: white

### Hover States
- Icon buttons: Use `--icon-bg` with slight opacity change
- Regular buttons: Use same background token

## Implementation Steps

1. Update slate theme definition - replace all grey/zinc with slate
2. Add hover state CSS variables
3. Update slider thumb to slate-400 (dark mode)
4. Update switch thumb to slate-400 (dark mode)
5. Align all component backgrounds to use same token
6. Fix dropdown border colors
7. Update icon colors
8. Migrate Catalyst CSS to theme tokens

