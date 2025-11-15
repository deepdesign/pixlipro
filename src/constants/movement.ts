import type { MovementMode } from "@/types/generator";

/**
 * Movement Mode Definitions
 * 
 * Defines all available movement modes for sprite animation.
 * Each mode represents a different animation path or pattern.
 */
export const MOVEMENT_MODES: Array<{ value: MovementMode; label: string }> = [
  { value: "pulse", label: "Pulse" },
  { value: "drift", label: "Drift" },
  { value: "ripple", label: "Ripple" },
  { value: "zigzag", label: "Zigzag" },
  { value: "cascade", label: "Cascade" },
  { value: "spiral", label: "Spiral Orbit" },
  { value: "comet", label: "Comet Trail" },
  { value: "linear", label: "Linear" },
  { value: "isometric", label: "Isometric" },
];

/**
 * Format a movement mode value into a display label
 */
export function formatMovementMode(mode: MovementMode): string {
  return MOVEMENT_MODES.find((entry) => entry.value === mode)?.label ?? "None";
}

