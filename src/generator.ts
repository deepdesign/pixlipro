import p5 from "p5";

import {
  defaultPaletteId,
  getPalette,
  getRandomPalette,
  palettes,
} from "./data/palettes";
import { getGradientsForPalette } from "./data/gradients";
import { calculateGradientLine } from "./lib/gradientUtils";

const MIN_TILE_SCALE = 0.12;
const MAX_TILE_SCALE = 5.5; // Allow large sprites, but positioning will be adjusted
const MAX_ROTATION_DEGREES = 180;
const MAX_DENSITY_PERCENT_UI = 1000;
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
] as const;

export type MovementMode = (typeof movementModes)[number];

// Speed multipliers to normalize perceived animation speed across movement modes
// Based on analysis: drift uses 0.02 multiplier (slowest), sway uses 0.13 (fastest)
// These multipliers ensure all modes feel balanced at 100% animation speed
const MOVEMENT_SPEED_MULTIPLIERS: Record<MovementMode, number> = {
  drift: 1.625,    // ~1.625x slower - quadrupled speed from 6.5x
  cascade: 2.9,     // ~2.9x slower (0.045 vs 0.13)
  comet: 3.0,       // ~3x slower - reduced speed by 25% from 2.4x
  ripple: 3.25,     // ~3.25x slower (avg 0.04 vs 0.13)
  spiral: 7.3,      // ~7.3x slower (~60% of previous max speed)
  zigzag: 2.2,      // ~2.2x slower (0.06 vs 0.13)
  pulse: 2.7,       // ~2.7x slower (~60% of previous max speed)
  linear: 2.0,      // ~2x slower - simple linear movement
  isometric: 2.5,   // ~2.5x slower - isometric grid movement
};

// Scale multipliers to improve canvas coverage for modes with large movement radii
// Modes like spiral/orbit move sprites in wide circles, causing sparsity
// Increasing sprite size compensates by making fewer sprites fill more visual space
const MOVEMENT_SCALE_MULTIPLIERS: Record<MovementMode, number> = {
  spiral: 1.4,      // 40% larger sprites to fill space despite wide circular movement
  comet: 1.3,       // 30% larger sprites for long comet trails
  ripple: 1.15,     // 15% larger sprites for ripple effects
  cascade: 1.1,     // 10% larger sprites for cascading patterns
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
  | "cross";

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
}

type PreparedTile = ShapeTile;

interface PreparedLayer {
  tiles: PreparedTile[];
  tileCount: number;
  blendMode: BlendModeKey;
  opacity: number;
  mode: "shape";
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
};

const SEED_ALPHABET = "0123456789ABCDEF";

const generateSeedString = () =>
  Array.from(
    { length: 8 },
    () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)],
  ).join("");

const createMulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

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
      const radius = baseUnit * (0.55 + layerIndex * 0.18 + motionScale * 1.35);
      const angle = phased * (0.04 + layerIndex * 0.02);
      const spiralFactor = 1 + Math.sin(angle * 0.5) * 0.4;
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
      const maxDistance = (layerTileSize * 0.4 * motionScale + baseUnit * 0.3) * speedMultiplier;
      
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
      const maxDistance = (layerTileSize * 0.4 * motionScale + baseUnit * 0.3) * speedMultiplier;
      
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

  const isShapeMode = shapeModes.includes(state.spriteMode as ShapeMode);
  const activeShape = isShapeMode ? (state.spriteMode as ShapeMode) : "rounded";

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
    const maxTiles = 60;
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
      
      tiles.push({
        kind: "shape",
        shape: activeShape,
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
      });
    }

    layers.push({
      tiles,
      tileCount: tileTotal,
      blendMode: layerBlendMode,
      opacity,
      mode: "shape",
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
  randomizeScale: () => void;
  randomizeScaleRange: () => void;
  randomizeMotion: () => void;
  randomizeBlendMode: () => void;
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
  applySingleTilePreset: () => void;
  applyNebulaPreset: () => void;
  applyMinimalGridPreset: () => void;
  reset: () => void;
  destroy: () => void;
  getP5Instance: () => p5 | null;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
}

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
  let p5Instance: p5 | null = null;
  
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
      canvas = p.createCanvas(size, size);
      canvas.parent(container);
      p.pixelDensity(1);
      p.noStroke();
      p.noSmooth();
      p.imageMode(p.CENTER);

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
    function windowResizedHandler(event: UIEvent) {
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
      (container as any)._resizeObserver = containerResizeObserver;
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
      (p as any).deltaMs = deltaMs;
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
          let normalizedU = ((tile.u % 1) + 1) % 1;
          let normalizedV = ((tile.v % 1) + 1) % 1;
          let movement = { offsetX: 0, offsetY: 0, scaleMultiplier: 1 };
          
          if (tile.kind === "shape") {
            const baseShapeSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            movement = computeMovementOffsets(currentState.movementMode, {
              time: scaledAnimationTime, // Use smoothly accumulating scaled time
              phase: tileIndex * 7,
              motionScale,
              layerIndex,
              baseUnit: baseShapeSize,
              layerTileSize: baseLayerSize,
              speedFactor: 1.0, // Speed is already applied to scaledAnimationTime
            });
            
            // Normal wrapping for all modes
            normalizedU = ((tile.u % 1) + 1) % 1;
            normalizedV = ((tile.v % 1) + 1) % 1;
            
            const baseX = offsetX + normalizedU * drawSize;
            const baseY = offsetY + normalizedV * drawSize;
            
            const finalMovement = movement;
            const shapeSize = baseShapeSize * finalMovement.scaleMultiplier;
            // Use currentState.layerOpacity directly instead of stored layer.opacity for dynamic updates
            const opacityValue = clamp(currentState.layerOpacity / 100, 0.12, 1);
            const opacityAlpha = Math.round(opacityValue * 255);

            p.push();
            const halfSize = shapeSize / 2;
            const allowableOverflow = Math.max(drawSize * 0.35, shapeSize * 0.8);
            
            // Clamp positions to canvas bounds with overflow allowance
            const clampedX = clamp(
              baseX + finalMovement.offsetX,
              offsetX + halfSize - allowableOverflow,
              offsetX + drawSize - halfSize + allowableOverflow,
            );
            const clampedY = clamp(
              baseY + finalMovement.offsetY,
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
                  const barThickness = Math.max(2, shapeSize * 0.18);
                  const barLength = shapeSize;
                  ctx.save();
                  ctx.rect(-barThickness / 2, -barLength / 2, barThickness, barLength);
                  ctx.rect(-barLength / 2, -barThickness / 2, barLength, barThickness);
                  ctx.rotate(Math.PI / 4);
                  ctx.rect(-barThickness / 2, -barLength / 2, barThickness, barLength);
                  ctx.rect(-barLength / 2, -barThickness / 2, barLength, barThickness);
                  ctx.restore();
                  break;
                }
                case "cross": {
                  const barThickness = Math.max(2, shapeSize * 0.35);
                  const barLength = shapeSize;
                  ctx.rect(-barThickness / 2, -barLength / 2, barThickness, barLength);
                  ctx.rect(-barLength / 2, -barThickness / 2, barLength, barThickness);
                  break;
                }
                default:
                  ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
              }
              
              ctx.fill();
              ctx.restore();
            } else {
              // Use p5.js for solid colors
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
                const barThickness = Math.max(2, shapeSize * 0.18);
                const barLength = shapeSize;
                p.push();
                p.rectMode(p.CENTER);
                p.rect(0, 0, barThickness, barLength);
                p.rect(0, 0, barLength, barThickness);
                p.rotate(p.PI / 4);
                p.rect(0, 0, barThickness, barLength);
                p.rect(0, 0, barLength, barThickness);
                p.pop();
                break;
              }
              case "cross": {
                const barThickness = Math.max(2, shapeSize * 0.35);
                const barLength = shapeSize;
                p.rectMode(p.CENTER);
                p.rect(0, 0, barThickness, barLength);
                p.rect(0, 0, barLength, barThickness);
                break;
              }
              default:
                p.circle(0, 0, shapeSize);
              }
            }

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

  p5Instance = new p5(sketch);

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
      stateRef.current.scalePercent = randomInt(220, 960);
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
        return;
      }
      const nextBlend = randomBlendMode();
      stateRef.current.blendMode = nextBlend;
      stateRef.current.previousBlendMode = nextBlend;
      stateRef.current.blendModeAuto = false;
      state = stateRef.current; // Keep local variable in sync
      updateSprite();
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
      if (!shapeModes.includes(mode as ShapeMode)) {
        return;
      }
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
      const isValid =
        mode === "auto" || palettes.some((palette) => palette.id === mode);
      if (!isValid) {
        return;
      }
      applyState({ backgroundMode: mode });
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
      const isValid =
        mode === "auto" || palettes.some((palette) => palette.id === mode);
      if (!isValid) {
        return;
      }
      // Canvas gradient mode is applied in render, no regeneration needed
      applyState({ canvasGradientMode: mode }, { recompute: false });
    },
    setCanvasGradientDirection: (degrees: number) => {
      // Canvas gradient direction is applied in render, no regeneration needed
      applyState({ canvasGradientDirection: clamp(degrees, 0, 360) }, { recompute: false });
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
      // Clean up container ResizeObserver if it exists
      if ((container as any)._resizeObserver) {
        (container as any)._resizeObserver.disconnect();
        delete (container as any)._resizeObserver;
      }
      // Stop the draw loop before removing to prevent any race conditions
      if (p5Instance) {
        try {
          p5Instance.noLoop();
          // Small delay to ensure loop stops before removal
          setTimeout(() => {
            if (p5Instance) {
              p5Instance.remove();
              p5Instance = null;
            }
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
      if (p5Instance) {
        // Redraw once to ensure the canvas has the latest frame before pausing
        p5Instance.redraw();
        // Small delay to ensure redraw completes before pausing
        setTimeout(() => {
          if (p5Instance) {
            p5Instance.noLoop();
          }
        }, 10);
      }
    },
    resumeAnimation: () => {
      if (p5Instance) {
        p5Instance.loop();
      }
    },
  };

  notifyState();

  return controller;
};
