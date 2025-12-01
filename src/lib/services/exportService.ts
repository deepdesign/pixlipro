import p5 from "p5";
import { hasCanvas } from "@/types/p5-extensions";
import { getPalette } from "@/data/palettes";
import type { GeneratorState } from "@/generator";

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** Output width in pixels */
  width: number;
  /** Output height in pixels */
  height: number;
  /** Export format */
  format: "png" | "jpeg" | "webp";
  /** Quality for JPEG/WebP (0.1 - 1.0) */
  quality?: number;
  /** Scale factor for high-resolution export (e.g., 2 for 2x resolution) */
  scale?: number;
}

/**
 * Export options for the export modal
 */
export interface ExportOptions {
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp";
  quality?: number;
}

/**
 * Captures the current p5.js canvas and exports it at the specified resolution.
 * 
 * For high-resolution exports, this function:
 * 1. Creates a temporary offscreen canvas at the target resolution
 * 2. Renders the current frame to the offscreen canvas
 * 3. Exports the image
 * 4. Cleans up the temporary canvas
 * 
 * This approach ensures crisp, anti-aliased exports even at very high resolutions.
 * 
 * @param p5Instance - The p5.js instance containing the canvas to export
 * @param config - Export configuration (dimensions, format, quality)
 * @returns Promise that resolves with the exported image data URL
 */
