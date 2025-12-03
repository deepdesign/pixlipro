export interface Palette {
  id: string;
  name: string;
  colors: string[];
  category?: string; // Optional category for organization
}

export const palettes: Palette[] = [
  // Neon/Cyber
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
    category: "Neon/Cyber",
  },
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
    category: "Neon/Cyber",
  },
  {
    id: "cyber",
    name: "Cyber Matrix",
    colors: ["#00ff41", "#00d4ff", "#ff00ff", "#ffaa00", "#ffffff"],
    category: "Neon/Cyber",
  },
  {
    id: "electric",
    name: "Thunder Bolt",
    colors: ["#00f5ff", "#0099ff", "#0066ff", "#7b2cbf", "#e0aaff"],
    category: "Neon/Cyber",
  },
  // Warm/Fire
  {
    id: "sunset",
    name: "Sunset Drive",
    colors: ["#ff7b00", "#ff5400", "#ff0054", "#ad00ff", "#6300ff"],
    category: "Warm/Fire",
  },
  {
    id: "ember",
    name: "Ember Glow",
    colors: ["#8b0000", "#b22222", "#cd5c5c", "#ff6347", "#ffa07a"],
    category: "Warm/Fire",
  },
  {
    id: "lava",
    name: "Molten Core",
    colors: ["#ff0000", "#ff4500", "#ff8c00", "#ffd700", "#ffff00"],
    category: "Warm/Fire",
  },
  {
    id: "sweetheart",
    name: "Sweetheart",
    colors: ["#dc143c", "#ff1493", "#ff69b4", "#ffb6c1", "#ffc0cb"],
    category: "Warm/Fire",
  },
  // Cool/Ocean
  {
    id: "oceanic",
    name: "Oceanic Pulse",
    colors: ["#031a6b", "#033860", "#087ca7", "#3fd7f2", "#9ef6ff"],
    category: "Cool/Ocean",
  },
  {
    id: "aurora",
    name: "Aurora Glass",
    colors: ["#00c6ff", "#0072ff", "#7b42f6", "#b01eff", "#f441a5"],
    category: "Cool/Ocean",
  },
  {
    id: "synth",
    name: "Synthwave",
    colors: ["#ff4ecd", "#ff9f1c", "#2ec4b6", "#cbf3f0", "#011627"],
    category: "Cool/Ocean",
  },
  {
    id: "winter-frost",
    name: "Winter Frost",
    colors: ["#ffffff", "#e6f3ff", "#b0d4e6", "#87ceeb", "#c0d5e0"],
    category: "Cool/Ocean",
  },
  // Nature
  {
    id: "flora",
    name: "Flora Bloom",
    colors: ["#ffafbd", "#ffc3a0", "#ffdfd3", "#d0ffb7", "#86fde8"],
    category: "Nature",
  },
  {
    id: "forest",
    name: "Emerald Grove",
    colors: ["#2d5016", "#3d7c2f", "#5cb85c", "#90ee90", "#c8e6c9"],
    category: "Nature",
  },
  // Soft/Pastel
  {
    id: "pastel",
    name: "Soft Pastel",
    colors: ["#f7c5cc", "#ffdee8", "#c4f3ff", "#d9f0ff", "#fdf5d7"],
    category: "Soft/Pastel",
  },
  {
    id: "candy",
    name: "Sweet Dreams",
    colors: ["#ff6b9d", "#c44569", "#f8b500", "#ffc93c", "#ff9ff3"],
    category: "Soft/Pastel",
  },
  // Dark/Mysterious
  {
    id: "void",
    name: "Midnight Void",
    colors: ["#0f0f1c", "#1f1147", "#371a79", "#5d2e9a", "#8c44ff"],
    category: "Dark/Mysterious",
  },
];

export const defaultPaletteId = "neon";

// Import directly from the file (not barrel) to avoid circular dependency issues
// The barrel export might cause issues, so we import the function directly
import { getAllCustomPalettes } from "@/lib/storage/customPaletteStorage";

const getCustomPalettes = (): Palette[] => {
  if (typeof window === "undefined") {
    return [];
  }
  
  try {
    return getAllCustomPalettes();
  } catch {
    return [];
  }
};

export const getPalette = (id: string) => {
  // Handle removed slate palettes - fallback to default
  if (id === "slate" || id === "slate-bg" || id === "slate-light" || id === "slate-bg-light") {
    return palettes.find((p) => p.id === defaultPaletteId) || palettes[0];
  }
  
  // Check built-in palettes first
  const builtIn = palettes.find((palette) => palette.id === id);
  if (builtIn) {
    return builtIn;
  }
  
  // Check custom palettes if not found in built-in
  const customPalettes = getCustomPalettes();
  const custom = customPalettes.find((p) => p.id === id);
  if (custom) {
    return custom;
  }
  
  return palettes[0];
};

export const getAllPalettes = (): Palette[] => {
  const allPalettes = [...palettes];
  
  // Add custom palettes
  const customPalettes = getCustomPalettes();
  allPalettes.push(...customPalettes);
  
  return allPalettes;
};

export const getRandomPalette = () => {
  const allPalettes = getAllPalettes();
  return allPalettes[Math.floor(Math.random() * allPalettes.length)];
};
