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
  mode: ThemeMode
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Primary color variables
  vars['--theme-primary-base'] = template.primary.base;
  vars['--theme-primary-shadow'] = template.primary.shadow;
  vars['--theme-primary-contrast'] = template.primary.contrast;
  if (template.primary.secondary) {
    vars['--theme-primary-secondary'] = template.primary.secondary;
  }
  if (template.primary.muted) {
    vars['--theme-primary-muted'] = template.primary.muted;
  }
  if (template.primary.link) {
    vars['--theme-primary-link'] = template.primary.link;
  }
  if (template.primary.linkHover) {
    vars['--theme-primary-linkHover'] = template.primary.linkHover;
  }

  // Secondary color variables - backgrounds
  vars['--theme-secondary-bg-base'] = template.secondary.bgBase;
  vars['--theme-secondary-bg-top'] = template.secondary.bgTop;
  vars['--theme-secondary-panel'] = template.secondary.panel;
  vars['--theme-secondary-card'] = template.secondary.card;
  vars['--theme-secondary-status'] = template.secondary.status;
  vars['--theme-secondary-icon'] = template.secondary.icon;
  vars['--theme-secondary-select'] = template.secondary.select;
  vars['--theme-secondary-checkbox'] = template.secondary.checkbox;

  // Secondary color variables - text
  vars['--theme-secondary-textPrimary'] = template.secondary.textPrimary;
  vars['--theme-secondary-textMuted'] = template.secondary.textMuted;
  vars['--theme-secondary-textSubtle'] = template.secondary.textSubtle;
  vars['--theme-secondary-heading'] = template.secondary.heading;
  vars['--theme-secondary-hint'] = template.secondary.hint;
  vars['--theme-secondary-notes'] = template.secondary.notes;

  // Secondary color variables - borders
  vars['--theme-secondary-borderPanel'] = template.secondary.borderPanel;
  vars['--theme-secondary-borderCard'] = template.secondary.borderCard;
  vars['--theme-secondary-borderStatus'] = template.secondary.borderStatus;
  vars['--theme-secondary-borderIcon'] = template.secondary.borderIcon;
  vars['--theme-secondary-borderSelect'] = template.secondary.borderSelect;
  vars['--theme-secondary-borderCheckbox'] = template.secondary.borderCheckbox;

  // Secondary color variables - shadows
  vars['--theme-secondary-shadowPanel'] = template.secondary.shadowPanel;
  vars['--theme-secondary-shadowCard'] = template.secondary.shadowCard;
  vars['--theme-secondary-shadowStatus'] = template.secondary.shadowStatus;
  vars['--theme-secondary-shadowSelect'] = template.secondary.shadowSelect;

  // Secondary color variables - controls
  vars['--theme-secondary-sliderTrackStrong'] = template.secondary.sliderTrackStrong;
  vars['--theme-secondary-sliderTrackMuted'] = template.secondary.sliderTrackMuted;
  vars['--theme-secondary-sliderThumbBg'] = template.secondary.sliderThumbBg;
  vars['--theme-secondary-sliderThumbBorder'] = template.secondary.sliderThumbBorder;
  vars['--theme-secondary-sliderThumbShadow'] = template.secondary.sliderThumbShadow;
  vars['--theme-secondary-selectHover'] = template.secondary.selectHover;
  vars['--theme-secondary-selectActive'] = template.secondary.selectActive;
  vars['--theme-secondary-iconHover'] = template.secondary.iconHover;

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

  // Background mappings
  vars['--bg-base'] = 'var(--theme-secondary-bg-base)';
  vars['--bg-top'] = 'var(--theme-secondary-bg-top)';
  vars['--panel-bg'] = 'var(--theme-secondary-panel)';
  vars['--card-bg'] = 'var(--theme-secondary-card)';
  vars['--status-bg'] = 'var(--theme-secondary-status)';
  vars['--icon-bg'] = 'var(--theme-secondary-icon)';
  vars['--select-bg'] = 'var(--theme-secondary-select)';
  vars['--checkbox-bg'] = 'var(--theme-secondary-checkbox)';

  // Text mappings - adapt based on mode
  if (mode === 'dark') {
    vars['--text-primary'] = 'var(--theme-supporting-light)';
  } else {
    vars['--text-primary'] = 'var(--theme-supporting-dark)';
  }
  vars['--text-muted'] = 'var(--theme-secondary-textMuted)';
  vars['--text-subtle'] = 'var(--theme-secondary-textSubtle)';
  vars['--heading-color'] = 'var(--theme-secondary-heading)';
  vars['--hint-color'] = 'var(--theme-secondary-hint)';
  vars['--notes-text'] = 'var(--theme-secondary-notes)';

  // Border mappings
  vars['--panel-border'] = 'var(--theme-secondary-borderPanel)';
  vars['--card-border'] = 'var(--theme-secondary-borderCard)';
  vars['--status-border'] = 'var(--theme-secondary-borderStatus)';
  vars['--icon-border'] = 'var(--theme-secondary-borderIcon)';
  vars['--select-border'] = 'var(--theme-secondary-borderSelect)';
  vars['--checkbox-border'] = 'var(--theme-secondary-borderCheckbox)';

  // Shadow mappings
  vars['--panel-shadow'] = 'var(--theme-secondary-shadowPanel)';
  vars['--card-shadow'] = 'var(--theme-secondary-shadowCard)';
  vars['--status-shadow'] = 'var(--theme-secondary-shadowStatus)';
  vars['--select-shadow'] = 'var(--theme-secondary-shadowSelect)';

  // Control mappings
  vars['--slider-track-strong'] = 'var(--theme-secondary-sliderTrackStrong)';
  vars['--slider-track-muted'] = 'var(--theme-secondary-sliderTrackMuted)';
  vars['--slider-thumb-bg'] = 'var(--theme-secondary-sliderThumbBg)';
  vars['--slider-thumb-border'] = 'var(--theme-secondary-sliderThumbBorder)';
  vars['--slider-thumb-shadow'] = 'var(--theme-secondary-sliderThumbShadow)';
  vars['--select-hover'] = 'var(--theme-secondary-selectHover)';
  vars['--select-active'] = 'var(--theme-secondary-selectActive)';
  vars['--icon-hover'] = 'var(--theme-secondary-iconHover)';

  // Accent mappings
  vars['--accent-primary'] = 'var(--theme-primary-base)';
  vars['--accent-primary-shadow'] = 'var(--theme-primary-shadow)';
  vars['--accent-primary-contrast'] = 'var(--theme-primary-contrast)';

  // Link mappings
  if (template.primary.link) {
    vars['--link-color'] = 'var(--theme-primary-link)';
  }
  if (template.primary.linkHover) {
    vars['--link-hover'] = 'var(--theme-primary-linkHover)';
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

