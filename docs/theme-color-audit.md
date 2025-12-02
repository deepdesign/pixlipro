# Theme Color System Audit

## Overview

This document provides a comprehensive audit of color usage across the Pixli application, focusing on the slate dark theme implementation. The audit categorizes all color usage by purpose and maps them to the three-variable template system (Primary/Green, Secondary/Slate, Supporting/White).

## Color System Definitions

- **Primary Color**: Accent color (currently green/mint `#58f5c2`) - used for buttons, highlights, active states, borders, links
- **Secondary Color**: Neutral color (slate shades) - used for backgrounds, panels, borders, secondary text, UI elements
- **Supporting Color**: High contrast color (white/black) - used for primary text, light backgrounds, high-contrast elements

## 1. Background Colors

### CSS Variables

| Variable | Dark Mode Value | Light Mode Value | Purpose | Template Mapping |
|----------|----------------|------------------|---------|------------------|
| `--bg-base` | `#020617` (slate-950) | `#fafafa` (gray-50) | Base page background | `--theme-secondary-bg-base` |
| `--bg-top` | `#020617` (slate-950) | `#ffffff` (white) | Top background (gradient) | `--theme-secondary-bg-top` |
| `--panel-bg` | `#0f172a` (slate-900) | `#ffffff` (white) | Panel/card background | `--theme-secondary-panel` |
| `--card-bg` | `#1f2937` (gray-800) | `#ffffff` (white) | Card background | `--theme-secondary-card` |
| `--status-bg` | `#1f2937` (gray-800) | `#fafafa` (gray-50) | Status bar background | `--theme-secondary-status` |
| `--icon-bg` | `#1f2937` (gray-800) | `#fafafa` (gray-50) | Icon button background | `--theme-secondary-icon` |
| `--select-bg` | `#1f2937` (gray-800) | `#ffffff` (white) | Select/checkbox background | `--theme-secondary-select` |
| `--checkbox-bg` | `#1f2937` (gray-800) | `#ffffff` (white) | Checkbox background | `--theme-secondary-checkbox` |

### Tailwind Classes Usage

| Class | Usage Count | Components | Purpose | Template Mapping |
|-------|-------------|------------|---------|------------------|
| `bg-slate-950` | ~5 | SettingsPageLayout, body | Base background | `bg-theme-bg-base` |
| `bg-slate-900` | ~15 | AppSidebar, SettingsSidebar, DisplayTab, PerformanceTab | Panel backgrounds | `bg-theme-panel` |
| `bg-slate-800` | ~20 | StatusBar, PerformanceTab, IntegrationsTab | Card/status backgrounds | `bg-theme-card` |
| `bg-slate-50` | ~10 | SettingsPageLayout, SettingsSidebar | Light mode backgrounds | `bg-theme-bg-top` (light) |
| `bg-white` | ~30 | DisplayTab, PerformanceTab, IntegrationsTab | Light mode panel backgrounds | `bg-theme-panel` (light) |

## 2. Text Colors

### CSS Variables

| Variable | Dark Mode Value | Light Mode Value | Purpose | Template Mapping |
|----------|----------------|------------------|---------|------------------|
| `--text-primary` | `#fafafa` (zinc-50) | `#09090b` (zinc-950) | Primary readable text | `--theme-supporting-light` / `--theme-supporting-dark` |
| `--text-muted` | `#a1a1aa` (zinc-400) | `#52525b` (zinc-600) | Muted/secondary text | `--theme-secondary-textMuted` |
| `--text-subtle` | `#71717a` (zinc-500) | `#71717a` (zinc-500) | Subtle/hint text | `--theme-secondary-textSubtle` |
| `--heading-color` | `#e4e4e7` (zinc-200) | `#18181b` (zinc-900) | Heading text | `--theme-secondary-heading` |
| `--hint-color` | `#a1a1aa` (zinc-400) | `#52525b` (zinc-600) | Hint/helper text | `--theme-secondary-hint` |
| `--notes-text` | `#d4d4d8` | `#3f3f46` | Notes/documentation text | `--theme-secondary-notes` |
| `--link-color` | `#60a5fa` | `#3b82f6` | Link color | `--theme-primary-link` |
| `--link-hover` | `#93c5fd` | `#2563eb` | Link hover color | `--theme-primary-linkHover` |

### Tailwind Classes Usage

| Class | Usage Count | Components | Purpose | Template Mapping |
|-------|-------------|------------|---------|------------------|
| `text-slate-50` / `text-white` | ~40 | Headers, card titles, primary text | Primary text | `text-theme-primary` |
| `text-slate-400` | ~50 | Descriptions, hints, muted text | Muted text | `text-theme-muted` |
| `text-slate-500` | ~30 | Subtle text, labels | Subtle text | `text-theme-subtle` |
| `text-slate-300` | ~20 | Secondary text, labels | Secondary text | `text-theme-secondary` |
| `text-slate-600` | ~15 | Light mode muted text | Light mode muted | `text-theme-muted` (light) |
| `text-slate-700` | ~10 | Light mode labels | Light mode labels | `text-theme-secondary` (light) |
| `text-slate-800` | ~10 | Light mode headings | Light mode headings | `text-theme-heading` (light) |
| `text-slate-900` | ~20 | Light mode primary text | Light mode primary | `text-theme-primary` (light) |

