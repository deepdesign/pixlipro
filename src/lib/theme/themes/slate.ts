/**
 * Slate Theme Definition
 * 
 * Default dark theme using slate colors with teal accent
 */

import type { ThemeDefinition } from '../template';

export const slateTheme: ThemeDefinition = {
  name: 'slate',
  dark: {
    primary: {
      // Backgrounds
      bgBase: '#020617',         // slate-950 (main container background)
      bgTop: '#020617',          // slate-950
      panel: '#0f172a',          // slate-900
      card: '#1e293b',           // slate-800
      status: '#1e293b',         // slate-800
      icon: '#1e293b',           // slate-800 (for slider track/switch bg/icon buttons/badges)
      select: '#1e293b',         // slate-800
      checkbox: '#1e293b',       // slate-800
      
      // Text
      textPrimary: '#ffffff',    // white
      textMuted: '#94a3b8',      // slate-400
      textSubtle: '#64748b',     // slate-500
      heading: '#e2e8f0',        // slate-200
      hint: '#94a3b8',           // slate-400
      notes: '#cbd5e1',          // slate-300
      
      // Unified border - one tint lighter than panel background (slate-900 -> slate-800)
      border: '#1e293b',     // slate-800 (one tint lighter than panel: slate-900)
      // Border for base background - one tint lighter than base background (slate-950 -> slate-900)
      borderBase: '#0f172a', // slate-900 (one tint lighter than base: slate-950)
      
      // Shadows
      shadowPanel: 'rgba(0, 0, 0, 0.3)',
      shadowCard: 'rgba(0, 0, 0, 0.3)',
      shadowStatus: 'rgba(0, 0, 0, 0.2)',
      shadowSelect: 'rgba(0, 0, 0, 0.3)',
      
      // Controls
      sliderTrackStrong: 'rgba(100, 116, 139, 0.4)',  // slate-500 with opacity
      sliderTrackMuted: 'rgba(15, 23, 42, 0.6)',      // slate-900 with opacity
      sliderThumbBg: '#f8fafc',  // Uses tint50 (slate-50) - will reference tint50 variable
      sliderThumbBorder: '#94a3b8',  // Uses tint400 (slate-400) - will reference tint400 variable
      sliderThumbShadow: 'rgba(0, 0, 0, 0.3)',
      selectHover: '#334155',    // slate-700
      selectActive: '#334155',    // slate-700
      iconHover: '#1e293b',      // slate-800 - for naked icon button hover
      iconHoverNormal: '#334155', // slate-700 - for normal icon button hover
      
      // Color scale tints - slate
      tint50: '#f8fafc',   // slate-50
      tint100: '#f1f5f9',  // slate-100
      tint400: '#94a3b8',  // slate-400
      tint600: '#475569',  // slate-600
      tint700: '#334155',  // slate-700
      tint800: '#1e293b',  // slate-800
    },
    accent: {
      base: '#2dd4bf',           // teal-400
      shadow: '#0d9488',         // teal-600
      contrast: '#134e4a',       // teal-900 (dark text on teal)
      secondary: 'rgba(69, 22, 55, 0.8)',  // secondary accent bg
      muted: 'rgba(46, 16, 40, 0.8)',      // muted accent bg
      link: '#60a5fa',           // blue-400
      linkHover: '#93c5fd',      // blue-300
    },
    supporting: {
      light: '#ffffff',          // white
      dark: '#000000',           // black
    },
  },
  light: {
    primary: {
      // Backgrounds
      bgBase: '#f8fafc',         // slate-50
      bgTop: '#ffffff',          // white
      panel: '#ffffff',          // white
      card: '#ffffff',           // white
      status: '#f8fafc',         // slate-50
      icon: '#f1f5f9',           // slate-100 (for slider track/switch bg in light mode)
      select: '#ffffff',         // white
      checkbox: '#ffffff',       // white
      
      // Text
      textPrimary: '#0f172a',    // slate-900 (dark)
      textMuted: '#475569',      // slate-600
      textSubtle: '#64748b',     // slate-500
      heading: '#1e293b',        // slate-800
      hint: '#475569',           // slate-600
      notes: '#334155',          // slate-700
      
      // Unified border - one tint lighter than panel background (white -> slate-200)
      border: '#e2e8f0',    // slate-200 (one tint lighter than panel: white)
      // Border for base background - one tint lighter than base background (slate-50 -> slate-100)
      borderBase: '#f1f5f9', // slate-100 (one tint lighter than base: slate-50)
      
      // Shadows
      shadowPanel: 'rgba(0, 0, 0, 0.1)',
      shadowCard: 'rgba(0, 0, 0, 0.1)',
      shadowStatus: 'rgba(0, 0, 0, 0.05)',
      shadowSelect: 'rgba(0, 0, 0, 0.1)',
      
      // Controls
      sliderTrackStrong: 'rgba(100, 116, 139, 0.4)',  // slate-500 with opacity
      sliderTrackMuted: 'rgba(226, 232, 240, 0.8)',   // slate-200 with opacity
      sliderThumbBg: '#475569',  // Uses tint600 (slate-600) - will reference tint600 variable
      sliderThumbBorder: '#475569',  // Uses tint600 (slate-600) - will reference tint600 variable
      sliderThumbShadow: 'rgba(0, 0, 0, 0.1)',
      selectHover: '#f1f5f9',    // slate-100
      selectActive: '#e2e8f0',   // slate-200
      iconHover: '#e8f2f6',      // Between slate-100 and slate-200 - subtle darkening for hover (approximates Tailwind's bg-zinc-950/5 overlay)
      iconHoverNormal: '#f1f5f9', // slate-100 (for normal icon button hover)
      
      // Color scale tints - slate (same as dark mode)
      tint50: '#f8fafc',   // slate-50
      tint100: '#f1f5f9',  // slate-100
      tint400: '#94a3b8',  // slate-400
      tint600: '#475569',  // slate-600
      tint700: '#334155',  // slate-700
      tint800: '#1e293b',  // slate-800
    },
    accent: {
      base: '#2dd4bf',           // teal-400 (same as dark)
      shadow: '#0d9488',         // teal-600
      contrast: '#134e4a',       // teal-900 (dark text on teal)
      secondary: 'rgba(69, 22, 55, 0.8)',
      muted: 'rgba(46, 16, 40, 0.8)',
      link: '#3b82f6',           // blue-600 (darker for light mode)
      linkHover: '#2563eb',      // blue-700
    },
    supporting: {
      light: '#ffffff',          // white
      dark: '#000000',           // black
    },
  },
};

