import type p5 from "p5";

/**
 * Extended p5.js instance with additional properties that aren't in the official types
 * but are available at runtime
 */
export interface P5WithCanvas extends p5 {
  /**
   * The HTML canvas element that p5.js renders to
   * This is available at runtime but not in the official p5.js types
   */
  canvas: HTMLCanvasElement;
  
  /**
   * Custom property for delta time in milliseconds
   * Used for time-based animations
   */
  deltaMs?: number;
}

/**
 * Type guard to check if a p5 instance has a canvas property
 */
export function hasCanvas(p5Instance: p5 | null): p5Instance is P5WithCanvas {
  return p5Instance !== null && 'canvas' in p5Instance;
}

/**
 * Type guard to check if a p5 instance has a redraw method
 */
export function hasRedraw(p5Instance: p5 | null): p5Instance is P5WithCanvas {
  if (p5Instance === null) return false;
  // Check if redraw method exists (p5.js has this but types don't include it)
  return typeof (p5Instance as P5WithCanvas).redraw === 'function';
}

/**
 * Extended HTMLElement with ResizeObserver stored for cleanup
 */
export interface HTMLElementWithResizeObserver extends HTMLElement {
  _resizeObserver?: ResizeObserver;
}

/**
 * Type guard to check if an element has a ResizeObserver stored
 */
export function hasResizeObserver(
  element: HTMLElement | null
): element is HTMLElementWithResizeObserver {
  return element !== null && '_resizeObserver' in element;
}

