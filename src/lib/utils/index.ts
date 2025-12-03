/**
 * Utility Functions
 * 
 * Barrel export for utility functions.
 */

export { cn } from "./utils";
export { calculateGradientLine } from "./gradientUtils";
export {
  isMobileDevice,
  isTabletDevice,
  isPhoneDevice,
  isIOSDevice,
  isAndroidDevice,
  isTouchDevice,
  hasCoarsePointer,
} from "./deviceDetection";
export { generateCrtNoise, generateGrain, generateBayerDither, applyNoiseOverlay } from "./fxNoise";
export { applyPixelationEffects, applyPixelation, applyColorQuantization } from "./fxPixelation";
export * from "./responsiveLayout";
export * from "./conversions";
export { formatBlendMode } from "./formatting";
export { generatePaletteOptions } from "./paletteOptions";
export * from "./animations";

