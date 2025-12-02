/**
 * Theme Template System
 * 
 * Defines the three-variable template structure for creating themes:
 * - Primary: Accent color (green/mint)
 * - Secondary: Neutral color (slate)
 * - Supporting: High contrast color (white/black)
 */

export interface ThemePrimary {
  /** Main accent color */
  base: string;
  /** Shadow/darker variant for buttons */
  shadow: string;
  /** Text color on primary background */
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

export interface ThemeSecondary {
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
  
  /** Border shades */
  borderPanel: string;   // Panel border (gray-700)
  borderCard: string;    // Card border (gray-700)
  borderStatus: string;  // Status border (gray-700)
  borderIcon: string;    // Icon border (gray-700)
  borderSelect: string;  // Select border (gray-700)
  borderCheckbox: string; // Checkbox border (gray-700)
  
  /** Shadow colors */
  shadowPanel: string;   // Panel shadow
  shadowCard: string;    // Card shadow
  shadowStatus: string;  // Status shadow
  shadowSelect: string;  // Select shadow
  
  /** Control colors */
  sliderTrackStrong: string;  // Slider track strong
  sliderTrackMuted: string;   // Slider track muted
  sliderThumbBg: string;      // Slider thumb background
  sliderThumbBorder: string;  // Slider thumb border
  sliderThumbShadow: string;  // Slider thumb shadow
  selectHover: string;        // Select hover state
  selectActive: string;       // Select active state
  iconHover: string;          // Icon button hover state
}

export interface ThemeSupporting {
  /** Light color (white in light mode, used for text in dark mode) */
  light: string;
  /** Dark color (black in dark mode, used for text in light mode) */
  dark: string;
}

export interface ThemeTemplate {
  /** Primary color (accent) */
  primary: ThemePrimary;
  /** Secondary color (neutral) */
  secondary: ThemeSecondary;
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

