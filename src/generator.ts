import p5 from "p5";
import type { P5WithCanvas, HTMLElementWithResizeObserver } from "./types/p5-extensions";
import { hasRedraw, hasResizeObserver } from "./types/p5-extensions";

import {
  defaultPaletteId,
  getPalette,
  getRandomPalette,
  palettes,
} from "./data/palettes";
import { getGradientsForPalette } from "./data/gradients";
import { calculateGradientLine } from "./lib/utils";
import { getCollection, getSpriteInCollection, getAllCollections } from "./constants/spriteCollections";
import { loadSpriteImage, getCachedSpriteImage, clearSpriteImageCache } from "./lib/services/spriteImageLoader";

const MIN_TILE_SCALE = 0.12;
const MAX_TILE_SCALE = 5.5; // Allow large sprites, but positioning will be adjusted
const MAX_ROTATION_DEGREES = 180;
const MAX_DENSITY_PERCENT_UI = 1800; // Increased by 20% from 1500
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.05; // approx 4.5°/s at 100%

const degToRad = (value: number) => (value * Math.PI) / 180;
const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const movementModes = [
  "pulse",
  "drift",
  "ripple",
  "zigzag",
  "cascade",
  "spiral",
  "comet",
  "linear",
  "isometric",
  "triangular",
] as const;

export type MovementMode = (typeof movementModes)[number];

// Speed multipliers to normalize perceived animation speed across movement modes
// Based on analysis: drift uses 0.02 multiplier (slowest), sway uses 0.13 (fastest)
// These multipliers ensure all modes feel balanced at 100% animation speed
const MOVEMENT_SPEED_MULTIPLIERS: Record<MovementMode, number> = {
  drift: 1.625,    // ~1.625x slower - quadrupled speed from 6.5x
  cascade: 2.5,     // ~2.5x slower - decreased from 2.9 to speed up animation
  comet: 3.0,       // ~3x slower - reduced speed by 25% from 2.4x
  ripple: 3.25,     // ~3.25x slower (avg 0.04 vs 0.13)
  spiral: 7.3,      // ~7.3x slower (~60% of previous max speed)
  zigzag: 2.2,      // ~2.2x slower (0.06 vs 0.13)
  pulse: 2.7,       // ~2.7x slower (~60% of previous max speed)
  linear: 8.0,      // ~8x slower - increased to further reduce max motion speed
  isometric: 8.0,   // ~8x slower - significantly increased to reduce max motion speed
  triangular: 8.0,  // ~8x slower - triangular edge movement
};

// Scale multipliers to improve canvas coverage for modes with large movement radii
// Modes like spiral/orbit move sprites in wide circles, causing sparsity
// Increasing sprite size compensates by making fewer sprites fill more visual space
const MOVEMENT_SCALE_MULTIPLIERS: Record<MovementMode, number> = {
  spiral: 1.4,      // 40% larger sprites to fill space despite wide circular movement
  comet: 1.3,       // 30% larger sprites for long comet trails
  ripple: 1.15,     // 15% larger sprites for ripple effects
  cascade: 1.1,     // 10% larger sprites for cascading patterns
  triangular: 1.0,  // No adjustment
  drift: 1.0,       // No adjustment
  pulse: 1.0,       // No adjustment
  zigzag: 1.0,      // No adjustment
  linear: 1.0,      // No adjustment
  isometric: 1.0,   // No adjustment
};

// Tile count multipliers for modes that spread sprites widely
// Spiral orbit moves in wide circles, so we need more tiles to fill the canvas
const MOVEMENT_TILE_COUNT_MULTIPLIERS: Record<MovementMode, number> = {
  spiral: 1.8,      // 80% more tiles for spiral to compensate for wide circular movement
  comet: 1.0,       // No adjustment
  ripple: 1.0,      // No adjustment
  cascade: 1.0,     // No adjustment
  triangular: 1.0,  // No adjustment
  drift: 1.0,       // No adjustment
  pulse: 1.0,       // No adjustment
  zigzag: 1.0,      // No adjustment
  linear: 1.0,      // No adjustment
  isometric: 1.0,   // No adjustment
};

type PaletteId = (typeof palettes)[number]["id"];

type BlendModeKey = "NONE" | "MULTIPLY" | "SCREEN" | "HARD_LIGHT" | "OVERLAY" | "SOFT_LIGHT" | "DARKEST" | "LIGHTEST";
export type BlendModeOption = BlendModeKey;

export type BackgroundMode = "auto" | PaletteId;

export type SpriteMode =
  | "rounded"
  | "circle"
  | "square"
  | "triangle"
  | "hexagon"
  | "ring"
  | "diamond"
  | "star"
  | "line"
  | "pentagon"
  | "asterisk"
  | "cross"
  | "pixels"
  | "heart"
  | "snowflake"
  | "smiley"
  | "tree"
  | "x"
  | "arrow";

interface ShapeTile {
  kind: "shape";
  shape: ShapeMode;
  tint: string;
  paletteColorIndex: number; // Index of the palette color used (before jittering)
  u: number;
  v: number;
  scale: number;
  blendMode: BlendModeKey;
  rotationBase: number;
  rotationDirection: number;
  rotationSpeed: number;
  // Store random multipliers for dynamic recalculation without regeneration
  rotationBaseMultiplier: number; // Random multiplier for rotationBase (-1 to 1)
  rotationSpeedMultiplier: number; // Random multiplier for rotationSpeed (0.6 to 1.2)
  animationTimeMultiplier: number; // Random multiplier for animation time (0.85 to 1.15, +/- 15%)
}

interface SvgTile {
  kind: "svg";
  svgPath: string; // Path to the SVG file
  spriteId: string; // Sprite ID for identification
  tint: string;
  paletteColorIndex: number; // Index of the palette color used (before jittering)
  u: number;
  v: number;
  scale: number;
  blendMode: BlendModeKey;
  rotationBase: number;
  rotationDirection: number;
  rotationSpeed: number;
  // Store random multipliers for dynamic recalculation without regeneration
  rotationBaseMultiplier: number; // Random multiplier for rotationBase (-1 to 1)
  rotationSpeedMultiplier: number; // Random multiplier for rotationSpeed (0.6 to 1.2)
  animationTimeMultiplier: number; // Random multiplier for animation time (0.85 to 1.15, +/- 15%)
}

type PreparedTile = ShapeTile | SvgTile;

interface PreparedLayer {
  tiles: PreparedTile[];
  tileCount: number;
  blendMode: BlendModeKey;
  opacity: number;
  mode: "shape" | "svg";
  baseSizeRatio: number;
}

interface PreparedSprite {
  layers: PreparedLayer[];
  background: string;
}


export interface GeneratorState {
  seed: string;
  paletteId: string;
  paletteVariance: number;
  hueShift: number;
  scalePercent: number;
  scaleBase: number;
  scaleSpread: number;
  motionIntensity: number;
  blendMode: BlendModeKey;
  blendModeAuto: boolean;
  previousBlendMode: BlendModeKey;
  layerOpacity: number;
  spriteMode: SpriteMode;
  movementMode: MovementMode;
  backgroundMode: BackgroundMode;
  backgroundHueShift: number;
  backgroundBrightness: number;
  motionSpeed: number;
  rotationEnabled: boolean;
  rotationAmount: number;
  rotationSpeed: number;
  rotationAnimated: boolean;
  // Gradient settings
  spriteFillMode: "solid" | "gradient";
  spriteGradientId: string | null;
  spriteGradientDirection: number; // 0-360 degrees
  spriteGradientRandom: boolean;
  spriteGradientDirectionRandom: boolean;
  canvasFillMode: "solid" | "gradient";
  canvasGradientMode: BackgroundMode; // Same options as backgroundMode
  canvasGradientDirection: number; // 0-360 degrees
  randomSprites: boolean; // When true, each sprite uses a random shape from the selection
  // Depth of field settings
  depthOfFieldEnabled: boolean;
  depthOfFieldFocus: number; // 0-100, represents focus percentage (50 = middle)
  depthOfFieldStrength: number; // 0-100, controls blur intensity (0 = no blur, 100 = max blur)
  // Sprite collection settings
  spriteCollectionId: string; // Collection ID (e.g., "primitives", "christmas")
}

export interface SpriteControllerOptions {
  onStateChange?: (state: GeneratorState) => void;
  onFrameRate?: (fps: number) => void;
}

const shapeModes = [
  "rounded",
  "circle",
  "square",
  "triangle",
  "hexagon",
  "ring",
  "diamond",
  "star",
  "line",
  "pentagon",
  "asterisk",
  "cross",
  "pixels",
  "heart",
  "snowflake",
  "smiley",
  "tree",
  "x",
  "arrow",
] as const;
const spriteModePool: SpriteMode[] = [...shapeModes];

type ShapeMode = (typeof shapeModes)[number];

export const DEFAULT_STATE: GeneratorState = {
  seed: "DEADBEEF",
  paletteId: defaultPaletteId,
  paletteVariance: 68,
  hueShift: 0,
  scalePercent: 320,
  scaleBase: 72,
  scaleSpread: 62,
  motionIntensity: 58,
  blendMode: "NONE",
  blendModeAuto: true,
  previousBlendMode: "NONE",
  layerOpacity: 74,
  spriteMode: "star",
  movementMode: "drift",
  backgroundMode: "auto",
  backgroundHueShift: 0,
  backgroundBrightness: 50,
  motionSpeed: 8.5,
  rotationEnabled: false,
  rotationAmount: 72,
  rotationSpeed: 48,
  rotationAnimated: false,
  // Gradient defaults
  spriteFillMode: "solid",
  spriteGradientId: null,
  spriteGradientDirection: 0,
  spriteGradientRandom: false,
  spriteGradientDirectionRandom: false,
  canvasFillMode: "solid",
  canvasGradientMode: "auto",
  canvasGradientDirection: 0,
  randomSprites: false,
  // Depth of field defaults
  depthOfFieldEnabled: false,
  depthOfFieldFocus: 50, // Start at middle of depth range
  depthOfFieldStrength: 50, // Moderate blur strength
  // Sprite collection defaults
  spriteCollectionId: "primitives", // Default to primitives collection
};

const SEED_ALPHABET = "0123456789ABCDEF";

const generateSeedString = () =>
  Array.from(
    { length: 8 },
    () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)],
  ).join("");

/**
 * Creates a Mulberry32 PRNG (Pseudo-Random Number Generator) from a seed
 * 
 * Mulberry32 is a fast, high-quality PRNG suitable for procedural generation.
 * It produces deterministic random numbers based on the seed, ensuring reproducible results.
 * 
 * @param seed - Numeric seed value (will be converted to unsigned 32-bit integer)
 * @returns A function that returns a random number between 0 and 1
 * 
 * @example
 * const rng = createMulberry32(12345);
 * const randomValue = rng(); // Returns a number between 0 and 1
 */
const createMulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Hashes a seed string to a numeric value
 * 
 * Uses a custom hash function based on MurmurHash3 for deterministic seed conversion.
 * This ensures the same seed string always produces the same numeric hash.
 * 
 * @param seed - Seed string (typically 8 hex characters)
 * @returns 32-bit signed integer hash value
 */
const hashSeed = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  return h ^ (h >>> 16);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hexToHsl = (hex: string): [number, number, number] => {
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
};

const hueToRgb = (p: number, q: number, t: number) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

const hslToHex = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100);
  l = clamp(l, 0, 100);

  const sat = s / 100;
  const light = l / 100;

  if (sat === 0) {
    const gray = Math.round(light * 255);
    return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, h / 360) * 255);
  const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
};

const shiftHue = (hex: string, hueShiftDegrees: number) => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + hueShiftDegrees, s, l);
};

const applyHueAndBrightness = (
  hex: string,
  hueShiftDegrees: number,
  brightnessPercent: number,
) => {
  const [h, s, l] = hexToHsl(hex);
  const brightnessFactor = clamp(brightnessPercent, 0, 100) / 50;
  const adjustedLight = clamp(l * brightnessFactor, 0, 100);
  return hslToHex(h + hueShiftDegrees, s, adjustedLight);
};

const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  const hueShift = (random() - 0.5) * variance * 60;
  const satShift = (random() - 0.5) * variance * 50;
  const lightShift = (random() - 0.5) * variance * 40;
  return hslToHex(h + hueShift, s + satShift, l + lightShift);
};

const blendModePool: BlendModeKey[] = [
  "NONE",
  "MULTIPLY",
  "SCREEN",
  "HARD_LIGHT",
  "OVERLAY",
  "SOFT_LIGHT",
  "DARKEST",
  "LIGHTEST",
];

/**
 * Computes movement offsets and scale multipliers for a tile based on its movement mode
 * 
 * This function implements various motion algorithms (drift, pulse, spiral, etc.) to create
 * animated sprite movement. Each mode uses different mathematical functions to calculate
 * position offsets and scale variations over time.
 * 
 * @param mode - Movement mode (drift, pulse, spiral, etc.)
 * @param tileIndex - Index of the tile within its layer
 * @param layerIndex - Index of the layer (0, 1, or 2)
 * @param layerTileSize - Base tile size for the layer
 * @param baseUnit - Base unit size for calculations
 * @param phase - Animation phase (0-1) representing progress through animation cycle
 * @param motionScale - Motion intensity multiplier (0-1.5)
 * @returns Object containing offsetX, offsetY, and scaleMultiplier
 */