## 3. Border Colors

### CSS Variables

| Variable | Dark Mode Value | Light Mode Value | Purpose | Template Mapping |
|----------|----------------|------------------|---------|------------------|
| `--panel-border` | `#374151` (gray-700) | `#e4e4e7` (zinc-200) | Panel borders | `--theme-secondary-borderPanel` |
| `--card-border` | `#374151` (gray-700) | `#e4e4e7` (zinc-200) | Card borders | `--theme-secondary-borderCard` |
| `--status-border` | `#374151` (gray-700) | `#e4e4e7` (zinc-200) | Status bar borders | `--theme-secondary-borderStatus` |
| `--icon-border` | `#374151` (gray-700) | `#e4e4e7` (zinc-200) | Icon button borders | `--theme-secondary-borderIcon` |
| `--select-border` | `#374151` (gray-700) | `#e4e4e7` (zinc-200) | Select/checkbox borders | `--theme-secondary-borderSelect` |
| `--checkbox-border` | `#374151` (gray-700) | `#d4d4d8` (zinc-300) | Checkbox borders | `--theme-secondary-borderCheckbox` |

### Tailwind Classes Usage

| Class | Usage Count | Components | Purpose | Template Mapping |
|-------|-------------|------------|---------|------------------|
| `border-slate-800` | ~30 | AppSidebar, SettingsSidebar, dividers | Dark mode borders | `border-theme-panel` |
| `border-slate-200` | ~25 | DisplayTab, PerformanceTab, cards | Light mode borders | `border-theme-panel` (light) |
| `border-slate-700` | ~5 | StatusBar, dividers | Dark mode strong borders | `border-theme-card` |
| `border-slate-300` | ~3 | Breadcrumbs, dividers | Light mode dividers | `border-theme-divider` (light) |

## 4. Shadow Colors

### CSS Variables

| Variable | Dark Mode Value | Light Mode Value | Purpose | Template Mapping |
|----------|----------------|------------------|---------|------------------|
| `--panel-shadow` | `rgba(0, 0, 0, 0.3)` | `rgba(0, 0, 0, 0.1)` | Panel shadows | `--theme-secondary-shadowPanel` |
| `--card-shadow` | `rgba(0, 0, 0, 0.3)` | `rgba(0, 0, 0, 0.1)` | Card shadows | `--theme-secondary-shadowCard` |
| `--status-shadow` | `rgba(0, 0, 0, 0.2)` | `rgba(0, 0, 0, 0.05)` | Status bar shadows | `--theme-secondary-shadowStatus` |
| `--select-shadow` | `rgba(0, 0, 0, 0.3)` | `rgba(0, 0, 0, 0.1)` | Select shadows | `--theme-secondary-shadowSelect` |

## 5. Control Colors

### Slider Controls

| Variable | Dark Mode Value | Light Mode Value | Purpose | Template Mapping |
|----------|----------------|------------------|---------|------------------|
| `--slider-track-strong` | `rgba(113, 113, 122, 0.4)` | `rgba(161, 161, 170, 0.4)` | Strong track color | `--theme-secondary-sliderTrackStrong` |
| `--slider-track-muted` | `rgba(39, 39, 42, 0.6)` | `rgba(244, 244, 245, 0.8)` | Muted track color | `--theme-secondary-sliderTrackMuted` |
| `--slider-thumb-bg` | `#18181b` | `#ffffff` | Thumb background | `--theme-secondary-sliderThumbBg` |
| `--slider-thumb-border` | `#71717a` | `#71717a` | Thumb border | `--theme-secondary-sliderThumbBorder` |
| `--slider-thumb-shadow` | `rgba(0, 0, 0, 0.3)` | `rgba(0, 0, 0, 0.1)` | Thumb shadow | `--theme-secondary-sliderThumbShadow` |

### Select/Checkbox States

| Variable | Dark Mode Value | Light Mode Value | Purpose | Template Mapping |
|----------|----------------|------------------|---------|------------------|
| `--select-hover` | `#374151` (gray-700) | `#fafafa` (gray-50) | Select hover state | `--theme-secondary-selectHover` |
| `--select-active` | `#374151` (gray-700) | `#f4f4f5` (zinc-100) | Select active state | `--theme-secondary-selectActive` |

## 6. Accent Colors

### CSS Variables

| Variable | Value | Purpose | Template Mapping |
|----------|-------|---------|------------------|
| `--accent-primary` | `#58f5c2` (mint) | Main accent color | `--theme-primary-base` |
| `--accent-primary-shadow` | `#1c7d5b` | Accent shadow | `--theme-primary-shadow` |
| `--accent-primary-contrast` | `#04261a` | Text on accent | `--theme-primary-contrast` |
| `--accent-secondary-bg` | `rgba(69, 22, 55, 0.8)` | Secondary accent bg | `--theme-primary-secondary` |
| `--accent-secondary-text` | `#ffc6f0` | Secondary accent text | `--theme-primary-secondaryText` |
| `--accent-muted-bg` | `rgba(46, 16, 40, 0.8)` | Muted accent bg | `--theme-primary-muted` |
| `--accent-muted-text` | `#dc8bc4` | Muted accent text | `--theme-primary-mutedText` |

