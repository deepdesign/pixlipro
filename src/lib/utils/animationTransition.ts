/**
 * Animation Transition Utilities
 * 
 * Handles smooth transitions between GeneratorState configurations
 * for preset sequences and manual preset loading.
 */

import type { GeneratorState } from "@/generator";
import { getPalette } from "@/data/palettes";

/**
 * Linear interpolation helper
 */
const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Clamp value between min and max
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

/**
 * Easing function for smooth transitions (ease-in-out)
 */
const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

/**
 * Convert hex to HSL (hue, saturation, lightness)
 */
function hexToHsl(hex: string): [number, number, number] {
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
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
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
  
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  
  const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, h / 360) * 255);
  const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Interpolate between two colors using HSL (smoother than RGB)
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const [h1, s1, l1] = hexToHsl(color1);
  const [h2, s2, l2] = hexToHsl(color2);
  
  // Handle hue wrapping (shortest path around color wheel)
  let hueDiff = h2 - h1;
  if (hueDiff > 180) hueDiff -= 360;
  if (hueDiff < -180) hueDiff += 360;
  
  const h = h1 + hueDiff * t;
  const s = lerp(s1, s2, t);
  const l = lerp(l1, l2, t);
  
  return hslToHex(h, s, l);
}

/**
 * Interpolate between two palettes by interpolating each color
 */
function interpolatePalettes(
  paletteId1: string,
  paletteId2: string,
  t: number
): { id: string; colors: string[] } {
  const palette1 = getPalette(paletteId1);
  const palette2 = getPalette(paletteId2);
  
  const colors1 = palette1.colors;
  const colors2 = palette2.colors;
  const maxLength = Math.max(colors1.length, colors2.length);
  
  const interpolatedColors: string[] = [];
  for (let i = 0; i < maxLength; i++) {
    const color1 = colors1[i % colors1.length];
    const color2 = colors2[i % colors2.length];
    interpolatedColors.push(interpolateColor(color1, color2, t));
  }
  
  // Use the "from" palette ID during transition
  return {
    id: t < 0.5 ? paletteId1 : paletteId2,
    colors: interpolatedColors,
  };
}

/**
 * Interpolate two GeneratorState objects
 * 
 * @param fromState - Starting state
 * @param toState - Target state
 * @param t - Interpolation factor (0-1), optionally eased
 * @param options - Options for interpolation behavior
 * @returns Interpolated state
 */
