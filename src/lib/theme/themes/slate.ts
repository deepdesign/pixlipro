/**
 * Slate Theme Definition
 * 
 * Default dark theme using slate colors with mint/green accent
 */

import type { ThemeDefinition } from '../template';

export const slateTheme: ThemeDefinition = {
  name: 'slate',
  dark: {
    primary: {
      base: '#58f5c2',           // mint/green
      shadow: '#1c7d5b',         // darker green
      contrast: '#04261a',       // dark text on green
      secondary: 'rgba(69, 22, 55, 0.8)',  // secondary accent bg
      muted: 'rgba(46, 16, 40, 0.8)',      // muted accent bg
      link: '#60a5fa',           // blue-400
      linkHover: '#93c5fd',      // blue-300
    },
    secondary: {
      // Backgrounds
      bgBase: '#020617',         // slate-950
      bgTop: '#020617',          // slate-950
      panel: '#0f172a',          // slate-900
      card: '#1e293b',           // slate-800
      status: '#1e293b',         // slate-800
      icon: '#1e293b',           // slate-800
      select: '#1e293b',         // slate-800
      checkbox: '#1e293b',       // slate-800
      
      // Text
      textPrimary: '#ffffff',    // white
      textMuted: '#94a3b8',      // slate-400
      textSubtle: '#64748b',     // slate-500
      heading: '#e2e8f0',        // slate-200
      hint: '#94a3b8',           // slate-400
      notes: '#cbd5e1',          // slate-300
      
      // Borders
      borderPanel: '#334155',     // slate-700
      borderCard: '#334155',     // slate-700
      borderStatus: '#334155',   // slate-700
      borderIcon: '#334155',     // slate-700
      borderSelect: '#334155',   // slate-700
      borderCheckbox: '#334155', // slate-700
      
      // Shadows
      shadowPanel: 'rgba(0, 0, 0, 0.3)',
      shadowCard: 'rgba(0, 0, 0, 0.3)',
      shadowStatus: 'rgba(0, 0, 0, 0.2)',
      shadowSelect: 'rgba(0, 0, 0, 0.3)',
      
      // Controls
      sliderTrackStrong: 'rgba(100, 116, 139, 0.4)',  // slate-500 with opacity
      sliderTrackMuted: 'rgba(15, 23, 42, 0.6)',      // slate-900 with opacity
      sliderThumbBg: '#ffffff',  // white
      sliderThumbBorder: '#64748b',  // slate-500
      sliderThumbShadow: 'rgba(0, 0, 0, 0.3)',
      selectHover: '#334155',    // slate-700
      selectActive: '#334155',    // slate-700
      iconHover: '#334155',      // slate-700 - for icon button hover
    },
    supporting: {
      light: '#ffffff',          // white
      dark: '#000000',           // black
    },
  },
  light: {
    primary: {
      base: '#58f5c2',           // mint/green (same as dark)
      shadow: '#1c7d5b',         // darker green
      contrast: '#04261a',       // dark text on green
      secondary: 'rgba(69, 22, 55, 0.8)',
      muted: 'rgba(46, 16, 40, 0.8)',
      link: '#3b82f6',           // blue-600 (darker for light mode)
      linkHover: '#2563eb',      // blue-700
    },
    secondary: {
      // Backgrounds
      bgBase: '#f8fafc',         // slate-50
      bgTop: '#ffffff',          // white
      panel: '#ffffff',          // white
      card: '#ffffff',           // white
      status: '#f8fafc',         // slate-50
      icon: '#f1f5f9',           // slate-100 (for slider track/switch bg)
      select: '#ffffff',         // white
      checkbox: '#ffffff',       // white
      
      // Text
      textPrimary: '#0f172a',    // slate-900 (dark)
      textMuted: '#475569',      // slate-600
      textSubtle: '#64748b',     // slate-500
      heading: '#1e293b',        // slate-800
      hint: '#475569',           // slate-600
      notes: '#334155',          // slate-700
      
      // Borders
      borderPanel: '#e2e8f0',    // slate-200
      borderCard: '#e2e8f0',     // slate-200
      borderStatus: '#e2e8f0',  // slate-200
      borderIcon: '#e2e8f0',    // slate-200
      borderSelect: '#e2e8f0',  // slate-200
      borderCheckbox: '#cbd5e1', // slate-300
      
      // Shadows
      shadowPanel: 'rgba(0, 0, 0, 0.1)',
      shadowCard: 'rgba(0, 0, 0, 0.1)',
      shadowStatus: 'rgba(0, 0, 0, 0.05)',
      shadowSelect: 'rgba(0, 0, 0, 0.1)',
      
      // Controls
      sliderTrackStrong: 'rgba(100, 116, 139, 0.4)',  // slate-500 with opacity
      sliderTrackMuted: 'rgba(226, 232, 240, 0.8)',   // slate-200 with opacity
      sliderThumbBg: '#475569',      // slate-600 - dark color for visibility on white/light backgrounds
      sliderThumbBorder: '#475569',  // slate-600 - same as background
      sliderThumbShadow: 'rgba(0, 0, 0, 0.1)',
      selectHover: '#f1f5f9',    // slate-100
      selectActive: '#e2e8f0',   // slate-200
      iconHover: '#e8f2f6',      // Between slate-100 and slate-200 - subtle darkening for hover (approximates Tailwind's bg-zinc-950/5 overlay)
    },
    supporting: {
      light: '#ffffff',          // white
      dark: '#000000',           // black
    },
  },
};

