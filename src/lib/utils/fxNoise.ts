/**
 * Noise and dither overlay effects
 * Generates procedural noise patterns for retro aesthetic
 */

/**
 * Generate grain noise pattern
 */
export const generateGrain = (
  width: number,
  height: number,
  strength: number, // 0-100
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(width, height);
  }

  const strengthFactor = strength / 100;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * strengthFactor * 255;
    const value = 128 + noise;
    data[i] = value; // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    data[i + 3] = Math.floor(strengthFactor * 255); // A
  }

  return imageData;
};

/**
 * Generate CRT-style noise pattern (animated)
 */
export const generateCrtNoise = (
  width: number,
  height: number,
  strength: number, // 0-100
  time: number, // Animation time
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(width, height);
  }

  const strengthFactor = strength / 100;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Simple noise function using time-based seed
  const seed = Math.floor(time * 10) % 1000;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Use position and time to create animated noise
      const noiseValue = ((x + y + seed) % 3) - 1; // -1, 0, or 1
      const value = 128 + noiseValue * strengthFactor * 127;
      data[idx] = value; // R
      data[idx + 1] = value; // G
      data[idx + 2] = value; // B
      data[idx + 3] = Math.floor(strengthFactor * 180); // A
    }
  }

  return imageData;
};

/**
 * Generate Bayer dithering pattern
 */
export const generateBayerDither = (
  width: number,
  height: number,
  strength: number, // 0-100
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(width, height);
  }

  const strengthFactor = strength / 100;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // 4x4 Bayer matrix
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const bayerValue = bayerMatrix[y % 4][x % 4];
      const threshold = (bayerValue / 16) * strengthFactor;
      const value = threshold > Math.random() ? 255 : 0;
      data[idx] = value; // R
      data[idx + 1] = value; // G
      data[idx + 2] = value; // B
      data[idx + 3] = Math.floor(strengthFactor * 200); // A
    }
  }

  return imageData;
};

/**
 * Generate static noise pattern (TV static)
 */
export const generateStaticNoise = (
  width: number,
  height: number,
  strength: number, // 0-100
  _time: number, // Animation time (for animated static)
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(width, height);
  }

  const strengthFactor = strength / 100;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Create high-contrast random noise
    const noise = Math.random() > 0.5 ? 255 : 0;
    const alpha = Math.random() * strengthFactor * 255;
    data[i] = noise; // R
    data[i + 1] = noise; // G
    data[i + 2] = noise; // B
    data[i + 3] = Math.floor(alpha); // A
  }

  return imageData;
};

/**
 * Generate TV scanlines pattern
 */
export const generateScanlines = (
  width: number,
  height: number,
  strength: number, // 0-100
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(width, height);
  }

  const strengthFactor = strength / 100;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  // Scanline spacing (every 2 pixels for classic CRT look)
  const scanlineHeight = 2;
  // Double the maximum strength (was 180, now 360, clamped to 255 for alpha channel)
  const scanlineAlpha = Math.min(255, Math.floor(strengthFactor * 360));

  for (let y = 0; y < height; y++) {
    const isScanline = y % scanlineHeight === 0;
    const alpha = isScanline ? scanlineAlpha : 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Dark scanlines (black with opacity)
      data[idx] = 0; // R
      data[idx + 1] = 0; // G
      data[idx + 2] = 0; // B
      data[idx + 3] = alpha; // A
    }
  }

  return imageData;
};

/**
 * Apply noise overlay to canvas
 */
export const applyNoiseOverlay = (
  canvas: HTMLCanvasElement,
  noiseType: "grain" | "crt" | "bayer" | "static" | "scanlines",
  strength: number,
  animated: boolean,
  time: number,
): HTMLCanvasElement => {
  if (strength <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  let noiseData: ImageData;
  
  switch (noiseType) {
    case "grain":
      noiseData = generateGrain(canvas.width, canvas.height, strength);
      break;
    case "crt":
      noiseData = generateCrtNoise(
        canvas.width,
        canvas.height,
        strength,
        animated ? time : 0,
      );
      break;
    case "bayer":
      noiseData = generateBayerDither(canvas.width, canvas.height, strength);
      break;
    case "static":
      noiseData = generateStaticNoise(
        canvas.width,
        canvas.height,
        strength,
        animated ? time : 0,
      );
      break;
    case "scanlines":
      noiseData = generateScanlines(canvas.width, canvas.height, strength);
      break;
    default:
      return canvas;
  }

  // Create temporary canvas for noise
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = canvas.width;
  noiseCanvas.height = canvas.height;
  const noiseCtx = noiseCanvas.getContext("2d");
  if (!noiseCtx) return canvas;

  noiseCtx.putImageData(noiseData, 0, 0);

  // Composite noise over canvas using overlay blend mode
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(noiseCanvas, 0, 0);
  ctx.restore();

  return canvas;
};