export function interpolateGeneratorState(
  fromState: GeneratorState,
  toState: GeneratorState,
  t: number,
  options: {
    ease?: boolean;
    interpolatePalettes?: boolean;
    interpolateDiscreteValues?: boolean;
  } = {}
): GeneratorState {
  const {
    ease = true,
    interpolatePalettes: shouldInterpolatePalettes = true,
    interpolateDiscreteValues = false,
  } = options;

  // Apply easing if requested
  const easedT = ease ? easeInOut(t) : t;
  const clampedT = clamp(easedT, 0, 1);

  // Interpolate numeric values
  const interpolated: Partial<GeneratorState> = {
    seed: clampedT < 0.5 ? fromState.seed : toState.seed, // Keep seed stable during transition
    paletteVariance: lerp(fromState.paletteVariance, toState.paletteVariance, clampedT),
    hueShift: lerp(fromState.hueShift, toState.hueShift, clampedT),
    scalePercent: lerp(fromState.scalePercent, toState.scalePercent, clampedT),
    scaleBase: lerp(fromState.scaleBase, toState.scaleBase, clampedT),
    scaleSpread: lerp(fromState.scaleSpread, toState.scaleSpread, clampedT),
    motionIntensity: lerp(fromState.motionIntensity, toState.motionIntensity, clampedT),
    motionSpeed: lerp(fromState.motionSpeed, toState.motionSpeed, clampedT),
    layerOpacity: lerp(fromState.layerOpacity, toState.layerOpacity, clampedT),
    backgroundHueShift: lerp(fromState.backgroundHueShift, toState.backgroundHueShift, clampedT),
    backgroundBrightness: lerp(fromState.backgroundBrightness, toState.backgroundBrightness, clampedT),
    rotationAmount: lerp(fromState.rotationAmount, toState.rotationAmount, clampedT),
    rotationSpeed: lerp(fromState.rotationSpeed, toState.rotationSpeed, clampedT),
    depthOfFieldFocus: lerp(fromState.depthOfFieldFocus, toState.depthOfFieldFocus, clampedT),
    depthOfFieldStrength: lerp(fromState.depthOfFieldStrength, toState.depthOfFieldStrength, clampedT),
    hueRotationSpeed: lerp(fromState.hueRotationSpeed, toState.hueRotationSpeed, clampedT),
    paletteCycleSpeed: lerp(fromState.paletteCycleSpeed, toState.paletteCycleSpeed, clampedT),
    canvasHueRotationSpeed: lerp(fromState.canvasHueRotationSpeed, toState.canvasHueRotationSpeed, clampedT),
    spriteGradientDirection: lerp(fromState.spriteGradientDirection, toState.spriteGradientDirection, clampedT),
    canvasGradientDirection: lerp(fromState.canvasGradientDirection, toState.canvasGradientDirection, clampedT),
  };

  // Handle palette interpolation
  if (shouldInterpolatePalettes && fromState.paletteId !== toState.paletteId) {
    const interpolatedPalette = interpolatePalettes(
      fromState.paletteId,
      toState.paletteId,
      clampedT
    );
    interpolated.paletteId = interpolatedPalette.id;
    // Store interpolated colors for use in computeSprite
    (interpolated as any).__interpolatedPalette = interpolatedPalette;
  } else {
    interpolated.paletteId = clampedT < 0.5 ? fromState.paletteId : toState.paletteId;
  }

  // Handle discrete values (modes, booleans)
  if (interpolateDiscreteValues) {
    // For discrete values, switch at midpoint
    interpolated.spriteMode = clampedT < 0.5 ? fromState.spriteMode : toState.spriteMode;
    interpolated.movementMode = clampedT < 0.5 ? fromState.movementMode : toState.movementMode;
    interpolated.backgroundMode = clampedT < 0.5 ? fromState.backgroundMode : toState.backgroundMode;
    interpolated.blendMode = clampedT < 0.5 ? fromState.blendMode : toState.blendMode;
    interpolated.spriteFillMode = clampedT < 0.5 ? fromState.spriteFillMode : toState.spriteFillMode;
    interpolated.canvasFillMode = clampedT < 0.5 ? fromState.canvasFillMode : toState.canvasFillMode;
    interpolated.rotationEnabled = clampedT < 0.5 ? fromState.rotationEnabled : toState.rotationEnabled;
    interpolated.rotationAnimated = clampedT < 0.5 ? fromState.rotationAnimated : toState.rotationAnimated;
    interpolated.blendModeAuto = clampedT < 0.5 ? fromState.blendModeAuto : toState.blendModeAuto;
    interpolated.randomSprites = clampedT < 0.5 ? fromState.randomSprites : toState.randomSprites;
    interpolated.depthOfFieldEnabled = clampedT < 0.5 ? fromState.depthOfFieldEnabled : toState.depthOfFieldEnabled;
    interpolated.hueRotationEnabled = clampedT < 0.5 ? fromState.hueRotationEnabled : toState.hueRotationEnabled;
    interpolated.paletteCycleEnabled = clampedT < 0.5 ? fromState.paletteCycleEnabled : toState.paletteCycleEnabled;
    interpolated.canvasHueRotationEnabled = clampedT < 0.5 ? fromState.canvasHueRotationEnabled : toState.canvasHueRotationEnabled;
    interpolated.spriteGradientRandom = clampedT < 0.5 ? fromState.spriteGradientRandom : toState.spriteGradientRandom;
    interpolated.spriteGradientDirectionRandom = clampedT < 0.5 ? fromState.spriteGradientDirectionRandom : toState.spriteGradientDirectionRandom;
  } else {
    // For instant discrete value changes, switch immediately
    interpolated.spriteMode = toState.spriteMode;
    interpolated.movementMode = toState.movementMode;
    interpolated.backgroundMode = toState.backgroundMode;
    interpolated.blendMode = toState.blendMode;
    interpolated.spriteFillMode = toState.spriteFillMode;
    interpolated.canvasFillMode = toState.canvasFillMode;
    interpolated.rotationEnabled = toState.rotationEnabled;
    interpolated.rotationAnimated = toState.rotationAnimated;
    interpolated.blendModeAuto = toState.blendModeAuto;
    interpolated.randomSprites = toState.randomSprites;
    interpolated.depthOfFieldEnabled = toState.depthOfFieldEnabled;
    interpolated.hueRotationEnabled = toState.hueRotationEnabled;
    interpolated.paletteCycleEnabled = toState.paletteCycleEnabled;
    interpolated.canvasHueRotationEnabled = toState.canvasHueRotationEnabled;
    interpolated.spriteGradientRandom = toState.spriteGradientRandom;
    interpolated.spriteGradientDirectionRandom = toState.spriteGradientDirectionRandom;
  }

  // Copy other values that don't need interpolation
  interpolated.previousBlendMode = toState.previousBlendMode;
  interpolated.spriteCollectionId = toState.spriteCollectionId;
  interpolated.spriteGradientId = toState.spriteGradientId;
  interpolated.canvasGradientMode = toState.canvasGradientMode;
  interpolated.aspectRatio = toState.aspectRatio;
  interpolated.customAspectRatio = toState.customAspectRatio;

  // Merge with fromState to ensure all properties are present
  return {
    ...fromState,
    ...interpolated,
  } as GeneratorState;
}

/**
 * Calculate transition progress based on elapsed time
 */
export function calculateTransitionProgress(
  elapsedMs: number,
  durationMs: number
): number {
  return clamp(elapsedMs / durationMs, 0, 1);
}

