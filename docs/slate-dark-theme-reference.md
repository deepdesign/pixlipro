# Slate Dark Theme Reference

## Overview

This document provides a complete reference for the slate dark theme implementation, including all CSS variable values, Tailwind color mappings, and component-specific usage patterns.

## Theme Definition

**Theme Name**: Slate (Default Dark Theme)  
**Primary Color**: `#58f5c2` (Mint/Green)  
**Secondary Color**: Slate shades (50-950)  
**Supporting Color**: White (`#ffffff`) for text, Black (`#000000`) for backgrounds

## CSS Variable Values

### Background Variables

```css
:root {
  /* Base backgrounds */
  --bg-base: #020617;        /* slate-950 - darkest background */
  --bg-top: #020617;         /* slate-950 - top of gradient (flat) */
  
  /* Panel backgrounds */
  --panel-bg: #0f172a;       /* slate-900 - main panel background */
  --card-bg: #1f2937;        /* gray-800 - card background */
  --status-bg: #1f2937;      /* gray-800 - status bar background */
  --icon-bg: #1f2937;        /* gray-800 - icon button background */
  --select-bg: #1f2937;      /* gray-800 - select/checkbox background */
  --checkbox-bg: #1f2937;    /* gray-800 - checkbox background */
}
```

### Text Variables

```css
:root {
  /* Primary text */
  --text-primary: #fafafa;      /* zinc-50 - main readable text */
  --heading-color: #e4e4e7;     /* zinc-200 - heading text */
  
  /* Secondary text */
  --text-muted: #a1a1aa;        /* zinc-400 - muted/secondary text */
  --text-subtle: #71717a;       /* zinc-500 - subtle/hint text */
  --hint-color: #a1a1aa;        /* zinc-400 - hint text */
  --notes-text: #d4d4d8;       /* zinc-300 - notes/documentation */
  
  /* Links */
  --link-color: #60a5fa;        /* blue-400 - link color */
  --link-hover: #93c5fd;        /* blue-300 - link hover */
}
```

### Border Variables

```css
:root {
  --panel-border: #374151;      /* gray-700 - panel borders */
  --card-border: #374151;       /* gray-700 - card borders */
  --status-border: #374151;     /* gray-700 - status bar borders */
  --icon-border: #374151;       /* gray-700 - icon button borders */
  --select-border: #374151;     /* gray-700 - select borders */
  --checkbox-border: #374151;   /* gray-700 - checkbox borders */
}
```

### Shadow Variables

```css
:root {
  --panel-shadow: rgba(0, 0, 0, 0.3);
  --card-shadow: rgba(0, 0, 0, 0.3);
  --status-shadow: rgba(0, 0, 0, 0.2);
  --select-shadow: rgba(0, 0, 0, 0.3);
}
```

### Control Variables

```css
:root {
  /* Slider */
  --slider-track-strong: rgba(113, 113, 122, 0.4);
  --slider-track-muted: rgba(39, 39, 42, 0.6);
  --slider-thumb-bg: #18181b;
  --slider-thumb-border: #71717a;
  --slider-thumb-shadow: rgba(0, 0, 0, 0.3);
  
  /* Select states */
  --select-hover: #374151;      /* gray-700 */
  --select-active: #374151;     /* gray-700 */
}
```

### Accent Variables

```css
body {
  --accent-primary: #58f5c2;              /* mint/green */
  --accent-primary-shadow: #1c7d5b;      /* darker green */
  --accent-primary-contrast: #04261a;    /* dark text on green */
  
  /* Secondary accent */
  --accent-secondary-bg: rgba(69, 22, 55, 0.8);
  --accent-secondary-text: #ffc6f0;
  --accent-secondary-shadow: #4a1844;
  --accent-secondary-border: #ff58c2;
  
  /* Muted accent */
  --accent-muted-bg: rgba(46, 16, 40, 0.8);
  --accent-muted-text: #dc8bc4;
  --accent-muted-shadow: #36122d;
  --accent-muted-border: #7f2f59;
}
```

## Tailwind Slate Color Scale

### Dark Mode Usage

