/**
 * Movement Mode to Animation Conversion
 * 
 * Converts existing MovementMode values to code functions for custom animations.
 * This allows default animations to be duplicated and edited as code.
 */

import type { MovementMode } from "@/types/generator";

/**
 * Convert a movement mode to code functions
 */
export function movementModeToCodeFunctions(mode: MovementMode): {
  path: string;
  scale?: string;
  opacity?: string;
} {
  switch (mode) {
    case "pulse":
      return {
        path: "function path(t, phase) { return { x: 0, y: 0 }; }",
        scale: "function scale(t) { return 1 + Math.sin(t * Math.PI * 2) * 0.55; }",
      };
    
    case "pulse-meander":
      return {
        path: `function path(t, phase) {
          const meanderX = Math.sin(t * Math.PI * 2 * 0.5 + phase * 2) * 0.3;
          const meanderY = Math.cos(t * Math.PI * 2 * 0.4 + phase * 1.5) * 0.25;
          return { x: meanderX, y: meanderY };
        }`,
        scale: "function scale(t) { return 1 + Math.sin(t * Math.PI * 2) * 0.55; }",
      };
    
    case "drift":
      return {
        path: `function path(t, phase) {
          const driftX = Math.sin(t * Math.PI * 2 * 0.5 + phase * 0.15) * 0.45;
          const driftY = Math.cos(t * Math.PI * 2 * 0.4 + phase * 0.12) * 0.5;
          return { x: driftX, y: driftY };
        }`,
        scale: "function scale(t) { return 1 + Math.sin(t * Math.PI * 2 * 0.25) * 0.16; }",
      };
    
    case "ripple":
      return {
        path: `function path(t, phase) {
          const radius = phase * 0.6;
          const angle = t * Math.PI * 2 * 2 + phase * Math.PI * 2;
          const ripple = Math.sin(angle * 3) * 0.2;
          const x = Math.cos(angle) * (radius + ripple);
          const y = Math.sin(angle) * (radius + ripple);
          return { x, y };
        }`,
      };
    
    case "zigzag":
      return {
        path: `function path(t, phase) {
          const zigzag = Math.sin(t * Math.PI * 2 * 2) * 0.5;
          const zag = Math.cos(t * Math.PI * 2 * 1.5 + phase) * 0.3;
          return { x: zigzag, y: zag };
        }`,
      };
    
    case "cascade":
      return {
        path: `function path(t, phase) {
          const cascadeY = (t - 0.5) * 0.8;
          const driftX = Math.sin(t * Math.PI * 2 * 0.3 + phase) * 0.2;
          return { x: driftX, y: cascadeY };
        }`,
      };
    
    case "spiral":
      return {
        path: `function path(t, phase) {
          const angle = t * Math.PI * 2 * 4 + phase * Math.PI * 2;
          const radius = t * 0.5;
          return {
            x: Math.sin(angle) * radius,
            y: Math.cos(angle) * radius
          };
        }`,
      };
    
    case "comet":
      return {
        path: `function path(t, phase) {
          const cometX = (t - 0.5) * 0.8;
          const trailY = Math.sin(t * Math.PI * 2 * 3 + phase) * 0.15;
          return { x: cometX, y: trailY };
        }`,
      };
    
    case "linear":
      return {
        path: `function path(t, phase) {
          const direction = Math.floor((phase * 0.25) % 4);
          const angle = (direction * 90 * Math.PI) / 180;
          const oscillation = Math.sin(t * Math.PI * 2 + phase * 0.1) * 0.7;
          return {
            x: Math.cos(angle) * oscillation,
            y: Math.sin(angle) * oscillation
          };
        }`,
      };
    
    case "isometric":
      return {
        path: `function path(t, phase) {
          const hexAngle = (Math.floor(phase * 6) % 6) * (Math.PI / 3);
          const distance = Math.sin(t * Math.PI * 2) * 0.4;
          return {
            x: Math.cos(hexAngle) * distance,
            y: Math.sin(hexAngle) * distance
          };
        }`,
      };
    
    case "triangular":
      return {
        path: `function path(t, phase) {
          const triAngle = (Math.floor(phase * 3) % 3) * (Math.PI * 2 / 3);
          const distance = Math.sin(t * Math.PI * 2) * 0.4;
          return {
            x: Math.cos(triAngle) * distance,
            y: Math.sin(triAngle) * distance
          };
        }`,
      };
    
    case "parallax":
      // Parallax is handled differently in the generator (angle-based movement)
      // This is a simplified version for code-based editing
      return {
        path: `function path(t, phase) {
          // Simplified parallax: horizontal movement
          return { x: (t - 0.5) * 0.8, y: 0 };
        }`,
      };
    
    default:
      // Default to drift
      return {
        path: `function path(t, phase) {
          const driftX = Math.sin(t * Math.PI * 2 * 0.5 + phase * 0.15) * 0.45;
          const driftY = Math.cos(t * Math.PI * 2 * 0.4 + phase * 0.12) * 0.5;
          return { x: driftX, y: driftY };
        }`,
      };
  }
}

