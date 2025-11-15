/**
 * Theme Constants
 * 
 * Centralized theme-related constants used throughout the application.
 */

export type ThemeMode = "system" | "light" | "dark";
export type ThemeColor = "amber" | "mint" | "violet" | "ember" | "lagoon" | "rose" | "battleship" | "cyan" | "midnight" | "indigo" | "gold";

export const THEME_MODE_STORAGE_KEY = "retro-theme-mode";
export const THEME_COLOR_STORAGE_KEY = "retro-theme-color";
export const THEME_SHAPE_STORAGE_KEY = "retro-theme-shape";

export const THEME_COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  { value: "amber", label: "Sunburst" },
  { value: "mint", label: "Neon Grid" },
  { value: "violet", label: "Nebula" },
  { value: "ember", label: "Ember Glow" },
  { value: "lagoon", label: "Lagoon Tide" },
  { value: "rose", label: "Rose Quartz" },
  { value: "battleship", label: "Battleship" },
  { value: "cyan", label: "Electric Cyan" },
  { value: "midnight", label: "Midnight" },
  { value: "indigo", label: "Deep Indigo" },
  { value: "gold", label: "Metallic Gold" },
];

export const THEME_COLOR_PREVIEW: Record<ThemeColor, string> = {
  amber: "#ffdb33",
  mint: "#58f5c2",
  violet: "#c99cff",
  ember: "#ff6b3d",
  lagoon: "#3ad7ff",
  rose: "#ff7cc8",
  battleship: "#7a9fb8",
  cyan: "#00ffff",
  midnight: "#00d9ff",
  indigo: "#8b5cf6",
  gold: "#ffd700",
};

