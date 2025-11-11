import p5 from "p5";

import {
  defaultPaletteId,
  getPalette,
  getRandomPalette,
  palettes,
} from "./data/palettes";

const MIN_TILE_SCALE = 0.12;
const MAX_TILE_SCALE = 5.5; // Allow large sprites, but positioning will be adjusted
const MAX_ROTATION_DEGREES = 180;
const MAX_DENSITY_PERCENT_UI = 1000;
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.05; // approx 4.5°/s at 100%

const degToRad = (value: number) => (value * Math.PI) / 180;
const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const movementModes = [
  "sway",
  "pulse",
  "orbit",
  "drift",
  "ripple",
  "zigzag",
  "cascade",
  "spiral",
  "comet",
  "wavefront",
] as const;

export type MovementMode = (typeof movementModes)[number];

// Speed multipliers to normalize perceived animation speed across movement modes
// Based on analysis: drift uses 0.02 multiplier (slowest), sway uses 0.13 (fastest)
// These multipliers ensure all modes feel balanced at 100% animation speed
const MOVEMENT_SPEED_MULTIPLIERS: Record<MovementMode, number> = {
  sway: 2.0,        // ~2x slower - halved speed from 1.0x (was reference)
  drift: 1.625,    // ~1.625x slower - quadrupled speed from 6.5x
  cascade: 2.9,     // ~2.9x slower (0.045 vs 0.13)
  comet: 3.0,       // ~3x slower - reduced speed by 25% from 2.4x
  ripple: 3.25,     // ~3.25x slower (avg 0.04 vs 0.13)
  spiral: 7.3,      // ~7.3x slower (~60% of previous max speed)
  orbit: 1.8,       // ~1.8x slower (~60% of previous max speed)
  zigzag: 2.2,      // ~2.2x slower (0.06 vs 0.13)
  pulse: 1.6,       // ~1.6x slower (avg 0.08 vs 0.13)
  wavefront: 10.0,  // ~10x slower - wavefront uses phased * 0.055 internally, needs significant slowdown
};

// Scale multipliers to improve canvas coverage for modes with large movement radii
// Modes like spiral/orbit move sprites in wide circles, causing sparsity
// Increasing sprite size compensates by making fewer sprites fill more visual space
const MOVEMENT_SCALE_MULTIPLIERS: Record<MovementMode, number> = {
  spiral: 1.4,      // 40% larger sprites to fill space despite wide circular movement
  orbit: 1.35,      // 35% larger sprites for orbital patterns
  comet: 1.3,       // 30% larger sprites for long comet trails
  wavefront: 1.25,  // 25% larger sprites for wavefront patterns
  ripple: 1.15,     // 15% larger sprites for ripple effects
  cascade: 1.1,     // 10% larger sprites for cascading patterns
  drift: 1.0,       // No adjustment
  pulse: 1.0,       // No adjustment
  sway: 1.0,        // No adjustment
  zigzag: 1.0,      // No adjustment
};

type PaletteId = (typeof palettes)[number]["id"];

type BlendModeKey = "NONE" | "MULTIPLY" | "SCREEN" | "HARD_LIGHT" | "OVERLAY";
export type BlendModeOption = BlendModeKey;

export type BackgroundMode =
  | "palette"
  | "midnight"
  | "charcoal"
  | "dusk"
  | "dawn"
  | "nebula";

const backgroundPresets: Record<BackgroundMode, string | null> = {
  palette: null,
  midnight: "#050509",
  charcoal: "#15151f",
  dusk: "#1f1b3b",
  dawn: "#fbe8c8",
  nebula: "#121835",
};

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
  | "capsule"
  | "ellipse";

