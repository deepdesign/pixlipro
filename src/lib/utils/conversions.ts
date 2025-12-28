/**
 * Conversion Utilities
 * 
 * Functions to convert between internal values and UI slider values (0-100)
 */

const TILE_DENSITY_MIN = 50;
const TILE_DENSITY_MAX = 1800; // Increased by 20% from 1500

const PALETTE_VARIANCE_MIN = 0;
const PALETTE_VARIANCE_MAX = 150; // Increased from 100 to allow more variance

const MOTION_SPEED_MAX = 12.5;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Converts internal density value (50-1500) to UI slider value (0-100)
 * 
 * @param value - Internal density value (50-1500)
 * @returns UI slider value (0-100)
 */
export const densityToUi = (value: number) => {
  const bounded = clampValue(value, TILE_DENSITY_MIN, TILE_DENSITY_MAX);
  return Math.round(
    ((bounded - TILE_DENSITY_MIN) / (TILE_DENSITY_MAX - TILE_DENSITY_MIN)) *
      100,
  );
};

/**
 * Converts UI slider value (0-100) to internal density value (50-1500)
 * 
 * @param value - UI slider value (0-100)
 * @returns Internal density value (50-1500)
 */
export const uiToDensity = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    TILE_DENSITY_MIN + (bounded / 100) * (TILE_DENSITY_MAX - TILE_DENSITY_MIN),
  );
};

/**
 * Converts internal palette variance value (0-150) to UI slider value (0-100)
 * 
 * @param value - Internal variance value (0-150)
 * @returns UI slider value (0-100)
 */
export const varianceToUi = (value: number) => {
  const bounded = clampValue(value, PALETTE_VARIANCE_MIN, PALETTE_VARIANCE_MAX);
  return Math.round(
    ((bounded - PALETTE_VARIANCE_MIN) / (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN)) *
      100,
  );
};

/**
 * Converts UI slider value (0-100) to internal palette variance value (0-150)
 * 
 * @param value - UI slider value (0-100)
 * @returns Internal variance value (0-150)
 */
export const uiToVariance = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    PALETTE_VARIANCE_MIN + (bounded / 100) * (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN),
  );
};

/**
 * Converts internal motion speed value (0-12.5) to UI slider value (0-100)
 * 
 * @param value - Internal speed value (0-12.5)
 * @returns UI slider value (0-100)
 */
export const speedToUi = (value: number) => {
  const bounded = clampValue(value, 0, MOTION_SPEED_MAX);
  return Math.round((bounded / MOTION_SPEED_MAX) * 100);
};

/**
 * Converts UI slider value (0-100) to internal motion speed value (0-12.5)
 * 
 * @param value - UI slider value (0-100)
 * @returns Internal speed value (0-12.5)
 */
export const uiToSpeed = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  // Remove Math.round() to allow decimal precision for granular control (e.g., step=0.1)
  return (bounded / 100) * MOTION_SPEED_MAX;
};

