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
 * Apply noise overlay to canvas
 */
export const applyNoiseOverlay = (
  canvas: HTMLCanvasElement,
  noiseType: "grain" | "crt" | "bayer",
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

