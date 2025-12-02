# Theme Template Guide

## Overview

The theme template system uses a three-variable approach to create consistent, maintainable themes that work seamlessly in both dark and light modes.

## Three-Variable System

### 1. Primary Color (Accent)
The accent color used for buttons, highlights, active states, borders, and links.

**Example**: `#58f5c2` (mint/green)

### 2. Secondary Color (Neutral)
The neutral color used for backgrounds, panels, borders, and secondary text. Typically uses a full shade scale (50-950).

**Example**: Slate shades (`#020617` to `#f8fafc`)

### 3. Supporting Color (High Contrast)
The high-contrast color used for primary text and high-contrast elements. Adapts based on theme mode.

**Example**: White (`#ffffff`) for dark mode text, Black (`#000000`) for light mode text

## Creating a New Theme

### Step 1: Define Your Colors

Choose your three base colors:

```typescript
const myTheme: ThemeDefinition = {
  name: 'my-theme',
  dark: {
    primary: {
      base: '#your-accent-color',
      shadow: '#darker-accent',
      contrast: '#text-on-accent',
      link: '#link-color',
      linkHover: '#link-hover-color',
    },
    secondary: {
      // Backgrounds
      bgBase: '#darkest-background',
      bgTop: '#top-background',
      panel: '#panel-background',
      card: '#card-background',
      // ... etc
    },
    supporting: {
      light: '#ffffff',
      dark: '#000000',
    },
  },
  light: {
    // Light mode variants
  },
};
```

### Step 2: Use the Theme Generator

The theme generator automatically creates CSS variables from your theme definition:

```typescript
import { generateThemeCSSString } from '@/lib/theme/generator';
import { myTheme } from '@/lib/theme/themes/my-theme';

const css = generateThemeCSSString(myTheme);
```

### Step 3: Add to CSS

Add the generated CSS to `src/index.css` or create a separate theme file.

### Step 4: Apply Theme

The theme is automatically applied based on the `data-theme` attribute:

```html
<html data-theme="dark">
  <!-- Dark theme active -->
</html>

<html data-theme="light">
  <!-- Light mode active -->
</html>
```

## Using Semantic Utility Classes

Instead of hardcoded Tailwind colors, use semantic utility classes:

### Backgrounds

```tsx
// Before
<div className="bg-slate-900 dark:bg-slate-800">

// After
<div className="bg-theme-panel">
```

### Text

```tsx
// Before
<p className="text-slate-50 dark:text-slate-900">

// After
<p className="text-theme-primary">
```

### Borders

```tsx
// Before
<div className="border-slate-800 dark:border-slate-200">

// After
<div className="border-theme-panel">
```

## Available Utility Classes

### Backgrounds
- `.bg-theme-bg-base` - Base page background
- `.bg-theme-bg-top` - Top background (for gradients)
- `.bg-theme-panel` - Panel/card background
- `.bg-theme-card` - Card background
- `.bg-theme-status` - Status bar background
- `.bg-theme-icon` - Icon button background
- `.bg-theme-select` - Select/checkbox background
- `.bg-theme-checkbox` - Checkbox background

### Text
- `.text-theme-primary` - Primary readable text
- `.text-theme-muted` - Muted/secondary text
- `.text-theme-subtle` - Subtle/hint text
- `.text-theme-heading` - Heading text
- `.text-theme-hint` - Hint/helper text
- `.text-theme-notes` - Notes/documentation text

### Borders
- `.border-theme-panel` - Panel borders
- `.border-theme-card` - Card borders
- `.border-theme-status` - Status bar borders
- `.border-theme-icon` - Icon button borders
- `.border-theme-select` - Select borders
- `.border-theme-checkbox` - Checkbox borders
- `.border-theme-divider` - Section dividers

### Accent
- `.bg-theme-primary` - Accent background
- `.text-theme-primary-accent` - Accent text color
- `.border-theme-primary` - Accent border

## CSS Variables

All theme colors are available as CSS variables:

### Template Variables
- `--theme-primary-base` - Primary accent color
- `--theme-primary-shadow` - Accent shadow
- `--theme-primary-contrast` - Text on accent
- `--theme-secondary-*` - All secondary color variants
- `--theme-supporting-light` - Light supporting color
- `--theme-supporting-dark` - Dark supporting color

