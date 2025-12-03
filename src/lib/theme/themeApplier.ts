/**
 * Theme Applier
 * 
 * Applies themes dynamically by injecting CSS variables into the document.
 */

import type { CustomTheme } from "../storage/themeStorage";
import { buildThemeFromColors } from "./themeBuilder";
import { generateThemeCSS, generateSemanticCSS } from "./generator";

const THEME_STYLE_ID = "pixli-dynamic-theme";

/**
 * Apply a theme to the document
 */
export function applyTheme(theme: CustomTheme): void {
  // Build theme definition from colors
  const themeDefinition = buildThemeFromColors(
    theme.primaryColor,
    theme.accentColor,
    theme.name
  );

  // Get current theme mode from document
  // const currentMode = getCurrentThemeMode(); // Unused

  // Generate CSS variables
  const darkVars = generateThemeCSS(themeDefinition.dark, "dark");
  const lightVars = generateThemeCSS(themeDefinition.light, "light");
  const darkSemantic = generateSemanticCSS(themeDefinition.dark, "dark");
  const lightSemantic = generateSemanticCSS(themeDefinition.light, "light");

  // Remove existing theme style if present
  let styleElement = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = THEME_STYLE_ID;
    document.head.appendChild(styleElement);
  }

  // Build CSS string
  let css = `/* Dynamic Theme: ${theme.name} */\n\n`;

  // Base template variables and dark mode semantic mappings (default)
  css += `:root {\n`;
  Object.entries(darkVars).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  Object.entries(darkSemantic).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Dark mode semantic mappings (explicit, same as :root for consistency)
  css += `[data-theme="dark"] {\n`;
  Object.entries(darkSemantic).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Light mode template variables (override dark mode values)
  css += `[data-theme="light"] {\n`;
  Object.entries(lightVars).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Light mode semantic mappings
  css += `[data-theme="light"] {\n`;
  Object.entries(lightSemantic).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += `}\n\n`;

  // Inject CSS
  styleElement.textContent = css;
}

/**
 * Remove the applied theme (restore default)
 */
export function removeTheme(): void {
  const styleElement = document.getElementById(THEME_STYLE_ID);
  if (styleElement) {
    styleElement.remove();
  }
}

