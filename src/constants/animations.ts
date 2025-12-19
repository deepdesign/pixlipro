/**
 * Default Animation Definitions
 * 
 * Defines all default animations that map to existing MovementMode values.
 * These animations are read-only but can be duplicated and customized.
 */

import type { DefaultAnimation } from "@/types/animations";
import type { MovementMode } from "@/types/generator";

/**
 * Default animations with descriptions
 */
export const DEFAULT_ANIMATIONS: DefaultAnimation[] = [
  {
    id: "default-pulse",
    name: "Pulse",
    description: "Pulsing in and out motion",
    movementMode: "pulse",
    isDefault: true,
  },
  {
    id: "default-pulse-meander",
    name: "Pulse Meander",
    description: "Pulsing with meandering movement",
    movementMode: "pulse-meander",
    isDefault: true,
  },
  {
    id: "default-drift",
    name: "Drift",
    description: "Gentle floating motion",
    movementMode: "drift",
    isDefault: true,
  },
  {
    id: "default-ripple",
    name: "Ripple",
    description: "Wave-like motion propagation",
    movementMode: "ripple",
    isDefault: true,
  },
  {
    id: "default-zigzag",
    name: "Zigzag",
    description: "Angular back-and-forth motion",
    movementMode: "zigzag",
    isDefault: true,
  },
  {
    id: "default-cascade",
    name: "Cascade",
    description: "Flowing downward motion",
    movementMode: "cascade",
    isDefault: true,
  },
  {
    id: "default-spiral",
    name: "Spiral Orbit",
    description: "Circular spiral motion",
    movementMode: "spiral",
    isDefault: true,
  },
  {
    id: "default-comet",
    name: "Comet Trail",
    description: "Trailing motion effect",
    movementMode: "comet",
    isDefault: true,
  },
  {
    id: "default-linear",
    name: "Linear",
    description: "Straight-line motion",
    movementMode: "linear",
    isDefault: true,
  },
  {
    id: "default-isometric",
    name: "Isometric",
    description: "Hexagonal grid motion pattern",
    movementMode: "isometric",
    isDefault: true,
  },
  {
    id: "default-triangular",
    name: "Triangular",
    description: "Triangular edge movement pattern",
    movementMode: "triangular",
    isDefault: true,
  },
  {
    id: "default-parallax",
    name: "Parallax",
    description: "Left-to-right parallax movement with depth-based speed",
    movementMode: "parallax",
    isDefault: true,
  },
];

/**
 * Get a default animation by ID
 */
export function getDefaultAnimation(id: string): DefaultAnimation | undefined {
  return DEFAULT_ANIMATIONS.find(anim => anim.id === id);
}

/**
 * Get a default animation by movement mode
 */
export function getDefaultAnimationByMode(mode: MovementMode): DefaultAnimation | undefined {
  return DEFAULT_ANIMATIONS.find(anim => anim.movementMode === mode);
}

/**
 * Get all default animations
 */
export function getAllDefaultAnimations(): DefaultAnimation[] {
  return [...DEFAULT_ANIMATIONS];
}

