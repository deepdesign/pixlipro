/**
 * Pixelation and color quantization effects
 * Creates retro 8-bit/16-bit aesthetic by reducing resolution and color depth
 */

/**
 * Apply pixelation effect by downscaling and upscaling canvas
 */
export const applyPixelation = (
  canvas: HTMLCanvasElement,
  blockSize: number,
  showGrid: boolean = false,
  gridBrightness: number = 100,
): HTMLCanvasElement => {
  if (blockSize <= 1) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;

  // Calculate downscaled dimensions
  const downscaledWidth = Math.max(1, Math.floor(width / blockSize));
  const downscaledHeight = Math.max(1, Math.floor(height / blockSize));

  // Create temporary canvas at reduced resolution
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = downscaledWidth;
  tempCanvas.height = downscaledHeight;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return canvas;

  // Disable image smoothing for crisp pixel blocks
  tempCtx.imageSmoothingEnabled = false;

  // Draw source canvas scaled down to temp canvas
  tempCtx.drawImage(canvas, 0, 0, downscaledWidth, downscaledHeight);

  // Disable image smoothing on main canvas
  ctx.imageSmoothingEnabled = false;

  // Clear main canvas
  ctx.clearRect(0, 0, width, height);

  // Draw temp canvas scaled up back to original size
  ctx.drawImage(tempCanvas, 0, 0, width, height);

  // Draw grid lines if enabled
  if (showGrid) {
    // Calculate actual block size based on how the downscaled canvas was scaled up
    // Each pixel in the downscaled canvas becomes a block of this size
    const actualBlockWidth = width / downscaledWidth;
    const actualBlockHeight = height / downscaledHeight;
    
    // Convert brightness (0-100) to grayscale value (0-255)
    const brightnessValue = Math.round((gridBrightness / 100) * 255);
    ctx.strokeStyle = `rgb(${brightnessValue}, ${brightnessValue}, ${brightnessValue})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Draw vertical lines at block boundaries
    for (let i = 0; i <= downscaledWidth; i++) {
      const x = i * actualBlockWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Draw horizontal lines at block boundaries
    for (let i = 0; i <= downscaledHeight; i++) {
      const y = i * actualBlockHeight;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  }

  // Re-enable image smoothing for future operations
  ctx.imageSmoothingEnabled = true;

  return canvas;
};

/**
 * Apply color quantization to reduce color depth
 */
export const applyColorQuantization = (
  canvas: HTMLCanvasElement,
  bits: number,
): HTMLCanvasElement => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate color levels based on bit depth
  let levels: number;
  if (bits === 4) {
    // 4-bit: 16 colors total (4 levels per channel)
    levels = 4;
  } else if (bits === 8) {
    // 8-bit: 256 colors (6 bits per channel = 64 levels, but we'll use simpler approach)
    // Use 6 levels per channel for classic 8-bit look (6^3 = 216 colors)
    levels = 6;
  } else if (bits === 16) {
    // 16-bit: 65536 colors (5-6-5 bit distribution)
    // Use 32 levels for red/blue, 64 for green
    levels = 32; // We'll use 32 for all channels for simplicity
  } else {
    // 24-bit: no quantization
    return canvas;
  }

  // Calculate step size for quantization
  const step = 255 / (levels - 1);

  // Quantize each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Quantize RGB channels
    data[i] = Math.round(data[i] / step) * step; // R
    data[i + 1] = Math.round(data[i + 1] / step) * step; // G
    data[i + 2] = Math.round(data[i + 2] / step) * step; // B
    // Alpha channel remains unchanged
  }

  // Put quantized image data back to canvas
  ctx.putImageData(imageData, 0, 0);

  return canvas;
};

/**
 * Apply both pixelation and color quantization effects
 */
export const applyPixelationEffects = (
  canvas: HTMLCanvasElement,
  pixelationSize: number,
  pixelationGridEnabled: boolean,
  pixelationGridBrightness: number,
  colorQuantizationBits: number | null,
): HTMLCanvasElement => {
  // Apply pixelation first (if enabled)
  if (pixelationSize > 1) {
    applyPixelation(canvas, pixelationSize, pixelationGridEnabled, pixelationGridBrightness);
  }

  // Apply color quantization (if enabled)
  if (colorQuantizationBits !== null && colorQuantizationBits < 24) {
    applyColorQuantization(canvas, colorQuantizationBits);
  }

  return canvas;
};

