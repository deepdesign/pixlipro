import type { Palette } from "@/data/palettes";

export interface CustomPalette extends Palette {
  imageUrl?: string; // Optional URL if created from image URL
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "bitlab-custom-palettes";
const MAX_CUSTOM_PALETTES = 10;

export const getAllCustomPalettes = (): CustomPalette[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as CustomPalette[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCustomPalette = (
  name: string,
  colors: string[],
  imageUrl?: string,
): CustomPalette => {
  const customPalettes = getAllCustomPalettes();
  
  if (customPalettes.length >= MAX_CUSTOM_PALETTES) {
    throw new Error(`Maximum of ${MAX_CUSTOM_PALETTES} custom palettes allowed`);
  }

  const now = Date.now();
  const palette: CustomPalette = {
    id: `custom-${now}-${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim() || `Custom Palette ${customPalettes.length + 1}`,
    colors,
    category: "Custom",
    imageUrl,
    createdAt: now,
    updatedAt: now,
  };

  customPalettes.push(palette);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customPalettes));
  } catch (error) {
    console.error("Failed to save custom palette:", error);
    throw new Error("Failed to save custom palette. Storage may be full.");
  }

  return palette;
};

export const updateCustomPalette = (
  id: string,
  name?: string,
  colors?: string[],
): CustomPalette | null => {
  const customPalettes = getAllCustomPalettes();
  const index = customPalettes.findIndex((p) => p.id === id);
  if (index === -1) {
    return null;
  }

  const palette = customPalettes[index];
  if (name !== undefined) {
    palette.name = name.trim() || palette.name;
  }
  if (colors !== undefined) {
    palette.colors = colors;
  }
  palette.updatedAt = Date.now();

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customPalettes));
  } catch (error) {
    console.error("Failed to update custom palette:", error);
    throw new Error("Failed to update custom palette. Storage may be full.");
  }

  return palette;
};

export const deleteCustomPalette = (id: string): boolean => {
  const customPalettes = getAllCustomPalettes();
  const filtered = customPalettes.filter((p) => p.id !== id);
  if (filtered.length === customPalettes.length) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete custom palette:", error);
    return false;
  }
};

// Export/Import functions for sharing palettes
export interface PaletteExport {
  name: string;
  colors: string[];
}

export const exportPaletteAsJSON = (palette: CustomPalette): string => {
  const exportData: PaletteExport = {
    name: palette.name,
    colors: palette.colors,
  };
  return JSON.stringify(exportData, null, 2);
};

export const importPaletteFromJSON = (json: string): {
  success: boolean;
  palette?: CustomPalette;
  error?: string;
} => {
  try {
    const parsed = JSON.parse(json) as PaletteExport;

    // Validate format
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid JSON format" };
    }

    if (!parsed.name || typeof parsed.name !== "string" || !parsed.name.trim()) {
      return { success: false, error: "Palette name is required" };
    }

    if (!Array.isArray(parsed.colors) || parsed.colors.length === 0) {
      return { success: false, error: "Palette must have at least one color" };
    }

    // Validate colors are hex strings
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    for (const color of parsed.colors) {
      if (typeof color !== "string" || !colorRegex.test(color)) {
        return { success: false, error: `Invalid color format: ${color}. Colors must be hex strings (e.g., #FF0000)` };
      }
    }

    // Check if we're at max capacity
    const existingPalettes = getAllCustomPalettes();
    if (existingPalettes.length >= MAX_CUSTOM_PALETTES) {
      return { success: false, error: `Maximum of ${MAX_CUSTOM_PALETTES} custom palettes allowed. Please delete one first.` };
    }

    // Create and save the palette
    const palette = saveCustomPalette(parsed.name.trim(), parsed.colors);
    return { success: true, palette };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
};

export const getMaxCustomPalettes = () => MAX_CUSTOM_PALETTES;

