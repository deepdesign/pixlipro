/**
 * Theme Builder
 * 
 * Generates ThemeDefinition from primary and accent color names.
 */

import type { ThemeDefinition } from "./template";
import { PRIMARY_COLORS, ACCENT_COLORS, type PrimaryColor, type AccentColor } from "./tailwindColors";

/**
 * Build a complete ThemeDefinition from primary and accent color names
 */
export function buildThemeFromColors(
  primaryColor: PrimaryColor,
  accentColor: AccentColor,
  name: string = `${primaryColor} + ${accentColor}`
): ThemeDefinition {
  const primary = PRIMARY_COLORS[primaryColor];
  const accent = ACCENT_COLORS[accentColor];

  return {
    name,
    dark: {
      primary: {
        // Backgrounds
        bgBase: primary[950],         // e.g., slate-950 (main container background)
        bgTop: primary[950],          // e.g., slate-950
        panel: primary[900],          // e.g., slate-900
        card: primary[800],           // e.g., slate-800
        status: primary[800],         // e.g., slate-800
        icon: primary[800],          // e.g., slate-800 (for slider track/switch bg/icon buttons/badges)
        select: primary[800],         // e.g., slate-800
        checkbox: primary[800],       // e.g., slate-800
        
        // Text
        textPrimary: "#ffffff",       // white
        textMuted: primary[400],      // e.g., slate-400
        textSubtle: primary[500],     // e.g., slate-500
        heading: primary[200],        // e.g., slate-200
        hint: primary[400],           // e.g., slate-400
        notes: primary[300],          // e.g., slate-300
        
        // Unified border - one tint lighter than panel background
        border: primary[800],         // e.g., slate-800 (one tint lighter than panel: slate-900)
        // Border for base background - one tint lighter than base background
        borderBase: primary[900],     // e.g., slate-900 (one tint lighter than base: slate-950)
        
        // Shadows
        shadowPanel: "rgba(0, 0, 0, 0.3)",
        shadowCard: "rgba(0, 0, 0, 0.3)",
        shadowStatus: "rgba(0, 0, 0, 0.2)",
        shadowSelect: "rgba(0, 0, 0, 0.3)",
        
        // Controls
        sliderTrackStrong: `rgba(${hexToRgb(primary[500])}, 0.4)`,
        sliderTrackMuted: `rgba(${hexToRgb(primary[900])}, 0.6)`,
        sliderThumbBg: primary[50],   // Uses tint50
        sliderThumbBorder: primary[400], // Uses tint400
        sliderThumbShadow: "rgba(0, 0, 0, 0.3)",
        selectHover: primary[700],    // e.g., slate-700
        selectActive: primary[700],  // e.g., slate-700
        iconHover: primary[800],     // e.g., slate-800 (naked icon buttons)
        iconHoverNormal: primary[700], // e.g., slate-700 (normal icon buttons)
        
        // Color scale tints
        tint50: primary[50],
        tint100: primary[100],
        tint400: primary[400],
        tint600: primary[600],
        tint700: primary[700],
        tint800: primary[800],
      },
      accent: {
        base: accent[400],            // e.g., teal-400
        shadow: accent[600],          // e.g., teal-600
        contrast: accent[900],         // e.g., teal-900
        secondary: `rgba(${hexToRgb(accent[700])}, 0.8)`,
        muted: `rgba(${hexToRgb(accent[800])}, 0.8)`,
        link: ACCENT_COLORS.blue[400], // blue-400
        linkHover: ACCENT_COLORS.blue[300], // blue-300
      },
      supporting: {
        light: "#ffffff",             // white
        dark: "#000000",              // black
      },
    },
    light: {
      primary: {
        // Backgrounds
        bgBase: primary[50],          // e.g., slate-50
        bgTop: "#ffffff",             // white
        panel: "#ffffff",             // white
        card: "#ffffff",              // white
        status: primary[50],          // e.g., slate-50
        icon: primary[100],           // e.g., slate-100 (for slider track/switch bg in light mode)
        select: "#ffffff",            // white
        checkbox: "#ffffff",          // white
        
        // Text
        textPrimary: primary[900],    // e.g., slate-900 (dark)
        textMuted: primary[600],      // e.g., slate-600
        textSubtle: primary[500],     // e.g., slate-500
        heading: primary[800],        // e.g., slate-800
        hint: primary[600],           // e.g., slate-600
        notes: primary[700],         // e.g., slate-700
        
        // Unified border - one tint lighter than panel background
        border: primary[200],         // e.g., slate-200 (one tint lighter than panel: white)
        // Border for base background - one tint lighter than base background
        borderBase: primary[100],     // e.g., slate-100 (one tint lighter than base: slate-50)
        
        // Shadows
        shadowPanel: "rgba(0, 0, 0, 0.1)",
        shadowCard: "rgba(0, 0, 0, 0.1)",
        shadowStatus: "rgba(0, 0, 0, 0.05)",
        shadowSelect: "rgba(0, 0, 0, 0.1)",
        
        // Controls
        sliderTrackStrong: `rgba(${hexToRgb(primary[500])}, 0.4)`,
        sliderTrackMuted: `rgba(${hexToRgb(primary[200])}, 0.8)`,
        sliderThumbBg: primary[600],  // Uses tint600
        sliderThumbBorder: primary[600], // Uses tint600
        sliderThumbShadow: "rgba(0, 0, 0, 0.1)",
        selectHover: primary[100],    // e.g., slate-100
        selectActive: primary[200],   // e.g., slate-200
        iconHover: primary[100],     // e.g., slate-100 (subtle darkening for hover)
        iconHoverNormal: primary[100], // e.g., slate-100 (for normal icon button hover)
        
        // Color scale tints (same as dark mode)
        tint50: primary[50],
        tint100: primary[100],
        tint400: primary[400],
        tint600: primary[600],
        tint700: primary[700],
        tint800: primary[800],
      },
      accent: {
        base: accent[400],            // e.g., teal-400 (same as dark)
        shadow: accent[600],          // e.g., teal-600
        contrast: accent[900],        // e.g., teal-900
        secondary: `rgba(${hexToRgb(accent[700])}, 0.8)`,
        muted: `rgba(${hexToRgb(accent[800])}, 0.8)`,
        link: ACCENT_COLORS.blue[600], // blue-600 (darker for light mode)
        linkHover: ACCENT_COLORS.blue[700], // blue-700
      },
      supporting: {
        light: "#ffffff",             // white
        dark: "#000000",              // black
      },
    },
  };
}

/**
 * Convert hex color to RGB string (for rgba usage)
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return "0, 0, 0";
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
}

