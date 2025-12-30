/**
 * Animation Type Definitions
 * 
 * Type definitions for custom animation system.
 */

import type { MovementMode } from "@/types/generator";

/**
 * Easing function types for animations
 */
export type EasingFunction = 
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "bezier"; // Custom bezier curve

/**
 * Path point with optional bezier control points
 */
export interface PathPoint {
  x: number;
  y: number;
  controlPoint1?: { x: number; y: number }; // For bezier curves
  controlPoint2?: { x: number; y: number }; // For bezier curves
  time: number; // Normalized 0-1
}

/**
 * Animation path definition
 */
export interface AnimationPath {
  type: "linear" | "bezier" | "spline" | "custom";
  points: PathPoint[];
  closed: boolean;
}

/**
 * Keyframe for animation properties
 */
export interface AnimationKeyframe {
  id: string;
  time: number; // Normalized 0-1
  properties: {
    rotation?: number;
    scale?: number;
    opacity?: number;
    // Additional animatable properties can be added here
  };
  easing?: EasingFunction;
}

/**
 * Custom animation definition (code-based)
 */
export interface CustomAnimation {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
  
  // Code functions (required)
  codeFunctions: {
    path: string;      // JavaScript function string
    scale?: string;     // Optional
  };
  expressionMode: "math" | "javascript";
  
  // Simple properties
  duration: number; // seconds
  loop: boolean;
  
  // Metadata
  author?: string;
  tags?: string[];
  thumbnail?: string;
}

/**
 * Default animation (references existing MovementMode)
 */
export interface DefaultAnimation {
  id: string;
  name: string;
  description: string;
  movementMode: MovementMode;
  thumbnail?: string;
  isDefault: true;
}

/**
 * Union type for all animations
 */
export type Animation = CustomAnimation | DefaultAnimation;

/**
 * Animation preview settings
 */
export interface AnimationPreviewSettings {
  density: number;
  scale: number;
  range: number;
  paletteId: string;
  spriteShape: string;
}