## 7. Component-Specific Color Usage

### AppSidebar

| Element | Current Colors | Purpose | Template Mapping |
|---------|---------------|---------|------------------|
| Container | `bg-white dark:bg-slate-900`, `border-slate-200 dark:border-slate-800` | Sidebar background | `bg-theme-panel`, `border-theme-panel` |
| Navigation buttons | `text-slate-500 dark:text-slate-300`, `hover:bg-slate-50 dark:hover:bg-slate-800/50` | Icon buttons | `text-theme-muted`, `hover:bg-theme-icon` |
| Active button | `bg-[var(--accent-primary)]`, `text-[var(--accent-primary-contrast)]` | Active state | `bg-theme-primary`, `text-theme-primary-contrast` |

### SettingsSidebar

| Element | Current Colors | Purpose | Template Mapping |
|---------|---------------|---------|------------------|
| Container | `bg-slate-50 dark:bg-slate-900`, `border-slate-200 dark:border-slate-800` | Sidebar background | `bg-theme-panel`, `border-theme-panel` |
| Section headings | `.field-label` class | Section titles | `text-theme-muted` |

### DisplayTab / Settings Pages

| Element | Current Colors | Purpose | Template Mapping |
|---------|---------------|---------|------------------|
| Card container | `bg-white dark:bg-slate-900`, `border-slate-200 dark:border-slate-800` | Card background | `bg-theme-panel`, `border-theme-panel` |
| Card header | `border-slate-200 dark:border-slate-800` | Header divider | `border-theme-divider` |
| Title | `text-slate-900 dark:text-white` | Card title | `text-theme-primary` |
| Description | `text-slate-500 dark:text-slate-400` | Card description | `text-theme-muted` |
| Info icon | `text-slate-400 dark:text-slate-500` | Info icon | `text-theme-subtle` |

### Control Panels

| Element | Current Colors | Purpose | Template Mapping |
|---------|---------------|---------|------------------|
| Section titles | `.section-title` class, `color: var(--heading-color)` | Section headings | `text-theme-heading` |
| Field labels | `.field-label` class, `text-slate-600 dark:text-slate-300` | Control labels | `text-theme-muted` |
| Field values | `.field-value` class, `color: var(--accent-primary)` | Value displays | `text-theme-primary` |

## 8. Hardcoded Color Usage Analysis

### Components Using Hardcoded Tailwind Colors

1. **AppSidebar** - Uses `bg-slate-900`, `text-slate-500`, `border-slate-800`
2. **SettingsSidebar** - Uses `bg-slate-50`, `bg-slate-900`, `border-slate-200`, `border-slate-800`
3. **DisplayTab** - Uses `bg-white`, `bg-slate-900`, `text-slate-900`, `text-white`, `border-slate-200`, `border-slate-800`
4. **PerformanceTab** - Extensive use of slate colors
5. **IntegrationsTab** - Extensive use of slate colors
6. **SettingsPageLayout** - Uses `bg-slate-50`, `bg-slate-950`, `text-slate-800`, `text-slate-50`

### Migration Priority

1. **High Priority**: Layout components (AppSidebar, SettingsSidebar, Header, Footer)
2. **Medium Priority**: Settings pages (DisplayTab, PerformanceTab, IntegrationsTab)
3. **Low Priority**: Content components (AnimationCard, SpriteCard) - can use CSS variables directly

## 9. Light Theme Issues

### Identified Problems

1. **Missing Light Mode Definitions**: Some components don't have proper light mode variants
2. **Hardcoded Dark Colors**: Many components use `dark:` variants but may not have light mode fallbacks
3. **CSS Variable Overrides**: Light theme variables exist but may not be properly applied
4. **Contrast Issues**: Some light mode text may not have sufficient contrast

### Components Needing Light Theme Fixes

- AppSidebar: Needs light mode background and text colors
- SettingsSidebar: Needs light mode styling
- Control panels: Need light mode text and background colors
- StatusBar: Needs light mode colors

## 10. Template System Mapping

### Three-Variable Structure

**Primary (Green/Mint)**: `#58f5c2`
- Used for: Accent colors, buttons, active states, links
- Mapped to: `--theme-primary-*` variables

**Secondary (Slate)**: `#0f172a` (slate-900) base
- Used for: Backgrounds, panels, borders, secondary text
- Mapped to: `--theme-secondary-*` variables
- Full shade scale: 50-950

**Supporting (White/Black)**: `#ffffff` / `#000000`
- Used for: Primary text, high contrast elements
- Mapped to: `--theme-supporting-*` variables
- Adapts based on theme mode

## Next Steps

1. Create template TypeScript interface
2. Generate CSS variables from template
3. Create semantic utility classes
4. Migrate components systematically
5. Fix light theme application
6. Test all components in both themes

