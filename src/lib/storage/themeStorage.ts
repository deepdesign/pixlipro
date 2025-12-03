/**
 * Theme Storage Utilities
 * 
 * Handles persistence of custom themes in localStorage.
 */

export interface CustomTheme {
  id: string;
  name: string;
  primaryColor: "slate" | "gray" | "zinc" | "neutral";
  accentColor: "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose";
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

const THEMES_STORAGE_KEY = "pixli-custom-themes";
const ACTIVE_THEME_KEY = "pixli-active-theme-id";
export const DEFAULT_THEME_ID = "default-slate-teal";

/**
 * Get all themes from storage
 */
export function getAllThemes(): CustomTheme[] {
  try {
    const stored = localStorage.getItem(THEMES_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading themes:", error);
    return [];
  }
}

/**
 * Get a specific theme by ID
 */
export function getTheme(id: string): CustomTheme | null {
  const themes = getAllThemes();
  return themes.find((theme) => theme.id === id) || null;
}

/**
 * Save a new theme
 */
export function saveTheme(theme: Omit<CustomTheme, "id" | "createdAt" | "updatedAt">): CustomTheme {
  const themes = getAllThemes();
  const now = Date.now();
  const newTheme: CustomTheme = {
    ...theme,
    id: `theme-${now}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  themes.push(newTheme);
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  return newTheme;
}

/**
 * Update an existing theme
 */
export function updateTheme(id: string, updates: Partial<Omit<CustomTheme, "id" | "isDefault" | "createdAt">>): CustomTheme | null {
  const themes = getAllThemes();
  const index = themes.findIndex((theme) => theme.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Prevent updating default theme properties
  if (themes[index].isDefault) {
    // Only allow updating name for default theme
    if (Object.keys(updates).some(key => key !== "name" && key !== "updatedAt")) {
      console.warn("Cannot update non-name properties of default theme");
      return null;
    }
  }
  
  const updatedTheme: CustomTheme = {
    ...themes[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  themes[index] = updatedTheme;
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  return updatedTheme;
}

/**
 * Delete a theme
 */
export function deleteTheme(id: string): boolean {
  const themes = getAllThemes();
  const theme = themes.find((t) => t.id === id);
  
  if (!theme) {
    return false;
  }
  
  // Prevent deleting default theme
  if (theme.isDefault) {
    console.warn("Cannot delete default theme");
    return false;
  }
  
  const filtered = themes.filter((t) => t.id !== id);
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get the active theme ID
 */
export function getActiveThemeId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_THEME_KEY);
    return stored || DEFAULT_THEME_ID;
  } catch (error) {
    console.error("Error loading active theme ID:", error);
    return DEFAULT_THEME_ID;
  }
}

/**
 * Set the active theme ID
 */
export function setActiveThemeId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_THEME_KEY, id);
  } catch (error) {
    console.error("Error saving active theme ID:", error);
  }
}

/**
 * Get the active theme
 */
export function getActiveTheme(): CustomTheme | null {
  const activeId = getActiveThemeId();
  return getTheme(activeId);
}

/**
 * Initialize default theme if it doesn't exist
 */
export function initializeDefaultTheme(): void {
  const themes = getAllThemes();
  const defaultTheme = themes.find((t) => t.id === DEFAULT_THEME_ID);
  
  if (!defaultTheme) {
    const now = Date.now();
    const newDefaultTheme: CustomTheme = {
      id: DEFAULT_THEME_ID,
      name: "Slate + Teal",
      primaryColor: "slate",
      accentColor: "teal",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
    themes.push(newDefaultTheme);
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  }
}

