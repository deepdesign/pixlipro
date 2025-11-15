import type { BlendModeOption } from "@/types/generator";

/**
 * Format a blend mode value into a display label
 * 
 * Converts "HARD_LIGHT" -> "Hard Light", "MULTIPLY" -> "Multiply", etc.
 */
export function formatBlendMode(mode: BlendModeOption): string {
  return mode
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

