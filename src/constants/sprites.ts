/**
 * Sprite Mode Constants
 * 
 * Definitions for all available sprite shapes and their descriptions.
 */

import type { SpriteMode } from "../types/generator";

export const SPRITE_MODES: Array<{
  value: SpriteMode;
  label: string;
  description: string;
}> = [
  {
    value: "rounded",
    label: "Rounded",
    description: "Soft-edged tiles that stack into cosy mosaics",
  },
  {
    value: "circle",
    label: "Circle",
    description: "Looping orbs with smooth silhouettes",
  },
  {
    value: "square",
    label: "Square",
    description: "Classic, chunky voxels ideal for bold patterns",
  },
  {
    value: "triangle",
    label: "Triangle",
    description: "Directional shards with angular energy",
  },
  {
    value: "hexagon",
    label: "Hexagon",
    description: "Honeycomb tessellations for tight grids",
  },
  {
    value: "ring",
    label: "Ring",
    description: "Hollow forms that layer like retro radar pulses",
  },
  {
    value: "diamond",
    label: "Diamond",
    description: "Sharp diamonds with dramatic negative space",
  },
  {
    value: "star",
    label: "Star",
    description: "Bursting motifs that radiate from the centre",
  },
  {
    value: "line",
    label: "Line",
    description: "Neon scanlines with motion-friendly poses",
  },
  {
    value: "pentagon",
    label: "Pentagon",
    description: "Balanced five-point tiles for structured bursts",
  },
  {
    value: "asterisk",
    label: "Asterisk",
    description: "Radiating sparks that pop with rotation",
  },
  {
    value: "cross",
    label: "Cross",
    description: "Bold plus signs that anchor grid compositions",
  },
  {
    value: "pixels",
    label: "Pixels",
    description: "3x3 grid of squares with spacing between",
  },
  {
    value: "heart",
    label: "Heart",
    description: "Romantic shapes that add warmth and emotion",
  },
  {
    value: "smiley",
    label: "Smiley",
    description: "Friendly circular faces with expressive features",
  },
  {
    value: "x",
    label: "X",
    description: "Bold X marks with diagonal crossing lines",
  },
  {
    value: "arrow",
    label: "Arrow",
    description: "Directional arrows pointing upward and right",
  },
];

