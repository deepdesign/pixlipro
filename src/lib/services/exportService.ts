import p5 from "p5";

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
  config: ExportConfig
): Promise<string> {
  const { width, height, format, quality = 0.92, scale = 1 } = config;
  
  // Get the current canvas (p5.js stores it as a property, but TypeScript types don't include it)
  const currentCanvas = (p5Instance as any).canvas as HTMLCanvasElement | null;
  if (!currentCanvas) {
    throw new Error("Canvas not found");
  }

  const currentWidth = currentCanvas.width;
  const currentHeight = currentCanvas.height;
  
  // Calculate target dimensions with scale factor
  const targetWidth = width * scale;
  const targetHeight = height * scale;
  
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
    throw new Error("Could not create offscreen canvas context");
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
  return ((p5Instance as any).canvas as HTMLCanvasElement) || null;
}