interface ShapeTile {
  kind: "shape";
  shape: ShapeMode;
  tint: string;
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
  motionSpeed: number;
  rotationEnabled: boolean;
  rotationAmount: number;
  rotationSpeed: number;
  rotationAnimated: boolean;
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
  "capsule",
  "ellipse",
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
  movementMode: "orbit",
  backgroundMode: "palette",
  motionSpeed: 8.5,
  rotationEnabled: true,
  rotationAmount: 72,
  rotationSpeed: 48,
  rotationAnimated: true,
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
    case "orbit": {
      const radius = layerTileSize * 0.12 * motionScale * layerFactor;
      const angle = phased * (0.05 + layerIndex * 0.01);
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      return { offsetX, offsetY, scaleMultiplier: 1 };
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
    case "wavefront": {
      const travel = phased * 0.055;
      const waveRadius =
        layerTileSize * (motionScale * 2.4 + 1.6 + layerIndex * 0.25);
      const offsetX = Math.cos(travel + phase * 0.25) * waveRadius;
      const offsetY =
        Math.sin(travel * 0.65 + layerIndex * 0.3 + phase * 0.15) *
        waveRadius *
        0.75;
      const breathing = 1 + Math.sin(travel * 0.5) * motionScale * 0.35;
      const scaleMultiplier = clampScale(breathing);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "sway":
    default: {
      const offsetX = Math.sin(phased * 0.13) * baseUnit * motionScale * 0.45;
      const offsetY =
        Math.sin((phased + phase * 0.5) * 0.07 + layerIndex * 0.4) *
        baseUnit *
        motionScale *
        0.6;
      return { offsetX, offsetY, scaleMultiplier: 1 };
    }
  }
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const computeSprite = (state: GeneratorState): PreparedSprite => {
  const rng = createMulberry32(hashSeed(state.seed));
  const palette = getPalette(state.paletteId);
  // Allow variance up to 1.5 (150% internal value) for more color variation
  const variance = clamp(state.paletteVariance / 100, 0, 1.5);

  const colorRng = createMulberry32(hashSeed(`${state.seed}-color`));
  const positionRng = createMulberry32(hashSeed(`${state.seed}-position`));
  // Apply global hue shift to palette colors (0-100 maps to 0-360 degrees)
  const hueShiftDegrees = (state.hueShift / 100) * 360;
  const shiftedPalette = palette.colors.map((color) =>
    shiftHue(color, hueShiftDegrees),
  );
  const chosenPalette = shiftedPalette.map((color) =>
    jitterColor(color, variance, colorRng),
  );
  const backgroundBase = shiftedPalette[0];
  const presetBackground = backgroundPresets[state.backgroundMode];
  const background =
    presetBackground === null
      ? jitterColor(backgroundBase, variance * 0.5, colorRng)
      : presetBackground;

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

    const isOrbitMode = state.movementMode === "orbit";
    const isSpiralMode = state.movementMode === "spiral";

    if (isOrbitMode) {
      minBound = lerp(0.04, 0.18, scaleRatio);
      maxBound = lerp(0.96, 0.82, scaleRatio);
    }

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

      if (isOrbitMode || isSpiralMode) {
        const focusStrength = scaleRatio * (isOrbitMode ? 0.14 : 0.12);
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

      const tint =
        chosenPalette[Math.floor(colorRng() * chosenPalette.length)];
      tiles.push({
        kind: "shape",
        shape: activeShape,
        tint,
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
  applySingleTilePreset: () => void;
  applyNebulaPreset: () => void;
  applyMinimalGridPreset: () => void;
  reset: () => void;
  destroy: () => void;
}

export const createSpriteController = (
  container: HTMLElement,
  options: SpriteControllerOptions = {},
): SpriteController => {
  let state: GeneratorState = {
    ...DEFAULT_STATE,
    seed: generateSeedString(),
    previousBlendMode: DEFAULT_STATE.blendMode,
  };
  let prepared = computeSprite(state);
  let p5Instance: p5 | null = null;

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
    options.onStateChange?.({ ...state });
  };

  const updateSprite = () => {
    prepared = computeSprite(state);
    notifyState();
  };

  const updateSeed = (seed?: string) => {
    state.seed = seed ?? generateSeedString();
  };

  const sketch = (p: p5) => {
    let canvas: p5.Renderer;
    let animationTime = 0;
    let scaledAnimationTime = 0; // Scaled time that accumulates smoothly
    let currentSpeedFactor = 1.0; // Current speed factor (smoothly interpolated)
    let targetSpeedFactor = 1.0; // Target speed factor from slider

    p.setup = () => {
      const size = container.clientWidth || 640;
      canvas = p.createCanvas(size, size);
      canvas.parent(container);
      p.pixelDensity(1);
      p.noStroke();
      p.noSmooth();
      p.imageMode(p.CENTER);

    };

    const resizeCanvas = () => {
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
        // Normal mode: use container width
        size = container.clientWidth || 640;
      }
      
      p.resizeCanvas(size, size);
      // Force immediate redraw after resize
      p.redraw();
    };

    p.windowResized = resizeCanvas;
    
    // Also resize on fullscreen changes
    const handleFullscreenChange = () => {
      // Use a longer delay to ensure browser has updated dimensions
      setTimeout(() => {
        resizeCanvas();
        // Force a redraw
        if (p5Instance) {
          p5Instance.redraw();
        }
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
      const motionScale = clamp(state.motionIntensity / 100, 0, 1.5);
      const deltaMs = typeof p.deltaTime === "number" ? p.deltaTime : 16.666;
      const MOTION_SPEED_MAX_INTERNAL = 12.5;
      // Apply mode-specific speed multiplier to normalize perceived speed across modes
      // Higher multiplier = slower animation (divide to slow down)
      const modeSpeedMultiplier = MOVEMENT_SPEED_MULTIPLIERS[state.movementMode] ?? 1.0;
      const baseSpeedFactor = Math.max(state.motionSpeed / MOTION_SPEED_MAX_INTERNAL, 0);
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
      p.background(prepared.background);
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = false;

      const blendMap: Record<BlendModeKey, p5.BLEND_MODE> = {
        NONE: p.BLEND,
        MULTIPLY: p.MULTIPLY,
        SCREEN: p.SCREEN,
        HARD_LIGHT: p.HARD_LIGHT ?? p.OVERLAY,
        OVERLAY: p.OVERLAY,
      };

      prepared.layers.forEach((layer, layerIndex) => {
        if (layer.tiles.length === 0) {
          return;
        }
        const baseLayerSize = drawSize * layer.baseSizeRatio;

        p.push();
        layer.tiles.forEach((tile, tileIndex) => {
          // Use state.blendMode when blendModeAuto is false, otherwise use stored tile/layer blend mode
          const tileBlendMode = state.blendModeAuto
            ? (tile.blendMode ?? layer.blendMode)
            : state.blendMode;
          p.blendMode(blendMap[tileBlendMode] ?? p.BLEND);
          const normalizedU = ((tile.u % 1) + 1) % 1;
          const normalizedV = ((tile.v % 1) + 1) % 1;
          const baseX = offsetX + normalizedU * drawSize;
          const baseY = offsetY + normalizedV * drawSize;

          if (tile.kind === "shape") {
            const baseShapeSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            const movement = computeMovementOffsets(state.movementMode, {
              time: scaledAnimationTime, // Use smoothly accumulating scaled time
              phase: tileIndex * 7,
              motionScale,
              layerIndex,
              baseUnit: baseShapeSize,
              layerTileSize: baseLayerSize,
              speedFactor: 1.0, // Speed is already applied to scaledAnimationTime
            });
            const shapeSize = baseShapeSize * movement.scaleMultiplier;
            const fillColor = p.color(tile.tint);
            // Use state.layerOpacity directly instead of stored layer.opacity for dynamic updates
            const opacityValue = clamp(state.layerOpacity / 100, 0.12, 1);
            fillColor.setAlpha(Math.round(opacityValue * 255));

            p.push();
            const halfSize = shapeSize / 2;
            const allowableOverflow = Math.max(drawSize * 0.35, shapeSize * 0.8);
            const clampedX = clamp(
              baseX + movement.offsetX,
              offsetX + halfSize - allowableOverflow,
              offsetX + drawSize - halfSize + allowableOverflow,
            );
            const clampedY = clamp(
              baseY + movement.offsetY,
              offsetY + halfSize - allowableOverflow,
              offsetY + drawSize - halfSize + allowableOverflow,
            );
            p.translate(clampedX, clampedY);
            const rotationTime = scaledAnimationTime; // Use smoothly accumulating scaled time
            // Recalculate rotation speed dynamically from state (no regeneration needed)
            const rotationSpeedBase = clamp(state.rotationSpeed, 0, 100) / 100;
            const rotationSpeed = state.rotationAnimated && rotationSpeedBase > 0
              ? rotationSpeedBase * ROTATION_SPEED_MAX * tile.rotationSpeedMultiplier
              : 0;
            // Recalculate rotation base dynamically from state (no regeneration needed)
            const rotationRange = degToRad(clamp(state.rotationAmount, 0, MAX_ROTATION_DEGREES));
            const rotationBase = rotationRange * tile.rotationBaseMultiplier;
            const rotationAngle =
              (state.rotationEnabled ? rotationBase : 0) +
              rotationSpeed * tile.rotationDirection * rotationTime;
            if (rotationAngle !== 0) {
              p.rotate(rotationAngle);
            }
            p.noStroke();
            p.fill(fillColor);

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
                p.stroke(fillColor);
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
              case "capsule": {
                const capsuleWidth = shapeSize * 1.05;
                const capsuleHeight = shapeSize * 0.5;
                p.rectMode(p.CENTER);
                p.rect(0, 0, capsuleWidth, capsuleHeight, capsuleHeight * 0.5);
                break;
              }
              case "ellipse": {
                p.ellipse(0, 0, shapeSize, shapeSize * 0.65);
                break;
              }
              default:
                p.circle(0, 0, shapeSize);
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
    state = { ...state, ...partial };
    if (recompute) {
      updateSprite();
    } else {
      notifyState();
    }
  };

  const controller: SpriteController = {
    getState: () => ({ ...state }),
    applyState: (newState: GeneratorState) => {
      state = { ...newState };
      updateSprite();
    },
    randomizeAll: () => {
      updateSeed();
      const nextMode =
        spriteModePool[Math.floor(Math.random() * spriteModePool.length)];
      state.spriteMode = nextMode;
      state.paletteId = getRandomPalette().id;
      state.scalePercent = randomInt(220, 960);
      state.scaleBase = randomInt(52, 88);
      state.scaleSpread = randomInt(42, 96);
      state.paletteVariance = randomInt(32, 128);
      state.hueShift = 0;
      state.motionIntensity = randomInt(42, 98);
      state.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      state.backgroundMode = "palette";
      const rotationActive = Math.random() > 0.35;
      state.rotationEnabled = rotationActive;
      state.rotationAmount = rotationActive
        ? randomInt(28, 145)
        : randomInt(0, 35);
      state.rotationSpeed = rotationActive ? randomInt(18, 72) : 0;
      state.rotationAnimated = rotationActive;
      updateSprite();
    },
    randomizeColors: () => {
      updateSeed();
      state.paletteId = getRandomPalette().id;
      state.paletteVariance = randomInt(32, 126);
      updateSprite();
    },
    randomizeScale: () => {
      state.scaleBase = randomInt(50, 88);
      updateSprite();
    },
    randomizeScaleRange: () => {
      state.scaleSpread = randomInt(42, 96);
      updateSprite();
    },
    randomizeMotion: () => {
      state.motionIntensity = randomInt(40, 98);
      state.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      state.motionSpeed = randomInt(5, 12);
      const rotationActive = Math.random() > 0.45;
      state.rotationEnabled = rotationActive;
      state.rotationAmount = rotationActive
        ? randomInt(24, 140)
        : Math.min(state.rotationAmount, 20);
      state.rotationSpeed = rotationActive ? randomInt(15, 68) : 0;
      state.rotationAnimated = rotationActive;
      updateSprite();
    },
    randomizeBlendMode: () => {
      if (state.blendModeAuto) {
        reassignAutoBlendModes();
        notifyState();
        return;
      }
      const nextBlend = randomBlendMode();
      state.blendMode = nextBlend;
      state.previousBlendMode = nextBlend;
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
      if (value === state.blendModeAuto) {
        return;
      }

      if (value) {
        state.blendModeAuto = true;
        notifyState();
        return;
      }

      const fallback = state.previousBlendMode ?? state.blendMode ?? "NONE";
      state.previousBlendMode = fallback;
      state.blendModeAuto = false;
      state.blendMode = fallback;
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
      if (!movementModes.includes(mode)) {
        return;
      }
      applyState({ movementMode: mode }, { recompute: false });
    },
    setRotationEnabled: (value: boolean) => {
      // Don't recompute sprites - rotation offsets are already calculated
      // Just update state so rendering can toggle them on/off
      state.rotationEnabled = value;
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
      state.rotationAnimated = value;
      notifyState();
    },
    usePalette: (paletteId: PaletteId) => {
      if (getPalette(paletteId)) {
        applyState({ paletteId });
      }
    },
    setBackgroundMode: (mode: BackgroundMode) => {
      if (!(mode in backgroundPresets)) {
        return;
      }
      applyState({ backgroundMode: mode });
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
        movementMode: "orbit",
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
      state = {
        ...DEFAULT_STATE,
        seed: generateSeedString(),
        previousBlendMode: DEFAULT_STATE.blendMode,
      };
      updateSprite();
    },
    destroy: () => {
      p5Instance?.remove();
      p5Instance = null;
    },
  };

  notifyState();

  return controller;
};
