/**
 * Theme Generator
 * 
 * Generates CSS variables from theme template definitions
 */

import type { ThemeTemplate, ThemeMode, ThemeDefinition } from './template';

/**
 * Generates CSS variable definitions from a theme template
 * 
 * @param template - Theme template to generate CSS from
 * @param mode - Theme mode (dark or light)
 * @returns Object mapping CSS variable names to values
 */
export function generateThemeCSS(
  template: ThemeTemplate,
  _mode: ThemeMode
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Accent color variables (mint green)
  vars['--theme-accent-base'] = template.accent.base;
  vars['--theme-accent-shadow'] = template.accent.shadow;
  vars['--theme-accent-contrast'] = template.accent.contrast;
  if (template.accent.secondary) {
    vars['--theme-accent-secondary'] = template.accent.secondary;
  }
  if (template.accent.muted) {
    vars['--theme-accent-muted'] = template.accent.muted;
  }
  if (template.accent.link) {
    vars['--theme-accent-link'] = template.accent.link;
  }
  if (template.accent.linkHover) {
    vars['--theme-accent-linkHover'] = template.accent.linkHover;
  }

  // Primary color variables (slate) - backgrounds
  vars['--theme-primary-bg-base'] = template.primary.bgBase;
  vars['--theme-primary-bg-top'] = template.primary.bgTop;
  vars['--theme-primary-panel'] = template.primary.panel;
  vars['--theme-primary-card'] = template.primary.card;
  vars['--theme-primary-status'] = template.primary.status;
  vars['--theme-primary-icon'] = template.primary.icon;
  vars['--theme-primary-select'] = template.primary.select;
  vars['--theme-primary-checkbox'] = template.primary.checkbox;

  // Primary color variables (slate) - text
  vars['--theme-primary-textPrimary'] = template.primary.textPrimary;
  vars['--theme-primary-textMuted'] = template.primary.textMuted;
  vars['--theme-primary-textSubtle'] = template.primary.textSubtle;
  vars['--theme-primary-heading'] = template.primary.heading;
  vars['--theme-primary-hint'] = template.primary.hint;
  vars['--theme-primary-notes'] = template.primary.notes;

  // Primary color variables (slate) - unified borders
  vars['--theme-primary-border'] = template.primary.border;
  vars['--theme-primary-borderBase'] = template.primary.borderBase;

  // Primary color variables (slate) - shadows
  vars['--theme-primary-shadowPanel'] = template.primary.shadowPanel;
  vars['--theme-primary-shadowCard'] = template.primary.shadowCard;
  vars['--theme-primary-shadowStatus'] = template.primary.shadowStatus;
  vars['--theme-primary-shadowSelect'] = template.primary.shadowSelect;

  // Primary color variables (slate) - controls
  vars['--theme-primary-sliderTrackStrong'] = template.primary.sliderTrackStrong;
  vars['--theme-primary-sliderTrackMuted'] = template.primary.sliderTrackMuted;
  // Color scale tints (must be defined before slider thumb which references them)
  vars['--theme-primary-tint50'] = template.primary.tint50;
  vars['--theme-primary-tint100'] = template.primary.tint100;
  vars['--theme-primary-tint400'] = template.primary.tint400;
  vars['--theme-primary-tint600'] = template.primary.tint600;
  vars['--theme-primary-tint700'] = template.primary.tint700;
  vars['--theme-primary-tint800'] = template.primary.tint800;

  // Slider thumb uses tint variables for theme color support
  vars['--theme-primary-sliderThumbBg'] = _mode === 'dark' 
    ? 'var(--theme-primary-tint50)' 
    : 'var(--theme-primary-tint600)';
  vars['--theme-primary-sliderThumbBorder'] = _mode === 'dark'
    ? 'var(--theme-primary-tint400)'
    : 'var(--theme-primary-tint600)';
  vars['--theme-primary-sliderThumbShadow'] = template.primary.sliderThumbShadow;
  vars['--theme-primary-selectHover'] = template.primary.selectHover;
  vars['--theme-primary-selectActive'] = template.primary.selectActive;
  vars['--theme-primary-iconHover'] = template.primary.iconHover;
  vars['--theme-primary-iconHoverNormal'] = template.primary.iconHoverNormal;

  // Supporting color variables
  vars['--theme-supporting-light'] = template.supporting.light;
  vars['--theme-supporting-dark'] = template.supporting.dark;

  return vars;
}

/**
 * Generates semantic CSS variable mappings from theme template
 * Maps template variables to semantic variable names used throughout the app
 * 
 * @param template - Theme template
 * @param mode - Theme mode
 * @returns Object mapping semantic CSS variable names to template variable references
 */