export async function exportCanvas(
  p5Instance: p5,
  config: ExportConfig,
  paletteId?: string
): Promise<string> {
  const { width, height, format, quality = 0.92, scale = 1 } = config;
  
  // Validate input parameters
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid export dimensions: ${width}x${height}`);
  }
  if (!isFinite(scale) || scale <= 0 || scale > 10) {
    throw new Error(`Invalid scale factor: ${scale} (must be between 0 and 10)`);
  }
  if (quality < 0.1 || quality > 1.0) {
    throw new Error(`Invalid quality: ${quality} (must be between 0.1 and 1.0)`);
  }
  
  // Get the current canvas (p5.js stores it as a property, but TypeScript types don't include it)
  const currentCanvas = hasCanvas(p5Instance) ? p5Instance.canvas : null;
  if (!currentCanvas) {
    throw new Error("Canvas not found. Make sure the canvas is initialized.");
  }

  const currentWidth = currentCanvas.width;
  const currentHeight = currentCanvas.height;
  
  // Validate source canvas dimensions
  if (!currentWidth || !currentHeight || currentWidth <= 0 || currentHeight <= 0) {
    throw new Error(`Invalid source canvas dimensions: ${currentWidth}x${currentHeight}`);
  }
  
  // Calculate target dimensions with scale factor
  const targetWidth = Math.floor(width * scale);
  const targetHeight = Math.floor(height * scale);
  
  // Validate target dimensions
  if (targetWidth <= 0 || targetHeight <= 0 || !isFinite(targetWidth) || !isFinite(targetHeight)) {
    throw new Error(`Invalid target dimensions: ${targetWidth}x${targetHeight}`);
  }
  
  // Create a temporary offscreen canvas for high-res rendering
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = targetWidth;
  offscreenCanvas.height = targetHeight;
  const offscreenCtx = offscreenCanvas.getContext("2d", {
    alpha: format === "png", // Only use alpha channel for PNG
    desynchronized: false, // Ensure quality
    willReadFrequently: false,
  });
  
  if (!offscreenCtx) {
    throw new Error("Could not create offscreen canvas context. Your browser may not support canvas operations.");
  }

  // Enable high-quality rendering
  offscreenCtx.imageSmoothingEnabled = true;
  offscreenCtx.imageSmoothingQuality = "high";

  // For high-resolution exports, we scale up the source canvas
  // The browser's high-quality image smoothing will interpolate pixels
  // to create a smooth, anti-aliased result
  offscreenCtx.drawImage(
    currentCanvas,
    0,
    0,
    currentWidth,
    currentHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Add Pixli logo to the exported image (will use default palette if none provided)
  await addLogoToCanvas(offscreenCtx, targetWidth, targetHeight, offscreenCanvas, paletteId);

  // Convert to the requested format
  const mimeType = format === "png" 
    ? "image/png" 
    : format === "jpeg" 
    ? "image/jpeg" 
    : "image/webp";

  return new Promise((resolve, reject) => {
    try {
      offscreenCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error("Failed to read image blob"));
          };
          reader.readAsDataURL(blob);
        },
        mimeType,
        format !== "png" ? quality : undefined
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a filename based on generator state
 * Format: sprite-palette-motion-[dimensions].png
 * Keeps names concise and filesystem-safe
 * 
 * @param state - Generator state with sprite, palette, and motion settings
 * @param width - Export width (optional, for dimensions in filename)
 * @param height - Export height (optional, for dimensions in filename)
 * @returns A sanitized filename string
 */
export function generateExportFilename(
  state: GeneratorState | null,
  width?: number,
  height?: number
): string {
  if (!state) {
    // Fallback to simple name if no state
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    if (width && height) {
      return `pixli-${width}x${height}-${timestamp}.png`;
    }
    return `pixli-${timestamp}.png`;
  }

  // Get sprite name (use value directly, it's already short)
  const sprite = state.spriteMode || "unknown";
  
  // Get palette name and sanitize it
  const palette = getPalette(state.paletteId);
  const paletteName = palette.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  
  // Get movement mode (use value directly, it's already short)
  const motion = state.movementMode || "unknown";
  
  // Build filename parts
  const parts = [sprite, paletteName, motion];
  
  // Add dimensions if provided
  if (width && height) {
    parts.push(`${width}x${height}`);
  }
  
  // Join and ensure it's not too long (max ~60 chars before extension)
  let filename = parts.join("-");
  if (filename.length > 60) {
    // If too long, truncate palette name (it's usually the longest)
    const maxPaletteLength = 60 - (sprite.length + motion.length + (width && height ? 15 : 0) + 5); // 5 for separators
    if (paletteName.length > maxPaletteLength) {
      const truncatedPalette = paletteName.substring(0, maxPaletteLength - 3) + "...";
      filename = [sprite, truncatedPalette, motion, width && height ? `${width}x${height}` : ""]
        .filter(Boolean)
        .join("-");
    }
  }
  
  // Add timestamp for uniqueness (short format: YYYYMMDD-HHMM)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -8).replace("T", "-");
  filename = `${filename}-${timestamp}.png`;
  
  return filename;
}

/**
 * Downloads an image data URL as a file
 * 
 * @param dataUrl - The image data URL
 * @param filename - The filename for the download
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a thumbnail from a canvas
 * 
 * @param canvas - The source canvas
 * @param size - Thumbnail size (width and height)
 * @returns Data URL of the thumbnail
 */
export function createThumbnail(
  canvas: HTMLCanvasElement,
  size: number = 160
): string {
  const thumbnailCanvas = document.createElement("canvas");
  thumbnailCanvas.width = size;
  thumbnailCanvas.height = size;
  const ctx = thumbnailCanvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Could not create thumbnail canvas context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, size, size);
  
  return thumbnailCanvas.toDataURL("image/png");
}

/**
 * Gets the current canvas from a p5 instance
 * 
 * @param p5Instance - The p5.js instance
 * @returns The HTML canvas element, or null if not found
 */
export function getCanvasFromP5(p5Instance: p5): HTMLCanvasElement | null {
  return hasCanvas(p5Instance) ? p5Instance.canvas : null;
}

/**
 * Loads the Pixli logo image
 * @returns Promise that resolves with the loaded Image
 */
async function loadLogoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load logo image"));
    img.src = "/logo/SVG/pixli-logo-white.svg";
  });
}

/**
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculates relative luminance according to WCAG
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Samples the average color from a region of the canvas
 */
function sampleCanvasColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Finds the best color from a palette that has good contrast against a background
 */
function findBestContrastColor(
  paletteColors: string[],
  backgroundColor: string
): string {
  let bestColor = paletteColors[0] || "#ffffff";
  let bestContrast = 0;

  for (const color of paletteColors) {
    const contrast = getContrastRatio(color, backgroundColor);
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestColor = color;
    }
  }

  // If no color has good contrast (>= 3.0), prefer lighter colors for dark backgrounds
  // or darker colors for light backgrounds
  if (bestContrast < 3.0) {
    const bgRgb = hexToRgb(backgroundColor);
    if (bgRgb) {
      const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      // If background is dark, prefer lighter colors; if light, prefer darker
      const sortedColors = [...paletteColors].sort((a, b) => {
        const rgbA = hexToRgb(a);
        const rgbB = hexToRgb(b);
        if (!rgbA || !rgbB) return 0;
        const lumA = getRelativeLuminance(rgbA.r, rgbA.g, rgbA.b);
        const lumB = getRelativeLuminance(rgbB.r, rgbB.g, rgbB.b);
        return bgLum < 0.5 ? lumB - lumA : lumA - lumB; // Dark bg: prefer lighter; Light bg: prefer darker
      });
      bestColor = sortedColors[0] || bestColor;
    }
  }

  return bestColor;
}

/**
 * Adds the Pixli logo to a canvas at the bottom right corner
 * Logo size is proportional to canvas size (60px at 960x960)
 * Uses a color from the palette with good contrast against the background
 * 
 * @param ctx - The canvas 2D context
 * @param canvasWidth - The canvas width
 * @param canvasHeight - The canvas height
 * @param canvas - The canvas element (for sampling background color)
 * @param paletteId - Optional palette ID to use for logo color
 */
export async function addLogoToCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  _canvas: HTMLCanvasElement,
  paletteId?: string
): Promise<void> {
  try {
    const logoImg = await loadLogoImage();
    
    // Calculate logo size: at 960x960, logo should be 54px (10% smaller than footer's 60px)
    // Use the smaller dimension to maintain proportions
    const baseSize = 960;
    const logoWidth = (Math.min(canvasWidth, canvasHeight) / baseSize) * 54;
    const logoAspectRatio = 202.39 / 126.66; // From SVG viewBox
    const logoHeight = logoWidth / logoAspectRatio;
    
    // Position at bottom left with padding (2% of canvas size, minimum 8px)
    const padding = Math.max(8, Math.min(canvasWidth, canvasHeight) * 0.02);
    const logoX = padding;
    const logoY = canvasHeight - logoHeight - padding;
    
    // Sample background color from the area where logo will be placed
    const sampleSize = Math.max(20, Math.min(logoWidth, logoHeight) * 0.5);
    const sampleX = Math.max(0, logoX - sampleSize);
    const sampleY = Math.max(0, logoY - sampleSize);
    const sampleW = Math.min(sampleSize, canvasWidth - sampleX);
    const sampleH = Math.min(sampleSize, canvasHeight - sampleY);
    
    const backgroundColor = sampleCanvasColor(ctx, sampleX, sampleY, sampleW, sampleH);
    
    // Get palette colors (use provided paletteId or default)
    const palette = getPalette(paletteId || "neon");
    const paletteColors = palette.colors;
    
    // Find the best color from palette with good contrast
    const logoColor = findBestContrastColor(paletteColors, backgroundColor);
    
    // Create a temporary canvas for the logo to apply color without affecting main canvas
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = logoWidth;
    logoCanvas.height = logoHeight;
    const logoCtx = logoCanvas.getContext("2d");
    
    if (!logoCtx) {
      throw new Error("Failed to create logo canvas context");
    }
    
    // Draw the logo on the temporary canvas
    logoCtx.drawImage(logoImg, 0, 0, logoWidth, logoHeight);
    
    // Apply the color using source-in compositing (only affects the logo canvas)
    logoCtx.globalCompositeOperation = "source-in";
    logoCtx.fillStyle = logoColor;
    logoCtx.fillRect(0, 0, logoWidth, logoHeight);
    
    // Draw the colored logo onto the main canvas (bottom left)
    ctx.drawImage(logoCanvas, logoX, logoY);
    
    // Add "made with pixli.art" text on the right side, aligned with logo
    const text = "MADE WITH PIXLI.ART";
    const fontSize = Math.max(8, logoHeight * 0.3); // Proportional to logo height, smaller
    
    // Measure text width to ensure proper spacing
    ctx.save();
    ctx.font = `${fontSize}px "Space Grotesk", system-ui, sans-serif`;
    ctx.letterSpacing = `${fontSize * 0.18}px`;
    ctx.measureText(text);
    ctx.restore();
    
    const textX = canvasWidth - padding; // Right side with padding
    const textY = canvasHeight - padding; // Bottom right corner, aligned to bottom
    
    // Sample background color from the area where text will be placed
    const textSampleSize = Math.max(20, fontSize * 2);
    const textSampleX = Math.max(0, textX - textSampleSize * 2);
    const textSampleY = Math.max(0, textY - textSampleSize / 2);
    const textSampleW = Math.min(textSampleSize * 2, canvasWidth - textSampleX);
    const textSampleH = Math.min(textSampleSize, canvasHeight - textSampleY);
    
    const textBackgroundColor = sampleCanvasColor(ctx, textSampleX, textSampleY, textSampleW, textSampleH);
    const textColor = findBestContrastColor(paletteColors, textBackgroundColor);
    
    // Set up text styling to match UI labels
    ctx.save();
    ctx.font = `${fontSize}px "Space Grotesk", system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom"; // Align to bottom for bottom right corner
    ctx.fillStyle = textColor;
    ctx.letterSpacing = `${fontSize * 0.18}px`; // 0.18em letter spacing
    
    // Draw the text
    ctx.fillText(text, textX, textY);
    ctx.restore();
  } catch (error) {
    // Silently fail if logo can't be loaded - don't break exports
    console.warn("Failed to add logo to export:", error);
  }
}

