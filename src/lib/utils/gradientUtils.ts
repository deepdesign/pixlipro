/**
 * Calculate gradient line coordinates based on angle and dimensions
 * 
 * @param angleDegrees - Angle in degrees (0-360)
 *   - 0° = horizontal left to right
 *   - 90° = vertical top to bottom
 *   - 180° = horizontal right to left
 *   - 270° = vertical bottom to top
 * @param width - Width of the area
 * @param height - Height of the area
 * @returns Object with x0, y0, x1, y1 coordinates for createLinearGradient
 */
export function calculateGradientLine(
  angleDegrees: number,
  width: number,
  height: number,
): { x0: number; y0: number; x1: number; y1: number } {
  // Normalize angle to 0-360
  const angle = ((angleDegrees % 360) + 360) % 360;
  
  // Convert to radians
  const angleRad = (angle * Math.PI) / 180;
  
  // Center point
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate the length needed to reach corners
  // Use diagonal length to ensure gradient covers entire area
  const diagonal = Math.sqrt(width * width + height * height);
  const halfLength = diagonal / 2;
  
  // Calculate start and end points
  // Start point: center offset backwards along the angle
  // End point: center offset forwards along the angle
  const x0 = centerX - Math.cos(angleRad) * halfLength;
  const y0 = centerY - Math.sin(angleRad) * halfLength;
  const x1 = centerX + Math.cos(angleRad) * halfLength;
  const y1 = centerY + Math.sin(angleRad) * halfLength;
  
  return { x0, y0, x1, y1 };
}

