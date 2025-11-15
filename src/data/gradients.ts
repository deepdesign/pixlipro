import { getAllPalettes, type Palette } from "./palettes";

export interface GradientPreset {
  id: string;
  name: string;
  colors: string[]; // 2-4 colors for gradient stops
}

/**
 * Convert hex to HSL
 */
function hexToHsl(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));

  const sat = s / 100;
  const light = l / 100;

  if (sat === 0) {
    const gray = Math.round(light * 255);
    return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  
  const hueToRgb = (p: number, q: number, t: number) => {
    let t2 = t;
    if (t2 < 0) t2 += 1;
    if (t2 > 1) t2 -= 1;
    if (t2 < 1 / 6) return p + (q - p) * 6 * t2;
    if (t2 < 1 / 2) return q;
    if (t2 < 2 / 3) return p + (q - p) * (2 / 3 - t2) * 6;
    return p;
  };

  const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, h / 360) * 255);
  const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Generate gradients for a palette based on each color
 * Each gradient is designed to visually match its base color while being creative
 */
function generatePaletteGradients(palette: Palette): GradientPreset[] {
  const gradients: GradientPreset[] = [];
  const numColors = palette.colors.length;

  for (let i = 0; i < numColors; i++) {
    const baseColor = palette.colors[i];
    const [baseH, baseS, baseL] = hexToHsl(baseColor);
    
    const gradientColors: string[] = [];
    
    // Strategy: Create a gradient that matches the base color but with creative variations
    // 1. Start with the base color (slightly lighter for better visibility)
    const startL = Math.min(100, baseL + 5);
    gradientColors.push(hslToHex(baseH, baseS, startL));
    
    // 2. Middle color: Shift hue slightly (15-25 degrees) and adjust lightness
    // For warm colors (reds, oranges, yellows), shift toward warmer
    // For cool colors (blues, cyans, purples), shift toward cooler
    const hueShift = baseH < 60 || baseH > 300 ? 20 : -20; // Warm colors shift warmer, cool shift cooler
    const middleH = (baseH + hueShift + 360) % 360;
    const middleL = Math.max(10, Math.min(90, baseL - 8)); // Slightly darker
    const middleS = Math.min(100, baseS + 5); // Slightly more saturated
    gradientColors.push(hslToHex(middleH, middleS, middleL));
    
    // 3. End color: Return closer to base hue but with different lightness
    const endH = (baseH + hueShift * 0.5 + 360) % 360; // Halfway back to base
    const endL = Math.max(5, Math.min(85, baseL - 15)); // Darker for depth
    const endS = Math.min(100, baseS + 3);
    gradientColors.push(hslToHex(endH, endS, endL));

    // Create gradient name based on palette name and color index
    const colorNames = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];
    const colorName = colorNames[i] || `${i + 1}`;
    
    gradients.push({
      id: `${palette.id}_${i}`,
      name: `${palette.name} - ${colorName}`,
      colors: gradientColors,
    });
  }

  return gradients;
}

/**
 * Generate all gradients from palettes (including custom palettes)
 */
function generateAllGradients(): GradientPreset[] {
  const allGradients: GradientPreset[] = [];
  
  // Use getAllPalettes() to include both built-in and custom palettes
  const allPalettes = getAllPalettes();
  
  for (const palette of allPalettes) {
    const paletteGradients = generatePaletteGradients(palette);
    allGradients.push(...paletteGradients);
  }
  
  return allGradients;
}

// Generate gradients at module load time (includes custom palettes from localStorage)
// Custom palettes added at runtime will have gradients generated on-the-fly via getGradientsForPalette()
export const gradientPresets: GradientPreset[] = generateAllGradients();

/**
 * Get a gradient preset by ID
 */
export function getGradient(id: string): GradientPreset | null {
  return gradientPresets.find((g) => g.id === id) ?? null;
}

/**
 * Get a random gradient preset
 */
export function getRandomGradient(): GradientPreset {
  return gradientPresets[Math.floor(Math.random() * gradientPresets.length)];
}

/**
 * Get gradients for a specific palette
 * Generates gradients on-the-fly for custom palettes if not already in the preset list
 */
export function getGradientsForPalette(paletteId: string): GradientPreset[] {
  // First, check if gradients already exist in presets
  const existingGradients = gradientPresets.filter((g) => g.id.startsWith(`${paletteId}_`));
  
  if (existingGradients.length > 0) {
    return existingGradients;
  }
  
  // If no gradients found, it might be a custom palette added at runtime
  // Generate gradients on-the-fly for this palette
  const allPalettes = getAllPalettes();
  const palette = allPalettes.find((p) => p.id === paletteId);
  
  if (palette) {
    return generatePaletteGradients(palette);
  }
  
  return [];
}