| Slate Shade | Hex Value | Usage | CSS Variable Equivalent |
|-------------|-----------|-------|-------------------------|
| slate-50 | `#f8fafc` | Light mode text | `--text-primary` (light) |
| slate-100 | `#f1f5f9` | Light mode backgrounds | `--bg-top` (light) |
| slate-200 | `#e2e8f0` | Light mode borders | `--panel-border` (light) |
| slate-300 | `#cbd5e1` | Light mode secondary text | `--text-muted` (light) |
| slate-400 | `#94a3b8` | Muted text | `--text-muted` |
| slate-500 | `#64748b` | Subtle text | `--text-subtle` |
| slate-600 | `#475569` | Secondary text | - |
| slate-700 | `#334155` | Borders | `--panel-border` |
| slate-800 | `#1e293b` | Card backgrounds | `--card-bg` |
| slate-900 | `#0f172a` | Panel backgrounds | `--panel-bg` |
| slate-950 | `#020617` | Base background | `--bg-base` |

### Gray Shades (Used Interchangeably)

| Gray Shade | Hex Value | Usage | Notes |
|------------|-----------|-------|-------|
| gray-700 | `#374151` | Borders | Used for all border colors |
| gray-800 | `#1f2937` | Card/status backgrounds | Used for cards, status bars, icons |

## Component Color Mappings

### AppSidebar

```css
/* Container */
background: var(--panel-bg);           /* slate-900 */
border-color: var(--panel-border);     /* gray-700 / slate-800 */

/* Navigation buttons */
color: var(--text-muted);              /* slate-500 / slate-400 */
background: transparent;
hover-background: rgba(var(--panel-bg), 0.5);

/* Active button */
background: var(--accent-primary);     /* #58f5c2 */
color: var(--accent-primary-contrast); /* #04261a */
```

### SettingsSidebar

```css
/* Container */
background: var(--panel-bg);           /* slate-900 */
border-color: var(--panel-border);     /* slate-800 */

/* Section headings */
color: var(--text-muted);              /* Uses .field-label class */

/* Navigation items */
color: var(--text-primary);            /* white */
active-background: var(--accent-primary);
```

### Settings Pages (DisplayTab, PerformanceTab, etc.)

```css
/* Card container */
background: var(--panel-bg);           /* slate-900 */
border-color: var(--panel-border);     /* slate-800 */

/* Card header */
border-bottom-color: var(--panel-border); /* slate-800 */

/* Title */
color: var(--text-primary);            /* white */

/* Description */
color: var(--text-muted);              /* slate-400 */

/* Info icon */
color: var(--text-subtle);             /* slate-500 */
```

### Control Panels

```css
/* Section title */
color: var(--heading-color);           /* zinc-200 */

/* Field label */
color: var(--text-muted);              /* slate-400 / slate-300 */

/* Field value */
color: var(--accent-primary);          /* #58f5c2 */

/* Dividers */
border-color: var(--panel-border);     /* slate-800 */
```

### StatusBar

```css
/* Container */
background: var(--status-bg);         /* gray-800 */
border-color: var(--status-border);    /* gray-700 */

/* Text */
color: var(--text-primary);            /* white */
```

## Light Mode Values

### Background Variables (Light)

```css
[data-theme="light"] {
  --bg-base: #fafafa;        /* gray-50 */
  --bg-top: #ffffff;         /* white */
  --panel-bg: #ffffff;       /* white */
  --card-bg: #ffffff;        /* white */
  --status-bg: #fafafa;      /* gray-50 */
  --icon-bg: #fafafa;        /* gray-50 */
  --select-bg: #ffffff;      /* white */
  --checkbox-bg: #ffffff;    /* white */
}
```

### Text Variables (Light)

```css
[data-theme="light"] {
  --text-primary: #09090b;      /* zinc-950 - dark text */
  --heading-color: #18181b;    /* zinc-900 - dark headings */
  --text-muted: #52525b;       /* zinc-600 - muted text */
  --text-subtle: #71717a;      /* zinc-500 - subtle text */
  --hint-color: #52525b;       /* zinc-600 - hints */
  --notes-text: #3f3f46;      /* zinc-700 - notes */
  --link-color: #3b82f6;      /* blue-600 - links */
  --link-hover: #2563eb;      /* blue-700 - link hover */
}
```

