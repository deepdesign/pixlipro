import { getAllPalettes } from "@/data/palettes";

/**
 * Generate palette options for UI selectors
 * 
 * Groups palettes by category and includes color previews.
 * Used in both sprite palette and canvas palette selectors.
 */
export function generatePaletteOptions() {
  const categoryOrder = [
    "Neon/Cyber",
    "Warm/Fire",
    "Cool/Ocean",
    "Nature",
    "Soft/Pastel",
    "Dark/Mysterious",
    "Black & White",
    "Custom",
  ];

  // Get all palettes (built-in + custom)
  const allPalettes = getAllPalettes();

  // Filter out internal palettes that shouldn't be user-selectable
  // These are used internally for animation thumbnails
  const userPalettes = allPalettes.filter(
    (palette) => palette.id !== "slate" && palette.id !== "slate-bg" && 
                 palette.id !== "slate-light" && palette.id !== "slate-bg-light"
  );

  // Group palettes by category
  const byCategory = new Map<string, typeof userPalettes>();
  for (const palette of userPalettes) {
    const category = palette.category || "Other";
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(palette);
  }

  // Sort within each category alphabetically by name
  for (const palettes of byCategory.values()) {
    palettes.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Create grouped structure with category labels
  const result: Array<{
    value: string;
    label: string;
    category?: string;
    colors?: string[];
  }> = [];

  for (const category of categoryOrder) {
    const categoryPalettes = byCategory.get(category);
    if (categoryPalettes) {
      for (const palette of categoryPalettes) {
        result.push({
          value: palette.id,
          label: palette.name,
          category: category,
          colors: palette.colors,
        });
      }
    }
  }

  // Add any remaining uncategorized palettes
  for (const [category, palettes] of byCategory.entries()) {
    if (!categoryOrder.includes(category)) {
      for (const palette of palettes) {
        result.push({
          value: palette.id,
          label: palette.name,
          category: category,
          colors: palette.colors,
        });
      }
    }
  }

  return result;
}

