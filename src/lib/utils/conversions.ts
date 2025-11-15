/**
 * Conversion Utilities
 * 
 * Functions to convert between internal values and UI slider values (0-100)
 */

const TILE_DENSITY_MIN = 50;
const TILE_DENSITY_MAX = 1000;

const PALETTE_VARIANCE_MIN = 0;
const PALETTE_VARIANCE_MAX = 150; // Increased from 100 to allow more variance

const MOTION_SPEED_MAX = 12.5;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const densityToUi = (value: number) => {
  const bounded = clampValue(value, TILE_DENSITY_MIN, TILE_DENSITY_MAX);
  return Math.round(
    ((bounded - TILE_DENSITY_MIN) / (TILE_DENSITY_MAX - TILE_DENSITY_MIN)) *
      100,
  );
};

export const uiToDensity = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    TILE_DENSITY_MIN + (bounded / 100) * (TILE_DENSITY_MAX - TILE_DENSITY_MIN),
  );
};

export const varianceToUi = (value: number) => {
  const bounded = clampValue(value, PALETTE_VARIANCE_MIN, PALETTE_VARIANCE_MAX);
  return Math.round(
    ((bounded - PALETTE_VARIANCE_MIN) / (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN)) *
      100,
  );
};

export const uiToVariance = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    PALETTE_VARIANCE_MIN + (bounded / 100) * (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN),
  );
};

export const speedToUi = (value: number) => {
  const bounded = clampValue(value, 0, MOTION_SPEED_MAX);
  return Math.round((bounded / MOTION_SPEED_MAX) * 100);
};

export const uiToSpeed = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round((bounded / 100) * MOTION_SPEED_MAX);
};

