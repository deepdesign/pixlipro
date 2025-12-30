/**
 * Halftone effect utilities
 * Converts images to halftone dots (like newspaper printing)
 */

/**
 * Apply halftone effect to canvas
 */
export const applyHalftone = (
  canvas: HTMLCanvasElement,
  dotSize: number, // 1-20 pixels
  spacing: number, // 2-50 pixels
  angle: number, // 0-360 degrees
  shape: "circle" | "square" | "diamond",
): HTMLCanvasElement => {
  if (dotSize <= 0 || spacing <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert angle to radians
  const angleRad = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Create output canvas
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) return canvas;

  // Fill with white background (will show through between dots)
  outputCtx.fillStyle = "#ffffff";
  outputCtx.fillRect(0, 0, width, height);

  // Calculate grid spacing
  const gridSpacing = spacing;

  // Process in grid pattern
  for (let gy = -gridSpacing; gy < height + gridSpacing; gy += gridSpacing) {
    for (let gx = -gridSpacing; gx < width + gridSpacing; gx += gridSpacing) {
      // Sample color at grid point (before rotation)
      const x = Math.round(gx);
      const y = Math.round(gy);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Calculate brightness (luminance) for dot size
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const normalizedBrightness = brightness / 255;

        // Invert brightness for halftone (darker = larger dots)
        const dotScale = 1 - normalizedBrightness;

        // Calculate dot radius based on brightness
        const dotRadius = (dotSize / 2) * dotScale;

        if (dotRadius > 0.1) {
          // Draw dot at grid position, using original color
          outputCtx.save();
          outputCtx.translate(x, y);
          outputCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

          if (shape === "circle") {
            // Circle doesn't need rotation
            outputCtx.beginPath();
            outputCtx.arc(0, 0, dotRadius, 0, Math.PI * 2);
            outputCtx.fill();
          } else if (shape === "square") {
            // Square: axis-aligned (not rotated)
            outputCtx.fillRect(-dotRadius, -dotRadius, dotRadius * 2, dotRadius * 2);
          } else if (shape === "diamond") {
            // Diamond: rotated 45° from square (not by angle parameter)
            outputCtx.rotate(Math.PI / 4); // 45 degrees
            outputCtx.fillRect(-dotRadius, -dotRadius, dotRadius * 2, dotRadius * 2);
          }

          outputCtx.restore();
        }
      }
    }
  }

  // Draw output back to original canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(outputCanvas, 0, 0);

  return canvas;
};