### Border Variables (Light)

```css
[data-theme="light"] {
  --panel-border: #e4e4e7;      /* zinc-200 */
  --card-border: #e4e4e7;       /* zinc-200 */
  --status-border: #e4e4e7;     /* zinc-200 */
  --icon-border: #e4e4e7;       /* zinc-200 */
  --select-border: #e4e4e7;     /* zinc-200 */
  --checkbox-border: #d4d4d8;   /* zinc-300 */
}
```

### Shadow Variables (Light)

```css
[data-theme="light"] {
  --panel-shadow: rgba(0, 0, 0, 0.1);
  --card-shadow: rgba(0, 0, 0, 0.1);
  --status-shadow: rgba(0, 0, 0, 0.05);
  --select-shadow: rgba(0, 0, 0, 0.1);
}
```

## Relationship Between CSS Variables and Tailwind Classes

### Direct Mappings

| CSS Variable | Tailwind Class (Dark) | Tailwind Class (Light) |
|--------------|----------------------|------------------------|
| `--bg-base` | `bg-slate-950` | `bg-gray-50` |
| `--panel-bg` | `bg-slate-900` | `bg-white` |
| `--card-bg` | `bg-slate-800` / `bg-gray-800` | `bg-white` |
| `--text-primary` | `text-white` / `text-slate-50` | `text-slate-900` / `text-zinc-950` |
| `--text-muted` | `text-slate-400` / `text-zinc-400` | `text-slate-600` / `text-zinc-600` |
| `--panel-border` | `border-slate-800` / `border-gray-700` | `border-slate-200` / `border-zinc-200` |

### Semantic Mappings (Proposed)

After migration to template system:

| CSS Variable | Semantic Class | Purpose |
|--------------|---------------|---------|
| `--bg-base` | `.bg-theme-bg-base` | Base background |
| `--panel-bg` | `.bg-theme-panel` | Panel background |
| `--card-bg` | `.bg-theme-card` | Card background |
| `--text-primary` | `.text-theme-primary` | Primary text |
| `--text-muted` | `.text-theme-muted` | Muted text |
| `--panel-border` | `.border-theme-panel` | Panel border |

## Color Usage Patterns

### Background Hierarchy

1. **Base** (`--bg-base`): Deepest background, page level
2. **Panel** (`--panel-bg`): Main UI panels, sidebars
3. **Card** (`--card-bg`): Cards, status bars, icon buttons
4. **Select** (`--select-bg`): Form controls, dropdowns

### Text Hierarchy

1. **Primary** (`--text-primary`): Main readable text, headings
2. **Muted** (`--text-muted`): Secondary text, descriptions
3. **Subtle** (`--text-subtle`): Hints, helper text, icons

### Border Usage

- **Panel borders**: Separate major sections
- **Card borders**: Define card boundaries
- **Dividers**: Separate content within sections

## Migration Notes

When migrating to the template system:

1. Replace hardcoded Tailwind classes with CSS variables
2. Use semantic utility classes where appropriate
3. Ensure both dark and light modes are properly defined
4. Test contrast ratios for accessibility
5. Maintain visual consistency with current design

## Accessibility Considerations

### Contrast Ratios (WCAG AA)

- **Primary text on panel**: 12.6:1 (white on slate-900) ✅
- **Muted text on panel**: 4.8:1 (slate-400 on slate-900) ✅
- **Primary text on card**: 10.2:1 (white on gray-800) ✅
- **Links**: 3.1:1 (blue-400 on slate-900) ⚠️ (needs improvement)

### Light Mode Contrast

- **Primary text on white**: 15.8:1 (zinc-950 on white) ✅
- **Muted text on white**: 7.0:1 (zinc-600 on white) ✅
- **Borders**: 1.2:1 (zinc-200 on white) ⚠️ (may need adjustment)

