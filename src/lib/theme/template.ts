/**
 * Theme Template System
 * 
 * Defines the three-variable template structure for creating themes:
 * - Primary: Main UI color (slate) - backgrounds, text, borders
 * - Accent: Accent/highlight color (mint green) - buttons, highlights
 * - Supporting: High contrast color (white/black)
 */

export interface ThemeAccent {
  /** Main accent color */
  base: string;
  /** Shadow/darker variant for buttons */
  shadow: string;
  /** Text color on accent background */
  contrast: string;
  /** Secondary accent variant (optional) */
  secondary?: string;
  /** Muted accent variant (optional) */
  muted?: string;
  /** Link color */
  link?: string;
  /** Link hover color */
  linkHover?: string;
}

export interface ThemePrimary {
  /** Background shades */
  bgBase: string;        // Base background (slate-950)
  bgTop: string;         // Top background for gradients (slate-950)
  panel: string;         // Panel background (slate-900)
  card: string;          // Card background (gray-800)
  status: string;        // Status bar background (gray-800)
  icon: string;          // Icon button background (gray-800)
  select: string;        // Select/checkbox background (gray-800)
  checkbox: string;      // Checkbox background (gray-800)
  
  /** Text shades */
  textPrimary: string;   // Primary text (white/zinc-50)
  textMuted: string;     // Muted text (zinc-400)
  textSubtle: string;    // Subtle text (zinc-500)
  heading: string;       // Heading text (zinc-200)
  hint: string;          // Hint text (zinc-400)
  notes: string;         // Notes text (zinc-300)
  
  /** Unified border color - one tint lighter than panel background */
  border: string;        // Unified border color for borders on panels/cards
  /** Border color for base background - one tint lighter than base background */
  borderBase: string;    // Border color for dividers on base background (settings, etc.)
  
  /** Shadow colors */
  shadowPanel: string;   // Panel shadow
  shadowCard: string;    // Card shadow
  shadowStatus: string;  // Status shadow
  shadowSelect: string;  // Select shadow
  
  /** Control colors */
  sliderTrackStrong: string;  // Slider track strong
  sliderTrackMuted: string;   // Slider track muted
  sliderThumbBg: string;      // Slider thumb background (uses tint50)
  sliderThumbBorder: string;  // Slider thumb border (uses tint400)
  sliderThumbShadow: string;  // Slider thumb shadow
  selectHover: string;        // Select hover state
  selectActive: string;       // Select active state
  iconHover: string;          // Naked icon button hover state
  iconHoverNormal: string;    // Normal icon button hover state (with background)
  
  /** Color scale tints - for dynamic theme color support */
  tint50: string;   // Lightest tint (e.g., slate-50)
  tint100: string;  // Very light tint (e.g., slate-100)
  tint400: string;  // Medium-light tint (e.g., slate-400)
  tint600: string;  // Medium-dark tint (e.g., slate-600)
  tint700: string;  // Dark tint (e.g., slate-700)
  tint800: string;  // Dark tint (e.g., slate-800)
}

export interface ThemeSupporting {
  /** Light color (white in light mode, used for text in dark mode) */
  light: string;
  /** Dark color (black in dark mode, used for text in light mode) */
  dark: string;
}

export interface ThemeTemplate {
  /** Primary color (main UI color - slate) */
  primary: ThemePrimary;
  /** Accent color (highlight color - mint green) */
  accent: ThemeAccent;
  /** Supporting color (high contrast) */
  supporting: ThemeSupporting;
}

/**
 * Theme mode - determines which variant of colors to use
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Complete theme definition with both dark and light modes
 */
export interface ThemeDefinition {
  name: string;
  dark: ThemeTemplate;
  light: ThemeTemplate;
}