export function generateSemanticCSS(
  template: ThemeTemplate,
  mode: ThemeMode
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Background mappings (using primary/slate colors)
  vars['--bg-base'] = 'var(--theme-primary-bg-base)';
  vars['--bg-top'] = 'var(--theme-primary-bg-top)';
  vars['--panel-bg'] = 'var(--theme-primary-panel)';
  vars['--card-bg'] = 'var(--theme-primary-card)';
  vars['--status-bg'] = 'var(--theme-primary-status)';
  vars['--icon-bg'] = 'var(--theme-primary-icon)';
  vars['--select-bg'] = 'var(--theme-primary-select)';
  vars['--checkbox-bg'] = 'var(--theme-primary-checkbox)';

  // Text mappings - adapt based on mode
  if (mode === 'dark') {
    vars['--text-primary'] = 'var(--theme-supporting-light)';
  } else {
    vars['--text-primary'] = 'var(--theme-supporting-dark)';
  }
  vars['--text-muted'] = 'var(--theme-primary-textMuted)';
  vars['--text-subtle'] = 'var(--theme-primary-textSubtle)';
  vars['--heading-color'] = 'var(--theme-primary-heading)';
  vars['--hint-color'] = 'var(--theme-primary-hint)';
  vars['--notes-text'] = 'var(--theme-primary-notes)';

  // Border mappings (using primary/slate colors)
  vars['--border'] = 'var(--theme-primary-border)';
  vars['--border-base'] = 'var(--theme-primary-borderBase)';
  vars['--panel-border'] = 'var(--theme-primary-border)';
  vars['--card-border'] = 'var(--theme-primary-border)';
  vars['--structural-border'] = 'var(--theme-primary-borderBase)'; // Dividers on base background
  vars['--status-border'] = 'var(--theme-primary-border)';
  vars['--icon-border'] = 'var(--theme-primary-border)';
  vars['--select-border'] = 'var(--theme-primary-border)';
  vars['--checkbox-border'] = 'var(--theme-primary-border)';

  // Shadow mappings (using primary/slate colors)
  vars['--panel-shadow'] = 'var(--theme-primary-shadowPanel)';
  vars['--card-shadow'] = 'var(--theme-primary-shadowCard)';
  vars['--status-shadow'] = 'var(--theme-primary-shadowStatus)';
  vars['--select-shadow'] = 'var(--theme-primary-shadowSelect)';

  // Control mappings (using primary/slate colors)
  vars['--slider-track-strong'] = 'var(--theme-primary-sliderTrackStrong)';
  vars['--slider-track-muted'] = 'var(--theme-primary-sliderTrackMuted)';
  vars['--slider-thumb-bg'] = 'var(--theme-primary-sliderThumbBg)';
  vars['--slider-thumb-border'] = 'var(--theme-primary-sliderThumbBorder)';
  vars['--slider-thumb-shadow'] = 'var(--theme-primary-sliderThumbShadow)';
  vars['--select-hover'] = 'var(--theme-primary-selectHover)';
  vars['--select-active'] = 'var(--theme-primary-selectActive)';
  vars['--icon-hover'] = 'var(--theme-primary-iconHover)';

  // Accent mappings (mint green)
  vars['--accent-primary'] = 'var(--theme-accent-base)';
  vars['--accent-primary-shadow'] = 'var(--theme-accent-shadow)';
  vars['--accent-primary-contrast'] = 'var(--theme-accent-contrast)';

  // Link mappings (using accent color)
  if (template.accent.link) {
    vars['--link-color'] = 'var(--theme-accent-link)';
  }
  if (template.accent.linkHover) {
    vars['--link-hover'] = 'var(--theme-accent-linkHover)';
  }

  return vars;
}

/**
 * Generates complete CSS for a theme definition (both dark and light modes)
 * 
 * @param theme - Complete theme definition
 * @returns CSS string with all variable definitions
 */
export function generateThemeCSSString(theme: ThemeDefinition): string {
  const darkVars = generateThemeCSS(theme.dark, 'dark');
  const lightVars = generateThemeCSS(theme.light, 'light');
  const darkSemantic = generateSemanticCSS(theme.dark, 'dark');
  const lightSemantic = generateSemanticCSS(theme.light, 'light');

  let css = `/* Theme: ${theme.name} */\n\n`;
  
  // Base template variables (same for both modes)
  css += `:root {\n`;
  Object.entries(darkVars).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Dark mode semantic mappings
  css += `[data-theme="dark"] {\n`;
  Object.entries(darkSemantic).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Light mode template variables
  css += `[data-theme="light"] {\n`;
  Object.entries(lightVars).forEach(([key, value]) => {
    // Override dark mode values with light mode values
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Light mode semantic mappings
  css += `[data-theme="light"] {\n`;
  Object.entries(lightSemantic).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  return css;
}