const computeMovementOffsets = (
  mode: MovementMode,
  data: {
    time: number;
    phase: number;
    motionScale: number;
    layerIndex: number;
    baseUnit: number;
    layerTileSize: number;
    speedFactor: number;
  },
): { offsetX: number; offsetY: number; scaleMultiplier: number } => {
  const {
    time,
    phase,
    motionScale,
    layerIndex,
    baseUnit,
    layerTileSize,
    speedFactor,
  } = data;
  const layerFactor = 1 + layerIndex * 0.12;
  // Speed is already applied to the time parameter, so use speedFactor directly
  const velocity = Math.max(speedFactor, 0);
  const baseTime = velocity === 0 ? 0 : time * velocity;
  const phased = baseTime + phase;
  const clampScale = (value: number) => Math.max(0.35, value);

  switch (mode) {
    case "pulse": {
      const pulse = Math.sin(phased * 0.08) * motionScale;
      const scaleMultiplier = clampScale(1 + pulse * 0.55);
      const offsetY =
        Math.sin(phased * 0.04) * baseUnit * motionScale * 0.25 * layerFactor;
      return { offsetX: 0, offsetY, scaleMultiplier };
    }
    case "drift": {
      const driftX = Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 0.45;
      const driftY = Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 0.5;
      const scaleMultiplier = clampScale(1 + Math.sin(phased * 0.016) * motionScale * 0.16);
      return { offsetX: driftX, offsetY: driftY, scaleMultiplier };
    }
    case "ripple": {
      const wave = Math.sin(phased * 0.04 + layerIndex * 0.6);
      const radius = baseUnit * (0.6 + motionScale * 0.9);
      const offsetX =
        Math.cos(phase * 1.2 + phased * 0.015) * radius * wave * 0.35;
      const offsetY =
        Math.sin(phase * 1.35 + phased * 0.02) * radius * wave * 0.35;
      const scaleMultiplier = clampScale(1 + wave * motionScale * 0.4);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "zigzag": {
      const zig = phased * 0.06 + layerIndex * 0.25;
      const tri = (2 / Math.PI) * Math.asin(Math.sin(zig));
      const sweep = Math.sin(zig * 1.35);
      const offsetX =
        tri * layerTileSize * 0.35 * motionScale +
        sweep * baseUnit * 0.2 * motionScale;
      const offsetY =
        Math.sin(zig * 0.9 + layerIndex * 0.4 + phase * 0.4) *
        layerTileSize *
        0.22 *
        motionScale;
      const scaleMultiplier = clampScale(
        1 + Math.cos(zig * 1.1) * 0.18 * motionScale,
      );
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "cascade": {
      const cascadeTime = phased * 0.045 + layerIndex * 0.2;
      const wave = Math.sin(cascadeTime);
      const drift = (1 - Math.cos(cascadeTime)) * 0.5;
      const offsetY =
        (drift * 2 - 1) *
        layerTileSize *
        0.4 *
        (1 + layerIndex * 0.12) *
        motionScale;
      const offsetX = wave * baseUnit * 0.3 * motionScale;
      const scaleMultiplier = clampScale(
        1 + Math.sin(cascadeTime * 1.2 + phase * 0.25) * 0.16 * motionScale,
      );
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "spiral": {
      // Reduced radius to keep sprites on canvas - spiral was pushing too many tiles off-screen
      // Original: baseUnit * (0.55 + layerIndex * 0.18 + motionScale * 1.35)
      // Reduced motionScale multiplier from 1.35 to 0.85 to reduce movement range
      const radius = baseUnit * (0.45 + layerIndex * 0.15 + motionScale * 0.85);
      const angle = phased * (0.04 + layerIndex * 0.02);
      // Reduced spiralFactor range from 0.4 to 0.25 to reduce maximum expansion
      const spiralFactor = 1 + Math.sin(angle * 0.5) * 0.25;
      const offsetX = Math.cos(angle) * radius * spiralFactor;
      const offsetY = Math.sin(angle) * radius * spiralFactor;
      const scaleMultiplier = clampScale(
        1 + Math.cos(angle * 0.7) * motionScale * 0.25,
      );
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "comet": {
      const pathLength =
        layerTileSize * (0.85 + layerIndex * 0.28 + motionScale * 1.2);
      const travel = phased * (0.035 + layerIndex * 0.01);
      const orbital = travel + phase;
      const tail = (Math.sin(travel * 0.9 + phase * 0.6) + 1) * 0.5;
      const offsetX = Math.cos(orbital) * pathLength;
      const offsetY = Math.sin(orbital * 0.75) * pathLength * 0.48;
      const scaleMultiplier = clampScale(0.65 + tail * motionScale * 0.55);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "linear": {
      // Determine direction based on phase (deterministic per sprite)
      // Use phase to pick from all 45-degree angles: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
      const angleDegrees = [0, 45, 90, 135, 180, 225, 270, 315];
      const directionIndex = Math.floor((phase * 0.142857) % angleDegrees.length);
      const angle = (angleDegrees[directionIndex] * Math.PI) / 180;
      
      // Parallax effect: speed relative to sprite size
      // Smaller sprites move slower, larger sprites move faster
      const sizeRatio = baseUnit / layerTileSize; // 0-1, smaller sprites have smaller ratio
      const speedMultiplier = 0.3 + sizeRatio * 0.7; // Range: 0.3 to 1.0
      
      // Calculate distance based on sprite size and canvas size
      // Use a fraction of the layer tile size (which represents canvas scale)
      // Combined with sprite size for sensible travel distance
      const maxDistance = (layerTileSize * 0.7 * motionScale + baseUnit * 0.5) * speedMultiplier;
      
      // Create oscillating motion - use sine wave directly for smooth, consistent speed
      // Use a slower frequency for smoother oscillation
      const oscillation = Math.sin(phased * 0.04 + phase * 0.1);
      
      // Use sine wave directly - it already has smooth, natural acceleration/deceleration
      // No additional easing needed to avoid speed bumps
      const travel = oscillation * maxDistance;
      
      // Calculate offset based on angle
      const offsetX = Math.cos(angle) * travel;
      const offsetY = Math.sin(angle) * travel;
      return { offsetX, offsetY, scaleMultiplier: 1 };
    }
    case "isometric": {
      // Hexagon is proper mathematical hexagon, pointy-top (vertex up/down)
      // Geometry is fixed: 6 vertices at 60° intervals starting at -90°
      // The 4 angled edges (excluding vertical) are at fixed angles:
      const hexAngledEdges = [
        Math.PI / 6,                // 30° - edge 0→1 (top-right)
        (5 * Math.PI) / 6,          // 150° - edge 2→3 (bottom-left)
        (7 * Math.PI) / 6,          // 210° - edge 3→4 (up-left)
        (11 * Math.PI) / 6          // 330° = -30° - edge 5→0 (up-right)
      ];
      // Pick angle based on phase (deterministic per sprite)
      const angleIndex = Math.floor((phase * 0.142857) % hexAngledEdges.length);
      const angle = hexAngledEdges[angleIndex];
      
      // Parallax effect: speed relative to sprite size
      // Smaller sprites move slower, larger sprites move faster
      const sizeRatio = baseUnit / layerTileSize; // 0-1, smaller sprites have smaller ratio
      const speedMultiplier = 0.3 + sizeRatio * 0.7; // Range: 0.3 to 1.0
      
      // Calculate distance based on sprite size and canvas size
      const maxDistance = (layerTileSize * 0.7 * motionScale + baseUnit * 0.5) * speedMultiplier;
      
      // Create oscillating motion - use sine wave directly for smooth, consistent speed
      // Remove phase from oscillation to ensure all sprites with same angle move in sync
      const oscillation = Math.sin(phased * 0.04);
      
      // Use sine wave directly - it already has smooth, natural acceleration/deceleration
      // No additional easing needed to avoid speed bumps
      const travel = oscillation * maxDistance;
      const offsetX = Math.cos(angle) * travel;
      const offsetY = Math.sin(angle) * travel;
      return { offsetX, offsetY, scaleMultiplier: 1 };
    }
    case "triangular": {
      // Equilateral triangle with flat base and point at top
      // Triangle orientation: flat base (horizontal), point at top
      // The three edges match the outside edge angles of the triangle primitive:
      // - Left edge: 120° (down-left)
      // - Bottom edge: 0° (horizontal, flat base - straight right)
      // - Right edge: 60° (down-right)
      const triangleEdges = [
        (2 * Math.PI) / 3,   // 120° - left edge (down-left)
        0,                   // 0° - bottom edge (horizontal, flat base)
        Math.PI / 3,         // 60° - right edge (down-right)
      ];
      
      // Pick angle based on phase (deterministic per sprite)
      const angleIndex = Math.floor((phase * 0.142857) % triangleEdges.length);
      const angle = triangleEdges[angleIndex];
      
      // Parallax effect: speed relative to sprite size
      // Smaller sprites move slower, larger sprites move faster
      const sizeRatio = baseUnit / layerTileSize; // 0-1, smaller sprites have smaller ratio
      const speedMultiplier = 0.3 + sizeRatio * 0.7; // Range: 0.3 to 1.0
      
      // Calculate distance based on sprite size and canvas size
      const maxDistance = (layerTileSize * 0.7 * motionScale + baseUnit * 0.5) * speedMultiplier;
      
      // Create oscillating motion - use sine wave directly for smooth, consistent speed
      // Remove phase from oscillation to ensure all sprites with same angle move in sync
      const oscillation = Math.sin(phased * 0.04);
      
      // Use sine wave directly - it already has smooth, natural acceleration/deceleration
      // No additional easing needed to avoid speed bumps
      const travel = oscillation * maxDistance;
      const offsetX = Math.cos(angle) * travel;
      const offsetY = Math.sin(angle) * travel;
      return { offsetX, offsetY, scaleMultiplier: 1 };
    }
    default: {
      // Default to drift behavior for any unrecognized modes
      const driftX = Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 0.45;
      const driftY = Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 0.5;
      const scaleMultiplier = clampScale(1 + Math.sin(phased * 0.016) * motionScale * 0.16);
      return { offsetX: driftX, offsetY: driftY, scaleMultiplier };
    }
  }
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Computes the complete sprite configuration from generator state
 * 
 * This is the main sprite generation function that:
 * 1. Creates a seeded RNG from the state seed
 * 2. Generates layers based on density
 * 3. Creates tiles for each layer with positions, colors, and shapes
 * 4. Applies motion offsets, rotation, and scaling
 * 5. Generates background color/gradient
 * 
 * The result is a "prepared" sprite ready for rendering by p5.js.
 * 
 * @param state - Complete generator state (palette, density, motion, etc.)
 * @returns Prepared sprite with layers, tiles, and background configuration
 */
const computeSprite = (state: GeneratorState): PreparedSprite => {
  const rng = createMulberry32(hashSeed(state.seed));
  const palette = getPalette(state.paletteId);
  const originalPaletteColors = palette.colors;
  // Allow variance up to 1.5 (150% internal value) for more color variation
  const variance = clamp(state.paletteVariance / 100, 0, 1.5);

  const colorRng = createMulberry32(hashSeed(`${state.seed}-color`));
  const positionRng = createMulberry32(hashSeed(`${state.seed}-position`));
  // Apply global hue shift to palette colors (0-100 maps to 0-360 degrees)
  const hueShiftDegrees = (state.hueShift / 100) * 360;
  const shiftedPalette = originalPaletteColors.map((color) =>
    shiftHue(color, hueShiftDegrees),
  );
  const chosenPalette = shiftedPalette.map((color) =>
    jitterColor(color, variance, colorRng),
  );
  const backgroundPaletteId =
    state.backgroundMode === "auto" ? state.paletteId : state.backgroundMode;
  const backgroundPalette = getPalette(backgroundPaletteId);
  const backgroundBase = backgroundPalette.colors[0] ?? originalPaletteColors[0];
  const backgroundHueShiftDegrees = (state.backgroundHueShift / 100) * 360;
  const background = applyHueAndBrightness(
    backgroundBase,
    backgroundHueShiftDegrees,
    state.backgroundBrightness,
  );

  const densityRatio = clamp(state.scalePercent / MAX_DENSITY_PERCENT_UI, 0, 1);
  const baseScaleValue = clamp(state.scaleBase / 100, 0, 1);
  const spreadValue = clamp(state.scaleSpread / 100, 0, 1);

  const baseScale = lerp(MIN_TILE_SCALE, MAX_TILE_SCALE, baseScaleValue);
  const minScaleFactor = lerp(baseScale, MIN_TILE_SCALE, spreadValue);
  const maxScaleFactor = lerp(baseScale, MAX_TILE_SCALE, spreadValue);
  // Always calculate rotation range based on rotationAmount, regardless of rotationEnabled
  // This allows toggling rotationEnabled without regenerating sprites
  const rotationRange = degToRad(clamp(state.rotationAmount, 0, MAX_ROTATION_DEGREES));
  const rotationSpeedBase = clamp(state.rotationSpeed, 0, 100) / 100;

  // Determine if we're using shape-based or SVG-based collection
  const collection = getCollection(state.spriteCollectionId || "primitives");
  const isShapeBased = collection?.isShapeBased ?? true;
  
  // Get the active sprite (shape or SVG)
  let activeShape: ShapeMode = "rounded";
  let activeSvgSprite: { id: string; svgPath: string } | null = null;
  
  if (isShapeBased) {
    // Primitive collection - use shape mode
    const isShapeMode = shapeModes.includes(state.spriteMode as ShapeMode);
    activeShape = isShapeMode ? (state.spriteMode as ShapeMode) : "rounded";
  } else {
    // SVG collection - find the sprite by ID
    const sprite = getSpriteInCollection(state.spriteCollectionId, state.spriteMode);
    if (sprite && sprite.svgPath) {
      activeSvgSprite = { id: sprite.id, svgPath: sprite.svgPath };
    } else if (collection && collection.sprites.length > 0) {
      // Fallback to first sprite in collection
      const firstSprite = collection.sprites[0];
      if (firstSprite.svgPath) {
        activeSvgSprite = { id: firstSprite.id, svgPath: firstSprite.svgPath };
      }
    }
  }

  // Apply mode-specific scale multiplier to improve canvas coverage
  // Modes with large movement radii (spiral, orbit) benefit from larger sprites
  const modeScaleMultiplier = MOVEMENT_SCALE_MULTIPLIERS[state.movementMode] ?? 1.0;

  const layers: PreparedLayer[] = [];
  const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1);
  const layerCount = 3;
  const layerThresholds = [0, 0.38, 0.7];

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const threshold = layerThresholds[layerIndex] ?? 0.85;
    if (layerIndex > 0 && densityRatio < threshold) {
      continue;
    }

    const normalizedDensity =
      layerIndex === 0
        ? densityRatio
        : clamp((densityRatio - threshold) / (1 - threshold), 0, 1);

    const baseSizeBase = 0.22;
    const baseSizeRatio =
      baseSizeBase * (1 + layerIndex * 0.18) * modeScaleMultiplier;
    
    // Apply mode-specific tile count multiplier for modes that spread sprites widely
    // Spiral orbit moves in wide circles, so we need more tiles to fill the canvas
    const modeTileCountMultiplier = MOVEMENT_TILE_COUNT_MULTIPLIERS[state.movementMode] ?? 1.0;
    // Reduce tile count when DoF is enabled (blur is expensive) to maintain performance
    // Apply a 0.75x multiplier when DoF is enabled to reduce blur operations
    const dofTileCountMultiplier = state.depthOfFieldEnabled ? 0.75 : 1.0;
    // Reduced base max tiles from 60 to 50 for better performance at high density
    const maxTiles = Math.round(50 * modeTileCountMultiplier * dofTileCountMultiplier);
    const minTiles = layerIndex === 0 ? 1 : 0;
    const desiredTiles = 1 + normalizedDensity * (maxTiles - 1);
    const tileTotal = Math.max(minTiles, Math.round(desiredTiles));

    if (tileTotal === 0) {
      continue;
    }

    const layerBlendMode: BlendModeKey = state.blendModeAuto
      ? (blendModePool[Math.floor(Math.random() * blendModePool.length)] ??
        "NONE")
      : state.blendMode;
    const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95);

    const gridCols = Math.max(1, Math.round(Math.sqrt(tileTotal)));
    const gridRows = Math.max(1, Math.ceil(tileTotal / gridCols));
    const tiles: PreparedTile[] = [];

    // Adjust positioning bounds based on scale - larger sprites need tighter spacing
    // When scale is high, reduce the range so sprites are positioned closer together
    const scaleRatio = baseScale / MAX_TILE_SCALE; // 0-1, where 1 = max scale
    let minBound = lerp(0.05, 0.2, scaleRatio);
    let maxBound = lerp(0.95, 0.8, scaleRatio);

    const isSpiralMode = state.movementMode === "spiral";

    if (isSpiralMode) {
      minBound = lerp(0.035, 0.17, scaleRatio);
      maxBound = lerp(0.965, 0.83, scaleRatio);
    }
    
    for (let index = 0; index < tileTotal; index += 1) {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const jitterStrengthX = gridCols === 1 ? 0.2 : 0.6;
      const jitterStrengthY = gridRows === 1 ? 0.2 : 0.6;
      const jitterX = (positionRng() - 0.5) * jitterStrengthX;
      const jitterY = (positionRng() - 0.5) * jitterStrengthY;

      let u = clamp((col + 0.5 + jitterX) / gridCols, minBound, maxBound);
      let v = clamp((row + 0.5 + jitterY) / gridRows, minBound, maxBound);

      if (isSpiralMode) {
        const focusStrength = scaleRatio * 0.12;
        const centreBiasX = (0.5 - u) * focusStrength;
        const centreBiasY = (0.5 - v) * focusStrength;
        u = clamp(u + centreBiasX, minBound, maxBound);
        v = clamp(v + centreBiasY, minBound, maxBound);
      }

      const scaleRange = Math.max(0, maxScaleFactor - minScaleFactor);
      const scale =
        scaleRange < 1e-6
          ? baseScale
          : clamp(
              minScaleFactor + positionRng() * scaleRange,
              MIN_TILE_SCALE,
              MAX_TILE_SCALE,
            );
      // Store random multipliers for dynamic recalculation
      const rotationBaseMultiplier = rotationRange > 0 ? (positionRng() - 0.5) * 2 : 0;
      const rotationBase = rotationRange * rotationBaseMultiplier;
      const rotationDirection = positionRng() > 0.5 ? 1 : -1;
      const rotationSpeedMultiplier = rotationSpeedBase > 0 ? (0.6 + positionRng() * 0.6) : 0;
      // Animation time multiplier: +/- 15% variation to prevent exact repetition
      const animationTimeMultiplier = 0.85 + positionRng() * 0.3; // Range: 0.85 to 1.15
      const rotationSpeedValue =
        rotationSpeedBase > 0
          ? rotationSpeedBase * ROTATION_SPEED_MAX * rotationSpeedMultiplier
          : 0;
      const tileBlend = state.blendModeAuto
        ? (blendModePool[Math.floor(rng() * blendModePool.length)] ?? "NONE")
        : state.blendMode;

      const paletteColorIndex = Math.floor(colorRng() * chosenPalette.length);
      const tint = chosenPalette[paletteColorIndex];
      
      // Store the palette color index so we can map to the corresponding gradient
      // Gradient assignment is now done during rendering, not during computation
      // This allows toggling gradients without regenerating sprite positions/scales
      
      if (isShapeBased) {
        // Shape-based collection (primitives)
        // If randomSprites is enabled, assign a random shape to each tile
        // Otherwise, use the activeShape from spriteMode
        const tileShape = state.randomSprites
          ? (shapeModes[Math.floor(rng() * shapeModes.length)] as ShapeMode)
          : activeShape;
        
        tiles.push({
          kind: "shape",
          shape: tileShape,
          tint,
          paletteColorIndex,
          u,
          v,
          scale,
          blendMode: tileBlend,
          rotationBase,
          rotationDirection,
          rotationSpeed: rotationSpeedValue,
          rotationBaseMultiplier,
          rotationSpeedMultiplier,
          animationTimeMultiplier,
        });
      } else {
        // SVG-based collection
        // If randomSprites is enabled, assign a random sprite from collection
        // Otherwise, use the active SVG sprite
        let tileSvgSprite = activeSvgSprite;
        
        if (state.randomSprites && collection && collection.sprites.length > 0) {
          // Select a random SVG sprite from the collection
          const randomIndex = Math.floor(rng() * collection.sprites.length);
          const randomSprite = collection.sprites[randomIndex];
          if (randomSprite.svgPath) {
            tileSvgSprite = { id: randomSprite.id, svgPath: randomSprite.svgPath };
          }
        }
        
        if (tileSvgSprite) {
          tiles.push({
            kind: "svg",
            svgPath: tileSvgSprite.svgPath,
            spriteId: tileSvgSprite.id,
            tint,
            paletteColorIndex,
            u,
            v,
            scale,
            blendMode: tileBlend,
            rotationBase,
            rotationDirection,
            rotationSpeed: rotationSpeedValue,
            rotationBaseMultiplier,
            rotationSpeedMultiplier,
            animationTimeMultiplier,
          });
        }
      }
    }

    layers.push({
      tiles,
      tileCount: tileTotal,
      blendMode: layerBlendMode,
      opacity,
      mode: isShapeBased ? "shape" : "svg",
      baseSizeRatio,
    });
  }

  return { layers, background };
};

export interface SpriteController {
  getState: () => GeneratorState;
  applyState: (state: GeneratorState) => void;
  randomizeAll: () => void;
  randomizeColors: () => void;
  refreshPaletteApplication: () => void;
  randomizeScale: () => void;
  randomizeScaleRange: () => void;
  randomizeMotion: () => void;
  randomizeBlendMode: () => void;
  randomizeSpriteShapes: () => void;
  setScalePercent: (value: number) => void;
  setScaleBase: (value: number) => void;
  setScaleSpread: (value: number) => void;
  setPaletteVariance: (value: number) => void;
  setHueShift: (value: number) => void;
  setMotionIntensity: (value: number) => void;
  setMotionSpeed: (value: number) => void;
  setBlendMode: (mode: BlendModeOption) => void;
  setBlendModeAuto: (value: boolean) => void;
  setLayerOpacity: (value: number) => void;
  setSpriteMode: (mode: SpriteMode) => void;
  setMovementMode: (mode: MovementMode) => void;
  setRotationEnabled: (value: boolean) => void;
  setRotationAmount: (value: number) => void;
  setRotationSpeed: (value: number) => void;
  setRotationAnimated: (value: boolean) => void;
  usePalette: (paletteId: PaletteId) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  setBackgroundHueShift: (value: number) => void;
  setBackgroundBrightness: (value: number) => void;
  setSpriteFillMode: (mode: "solid" | "gradient") => void;
  setSpriteGradient: (gradientId: string) => void;
  setSpriteGradientDirection: (degrees: number) => void;
  setSpriteGradientRandom: (enabled: boolean) => void;
  setSpriteGradientDirectionRandom: (enabled: boolean) => void;
  setCanvasFillMode: (mode: "solid" | "gradient") => void;
  setCanvasGradientMode: (mode: BackgroundMode) => void;
  setCanvasGradientDirection: (degrees: number) => void;
  setRandomSprites: (enabled: boolean) => void;
  setDepthOfFieldEnabled: (value: boolean) => void;
  setDepthOfFieldFocus: (value: number) => void;
  setDepthOfFieldStrength: (value: number) => void;
  setSpriteCollection: (collectionId: string) => void;
  applySingleTilePreset: () => void;
  applyNebulaPreset: () => void;
  applyMinimalGridPreset: () => void;
  reset: () => void;
  destroy: () => void;
  getP5Instance: () => p5 | null;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
}

/**
 * Creates a sprite controller instance that manages p5.js canvas rendering
 * 
 * The controller handles:
 * - Canvas initialization and resizing
 * - Sprite state management
 * - Animation loop (draw function)
 * - State updates and notifications
 * - Cleanup and resource management
 * 
 * @param container - HTML element to mount the p5.js canvas
 * @param options - Optional callbacks for state changes and frame rate updates
 * @returns SpriteController instance with methods to control sprite generation
 */
export const createSpriteController = (
  container: HTMLElement,
  options: SpriteControllerOptions = {},
): SpriteController => {
  // Store state in an object that can be updated
  // This ensures closures always read from the same reference, even after HMR
  const stateRef = { 
    current: {
      ...DEFAULT_STATE,
      seed: generateSeedString(),
      previousBlendMode: DEFAULT_STATE.blendMode,
    } as GeneratorState
  };
  let state = stateRef.current;
  let prepared = computeSprite(state);
  let p5Instance: P5WithCanvas | null = null;
  let destroyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pauseTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // Loop capture override: when enabled, draw uses time modulo a fixed period
  const loopOverrideRef = {
    enabled: false,
    periodSeconds: 3,
    // Optional deterministic frame stepping for offline capture (unused for realtime)
    frameIndex: 0,
    totalFrames: 0,
    useFrameIndex: false,
  };
  
  // Getter function to always return current state from the ref
  // This ensures the draw loop always reads the latest state, even after HMR
  const getState = () => stateRef.current;

  const randomBlendMode = () =>
    blendModePool[Math.floor(Math.random() * blendModePool.length)] ?? "NONE";

  const reassignAutoBlendModes = () => {
    if (!prepared) {
      return;
    }

    prepared.layers.forEach((layer) => {
      if (layer.mode !== "shape") {
        return;
      }
      const layerBlend = randomBlendMode();
      layer.blendMode = layerBlend;
      layer.tiles.forEach((tile) => {
        tile.blendMode = randomBlendMode();
      });
    });
  };

  const reassignRandomShapes = () => {
    if (!prepared || !stateRef.current.randomSprites) {
      return;
    }

    // Modify shapes directly in the prepared object
    // The draw loop reads from prepared, so changes will be visible on next frame
    prepared.layers.forEach((layer) => {
      if (layer.mode !== "shape") {
        return;
      }
      layer.tiles.forEach((tile) => {
        if (tile.kind === "shape") {
          // Assign a random shape from available shape modes
          tile.shape = shapeModes[Math.floor(Math.random() * shapeModes.length)] as ShapeMode;
        }
      });
    });
    
    // Force a redraw by updating the p5 instance if available
    if (hasRedraw(p5Instance)) {
      p5Instance.redraw();
    }
  };

  const notifyState = () => {
    options.onStateChange?.({ ...stateRef.current });
  };

  const updateSprite = () => {
    prepared = computeSprite(stateRef.current);
    notifyState();
  };

  const updateSeed = (seed?: string) => {
    stateRef.current.seed = seed ?? generateSeedString();
    state = stateRef.current; // Keep local variable in sync
  };

  const sketch = (p: p5) => {
    let canvas: p5.Renderer;
    let animationTime = 0;
    let scaledAnimationTime = 0; // Scaled time that accumulates smoothly
    let currentSpeedFactor = 1.0; // Current speed factor (smoothly interpolated)
    let targetSpeedFactor = 1.0; // Target speed factor from slider

    p.setup = () => {
      try {
        // Use the same sizing logic as resizeCanvas to ensure consistency
        // Canvas should match the card's intended size, accounting for padding and border
        const cardPadding = 40; // 20px each side = 40px total (spacing.5)
        const cardBorder = 4; // 2px each side = 4px total
        const containerWidth = container.clientWidth || 0;
        // Minimum card width is 320px, so minimum canvas size accounting for padding/border
        const minCardWidth = 320;
        const minCanvasSize = Math.max(0, minCardWidth - cardPadding - cardBorder); // 276px minimum canvas
        // Calculate canvas size: container width, clamped between min (276px) and max (960px)
        const size = Math.min(960, Math.max(minCanvasSize, containerWidth));
        
        // Validate size before creating canvas
        if (size <= 0 || !isFinite(size)) {
          console.error("Invalid canvas size:", size);
          canvas = p.createCanvas(720, 720); // Fallback to default size
        } else {
          canvas = p.createCanvas(size, size);
        }
        
        if (!container || !container.parentNode) {
          console.error("Container is not attached to DOM");
          return;
        }
        
        canvas.parent(container);
        p.pixelDensity(1);
        p.noStroke();
        p.noSmooth();
        p.imageMode(p.CENTER);
      } catch (error) {
        console.error("Error in p5.setup:", error);
        // Fallback to safe defaults
        canvas = p.createCanvas(720, 720);
        if (container && container.parentNode) {
          canvas.parent(container);
        }
        p.pixelDensity(1);
        p.noStroke();
        p.noSmooth();
        p.imageMode(p.CENTER);
      }
    };

    // Flag to prevent recursive resize calls
    let isResizing = false;
    
    // Internal resize function (doesn't need UIEvent parameter)
    const performResize = () => {
      // Prevent recursive calls
      if (isResizing) {
        return;
      }
      
      isResizing = true;
      
      // In fullscreen, use viewport dimensions; otherwise use container width
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      let size: number;
      if (isFullscreen) {
        // In fullscreen: use viewport width to create a large square canvas
        // CSS will scale it down to fit the height, making it appear larger
        size = window.innerWidth;
      } else {
        // Normal mode: canvas should match the card's intended size, not the container's width
        // The card has max width of 960px with:
        //   - border: 2px solid (2px each side = 4px total)
        //   - padding-inline: spacing.5 (20px each side = 40px total)
        //   - box-sizing: border-box (border and padding included in width)
        // The container's clientWidth excludes border and padding, so:
        //   clientWidth = cardWidth - border - padding = 960 - 4 - 40 = 916px
        // To get the intended canvas size (960px), we add padding back: 916 + 40 = 956px
        // But we want 960px, so we need to add border too: 916 + 40 + 4 = 960px
        // Minimum card width is 320px, so minimum canvas size accounting for padding/border
        const cardPadding = 40; // 20px each side = 40px total (spacing.5)
        const cardBorder = 4; // 2px each side = 4px total
        const containerWidth = container.clientWidth || 0;
        const minCardWidth = 320;
        const minCanvasSize = Math.max(0, minCardWidth - cardPadding - cardBorder); // 276px minimum canvas
        // Calculate canvas size: container width, clamped between min (276px) and max (960px)
        size = Math.min(960, Math.max(minCanvasSize, containerWidth));
      }
      
      // Resize the canvas - this may trigger p5.js to call windowResized internally
      // but our flag will prevent recursive calls
      p.resizeCanvas(size, size);
      
      // Reset flag after resize completes
      requestAnimationFrame(() => {
        isResizing = false;
      });
    };

    // Wrapper for p5.js windowResized (must accept UIEvent for Zod validation)
    // p5.js validates the function signature at runtime using Zod
    // The function MUST accept UIEvent (required, not optional) to pass Zod validation
    // However, p5.js may call it without an event in some cases (e.g., from resizeCanvas)
    // When p5.js calls resizeCanvas, it internally calls windowResized without an event,
    // causing Zod validation errors. We can't prevent this, but we can prevent recursive calls.
    function windowResizedHandler(_event: UIEvent) {
      // If we're already resizing (from performResize), don't call performResize again
      // This prevents infinite loops when p5.js calls windowResized from resizeCanvas
      if (!isResizing) {
        performResize();
      }
    }
    
    // Assign the handler - p5.js will validate the signature
    p.windowResized = windowResizedHandler;
    
    // Watch container for size changes (triggers when layout changes cause container to resize)
    // This ensures canvas resizes even when window doesn't resize but container does
    if (typeof ResizeObserver !== 'undefined') {
      const containerResizeObserver = new ResizeObserver(() => {
        // Small delay to ensure layout has settled
        setTimeout(() => {
          performResize();
        }, 50);
      });
      containerResizeObserver.observe(container);
      
      // Store observer for cleanup
      if (hasResizeObserver(container)) {
        container._resizeObserver = containerResizeObserver;
      } else {
        // Type assertion needed for initial assignment
        (container as HTMLElementWithResizeObserver)._resizeObserver = containerResizeObserver;
      }
    }
    
    // Also resize on fullscreen changes
    const handleFullscreenChange = () => {
      // Use a longer delay to ensure browser has updated dimensions
      setTimeout(() => {
        performResize();
      }, 200);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    p.draw = () => {
      const drawSize = Math.min(p.width, p.height);
      const offsetX = (p.width - drawSize) / 2;
      const offsetY = (p.height - drawSize) / 2;
      // CRITICAL: Use getter function to always read current state
      // This ensures we always read from the current state object, even after HMR module reloads
      // The closure captures the getState function, which always returns the current state
      const currentState = getState();
      const motionScale = clamp(currentState.motionIntensity / 100, 0, 1.5);
      const deltaMs = typeof p.deltaTime === "number" ? p.deltaTime : 16.666;
      // Delta time for time-based effects
      (p as P5WithCanvas).deltaMs = deltaMs;
      const backgroundHueShiftDegrees = (currentState.backgroundHueShift / 100) * 360;
      const MOTION_SPEED_MAX_INTERNAL = 12.5;
      // Apply mode-specific speed multiplier to normalize perceived speed across modes
      // Higher multiplier = slower animation (divide to slow down)
      const modeSpeedMultiplier = MOVEMENT_SPEED_MULTIPLIERS[currentState.movementMode] ?? 1.0;
      const baseSpeedFactor = Math.max(currentState.motionSpeed / MOTION_SPEED_MAX_INTERNAL, 0);
      targetSpeedFactor = baseSpeedFactor / modeSpeedMultiplier;
      
      // Accumulate base time at constant rate
      const deltaTime = deltaMs / 16.666;
      animationTime += deltaTime;
      
      // Smoothly interpolate speed factor to prevent jiggling
      // Use a very fast lerp (0.95) for near-instant but smooth transitions
      const speedLerpRate = 0.95;
      const previousSpeedFactor = currentSpeedFactor;
      currentSpeedFactor = lerp(currentSpeedFactor, targetSpeedFactor, speedLerpRate);
      
      // Accumulate scaled time using the interpolated speed factor
      // Use the average of previous and current speed for this frame to ensure smoothness
      const averageSpeedFactor = (previousSpeedFactor + currentSpeedFactor) / 2;
      scaledAnimationTime += deltaTime * averageSpeedFactor;
      // Loop override: force time to wrap for seamless looping (and optional deterministic stepping)
      if (loopOverrideRef.enabled) {
        const period = Math.max(0.25, loopOverrideRef.periodSeconds);
        if (loopOverrideRef.useFrameIndex && loopOverrideRef.totalFrames > 0) {
          // Deterministic time for a specific frame index (exclude last frame to avoid duplicate)
          const t = (loopOverrideRef.frameIndex % loopOverrideRef.totalFrames) / loopOverrideRef.totalFrames;
          scaledAnimationTime = t * period;
        } else {
          // Realtime recording: wrap time modulo period
          scaledAnimationTime = scaledAnimationTime % period;
        }
      }
      
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = false;
      const backgroundBrightness = clamp(currentState.backgroundBrightness, 0, 100);
      const resolveBackgroundPaletteId = () =>
        currentState.backgroundMode === "auto" ? currentState.paletteId : currentState.backgroundMode;
      const applyCanvasAdjustments = (hex: string) =>
        applyHueAndBrightness(hex, backgroundHueShiftDegrees, backgroundBrightness);
      
      // Handle canvas background (gradient or solid)
      if (currentState.canvasFillMode === "gradient") {
        // Calculate gradient line for full canvas
        const gradientLine = calculateGradientLine(
          currentState.canvasGradientDirection,
          p.width,
          p.height,
        );
        const gradient = ctx.createLinearGradient(
          gradientLine.x0,
          gradientLine.y0,
          gradientLine.x1,
          gradientLine.y1,
        );

        const resolveGradientPaletteId = () => {
          if (currentState.canvasGradientMode === "auto") {
            return resolveBackgroundPaletteId();
          }
          return currentState.canvasGradientMode;
        };
        const gradientPalette = getPalette(resolveGradientPaletteId());
        const gradientSourceColors =
          gradientPalette.colors.length > 0
            ? gradientPalette.colors.slice(0, 3)
            : [prepared.background];
        const gradientColors = gradientSourceColors
          .map((color) => applyCanvasAdjustments(color))
          .filter(Boolean);

        const usableGradientColors =
          gradientColors.length > 1
            ? gradientColors
            : gradientColors.length === 1
            ? [...gradientColors, gradientColors[0]]
            : [prepared.background, prepared.background];

        usableGradientColors.forEach((color, index) => {
          const stop =
            usableGradientColors.length > 1
              ? index / (usableGradientColors.length - 1)
              : 0;
          gradient.addColorStop(stop, color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, p.width, p.height);
      } else {
        // Solid background
        p.background(prepared.background);
      }

      const blendMap: Record<BlendModeKey, p5.BLEND_MODE> = {
        NONE: p.BLEND,
        MULTIPLY: p.MULTIPLY,
        SCREEN: p.SCREEN,
        HARD_LIGHT: p.HARD_LIGHT ?? p.OVERLAY,
        OVERLAY: p.OVERLAY,
        SOFT_LIGHT: p.SOFT_LIGHT ?? p.OVERLAY,
        DARKEST: p.DARKEST ?? p.BLEND,
        LIGHTEST: p.LIGHTEST ?? p.BLEND,
      };

      // Depth of field setup
      const MAX_BLUR_RADIUS = 48; // Maximum blur radius in pixels
      // Increased threshold to skip blur for more sprites (performance optimization at high density)
      // At 10% threshold, sprites within 10% of focus plane distance won't get blur applied
      // This significantly improves performance when DoF is enabled with many tiles
      const DOF_THRESHOLD = 0.1; // 10% threshold to skip blur for sprites close to focus
      let minSize = Infinity;
      let maxSize = 0;
      
      // First pass: collect all sprite sizes to determine z-index range
      if (currentState.depthOfFieldEnabled) {
        prepared.layers.forEach((layer, layerIndex) => {
          if (layer.tiles.length === 0) {
            return;
          }
          const baseLayerSize = drawSize * layer.baseSizeRatio;
          
          layer.tiles.forEach((tile, tileIndex) => {
            if (tile.kind === "shape" || tile.kind === "svg") {
              const baseSpriteSize =
                baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
              const movement = computeMovementOffsets(currentState.movementMode, {
                time: scaledAnimationTime * tile.animationTimeMultiplier,
                phase: tileIndex * 7, // Use actual tile phase for accurate size calculation
                motionScale,
                layerIndex,
                baseUnit: baseSpriteSize,
                layerTileSize: baseLayerSize,
                speedFactor: 1.0,
              });
              const spriteSize = baseSpriteSize * movement.scaleMultiplier;
              minSize = Math.min(minSize, spriteSize);
              maxSize = Math.max(maxSize, spriteSize);
            }
          });
        });
      }
      
      const sizeRange = maxSize - minSize;
      // Only enable DoF if we have a valid size range and DoF is enabled
      const hasValidSizeRange = sizeRange > 0 && isFinite(minSize) && isFinite(maxSize);
      const focusZ = currentState.depthOfFieldEnabled && hasValidSizeRange
        ? lerp(0, 1, currentState.depthOfFieldFocus / 100) // Normalized focus (0-1)
        : 0.5;
      const maxBlur = currentState.depthOfFieldEnabled && hasValidSizeRange
        ? (currentState.depthOfFieldStrength / 100) * MAX_BLUR_RADIUS
        : 0;

      prepared.layers.forEach((layer, layerIndex) => {
        if (layer.tiles.length === 0) {
          return;
        }
        const baseLayerSize = drawSize * layer.baseSizeRatio;

        p.push();
        layer.tiles.forEach((tile, tileIndex) => {
          // Use currentState.blendMode when blendModeAuto is false, otherwise use stored tile/layer blend mode
          const tileBlendMode = currentState.blendModeAuto
            ? (tile.blendMode ?? layer.blendMode)
            : currentState.blendMode;
          p.blendMode(blendMap[tileBlendMode] ?? p.BLEND);
          
          // Calculate movement offsets
          // Normal wrapping for all modes - calculate first
          let normalizedU = ((tile.u % 1) + 1) % 1;
          let normalizedV = ((tile.v % 1) + 1) % 1;
          let movement = { offsetX: 0, offsetY: 0, scaleMultiplier: 1 };
          
          if (tile.kind === "shape") {
            const baseShapeSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            movement = computeMovementOffsets(currentState.movementMode, {
              time: scaledAnimationTime * tile.animationTimeMultiplier, // Use smoothly accumulating scaled time with per-tile variation
              phase: tileIndex * 7,
              motionScale,
              layerIndex,
              baseUnit: baseShapeSize,
              layerTileSize: baseLayerSize,
              speedFactor: 1.0, // Speed is already applied to scaledAnimationTime
            });
            
            const baseX = offsetX + normalizedU * drawSize + movement.offsetX;
            const baseY = offsetY + normalizedV * drawSize + movement.offsetY;
            
            const finalMovement = movement;
            const shapeSize = baseShapeSize * finalMovement.scaleMultiplier;
            // Use currentState.layerOpacity directly instead of stored layer.opacity for dynamic updates
            const opacityValue = clamp(currentState.layerOpacity / 100, 0.12, 1);
            const opacityAlpha = Math.round(opacityValue * 255);

            // Calculate depth of field blur
            let blurAmount = 0;
            if (currentState.depthOfFieldEnabled && hasValidSizeRange && maxBlur > 0) {
              // Calculate normalized z-index from size (0 = smallest, 1 = largest)
              const normalizedZ = sizeRange > 0 ? (shapeSize - minSize) / sizeRange : 0.5;
              // Calculate distance from focus plane
              const distance = Math.abs(normalizedZ - focusZ);
              // Calculate blur using quadratic falloff
              const normalizedDist = distance; // Already normalized (0-1)
              blurAmount = Math.pow(normalizedDist, 2) * maxBlur;
              // Skip blur if very close to focus (performance optimization)
              if (blurAmount < DOF_THRESHOLD * maxBlur) {
                blurAmount = 0;
              }
            }

            p.push();
            
            // Apply blur filter if needed
            if (blurAmount > 0) {
              ctx.filter = `blur(${blurAmount}px)`;
            } else {
              ctx.filter = 'none';
            }
            const halfSize = shapeSize / 2;
            const allowableOverflow = Math.max(drawSize * 0.6, shapeSize * 1.25);
            
            // Clamp positions to canvas bounds with overflow allowance
            // Note: baseX/baseY already includes movement.offsetX/offsetY, so don't add it again
            const clampedX = clamp(
              baseX,
              offsetX + halfSize - allowableOverflow,
              offsetX + drawSize - halfSize + allowableOverflow,
            );
            const clampedY = clamp(
              baseY,
              offsetY + halfSize - allowableOverflow,
              offsetY + drawSize - halfSize + allowableOverflow,
            );
            p.translate(clampedX, clampedY);
            const rotationTime = scaledAnimationTime; // Use smoothly accumulating scaled time
            // Recalculate rotation speed dynamically from currentState (no regeneration needed)
            const rotationSpeedBase = clamp(currentState.rotationSpeed, 0, 100) / 100;
            const rotationSpeed = currentState.rotationAnimated && rotationSpeedBase > 0
              ? rotationSpeedBase * ROTATION_SPEED_MAX * tile.rotationSpeedMultiplier
              : 0;
            // Recalculate rotation base dynamically from currentState (no regeneration needed)
            const rotationRange = degToRad(clamp(currentState.rotationAmount, 0, MAX_ROTATION_DEGREES));
            const rotationBase = rotationRange * tile.rotationBaseMultiplier;
            const rotationAngle =
              (currentState.rotationEnabled ? rotationBase : 0) +
              rotationSpeed * tile.rotationDirection * rotationTime;
            if (rotationAngle !== 0) {
              p.rotate(rotationAngle);
            }
            
            // Determine if we should use canvas context for gradients
            const useGradient = currentState.spriteFillMode === "gradient";
            let gradientObj: CanvasGradient | null = null;
            
            if (useGradient) {
              // Use the palette color index to select the corresponding gradient
              // This ensures sprite using palette color 'b' uses gradient 'b'
              const paletteGradients = getGradientsForPalette(currentState.paletteId);
              if (paletteGradients.length > 0) {
                const gradientIndex = tile.paletteColorIndex % paletteGradients.length;
                const gradientPreset = paletteGradients[gradientIndex];
                if (gradientPreset) {
                  // Apply hue shift and variance to gradient colors
                  const hueShiftDegrees = ((currentState.hueShift ?? 0) / 100) * 360;
                  const variance = clamp((currentState.paletteVariance ?? 68) / 100, 0, 1.5);
                  
                  // Apply hue shift and variance to each gradient color
                  const processedGradientColors = gradientPreset.colors.map((color, colorIndex) => {
                    // Apply hue shift first
                    const hueShiftedColor = shiftHue(color, hueShiftDegrees);
                    // Then apply variance using deterministic RNG based on tile position and color index
                    const varianceRng = createMulberry32(hashSeed(`${currentState.seed}-color-${tile.u}-${tile.v}-${colorIndex}`));
                    return jitterColor(hueShiftedColor, variance, varianceRng);
                  });
                  
                  // Calculate gradient line based on direction
                  const gradientLine = calculateGradientLine(
                    currentState.spriteGradientDirection,
                    shapeSize,
                    shapeSize,
                  );
                  // Create gradient relative to shape center (we're already translated)
                  gradientObj = ctx.createLinearGradient(
                    gradientLine.x0 - shapeSize / 2,
                    gradientLine.y0 - shapeSize / 2,
                    gradientLine.x1 - shapeSize / 2,
                    gradientLine.y1 - shapeSize / 2,
                  );
                  // Add color stops with opacity, using processed colors
                  const numColors = processedGradientColors.length;
                  processedGradientColors.forEach((color, index) => {
                    const stop = numColors > 1 ? index / (numColors - 1) : 0;
                    const colorObj = p.color(color);
                    colorObj.setAlpha(opacityAlpha);
                    gradientObj!.addColorStop(stop, colorObj.toString());
                  });
                  ctx.fillStyle = gradientObj;
                }
              }
            }
            
            if (!useGradient || !gradientObj) {
              // Solid color fill
              const fillColor = p.color(tile.tint);
              fillColor.setAlpha(opacityAlpha);
              p.fill(fillColor);
            }
            
            p.noStroke();

            // Draw shapes using canvas context if gradient, otherwise use p5
            if (useGradient && gradientObj) {
              ctx.save();
              ctx.beginPath();
              
              let path2DFilled = false; // Track if Path2D was filled directly
              
              switch (tile.shape) {
                case "rounded": {
                  const cornerRadius = shapeSize * 0.3;
                  const x = -shapeSize / 2;
                  const y = -shapeSize / 2;
                  ctx.roundRect(x, y, shapeSize, shapeSize, cornerRadius);
                  break;
                }
                case "circle":
                  ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
                  break;
                case "square":
                  ctx.rect(-shapeSize / 2, -shapeSize / 2, shapeSize, shapeSize);
                  break;
                case "triangle": {
                  const height = (Math.sqrt(3) / 2) * shapeSize;
                  const yOffset = height / 3;
                  ctx.moveTo(-halfSize, yOffset);
                  ctx.lineTo(halfSize, yOffset);
                  ctx.lineTo(0, yOffset - height);
                  ctx.closePath();
                  break;
                }
                case "hexagon": {
                  const radius = halfSize;
                  for (let k = 0; k < 6; k += 1) {
                    const angle = Math.PI * 2 * (k / 6) - Math.PI / 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (k === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  break;
                }
                case "ring": {
                  const strokeWeight = Math.max(1.5, shapeSize * 0.18);
                  const wobble =
                    Math.sin((tileIndex + p.frameCount) * 0.03 + layerIndex) *
                    0.35;
                  if (gradientObj) {
                    ctx.strokeStyle = gradientObj;
                  } else {
                    const strokeColor = p.color(tile.tint);
                    strokeColor.setAlpha(opacityAlpha);
                    ctx.strokeStyle = strokeColor.toString();
                  }
                  ctx.lineWidth = strokeWeight;
                  ctx.rotate(wobble);
                  ctx.beginPath();
                  ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
                  ctx.stroke();
                  break;
                }
                case "diamond": {
                  ctx.moveTo(0, -halfSize);
                  ctx.lineTo(halfSize, 0);
                  ctx.lineTo(0, halfSize);
                  ctx.lineTo(-halfSize, 0);
                  ctx.closePath();
                  break;
                }
                case "star": {
                  const outer = halfSize;
                  const inner = outer * 0.45;
                  for (let k = 0; k < 10; k += 1) {
                    const angle = Math.PI * 2 * (k / 10) - Math.PI / 2;
                    const radius = k % 2 === 0 ? outer : inner;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (k === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  break;
                }
                case "line": {
                  const length = shapeSize * 36;
                  const thickness = Math.max(2, shapeSize * 0.12);
                  ctx.rect(-length / 2, -thickness / 2, length, thickness);
                  break;
                }
                case "pentagon": {
                  const radius = halfSize;
                  for (let k = 0; k < 5; k += 1) {
                    const angle = Math.PI * 2 * (k / 5) - Math.PI / 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (k === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  break;
                }
                case "asterisk": {
                  // Asterisk shape - use SVG path with Path2D
                  // Original viewBox: 0 0 16 16
                  const asteriskPath = "M15.9 5.7l-2-3.4-3.9 2.2v-4.5h-4v4.5l-4-2.2-2 3.4 3.9 2.3-3.9 2.3 2 3.4 4-2.2v4.5h4v-4.5l3.9 2.2 2-3.4-4-2.3z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 16;
                  const vbHeight = 16;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(asteriskPath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "cross": {
                  // Cross shape - use SVG path with Path2D
                  // Original viewBox: 0 0 16 16
                  const crossPath = "M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 16;
                  const vbHeight = 16;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(crossPath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "pixels": {
                  // 4x4 grid of squares - matches SVG pattern (viewBox 0 0 17 17)
                  // 16 squares, each 3 units, with 1 unit gaps
                  const gridSize = 4;
                  const squareSize = shapeSize / 17 * 3; // Scale from 17x17 viewBox
                  const gap = shapeSize / 17 * 1; // 1 unit gap
                  const startOffset = -(gridSize * squareSize + (gridSize - 1) * gap) / 2;
                  
                  for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                      const x = startOffset + col * (squareSize + gap) + squareSize / 2;
                      const y = startOffset + row * (squareSize + gap) + squareSize / 2;
                      ctx.rect(x - squareSize / 2, y - squareSize / 2, squareSize, squareSize);
                    }
                  }
                  break;
                }
                case "heart": {
                  // Heart shape from Clarity Design System - use SVG path with Path2D
                  // Original viewBox: 0 0 36 36
                  const heartPath = "M33,7.64c-1.34-2.75-5.2-5-9.69-3.69A9.87,9.87,0,0,0,18,7.72a9.87,9.87,0,0,0-5.31-3.77C8.19,2.66,4.34,4.89,3,7.64c-1.88,3.85-1.1,8.18,2.32,12.87C8,24.18,11.83,27.9,17.39,32.22a1,1,0,0,0,1.23,0c5.55-4.31,9.39-8,12.07-11.71C34.1,15.82,34.88,11.49,33,7.64Z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 36;
                  const vbHeight = 36;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(heartPath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "snowflake": {
                  // Snowflake shape - use SVG path with Path2D
                  // Original viewBox: 0 0 24 24
                  const snowflakePath = "M21.16,16.13l-2-1.15.89-.24a1,1,0,1,0-.52-1.93l-2.82.76L14,12l2.71-1.57,2.82.76.26,0a1,1,0,0,0,.26-2L19.16,9l2-1.15a1,1,0,0,0-1-1.74L18,7.37l.3-1.11a1,1,0,1,0-1.93-.52l-.82,3L13,10.27V7.14l2.07-2.07a1,1,0,0,0,0-1.41,1,1,0,0,0-1.42,0L13,4.31V2a1,1,0,0,0-2,0V4.47l-.81-.81a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41L11,7.3v3L8.43,8.78l-.82-3a1,1,0,1,0-1.93.52L6,7.37,3.84,6.13a1,1,0,0,0-1,1.74L4.84,9,4,9.26a1,1,0,0,0,.26,2l.26,0,2.82-.76L10,12,7.29,13.57l-2.82-.76A1,1,0,1,0,4,14.74l.89.24-2,1.15a1,1,0,0,0,1,1.74L6,16.63l-.3,1.11A1,1,0,0,0,6.39,19a1.15,1.15,0,0,0,.26,0,1,1,0,0,0,1-.74l.82-3L11,13.73v3.13L8.93,18.93a1,1,0,0,0,0,1.41,1,1,0,0,0,.71.3,1,1,0,0,0,.71-.3l.65-.65V22a1,1,0,0,0,2,0V19.53l.81.81a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.41L13,16.7v-3l2.57,1.49.82,3a1,1,0,0,0,1,.74,1.15,1.15,0,0,0,.26,0,1,1,0,0,0,.71-1.23L18,16.63l2.14,1.24a1,1,0,1,0,1-1.74Z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 24;
                  const vbHeight = 24;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(snowflakePath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "smiley": {
                  // Smiley face - use SVG path with Path2D
                  // Original viewBox: 0 0 256 256
                  const smileyPath = "M128,24A104,104,0,1,0,232,128,104.12041,104.12041,0,0,0,128,24Zm36,72a12,12,0,1,1-12,12A12.0006,12.0006,0,0,1,164,96ZM92,96a12,12,0,1,1-12,12A12.0006,12.0006,0,0,1,92,96Zm84.50488,60.00293a56.01609,56.01609,0,0,1-97.00976.00049,8.00016,8.00016,0,1,1,13.85058-8.01074,40.01628,40.01628,0,0,0,69.30957-.00049,7.99974,7.99974,0,1,1,13.84961,8.01074Z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 256;
                  const vbHeight = 256;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(smileyPath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "tree": {
                  // Tree shape - use SVG path with Path2D
                  // Original viewBox: 0 0 256 256
                  const treePath = "M231.18652,195.51465A7.9997,7.9997,0,0,1,224,200H136v40a8,8,0,0,1-16,0V200H32a7.99958,7.99958,0,0,1-6.31445-12.91113L71.64258,128H48a8.00019,8.00019,0,0,1-6.34082-12.87793l80-104a8,8,0,0,1,12.68164,0l80,104A8.00019,8.00019,0,0,1,208,128H184.35742l45.957,59.08887A7.99813,7.99813,0,0,1,231.18652,195.51465Z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 256;
                  const vbHeight = 256;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(treePath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "x": {
                  // X shape - use SVG path with Path2D
                  // Original viewBox: 0 0 1920 1920
                  const xPath = "M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 1920;
                  const vbHeight = 1920;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(xPath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                case "arrow": {
                  // Arrow shape - use SVG path with Path2D
                  // Original viewBox: 0 0 385.756 385.756
                  const arrowPath = "M377.816,7.492C372.504,2.148,366.088,0,358.608,0H98.544c-15.44,0-29.08,10.988-29.08,26.428v23.724c0,15.44,13.64,29.848,29.08,29.848h152.924L8.464,322.08c-5.268,5.272-8.172,11.84-8.176,19.34c0,7.5,2.908,14.296,8.176,19.568L25.24,377.64c5.264,5.272,12.296,8.116,19.796,8.116s13.768-2.928,19.036-8.2l241.392-242.172v151.124c0,15.444,14.084,29.492,29.52,29.492h23.732c15.432,0,26.752-14.048,26.752-29.492V26.52C385.464,19.048,383.144,12.788,377.816,7.492z";
                  const vbX = 0;
                  const vbY = 0;
                  const vbWidth = 385.756;
                  const vbHeight = 385.756;
                  const scaleX = shapeSize / vbWidth;
                  const scaleY = shapeSize / vbHeight;
                  
                  ctx.save();
                  ctx.translate(-shapeSize / 2, -shapeSize / 2);
                  ctx.scale(scaleX, scaleY);
                  ctx.translate(-vbX, -vbY);
                  const path = new Path2D(arrowPath);
                  ctx.fill(path);
                  ctx.restore();
                  path2DFilled = true;
                  break;
                }
                default:
                  ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
              }
              
              // Only fill if we didn't fill Path2D directly
              if (!path2DFilled) {
                ctx.fill();
              }
              ctx.restore();
            } else {
              // Use p5.js for solid colors - but we can still use Path2D via canvas context
              // Access canvas context from p5.js
              const p5Ctx = p.drawingContext as CanvasRenderingContext2D;
              // Set fill style for Path2D shapes
              const fillColor = p.color(tile.tint);
              fillColor.setAlpha(opacityAlpha);
              p5Ctx.fillStyle = fillColor.toString();
              let path2DFilled = false;
              
              switch (tile.shape) {
              case "rounded": {
                const cornerRadius = shapeSize * 0.3;
                p.rectMode(p.CENTER);
                p.rect(0, 0, shapeSize, shapeSize, cornerRadius);
                break;
              }
              case "circle":
                p.circle(0, 0, shapeSize);
                break;
              case "square":
                p.rectMode(p.CENTER);
                p.rect(0, 0, shapeSize, shapeSize);
                break;
              case "triangle": {
                const height = (Math.sqrt(3) / 2) * shapeSize;
                const yOffset = height / 3;
                p.triangle(
                  -halfSize,
                  yOffset,
                  halfSize,
                  yOffset,
                  0,
                  yOffset - height,
                );
                break;
              }
              case "hexagon": {
                const radius = halfSize;
                p.beginShape();
                for (let k = 0; k < 6; k += 1) {
                  const angle = p.TWO_PI * (k / 6) - p.HALF_PI;
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                p.endShape(p.CLOSE);
                break;
              }
              case "ring": {
                const strokeWeight = Math.max(1.5, shapeSize * 0.18);
                const wobble =
                  Math.sin((tileIndex + p.frameCount) * 0.03 + layerIndex) *
                  0.35;
                p.noFill();
                const strokeColor = p.color(tile.tint);
                strokeColor.setAlpha(opacityAlpha);
                p.stroke(strokeColor);
                p.strokeWeight(strokeWeight);
                p.rotate(wobble);
                p.circle(0, 0, shapeSize);
                p.noStroke();
                break;
              }
              case "diamond": {
                p.beginShape();
                p.vertex(0, -halfSize);
                p.vertex(halfSize, 0);
                p.vertex(0, halfSize);
                p.vertex(-halfSize, 0);
                p.endShape(p.CLOSE);
                break;
              }
              case "star": {
                const outer = halfSize;
                const inner = outer * 0.45;
                p.beginShape();
                for (let k = 0; k < 10; k += 1) {
                  const angle = p.TWO_PI * (k / 10) - p.HALF_PI;
                  const radius = k % 2 === 0 ? outer : inner;
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                p.endShape(p.CLOSE);
                break;
              }
              case "line": {
                const length = shapeSize * 36;
                const thickness = Math.max(2, shapeSize * 0.12);
                p.rectMode(p.CENTER);
                p.rect(0, 0, length, thickness);
                break;
              }
              case "pentagon": {
                const radius = halfSize;
                p.beginShape();
                for (let k = 0; k < 5; k += 1) {
                  const angle = p.TWO_PI * (k / 5) - p.HALF_PI;
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                p.endShape(p.CLOSE);
                break;
              }
              case "asterisk": {
                // Asterisk shape - use SVG path with Path2D (same as Canvas 2D)
                const asteriskPath = "M15.9 5.7l-2-3.4-3.9 2.2v-4.5h-4v4.5l-4-2.2-2 3.4 3.9 2.3-3.9 2.3 2 3.4 4-2.2v4.5h4v-4.5l3.9 2.2 2-3.4-4-2.3z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 16;
                const vbHeight = 16;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(asteriskPath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "cross": {
                // Cross shape - use SVG path with Path2D (same as Canvas 2D)
                const crossPath = "M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 16;
                const vbHeight = 16;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(crossPath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "pixels": {
                // 4x4 grid of squares - matches SVG pattern (viewBox 0 0 17 17)
                // 16 squares, each 3 units, with 1 unit gaps
                const gridSize = 4;
                const squareSize = shapeSize / 17 * 3; // Scale from 17x17 viewBox
                const gap = shapeSize / 17 * 1; // 1 unit gap
                const startOffset = -(gridSize * squareSize + (gridSize - 1) * gap) / 2;
                
                p.rectMode(p.CORNER);
                for (let row = 0; row < gridSize; row++) {
                  for (let col = 0; col < gridSize; col++) {
                    const x = startOffset + col * (squareSize + gap);
                    const y = startOffset + row * (squareSize + gap);
                    p.rect(x, y, squareSize, squareSize);
                  }
                }
                p.rectMode(p.CENTER);
                break;
              }
              case "heart": {
                // Heart shape - use SVG path with Path2D (same as Canvas 2D)
                const heartPath = "M33,7.64c-1.34-2.75-5.2-5-9.69-3.69A9.87,9.87,0,0,0,18,7.72a9.87,9.87,0,0,0-5.31-3.77C8.19,2.66,4.34,4.89,3,7.64c-1.88,3.85-1.1,8.18,2.32,12.87C8,24.18,11.83,27.9,17.39,32.22a1,1,0,0,0,1.23,0c5.55-4.31,9.39-8,12.07-11.71C34.1,15.82,34.88,11.49,33,7.64Z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 36;
                const vbHeight = 36;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(heartPath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "snowflake": {
                // Snowflake shape - use SVG path with Path2D (same as Canvas 2D)
                const snowflakePath = "M21.16,16.13l-2-1.15.89-.24a1,1,0,1,0-.52-1.93l-2.82.76L14,12l2.71-1.57,2.82.76.26,0a1,1,0,0,0,.26-2L19.16,9l2-1.15a1,1,0,0,0-1-1.74L18,7.37l.3-1.11a1,1,0,1,0-1.93-.52l-.82,3L13,10.27V7.14l2.07-2.07a1,1,0,0,0,0-1.41,1,1,0,0,0-1.42,0L13,4.31V2a1,1,0,0,0-2,0V4.47l-.81-.81a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41L11,7.3v3L8.43,8.78l-.82-3a1,1,0,1,0-1.93.52L6,7.37,3.84,6.13a1,1,0,0,0-1,1.74L4.84,9,4,9.26a1,1,0,0,0,.26,2l.26,0,2.82-.76L10,12,7.29,13.57l-2.82-.76A1,1,0,1,0,4,14.74l.89.24-2,1.15a1,1,0,0,0,1,1.74L6,16.63l-.3,1.11A1,1,0,0,0,6.39,19a1.15,1.15,0,0,0,.26,0,1,1,0,0,0,1-.74l.82-3L11,13.73v3.13L8.93,18.93a1,1,0,0,0,0,1.41,1,1,0,0,0,.71.3,1,1,0,0,0,.71-.3l.65-.65V22a1,1,0,0,0,2,0V19.53l.81.81a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.41L13,16.7v-3l2.57,1.49.82,3a1,1,0,0,0,1,.74,1.15,1.15,0,0,0,.26,0,1,1,0,0,0,.71-1.23L18,16.63l2.14,1.24a1,1,0,1,0,1-1.74Z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 24;
                const vbHeight = 24;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(snowflakePath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "smiley": {
                // Smiley face - use SVG path with Path2D (same as Canvas 2D)
                const smileyPath = "M128,24A104,104,0,1,0,232,128,104.12041,104.12041,0,0,0,128,24Zm36,72a12,12,0,1,1-12,12A12.0006,12.0006,0,0,1,164,96ZM92,96a12,12,0,1,1-12,12A12.0006,12.0006,0,0,1,92,96Zm84.50488,60.00293a56.01609,56.01609,0,0,1-97.00976.00049,8.00016,8.00016,0,1,1,13.85058-8.01074,40.01628,40.01628,0,0,0,69.30957-.00049,7.99974,7.99974,0,1,1,13.84961,8.01074Z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 256;
                const vbHeight = 256;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(smileyPath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "tree": {
                // Tree shape - use SVG path with Path2D (same as Canvas 2D)
                const treePath = "M231.18652,195.51465A7.9997,7.9997,0,0,1,224,200H136v40a8,8,0,0,1-16,0V200H32a7.99958,7.99958,0,0,1-6.31445-12.91113L71.64258,128H48a8.00019,8.00019,0,0,1-6.34082-12.87793l80-104a8,8,0,0,1,12.68164,0l80,104A8.00019,8.00019,0,0,1,208,128H184.35742l45.957,59.08887A7.99813,7.99813,0,0,1,231.18652,195.51465Z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 256;
                const vbHeight = 256;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(treePath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "x": {
                // X shape - use SVG path with Path2D (same as Canvas 2D)
                const xPath = "M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 1920;
                const vbHeight = 1920;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(xPath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              case "arrow": {
                // Arrow shape - use SVG path with Path2D (same as Canvas 2D)
                const arrowPath = "M377.816,7.492C372.504,2.148,366.088,0,358.608,0H98.544c-15.44,0-29.08,10.988-29.08,26.428v23.724c0,15.44,13.64,29.848,29.08,29.848h152.924L8.464,322.08c-5.268,5.272-8.172,11.84-8.176,19.34c0,7.5,2.908,14.296,8.176,19.568L25.24,377.64c5.264,5.272,12.296,8.116,19.796,8.116s13.768-2.928,19.036-8.2l241.392-242.172v151.124c0,15.444,14.084,29.492,29.52,29.492h23.732c15.432,0,26.752-14.048,26.752-29.492V26.52C385.464,19.048,383.144,12.788,377.816,7.492z";
                const vbX = 0;
                const vbY = 0;
                const vbWidth = 385.756;
                const vbHeight = 385.756;
                const scaleX = shapeSize / vbWidth;
                const scaleY = shapeSize / vbHeight;
                
                p5Ctx.save();
                p5Ctx.translate(-shapeSize / 2, -shapeSize / 2);
                p5Ctx.scale(scaleX, scaleY);
                p5Ctx.translate(-vbX, -vbY);
                const path = new Path2D(arrowPath);
                p5Ctx.fill(path);
                p5Ctx.restore();
                path2DFilled = true;
                break;
              }
              default:
                p.circle(0, 0, shapeSize);
              }
            }

            // Reset filter after drawing sprite
            ctx.filter = 'none';
            p.pop();
          } else if (tile.kind === "svg") {
            // SVG sprite rendering
            const baseSvgSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            movement = computeMovementOffsets(currentState.movementMode, {
              time: scaledAnimationTime * tile.animationTimeMultiplier, // Use per-tile animation time variation
              phase: tileIndex * 7,
              motionScale,
              layerIndex,
              baseUnit: baseSvgSize,
              layerTileSize: baseLayerSize,
              speedFactor: 1.0,
            });
            
            const baseX = offsetX + normalizedU * drawSize + movement.offsetX;
            const baseY = offsetY + normalizedV * drawSize + movement.offsetY;
            
            const finalMovement = movement;
            const svgSize = baseSvgSize * finalMovement.scaleMultiplier;
            const opacityValue = clamp(currentState.layerOpacity / 100, 0.12, 1);
            const opacityAlpha = Math.round(opacityValue * 255);

            // Calculate depth of field blur
            let blurAmount = 0;
            if (currentState.depthOfFieldEnabled && hasValidSizeRange && maxBlur > 0) {
              const normalizedZ = sizeRange > 0 ? (svgSize - minSize) / sizeRange : 0.5;
              const distance = Math.abs(normalizedZ - focusZ);
              const normalizedDist = distance;
              blurAmount = Math.pow(normalizedDist, 2) * maxBlur;
              if (blurAmount < DOF_THRESHOLD * maxBlur) {
                blurAmount = 0;
              }
            }

            p.push();
            
            // Apply blur filter if needed
            if (blurAmount > 0) {
              ctx.filter = `blur(${blurAmount}px)`;
            } else {
              ctx.filter = 'none';
            }
            
            const halfSize = svgSize / 2;
            const allowableOverflow = Math.max(drawSize * 0.6, svgSize * 1.25);
            
            // Clamp positions to canvas bounds with overflow allowance
            // Note: baseX/baseY already includes movement.offsetX/offsetY, so don't add it again
            const clampedX = clamp(
              baseX,
              offsetX + halfSize - allowableOverflow,
              offsetX + drawSize - halfSize + allowableOverflow,
            );
            const clampedY = clamp(
              baseY,
              offsetY + halfSize - allowableOverflow,
              offsetY + drawSize - halfSize + allowableOverflow,
            );
            p.translate(clampedX, clampedY);
            
            // Apply rotation
            const rotationTime = scaledAnimationTime;
            const rotationSpeedBase = clamp(currentState.rotationSpeed, 0, 100) / 100;
            const rotationSpeed = currentState.rotationAnimated && rotationSpeedBase > 0
              ? rotationSpeedBase * ROTATION_SPEED_MAX * tile.rotationSpeedMultiplier
              : 0;
            const rotationRange = degToRad(clamp(currentState.rotationAmount, 0, MAX_ROTATION_DEGREES));
            const rotationBase = rotationRange * tile.rotationBaseMultiplier;
            const rotationAngle =
              (currentState.rotationEnabled ? rotationBase : 0) +
              rotationSpeed * tile.rotationDirection * rotationTime;
            if (rotationAngle !== 0) {
              p.rotate(rotationAngle);
            }
            
            // Load and draw SVG image
            // Use synchronous cache lookup - images should be preloaded
            // SVGO processing should have already cleaned up the SVGs to remove frames
            const cachedImg = getCachedSpriteImage(tile.svgPath);
            if (cachedImg) {
              ctx.save();
              ctx.globalAlpha = opacityAlpha / 255;
              
              // SVGs are now processed with tight viewBoxes, so no padding compensation needed
              // The processed SVG has a viewBox that exactly matches the content bounds
              // Use the stored aspect ratio from viewBox to prevent square containers
              // Fallback to natural dimensions if stored ratio isn't available
              let aspectRatio: number;
              if ((cachedImg as any).__svgAspectRatio) {
                // Use stored aspect ratio from viewBox (most accurate)
                aspectRatio = (cachedImg as any).__svgAspectRatio;
              } else {
                // Fallback to natural dimensions
                const naturalWidth = cachedImg.naturalWidth || cachedImg.width || 1;
                const naturalHeight = cachedImg.naturalHeight || cachedImg.height || 1;
                aspectRatio = naturalWidth / naturalHeight;
              }
              
              // Calculate width and height based on aspect ratio
              // Use svgSize as the base size (largest dimension) and scale proportionally
              let scaledWidth = svgSize;
              let scaledHeight = svgSize;
              
              if (aspectRatio > 1) {
                // Wider than tall - width is the base
                scaledHeight = svgSize / aspectRatio;
              } else {
                // Taller than wide (or square) - height is the base
                scaledWidth = svgSize * aspectRatio;
              }
              
              // Render SVG directly using Path2D to avoid square container issues
              // This bypasses Image element rasterization which might create square frames
              const svgPathData = (cachedImg as any).__svgPathData;
              const svgViewBox = (cachedImg as any).__svgViewBox;
              
              if (svgPathData && svgViewBox) {
                // Get viewBox dimensions for scaling
                const vbX = svgViewBox.x || 0;
                const vbY = svgViewBox.y || 0;
                const vbWidth = svgViewBox.width;
                const vbHeight = svgViewBox.height;
                
                // Calculate scale factors to fit within scaledWidth/scaledHeight
                const scaleX = scaledWidth / vbWidth;
                const scaleY = scaledHeight / vbHeight;
                
                // Draw the path directly on canvas
                ctx.globalCompositeOperation = "source-over";
                ctx.fillStyle = tile.tint; // Use tint color directly
                
                // Transform to center and scale the path
                // First translate by negative viewBox origin, then scale, then center
                ctx.save();
                ctx.translate(-scaledWidth / 2, -scaledHeight / 2);
                ctx.scale(scaleX, scaleY);
                ctx.translate(-vbX, -vbY); // Offset by viewBox origin
                
                // Create and fill the path
                const path = new Path2D(svgPathData);
                ctx.fill(path);
                
                ctx.restore();
              } else {
                // Fallback: Draw image if path data not available
                ctx.globalCompositeOperation = "source-over";
                ctx.drawImage(
                  cachedImg, 
                  -scaledWidth / 2, 
                  -scaledHeight / 2, 
                  scaledWidth, 
                  scaledHeight
                );
                
                // Apply tint color using multiply
                ctx.globalCompositeOperation = "multiply";
                ctx.fillStyle = tile.tint;
                ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
              }
              
              // Restore composite operation
              ctx.globalCompositeOperation = "source-over";
              ctx.restore();
            } else {
              // Image not loaded yet - load it asynchronously
              // This will show up on next frame once loaded
              loadSpriteImage(tile.svgPath).catch((error) => {
                console.warn(`Failed to load sprite image: ${tile.svgPath}`, error);
              });
            }
            
            // Reset filter after drawing sprite
            ctx.filter = 'none';
            p.pop();
          }
        });

      p.pop();
    });

      if (p.frameCount % 24 === 0) {
        options.onFrameRate?.(Math.round(p.frameRate()));
      }
    };
  };

  p5Instance = new p5(sketch) as P5WithCanvas;

  const applyState = (
    partial: Partial<GeneratorState>,
    options: { recompute?: boolean } = {},
  ) => {
    const { recompute = true } = options;
    // Update state in the ref object - this ensures all closures see the update
    stateRef.current = { ...stateRef.current, ...partial };
    state = stateRef.current; // Keep local variable in sync
    if (recompute) {
      updateSprite();
    } else {
      notifyState();
    }
  };

  const controller: SpriteController = {
    getState: () => ({ ...stateRef.current }),
    applyState: (newState: GeneratorState) => {
      stateRef.current = { ...newState };
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeAll: () => {
      updateSeed();
      // Preserve rotation settings
      const preserveRotationEnabled = stateRef.current.rotationEnabled;
      const preserveRotationAnimated = stateRef.current.rotationAnimated;
      const preserveRotationAmount = stateRef.current.rotationAmount;
      const preserveRotationSpeed = stateRef.current.rotationSpeed;
      
      const nextMode =
        spriteModePool[Math.floor(Math.random() * spriteModePool.length)];
      stateRef.current.spriteMode = nextMode;
      stateRef.current.paletteId = getRandomPalette().id;
      stateRef.current.scalePercent = randomInt(220, MAX_DENSITY_PERCENT_UI - 60); // Use max minus small buffer
      stateRef.current.scaleBase = randomInt(52, 88);
      stateRef.current.scaleSpread = randomInt(42, 96);
      stateRef.current.paletteVariance = randomInt(32, 128);
      stateRef.current.hueShift = 0;
      stateRef.current.motionIntensity = randomInt(42, 98);
      stateRef.current.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      stateRef.current.backgroundMode = "auto";
      stateRef.current.backgroundHueShift = 0;
      stateRef.current.backgroundBrightness = 50;
      
      // Preserve rotation settings: if both are off, keep off; if either is on, keep on
      if (!preserveRotationEnabled && !preserveRotationAnimated) {
        // Both off - keep off
        stateRef.current.rotationEnabled = false;
        stateRef.current.rotationAnimated = false;
        stateRef.current.rotationAmount = preserveRotationAmount;
        stateRef.current.rotationSpeed = preserveRotationSpeed;
      } else {
        // At least one is on - keep on and preserve slider position
        stateRef.current.rotationEnabled = preserveRotationEnabled;
        stateRef.current.rotationAnimated = preserveRotationAnimated;
        stateRef.current.rotationAmount = preserveRotationAmount;
        stateRef.current.rotationSpeed = preserveRotationSpeed;
      }
      
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeColors: () => {
      updateSeed();
      stateRef.current.paletteId = getRandomPalette().id;
      stateRef.current.paletteVariance = randomInt(32, 126);
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    refreshPaletteApplication: () => {
      // Re-apply the current palette randomly across sprites
      // This keeps the same palette but randomizes which colors are assigned to which sprites
      // We need to regenerate the sprite with a new seed to randomize color assignments
      // The color RNG is based on `${seed}-color`, so updating the seed will change color assignments
      updateSeed();
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeScale: () => {
      stateRef.current.scaleBase = randomInt(50, 88);
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeScaleRange: () => {
      stateRef.current.scaleSpread = randomInt(42, 96);
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeMotion: () => {
      // Preserve rotation settings
      const preserveRotationEnabled = stateRef.current.rotationEnabled;
      const preserveRotationAnimated = stateRef.current.rotationAnimated;
      const preserveRotationAmount = stateRef.current.rotationAmount;
      const preserveRotationSpeed = stateRef.current.rotationSpeed;
      
      stateRef.current.motionIntensity = randomInt(40, 98);
      stateRef.current.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      stateRef.current.motionSpeed = randomInt(5, 12);
      
      // Preserve rotation settings: if both are off, keep off; if either is on, keep on
      if (!preserveRotationEnabled && !preserveRotationAnimated) {
        // Both off - keep off
        stateRef.current.rotationEnabled = false;
        stateRef.current.rotationAnimated = false;
        stateRef.current.rotationAmount = preserveRotationAmount;
        stateRef.current.rotationSpeed = preserveRotationSpeed;
      } else {
        // At least one is on - keep on and preserve slider position
        stateRef.current.rotationEnabled = preserveRotationEnabled;
        stateRef.current.rotationAnimated = preserveRotationAnimated;
        stateRef.current.rotationAmount = preserveRotationAmount;
        stateRef.current.rotationSpeed = preserveRotationSpeed;
      }
      
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeBlendMode: () => {
      if (stateRef.current.blendModeAuto) {
        reassignAutoBlendModes();
        notifyState();
        // Force a redraw to show the updated blend modes
        // The draw loop will pick up the changes from the prepared object
        if (p5Instance) {
          // Ensure the loop is running first
          if (typeof p5Instance.loop === 'function') {
            p5Instance.loop();
          }
          // Then force a redraw
          if (hasRedraw(p5Instance)) {
            // Use requestAnimationFrame to ensure redraw happens after state update
            requestAnimationFrame(() => {
              if (p5Instance && hasRedraw(p5Instance)) {
                p5Instance.redraw();
              }
            });
          }
        }
        return;
      }
      const nextBlend = randomBlendMode();
      stateRef.current.blendMode = nextBlend;
      stateRef.current.previousBlendMode = nextBlend;
      stateRef.current.blendModeAuto = false;
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    randomizeSpriteShapes: () => {
      if (!stateRef.current.randomSprites) {
        // If randomSprites is disabled, enable it and regenerate
        applyState({ randomSprites: true });
        return;
      }
      // Reassign random shapes to existing tiles
      reassignRandomShapes();
      // Force state notification to ensure UI updates
      notifyState();
    },
    setScalePercent: (value: number) => {
      applyState({ scalePercent: clamp(value, 0, MAX_DENSITY_PERCENT_UI) });
    },
    setScaleBase: (value: number) => {
      applyState({ scaleBase: clamp(value, 0, 100) });
    },
    setScaleSpread: (value: number) => {
      applyState({ scaleSpread: clamp(value, 0, 100) });
    },
    setPaletteVariance: (value: number) => {
      // Palette variance affects sprite colors, so regeneration is needed
      // Palette variance can go up to 150 internally, but UI shows 0-100%
      applyState({ paletteVariance: clamp(value, 0, 150) });
    },
    setHueShift: (value: number) => {
      // Hue shift affects sprite colors, so regeneration is needed
      // Hue shift is stored as 0-100 (maps to 0-360 degrees)
      applyState({ hueShift: clamp(value, 0, 100) });
    },
    setMotionIntensity: (value: number) => {
      // Motion intensity is applied directly in rendering, no regeneration needed
      applyState({ motionIntensity: clamp(value, 0, 100) }, { recompute: false });
    },
    setMotionSpeed: (value: number) => {
      applyState({ motionSpeed: clamp(value, 0, 12.5) }, { recompute: false });
    },
    setBlendMode: (mode: BlendModeOption) => {
      // Blend mode is applied directly in rendering (tile.blendMode ?? layer.blendMode ?? state.blendMode)
      // When blendModeAuto is false, state.blendMode is used, so no regeneration needed
      applyState({
        blendModeAuto: false,
        blendMode: mode,
        previousBlendMode: mode,
      }, { recompute: false });
    },
    setBlendModeAuto: (value: boolean) => {
      if (value === stateRef.current.blendModeAuto) {
        return;
      }

      if (value) {
        stateRef.current.blendModeAuto = true;
        state = stateRef.current; // Keep local variable in sync
        notifyState();
        return;
      }

      const fallback = stateRef.current.previousBlendMode ?? stateRef.current.blendMode ?? "NONE";
      stateRef.current.previousBlendMode = fallback;
      stateRef.current.blendModeAuto = false;
      stateRef.current.blendMode = fallback;
      state = stateRef.current; // Keep local variable in sync
      notifyState();
    },
    setLayerOpacity: (value: number) => {
      // Layer opacity is applied directly in rendering, no regeneration needed
      applyState({ layerOpacity: clamp(value, 15, 100) }, { recompute: false });
    },
    setSpriteMode: (mode: SpriteMode) => {
      // Get the current collection ID - if not set, default to primitives
      const collectionId = stateRef.current.spriteCollectionId || "primitives";
      const collection = getCollection(collectionId);
      
      if (!collection) {
        // Collection doesn't exist - fallback to primitives
        const primitivesCollection = getCollection("primitives");
        if (primitivesCollection?.isShapeBased && shapeModes.includes(mode as ShapeMode)) {
          applyState({ spriteCollectionId: "primitives", spriteMode: mode });
        }
        return;
      }
      
      if (collection.isShapeBased) {
        // For primitives, validate it's a shape mode
        if (shapeModes.includes(mode as ShapeMode)) {
          applyState({ spriteMode: mode });
        }
        return;
      }
      
      // For SVG collections, validate the sprite exists in the collection
      const sprite = getSpriteInCollection(collectionId, mode);
      if (sprite) {
        // Sprite found in current collection - update mode
        applyState({ spriteMode: mode });
        return;
      }
      
      // Sprite not found in current collection - try to find it in any collection
      const allCollections = getAllCollections();
      for (const coll of allCollections) {
        if (!coll.isShapeBased) {
          const foundSprite = getSpriteInCollection(coll.id, mode);
          if (foundSprite) {
            // Found it in another collection - switch to that collection and mode
            applyState({ spriteCollectionId: coll.id, spriteMode: mode });
            return;
          }
        }
      }
      
      // Sprite not found anywhere - try to update mode anyway (might be a race condition)
      // The renderer will fall back to the first sprite in the collection if invalid
      applyState({ spriteMode: mode });
    },
    setMovementMode: (mode: MovementMode) => {
      // Movement mode is applied during rendering, no regeneration needed
      applyState({ movementMode: mode }, { recompute: false });
    },
    setRotationEnabled: (value: boolean) => {
      // Don't recompute sprites - rotation offsets are already calculated
      // Just update state so rendering can toggle them on/off
      stateRef.current.rotationEnabled = value;
      state = stateRef.current; // Keep local variable in sync
      notifyState();
    },
    setRotationAmount: (value: number) => {
      applyState({
        rotationAmount: clamp(value, 0, MAX_ROTATION_DEGREES),
        rotationEnabled: true,
      });
    },
    setRotationSpeed: (value: number) => {
      applyState({ rotationSpeed: clamp(value, 0, 100) });
    },
    setRotationAnimated: (value: boolean) => {
      stateRef.current.rotationAnimated = value;
      state = stateRef.current; // Keep local variable in sync
      notifyState();
    },
    usePalette: (paletteId: PaletteId) => {
      if (getPalette(paletteId)) {
        applyState({ paletteId });
      }
    },
    setBackgroundMode: (mode: BackgroundMode) => {
      // Check if mode is valid (auto or a valid palette ID from all palettes including custom)
      if (mode === "auto") {
        applyState({ backgroundMode: mode });
        return;
      }
      // Use getPalette to check if palette exists (includes custom palettes)
      const palette = getPalette(mode);
      if (palette && palette.id === mode) {
        applyState({ backgroundMode: mode });
      }
    },
    setBackgroundHueShift: (value: number) => {
      // Background hue shift affects background color, so regeneration is needed
      // Background hue shift is stored as 0-100 (maps to 0-360 degrees)
      applyState({ backgroundHueShift: clamp(value, 0, 100) });
    },
    setBackgroundBrightness: (value: number) => {
      applyState({ backgroundBrightness: clamp(value, 0, 100) });
    },
    setSpriteFillMode: (mode: "solid" | "gradient") => {
      // Fill mode is applied during rendering, no regeneration needed
      applyState({ spriteFillMode: mode }, { recompute: false });
    },
    setSpriteGradient: (gradientId: string) => {
      // Changing gradient requires regeneration if random is disabled
      applyState({ spriteGradientId: gradientId }, { recompute: !state.spriteGradientRandom });
    },
    setSpriteGradientDirection: (degrees: number) => {
      // Direction is applied in render, no regeneration needed
      applyState({ spriteGradientDirection: clamp(degrees, 0, 360) }, { recompute: false });
    },
    setSpriteGradientRandom: (enabled: boolean) => {
      // Enabling/disabling random requires regeneration
      applyState({ spriteGradientRandom: enabled });
    },
    setSpriteGradientDirectionRandom: (enabled: boolean) => {
      // Enabling/disabling random direction requires regeneration
      applyState({ spriteGradientDirectionRandom: enabled });
    },
    setCanvasFillMode: (mode: "solid" | "gradient") => {
      const updates: Partial<GeneratorState> = { canvasFillMode: mode };
      if (mode === "gradient") {
        updates.canvasGradientMode = "auto";
      }
      // Canvas fill mode is applied in render, no regeneration needed
      applyState(updates, { recompute: false });
    },
    setCanvasGradientMode: (mode: BackgroundMode) => {
      // Check if mode is valid (auto or a valid palette ID from all palettes including custom)
      if (mode === "auto") {
        applyState({ canvasGradientMode: mode }, { recompute: false });
        return;
      }
      // Use getPalette to check if palette exists (includes custom palettes)
      const palette = getPalette(mode);
      if (palette && palette.id === mode) {
        // Canvas gradient mode is applied in render, no regeneration needed
        applyState({ canvasGradientMode: mode }, { recompute: false });
      }
    },
    setCanvasGradientDirection: (degrees: number) => {
      // Canvas gradient direction is applied in render, no regeneration needed
      applyState({ canvasGradientDirection: clamp(degrees, 0, 360) }, { recompute: false });
    },
    setRandomSprites: (enabled: boolean) => {
      // Random sprites requires regeneration to assign random shapes to each tile
      applyState({ randomSprites: enabled });
    },
    setDepthOfFieldEnabled: (value: boolean) => {
      // Depth of field is applied during rendering, no regeneration needed
      applyState({ depthOfFieldEnabled: value }, { recompute: false });
    },
    setDepthOfFieldFocus: (value: number) => {
      // Focus is applied during rendering, no regeneration needed
      applyState({ depthOfFieldFocus: clamp(value, 0, 100) }, { recompute: false });
    },
    setDepthOfFieldStrength: (value: number) => {
      // Blur strength is applied during rendering, no regeneration needed
      applyState({ depthOfFieldStrength: clamp(value, 0, 100) }, { recompute: false });
    },
    setSpriteCollection: (collectionId: string) => {
      const collection = getCollection(collectionId);
      if (collection) {
        // Clear sprite image cache when switching collections
        // This ensures new/modified SVG files are reloaded
        clearSpriteImageCache();
        
        // If current sprite mode is not in new collection, switch to first sprite
        const currentSpriteId = stateRef.current.spriteMode;
        const spriteInCollection = collection.sprites.find(s => 
          s.id === currentSpriteId || s.spriteMode === currentSpriteId
        );
        
        if (!spriteInCollection && collection.sprites.length > 0) {
          // Switch to first sprite in collection
          const firstSprite = collection.sprites[0];
          if (collection.isShapeBased && firstSprite.spriteMode) {
            applyState({ 
              spriteCollectionId: collectionId,
              spriteMode: firstSprite.spriteMode 
            });
          } else if (!collection.isShapeBased && firstSprite.id) {
            // For SVG collections, use the sprite ID as the mode
            applyState({ 
              spriteCollectionId: collectionId,
              spriteMode: firstSprite.id as SpriteMode
            });
          } else {
            // Fallback: just update collection ID
            applyState({ spriteCollectionId: collectionId });
          }
        } else {
          // Keep current sprite, just update collection
          applyState({ spriteCollectionId: collectionId });
        }
      }
    },
    applySingleTilePreset: () => {
      updateSeed();
      applyState({
        scalePercent: 22,
        scaleBase: 85,
        scaleSpread: 45,
        movementMode: "pulse",
        motionIntensity: 28,
        motionSpeed: 12.5,
        rotationEnabled: true,
        rotationAmount: 35,
        rotationAnimated: true,
      });
    },
    applyNebulaPreset: () => {
      updateSeed();
      applyState({
        scalePercent: 320,
        scaleBase: 75,
        scaleSpread: 95,
        paletteVariance: 86,
        movementMode: "drift",
        motionIntensity: 74,
        motionSpeed: 11,
        blendMode: "SCREEN",
        blendModeAuto: false,
        previousBlendMode: "SCREEN",
        layerOpacity: 62,
        rotationEnabled: true,
        rotationAmount: 72,
        rotationAnimated: true,
      });
    },
    applyMinimalGridPreset: () => {
      updateSeed();
      applyState({
        scalePercent: 65,
        scaleBase: 55,
        scaleSpread: 38,
        paletteVariance: 18,
        movementMode: "drift",
        motionIntensity: 20,
        motionSpeed: 5.5,
        blendMode: "MULTIPLY",
        blendModeAuto: false,
        previousBlendMode: "MULTIPLY",
        layerOpacity: 48,
        rotationEnabled: false,
        rotationAmount: 0,
        rotationAnimated: false,
      });
    },
    reset: () => {
      stateRef.current = {
        ...DEFAULT_STATE,
        seed: generateSeedString(),
        previousBlendMode: DEFAULT_STATE.blendMode,
      };
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    destroy: () => {
      // Clear any pending timeouts
      if (destroyTimeoutId) {
        clearTimeout(destroyTimeoutId);
        destroyTimeoutId = null;
      }
      if (pauseTimeoutId) {
        clearTimeout(pauseTimeoutId);
        pauseTimeoutId = null;
      }
      
      // Clean up container ResizeObserver if it exists
      if (hasResizeObserver(container)) {
        container._resizeObserver?.disconnect();
        delete container._resizeObserver;
      }
      
      // Stop the draw loop before removing to prevent any race conditions
      if (p5Instance) {
        try {
          p5Instance.noLoop();
          // Small delay to ensure loop stops before removal
          destroyTimeoutId = setTimeout(() => {
            if (p5Instance) {
              p5Instance.remove();
              p5Instance = null;
            }
            destroyTimeoutId = null;
          }, 10);
        } catch (e) {
          // If removal fails, try direct removal
          try {
            p5Instance.remove();
          } catch (e2) {
            // Ignore errors during cleanup
          }
          p5Instance = null;
        }
      } else {
        p5Instance = null;
      }
    },
    getP5Instance: () => p5Instance,
    pauseAnimation: () => {
      // Clear any existing pause timeout
      if (pauseTimeoutId) {
        clearTimeout(pauseTimeoutId);
        pauseTimeoutId = null;
      }
      
      if (p5Instance) {
        // Redraw once to ensure the canvas has the latest frame before pausing
        if (hasRedraw(p5Instance)) {
          p5Instance.redraw();
        }
        // Small delay to ensure redraw completes before pausing
        pauseTimeoutId = setTimeout(() => {
          if (p5Instance) {
            p5Instance.noLoop();
          }
          pauseTimeoutId = null;
        }, 10);
      }
    },
    resumeAnimation: () => {
      if (p5Instance) {
        p5Instance.loop();
      }
    },
    // Internal API for loop control
    // Not exposed on type to avoid breaking external imports; still callable where imported locally
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    __setLoopMode: (enabled: boolean, periodSeconds?: number) => {
      loopOverrideRef.enabled = enabled;
      if (typeof periodSeconds === "number" && isFinite(periodSeconds) && periodSeconds > 0) {
        loopOverrideRef.periodSeconds = periodSeconds;
      }
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    __setLoopFrame: (frameIndex: number, totalFrames: number) => {
      loopOverrideRef.useFrameIndex = true;
      loopOverrideRef.frameIndex = Math.max(0, Math.floor(frameIndex));
      loopOverrideRef.totalFrames = Math.max(1, Math.floor(totalFrames));
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    __clearLoopFrame: () => {
      loopOverrideRef.useFrameIndex = false;
    },
  };

  notifyState();

  return controller;
};
