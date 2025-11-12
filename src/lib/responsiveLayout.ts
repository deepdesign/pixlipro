/**
 * Responsive Layout Configuration and Utilities
 * 
 * This module manages the responsive layout system for BitLab, including:
 * - Column widths (merged vs split states)
 * - Canvas sizing constraints
 * - Viewport breakpoints
 * - Layout state management
 * 
 * ## Layout States
 * 
 * ### Merged Layout (Narrow Viewport)
 * - Single left column containing all 4 tabs (Sprites, Layers, Motion, FX)
 * - Column width: CONTROL_COLUMN_WIDTH_MERGED (420px)
 * - Canvas scales smoothly between min (750px) and max (960px)
 * 
 * ### Split Layout (Wide Viewport)
 * - Left column: Sprites + Layers tabs (CONTROL_COLUMN_WIDTH_SPLIT = 348px)
 * - Right column: Motion + FX tabs (MOTION_COLUMN_WIDTH = 348px)
 * - Both columns use the same narrower width when split
 * - Canvas stays at maximum size (960px) when columns split
 * 
 * ### Studio Layout (Very Wide Viewport)
 * - Triggered at 1760px viewport width
 * - Fixed canvas size: 960px
 * - Different column arrangement
 * 
 * ## Column Splitting Logic
 * 
 * Columns split when BOTH conditions are met:
 * 1. Viewport width >= BASE_BREAKPOINT (1200px)
 * 2. Viewport width >= minimum width needed for split layout
 * 
 * Minimum width calculation:
 *   controlColumnWidthSplit + motionColumnWidth + displayMaxWidth + gaps + padding
 *   = 348 + 348 + 960 + 48 + 48 = 1752px minimum
 * 
 * This ensures columns only split when there's enough room for:
 * - Both split columns at their narrower width
 * - Canvas at maximum size (960px)
 * - Proper gaps between elements
 * - Container padding
 * 
 * ## Canvas Sizing
 * 
 * The canvas scales smoothly using CSS clamp():
 *   width: min(100%, clamp(750px, 70vw, 960px))
 * 
 * - Minimum: 750px (ensures status bar fits on one row)
 * - Maximum: 960px (optimal canvas size)
 * - Scales proportionally with viewport (70vw) between min/max
 * 
 * ## CSS Variables
 * 
 * - --control-column-width: 420px (merged column width)
 * - --control-column-width-narrow: 348px (split column width)
 * 
 * These are used by CSS to apply the correct widths based on layout state.
 */

/**
 * Column width when all tabs are merged into a single column (narrow viewport)
 * This width accommodates all 4 tabs (Sprites, Layers, Motion, FX) in one row
 */
export const CONTROL_COLUMN_WIDTH_MERGED = 420;

/**
 * Column width when columns are split (wide viewport)
 * Both control and motion columns use this narrower width when split
 * This allows more space for the canvas while keeping columns compact
 */
export const CONTROL_COLUMN_WIDTH_SPLIT = 348;

/**
 * Motion column width (same as split width when columns are split)
 * Kept as separate constant for clarity and potential future customization
 */
export const MOTION_COLUMN_WIDTH = 348;

/**
 * Canvas/canvas-card sizing constraints
 */
export const CANVAS_CONFIG = {
  /** Minimum canvas width - ensures status bar fits on one row */
  MIN_WIDTH: 750,
  /** Maximum canvas width - optimal size for display */
  MAX_WIDTH: 960,
  /** Viewport width percentage for smooth scaling between min/max */
  VIEWPORT_PERCENTAGE: 70,
} as const;

/**
 * Layout breakpoints and spacing
 */
export const LAYOUT_CONFIG = {
  /** Base breakpoint for considering wide layout (px) */
  BASE_BREAKPOINT: 1200,
  /** Studio layout breakpoint - very wide viewport (px) */
  STUDIO_BREAKPOINT: 1760,
  /** Gap between columns (24px = spacing.6 in Tailwind) */
  COLUMN_GAP: 24,
  /** Number of gaps when columns are split (between control, display, and motion) */
  GAPS_COUNT_SPLIT: 2,
  /** Main container padding (spacing.6 = 24px per side = 48px total) */
  MAIN_PADDING: 48,
} as const;

/**
 * Calculate the minimum viewport width needed to split columns
 * 
 * This ensures columns only split when there's enough room for:
 * - Both split columns at their narrower width
 * - Canvas at maximum size
 * - Proper gaps between elements
 * - Container padding
 * 
 * @param appMainPadding - Padding from the main container (default: LAYOUT_CONFIG.MAIN_PADDING)
 * @returns Minimum viewport width in pixels required to split columns
 */
export function calculateMinWidthForSplit(appMainPadding: number = LAYOUT_CONFIG.MAIN_PADDING): number {
  const totalGaps = LAYOUT_CONFIG.COLUMN_GAP * LAYOUT_CONFIG.GAPS_COUNT_SPLIT;
  return (
    CONTROL_COLUMN_WIDTH_SPLIT +
    MOTION_COLUMN_WIDTH +
    CANVAS_CONFIG.MAX_WIDTH +
    totalGaps +
    appMainPadding
  );
}

/**
 * Determine if the viewport is wide enough to split columns
 * 
 * Columns split when BOTH conditions are met:
 * 1. Viewport width >= BASE_BREAKPOINT
 * 2. Viewport width >= minimum width needed for split layout
 * 
 * This ensures the canvas can stay at maximum size when columns split,
 * preventing the "snapping" behavior where columns split before the canvas
 * reaches its maximum size.
 * 
 * @param viewportWidth - Current viewport width in pixels
 * @param appMainPadding - Padding from the main container
 * @returns true if columns should be split, false if they should be merged
 */
export function shouldSplitColumns(
  viewportWidth: number,
  appMainPadding: number = LAYOUT_CONFIG.MAIN_PADDING
): boolean {
  const minWidthNeeded = calculateMinWidthForSplit(appMainPadding);
  const meetsBaseBreakpoint = viewportWidth >= LAYOUT_CONFIG.BASE_BREAKPOINT;
  const hasEnoughSpace = viewportWidth >= minWidthNeeded;
  
  // Both conditions must be met to split columns
  return meetsBaseBreakpoint && hasEnoughSpace;
}

/**
 * Get the current column width based on layout state
 * 
 * @param isWideLayout - Whether columns are currently split
 * @returns Column width in pixels
 */
export function getColumnWidth(isWideLayout: boolean): number {
  return isWideLayout ? CONTROL_COLUMN_WIDTH_SPLIT : CONTROL_COLUMN_WIDTH_MERGED;
}

/**
 * Get padding from the main container element
 * 
 * @param appMainSelector - CSS selector for the main container (default: '.app-main')
 * @returns Total horizontal padding in pixels (left + right)
 */
export function getAppMainPadding(appMainSelector: string = '.app-main'): number {
  if (typeof window === 'undefined') {
    return LAYOUT_CONFIG.MAIN_PADDING;
  }
  
  const appMain = document.querySelector(appMainSelector) as HTMLElement;
  if (!appMain) {
    return LAYOUT_CONFIG.MAIN_PADDING;
  }
  
  const computedStyle = getComputedStyle(appMain);
  const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
  const paddingRight = parseInt(computedStyle.paddingRight) || 0;
  
  return paddingLeft + paddingRight;
}

