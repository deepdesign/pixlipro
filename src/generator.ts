import p5 from "p5";
import type { P5WithCanvas, HTMLElementWithResizeObserver } from "./types/p5-extensions";
import { hasRedraw, hasResizeObserver, hasCanvas } from "./types/p5-extensions";

import {
  defaultPaletteId,
  getPalette,
  getRandomPalette,
  getAllPalettes,
  palettes,
} from "./data/palettes";
// import { getGradientsForPalette } from "./data/gradients"; // Unused
import { calculateGradientLine } from "./lib/utils";
import { getCollection, getSpriteInCollection, getAllCollections, findSpriteByIdentifier } from "./constants/spriteCollections";
import { loadSpriteImage, getCachedSpriteImage, preloadSpriteImages } from "./lib/services/spriteImageLoader";
import { interpolateGeneratorState, calculateTransitionProgress } from "./lib/utils/animationTransition";
import { applyNoiseOverlay } from "./lib/utils/fxNoise";
import { applyPixelationEffects } from "./lib/utils/fxPixelation";
import { applyHalftone } from "./lib/utils/fxHalftone";
import { stepSprite, initSpritePosition, type Vec2 } from "./lib/utils/parallax-math-robust";
import { getAnimationById } from "./lib/storage/animationStorage";
import { executeCodeFunctionSync } from "./lib/utils/codeSandbox";

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
  "pulse-meander",
  "drift",
  "ripple",
  "zigzag",
  "cascade",
  "spiral",
  "comet",
  "linear",
  "isometric",
  "triangular",
  "parallax",
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
  "pulse-meander": 2.7, // Same as pulse for consistency
  linear: 8.0,      // ~8x slower - increased to further reduce max motion speed
  isometric: 8.0,   // ~8x slower - significantly increased to reduce max motion speed
  triangular: 8.0,  // ~8x slower - triangular edge movement
  parallax: 1.0,    // Parallax uses depth-based speed internally, so base multiplier is 1.0
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
  "pulse-meander": 1.0, // No adjustment
  zigzag: 1.0,      // No adjustment
  linear: 1.0,      // No adjustment
  isometric: 1.0,   // No adjustment
  parallax: 1.0,    // Parallax uses depth-based sizing, no global multiplier needed
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
  "pulse-meander": 1.0, // No adjustment
  zigzag: 1.0,      // No adjustment
  linear: 1.0,      // No adjustment
  isometric: 1.0,   // No adjustment
  parallax: 1.2,    // 20% more tiles for parallax to ensure continuous flow
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
  | "diamond"
  | "star"
  | "line"
  | "pentagon"
  | "asterisk"
  | "cross"
  | "pixels"
  | "heart"
  | "smiley"
  | "tree"
  | "x"
  | "arrow";

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
  isOutlined: boolean; // Whether this sprite should be rendered as an outline (used when outlineMixed is true)
  // Parallax-specific properties
  parallaxDepth?: number; // Depth value (0-1) for parallax effect, 0 = farthest, 1 = closest
  parallaxDelay?: number; // Delay before re-entering after exiting (for sprite recycling)
  parallaxInitialU?: number; // Initial U position for parallax (stored for recycling)
  parallaxStartPhase?: number; // Initial phase offset to stagger sprite start times
  // Stateful world position for parallax (pixels) - updated each frame
  worldX?: number; // Current X position in world pixels
  worldY?: number; // Current Y position in world pixels
}

type PreparedTile = SvgTile;

interface PreparedLayer {
  tiles: PreparedTile[];
  tileCount: number;
  blendMode: BlendModeKey;
  opacity: number;
  mode: "svg";
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
  saturation: number; // Color saturation adjustment (0-200, 100 = normal)
  brightness: number; // Color brightness adjustment (0-200, 100 = normal)
  contrast: number; // Color contrast adjustment (0-200, 100 = normal)
  scalePercent: number;
  scaleBase: number;
  scaleSpread: number;
  scaleWeighting: number; // 0-100: 0 = favor small sprites, 50 = uniform, 100 = favor large sprites
  motionIntensity: number;
  blendMode: BlendModeKey;
  blendModeAuto: boolean;
  previousBlendMode: BlendModeKey;
  layerOpacity: number;
  spriteMode: SpriteMode; // DEPRECATED: kept for backward compatibility, use selectedSprites instead
  selectedSprites: string[]; // Array of sprite identifiers: svgPath for SVG sprites
  movementMode: MovementMode;
  customAnimationId?: string; // ID of custom animation to use (if set, overrides movementMode)
  backgroundMode: BackgroundMode;
  backgroundHueShift: number;
  backgroundSaturation: number; // Canvas saturation adjustment (0-200, 100 = normal)
  backgroundBrightness: number;
  backgroundContrast: number; // Canvas contrast adjustment (0-200, 100 = normal)
  backgroundColorIndex: number; // Index of palette color used for background (0-based)
  motionSpeed: number;
  parallaxAngle: number; // Parallax movement angle in degrees (0-360, 0 = right, 90 = down, 180 = left, 270 = up)
  parallaxDepthEffect: number; // Controls speed difference between foreground/background (0-100, higher = more difference)
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
  spriteCollectionId: string; // Collection ID (e.g., "default", "christmas")
  // Animation settings
  animationEnabled: boolean; // Master toggle for all movement/animation (default: true, controls motion speed/position updates)
  hueRotationEnabled: boolean; // Toggle sprite hue rotation animation
  hueRotationSpeed: number; // Speed of sprite hue rotation (0-100%)
  paletteCycleEnabled: boolean; // Toggle palette cycling animation
  paletteCycleSpeed: number; // Speed of palette cycling (0-100%)
  canvasHueRotationEnabled: boolean; // Toggle canvas hue rotation animation
  canvasHueRotationSpeed: number; // Speed of canvas hue rotation (0-100%)
  // Aspect ratio settings
  aspectRatio: "16:9" | "21:9" | "16:10" | "custom"; // Canvas aspect ratio (square removed, defaults to 16:9)
  customAspectRatio: { width: number; height: number }; // Custom aspect ratio dimensions
  // Outline settings
  outlineEnabled: boolean; // Toggle for outline mode (render sprites as strokes instead of fills)
  outlineStrokeWidth: number; // Stroke width in pixels (range: 1-20)
  outlineMixed: boolean; // When enabled, randomly mix filled and outlined sprites
  outlineBalance: number; // Balance between outlined and filled sprites (0-100, 0=all filled, 50=50/50, 100=all outlined)
  filledOpacity: number; // Opacity for filled sprites when mixed mode is enabled (0-100)
  outlinedOpacity: number; // Opacity for outlined sprites when mixed mode is enabled (0-100)
  colorSeedSuffix: string; // Suffix for color RNG to allow re-applying palette without regenerating sprites
  blendModeSeedSuffix: string; // Suffix for blend mode RNG to allow re-applying blend modes without regenerating sprites
  backgroundColorSeedSuffix: string; // Suffix for background color RNG to allow re-applying background color
  spriteGradientColorSeedSuffix: string; // Suffix for gradient color RNG to allow re-applying gradient colors without regenerating sprites
  // Section enable/disable flags (when collapsed, sections keep values but don't affect rendering)
  colorAdjustmentsEnabled: boolean; // Whether color adjustments section is active
  gradientsEnabled: boolean; // Whether gradients section is active
  blendOpacityEnabled: boolean; // Whether blend & opacity section is active
  canvasEnabled: boolean; // Whether canvas section is active
  densityScaleEnabled: boolean; // Whether density & scale section is active
  linesRatio: number; // 0-100, ratio of lines to other sprites (0 = normal, 100 = 10x lines)
  // FX (Visual Effects) settings
  // Bloom
  bloomEnabled: boolean;
  bloomIntensity: number; // 0-100
  bloomThreshold: number; // 0-100, brightness threshold
  bloomRadius: number; // 0-100 pixels
  // Noise/Grain (enhance existing)
  noiseEnabled: boolean;
  noiseType: "grain" | "crt" | "bayer" | "static" | "scanlines";
  noiseStrength: number; // 0-100
  // Pixelation
  pixelationEnabled: boolean;
  pixelationSize: number; // 1-50 pixels (block size)
  pixelationGridEnabled: boolean; // Show 1px grid lines between pixels
  pixelationGridBrightness: number; // 0-100, brightness of grid lines (100 = full brightness, 0 = black)
  pixelationGridUsePalette: boolean; // Use palette color instead of black for grid lines
  pixelationGridPaletteColorIndex: number; // Index of palette color to use for grid (0-based)
  colorQuantizationEnabled: boolean;
  colorQuantizationBits: number; // 4, 8, 16, or 24 (bit depth)
  // Halftone
  halftoneEnabled: boolean;
  halftoneDotSize: number; // 1-64 pixels
  halftoneSpacing: number; // 2-50 pixels
  halftoneAngle: number; // 0-360 degrees
  halftoneShape: "circle" | "square" | "diamond";
  // Thumbnail mode settings (for animation thumbnails)
  thumbnailMode?: {
    primaryColorIndex: number; // Color index for primary sprite (e.g., 0 for slate-50)
    secondaryColorIndex: number; // Color index for secondary sprites (e.g., 1 for slate-600)
    primaryScale: number; // Scale for primary sprite
    secondaryScale: number; // Scale for secondary sprites (typically 50% of primary)
    secondaryCount: number; // Number of secondary sprites (e.g., 7)
    primaryPosition?: { u: number; v: number }; // Optional: fixed position for primary sprite (0-1)
  };
}

export interface SpriteControllerOptions {
  onStateChange?: (state: GeneratorState) => void;
  onFrameRate?: (fps: number) => void;
  maxResolution?: number; // Maximum width in pixels (for projector performance)
}

// All sprites now use SVG files - no shape primitives needed

// Helper to get a random sprite from default collection
function getRandomDefaultSprite(): string {
  const defaultCollection = getCollection("default");
  if (defaultCollection && defaultCollection.sprites.length > 0) {
    const randomSprite = defaultCollection.sprites[Math.floor(Math.random() * defaultCollection.sprites.length)];
    if (randomSprite.svgPath) {
      return randomSprite.svgPath;
    }
    // Fallback to shape identifier if no svgPath
    if (randomSprite.spriteMode) {
      return `shape:${randomSprite.spriteMode}`;
    }
  }
  // Ultimate fallback
  return "/sprites/default/star.svg";
}

export const DEFAULT_STATE: GeneratorState = {
  seed: "DEADBEEF",
  paletteId: defaultPaletteId,
  paletteVariance: 68,
  hueShift: 0,
  saturation: 100, // Default 100% = normal saturation
  brightness: 100, // Default 100% = normal brightness
  contrast: 100, // Default 100% = normal contrast
  scalePercent: 925, // 50% UI: uiToDensity(50) = 50 + (50/100) * (1800-50) = 50 + 875 = 925
  scaleBase: 50,
  scaleSpread: 50,
  scaleWeighting: 50, // Default: uniform distribution
  motionIntensity: 58,
  blendMode: "NONE",
  blendModeAuto: true,
  previousBlendMode: "NONE",
  layerOpacity: 74,
  spriteMode: "star", // DEPRECATED: kept for backward compatibility
  selectedSprites: ["/sprites/default/star.svg"], // Will be randomized on initialization
  movementMode: "drift",
  backgroundMode: "auto",
  backgroundHueShift: 0,
  backgroundSaturation: 100, // Default 100% = normal saturation
  backgroundBrightness: 50,
  backgroundContrast: 100, // Default 100% = normal contrast
  backgroundColorIndex: 0, // Default to first color for backward compatibility
  motionSpeed: 8.5,
  parallaxAngle: 0, // Default: horizontal movement (0 degrees = right)
  parallaxDepthEffect: 50, // Default: medium depth effect (0 = all same speed, 100 = max difference)
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
  spriteCollectionId: "default", // Default to default collection
  // Animation defaults
  animationEnabled: true, // Animation enabled by default
  hueRotationEnabled: false,
  hueRotationSpeed: 50,
  paletteCycleEnabled: false,
  paletteCycleSpeed: 50,
  canvasHueRotationEnabled: false,
  canvasHueRotationSpeed: 50,
  // Aspect ratio defaults
  aspectRatio: "16:9", // Industry standard for projectors
  customAspectRatio: { width: 1920, height: 1080 }, // Default custom dimensions (16:9)
  // Outline defaults
  outlineEnabled: false,
  outlineStrokeWidth: 2, // Default stroke width in pixels
  outlineMixed: false, // Default: all sprites use same outline state
  outlineBalance: 50, // Default: 50/50 split between outlined and filled
  filledOpacity: 74, // Default opacity for filled sprites in mixed mode
  outlinedOpacity: 74, // Default opacity for outlined sprites in mixed mode
  colorSeedSuffix: "", // Suffix for color RNG to allow re-applying palette without regenerating sprites
  blendModeSeedSuffix: "", // Suffix for blend mode RNG to allow re-applying blend modes without regenerating sprites
  backgroundColorSeedSuffix: "", // Suffix for background color RNG to allow re-applying background color
  spriteGradientColorSeedSuffix: "", // Suffix for gradient color RNG to allow re-applying gradient colors without regenerating sprites
  // Section enable flags - all enabled by default
  colorAdjustmentsEnabled: true,
  gradientsEnabled: true,
  blendOpacityEnabled: true,
  canvasEnabled: true,
  densityScaleEnabled: true,
  linesRatio: 0, // Default: normal ratio
  // FX defaults
  bloomEnabled: false,
  bloomIntensity: 50, // Default 50% intensity
  bloomThreshold: 50, // Default 50% brightness threshold
  bloomRadius: 20, // Default 20px radius
  noiseEnabled: false,
  noiseType: "grain", // Default grain noise
  noiseStrength: 30, // Default 30% strength
  pixelationEnabled: false,
  pixelationSize: 1, // Default 1px (full quality)
  pixelationGridEnabled: false, // Default: no grid
  pixelationGridBrightness: 100, // Default 100% brightness
  pixelationGridUsePalette: false, // Default: use black (not palette)
  pixelationGridPaletteColorIndex: 0, // Default: first palette color
  colorQuantizationEnabled: false,
  colorQuantizationBits: 24, // Default 24-bit (full quality)
  // Halftone defaults
  halftoneEnabled: false,
  halftoneDotSize: 4, // Default: 4 pixels
  halftoneSpacing: 8, // Default: 8 pixels
  halftoneAngle: 45, // Default: 45 degrees
  halftoneShape: "circle", // Default: circle dots
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
  
  // For pure black (l=0) or pure white (l=100) with no saturation, don't apply hue shift
  // Hue is undefined when saturation is 0, and shifting it can create unwanted colors
  if (s === 0 && (l === 0 || l === 100 || adjustedLight === 0 || adjustedLight === 100)) {
    return hslToHex(h, s, adjustedLight);
  }
  
  return hslToHex(h + hueShiftDegrees, s, adjustedLight);
};

const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  const hueShift = (random() - 0.5) * variance * 60;
  const satShift = (random() - 0.5) * variance * 50;
  const lightShift = (random() - 0.5) * variance * 40;
  return hslToHex(h + hueShift, s + satShift, l + lightShift);
};

/**
 * Apply saturation, brightness, and contrast adjustments to a color
 * @param hex - Input color in hex format
 * @param saturationPercent - Saturation adjustment (0-200, 100 = normal, 0 = grayscale, 200 = max saturation)
 * @param brightnessPercent - Brightness adjustment (0-200, 100 = normal, 0 = black, 200 = max brightness)
 * @param contrastPercent - Contrast adjustment (0-200, 100 = normal, 0 = no contrast, 200 = max contrast)
 */
const applyColorAdjustments = (
  hex: string,
  saturationPercent: number,
  brightnessPercent: number,
  contrastPercent: number,
): string => {
  let [h, s, l] = hexToHsl(hex);
  
  // Apply saturation adjustment (0-200, 100 = normal)
  // Map: 0 = 0% saturation (grayscale), 100 = 100% (normal), 200 = 200% (max)
  const saturationFactor = saturationPercent / 100;
  s = clamp(s * saturationFactor, 0, 100);
  
  // Apply contrast adjustment FIRST (0-200, 100 = normal)
  // Contrast works by pushing lightness away from 50% (middle gray)
  // 0 = no contrast (everything becomes 50% gray), 100 = normal, 200 = max contrast
  // Always apply contrast (at 100% it returns the same value)
  const originalLightness = l;
  const contrastFactor = contrastPercent / 100;
  const midpoint = 50;
  l = clamp(midpoint + (originalLightness - midpoint) * contrastFactor, 0, 100);
  
  // Apply brightness adjustment AFTER contrast (0-200, 100 = normal)
  // Map: 0 = 0% lightness (black), 100 = normal lightness, 200 = 100% lightness (white)
  const brightnessFactor = brightnessPercent / 100;
  l = clamp(l * brightnessFactor, 0, 100);
  
  return hslToHex(h, s, l);
};