### Semantic Variables
- `--bg-base`, `--bg-top` - Backgrounds
- `--panel-bg`, `--card-bg` - Panel/card backgrounds
- `--text-primary`, `--text-muted` - Text colors
- `--panel-border`, `--card-border` - Border colors
- `--accent-primary` - Accent color

## Best Practices

### 1. Color Selection

- **Primary**: Choose a vibrant, accessible color with good contrast
- **Secondary**: Use a neutral color with a full shade scale
- **Supporting**: Use pure white/black for maximum contrast

### 2. Contrast Ratios

Ensure all text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

### 3. Testing

Test your theme in both modes:
- Dark mode: Light text on dark backgrounds
- Light mode: Dark text on light backgrounds
- Check all interactive states (hover, active, focus)
- Verify contrast ratios

### 4. Component Migration

When migrating components:
1. Replace hardcoded Tailwind colors with utility classes
2. Remove `dark:` variants (handled automatically)
3. Test in both themes
4. Verify accessibility

## Example: Complete Theme Definition

```typescript
import type { ThemeDefinition } from '../template';

export const blueTheme: ThemeDefinition = {
  name: 'blue',
  dark: {
    primary: {
      base: '#3b82f6',        // blue-500
      shadow: '#1e40af',      // blue-800
      contrast: '#ffffff',    // white
      link: '#60a5fa',        // blue-400
      linkHover: '#93c5fd',   // blue-300
    },
    secondary: {
      bgBase: '#0f172a',      // slate-900
      bgTop: '#0f172a',
      panel: '#1e293b',        // slate-800
      card: '#334155',         // slate-700
      status: '#334155',
      icon: '#334155',
      select: '#334155',
      checkbox: '#334155',
      textPrimary: '#f8fafc',  // slate-50
      textMuted: '#cbd5e1',    // slate-300
      textSubtle: '#94a3b8',   // slate-400
      heading: '#e2e8f0',      // slate-200
      hint: '#cbd5e1',
      notes: '#cbd5e1',
      borderPanel: '#475569',   // slate-600
      borderCard: '#475569',
      borderStatus: '#475569',
      borderIcon: '#475569',
      borderSelect: '#475569',
      borderCheckbox: '#475569',
      shadowPanel: 'rgba(0, 0, 0, 0.3)',
      shadowCard: 'rgba(0, 0, 0, 0.3)',
      shadowStatus: 'rgba(0, 0, 0, 0.2)',
      shadowSelect: 'rgba(0, 0, 0, 0.3)',
      sliderTrackStrong: 'rgba(59, 130, 246, 0.4)',
      sliderTrackMuted: 'rgba(15, 23, 42, 0.6)',
      sliderThumbBg: '#1e293b',
      sliderThumbBorder: '#3b82f6',
      sliderThumbShadow: 'rgba(0, 0, 0, 0.3)',
      selectHover: '#475569',
      selectActive: '#475569',
    },
    supporting: {
      light: '#ffffff',
      dark: '#000000',
    },
  },
  light: {
    // Light mode variants...
  },
};
```

## Integration with Existing Theme-Color System

The template system works alongside the existing `data-theme-color` system:

- **Template system**: Controls base UI colors (backgrounds, text, borders)
- **Theme-color system**: Controls accent colors (buttons, highlights)

Both systems can be used together for maximum flexibility.

## Troubleshooting

### Colors Not Updating

1. Check that `data-theme` attribute is set correctly
2. Verify CSS variables are defined in `:root` or `[data-theme="light"]`
3. Ensure semantic variables reference template variables correctly

### Light Theme Not Working

1. Verify `[data-theme="light"]` selector has proper specificity
2. Check that all variables have light mode definitions
3. Test theme toggle functionality

### Contrast Issues

1. Use contrast checking tools
2. Adjust secondary color shades if needed
3. Consider using supporting color for high-contrast text

## Next Steps

1. Review existing components for hardcoded colors
2. Migrate components to use utility classes
3. Test all components in both themes
4. Create additional themes using the template system