const interpolatePaletteColors = (
  palette1: string[],
  palette2: string[],
  t: number // 0-1 interpolation factor
): string[] => {
  // Clamp t to ensure we're always in valid range
  const clampedT = Math.max(0, Math.min(1, t));
  
  const maxLength = Math.max(palette1.length, palette2.length);
  return Array.from({ length: maxLength }, (_, i) => {
    const color1 = palette1[i % palette1.length];
    const color2 = palette2[i % palette2.length];
    const [h1, s1, l1] = hexToHsl(color1);
    const [h2, s2, l2] = hexToHsl(color2);
    // Handle hue wrapping (shortest path around color wheel)
    let hueDiff = h2 - h1;
    if (hueDiff > 180) hueDiff -= 360;
    if (hueDiff < -180) hueDiff += 360;
    const h = h1 + hueDiff * clampedT;
    const s = s1 + (s2 - s1) * clampedT;
    const l = l1 + (l2 - l1) * clampedT;
    return hslToHex(h, s, l);
  });
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
// Helper function for clamping scale values - used in both computeMovementOffsets and draw
const clampScale = (value: number) => Math.max(0.35, value);

/**
 * Compute movement offsets using custom animation code if available, otherwise use movement mode
 */
const computeMovementOffsetsWithCustom = (
  currentState: GeneratorState,
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
  // Check for custom animation first
  if (currentState.customAnimationId) {
    try {
      const animation = getAnimationById(currentState.customAnimationId);
      if (animation && !animation.isDefault) {
        const customAnim = animation as any; // CustomAnimation type
        
        // Normalize time based on duration (0-1 range)
        // If loop is false and time exceeds duration, clamp to 1.0
        // For preview animations (IDs starting with "preview-"), use a longer effective duration
        // to prevent rapid resets, but still normalize to 0-1 range
        let normalizedTime: number;
        const isPreview = customAnim.id?.startsWith("preview-");
        const effectiveDuration = isPreview ? Math.max(customAnim.duration, 10.0) : customAnim.duration; // Min 10s for previews
        
        if (customAnim.loop) {
          normalizedTime = (data.time % effectiveDuration) / effectiveDuration;
        } else {
          normalizedTime = Math.min(data.time / effectiveDuration, 1.0);
        }
        
        // Execute path function
        if (customAnim.codeFunctions?.path) {
          const pathFn = executeCodeFunctionSync(customAnim.codeFunctions.path, {
            t: normalizedTime,
            phase: data.phase,
            layerIndex: data.layerIndex,
            baseUnit: data.baseUnit,
            motionScale: data.motionScale,
          });
          
          // pathFn should be a function that takes (t, phase) and returns {x, y}
          const pos = typeof pathFn === 'function' ? pathFn(normalizedTime, data.phase) : pathFn;
          
          // Execute scale function if available
          let scaleMultiplier = 1.0;
          if (customAnim.codeFunctions?.scale) {
            const scaleFn = executeCodeFunctionSync(customAnim.codeFunctions.scale, {
              t: normalizedTime,
              phase: data.phase,
              layerIndex: data.layerIndex,
              baseUnit: data.baseUnit,
              motionScale: data.motionScale,
            });
            // scaleFn should be a function that takes (t) and returns a number
            const scale = typeof scaleFn === 'function' ? scaleFn(normalizedTime) : scaleFn;
            scaleMultiplier = clampScale(typeof scale === 'number' ? scale : 1.0);
          }
          
          return {
            offsetX: (pos?.x || 0) * data.baseUnit * data.motionScale,
            offsetY: (pos?.y || 0) * data.baseUnit * data.motionScale,
            scaleMultiplier,
          };
        }
      }
    } catch (error) {
      console.error("Failed to execute custom animation:", error);
      // Fall through to default movement mode
    }
  }
  
  // Fall back to movement mode
  return computeMovementOffsets(currentState.movementMode, data);
};

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
  // Speed is already applied to the time parameter, so use speedFactor directly
  const velocity = Math.max(speedFactor, 0);
  const baseTime = velocity === 0 ? 0 : time * velocity;
  const phased = baseTime + phase;
  // clampScale is now defined at module level to be accessible everywhere

  switch (mode) {
    case "pulse": {
      // Use pure sine wave for smooth, continuous animation without pauses
      // Sine wave naturally provides smooth acceleration/deceleration
      const rawPulse = Math.sin(phased * 0.08);
      
      // Apply motion scale directly to sine wave (-1 to 1 range)
      const pulse = rawPulse * motionScale;
      
      // Apply pulse to scale only (no position changes)
      const scaleMultiplier = clampScale(1 + pulse * 0.55);
      
      // Keep sprites in place - no x,y movement
      return { offsetX: 0, offsetY: 0, scaleMultiplier };
    }
    case "pulse-meander": {
      // Combine pulse scale animation with meandering movement
      // Use pure sine wave for smooth, continuous pulse animation
      const rawPulse = Math.sin(phased * 0.08);
      
      // Apply motion scale directly to sine wave (-1 to 1 range)
      const pulse = rawPulse * motionScale;
      
      // Apply pulse to scale
      const scaleMultiplier = clampScale(1 + pulse * 0.55);
      
      // Add meandering movement - increased multipliers for wider area coverage
      // Use different frequencies for X and Y to create organic, wandering motion
      const meanderX = Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 1.2;
      const meanderY = Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 1.3;
      
      return { offsetX: meanderX, offsetY: meanderY, scaleMultiplier };
    }
    case "drift": {
      // More exaggerated floating motion with larger amplitude
      const driftX = Math.sin(phased * 0.028 + phase * 0.15) * baseUnit * motionScale * 0.8;
      const driftY = Math.cos(phased * 0.024 + phase * 0.12) * baseUnit * motionScale * 0.9;
      const scaleMultiplier = clampScale(1 + Math.sin(phased * 0.016) * motionScale * 0.25);
      return { offsetX: driftX, offsetY: driftY, scaleMultiplier };
    }
    case "ripple": {
      // Wave-like motion with circular/radial wave propagation
      // Ripples expand outward from center in waves
      const wavePhase = phased * 0.04 + layerIndex * 0.6;
      const wave = Math.sin(wavePhase);
      
      // Create expanding/contracting radius for ripple effect
      // Waves expand outward then contract back
      const rippleRadius = baseUnit * (0.4 + motionScale * 0.8) * (0.5 + wave * 0.5);
      
      // Circular motion based on phase - creates radial wave pattern
      // Each sprite has a different starting angle based on phase
      const angle = phase * 2 * Math.PI + phased * 0.02;
      
      // Radial movement - sprites move outward/inward in circular pattern
      const offsetX = Math.cos(angle) * rippleRadius * wave;
      const offsetY = Math.sin(angle) * rippleRadius * wave;
      
      // Scale pulses with wave for ripple effect
      const scaleMultiplier = clampScale(1 + wave * motionScale * 0.5);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "zigzag": {
      // Create a zigzag sawtooth path that moves horizontally and returns along the same path
      // The sprite moves left-to-right along a sawtooth zigzag path,
      // then reverses direction to return along the same path, forming a closed loop
      
      // Slow down the animation significantly - very slow (halved again)
      const zigTime = phased * 0.002 + layerIndex * 0.02;
      
      // Determine if we're going forward (0-1) or backward (1-2) in the cycle
      const cyclePhase = zigTime % 2;
      const isForward = cyclePhase < 1;
      
      // Horizontal progress: 0 to 1 going forward, 1 to 0 going backward
      const horizontalProgress = isForward 
        ? cyclePhase  // Forward: 0 to 1
        : 2 - cyclePhase; // Backward: 1 to 0
      
      // Horizontal movement distance (left-right) - 50% longer again
      const horizontalAmplitude = baseUnit * (1.8 + motionScale * 3.0);
      // Convert progress to -1 to 1 range for centered movement
      const horizontalPosition = (horizontalProgress - 0.5) * 2; // -1 to 1
      const offsetX = horizontalPosition * horizontalAmplitude * motionScale;
      
      // Create sawtooth pattern for vertical movement (zigzag up and down)
      // The sawtooth follows the horizontal position to create a proper zigzag path
      // Number of zigzag segments per horizontal cycle (fewer segments = smoother)
      const zigzagSegments = 3; // Creates 3 peaks/troughs per horizontal cycle
      const sawtoothPhase = horizontalProgress * zigzagSegments; // 0 to zigzagSegments
      const sawtoothValue = sawtoothPhase % 1; // 0 to 1 within each segment
      
      // Create sawtooth: goes from 0 to 1, then drops back to 0
      // This creates the sharp zigzag pattern
      const zigzagY = sawtoothValue < 0.5 
        ? sawtoothValue * 2  // Rising edge: 0 to 1
        : 2 - sawtoothValue * 2; // Falling edge: 1 to 0
      
      // Normalize to -1 to 1 range for centered vertical movement
      const normalizedZigzag = (zigzagY - 0.5) * 2;
      
      // Vertical amplitude for zigzag pattern - increased for more pronounced sawtooth
      const verticalAmplitude = baseUnit * (0.4 + motionScale * 0.8);
      const offsetY = normalizedZigzag * verticalAmplitude * motionScale;
      
      // Optional: slight scale variation for visual interest
      const scaleMultiplier = clampScale(
        1 + Math.cos(zigTime * Math.PI * 0.3) * 0.08 * motionScale,
      );
      
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "cascade": {
      // Waterfall-like tailing motion - stronger downward flow with trailing effect
      const cascadeTime = phased * 0.045 + layerIndex * 0.2;
      const wave = Math.sin(cascadeTime);
      
      // Stronger downward drift for waterfall effect
      // Use exponential curve for more pronounced downward acceleration
      const drift = (1 - Math.cos(cascadeTime)) * 0.5;
      const waterfallDrift = Math.pow(drift, 0.7); // Exponential curve for waterfall effect
      
      // Increased vertical movement for waterfall tailing
      const offsetY =
        (waterfallDrift * 2 - 1) *
        layerTileSize *
        0.7 *
        (1 + layerIndex * 0.2) *
        motionScale;
      
      // Reduced horizontal movement - waterfall flows more vertically
      const offsetX = wave * baseUnit * 0.2 * motionScale;
      
      // Scale variation creates trailing effect (sprites get smaller as they fall)
      const trailingScale = 1 - waterfallDrift * 0.3; // Sprites shrink as they cascade down
      const scaleMultiplier = clampScale(
        trailingScale + Math.sin(cascadeTime * 1.2 + phase * 0.25) * 0.12 * motionScale,
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
      // Slow down the comet trail animation
      const travel = phased * (0.018 + layerIndex * 0.005);
      const orbital = travel + phase;
      const tail = (Math.sin(travel * 0.9 + phase * 0.6) + 1) * 0.5;
      const offsetX = Math.cos(orbital) * pathLength;
      const offsetY = Math.sin(orbital * 0.75) * pathLength * 0.48;
      const scaleMultiplier = clampScale(0.65 + tail * motionScale * 0.55);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "linear": {
      // Determine direction based on phase (deterministic per sprite)
      // Only horizontal and vertical directions: 0° (right), 90° (down), 180° (left), 270° (up)
      const angleDegrees = [0, 90, 180, 270];
      const directionIndex = Math.floor((phase * 0.25) % angleDegrees.length);
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
      
      // Calculate offset based on angle (only horizontal or vertical)
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
    case "parallax": {
      // Parallax animation: left-to-right movement with depth-based speed
      // Depth is passed via data.parallaxDepth (0-1, where 0 = farthest, 1 = closest)
      // Closer sprites (higher depth) move faster, farther sprites (lower depth) move slower
      
      // Get depth from data parameter (0-1 range)
      // If not provided, fall back to phase-based calculation for backward compatibility
      const depth = (data as any).parallaxDepth ?? ((phase % 1));
      
      // Depth-based speed multiplier: closer (higher depth) = faster
      // Speed range: 1.0 (farthest, depth=0) to 2.5 (closest, depth=1)
      const depthSpeedMultiplier = 1.0 + depth * 1.5;
      
      // Base speed for parallax movement (left to right)
      // Use a moderate base speed that works well with the depth multiplier
      const baseParallaxSpeed = 0.12; // Pixels per frame at base speed
      
      // Calculate horizontal movement based on depth and time
      // Closer sprites move faster across the canvas
      const horizontalSpeed = baseParallaxSpeed * depthSpeedMultiplier * motionScale;
      
      // Calculate X offset (left to right movement)
      // This will be modified in the draw loop to handle recycling
      const offsetX = phased * horizontalSpeed * layerTileSize * 0.15;
      
      // No vertical movement in base parallax (Y is handled by recycling)
      const offsetY = 0;
      
      // Scale breathing effect: scale changes slightly during movement
      // Simulates objects getting slightly larger as they "approach" (even though moving horizontally)
      // Breathing range: 0.95 to 1.05 (5% variation)
      const breathingPhase = phased * 0.08; // Slower breathing cycle for smooth effect
      const breathingAmount = Math.sin(breathingPhase) * 0.05; // ±5% scale variation
      const scaleMultiplier = clampScale(1.0 + breathingAmount);
      
      return { offsetX, offsetY, scaleMultiplier };
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
/**
 * Helper function to calculate background color index using seeded RNG
 * Ensures the background color matches the theme/seed
 */
const calculateBackgroundColorIndex = (
  seed: string,
  backgroundPaletteId: string,
  backgroundColorSeedSuffix: string = "",
): number => {
  const backgroundPalette = getPalette(backgroundPaletteId);
  const paletteColorCount = backgroundPalette.colors.length;
  if (paletteColorCount === 0) {
    return 0;
  }
  // Use seeded RNG based on seed, background palette ID, and optional suffix
  const suffixStr = backgroundColorSeedSuffix ? `-${backgroundColorSeedSuffix}` : "";
  const bgColorRng = createMulberry32(hashSeed(`${seed}-background-color-${backgroundPaletteId}${suffixStr}`));
  return Math.floor(bgColorRng() * paletteColorCount);
};

const computeSprite = (state: GeneratorState, overridePalette?: { id: string; colors: string[] }): PreparedSprite => {
  const rng = createMulberry32(hashSeed(state.seed));
  const palette = overridePalette ? { id: overridePalette.id, name: "", colors: overridePalette.colors } : getPalette(state.paletteId);
  const originalPaletteColors = palette.colors;
  // Allow variance up to 1.5 (150% internal value) for more color variation
  const variance = clamp(state.paletteVariance / 100, 0, 1.5);

  const colorRng = createMulberry32(hashSeed(`${state.seed}-color${state.colorSeedSuffix || ""}`));
  const blendModeRng = state.blendModeAuto && state.blendModeSeedSuffix
    ? createMulberry32(hashSeed(`${state.seed}-blend${state.blendModeSeedSuffix}`))
    : rng; // Use main RNG if not auto or no suffix
  const positionRng = createMulberry32(hashSeed(`${state.seed}-position`));
  const spriteSelectionRng = createMulberry32(hashSeed(`${state.seed}-sprite-selection`));
  // Apply global hue shift to palette colors (0-100 maps to 0-360 degrees)
  // Note: If hueRotationEnabled, static hue shift will be applied during rendering instead
  // to avoid double-shifting and ensure smooth animation
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
  // Calculate background color index using seeded RNG with optional suffix
  const bgColorIndex = calculateBackgroundColorIndex(
    state.seed,
    backgroundPaletteId,
    state.backgroundColorSeedSuffix || ""
  );
  // Wrap index to valid range
  const validBgIndex = backgroundPalette.colors.length > 0
    ? (bgColorIndex % backgroundPalette.colors.length)
    : 0;
  const backgroundBase = backgroundPalette.colors[validBgIndex] ?? originalPaletteColors[0];
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
  // Add minimum speed floor of 5% so animation never fully stops
  const minSpeed = 0.05; // 5% minimum
  const rotationSpeedBase = Math.max(minSpeed, clamp(state.rotationSpeed, 1, 100) / 100);

  // Get selected sprites (use new selectedSprites array, fallback to spriteMode for backward compatibility only if not explicitly empty)
  let selectedSpriteIds: string[] = [];
  
  // Check if selectedSprites exists in state (distinguish between undefined/null vs empty array)
  if (state.selectedSprites !== undefined && state.selectedSprites !== null) {
    // Use the actual array (which may be empty - that's valid for empty canvas)
    selectedSpriteIds = state.selectedSprites;
  } else {
    // Backward compatibility: if selectedSprites doesn't exist (old state), convert from spriteMode
    // All collections are now SVG-based
    const sprite = getSpriteInCollection(state.spriteCollectionId || "default", state.spriteMode);
    if (sprite?.svgPath) {
      selectedSpriteIds = [sprite.svgPath];
    } else {
      // Fallback: use default sprite if spriteMode doesn't match any sprite
      const defaultCollection = getCollection("default");
      if (defaultCollection && defaultCollection.sprites.length > 0) {
        const firstSprite = defaultCollection.sprites[0];
      if (firstSprite.svgPath) {
          selectedSpriteIds = [firstSprite.svgPath];
        }
      }
    }
  }
  
  // Allow empty selection - will result in empty canvas
  // Empty array means no sprites will be rendered
  
  // Helper to get sprite info from identifier (all sprites now use SVG files)
  const getSpriteInfo = (identifier: string): { svgSprite: { id: string; svgPath: string } } | null => {
    // Check if it's a custom sprite identifier (format: "custom:collectionId:spriteId")
    if (identifier.startsWith("custom:")) {
      const parts = identifier.split(":");
      if (parts.length === 3) {
        const [, collectionId, spriteId] = parts;
        const collection = getCollection(collectionId);
        if (!collection) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Collection not found for custom sprite: ${collectionId}`);
          }
          return null;
        }
        const sprite = collection.sprites.find(s => s.id === spriteId);
        if (!sprite) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Sprite not found in collection: collectionId=${collectionId}, spriteId=${spriteId}, available sprites:`, collection.sprites.map(s => s.id));
          }
          return null;
        }
        if (!sprite.svgPath) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Sprite has no svgPath: collectionId=${collectionId}, spriteId=${spriteId}`);
          }
          return null;
        }
        return { svgSprite: { id: sprite.id, svgPath: sprite.svgPath } };
      }
      return null;
    }
    
    // It's an svgPath (file-based sprite) - find the sprite
    const allCollections = getAllCollections();
    for (const collection of allCollections) {
      const sprite = collection.sprites.find(s => s.svgPath === identifier);
      if (sprite && sprite.svgPath) {
        return { svgSprite: { id: sprite.id, svgPath: sprite.svgPath } };
      }
    }
    return null;
  };

  // Separate sprites into lines and non-lines for weighted selection
  const lineSpriteIds: string[] = [];
  const nonLineSpriteIds: string[] = [];
  
  // Helper to check if a sprite is a line sprite
  const isLineSprite = (identifier: string): boolean => {
    const spriteInfo = getSpriteInfo(identifier);
    if (!spriteInfo) return false;
    return spriteInfo.svgSprite.id === "line";
  };
  
  // Separate selected sprites into lines and non-lines
  selectedSpriteIds.forEach(id => {
    if (isLineSprite(id)) {
      lineSpriteIds.push(id);
    } else {
      nonLineSpriteIds.push(id);
    }
  });
  
  // Calculate lines ratio multiplier (0% = 1x, 100% = 10x)
  const linesRatioMultiplier = 1 + (state.linesRatio / 100) * 9;
  
  // Helper to select a sprite with weighted probability for lines
  const selectWeightedSprite = (): string => {
    if (selectedSpriteIds.length === 0) {
      return ""; // No sprites selected
    }
    
    // If linesRatio is 0 or no line sprites, use normal random selection
    if (state.linesRatio === 0 || lineSpriteIds.length === 0) {
      return selectedSpriteIds[Math.floor(spriteSelectionRng() * selectedSpriteIds.length)];
    }
    
    // If only line sprites, return a random line
    if (nonLineSpriteIds.length === 0) {
      return lineSpriteIds[Math.floor(spriteSelectionRng() * lineSpriteIds.length)];
    }
    
    // Calculate weighted probabilities
    // Total weight = (non-lines count * 1) + (lines count * multiplier)
    const nonLineWeight = nonLineSpriteIds.length;
    const lineWeight = lineSpriteIds.length * linesRatioMultiplier;
    const totalWeight = nonLineWeight + lineWeight;
    
    // Random selection based on weights
    const random = spriteSelectionRng() * totalWeight;
    
    if (random < nonLineWeight) {
      // Select from non-lines (uniform distribution within non-lines)
      const index = Math.floor(spriteSelectionRng() * nonLineSpriteIds.length);
      return nonLineSpriteIds[index];
    } else {
      // Select from lines (uniform distribution within lines)
      const index = Math.floor(spriteSelectionRng() * lineSpriteIds.length);
      return lineSpriteIds[index];
    }
  };

  // Apply mode-specific scale multiplier to improve canvas coverage
  // Modes with large movement radii (spiral, orbit) benefit from larger sprites
  const modeScaleMultiplier = MOVEMENT_SCALE_MULTIPLIERS[state.movementMode] ?? 1.0;

  const layers: PreparedLayer[] = [];
  const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1);
  const layerCount = 3;
  const layerThresholds = [0, 0.38, 0.7];
  
  // Check if line sprites are selected to determine if we need special distribution
  const hasLineSprite = selectedSpriteIds.some(id => isLineSprite(id));
  
  // Pre-calculate total tiles across all layers for uniform distribution of line sprites
  // This ensures we can create a truly uniform distribution across all tiles
  // CRITICAL: Calculate this BEFORE the main loop to ensure accurate total count
  let totalTilesAcrossLayers = 0;
  const layerTileCounts: number[] = [];
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const threshold = layerThresholds[layerIndex] ?? 0.85;
    if (layerIndex > 0 && densityRatio < threshold) {
      layerTileCounts.push(0);
      continue;
    }
    const normalizedDensity =
      layerIndex === 0
        ? densityRatio
        : clamp((densityRatio - threshold) / (1 - threshold), 0, 1);
    const modeTileCountMultiplier = MOVEMENT_TILE_COUNT_MULTIPLIERS[state.movementMode] ?? 1.0;
    const dofTileCountMultiplier = state.depthOfFieldEnabled ? 0.75 : 1.0;
    const aspectRatioTileMultiplier = Math.sqrt(16 / 9);
    const maxTiles = Math.round(50 * modeTileCountMultiplier * dofTileCountMultiplier * aspectRatioTileMultiplier);
    const minTiles = layerIndex === 0 ? 1 : 0;
    const desiredTiles = 1 + normalizedDensity * (maxTiles - 1);
    const tileTotal = Math.max(minTiles, Math.round(desiredTiles));
    layerTileCounts.push(tileTotal);
    totalTilesAcrossLayers += tileTotal;
  }
  
  // For line sprite distribution, we need to know how many line sprites there will be
  // Since sprite selection is random, we do a two-pass approach:
  // 1. First pass: Create all tiles and count line sprites
  // 2. Second pass: Assign v values to line sprites based on actual count
  
  // Track line sprite count and indices during first pass
  let lineSpriteCount = 0;
  const lineSpriteIndices: Array<{ layerIndex: number; tileIndex: number; index: number }> = []; // Store which tiles are line sprites
  
  // Track global tile index for uniform distribution of line sprites
  // CRITICAL: Only increment for line sprites to ensure correct distribution
  let globalTileIndex = 0;

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
    // Account for 16:9 aspect ratio - wider canvas needs slightly more tiles to fill horizontal space
    // Use geometric mean of aspect ratio (16/9 ≈ 1.33) to scale tile count appropriately
    const aspectRatioTileMultiplier = Math.sqrt(16 / 9); // ≈ 1.33 for 16:9, 1.0 for 1:1
    // Reduced base max tiles from 60 to 50 for better performance at high density
    // Multiply by aspect ratio multiplier to account for wider canvas
    const maxTiles = Math.round(50 * modeTileCountMultiplier * dofTileCountMultiplier * aspectRatioTileMultiplier);
    const minTiles = layerIndex === 0 ? 1 : 0;
    const desiredTiles = 1 + normalizedDensity * (maxTiles - 1);
    const tileTotal = Math.max(minTiles, Math.round(desiredTiles));

    if (tileTotal === 0) {
      // Skip this layer but don't increment globalTileIndex since no tiles were created
      continue;
    }
    
    // CRITICAL: Verify tileTotal matches pre-calculated value for consistency
    // This ensures the global index distribution is accurate
    const expectedTileTotal = layerTileCounts[layerIndex] ?? tileTotal;
    if (expectedTileTotal !== tileTotal && process.env.NODE_ENV === 'development') {
      console.warn(`Tile count mismatch for layer ${layerIndex}: expected ${expectedTileTotal}, got ${tileTotal}`);
    }

    // Use separate RNG for layer blend mode if blendModeSeedSuffix is set
    const layerBlendRng = state.blendModeSeedSuffix
      ? createMulberry32(hashSeed(`${state.seed}-blend${state.blendModeSeedSuffix}-layer${layerIndex}`))
      : () => Math.random();
    const layerBlendMode: BlendModeKey = state.blendModeAuto
      ? (blendModePool[Math.floor(layerBlendRng() * blendModePool.length)] ??
        "NONE")
      : state.blendMode;
    const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95);

    // Calculate grid dimensions that match canvas aspect ratio
    // For 16:9 canvas, we want more columns than rows to fill the wider space
    // Use canvas aspect ratio to determine grid proportions
    // Note: This is calculated at sprite computation time, so we approximate based on typical 16:9
    // The actual canvas dimensions will be used during rendering
    const canvasAspectRatio = 16 / 9; // Default to 16:9 for projector aspect ratio
    const gridCols = Math.max(1, Math.round(Math.sqrt(tileTotal * canvasAspectRatio)));
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

      // hasLineSprite is already calculated above (optimization)
      
      // CRITICAL: Select sprite FIRST so we can check if it's a line sprite
      // If no sprites are selected, skip creating this tile (empty canvas)
      if (selectedSpriteIds.length === 0) {
        continue;
      }
      
      // Select sprite with weighted probability for lines (if linesRatio > 0)
      const selectedSpriteId = selectWeightedSprite();
      const spriteInfo = getSpriteInfo(selectedSpriteId);
      
      let u = clamp((col + 0.5 + jitterX) / gridCols, minBound, maxBound);
      let v: number;
      
      // For line sprites, calculate v based on line sprite index (not all tiles)
      // CRITICAL: Only count line sprites for uniform distribution, not all tiles
      // This ensures line sprites are evenly distributed even when mixed with other sprite types
      // NOTE: Check spriteInfo.svgSprite.id directly (not via isLineSprite which expects a path)
      const isThisTileLineSprite = spriteInfo && spriteInfo.svgSprite.id === "line";
      
      if (hasLineSprite && isThisTileLineSprite) {
        // Use current globalTileIndex value, then increment for next tile
        const currentIndex = globalTileIndex;
        lineSpriteCount++; // Count this line sprite
        globalTileIndex++; // Increment immediately so next tile gets next index
        // Store index for later normalization (we'll normalize after we know total count)
        lineSpriteIndices.push({ layerIndex, tileIndex: tiles.length, index: currentIndex });
        // Temporarily set v to 0, will normalize after all tiles are created
        v = 0; // Will be normalized in post-processing
      } else {
        // For regular sprites, use scale-based bounds but ensure uniform distribution
        // Map row position uniformly to the bounded range [minBound, maxBound]
        // This ensures even distribution within the allowed bounds without clustering
        const vMinBound = minBound;
        const vMaxBound = maxBound;
        // Calculate normalized row position (0 to 1) - map row [0, gridRows-1] to [0, 1]
        // This ensures uniform distribution regardless of gridRows calculation
        const normalizedRow = gridRows > 1 ? row / (gridRows - 1) : 0.5;
        // Map normalized position to bounded range [minBound, maxBound]
        const boundedV = vMinBound + normalizedRow * (vMaxBound - vMinBound);
        // Add jitter scaled to the bounded range (not gridRows-based)
        const jitterScale = (vMaxBound - vMinBound) * 0.15; // 15% of bounded range for natural variation
        v = clamp(boundedV + jitterY * jitterScale, vMinBound, vMaxBound);
      }

      if (isSpiralMode) {
        const focusStrength = scaleRatio * 0.12;
        const centreBiasX = (0.5 - u) * focusStrength;
        const centreBiasY = (0.5 - v) * focusStrength;
        u = clamp(u + centreBiasX, minBound, maxBound);
        if (hasLineSprite) {
          v = clamp(v + centreBiasY, 0, 1);
        } else {
          v = clamp(v + centreBiasY, minBound, maxBound);
        }
      }

      const scaleRange = Math.max(0, maxScaleFactor - minScaleFactor);
      
      // Apply scale weighting: power curve biases toward small or large sprites
      // weighting 0 → power 3 (favor small sprites)
      // weighting 50 → power 1 (uniform distribution)
      // weighting 100 → power ~0.33 (favor large sprites)
      const weighting = state.scaleWeighting ?? 50;
      const power = Math.pow(3, 1 - (weighting / 50)); // Exponential mapping
      const scaleFraction = Math.pow(positionRng(), power);
      
      const scale =
        scaleRange < 1e-6
          ? baseScale
          : clamp(
              minScaleFactor + scaleFraction * scaleRange,
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
        ? (blendModePool[Math.floor(blendModeRng() * blendModePool.length)] ?? "NONE")
        : state.blendMode;

      const paletteColorIndex = Math.floor(colorRng() * chosenPalette.length);
      const tint = chosenPalette[paletteColorIndex];
      
      // Store the palette color index so we can map to the corresponding gradient
      // Gradient assignment is now done during rendering, not during computation
      // This allows toggling gradients without regenerating sprite positions/scales
      
      // Assign parallax depth (0-1) for parallax mode
      // Depth is DERIVED FROM SPRITE SIZE - smaller sprites are further away (slower)
      // 0 = farthest (smallest, slowest), 1 = closest (largest, fastest)
      // Normalize scale to 0-1 range based on min/max scale factors
      const parallaxDepth = state.movementMode === "parallax" 
        ? clamp((scale - MIN_TILE_SCALE) / (MAX_TILE_SCALE - MIN_TILE_SCALE), 0, 1)
        : undefined;
      
      // Assign parallax delay for sprite recycling (random delay before re-entering)
      // Delay range: 0 to 2 seconds (in animation time units)
      const parallaxDelay = state.movementMode === "parallax"
        ? positionRng() * 2.0 // Random delay 0-2 seconds
        : undefined;
      
      // Store initial U position for parallax recycling
      const parallaxInitialU = state.movementMode === "parallax"
        ? u
        : undefined;
      
      // Assign initial phase offset to stagger sprites (so they don't all start together)
      // This ensures continuous flow with sprites at different stages of their cycle
      // Use a separate RNG seed to ensure good distribution of start phases
      // Negative values allow sprites to "start in the past" so they're already moving when animation begins
      const phaseRng = createMulberry32(hashSeed(`${state.seed}-parallax-phase-${layerIndex}-${index}`));
      const parallaxStartPhase = state.movementMode === "parallax"
        ? (phaseRng() - 0.5) * 20.0 // Random phase offset -10 to +10 seconds to stagger sprites
        : undefined;
      
      // Determine if this tile should be outlined (when mixed mode is enabled)
      // Determine if this tile should be outlined (when mixed mode is enabled)
      // Use outlineBalance to control the ratio (0-100, where 0=all filled, 50=50/50, 100=all outlined)
      // Convert percentage to threshold: 0% = 0.0 (all filled), 50% = 0.5 (50/50), 100% = 1.0 (all outlined)
      const outlineThreshold = (state.outlineBalance ?? 50) / 100;
      const isOutlined = state.outlineMixed ? positionRng() < outlineThreshold : false;
      
      // spriteInfo was already selected above, before v calculation
      if (!spriteInfo) {
        // Log warning for debugging
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Sprite not found for identifier: ${selectedSpriteId}. Available sprites:`, selectedSpriteIds);
        }
        // Fallback: try to find any valid sprite from selected sprites
        // Try to find a valid fallback sprite
        let fallbackInfo = null;
        for (const fallbackId of selectedSpriteIds) {
          fallbackInfo = getSpriteInfo(fallbackId);
          if (fallbackInfo) {
            break; // Found a valid sprite, use it
          }
        }
        
        // If still no valid sprite found, try to get any sprite from the collection
        if (!fallbackInfo && state.spriteCollectionId) {
          const collection = getCollection(state.spriteCollectionId);
          if (collection && collection.sprites.length > 0) {
            const firstSprite = collection.sprites[0];
            if (firstSprite.svgPath) {
              fallbackInfo = { svgSprite: { id: firstSprite.id, svgPath: firstSprite.svgPath } };
            }
          }
        }
        
        // Ultimate fallback: use star sprite
        if (!fallbackInfo) {
          fallbackInfo = { svgSprite: { id: "star", svgPath: "/sprites/default/star.svg" } };
        }
        
        // Create tile with fallback sprite
        if (fallbackInfo.svgSprite) {
        tiles.push({
            kind: "svg",
            svgPath: fallbackInfo.svgSprite.svgPath,
            spriteId: fallbackInfo.svgSprite.id,
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
            isOutlined,
          parallaxDepth,
          parallaxDelay,
          parallaxInitialU,
          parallaxStartPhase,
        });
        }
        // Note: globalTileIndex already incremented for line sprites before tile creation
        continue; // Skip to next iteration after creating fallback tile
      }
      
      // All sprites are now SVG-based
      if (spriteInfo.svgSprite) {
          const newTile = {
            kind: "svg" as const,
          svgPath: spriteInfo.svgSprite.svgPath,
          spriteId: spriteInfo.svgSprite.id,
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
          isOutlined,
          parallaxDepth,
          parallaxDelay,
          parallaxInitialU,
          parallaxStartPhase,
          };
          
          tiles.push(newTile);
      }
      // Note: globalTileIndex already incremented for line sprites before tile creation
    }

    layers.push({
      tiles,
      tileCount: tileTotal,
      blendMode: layerBlendMode,
      opacity,
      mode: "svg",
      baseSizeRatio,
    });
  }

  // Post-process line sprite v values: normalize based on actual line sprite count
  // This ensures uniform distribution even when line sprites are mixed with other sprite types
  if (hasLineSprite && lineSpriteCount > 0) {
    lineSpriteIndices.forEach(({ layerIndex, tileIndex, index }) => {
      const layer = layers[layerIndex];
      if (layer && layer.tiles[tileIndex]) {
        const tile = layer.tiles[tileIndex];
        if (lineSpriteCount > 1) {
          tile.v = index / (lineSpriteCount - 1); // Map [0, lineSpriteCount-1] to [0, 1]
        } else {
          tile.v = 0.5; // Center if only one line sprite
        }
      }
    });
  }

  // Post-process for thumbnail mode
  if (state.thumbnailMode && layers.length > 0 && layers[0].tiles.length > 0) {
    const thumbnailConfig = state.thumbnailMode;
    const primaryLayer = layers[0];
    const primaryTile = primaryLayer.tiles[0];
    let secondaryTiles = primaryLayer.tiles.slice(1);

    // Configure primary sprite
    // Use the color index from thumbnail config (respects theme mode)
    const primaryColorIndex = thumbnailConfig.primaryColorIndex ?? 0;
    primaryTile.paletteColorIndex = primaryColorIndex;
    primaryTile.scale = thumbnailConfig.primaryScale;
    primaryTile.blendMode = "NONE"; // Primary sprite should have no blend mode
    // For parallax mode, set primary sprite to highest depth (moves fastest)
    if (state.movementMode === "parallax") {
      primaryTile.parallaxDepth = 1.0; // Maximum depth = fastest movement
    }
    if (thumbnailConfig.primaryPosition) {
      primaryTile.u = thumbnailConfig.primaryPosition.u;
      primaryTile.v = thumbnailConfig.primaryPosition.v;
    }

    // Update primary tile tint to match the new color index
    const primaryColor = chosenPalette[primaryColorIndex] ?? chosenPalette[0];
    primaryTile.tint = primaryColor;

    // Configure secondary sprites
    const secondaryColor = chosenPalette[thumbnailConfig.secondaryColorIndex] ?? chosenPalette[1];
    const targetSecondaryCount = thumbnailConfig.secondaryCount;
    
    // Distribute secondary sprites randomly but evenly across the canvas
    // Use a seeded RNG based on the state seed to ensure consistent placement
    const positionRng = createMulberry32(hashSeed(`${state.seed}-thumbnail-secondary-positions`));
    const minDistance = 0.15; // Minimum distance from center (to avoid overlap with primary)
    const maxDistance = 0.45; // Maximum distance from center (keep on canvas)
    const padding = 0.1; // Padding from edges to keep sprites visible
    
    // Create additional secondary tiles if we don't have enough
    if (secondaryTiles.length < targetSecondaryCount) {
      const selectedSpriteIds = state.selectedSprites.length > 0 
        ? state.selectedSprites 
        : ["/sprites/default/square.svg"]; // Fallback to square
      const spriteInfo = getSpriteInfo(selectedSpriteIds[0]);
      const defaultSpritePath = spriteInfo?.svgSprite?.svgPath || "/sprites/default/square.svg";
      const defaultSpriteId = spriteInfo?.svgSprite?.id || "square";
      
      // Create additional tiles to reach target count
      for (let i = secondaryTiles.length; i < targetSecondaryCount; i++) {
        // Generate position for new tile
        const angle = positionRng() * 2 * Math.PI;
        const distance = minDistance + positionRng() * (maxDistance - minDistance);
        let u = 0.5 + distance * Math.cos(angle);
        let v = 0.5 + distance * Math.sin(angle);
        u = Math.max(padding, Math.min(1 - padding, u));
        v = Math.max(padding, Math.min(1 - padding, v));
        
        // Create new tile
        // Scale and depth will be set in the loop below for parallax mode
        const newTile: PreparedTile = {
          kind: "svg",
          svgPath: defaultSpritePath,
          spriteId: defaultSpriteId,
          tint: secondaryColor,
          paletteColorIndex: thumbnailConfig.secondaryColorIndex,
          u,
          v,
          scale: thumbnailConfig.secondaryScale, // Will be overridden for parallax
          blendMode: "NONE", // Secondary sprites should have no blend mode
          rotationBase: 0,
          rotationDirection: 1,
          rotationSpeed: 0,
          rotationBaseMultiplier: 0,
          rotationSpeedMultiplier: 0,
          animationTimeMultiplier: 1.0,
          isOutlined: false,
        };
        secondaryTiles.push(newTile);
      }
    }
    
    // Configure all secondary sprites (existing and newly created)
    // Re-position all secondary tiles to ensure even distribution
    // For parallax mode, give secondary sprites varying sizes and depths
    const isParallax = state.movementMode === "parallax";
    const scaleRng = createMulberry32(hashSeed(`${state.seed}-thumbnail-secondary-scales`));
    
    for (let i = 0; i < targetSecondaryCount; i++) {
      const tile = secondaryTiles[i];
      tile.paletteColorIndex = thumbnailConfig.secondaryColorIndex;
      
      // For parallax mode, give secondary sprites varying sizes (but all smaller than primary)
      if (isParallax) {
        // Vary scale between 30% and 70% of primary scale (all smaller than primary)
        const scaleVariation = 0.3 + scaleRng() * 0.4; // 0.3 to 0.7
        tile.scale = thumbnailConfig.primaryScale * scaleVariation;
        
        // Set parallax depth based on size (larger = higher depth = faster)
        // Depth range: 0.2 to 0.7 (all slower than primary which is 1.0)
        const normalizedScale = (tile.scale - thumbnailConfig.primaryScale * 0.3) / (thumbnailConfig.primaryScale * 0.4);
        tile.parallaxDepth = 0.2 + normalizedScale * 0.5; // 0.2 to 0.7
      } else {
        // Non-parallax: use fixed secondary scale
        tile.scale = thumbnailConfig.secondaryScale;
      }
      
      tile.blendMode = "NONE"; // Secondary sprites should have no blend mode
      
      // Generate new position for all secondary tiles (ensures even distribution)
      const angle = positionRng() * 2 * Math.PI;
      const distance = minDistance + positionRng() * (maxDistance - minDistance);
      
      // Convert to cartesian coordinates
      let u = 0.5 + distance * Math.cos(angle);
      let v = 0.5 + distance * Math.sin(angle);
      
      // Clamp to keep sprites on canvas (with padding)
      u = Math.max(padding, Math.min(1 - padding, u));
      v = Math.max(padding, Math.min(1 - padding, v));
      
      tile.u = u;
      tile.v = v;
      tile.tint = secondaryColor;
    }

    // Update layer with exactly the tiles we need (1 primary + targetSecondaryCount secondary)
    // Put primary tile LAST so it renders on top (in front of secondary sprites)
    primaryLayer.tiles = [...secondaryTiles.slice(0, targetSecondaryCount), primaryTile];
    primaryLayer.tileCount = primaryLayer.tiles.length;
  }

  return { layers, background };
};

export type TransitionType = "instant" | "fade" | "smooth" | "pixellate";

export interface SpriteController {
  getState: () => GeneratorState;
  applyState: (state: GeneratorState, transition?: TransitionType, durationMs?: number) => void;
  randomizeAll: () => void;
  randomizeColors: () => void;
  refreshPaletteApplication: () => void;
  randomizeGradientColors: () => void;
  randomizeScale: () => void;
  randomizeScaleRange: () => void;
  randomizeMotion: () => void;
  randomizeBlendMode: () => void;
  randomizeSpriteShapes: () => void;
  setScalePercent: (value: number) => void;
  setScaleBase: (value: number) => void;
  setScaleSpread: (value: number) => void;
  setScaleWeighting: (value: number) => void;
  setLinesRatio: (value: number) => void;
  setPaletteVariance: (value: number) => void;
  setHueShift: (value: number) => void;
  setSaturation: (value: number) => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setColorAdjustmentsEnabled: (enabled: boolean) => void;
  setGradientsEnabled: (enabled: boolean) => void;
  setBlendOpacityEnabled: (enabled: boolean) => void;
  setCanvasEnabled: (enabled: boolean) => void;
  setDensityScaleEnabled: (enabled: boolean) => void;
  setMotionIntensity: (value: number) => void;
  setMotionSpeed: (value: number) => void;
  setParallaxAngle: (angle: number) => void;
  setParallaxDepthEffect: (value: number) => void;
  setAnimationEnabled: (enabled: boolean) => void;
  setBlendMode: (mode: BlendModeOption) => void;
  setBlendModeAuto: (value: boolean) => void;
  setLayerOpacity: (value: number) => void;
  setSpriteMode: (mode: SpriteMode) => void; // DEPRECATED: kept for backward compatibility
  toggleSpriteSelection: (spriteIdentifier: string) => void; // Toggle sprite selection (add/remove from selectedSprites)
  setMovementMode: (mode: MovementMode) => void;
  setRotationEnabled: (value: boolean) => void;
  setRotationAmount: (value: number) => void;
  setRotationSpeed: (value: number) => void;
  setRotationAnimated: (value: boolean) => void;
  usePalette: (paletteId: PaletteId) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  setBackgroundHueShift: (value: number) => void;
  setBackgroundSaturation: (value: number) => void;
  setBackgroundBrightness: (value: number) => void;
  setBackgroundContrast: (value: number) => void;
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
  setHueRotationEnabled: (enabled: boolean) => void;
  setHueRotationSpeed: (speed: number) => void;
  setPaletteCycleEnabled: (enabled: boolean) => void;
  setPaletteCycleSpeed: (speed: number) => void;
  setCanvasHueRotationEnabled: (enabled: boolean) => void;
  setCanvasHueRotationSpeed: (speed: number) => void;
  setAspectRatio: (ratio: "16:9" | "21:9" | "16:10" | "custom") => void;
  setCustomAspectRatio: (width: number, height: number) => void;
  setOutlineEnabled: (enabled: boolean) => void;
  setOutlineStrokeWidth: (width: number) => void;
  setOutlineMixed: (enabled: boolean) => void;
  setOutlineBalance: (value: number) => void;
  setFilledOpacity: (value: number) => void;
  setOutlinedOpacity: (value: number) => void;
  randomizeOutlineDistribution: () => void;
  // FX (Visual Effects) controller methods
  // Bloom
  setBloomEnabled: (enabled: boolean) => void;
  setBloomIntensity: (intensity: number) => void;
  setBloomThreshold: (threshold: number) => void;
  setBloomRadius: (radius: number) => void;
  // Noise
  setNoiseEnabled: (enabled: boolean) => void;
  setNoiseType: (type: "grain" | "crt" | "bayer" | "static" | "scanlines") => void;
  setNoiseStrength: (strength: number) => void;
  // Pixelation
  setPixelationEnabled: (enabled: boolean) => void;
  setPixelationSize: (size: number) => void;
  setPixelationGridEnabled: (enabled: boolean) => void;
  setPixelationGridBrightness: (brightness: number) => void;
  setPixelationGridUsePalette: (usePalette: boolean) => void;
  randomizePixelationGridColor: () => void;
  setColorQuantizationEnabled: (enabled: boolean) => void;
  setColorQuantizationBits: (bits: number) => void;
  // Halftone
  setHalftoneEnabled: (enabled: boolean) => void;
  setHalftoneDotSize: (size: number) => void;
  setHalftoneSpacing: (spacing: number) => void;
  setHalftoneAngle: (angle: number) => void;
  setHalftoneShape: (shape: "circle" | "square" | "diamond") => void;
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
  // Load settings from localStorage
  let initialAspectRatio = DEFAULT_STATE.aspectRatio; // Defaults to "16:9"
  let initialCustomAspectRatio = DEFAULT_STATE.customAspectRatio;
  try {
    const settingsJson = localStorage.getItem("pixli-settings");
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      if (settings.aspectRatio) {
        // Force 16:9 if "square" is saved (remove square support - backward compatibility)
        const loadedRatio = settings.aspectRatio;
        initialAspectRatio = (loadedRatio === "square" || !["16:9", "21:9", "16:10", "custom"].includes(loadedRatio)) 
          ? "16:9" 
          : loadedRatio as "16:9" | "21:9" | "16:10" | "custom";
      }
      if (settings.customAspectRatio) {
        initialCustomAspectRatio = settings.customAspectRatio;
      }
    }
  } catch (error) {
    console.error("Failed to load aspect ratio settings:", error);
  }
  
  // Always default to 16:9, never square (backward compatibility check)
  if (!["16:9", "21:9", "16:10", "custom"].includes(initialAspectRatio)) {
    initialAspectRatio = "16:9";
  }

  // Get random sprite for initialization
  const randomSpriteIdentifier = getRandomDefaultSprite();
  const defaultCollection = getCollection("default");
  let initialSpriteMode: SpriteMode = "star"; // Fallback
  
  // Find the sprite mode for the selected sprite
  if (defaultCollection) {
    const sprite = defaultCollection.sprites.find(s => 
      s.svgPath === randomSpriteIdentifier
    );
    if (sprite) {
      // Use spriteMode if available, otherwise use id
      if (sprite.spriteMode) {
        initialSpriteMode = sprite.spriteMode;
      } else if (sprite.id) {
        initialSpriteMode = sprite.id as SpriteMode;
      }
    }
  }

  // Store state in an object that can be updated
  // This ensures closures always read from the same reference, even after HMR
  const stateRef = { 
    current: {
      ...DEFAULT_STATE,
      seed: generateSeedString(),
      previousBlendMode: DEFAULT_STATE.blendMode,
      aspectRatio: initialAspectRatio,
      customAspectRatio: initialCustomAspectRatio,
      spriteMode: initialSpriteMode, // Set to match selected sprite
      selectedSprites: [randomSpriteIdentifier], // Random sprite from default collection on initialization
    } as GeneratorState
  };
  let state = stateRef.current;
  let prepared = computeSprite(state);
  
  // Persistent storage for parallax world positions
  // Key: "seed-layer-u-v" (deterministic based on tile position)
  // Value: { x: number, y: number } (world position in pixels)
  // This persists across computeSprite calls which recreate tile objects
  const parallaxPositions = new Map<string, { x: number; y: number }>();
  
  // Initialize CSS variable for container aspect ratio
  const initializeAspectRatioCSS = () => {
    const currentRatio = stateRef.current.aspectRatio;
    let paddingTopPercent = 56.25; // Default to 16:9
    switch (currentRatio) {
      case "16:9":
        paddingTopPercent = 56.25; // 9/16 * 100
        break;
      case "21:9":
        paddingTopPercent = 42.857; // 9/21 * 100
        break;
      case "16:10":
        paddingTopPercent = 62.5; // 10/16 * 100
        break;
      case "custom":
        const custom = stateRef.current.customAspectRatio;
        paddingTopPercent = (custom.height / custom.width) * 100;
        break;
      default:
        // Always default to 16:9 (square removed)
        paddingTopPercent = 56.25;
        break;
    }
    document.documentElement.style.setProperty('--canvas-aspect-ratio', `${paddingTopPercent}%`);
  };
  
  // Initialize on creation - set CSS variable immediately
  initializeAspectRatioCSS();
  
  // Also set it on the next frame to ensure it's applied after DOM is ready
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      initializeAspectRatioCSS();
    });
  }
  
  let p5Instance: P5WithCanvas | null = null;
  let destroyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pauseTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Transition state
  let transitionState: {
    isTransitioning: boolean;
    fromState: GeneratorState | null;
    toState: GeneratorState | null;
    startTime: number;
    duration: number;
    type: TransitionType;
    // For pixellate transitions, store the target pixelation value and scene load flag
    targetPixelationSize?: number;
    sceneLoadedAtMax?: boolean; // Flag to track if scene was loaded at max pixelation
  } = {
    isTransitioning: false,
    fromState: null,
    toState: null,
    startTime: 0,
    duration: 0,
    type: "instant",
    targetPixelationSize: undefined,
    sceneLoadedAtMax: false,
  };
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
    // Instead of modifying prepared object in place, update the blendModeSeedSuffix
    // This will cause blend modes to be recalculated with new random values on next recompute
    const newBlendModeSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    applyState({ blendModeSeedSuffix: newBlendModeSeedSuffix }, { recompute: true });
  };

  const reassignRandomShapes = () => {
    if (!prepared || !stateRef.current.randomSprites) {
      return;
    }

    // All tiles are now SVG-based, no shape assignment needed
    // This function is kept for backward compatibility but does nothing
    
    // Force a redraw by updating the p5 instance if available
    if (hasRedraw(p5Instance)) {
      p5Instance.redraw();
    }
  };

  const notifyState = () => {
    options.onStateChange?.({ ...stateRef.current });
  };

  const updateSprite = async () => {
    prepared = computeSprite(stateRef.current);
    
    // Preload all sprite images to prevent stuttering during rendering
    // Collect all unique sprite paths from all layers and tiles
    const spritePaths = new Set<string>();
    prepared.layers.forEach(layer => {
      layer.tiles.forEach(tile => {
        if (tile.svgPath) {
          spritePaths.add(tile.svgPath);
        }
      });
    });
    
    // Preload all sprite images in parallel (non-blocking)
    // This ensures images are cached before rendering starts
    if (spritePaths.size > 0) {
      preloadSpriteImages(Array.from(spritePaths)).catch((error) => {
        // Non-fatal - sprites will load lazily during rendering if preload fails
        if (import.meta.env.DEV) {
          console.warn('Failed to preload some sprite images:', error);
        }
      });
    }
    
    notifyState();
  };

  const updateSeed = (seed?: string) => {
    stateRef.current.seed = seed ?? generateSeedString();
    state = stateRef.current; // Keep local variable in sync
    // Clear parallax positions when seed changes (new scene = new tile positions)
    parallaxPositions.clear();
  };

  // Helper function to calculate canvas dimensions based on aspect ratio
  const calculateCanvasDimensions = (
    containerWidth: number,
    _containerHeight: number,
    isFullscreen: boolean
  ): { width: number; height: number } => {
    const state = getState();
    const minCanvasWidth = 320;
    const minCanvasHeight = 240;
    const maxResolution = options.maxResolution; // Get max resolution from options
    
    let dimensions: { width: number; height: number };
    let targetWidth: number;
    
    if (isFullscreen) {
      // In fullscreen, fit to viewport while maintaining aspect ratio
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportRatio = viewportWidth / viewportHeight;
      
      // Calculate dimensions based on aspect ratio, but fit to viewport
      switch (state.aspectRatio) {
        case "16:9": {
          const aspectRatio = 16 / 9;
          if (viewportRatio > aspectRatio) {
            // Viewport is wider than 16:9, height is limiting
            dimensions = {
              width: Math.round(viewportHeight * aspectRatio),
              height: viewportHeight,
            };
          } else {
            // Viewport is taller than 16:9, width is limiting
            dimensions = {
              width: viewportWidth,
              height: Math.round(viewportWidth / aspectRatio),
            };
          }
          break;
        }
        case "21:9": {
          const aspectRatio = 21 / 9;
          if (viewportRatio > aspectRatio) {
            dimensions = {
              width: Math.round(viewportHeight * aspectRatio),
              height: viewportHeight,
            };
          } else {
            dimensions = {
              width: viewportWidth,
              height: Math.round(viewportWidth / aspectRatio),
            };
          }
          break;
        }
        case "16:10": {
          const aspectRatio = 16 / 10;
          if (viewportRatio > aspectRatio) {
            dimensions = {
              width: Math.round(viewportHeight * aspectRatio),
              height: viewportHeight,
            };
          } else {
            dimensions = {
              width: viewportWidth,
              height: Math.round(viewportWidth / aspectRatio),
            };
          }
          break;
        }
        case "custom": {
          const custom = state.customAspectRatio;
          const customRatio = custom.width / custom.height;
          if (viewportRatio > customRatio) {
            dimensions = {
              width: Math.round(viewportHeight * customRatio),
              height: viewportHeight,
            };
          } else {
            dimensions = {
              width: viewportWidth,
              height: Math.round(viewportWidth / customRatio),
            };
          }
          break;
        }
        default: {
          // Fallback to 16:9
          const aspectRatio = 16 / 9;
          if (viewportRatio > aspectRatio) {
            dimensions = {
              width: Math.round(viewportHeight * aspectRatio),
              height: viewportHeight,
            };
          } else {
            dimensions = {
              width: viewportWidth,
              height: Math.round(viewportWidth / aspectRatio),
            };
          }
          break;
        }
      }
    } else {
      // In normal mode, use container dimensions
      targetWidth = Math.max(minCanvasWidth, containerWidth);
      
      // Calculate dimensions based on aspect ratio
      switch (state.aspectRatio) {
        case "16:9":
          // 16:9 (Widescreen)
          dimensions = {
            width: Math.max(minCanvasWidth, targetWidth),
            height: Math.max(minCanvasHeight, Math.round(Math.max(minCanvasWidth, targetWidth) * (9 / 16))),
          };
          break;
      
        case "21:9":
          // 21:9 (Ultra-Wide)
          dimensions = {
            width: Math.max(minCanvasWidth, targetWidth),
            height: Math.max(minCanvasHeight, Math.round(Math.max(minCanvasWidth, targetWidth) * (9 / 21))),
          };
          break;
        
        case "16:10":
          // 16:10 (WUXGA)
          dimensions = {
            width: Math.max(minCanvasWidth, targetWidth),
            height: Math.max(minCanvasHeight, Math.round(Math.max(minCanvasWidth, targetWidth) * (10 / 16))),
          };
          break;
        
        case "custom":
          // Custom dimensions - scale to fit container width
          const custom = state.customAspectRatio;
          const scale = targetWidth / custom.width;
          dimensions = {
            width: Math.max(minCanvasWidth, Math.round(custom.width * scale)),
            height: Math.max(minCanvasHeight, Math.round(custom.height * scale)),
          };
          break;
        
        default:
          // Fallback to 16:9
          dimensions = {
            width: Math.max(minCanvasWidth, targetWidth),
            height: Math.max(minCanvasHeight, Math.round(Math.max(minCanvasWidth, targetWidth) * (9 / 16))),
          };
          break;
      }
    }
    
    // Apply max resolution cap if specified
    if (maxResolution && dimensions.width > maxResolution) {
      const scale = maxResolution / dimensions.width;
      dimensions = {
        width: maxResolution,
        height: Math.max(minCanvasHeight, Math.round(dimensions.height * scale)),
      };
    }
    
    return dimensions;
  };

  const sketch = (p: p5) => {
    let canvas: p5.Renderer;
    let animationTime = 0;
    let scaledAnimationTime = 0; // Scaled time that accumulates smoothly
    let currentSpeedFactor = 1.0; // Current speed factor (smoothly interpolated)
    let targetSpeedFactor = 1.0; // Target speed factor from slider
    // Independent animation timelines
    let spriteHueRotationTime = 0; // Timeline for sprite hue rotation (10s period)
    let paletteCycleTime = 0; // Timeline for palette cycling (30s period)
    let canvasHueRotationTime = 0; // Timeline for canvas hue rotation (12s period)
    let wasPaletteCycleEnabled = false; // Track palette cycling state to detect enable/disable

    p.setup = () => {
      try {
        // Ensure CSS variable is set before creating canvas
        initializeAspectRatioCSS();
        
        // Check if container is attached - if not, create canvas anyway and parent it later
        const isContainerReady = container && container.parentNode;
        
        // Container may not be attached during initial setup - this is handled gracefully
        
        // Get container width - use parent since sketch-container is absolutely positioned
        // Use getBoundingClientRect() for accurate width calculation (matches performResize)
        const parentContainer = container?.parentElement;
        let containerWidth = 0;
        if (isContainerReady && parentContainer) {
          const rect = parentContainer.getBoundingClientRect();
          containerWidth = rect.width || parentContainer.clientWidth || 0;
        }
        
        // If container has no width yet, use fallback
        if (containerWidth === 0) {
          containerWidth = 1280; // Fallback width
        }
        
        // Calculate canvas dimensions based on aspect ratio
        const state = getState();
        let aspectRatioMultiplier = 9 / 16; // Default to 16:9
        switch (state.aspectRatio) {
          case "16:9":
            aspectRatioMultiplier = 9 / 16;
            break;
          case "21:9":
            aspectRatioMultiplier = 9 / 21;
            break;
          case "16:10":
            aspectRatioMultiplier = 10 / 16;
            break;
          case "custom":
            aspectRatioMultiplier = state.customAspectRatio.height / state.customAspectRatio.width;
            break;
        }
        
        // Minimum canvas size (no maximum - let it scale with container)
        const minCanvasSize = 320;
        const size = Math.max(minCanvasSize, containerWidth);
        
        // Calculate width and height maintaining aspect ratio
        const canvasWidth = size;
        const canvasHeight = Math.round(size * aspectRatioMultiplier);
        
        // Validate size before creating canvas
        if (size <= 0 || !isFinite(size) || canvasWidth <= 0 || canvasHeight <= 0) {
          console.error("Invalid canvas size:", canvasWidth, canvasHeight, "containerWidth:", containerWidth);
          canvas = p.createCanvas(1280, 720); // Fallback to 16:9 default
        } else {
          canvas = p.createCanvas(canvasWidth, canvasHeight);
        }
        
        // CRITICAL: Parent canvas to container immediately
        // If container isn't ready, the canvas will be in the wrong place
        // Also check for actual container in DOM (React might have recreated it)
        const actualContainer = (document.querySelector('.sketch-container') as HTMLElement) || container;
        const containerToUse = (actualContainer && actualContainer.isConnected) ? actualContainer : container;
        
        if (containerToUse && containerToUse.parentNode) {
          canvas.parent(containerToUse);
          
          // CRITICAL: Ensure canvas element's actual dimensions match container for proper rendering
          // Canvas elements need their width/height attributes to match display size for proper scaling
          if (canvas.elt) {
            const containerRect = containerToUse.getBoundingClientRect();
            const containerWidth = containerRect.width || containerToUse.clientWidth || 0;
            const containerHeight = containerRect.height || containerToUse.clientHeight || 0;
            
            if (containerWidth > 0 && containerHeight > 0) {
              // Set canvas element's actual pixel dimensions to match container
              // This ensures the canvas renders correctly at the container size
              canvas.elt.width = Math.round(containerWidth);
              canvas.elt.height = Math.round(containerHeight);
            }
          }
          
          // Verify it worked
          if (canvas.elt && canvas.elt.parentElement !== containerToUse) {
            // Force it into the right place
            containerToUse.appendChild(canvas.elt);
          }
        } else {
          // Container not ready - try to parent it anyway
          try {
            canvas.parent(container);
          } catch (e) {
            // Container will be ready soon, canvas will be repositioned
          }
          
          // Retry to fix the parenting once container is ready
          let retryCount = 0;
          const maxRetries = 40; // 2 seconds max
          const tryParentCanvas = () => {
            if (canvas && canvas.elt && container && container.parentNode) {
              // Check if canvas is in wrong place
              if (canvas.elt.parentElement !== container) {
                // Force it into the right place
                container.appendChild(canvas.elt);
              }
            } else if (canvas && canvas.elt && retryCount < maxRetries) {
              retryCount++;
              setTimeout(tryParentCanvas, 50);
            }
          };
          setTimeout(tryParentCanvas, 50);
        }
        
        // Verify canvas is in the right place and remove inline styles
        if (canvas.elt) {
          // Force canvas into container if it's not there
          if (container && canvas.elt.parentElement !== container) {
            // Always force it into the right place
            try {
              container.appendChild(canvas.elt);
            } catch (e) {
              // Retry in a moment
              setTimeout(() => {
                if (container && container.parentNode && canvas.elt && canvas.elt.parentElement !== container) {
                  container.appendChild(canvas.elt);
                }
              }, 100);
            }
          }
          
          // Verify container has height (parent should have padding-top for aspect ratio)
          const parentWrapper = container?.parentElement;
          if (parentWrapper) {
            const wrapperRect = parentWrapper.getBoundingClientRect();
            const wrapperHeight = wrapperRect.height;
            
            if (wrapperHeight === 0) {
              console.error("Canvas wrapper has no height! This will cause positioning issues.");
            }
          }
          
          // Remove ALL inline styles - CSS will control display size
          // The canvas element's width/height ATTRIBUTES (not styles) are set by p5.js and are needed for rendering
          // But we need to remove inline width/height STYLES so CSS can control the display size
          const removeInlineStyles = () => {
            if (canvas.elt) {
              // Remove ALL inline styles - CSS will handle everything
              canvas.elt.style.removeProperty('position');
              canvas.elt.style.removeProperty('top');
              canvas.elt.style.removeProperty('left');
              canvas.elt.style.removeProperty('right');
              canvas.elt.style.removeProperty('bottom');
              canvas.elt.style.removeProperty('width');
              canvas.elt.style.removeProperty('height');
              // Set all to empty so CSS can control them
              canvas.elt.style.position = '';
              canvas.elt.style.width = '';
              canvas.elt.style.height = '';
            }
          };
          
          // Intercept style property setters to prevent p5.js from setting inline styles
          const interceptStyleSetters = () => {
            if (!canvas.elt) return;
            
            const style = canvas.elt.style;
            const originalSetProperty = style.setProperty.bind(style);
            const originalRemoveProperty = style.removeProperty.bind(style);
            
            // Override setProperty to block width/height/position styles
            style.setProperty = function(property: string, value: string, priority?: string) {
              if (property === 'width' || property === 'height' || property === 'position' || 
                  property === 'top' || property === 'left' || property === 'right' || property === 'bottom') {
                // Block these properties - CSS will handle them
                return;
              }
              return originalSetProperty(property, value, priority);
            };
            
            // Store cleanup function
            (p as any)._pixliStyleIntercept = () => {
              style.setProperty = originalSetProperty;
              style.removeProperty = originalRemoveProperty;
            };
          };
          
          // Remove immediately
          removeInlineStyles();
          
          // Intercept style setters to prevent p5.js from re-adding inline styles
          interceptStyleSetters();
          
          // Verify canvas is visible
          try {
            const canvasRect = canvas.elt.getBoundingClientRect();
            if (canvasRect.width === 0 || canvasRect.height === 0) {
              console.error("Canvas has zero dimensions!");
            }
          } catch (error) {
            // Canvas info check failed - not critical
          }
          
          // Monitor canvas parent to ensure it stays in the correct container
          // CSS handles style overrides, so we only need to check parent positioning
          const observer = { disconnect: () => {} } as MutationObserver;
          
          // Don't use setInterval - it causes flicker. p5.js should maintain the parent.
          // If canvas gets detached, it will be handled by performResize if needed.
          
          // Clean up on destroy
          (p as any)._pixliStyleCleanup = () => {
            observer.disconnect();
            if ((p as any)._pixliStyleIntercept) {
              (p as any)._pixliStyleIntercept();
            }
          };
        }
        
        p.pixelDensity(1);
        p.noStroke();
        p.noSmooth();
        p.imageMode(p.CENTER);
        
        // Mark canvas as ready - this allows performResize to work
        canvasReady = true;
      } catch (error) {
        console.error("Error in p5.setup:", error);
        // Fallback to safe defaults
        canvas = p.createCanvas(1280, 720);
        if (container && container.parentNode) {
          canvas.parent(container);
        }
        p.pixelDensity(1);
        p.noStroke();
        p.noSmooth();
        p.imageMode(p.CENTER);
        
        // Mark canvas as ready even in error case
        canvasReady = true;
      }
    };

    // Flag to prevent recursive resize calls
    let isResizing = false;
    let canvasReady = false; // Track if canvas has been created and is ready
    
    // Internal resize function (doesn't need UIEvent parameter)
    const performResize = () => {
      // Don't resize if canvas hasn't been created yet
      if (!canvas || !canvas.elt) {
        return;
      }
      
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
      
      // CRITICAL: Get the actual container from DOM (container ref might point to detached element)
      // The container variable in closure might be stale if React recreated the element
      const actualContainer = (document.querySelector('.sketch-container') as HTMLElement) || container;
      const containerToUse = actualContainer.isConnected ? actualContainer : container;
      
      // Calculate canvas dimensions based on aspect ratio setting
      // The sketch-container is absolutely positioned, so get dimensions from parent (canvas-wrapper)
      const parentContainer = containerToUse.parentElement;
      let containerWidth = 0;
      let containerHeight = 0;
      
      // In fullscreen, always use viewport dimensions
      // The container may have 0x0 dimensions in fullscreen, so we must use viewport
      if (isFullscreen) {
        // Always use viewport dimensions in fullscreen - container may not be sized yet
        containerWidth = window.innerWidth || 1920;
        containerHeight = window.innerHeight || 1080;
        
        // Also ensure the container itself has proper dimensions for CSS
        if (containerToUse) {
          const containerRect = containerToUse.getBoundingClientRect();
          // If container has 0 dimensions, we need to wait a bit for CSS to apply
          if (containerRect.width === 0 || containerRect.height === 0) {
            // Use viewport dimensions - CSS should make container fill viewport
            containerWidth = window.innerWidth || 1920;
            containerHeight = window.innerHeight || 1080;
          } else {
            // Container has dimensions, use them
            containerWidth = containerRect.width;
            containerHeight = containerRect.height;
          }
        }
      } else if (parentContainer) {
        const rect = parentContainer.getBoundingClientRect();
        containerWidth = rect.width || parentContainer.clientWidth || 0;
        containerHeight = rect.height || parentContainer.clientHeight || 0;
        
        // If height is 0 or invalid, calculate from width and aspect ratio
        if (containerHeight <= 0 && containerWidth > 0) {
          containerHeight = containerWidth * (9 / 16); // 16:9 aspect ratio
        }
      } else {
        // Fallback to container itself
        const rect = containerToUse.getBoundingClientRect();
        containerWidth = rect.width || containerToUse.clientWidth || 0;
        containerHeight = rect.height || containerToUse.clientHeight || 0;
        
        // In fullscreen, use viewport dimensions if container dimensions are invalid
        if (isFullscreen && (containerWidth === 0 || containerHeight === 0)) {
          containerWidth = window.innerWidth || 1920;
          containerHeight = window.innerHeight || 1080;
        }
      }
      
      // Guard against invalid dimensions - container might not be laid out yet
      if (containerWidth <= 0 || !isFinite(containerWidth)) {
        // In fullscreen, always use viewport as fallback
        if (isFullscreen) {
          containerWidth = window.innerWidth || 1920;
          containerHeight = window.innerHeight || 1080;
        } else {
          // Don't log warning - this is normal during initial setup
          // The canvas will resize once the container is properly laid out
          isResizing = false;
          return;
        }
      }
      
      const dimensions = calculateCanvasDimensions(containerWidth, containerHeight, isFullscreen);
      const canvasWidth = dimensions.width;
      const canvasHeight = dimensions.height;
      
      // Validate dimensions
      if (canvasWidth <= 0 || canvasHeight <= 0 || !isFinite(canvasWidth) || !isFinite(canvasHeight)) {
        console.error("performResize: Invalid canvas dimensions:", canvasWidth, canvasHeight, "containerWidth:", containerWidth, "containerHeight:", containerHeight);
        p.resizeCanvas(1280, 720); // Fallback to 16:9 default
      } else {
        p.resizeCanvas(canvasWidth, canvasHeight);
      }
      
      // After resizeCanvas, ensure canvas is in container (p5.js might recreate it)
      // Do this ONCE after a small delay, not in a loop
      requestAnimationFrame(() => {
        if (canvas && canvas.elt && containerToUse && containerToUse.isConnected) {
          // Only re-parent if canvas is actually detached
          if (!canvas.elt.isConnected || canvas.elt.parentElement !== containerToUse) {
            containerToUse.appendChild(canvas.elt);
          }
        }
      });
      
      // Reset flag after resize completes
      requestAnimationFrame(() => {
        isResizing = false;
      });
    };

    // Handle windowResized with a function that satisfies Zod validation
    // p5.js uses Zod to validate the function signature: (event: UIEvent) => UIEvent
    // The challenge is that p5.js may call it with undefined or invalid types
    // We create a function that always accepts and returns a UIEvent
    const defaultResizeEvent = new UIEvent('resize', { bubbles: false, cancelable: false });
    
    // Use Object.defineProperty to create a function that always validates
    // This ensures Zod sees the correct signature while we handle invalid calls
    const handler = function(event: UIEvent): UIEvent {
      // If event is not a UIEvent (undefined, null, or wrong type), use default
      const uiEvent = (event instanceof UIEvent) ? event : defaultResizeEvent;
      
      // Don't resize if canvas isn't ready yet
      if (!canvasReady || !canvas || !canvas.elt) {
        return uiEvent;
      }
      
      // If we're already resizing, don't call performResize again
      if (!isResizing) {
        performResize();
      }
      
      return uiEvent;
    };
    
    // Assign the handler - Zod will validate the signature matches (event: UIEvent) => UIEvent
    // When p5.js calls it with undefined, JavaScript passes undefined as the argument
    // Our function handles it by using defaultResizeEvent
    p.windowResized = handler;
    
    // Watch container for size changes (triggers when layout changes cause container to resize)
    // This ensures canvas resizes even when window doesn't resize but container does
    // CRITICAL: Delay initial observation to prevent race conditions during setup
    let setupComplete = false;
    setTimeout(() => {
      setupComplete = true;
    }, 1000); // Give setup 1 second to complete - canvas needs time to render
    
    if (typeof ResizeObserver !== 'undefined') {
      const containerResizeObserver = new ResizeObserver(() => {
        // Don't resize during initial setup - wait for setup to complete
        if (!setupComplete || !canvasReady) {
          return;
        }
        // Small delay to ensure layout has settled
        setTimeout(() => {
          if (canvasReady && canvas && canvas.elt) {
            performResize();
          }
        }, 50);
      });
      // Delay observing to prevent immediate triggers
      setTimeout(() => {
        // Always observe the actual container in DOM (React might have recreated it)
        const actualContainer = document.querySelector('.sketch-container') as HTMLElement;
        const containerToObserve = (actualContainer && actualContainer.isConnected) ? actualContainer : container;
        if (containerToObserve && containerToObserve.parentNode) {
          containerResizeObserver.observe(containerToObserve);
        }
      }, 1200); // Start observing after setup completes
      
      // Store observer for cleanup
      if (hasResizeObserver(container)) {
        container._resizeObserver = containerResizeObserver;
      } else {
        // Type assertion needed for initial assignment
        (container as HTMLElementWithResizeObserver)._resizeObserver = containerResizeObserver;
      }
    }
    
    // Also resize on fullscreen changes - SIMPLE: just resize once
    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (canvasReady && canvas && canvas.elt) {
          performResize();
        }
      }, 100);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    p.draw = function() {
      // CRITICAL: If canvas doesn't exist, something is very wrong
      if (!canvas || !canvas.elt) {
        console.error("p5.js draw() called but canvas doesn't exist!");
        return;
      }
      
      // Calculate sprite sizing that accounts for canvas aspect ratio
      // For 16:9 canvas, use geometric mean to maintain consistent scale across aspect ratios
      // This ensures sprites scale appropriately for wider canvases while maintaining visual consistency
      // Geometric mean: sqrt(width * height) works well for non-square canvases
      const drawSize = Math.sqrt(p.width * p.height);
      const offsetX = 0; // No offset - use full width
      const offsetY = 0; // No offset - use full height
      // CRITICAL: Use getter function to always read current state
      // This ensures we always read from the current state object, even after HMR module reloads
      // The closure captures the getState function, which always returns the current state
      let currentState = getState();
      
      // Handle transitions
      if (transitionState.isTransitioning && transitionState.fromState && transitionState.toState) {
        const elapsed = Date.now() - transitionState.startTime;
        const progress = calculateTransitionProgress(elapsed, transitionState.duration);
        
        if (progress >= 1) {
          // Transition complete
          transitionState.isTransitioning = false;
          // For pixellate, ensure final state has correct pixelation setting
          if (transitionState.type === "pixellate") {
            // Restore the target scene's pixelation setting
            currentState = {
              ...transitionState.toState,
              pixelationEnabled: transitionState.toState.pixelationEnabled,
              pixelationSize: transitionState.targetPixelationSize ?? 
                (transitionState.toState.pixelationEnabled ? transitionState.toState.pixelationSize : 1),
            };
          } else {
            currentState = transitionState.toState;
          }
          stateRef.current = { ...currentState };
          state = stateRef.current;
          // Recompute sprite with final state
          prepared = computeSprite(currentState);
        } else if (transitionState.type === "pixellate") {
          // Handle pixellate transition separately
          // Phase 1 (0-0.5): Current scene pixelates up to max (50)
          // Phase 2 (0.5-1.0): Next scene pixelates down from max to its saved setting
          const MAX_PIXELATION = 50;
          const targetPixelation = transitionState.targetPixelationSize ?? 
            (transitionState.toState.pixelationEnabled ? transitionState.toState.pixelationSize : 1);
          
          let pixelationSize: number;
          if (progress < 0.5) {
            // Phase 1: Current scene increases pixelation to max
            const phaseProgress = progress / 0.5; // 0 -> 1
            const fromPixelation = transitionState.fromState.pixelationEnabled 
              ? transitionState.fromState.pixelationSize 
              : 1;
            // Stepped: round to nearest integer
            pixelationSize = Math.round(lerp(fromPixelation, MAX_PIXELATION, phaseProgress));
            
            // Clamp to valid range
            pixelationSize = Math.max(1, Math.min(50, pixelationSize));
            
            // Keep using the FROM state (current scene) but with increased pixelation
            currentState = {
              ...transitionState.fromState,
              pixelationEnabled: true, // Always enable during transition
              pixelationSize: pixelationSize,
            };
            stateRef.current = { ...currentState };
            state = stateRef.current;
            prepared = computeSprite(currentState);
          } else {
            // Phase 2: Next scene decreases pixelation from max to target
            const phaseProgress = (progress - 0.5) / 0.5; // 0 -> 1
            // Stepped: round to nearest integer
            pixelationSize = Math.round(lerp(MAX_PIXELATION, targetPixelation, phaseProgress));
            
            // Clamp to valid range
            pixelationSize = Math.max(1, Math.min(50, pixelationSize));
            
            // Load new scene at max pixelation (progress = 0.5)
            // Use a small window to catch the transition point
            if (progress >= 0.5 && !transitionState.sceneLoadedAtMax) {
              // Switch to new scene state at midpoint (mark as loaded)
              transitionState.sceneLoadedAtMax = true;
              // Start with the new scene at max pixelation
              currentState = {
                ...transitionState.toState,
                pixelationEnabled: true,
                pixelationSize: MAX_PIXELATION,
              };
              stateRef.current = { ...currentState };
              state = stateRef.current;
              prepared = computeSprite(currentState);
            } else {
              // Update current state with pixelation (next scene with decreasing pixelation)
              // If target is 0 or pixelation is disabled in the scene, we need to handle that
              const shouldEnablePixelation = targetPixelation > 1 || transitionState.toState.pixelationEnabled;
              currentState = {
                ...transitionState.toState,
                // Enable pixelation during transition, but respect the target scene's setting
                pixelationEnabled: shouldEnablePixelation,
                pixelationSize: pixelationSize,
              };
              stateRef.current = { ...currentState };
              state = stateRef.current;
              prepared = computeSprite(currentState);
            }
          }
        } else if (transitionState.type === "fade") {
          // For fade transitions, keep both states separate and render them with opacity
          // Don't interpolate state values - render both scenes simultaneously
          // fromState will be rendered first with opacity (1 - progress)
          // toState will be rendered second with opacity (progress)
          // Compute sprites for both states independently
          const preparedFrom = computeSprite(transitionState.fromState);
          const preparedTo = computeSprite(transitionState.toState);
          // Store both prepared sprite sets in transitionState for use in rendering
          (transitionState as any).preparedFrom = preparedFrom;
          (transitionState as any).preparedTo = preparedTo;
          // Set currentState to fromState for now (we'll render both in the rendering section)
          currentState = transitionState.fromState;
          prepared = preparedFrom; // Use fromState prepared for now, but we'll render both
        } else {
          // Interpolate state during transition (for smooth transitions)
          currentState = interpolateGeneratorState(
            transitionState.fromState,
            transitionState.toState,
            progress,
            {
              ease: true,
              interpolatePalettes: true,
              interpolateDiscreteValues: transitionState.type === "smooth",
            }
          );
          
          // Recompute sprite with interpolated state
          prepared = computeSprite(currentState, (currentState as any).__interpolatedPalette);
        }
      }
      let motionScale = clamp(currentState.motionIntensity / 100, 0, 1.5);
      const deltaMs = typeof p.deltaTime === "number" ? p.deltaTime : 16.666;
      // Delta time for time-based effects
      (p as P5WithCanvas).deltaMs = deltaMs;
      const deltaTime = deltaMs / 16.666;
      
      // Update animation timelines
      // Sprite hue rotation animation
      if (currentState.hueRotationEnabled) {
        // Add minimum speed floor of 5% so animation never fully stops
        const minSpeed = 0.05; // 5% minimum
        const speedFactor = Math.max(minSpeed, currentState.hueRotationSpeed / 100); // 0.05-1
        spriteHueRotationTime += deltaTime * speedFactor * 0.1; // Scale to ~10s period at 100% speed
        spriteHueRotationTime = spriteHueRotationTime % 10; // Wrap at 10 seconds
      }
      
      // Palette cycling animation
      if (currentState.paletteCycleEnabled) {
        // Add minimum speed floor of 5% so animation never fully stops
        const minSpeed = 0.05; // 5% minimum
        const speedFactor = Math.max(minSpeed, currentState.paletteCycleSpeed / 100); // 0.05-1
        // Reduced from 60s to 30s period at 100% speed for better pacing (~2s per palette)
        // Keep paletteCycleTime continuous (don't wrap) to ensure smooth interpolation
        // deltaTime is normalized to ~1 per frame, convert to seconds: deltaTime * (1/60) = seconds per frame
        // For 30s period: accumulate seconds directly
        const secondsPerFrame = deltaTime / 60; // Convert normalized frame time to seconds
        paletteCycleTime += secondsPerFrame * speedFactor; // Accumulate in seconds
        // Only wrap if it gets too large to prevent overflow (but keep it continuous for calculation)
        // Since paletteCycleTime is now in seconds, wrap at 30 seconds
        if (paletteCycleTime > 30) {
          // Reset to a value that maintains continuity (subtract full periods)
          const periods = Math.floor(paletteCycleTime / 30);
          paletteCycleTime = paletteCycleTime - (periods * 30);
        }
      }
      
      // Canvas hue rotation animation
      if (currentState.canvasHueRotationEnabled) {
        // Add minimum speed floor of 0.1% so animation never fully stops (matches UI min)
        const minSpeed = 0.001; // 0.1% minimum
        const speedFactor = Math.max(minSpeed, currentState.canvasHueRotationSpeed / 100); // 0.001-1
        canvasHueRotationTime += deltaTime * speedFactor * (1 / 12); // Scale to ~12s period at 100% speed
        canvasHueRotationTime = canvasHueRotationTime % 12; // Wrap at 12 seconds
      }
      // Note: Don't reset time when disabled - let it continue from where it left off for smooth re-enabling
      
      // Calculate animated hue shifts with smooth wrapping
      // Use modulo to ensure smooth transitions when wrapping (360° = 0°)
      let animatedSpriteHueShift = currentState.hueRotationEnabled
        ? ((spriteHueRotationTime / 10) * 360) % 360
        : 0;
      let animatedCanvasHueShift = currentState.canvasHueRotationEnabled
        ? ((canvasHueRotationTime / 12) * 360) % 360
        : 0;
      
      // Get animated palette if cycling is enabled
      let activePalette = getPalette(currentState.paletteId);
      let paletteCycleInterpolation = 0; // 0-1 interpolation factor between palettes
      
      // Detect when palette cycling is enabled/disabled to recompute sprite structure
      const paletteCycleJustEnabled = currentState.paletteCycleEnabled && !wasPaletteCycleEnabled;
      const paletteCycleJustDisabled = !currentState.paletteCycleEnabled && wasPaletteCycleEnabled;
      
      if (currentState.paletteCycleEnabled) {
        const allPalettes = getAllPalettes();
        if (allPalettes.length > 0) {
          // Calculate smooth cycle progress that wraps seamlessly
          // Use continuous paletteCycleTime to avoid discontinuities when wrapping
          const cycleProgress = (paletteCycleTime / 30) * allPalettes.length;
          // Get the fractional part for interpolation (0-1) - this is continuous
          const fractionalPart = cycleProgress - Math.floor(cycleProgress);
          // Get current and next palette indices with proper wrap-around
          // Use modulo only for index calculation, not for the time itself
          const currentPaletteIndex = Math.floor(cycleProgress) % allPalettes.length;
          const nextIndex = (currentPaletteIndex + 1) % allPalettes.length;
          // Apply smooth easing (ease-in-out) to the interpolation for smoother transitions
          // This reduces harsh steps and makes the cycling feel more natural
          const easedT = fractionalPart < 0.5
            ? 2 * fractionalPart * fractionalPart  // Ease in
            : 1 - Math.pow(-2 * fractionalPart + 2, 2) / 2;  // Ease out
          paletteCycleInterpolation = easedT;
          activePalette = {
            ...allPalettes[currentPaletteIndex],
            colors: interpolatePaletteColors(
              allPalettes[currentPaletteIndex].colors,
              allPalettes[nextIndex].colors,
              paletteCycleInterpolation
            ),
          };
          
          // Only recompute sprite structure when palette cycling is first enabled
          // During active cycling, colors are updated dynamically via getAnimatedTileColor
          // This avoids expensive recomputation every ~7 seconds that causes stuttering
          if (paletteCycleJustEnabled) {
            // When sprite hue rotation is enabled, exclude static hue shift from computation
            // to avoid double-shifting (it will be applied during rendering with animated shift)
            const stateWithPalette = {
              ...currentState,
              paletteId: activePalette.id,
              hueShift: currentState.hueRotationEnabled ? 0 : currentState.hueShift,
            };
            prepared = computeSprite(stateWithPalette, activePalette);
          }
        }
      } else if (paletteCycleJustDisabled) {
        // When palette cycling is disabled, recompute with the static palette
        const stateWithPalette = {
          ...currentState,
          hueShift: currentState.hueRotationEnabled ? 0 : currentState.hueShift,
        };
        prepared = computeSprite(stateWithPalette);
      }
      
      // Update tracking variable for next frame
      wasPaletteCycleEnabled = currentState.paletteCycleEnabled;
      
      // Calculate backgroundHueShiftDegrees - use let so it can be reassigned in fade transition loop
      let backgroundHueShiftDegrees = ((currentState.backgroundHueShift / 100) * 360) + animatedCanvasHueShift;
      const MOTION_SPEED_MAX_INTERNAL = 12.5;
      // Apply mode-specific speed multiplier to normalize perceived speed across modes
      // Higher multiplier = slower animation (divide to slow down)
      // If animation is disabled, set speed factor to 0 to stop all movement
      const modeSpeedMultiplier = MOVEMENT_SPEED_MULTIPLIERS[currentState.movementMode] ?? 1.0;
      const baseSpeedFactor = currentState.animationEnabled !== false 
        ? Math.max(currentState.motionSpeed / MOTION_SPEED_MAX_INTERNAL, 0)
        : 0;
      targetSpeedFactor = baseSpeedFactor / modeSpeedMultiplier;
      
      // Accumulate base time at constant rate
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
      
      // Handle fade transitions - calculate opacities
      const isFadeTransition = transitionState.isTransitioning && transitionState.type === "fade";
      let fadeProgress = 0;
      let fromOpacity = 1.0;
      let toOpacity = 0.0;
      
      if (isFadeTransition) {
        const elapsed = Date.now() - transitionState.startTime;
        fadeProgress = calculateTransitionProgress(elapsed, transitionState.duration);
        // Calculate opacities for crossfade
        fromOpacity = 1 - fadeProgress; // Fade out: 1 → 0
        toOpacity = fadeProgress; // Fade in: 0 → 1
      }
      
      // For fade transitions, render both states with crossfade
      // Calculate which states to render
      const statesToRender = isFadeTransition && transitionState.fromState && transitionState.toState
        ? [
            { state: transitionState.fromState, prepared: (transitionState as any).preparedFrom, opacity: fromOpacity },
            { state: transitionState.toState, prepared: (transitionState as any).preparedTo, opacity: toOpacity }
          ]
        : [{ state: currentState, prepared: prepared, opacity: 1.0 }];
      
      // Clear canvas first (for fade transitions, use black; otherwise normal background)
      if (isFadeTransition) {
        p.background(0, 0, 0);
      }
      
      // Render each state (for fade: both states; otherwise: just current state)
      statesToRender.forEach(({ state: renderState, prepared: renderPrepared, opacity: renderOpacity }) => {
        // Save current state
        const savedState = currentState;
        const savedPrepared = prepared;
        const savedActivePalette = activePalette;
        const savedPaletteCycleInterpolation = paletteCycleInterpolation;
        const savedAnimatedSpriteHueShift = animatedSpriteHueShift;
        const savedAnimatedCanvasHueShift = animatedCanvasHueShift;
        const savedBackgroundHueShiftDegrees = backgroundHueShiftDegrees;
        const savedMotionScale = motionScale;
        
        // Swap to render state
        currentState = renderState;
        prepared = renderPrepared;
        
        // Recalculate state-dependent values for this state
        const renderMotionScale = clamp(currentState.motionIntensity / 100, 0, 1.5);
        const renderAnimatedSpriteHueShift = currentState.hueRotationEnabled
          ? ((spriteHueRotationTime / 10) * 360) % 360
          : 0;
        const renderAnimatedCanvasHueShift = currentState.canvasHueRotationEnabled
          ? ((canvasHueRotationTime / 12) * 360) % 360
          : 0;
        
        // Get palette for this state
        let renderActivePalette = getPalette(currentState.paletteId);
        let renderPaletteCycleInterpolation = 0;
        
        if (currentState.paletteCycleEnabled) {
          const allPalettes = getAllPalettes();
          if (allPalettes.length > 0) {
            const cycleProgress = (paletteCycleTime / 30) * allPalettes.length;
            const fractionalPart = cycleProgress - Math.floor(cycleProgress);
            const currentPaletteIndex = Math.floor(cycleProgress) % allPalettes.length;
            const nextIndex = (currentPaletteIndex + 1) % allPalettes.length;
            const easedT = fractionalPart < 0.5
              ? 2 * fractionalPart * fractionalPart
              : 1 - Math.pow(-2 * fractionalPart + 2, 2) / 2;
            renderPaletteCycleInterpolation = easedT;
            renderActivePalette = {
              ...allPalettes[currentPaletteIndex],
              colors: interpolatePaletteColors(
                allPalettes[currentPaletteIndex].colors,
                allPalettes[nextIndex].colors,
                renderPaletteCycleInterpolation
              ),
            };
          }
        }
        
        const renderBackgroundHueShiftDegrees = ((currentState.backgroundHueShift / 100) * 360) + renderAnimatedCanvasHueShift;
        
        // Temporarily override these values for rendering
        activePalette = renderActivePalette;
        paletteCycleInterpolation = renderPaletteCycleInterpolation;
        animatedSpriteHueShift = renderAnimatedSpriteHueShift;
        animatedCanvasHueShift = renderAnimatedCanvasHueShift;
        backgroundHueShiftDegrees = renderBackgroundHueShiftDegrees;
        motionScale = renderMotionScale;
        
        // Set opacity for this state
        p.push();
        p.drawingContext.globalAlpha = renderOpacity;
        
        // Redefine helper functions to use the updated state-dependent values
        // These functions are used in background and sprite rendering
        const resolveBackgroundPaletteIdForState = () =>
          currentState.backgroundMode === "auto" ? (currentState.paletteCycleEnabled ? activePalette.id : currentState.paletteId) : currentState.backgroundMode;
        
        const getBaseBackgroundColorForState = () => {
          if (currentState.paletteCycleEnabled && currentState.backgroundMode === "auto" && activePalette) {
            const bgColorIndex = calculateBackgroundColorIndex(
              currentState.seed,
              activePalette.id,
              currentState.backgroundColorSeedSuffix || ""
            );
            const validBgIndex = activePalette.colors.length > 0
              ? (bgColorIndex % activePalette.colors.length)
              : 0;
            const color = activePalette.colors[validBgIndex] ?? activePalette.colors[0];
            if (activePalette.colors.length > 0 && activePalette.colors.every(c => c === activePalette.colors[0])) {
              return activePalette.colors[0];
            }
            return color;
          }
          const bgPaletteId = resolveBackgroundPaletteIdForState();
          const bgPalette = getPalette(bgPaletteId);
          if (!bgPalette || bgPalette.colors.length === 0) {
            const fallbackPalette = getPalette(currentState.paletteId);
            return fallbackPalette?.colors[0] ?? "#000000";
          }
          const bgColorIndex = calculateBackgroundColorIndex(
            currentState.seed,
            bgPaletteId,
            currentState.backgroundColorSeedSuffix || ""
          );
          const validBgIndex = bgPalette.colors.length > 0
            ? (bgColorIndex % bgPalette.colors.length)
            : 0;
          const color = bgPalette.colors[validBgIndex] ?? bgPalette.colors[0];
          if (bgPalette.colors.length > 0 && bgPalette.colors.every(c => c === bgPalette.colors[0])) {
            return bgPalette.colors[0];
          }
          return color;
        };
        
        const applyCanvasAdjustmentsForState = (hex: string) => {
          let adjusted = shiftHue(hex, backgroundHueShiftDegrees);
          const saturation = currentState.backgroundSaturation ?? 100;
          const brightness = currentState.backgroundBrightness ?? 50;
          const contrast = currentState.backgroundContrast ?? 100;
          const brightnessPercent = brightness * 2;
          adjusted = applyColorAdjustments(adjusted, saturation, brightnessPercent, contrast);
          return adjusted;
        };
        
        const getAnimatedTileColorForState = (tile: any, isThumbnailPrimary: boolean = false): string => {
          if (currentState.thumbnailMode && isThumbnailPrimary) {
            try {
              if (typeof document !== 'undefined' && document.documentElement) {
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent-base').trim();
                if (accentColor && accentColor.length > 0) {
                  const normalizedColor = accentColor.startsWith('#') ? accentColor : `#${accentColor}`;
                  if (normalizedColor.length >= 4) {
                    return normalizedColor;
                  }
                }
              }
            } catch (error) {
              // Fall through
            }
            return '#2dd4bf';
          }
          if (currentState.thumbnailMode && !isThumbnailPrimary) {
            try {
              if (typeof document !== 'undefined' && document.documentElement) {
                const tint600 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-tint600').trim();
                if (tint600 && tint600.length > 0) {
                  const normalizedColor = tint600.startsWith('#') ? tint600 : `#${tint600}`;
                  if (normalizedColor.length >= 4) {
                    return normalizedColor;
                  }
                }
              }
            } catch (error) {
              // Fall through
            }
            return '#475569';
          }
          let color = tile.tint;
          if (currentState.paletteCycleEnabled && activePalette) {
            const paletteColor = activePalette.colors[tile.paletteColorIndex % activePalette.colors.length];
            const variance = clamp(currentState.paletteVariance / 100, 0, 1.5);
            const colorRng = createMulberry32(hashSeed(`${currentState.seed}-color${currentState.colorSeedSuffix || ""}-${tile.u}-${tile.v}`));
            color = jitterColor(paletteColor, variance, colorRng);
            if (!currentState.hueRotationEnabled) {
              const staticHueShift = (currentState.hueShift / 100) * 360;
              color = shiftHue(color, staticHueShift);
            }
          }
          if (currentState.hueRotationEnabled) {
            const staticHueShift = (currentState.hueShift / 100) * 360;
            const totalHueShift = staticHueShift + animatedSpriteHueShift;
            color = shiftHue(color, totalHueShift);
          }
          const saturation = currentState.saturation ?? 100;
          const brightness = currentState.brightness ?? 100;
          const contrast = currentState.contrast ?? 100;
          color = applyColorAdjustments(color, saturation, brightness, contrast);
          return color;
        };
        
        // Handle canvas background (gradient or solid) for this state
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

        const resolveGradientPaletteIdForState = () => {
          if (currentState.canvasGradientMode === "auto") {
            return resolveBackgroundPaletteIdForState();
          }
          return currentState.canvasGradientMode;
        };
        // Use interpolated palette colors if palette cycling is enabled and using auto mode
        const gradientPaletteId = resolveGradientPaletteIdForState();
        const useInterpolatedForGradient = currentState.paletteCycleEnabled && 
          currentState.canvasGradientMode === "auto" && 
          activePalette;
        const gradientPalette = useInterpolatedForGradient 
          ? activePalette 
          : getPalette(gradientPaletteId);
        const baseBgColor = getBaseBackgroundColorForState();
        // For gradient, calculate start index using seeded RNG, then take next 3 colors (wrapping)
        const gradientSourceColors =
          gradientPalette.colors.length > 0
            ? (() => {
                // Calculate start index using seeded RNG (same as getBaseBackgroundColor uses)
                const bgColorIndex = calculateBackgroundColorIndex(
                  currentState.seed,
                  useInterpolatedForGradient ? activePalette.id : gradientPaletteId,
                  currentState.backgroundColorSeedSuffix || ""
                );
                const startIndex = bgColorIndex % gradientPalette.colors.length;
                const colors: string[] = [];
                for (let i = 0; i < 3; i++) {
                  colors.push(gradientPalette.colors[(startIndex + i) % gradientPalette.colors.length]);
                }
                return colors;
              })()
            : [baseBgColor];
        // Apply hue shift and brightness to each gradient color
        // This ensures user's hue shift/brightness settings are preserved when re-applying palette
        const gradientColors = gradientSourceColors
          .map((color) => applyCanvasAdjustmentsForState(color))
          .filter(Boolean);

        const usableGradientColors =
          gradientColors.length > 1
            ? gradientColors
            : gradientColors.length === 1
            ? [...gradientColors, gradientColors[0]]
            : [baseBgColor, baseBgColor].map((color) => applyCanvasAdjustmentsForState(color));

        usableGradientColors.forEach((color, index) => {
          const stop =
            usableGradientColors.length > 1
              ? index / (usableGradientColors.length - 1)
              : 0;
          gradient.addColorStop(stop, color);
        });

        // Check if black background is enabled (read from localStorage each frame)
        let useBlackBackground = false;
        try {
          const settingsJson = localStorage.getItem("pixli-settings");
          if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            useBlackBackground = settings.canvasBlackBackground === true;
          }
        } catch (error) {
          // Ignore errors, use default
        }
        
        // In thumbnail mode, use transparent background so card background shows through
        if (currentState.thumbnailMode) {
          // Clear canvas to transparent instead of filling with gradient
          ctx.clearRect(0, 0, p.width, p.height);
        } else {
          if (useBlackBackground) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, p.width, p.height);
          } else {
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, p.width, p.height);
          }
        }
      } else {
        // Solid background - get base palette color and apply adjustments
        // getBaseBackgroundColorForState() returns a palette color (using backgroundColorSeedSuffix for randomization)
        // applyCanvasAdjustmentsForState() preserves hue shift and brightness settings
        const baseBackgroundColor = getBaseBackgroundColorForState();
        // Apply hue shift and brightness to the base color
        const animatedBackground = applyCanvasAdjustmentsForState(baseBackgroundColor);
        
        // Check if black background is enabled (read from localStorage each frame)
        let useBlackBackground = false;
        try {
          const settingsJson = localStorage.getItem("pixli-settings");
          if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            useBlackBackground = settings.canvasBlackBackground === true;
          }
        } catch (error) {
          // Ignore errors, use default
        }
        
        // In thumbnail mode, use transparent background so card background shows through
        if (currentState.thumbnailMode) {
          // Clear canvas to transparent instead of filling with background color
          p.clear();
        } else {
          const finalBackground = useBlackBackground ? "#000000" : animatedBackground;
          // Use p5.js background() which clears and fills the canvas each frame
          // This must be called every frame for the animation to work
          p.background(finalBackground);
        }
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

      // Map blend modes to canvas globalCompositeOperation for direct ctx operations
      const blendToComposite: Record<BlendModeKey, GlobalCompositeOperation> = {
        NONE: "source-over",
        MULTIPLY: "multiply",
        SCREEN: "screen",
        HARD_LIGHT: "hard-light",
        OVERLAY: "overlay",
        SOFT_LIGHT: "soft-light",
        DARKEST: "darken",
        LIGHTEST: "lighten",
      };
        
        // Depth of field setup for this state
        const MAX_BLUR_RADIUS = 48;
        const DOF_THRESHOLD = 0.1;
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
              if (tile.kind === "svg") {
                const baseSpriteSize =
                  baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
                const movement = computeMovementOffsetsWithCustom(currentState, {
                  time: scaledAnimationTime * tile.animationTimeMultiplier,
                  phase: tileIndex * 7,
                  motionScale,
                  layerIndex,
                  baseUnit: baseSpriteSize,
                  layerTileSize: baseLayerSize,
                  speedFactor: 1.0,
                  parallaxDepth: tile.parallaxDepth,
                } as any);
                const spriteSize = baseSpriteSize * movement.scaleMultiplier;
                minSize = Math.min(minSize, spriteSize);
                maxSize = Math.max(maxSize, spriteSize);
              }
            });
          });
        }
        
        const sizeRange = maxSize - minSize;
        const hasValidSizeRange = sizeRange > 0 && isFinite(minSize) && isFinite(maxSize);
        const focusZ = currentState.depthOfFieldEnabled && hasValidSizeRange
          ? lerp(0, 1, currentState.depthOfFieldFocus / 100)
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
        
        // In parallax mode, sort tiles by depth so smaller/slower sprites render behind larger/faster ones
        // Lower depth (0 = far) renders first, higher depth (1 = close) renders last (on top)
        const tilesToRender = currentState.movementMode === "parallax"
          ? [...layer.tiles].sort((a, b) => (a.parallaxDepth ?? 0.5) - (b.parallaxDepth ?? 0.5))
          : layer.tiles;
        
        tilesToRender.forEach((tile, tileIndex) => {
          // In thumbnail mode, primary sprite (last tile in layer 0) should have no blend mode
          const isThumbnailPrimary = currentState.thumbnailMode && 
                                     layerIndex === 0 && 
                                     tileIndex === layer.tiles.length - 1;
          
          // Use currentState.blendMode when blendModeAuto is false, otherwise use stored tile/layer blend mode
          // Force "NONE" blend mode for thumbnail primary sprite
          const tileBlendMode = isThumbnailPrimary 
            ? "NONE"
            : (currentState.blendModeAuto
                ? (tile.blendMode ?? layer.blendMode)
                : currentState.blendMode);
          // Set blend mode for both p5.js and canvas context operations
          p.blendMode(blendMap[tileBlendMode] ?? p.BLEND);
          // Also set canvas context blend mode for direct ctx operations
          ctx.globalCompositeOperation = blendToComposite[tileBlendMode] ?? "source-over";
          
          // Calculate movement offsets
          // For parallax mode, ignore initial grid positions - all sprites start off-screen left
          // For other modes, use normal wrapping
          // CRITICAL: Ensure normalized coordinates are in [0, 1] range
          // For line sprites, tile.v is already normalized to [0, 1] after post-processing
          // For other sprites, tile.v might be outside [0, 1] due to movement, so wrap it
          let normalizedU = ((tile.u % 1) + 1) % 1;
          // Check if this is a line sprite tile
          const isLineSpriteTile = tile.spriteId === "line";
          
          // For line sprites, tile.v is already in [0, 1] range, so clamp it instead of wrapping
          // Wrapping would cause v=1 to become 0, which is incorrect
          // CRITICAL: Line sprites use normalized v [0,1] where v=0 is top, v=1 is bottom
          // The formula baseY = normalizedV * p.height correctly maps this to canvas coordinates
          let normalizedV = isLineSpriteTile
            ? clamp(tile.v, 0, 1) // Line sprites: clamp to [0, 1] (already normalized in post-processing)
            : ((tile.v % 1) + 1) % 1; // Other sprites: wrap for movement modes
          
          let movement = { offsetX: 0, offsetY: 0, scaleMultiplier: 1 };
          
          if (tile.kind === "svg") {
            // SVG sprite rendering
            // Get animated tile color (applies sprite hue rotation if enabled)
            // Pass isThumbnailPrimary flag so primary sprite can use theme accent color
            // Calculate inline to avoid any scope issues
            const animatedTileColor = getAnimatedTileColorForState(
              tile, 
              currentState.thumbnailMode && layerIndex === 0 && tileIndex === layer.tiles.length - 1
            );
            const baseSvgSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            
            // Parallax mode: stateful per-sprite position tracking
            // Uses robust spawn/despawn with per-sprite radius culling
            if (currentState.movementMode === "parallax") {
              // Get depth (0-1, where 0 = farthest, 1 = closest)
              const depth = tile.parallaxDepth ?? (normalizedU * 0.5 + 0.25);
              
              // Calculate depth-based speed multiplier: closer (higher depth) = faster
              // parallaxDepthEffect controls the RANGE of speeds (the delta between slow and fast)
              // At 0%: all sprites move at same speed (multiplier = 1.0)
              // At 100%: depth 0 (far) = 0.01x speed, depth 1 (close) = 1.0x speed (100x difference)
              const depthEffect = (currentState.parallaxDepthEffect ?? 50) / 100; // 0 to 1
              // At max effect: far sprites get 0.01x, close sprites get 1.0x
              // Lerp from 1.0 (no effect) toward the target range based on depthEffect
              const slowestMultiplier = 1.0 - depthEffect * 0.99; // 1.0 -> 0.01 at max
              const fastestMultiplier = 1.0; // Always 1.0 (close sprites stay at base speed)
              const depthSpeedMultiplier = slowestMultiplier + depth * (fastestMultiplier - slowestMultiplier);
              
              // Base parallax speed - pixels per second (700 for fast movement at max speed)
              const baseParallaxSpeed = 700;
              // Apply motion speed slider (0-12.5 range, normalize to 0-1 then scale)
              const MOTION_SPEED_MAX = 12.5;
              const motionSpeedFactor = (currentState.motionSpeed ?? 8.5) / MOTION_SPEED_MAX; // 0 to 1
              // In parallax mode, only motion speed controls the speed (motion intensity is hidden/not used)
              const speed = baseParallaxSpeed * depthSpeedMultiplier * motionSpeedFactor;
              
              // Get initial position from grid
              const initialU = tile.parallaxInitialU ?? ((tile.u % 1) + 1) % 1;
              const initialX = initialU * p.width;
              const initialY = isLineSpriteTile 
                ? tile.v * p.height 
                : normalizedV * p.height;
              
              // Direction vector from angle (0 = right, 90 = down, 180 = left, 270 = up)
              const angleRad = (currentState.parallaxAngle * Math.PI) / 180;
              const dir: Vec2 = { x: Math.cos(angleRad), y: Math.sin(angleRad) };
              
              // Delta time in seconds (deltaMs is milliseconds per frame)
              const dt = deltaMs / 1000;
              
              // Create stable key for this tile's position (persists across computeSprite calls)
              // Use tile's original u,v and layer index as key (deterministic based on seed)
              const positionKey = `${currentState.seed}-${layerIndex}-${tile.u.toFixed(4)}-${tile.v.toFixed(4)}`;
              
              // Get or initialize world position from persistent storage
              // Also store a respawn counter for deterministic respawn positions
              let worldPos = parallaxPositions.get(positionKey);
              if (!worldPos) {
                // Create deterministic RNG for initialization
                const initRng = createMulberry32(hashSeed(`${currentState.seed}-parallax-init-${layerIndex}-${tileIndex}`));
                
                // For thumbnail mode, ensure sprites start on-screen
                if (currentState.thumbnailMode) {
                  // In thumbnail mode, start secondary sprites on canvas (not primary - it's centered)
                  const isThumbnailSecondary = currentState.thumbnailMode && 
                                               layerIndex === 0 && 
                                               tileIndex < layer.tiles.length - 1;
                  
                  if (isThumbnailSecondary) {
                    // Start secondary sprites at their tile position (on-screen)
                    worldPos = { x: initialX, y: initialY };
                  } else {
                    // Primary sprite or non-thumbnail: use normal initialization
                    const initPos = initSpritePosition(
                      initialX, 
                      initialY, 
                      p.width, 
                      p.height, 
                      baseSvgSize, 
                      initRng, 
                      dir
                    );
                    worldPos = { x: initPos.x, y: initPos.y };
                  }
                } else {
                  // Non-thumbnail mode: use normal initialization
                  const initPos = initSpritePosition(
                    initialX, 
                    initialY, 
                    p.width, 
                    p.height, 
                    baseSvgSize, 
                    initRng, 
                    dir
                  );
                  worldPos = { x: initPos.x, y: initPos.y };
                }
                parallaxPositions.set(positionKey, worldPos);
              }
              
              // Create RNG for respawn - use frame-independent seed based on position
              // This ensures deterministic but varied respawn positions
              const respawnSeed = Math.floor(worldPos.x * 1000) + Math.floor(worldPos.y * 1000);
              const respawnRng = createMulberry32(hashSeed(`${currentState.seed}-respawn-${layerIndex}-${tileIndex}-${respawnSeed}`));
              
              // Step sprite (move, cull, respawn)
              // For thumbnail mode, use smaller safety margin and ensure immediate respawn
              const safetyMargin = currentState.thumbnailMode ? 1 : 2;
              const newState = stepSprite(
                worldPos,
                { dir, dt, speed },
                {
                  canvasWidth: p.width,
                  canvasHeight: p.height,
                  spriteWidthPx: baseSvgSize,
                  spriteHeightPx: baseSvgSize,
                  safetyMarginPx: safetyMargin,
                },
                respawnRng
              );
              
              // Update persistent position storage
              worldPos.x = newState.x;
              worldPos.y = newState.y;
              
              // Convert to normalized coordinates
              normalizedU = worldPos.x / p.width;
              if (!isLineSpriteTile) {
                normalizedV = worldPos.y / p.height;
              }
              // Line sprites: normalizedV already set from tile.v above
              
              // Movement offsets (position is already in world coordinates)
              // No pulsing/breathing for parallax - just linear movement
              movement = {
                offsetX: 0,
                offsetY: 0,
                scaleMultiplier: 1.0, // No scale animation for parallax mode
              };
            } else {
              // Non-parallax mode: use standard movement calculation (with custom animation support)
              movement = computeMovementOffsetsWithCustom(currentState, {
                time: scaledAnimationTime * tile.animationTimeMultiplier,
                phase: tileIndex * 7,
                motionScale,
                layerIndex,
                baseUnit: baseSvgSize,
                layerTileSize: baseLayerSize,
                speedFactor: 1.0,
                parallaxDepth: tile.parallaxDepth, // Pass depth if available
              } as any);
            }
            
            // CRITICAL: p5.js coordinate system - Y=0 is at TOP, Y increases downward
            // For line sprites, ignore movement.offsetY to ensure uniform vertical distribution
            // Line sprites: baseY = normalizedV * p.height where v [0,1] maps to Y [0, p.height]
            // For thumbnail primary sprite, always center it vertically but allow horizontal movement and animation
            const baseX = offsetX + normalizedU * p.width + movement.offsetX;
            const baseY = isThumbnailPrimary
              ? offsetY + 0.5 * p.height  // Always center vertically, but movement offsets still apply for animation effects
              : isLineSpriteTile
                ? normalizedV * p.height  // Line sprites: v=0 → Y=0 (top), v=1 → Y=p.height (bottom)
                : offsetY + normalizedV * p.height + movement.offsetY;  // Other sprites: include offsets
            
            
            const finalMovement = movement;
            const svgSize = baseSvgSize * finalMovement.scaleMultiplier;
            // Determine opacity based on outline state when mixed mode is enabled
            // In thumbnail mode, primary sprite (last tile in layer 0) should be 100% opaque
            // (isThumbnailPrimary already declared above at line 2820)
            let opacityValue: number;
            if (isThumbnailPrimary) {
              // Primary sprite in thumbnail mode: 100% opaque, no blend mode
              opacityValue = 1.0;
            } else if (currentState.outlineMixed && currentState.outlineEnabled) {
              // Use filled/outlined opacity based on tile's outline state
              const tileOpacity = tile.isOutlined 
                ? (currentState.outlinedOpacity ?? currentState.layerOpacity)
                : (currentState.filledOpacity ?? currentState.layerOpacity);
              opacityValue = clamp(tileOpacity / 100, 0, 1);
            } else {
              // Use layerOpacity for non-mixed mode
              opacityValue = clamp(currentState.layerOpacity / 100, 0.12, 1);
            }
            const opacityAlpha = Math.round(opacityValue * 255);

            // Calculate depth of field blur
            let blurAmount = 0;
            if (currentState.depthOfFieldEnabled && hasValidSizeRange && maxBlur > 0) {
              // Calculate normalized z-index from size (0 = smallest, 1 = largest)
              const normalizedZ = sizeRange > 0 ? (svgSize - minSize) / sizeRange : 0.5;
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
            // All shape rendering code has been removed - all sprites now use SVG files exclusively
            // The SVG rendering code continues below
            // Load and draw SVG image
            // Use synchronous cache lookup - images should be preloaded
            // SVGO processing should have already cleaned up the SVGs to remove frames
            const cachedImg = getCachedSpriteImage(tile.svgPath);
            
            // Calculate final rendered dimensions BEFORE clamping for accurate position bounds
            // This is especially important for the line sprite which has non-uniform scaling
            let finalWidth = svgSize;
            let finalHeight = svgSize;
            const isLineSprite = tile.spriteId === "line";
            
            if (cachedImg) {
              const svgViewBox = (cachedImg as any).__svgViewBox;
              let vbWidth: number;
              let vbHeight: number;
              
              if (svgViewBox) {
                // Use viewBox dimensions directly - these are the sprite's true dimensions
                vbWidth = svgViewBox.width;
                vbHeight = svgViewBox.height;
              } else {
                // Fallback to natural image dimensions
                vbWidth = cachedImg.naturalWidth || cachedImg.width || 1;
                vbHeight = cachedImg.naturalHeight || cachedImg.height || 1;
              }
              
              // CRITICAL: Sprite aspect ratio is INDEPENDENT of canvas aspect ratio
              // The sprite's aspect ratio MUST NEVER change, regardless of canvas shape
              // Calculate uniform scale - ONE scale factor for BOTH dimensions
              // This ensures the sprite maintains its original proportions
              const scaleForWidth = svgSize / vbWidth;
              const scaleForHeight = svgSize / vbHeight;
              // Use the MINIMUM scale to ensure sprite fits within svgSize
              // This guarantees uniform scaling - both dimensions scaled by the SAME factor
              let uniformScale = Math.min(scaleForWidth, scaleForHeight);
              
              // For line sprite, we need non-uniform scaling: 20x width, 1x height
              let scaleX = uniformScale;
              let scaleY = uniformScale;
              if (isLineSprite) {
                // Make line 20x longer (width) but keep same thickness (height)
                scaleX = uniformScale * 20;
                scaleY = uniformScale;
              }
              
              // Calculate final rendered dimensions
              // For line sprite, use non-uniform scale; otherwise use uniform scale
              finalWidth = vbWidth * scaleX;
              finalHeight = vbHeight * scaleY;
            }
            
            // Use actual rendered dimensions for clamping (especially important for line sprite)
            const halfWidth = finalWidth / 2;
            const halfHeight = finalHeight / 2;
            
            // Calculate overflow allowance separately for X and Y axes
            // For X: use width-based overflow (important for long horizontal line sprites)
            // For Y: use height-based overflow (prevents line sprites from being pushed to bottom)
            // For line sprites, use a larger Y overflow since they're very thin but we want full canvas distribution
            const allowableOverflowX = Math.max(Math.max(p.width, p.height) * 0.6, finalWidth * 1.25);
            const baseOverflowY = Math.max(p.width, p.height) * 0.6;
            const heightBasedOverflowY = finalHeight * 1.25;
            // For line sprites, ensure we have enough Y overflow for full canvas distribution
            const allowableOverflowY = isLineSprite 
              ? Math.max(baseOverflowY, p.height * 0.5) // Use at least 50% of canvas height for line sprites
              : Math.max(baseOverflowY, heightBasedOverflowY);
            
            // Clamp positions to canvas bounds with overflow allowance
            // Note: baseX/baseY already includes movement.offsetX/offsetY, so don't add it again
            const clampedX = clamp(
              baseX,
              offsetX + halfWidth - allowableOverflowX,
              offsetX + p.width - halfWidth + allowableOverflowX,
            );
            // For line sprites, use less restrictive Y clamping to allow full canvas distribution
            // Line sprites are very thin, so they don't need as much vertical constraint
            // Also compensate for movement offsets that might bias positions downward
            // by ensuring the initial v position accounts for expected movement range
            const clampedY = isLineSprite
              ? baseY // Don't clamp Y for line sprites - allow full canvas distribution
              : clamp(
                  baseY,
                  offsetY + halfHeight - allowableOverflowY,
                  offsetY + p.height - halfHeight + allowableOverflowY,
                );
            
            p.translate(clampedX, clampedY);
            const rotationTime = scaledAnimationTime; // Use smoothly accumulating scaled time
            // Recalculate rotation speed dynamically from currentState (no regeneration needed)
            // Add minimum speed floor of 5% so animation never fully stops
            const minSpeed = 0.05; // 5% minimum
            const rotationSpeedBase = Math.max(minSpeed, clamp(currentState.rotationSpeed, 1, 100) / 100);
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
            // Store gradient data to create after transforms are applied
            let gradientData: {
              colors: string[];
              direction: number;
            } | null = null;
            
            if (useGradient) {
              // Use 2 colors directly from the palette for gradients
              const palette = currentState.paletteCycleEnabled ? activePalette : getPalette(currentState.paletteId);
              if (palette.colors.length >= 2) {
                // Use seeded RNG to select 2 colors from palette
                const gradientColorRng = createMulberry32(hashSeed(`${currentState.seed}-gradient-color${currentState.spriteGradientColorSeedSuffix || ""}-${tile.u}-${tile.v}`));
                const color1Index = Math.floor(gradientColorRng() * palette.colors.length);
                let color2Index = Math.floor(gradientColorRng() * palette.colors.length);
                // Ensure we get 2 different colors
                while (color2Index === color1Index && palette.colors.length > 1) {
                  color2Index = Math.floor(gradientColorRng() * palette.colors.length);
                }
                
                const color1 = palette.colors[color1Index];
                const color2 = palette.colors[color2Index];
                
                // Apply hue shift and variance to gradient colors
                // Combine static and animated hue shifts for smooth transitions
                const staticHueShift = ((currentState.hueShift ?? 0) / 100) * 360;
                const hueShiftDegrees = currentState.hueRotationEnabled 
                  ? staticHueShift + animatedSpriteHueShift
                  : staticHueShift;
                const variance = clamp((currentState.paletteVariance ?? 68) / 100, 0, 1.5);
                
                // Apply hue shift and variance to each gradient color
                const varianceRng1 = createMulberry32(hashSeed(`${currentState.seed}-color${currentState.colorSeedSuffix || ""}-${tile.u}-${tile.v}-0`));
                const varianceRng2 = createMulberry32(hashSeed(`${currentState.seed}-color${currentState.colorSeedSuffix || ""}-${tile.u}-${tile.v}-1`));
                
                let processedColor1 = shiftHue(color1, hueShiftDegrees);
                processedColor1 = jitterColor(processedColor1, variance, varianceRng1);
                
                let processedColor2 = shiftHue(color2, hueShiftDegrees);
                processedColor2 = jitterColor(processedColor2, variance, varianceRng2);
                
                // Apply saturation, brightness, and contrast adjustments to gradient colors
                if (currentState.colorAdjustmentsEnabled !== false) {
                  const saturation = currentState.saturation ?? 100;
                  const brightness = currentState.brightness ?? 100;
                  const contrast = currentState.contrast ?? 100;
                  processedColor1 = applyColorAdjustments(processedColor1, saturation, brightness, contrast);
                  processedColor2 = applyColorAdjustments(processedColor2, saturation, brightness, contrast);
                }
                
                // Determine gradient direction - use random per sprite if enabled, otherwise use fixed direction
                let gradientDirection = currentState.spriteGradientDirection;
                if (currentState.spriteGradientDirectionRandom) {
                  // Use seeded RNG for random gradient direction per sprite
                  const gradientDirectionRng = createMulberry32(hashSeed(`${currentState.seed}-gradient-direction-${tile.u}-${tile.v}`));
                  gradientDirection = gradientDirectionRng() * 360; // Random direction 0-360 degrees
                }
                
                // Store gradient data with 2 colors
                gradientData = {
                  colors: [processedColor1, processedColor2],
                  direction: gradientDirection,
                };
              }
            }
            
            // Check if outline mode is enabled (check once, use throughout)
            // When mixed mode is enabled, use per-tile outline state; otherwise use global state
            // Only apply outline if outlineEnabled is true
            const useOutline = currentState.outlineEnabled && (
              currentState.outlineMixed 
                ? tile.isOutlined 
                : true
            );
            const strokeWidth = currentState.outlineStrokeWidth;
            
            if (!useGradient || !gradientData) {
              // Solid color fill
              const fillColor = p.color(animatedTileColor);
              fillColor.setAlpha(opacityAlpha);
              if (useOutline) {
                p.noFill();
                p.stroke(fillColor);
                p.strokeWeight(strokeWidth);
              } else {
              p.fill(fillColor);
            p.noStroke();
              }
                  } else {
              // Gradient mode - no p5.js fill needed, will use canvas context
                p.noFill();
                p.noStroke();
            }

            if (cachedImg) {
              ctx.save();
              ctx.globalAlpha = opacityAlpha / 255;
              
              // Get sprite's original dimensions and aspect ratio
              // The sprite's aspect ratio is INDEPENDENT of canvas aspect ratio - it should NEVER change
              const svgPathData = (cachedImg as any).__svgPathData;
              const svgViewBox = (cachedImg as any).__svgViewBox;
              // CRITICAL: For Path2D rendering, use ORIGINAL viewBox since path coords are in original system
              // The tight viewBox is used for image rendering, but Path2D needs original coords
              const svgOriginalViewBox = (cachedImg as any).__svgOriginalViewBox;
              
              let vbWidth: number;
              let vbHeight: number;
              
              // For Path2D, use original viewBox dimensions; for image fallback, use tight viewBox
              const viewBoxForPath = svgOriginalViewBox || svgViewBox;
              if (viewBoxForPath) {
                // Use viewBox dimensions directly - these are the sprite's true dimensions
                vbWidth = viewBoxForPath.width;
                vbHeight = viewBoxForPath.height;
              } else {
                // Fallback to natural image dimensions
                vbWidth = cachedImg.naturalWidth || cachedImg.width || 1;
                vbHeight = cachedImg.naturalHeight || cachedImg.height || 1;
              }
              
              // CRITICAL: Sprite aspect ratio is INDEPENDENT of canvas aspect ratio
              // The sprite's aspect ratio MUST NEVER change, regardless of canvas shape
              // Calculate uniform scale - ONE scale factor for BOTH dimensions
              // This ensures the sprite maintains its original proportions
              const scaleForWidth = svgSize / vbWidth;
              const scaleForHeight = svgSize / vbHeight;
              // Use the MINIMUM scale to ensure sprite fits within svgSize
              // This guarantees uniform scaling - both dimensions scaled by the SAME factor
              let uniformScale = Math.min(scaleForWidth, scaleForHeight);
              
              // For line sprite, we need non-uniform scaling: 20x width, 1x height
              let scaleX = uniformScale;
              let scaleY = uniformScale;
              if (isLineSprite) {
                // Make line 20x longer (width) but keep same thickness (height)
                scaleX = uniformScale * 20;
                scaleY = uniformScale;
              }
              
              // Recalculate final rendered dimensions (already calculated above, but recalculate for consistency)
              // For line sprite, use non-uniform scale; otherwise use uniform scale
              const recalculatedFinalWidth = vbWidth * scaleX;
              const recalculatedFinalHeight = vbHeight * scaleY;
              
              // CRITICAL VERIFICATION: recalculatedFinalWidth / recalculatedFinalHeight MUST equal vbWidth / vbHeight
              // This mathematical guarantee ensures aspect ratio is preserved
              // If this assertion fails, there's a bug in the scale calculation
              // (Skip this check for line sprite since it intentionally changes aspect ratio)
              if (!isLineSprite) {
              const originalAspectRatio = vbWidth / vbHeight;
              const finalAspectRatio = recalculatedFinalWidth / recalculatedFinalHeight;
              // Allow tiny floating point differences
              if (Math.abs(originalAspectRatio - finalAspectRatio) > 0.0001) {
                console.error(`Aspect ratio mismatch! Original: ${originalAspectRatio}, Final: ${finalAspectRatio}, uniformScale: ${uniformScale}`);
                }
              }
              
              if (svgPathData && viewBoxForPath) {
                // Get viewBox origin for positioning - use ORIGINAL viewBox for Path2D
                const vbX = viewBoxForPath.x || 0;
                const vbY = viewBoxForPath.y || 0;
                
                // Check if outline mode is enabled
                // When mixed mode is enabled, use per-tile outline state; otherwise use global state
                // Only apply outline if outlineEnabled is true
                const useOutline = currentState.outlineEnabled && (
                  currentState.outlineMixed 
                    ? tile.isOutlined 
                    : true
                );
                const strokeWidth = currentState.outlineStrokeWidth;
                
                // Draw the path directly on canvas
                // Apply opacity to color (globalAlpha is already set, but also add to color for consistency)
                const colorWithAlpha = p.color(animatedTileColor);
                colorWithAlpha.setAlpha(opacityAlpha);
                if (useOutline) {
                  ctx.strokeStyle = colorWithAlpha.toString();
                  ctx.lineWidth = strokeWidth;
                  // For line sprite, use "butt" line cap to prevent thick caps at the ends
                  // This ensures the stroke width is consistent along the entire line
                  if (isLineSprite) {
                    ctx.lineCap = "butt";
                    ctx.lineJoin = "miter";
                  }
                } else {
                  // fillStyle will be set after gradient is created (below, after transforms)
                  // For now, set a placeholder - will be overridden if gradient exists
                  ctx.fillStyle = colorWithAlpha.toString();
                }
                
                // CRITICAL: Reset transform matrix to avoid any p5.js coordinate system interference
                // p5.js transforms (translate, rotate) affect the canvas context, which can cause
                // non-uniform scaling if not reset. We need a clean identity matrix.
                ctx.save();
                // Apply blend mode to canvas context for direct drawing operations
                // Note: Set after save() so it's part of the saved state and persists through drawing
                ctx.globalCompositeOperation = blendToComposite[tileBlendMode] ?? "source-over";
                // Reset to identity matrix - this ensures no legacy transforms affect our uniform scaling
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                
                // Now apply transforms in the correct order (they execute in reverse):
                // 1. Apply p5.js translation (from clampedX, clampedY)
                ctx.translate(clampedX, clampedY);
                // 2. Apply p5.js rotation (if any)
                if (rotationAngle !== 0) {
                  ctx.rotate(rotationAngle);
                }
                // 3. Translate by viewBox origin to align with SVG coordinate system
                ctx.translate(-vbX, -vbY);
                // 4. Scale - use non-uniform scale for line sprite (10x width, 1x height), uniform for others
                // CRITICAL: For line sprite, we intentionally use non-uniform scale to make it 10x longer
                ctx.scale(scaleX, scaleY);
                // 5. Center the sprite at origin using UNSCALED dimensions
                ctx.translate(-vbWidth / 2, -vbHeight / 2);
                
                // Create gradient in transformed coordinate space (after all transforms)
                if (useGradient && gradientData && !useOutline) {
                  // After transforms, sprite is centered at (0, 0) in viewBox coordinate space
                  // The coordinate space has been scaled, but we use viewBox dimensions for gradient
                  // Calculate gradient line relative to sprite center (0, 0)
                  const gradientLine = calculateGradientLine(
                    gradientData.direction,
                    vbWidth,
                    vbHeight,
                  );
                  // Create gradient in current transformed coordinate space
                  // calculateGradientLine returns coordinates with center at (width/2, height/2)
                  // After our transforms, sprite center is at (0, 0), so adjust coordinates
                  // The coordinate space is already scaled by ctx.scale(), so we use viewBox dimensions
                  const gradientObj = ctx.createLinearGradient(
                    gradientLine.x0 - vbWidth / 2,
                    gradientLine.y0 - vbHeight / 2,
                    gradientLine.x1 - vbWidth / 2,
                    gradientLine.y1 - vbHeight / 2,
                  );
                  // Add color stops with opacity
                  const numColors = gradientData.colors.length;
                  if (numColors > 0) {
                    gradientData.colors.forEach((color, index) => {
                      const stop = numColors > 1 ? index / (numColors - 1) : 0;
                      // Convert color to rgba format with opacity
                      const colorObj = p.color(color);
                      colorObj.setAlpha(opacityAlpha);
                      // Use toString() to get rgba() format that canvas accepts
                      const colorString = colorObj.toString();
                      gradientObj.addColorStop(stop, colorString);
                    });
                    // Apply gradient to fill style
                    ctx.fillStyle = gradientObj;
                  } else {
                    // Fallback to solid color if no gradient colors
                    ctx.fillStyle = colorWithAlpha.toString();
                  }
                } else if (!useOutline) {
                  // Ensure solid color is set if gradient is not used
                  ctx.fillStyle = colorWithAlpha.toString();
                }
                
                // Create and fill/stroke the path
                // Check if this sprite uses fill-rule="evenodd" for boolean shapes
                const hasEvenOddFill = (cachedImg as any).__svgHasEvenOddFill;
                const svgPaths = (cachedImg as any).__svgPaths;
                
                // Normal rendering
                  if (svgPaths && svgPaths.length > 0) {
                    // Multiple paths - render with proper fill rule for boolean shapes
                    if (hasEvenOddFill) {
                      // For boolean shapes with evenodd, combine all paths into one
                      // Path2D supports multiple subpaths when combined with move commands
                      // Combine all path data strings into a single path
                      const combinedPathData = svgPaths.map((p: { d: string; fillRule?: string }) => p.d).join(' ');
                      const combinedPath = new Path2D(combinedPathData);
                      
                      if (useOutline) {
                        ctx.stroke(combinedPath);
                      } else {
                        // Use fillRule parameter for evenodd (boolean shapes with cutouts)
                        ctx.fill(combinedPath, 'evenodd');
                      }
                    } else {
                      // Normal paths - render each separately
                      for (const pathInfo of svgPaths) {
                        const path = new Path2D(pathInfo.d);
                        if (useOutline) {
                          ctx.stroke(path);
                        } else {
                          ctx.fill(path);
                        }
                      }
                    }
                  } else {
                    // Single path or fallback
                    const path = new Path2D(svgPathData);
                    
                    if (useOutline) {
                      ctx.stroke(path);
                    } else {
                      // Use fillRule parameter for boolean shapes
                      if (hasEvenOddFill) {
                        ctx.fill(path, 'evenodd');
                      } else {
                        ctx.fill(path);
                      }
                    }
                }
                
                ctx.restore();
              } else {
                // Fallback: Draw image if path data not available
                // Use recalculatedFinalWidth/recalculatedFinalHeight (non-uniform for line sprite)
                // Apply blend mode to canvas context
                ctx.globalCompositeOperation = blendToComposite[tileBlendMode] ?? "source-over";
                ctx.drawImage(
                  cachedImg, 
                  -recalculatedFinalWidth / 2, 
                  -recalculatedFinalHeight / 2, 
                  recalculatedFinalWidth, 
                  recalculatedFinalHeight
                );
                
                // Apply tint color using multiply (this is separate from blend mode)
                // Save current composite operation, apply tint, then restore
                ctx.save();
                ctx.globalCompositeOperation = "multiply";
                ctx.fillStyle = animatedTileColor;
                ctx.fillRect(-recalculatedFinalWidth / 2, -recalculatedFinalHeight / 2, recalculatedFinalWidth, recalculatedFinalHeight);
                ctx.restore();
                // Restore blend mode after tinting
                ctx.globalCompositeOperation = blendToComposite[tileBlendMode] ?? "source-over";
              }
              
              // Note: Don't reset composite operation here - let it persist for the blend mode
              // The blend mode should remain active until the next sprite is drawn
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

        p.pop(); // Close layer context
        
        p.pop(); // Close opacity context
        }); // Close prepared.layers.forEach
        
        // Reset opacity after rendering this state
        p.drawingContext.globalAlpha = 1.0;
        
        // Restore saved values
        currentState = savedState;
        prepared = savedPrepared;
        activePalette = savedActivePalette;
        paletteCycleInterpolation = savedPaletteCycleInterpolation;
        animatedSpriteHueShift = savedAnimatedSpriteHueShift;
        animatedCanvasHueShift = savedAnimatedCanvasHueShift;
        backgroundHueShiftDegrees = savedBackgroundHueShiftDegrees;
        motionScale = savedMotionScale;
      }); // End of statesToRender.forEach
      
      // Reset global alpha after drawing (for fade transitions)
      if (transitionState.isTransitioning && transitionState.type === "fade") {
        p.drawingContext.globalAlpha = 1.0;
      }
      
      // Apply Bloom effect if enabled (after all sprites are drawn, before noise)
      if (currentState.bloomEnabled && hasCanvas(p5Instance)) {
        const canvas = p5Instance.canvas as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Get current canvas image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Create bloom canvas for bright areas
            const bloomCanvas = document.createElement("canvas");
            bloomCanvas.width = canvas.width;
            bloomCanvas.height = canvas.height;
            const bloomCtx = bloomCanvas.getContext("2d");
            if (bloomCtx) {
              // Extract bright areas based on threshold
              const threshold = (currentState.bloomThreshold / 100) * 255; // 0-255
              const bloomImageData = bloomCtx.createImageData(canvas.width, canvas.height);
              const bloomData = bloomImageData.data;
              
              for (let i = 0; i < data.length; i += 4) {
                // Calculate brightness (luminance)
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                
                if (brightness > threshold) {
                  // Copy bright pixels to bloom canvas
                  bloomData[i] = r;
                  bloomData[i + 1] = g;
                  bloomData[i + 2] = b;
                  bloomData[i + 3] = data[i + 3]; // Preserve alpha
                } else {
                  // Dark pixels become transparent
                  bloomData[i] = 0;
                  bloomData[i + 1] = 0;
                  bloomData[i + 2] = 0;
                  bloomData[i + 3] = 0;
                }
              }
              
              bloomCtx.putImageData(bloomImageData, 0, 0);
              
              // Blur the bright areas
              const bloomRadius = (currentState.bloomRadius / 100) * 50; // Max 50px
              if (bloomRadius > 0) {
                bloomCtx.filter = `blur(${bloomRadius}px)`;
                bloomCtx.drawImage(bloomCanvas, 0, 0);
                bloomCtx.filter = 'none';
              }
              
              // Composite bloom back onto main canvas using screen blend mode
              ctx.save();
              ctx.globalCompositeOperation = "screen";
              ctx.globalAlpha = currentState.bloomIntensity / 100;
              ctx.drawImage(bloomCanvas, 0, 0);
              ctx.restore();
            }
          }
        }
      }
      
      // Apply Pixelation effects if enabled (after bloom, before noise)
      // Also apply during pixellate transitions (pixelation is controlled by transition state)
      const shouldApplyPixelation = currentState.pixelationEnabled || 
                                    currentState.colorQuantizationEnabled ||
                                    (transitionState.isTransitioning && transitionState.type === "pixellate");
      
      if (shouldApplyPixelation && hasCanvas(p5Instance)) {
        const canvas = p5Instance.canvas as HTMLCanvasElement;
        if (canvas) {
          // During pixellate transition, use the transition-controlled pixelation size
          // Otherwise use the state's pixelation size
          const pixelationSize = (transitionState.isTransitioning && transitionState.type === "pixellate")
            ? currentState.pixelationSize // Already set by transition logic
            : (currentState.pixelationEnabled ? currentState.pixelationSize : 1);
          
          const pixelationGridEnabled = currentState.pixelationGridEnabled;
          const pixelationGridBrightness = currentState.pixelationGridBrightness;
          const quantizationBits = currentState.colorQuantizationEnabled ? currentState.colorQuantizationBits : null;
          
          // Get palette color for grid if enabled
          let gridColor: string | undefined;
          if (pixelationGridEnabled && currentState.pixelationGridUsePalette) {
            const palette = getPalette(currentState.paletteId);
            if (palette.colors.length > 0) {
              const colorIndex = currentState.pixelationGridPaletteColorIndex % palette.colors.length;
              gridColor = palette.colors[colorIndex];
            }
          }
          // If not using palette, gridColor remains undefined and will default to black
          
          applyPixelationEffects(canvas, pixelationSize, pixelationGridEnabled, pixelationGridBrightness, quantizationBits, gridColor);
        }
      }
      
      // Apply Halftone if enabled (after pixelation, before noise)
      if (currentState.halftoneEnabled && hasCanvas(p5Instance)) {
        const canvas = p5Instance.canvas as HTMLCanvasElement;
        if (canvas) {
          applyHalftone(
            canvas,
            currentState.halftoneDotSize,
            currentState.halftoneSpacing,
            currentState.halftoneAngle,
            currentState.halftoneShape
          );
        }
      }

      // Apply Noise/Grain overlay if enabled (after all sprites and bloom are drawn)
      if (currentState.noiseEnabled && hasCanvas(p5Instance)) {
        const canvas = p5Instance.canvas as HTMLCanvasElement;
        if (canvas) {
          applyNoiseOverlay(
            canvas,
            currentState.noiseType,
            currentState.noiseStrength,
            false, // Always use static noise (animated toggle removed)
            0 // No time parameter needed for static noise
          );
        }
      }

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
    
    // Clear parallax positions when seed or movement mode changes
    if (partial.seed !== undefined || partial.movementMode !== undefined) {
      parallaxPositions.clear();
    }
    
    // Update state in the ref object - this ensures all closures see the update
    stateRef.current = { ...stateRef.current, ...partial };
    state = stateRef.current; // Keep local variable in sync
    
    // Migration: Initialize selectedSprites from spriteMode if missing (but not if explicitly empty)
    // Only migrate if selectedSprites is undefined/null (old state format), not if it's an empty array
    if (state.selectedSprites === undefined || state.selectedSprites === null) {
      // All collections are now SVG-based
      let identifier: string;
      const sprite = getSpriteInCollection(state.spriteCollectionId || "default", state.spriteMode);
      if (sprite?.svgPath) {
        identifier = sprite.svgPath;
      } else {
        // Fallback: use default sprite if spriteMode doesn't match any sprite
        const defaultCollection = getCollection("default");
        if (defaultCollection && defaultCollection.sprites.length > 0) {
          const firstSprite = defaultCollection.sprites[0];
          if (firstSprite.svgPath) {
            identifier = firstSprite.svgPath;
          } else {
            identifier = "/sprites/default/star.svg"; // Ultimate fallback
          }
        } else {
          identifier = "/sprites/default/star.svg"; // Ultimate fallback
        }
      }
      stateRef.current.selectedSprites = [identifier];
      state = stateRef.current;
    }
    // If selectedSprites is an empty array, leave it empty (allows empty canvas)
    
    if (recompute) {
      updateSprite();
    } else {
      notifyState();
    }
  };

  const controller: SpriteController = {
    getState: () => ({ ...stateRef.current }),
    applyState: (newState: GeneratorState, transition: TransitionType = "instant", durationMs?: number) => {
      // Clear parallax positions when applying a new scene state
      parallaxPositions.clear();
      
      if (transition === "instant") {
        // Instant transition - immediate state swap
      stateRef.current = { ...newState };
        state = stateRef.current;
        transitionState.isTransitioning = false;
      updateSprite();
        return;
      }
      
      // Start transition
      // For pixellate transitions, duration comes from durationMs parameter (from scene's transitionTimeSeconds)
      // For other transitions, use defaults
      let transitionDuration = 1500; // Default 1.5s
      if (transition === "fade") {
        transitionDuration = 1000; // 1s for fade
      } else if (transition === "smooth") {
        transitionDuration = 2500; // 2.5s for smooth
      } else if (transition === "pixellate") {
        // Use provided duration or default to 1.5s
        transitionDuration = durationMs ? durationMs : 1500;
      }
      
      // For pixellate transitions, store the target pixelation size
      const targetPixelationSize = newState.pixelationEnabled ? newState.pixelationSize : 1;
      
      transitionState = {
        isTransitioning: true,
        fromState: { ...stateRef.current },
        toState: { ...newState },
        startTime: Date.now(),
        duration: transitionDuration,
        type: transition,
        targetPixelationSize: transition === "pixellate" ? targetPixelationSize : undefined,
        sceneLoadedAtMax: false,
      };
      
      // Update target state immediately (for discrete values)
      stateRef.current = { ...newState };
      state = stateRef.current;
      
      // Don't recompute sprite yet - let draw loop handle interpolation
      notifyState();
    },
    randomizeAll: () => {
      updateSeed();
      // Preserve rotation settings
      const preserveRotationEnabled = stateRef.current.rotationEnabled;
      const preserveRotationAnimated = stateRef.current.rotationAnimated;
      const preserveRotationAmount = stateRef.current.rotationAmount;
      const preserveRotationSpeed = stateRef.current.rotationSpeed;
      
      // Select a random sprite from default collection
      const randomSpriteIdentifier = getRandomDefaultSprite();
      const defaultCollection = getCollection("default");
      let nextMode: SpriteMode = "star"; // Fallback
      
      // Find the sprite mode for the selected sprite
      if (defaultCollection) {
        const sprite = defaultCollection.sprites.find(s => 
          s.svgPath === randomSpriteIdentifier || 
          (randomSpriteIdentifier.startsWith("shape:") && s.spriteMode === randomSpriteIdentifier.replace("shape:", ""))
        );
        if (sprite) {
          // Use spriteMode if available, otherwise use id
          if (sprite.spriteMode) {
            nextMode = sprite.spriteMode;
          } else if (sprite.id) {
            nextMode = sprite.id as SpriteMode;
          }
        }
      }
      
      stateRef.current.spriteMode = nextMode;
      stateRef.current.selectedSprites = [randomSpriteIdentifier];
      // Also update spriteCollectionId to default if not already set
      if (stateRef.current.spriteCollectionId !== "default") {
        stateRef.current.spriteCollectionId = "default";
      }
      stateRef.current.paletteId = getRandomPalette().id;
      // Density/scale settings are preserved - not randomized
      stateRef.current.paletteVariance = randomInt(32, 128);
      stateRef.current.hueShift = 0;
      stateRef.current.motionIntensity = randomInt(42, 98);
      stateRef.current.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      stateRef.current.backgroundMode = "auto";
      stateRef.current.backgroundHueShift = 0;
      stateRef.current.backgroundBrightness = 50;
      // Reset background color seed suffix to use base seeded calculation
      stateRef.current.backgroundColorSeedSuffix = "";
      
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
      // Reset background color seed suffix to use base seeded calculation
      stateRef.current.backgroundColorSeedSuffix = "";
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
    },
    refreshPaletteApplication: () => {
      // Re-apply the current palette randomly across sprites without regenerating them
      // This keeps the same sprite positions, sizes, and shapes but randomizes which colors are assigned
      // We update only the colorSeedSuffix to change color assignments without affecting positions
      const newColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Also randomize background color by updating the seed suffix
      // This allows the background color to change while maintaining theme consistency
      const newBackgroundColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      applyState({ 
        colorSeedSuffix: newColorSeedSuffix,
        backgroundColorSeedSuffix: newBackgroundColorSeedSuffix
      }, { recompute: true });
    },
    randomizeGradientColors: () => {
      // Re-apply gradient colors by updating the seed suffix
      // This will cause gradient colors to be recalculated with new random palette color selections
      const newGradientColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      applyState({ spriteGradientColorSeedSuffix: newGradientColorSeedSuffix }, { recompute: true });
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
        // Re-assign blend modes by updating the seed suffix (similar to refreshPaletteApplication)
        // This will cause blend modes to be recalculated with new random values
        reassignAutoBlendModes();
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
      applyState({ scaleBase: clamp(value, 0, 100) }, { recompute: true });
    },
    setScaleSpread: (value: number) => {
      applyState({ scaleSpread: clamp(value, 0, 100) }, { recompute: true });
    },
    setScaleWeighting: (value: number) => {
      applyState({ scaleWeighting: clamp(value, 0, 100) }, { recompute: true });
    },
    setLinesRatio: (value: number) => {
      applyState({ linesRatio: clamp(value, 0, 100) }, { recompute: true });
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
    setSaturation: (value: number) => {
      // Saturation affects sprite colors, so regeneration is needed
      // Saturation is stored as 0-200 (100 = normal, 0 = grayscale, 200 = max saturation)
      applyState({ saturation: clamp(value, 0, 200) });
    },
    setBrightness: (value: number) => {
      // Brightness affects sprite colors, so regeneration is needed
      // Brightness is stored as 0-200 (100 = normal, 0 = black, 200 = max brightness)
      applyState({ brightness: clamp(value, 0, 200) });
    },
    setContrast: (value: number) => {
      // Contrast affects sprite colors, so regeneration is needed
      // Contrast is stored as 0-200 (100 = normal, 0 = no contrast, 200 = max contrast)
      applyState({ contrast: clamp(value, 0, 200) });
    },
    setColorAdjustmentsEnabled: (enabled: boolean) => {
      // Enable/disable color adjustments section (values persist but don't affect rendering when disabled)
      applyState({ colorAdjustmentsEnabled: enabled }, { recompute: true });
    },
    setGradientsEnabled: (enabled: boolean) => {
      // Enable/disable gradients section
      applyState({ gradientsEnabled: enabled }, { recompute: true });
    },
    setBlendOpacityEnabled: (enabled: boolean) => {
      // Enable/disable blend & opacity section
      applyState({ blendOpacityEnabled: enabled }, { recompute: true });
    },
    setCanvasEnabled: (enabled: boolean) => {
      // Enable/disable canvas section (applied in render, no regeneration needed)
      applyState({ canvasEnabled: enabled }, { recompute: false });
    },
    setDensityScaleEnabled: (enabled: boolean) => {
      // Enable/disable density & scale section (values persist but don't affect rendering when disabled)
      applyState({ densityScaleEnabled: enabled }, { recompute: true });
    },
    setMotionIntensity: (value: number) => {
      // Motion intensity is applied directly in rendering, no regeneration needed
      applyState({ motionIntensity: clamp(value, 0, 100) }, { recompute: false });
    },
    setMotionSpeed: (value: number) => {
      applyState({ motionSpeed: clamp(value, 0, 12.5) }, { recompute: false });
    },
    setParallaxAngle: (angle: number) => {
      // Clamp angle to 0-360 range
      const clampedAngle = ((angle % 360) + 360) % 360;
      applyState({ parallaxAngle: clampedAngle }, { recompute: false });
    },
    setParallaxDepthEffect: (value: number) => {
      applyState({ parallaxDepthEffect: clamp(value, 0, 100) }, { recompute: false });
    },
    setAnimationEnabled: (enabled: boolean) => {
      applyState({ animationEnabled: enabled }, { recompute: false });
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
      // Get the current collection ID - if not set, default to default
      const collectionId = stateRef.current.spriteCollectionId || "default";
      const collection = getCollection(collectionId);
      
      if (!collection) {
        // Collection doesn't exist - fallback to default
        // All collections are now SVG-based, so just use default collection
        const defaultCollection = getCollection("default");
        if (defaultCollection) {
          const sprite = getSpriteInCollection("default", mode);
          if (sprite) {
          applyState({ spriteCollectionId: "default", spriteMode: mode });
        }
        }
        return;
      }
      
      // All collections are now SVG-based
      // Validate the sprite exists in the collection
      const sprite = getSpriteInCollection(collectionId, mode);
      if (sprite) {
        // Preload the sprite image before applying state change to avoid lag/stutter
        const spritePath = sprite.svgPath;
        if (spritePath) {
          // Check if image is already cached
          if (!getCachedSpriteImage(spritePath)) {
            // Start preloading immediately (non-blocking)
            // For large/complex SVGs, this might take a moment, but it's better than blocking
            loadSpriteImage(spritePath).catch(error => {
              console.warn(`Failed to preload sprite: ${spritePath}`, error);
            });
          }
          
          // Defer preloading of other sprites in the collection to idle time
          // Only preload the specific sprite being selected immediately
          const otherPathsToPreload = collection.sprites
            .filter(s => {
              if (!s.svgPath) return false;
              // Skip if already cached
              if (getCachedSpriteImage(s.svgPath)) return false;
              // Skip the sprite we're currently selecting (already preloading above)
              if (s.svgPath === spritePath) return false;
              return true;
            })
            .map(s => s.svgPath!);
          
          if (otherPathsToPreload.length > 0) {
            // Use requestIdleCallback with setTimeout fallback for deferred preloading
            const deferredPreload = () => {
              preloadSpriteImages(otherPathsToPreload).catch(error => {
                console.warn("Failed to preload some sprites", error);
              });
            };
            
            if (typeof requestIdleCallback !== 'undefined') {
              requestIdleCallback(deferredPreload, { timeout: 2000 });
            } else {
              setTimeout(deferredPreload, 100);
            }
          }
        }
        
        // Sprite found in current collection - update mode
        applyState({ spriteMode: mode });
        return;
      }
      
      // Sprite not found in current collection - try to find it in any collection
      // All collections are now SVG-based
      const allCollections = getAllCollections();
      for (const coll of allCollections) {
          const foundSprite = getSpriteInCollection(coll.id, mode);
          if (foundSprite) {
          // Preload the sprite image before switching collections
          const spritePath = foundSprite.svgPath;
          if (spritePath && !getCachedSpriteImage(spritePath)) {
            loadSpriteImage(spritePath).catch(error => {
              console.warn(`Failed to preload sprite: ${spritePath}`, error);
            });
          }
          
            // Found it in another collection - switch to that collection and mode
            applyState({ spriteCollectionId: coll.id, spriteMode: mode });
            return;
        }
      }
      
      // Sprite not found anywhere - try to update mode anyway (might be a race condition)
      // The renderer will fall back to the first sprite in the collection if invalid
      applyState({ spriteMode: mode });
    },
    toggleSpriteSelection: (spriteIdentifier: string) => {
      const currentState = stateRef.current;
      // Use empty array as fallback, but preserve explicit empty arrays
      const selectedSprites = currentState.selectedSprites ?? [];
      
      // If this is a custom sprite, ensure the collection ID is set correctly
      if (spriteIdentifier.startsWith("custom:")) {
        const parts = spriteIdentifier.split(":");
        if (parts.length === 3) {
          const [, collectionId] = parts;
          // Update collection ID if it's different
          if (currentState.spriteCollectionId !== collectionId) {
            applyState({ 
              spriteCollectionId: collectionId,
              selectedSprites: [...selectedSprites, spriteIdentifier]
            });
            return;
          }
        }
      }
      
      // Check if sprite is already selected
      const index = selectedSprites.indexOf(spriteIdentifier);
      if (index >= 0) {
        // Sprite is selected - remove it (allow empty selection for empty canvas)
        const newSelected = [...selectedSprites];
        newSelected.splice(index, 1);
        // Explicitly set to empty array if no sprites remain (allows empty canvas)
        // Need to recompute because computeSprite uses selectedSprites to determine which sprites to render
        applyState({ selectedSprites: newSelected });
      } else {
        // Sprite is not selected - add it
        // Preload the sprite image before adding to selection
        const spriteInfo = findSpriteByIdentifier(spriteIdentifier);
        if (spriteInfo && spriteInfo.sprite.svgPath && !getCachedSpriteImage(spriteInfo.sprite.svgPath)) {
          // Preload immediately for selected sprite
          loadSpriteImage(spriteInfo.sprite.svgPath).catch(error => {
            console.warn(`Failed to preload sprite: ${spriteInfo.sprite.svgPath}`, error);
          });
        }
        // Need to recompute because computeSprite uses selectedSprites to determine which sprites to render
        applyState({ selectedSprites: [...selectedSprites, spriteIdentifier] });
      }
    },
    setMovementMode: (mode: MovementMode) => {
      // Movement mode is applied during rendering, no regeneration needed
      // Clear parallax positions when mode changes to ensure proper initialization
      parallaxPositions.clear();
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
      applyState({ rotationSpeed: clamp(value, 1, 100) });
    },
    setRotationAnimated: (value: boolean) => {
      stateRef.current.rotationAnimated = value;
      state = stateRef.current; // Keep local variable in sync
      notifyState();
    },
    usePalette: (paletteId: PaletteId) => {
      if (getPalette(paletteId)) {
        // Randomize background color when palette changes by updating the seed suffix
        // This maintains theme consistency while allowing variation
        const newBackgroundColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        applyState({
          paletteId,
          backgroundColorSeedSuffix: newBackgroundColorSeedSuffix,
        });
      }
    },
    setBackgroundMode: (mode: BackgroundMode) => {
      // Check if mode is valid (auto or a valid palette ID from all palettes including custom)
      if (mode === "auto") {
        // Randomize background color when mode changes by updating the seed suffix
        const newBackgroundColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        applyState({ 
          backgroundMode: mode,
          backgroundColorSeedSuffix: newBackgroundColorSeedSuffix,
        });
        return;
      }
      // Use getPalette to check if palette exists (includes custom palettes)
      const palette = getPalette(mode);
      if (palette && palette.id === mode) {
        // Randomize background color when mode changes by updating the seed suffix
        const newBackgroundColorSeedSuffix = `-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        applyState({ 
          backgroundMode: mode,
          backgroundColorSeedSuffix: newBackgroundColorSeedSuffix,
        });
      }
    },
    setBackgroundHueShift: (value: number) => {
      // Background hue shift affects background color, so regeneration is needed
      // Background hue shift is stored as 0-100 (maps to 0-360 degrees)
      applyState({ backgroundHueShift: clamp(value, 0, 100) });
    },
    setBackgroundSaturation: (value: number) => {
      // Background saturation affects background color rendering
      // Background saturation is stored as 0-200 (100 = normal, 0 = grayscale, 200 = max saturation)
      applyState({ backgroundSaturation: clamp(value, 0, 200) });
    },
    setBackgroundBrightness: (value: number) => {
      applyState({ backgroundBrightness: clamp(value, 0, 100) });
    },
    setBackgroundContrast: (value: number) => {
      // Background contrast affects background color rendering
      applyState({ backgroundContrast: clamp(value, 0, 200) });
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
    setOutlineEnabled: (enabled: boolean) => {
      // Outline mode is applied during rendering, no regeneration needed
      applyState({ outlineEnabled: enabled }, { recompute: false });
    },
    setOutlineStrokeWidth: (width: number) => {
      // Stroke width is applied during rendering, no regeneration needed
      applyState({ outlineStrokeWidth: clamp(width, 1, 20) }, { recompute: false });
    },
    setOutlineMixed: (enabled: boolean) => {
      // Mixed mode requires regeneration to assign random outline states to tiles
      applyState({ outlineMixed: enabled }, { recompute: enabled });
    },
    setOutlineBalance: (value: number) => {
      // Balance requires regeneration to reassign outline states based on new ratio
      applyState({ outlineBalance: clamp(value, 0, 100) }, { recompute: true });
    },
    setFilledOpacity: (value: number) => {
      // Opacity is applied during rendering, no regeneration needed
      applyState({ filledOpacity: clamp(value, 0, 100) }, { recompute: false });
    },
    setOutlinedOpacity: (value: number) => {
      // Opacity is applied during rendering, no regeneration needed
      applyState({ outlinedOpacity: clamp(value, 0, 100) }, { recompute: false });
    },
    randomizeOutlineDistribution: () => {
      if (!stateRef.current.outlineMixed) {
        // If mixed mode is disabled, enable it and regenerate
        applyState({ outlineMixed: true });
        return;
      }
      // Regenerate sprites with new seed component to get new random outline distribution
      const currentState = stateRef.current;
      applyState({
        ...currentState,
        seed: `${currentState.seed}-outline-${Date.now()}`,
      });
    },
    // FX (Visual Effects) controller methods
    // Bloom
    setBloomEnabled: (enabled: boolean) => {
      applyState({ bloomEnabled: enabled }, { recompute: false });
    },
    setBloomIntensity: (intensity: number) => {
      applyState({ bloomIntensity: clamp(intensity, 0, 100) }, { recompute: false });
    },
    setBloomThreshold: (threshold: number) => {
      applyState({ bloomThreshold: clamp(threshold, 0, 100) }, { recompute: false });
    },
    setBloomRadius: (radius: number) => {
      applyState({ bloomRadius: clamp(radius, 0, 100) }, { recompute: false });
    },
    // Noise
    setNoiseEnabled: (enabled: boolean) => {
      applyState({ noiseEnabled: enabled }, { recompute: false });
    },
    setNoiseType: (type: "grain" | "crt" | "bayer" | "static" | "scanlines") => {
      applyState({ noiseType: type }, { recompute: false });
    },
    setNoiseStrength: (strength: number) => {
      applyState({ noiseStrength: clamp(strength, 0, 100) }, { recompute: false });
    },
    // Pixelation
    setPixelationEnabled: (enabled: boolean) => {
      applyState({ pixelationEnabled: enabled }, { recompute: false });
    },
    setPixelationSize: (size: number) => {
      applyState({ pixelationSize: clamp(size, 1, 50) }, { recompute: false });
    },
    setPixelationGridEnabled: (enabled: boolean) => {
      applyState({ pixelationGridEnabled: enabled }, { recompute: false });
    },
    setPixelationGridBrightness: (brightness: number) => {
      applyState({ pixelationGridBrightness: clamp(brightness, 0, 100) }, { recompute: false });
    },
    setPixelationGridUsePalette: (usePalette: boolean) => {
      applyState({ pixelationGridUsePalette: usePalette }, { recompute: false });
    },
    randomizePixelationGridColor: () => {
      const palette = getPalette(getState().paletteId);
      if (palette.colors.length > 0) {
        const randomIndex = Math.floor(Math.random() * palette.colors.length);
        applyState({ 
          pixelationGridPaletteColorIndex: randomIndex,
          pixelationGridUsePalette: true 
        }, { recompute: false });
      }
    },
    setColorQuantizationEnabled: (enabled: boolean) => {
      applyState({ colorQuantizationEnabled: enabled }, { recompute: false });
    },
    setColorQuantizationBits: (bits: number) => {
      // Clamp to valid bit depths: 4, 8, 16, or 24
      const validBits = [4, 8, 16, 24];
      const clampedBits = validBits.reduce((prev, curr) => 
        Math.abs(curr - bits) < Math.abs(prev - bits) ? curr : prev
      );
      applyState({ colorQuantizationBits: clampedBits }, { recompute: false });
    },
    // Halftone
    setHalftoneEnabled: (enabled: boolean) => {
      applyState({ halftoneEnabled: enabled }, { recompute: false });
    },
    setHalftoneDotSize: (size: number) => {
      applyState({ halftoneDotSize: clamp(size, 1, 64) }, { recompute: false });
    },
    setHalftoneSpacing: (spacing: number) => {
      applyState({ halftoneSpacing: clamp(spacing, 2, 50) }, { recompute: false });
    },
    setHalftoneAngle: (angle: number) => {
      applyState({ halftoneAngle: clamp(angle, 0, 360) }, { recompute: false });
    },
    setHalftoneShape: (shape: "circle" | "square" | "diamond") => {
      applyState({ halftoneShape: shape }, { recompute: false });
    },
    setSpriteCollection: (collectionId: string) => {
      const collection = getCollection(collectionId);
      if (collection) {
        // Cache should persist across collections - sprites from different collections can coexist
        // Removed clearSpriteImageCache() to avoid expensive reloads
        
        const currentState = stateRef.current;
        const currentSelectedSprites = currentState.selectedSprites ?? [];
        
        // Preserve all currently selected sprites (from all collections)
        // No auto-selection - user must manually select sprites
        const newSelectedSprites = [...currentSelectedSprites];
        
        // Cache lookup results to avoid repeated searches
        const lookupCache = new Map<string, { sprite: any; collectionId: string } | null>();
        const getCachedLookup = (identifier: string) => {
          if (!lookupCache.has(identifier)) {
            lookupCache.set(identifier, findSpriteByIdentifier(identifier));
          }
          return lookupCache.get(identifier);
        };
        
        // Only update spriteMode if there are already selected sprites from the new collection
        // This maintains the current mode when switching to a collection that has selected sprites
        let spriteModeToSet: SpriteMode | undefined = undefined;
        const spritesFromNewCollection = currentSelectedSprites.filter(identifier => {
          const spriteInfo = getCachedLookup(identifier);
          return spriteInfo && spriteInfo.collectionId === collectionId;
        });
        
        if (spritesFromNewCollection.length > 0) {
          // Use the first selected sprite from the new collection as the current mode
          const firstSelectedIdentifier = spritesFromNewCollection[0];
          const spriteInfo = getCachedLookup(firstSelectedIdentifier);
          if (spriteInfo) {
            spriteModeToSet = spriteInfo.sprite.id as SpriteMode;
          }
        }
        
        // Only preload sprites that are actually selected from the new collection
        // Defer non-critical preloading to idle time
        const selectedPathsToPreload: string[] = [];
        spritesFromNewCollection.forEach(identifier => {
          const spriteInfo = getCachedLookup(identifier);
          if (spriteInfo && spriteInfo.sprite.svgPath && !getCachedSpriteImage(spriteInfo.sprite.svgPath)) {
            selectedPathsToPreload.push(spriteInfo.sprite.svgPath);
          }
        });
        
        // Preload selected sprites immediately (synchronously for critical path)
        if (selectedPathsToPreload.length > 0) {
          preloadSpriteImages(selectedPathsToPreload).catch(error => {
            console.warn("Failed to preload selected sprites", error);
          });
        }
        
        // Defer preloading of other sprites in the collection to idle time
        const otherPathsToPreload = collection.sprites
          .filter(s => {
            if (!s.svgPath) return false;
            // Skip if already cached
            if (getCachedSpriteImage(s.svgPath)) return false;
            // Skip if already in selected paths
            if (selectedPathsToPreload.includes(s.svgPath)) return false;
            return true;
          })
          .map(s => s.svgPath!);
        
        if (otherPathsToPreload.length > 0) {
          // Use requestIdleCallback with setTimeout fallback for deferred preloading
          const deferredPreload = () => {
            preloadSpriteImages(otherPathsToPreload).catch(error => {
              console.warn("Failed to preload some sprites", error);
            });
          };
          
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(deferredPreload, { timeout: 2000 });
          } else {
            setTimeout(deferredPreload, 100);
          }
        }
        
        // Apply state change - preserve all selected sprites (from all collections)
        // Need to recompute when collection changes because available sprites are different
        const stateUpdate: Partial<GeneratorState> = {
          spriteCollectionId: collectionId,
          selectedSprites: newSelectedSprites,
        };
        
        if (spriteModeToSet !== undefined) {
          stateUpdate.spriteMode = spriteModeToSet;
        }
        
        // Recompute is needed when collection changes (even if selected sprites are preserved)
        // The sprite structure needs to be regenerated with sprites from the new collection
        applyState(stateUpdate);
      }
    },
    setHueRotationEnabled: (enabled: boolean) => {
      applyState({ hueRotationEnabled: enabled }, { recompute: false });
    },
    setHueRotationSpeed: (speed: number) => {
      applyState({ hueRotationSpeed: clamp(speed, 0.1, 100) }, { recompute: false });
    },
    setPaletteCycleEnabled: (enabled: boolean) => {
      applyState({ paletteCycleEnabled: enabled }, { recompute: false });
    },
    setPaletteCycleSpeed: (speed: number) => {
      applyState({ paletteCycleSpeed: clamp(speed, 0.1, 100) }, { recompute: false });
    },
    setCanvasHueRotationEnabled: (enabled: boolean) => {
      applyState({ canvasHueRotationEnabled: enabled }, { recompute: false });
    },
    setCanvasHueRotationSpeed: (speed: number) => {
      applyState({ canvasHueRotationSpeed: clamp(speed, 0.1, 100) }, { recompute: false });
    },
    setAspectRatio: (ratio: "16:9" | "21:9" | "16:10" | "custom") => {
      // Force 16:9 if invalid ratio is passed (backward compatibility)
      const safeRatio: "16:9" | "21:9" | "16:10" | "custom" = 
        ["16:9", "21:9", "16:10", "custom"].includes(ratio) ? ratio : "16:9";
      applyState({ aspectRatio: safeRatio }, { recompute: false });
      
      // Update CSS variable for container aspect ratio
      let paddingTopPercent = 56.25; // Default to 16:9
      switch (safeRatio) {
        case "16:9":
          paddingTopPercent = 56.25; // 9/16 * 100
          break;
        case "21:9":
          paddingTopPercent = 42.857; // 9/21 * 100
          break;
        case "16:10":
          paddingTopPercent = 62.5; // 10/16 * 100
          break;
        case "custom":
          const custom = stateRef.current.customAspectRatio;
          paddingTopPercent = (custom.height / custom.width) * 100;
          break;
        default:
          // Always default to 16:9 (square removed)
          paddingTopPercent = 56.25;
          break;
      }
      document.documentElement.style.setProperty('--canvas-aspect-ratio', `${paddingTopPercent}%`);
      
      // Trigger canvas resize - p5.js will handle it automatically via ResizeObserver
      // The ResizeObserver will detect the container size change and resize the canvas
    },
    setCustomAspectRatio: (width: number, height: number) => {
      const clampedWidth = Math.max(320, Math.min(7680, width));
      const clampedHeight = Math.max(240, Math.min(4320, height));
      applyState({ 
        aspectRatio: "custom",
        customAspectRatio: { width: clampedWidth, height: clampedHeight }
      }, { recompute: false });
      
      // Update CSS variable for container aspect ratio
      const paddingTopPercent = (clampedHeight / clampedWidth) * 100;
      document.documentElement.style.setProperty('--canvas-aspect-ratio', `${paddingTopPercent}%`);
      
      // Trigger canvas resize - p5.js will handle it automatically via ResizeObserver
      // The ResizeObserver will detect the container size change and resize the canvas
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
      
      // Clean up canvas style MutationObserver if it exists
      if (p5Instance && (p5Instance as any).canvas && (p5Instance as any).canvas._styleObserver) {
        ((p5Instance as any).canvas._styleObserver as MutationObserver).disconnect();
        delete (p5Instance as any).canvas._styleObserver;
      }
      
      // Clean up canvas style MutationObserver and interval if they exist
      if (p5Instance && (p5Instance as any).canvas && (p5Instance as any).canvas.elt) {
        const canvasElt = (p5Instance as any).canvas.elt;
        if (canvasElt._styleObserver) {
          (canvasElt._styleObserver as MutationObserver).disconnect();
          delete canvasElt._styleObserver;
        }
        if (canvasElt._styleCheckInterval) {
          clearInterval(canvasElt._styleCheckInterval);
          delete canvasElt._styleCheckInterval;
        }
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
              // Clean up style observers
            if ((p5Instance as any)._pixliStyleCleanup) {
              try {
                (p5Instance as any)._pixliStyleCleanup();
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            p5Instance.remove();
              p5Instance = null;
            }
            destroyTimeoutId = null;
          }, 10);
        } catch (e) {
          // If removal fails, try direct removal
          try {
            // Clean up style observers
            if ((p5Instance as any)._pixliStyleCleanup) {
              try {
                (p5Instance as any)._pixliStyleCleanup();
              } catch (e) {
                // Ignore cleanup errors
              }
            }
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

