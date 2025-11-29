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
  svgPath?: string; // Path to SVG file in public/sprites/default
}> = [
  {
    value: "rounded",
    label: "Rounded",
    description: "Soft-edged tiles that stack into cosy mosaics",
    svgPath: "/sprites/default/rounded.svg",
  },
  {
    value: "circle",
    label: "Circle",
    description: "Looping orbs with smooth silhouettes",
    svgPath: "/sprites/default/circle.svg",
  },
  {
    value: "square",
    label: "Square",
    description: "Classic, chunky voxels ideal for bold patterns",
    svgPath: "/sprites/default/square.svg",
  },
  {
    value: "triangle",
    label: "Triangle",
    description: "Directional shards with angular energy",
    svgPath: "/sprites/default/triangle.svg",
  },
  {
    value: "hexagon",
    label: "Hexagon",
    description: "Honeycomb tessellations for tight grids",
    svgPath: "/sprites/default/hexagon.svg",
  },
  {
    value: "diamond",
    label: "Diamond",
    description: "Sharp diamonds with dramatic negative space",
    svgPath: "/sprites/default/diamond.svg",
  },
  {
    value: "star",
    label: "Star",
    description: "Bursting motifs that radiate from the centre",
    svgPath: "/sprites/default/star.svg",
  },
  {
    value: "line",
    label: "Line",
    description: "Neon scanlines with motion-friendly poses",
    svgPath: "/sprites/default/line.svg",
  },
  {
    value: "pentagon",
    label: "Pentagon",
    description: "Balanced five-point tiles for structured bursts",
    svgPath: "/sprites/default/pentagon.svg",
  },
  {
    value: "asterisk",
    label: "Asterisk",
    description: "Radiating sparks that pop with rotation",
    svgPath: "/sprites/default/asterisk.svg",
  },
  {
    value: "cross",
    label: "Cross",
    description: "Bold plus signs that anchor grid compositions",
    svgPath: "/sprites/default/plus.svg",
  },
  {
    value: "pixels",
    label: "Pixels",
    description: "3x3 grid of squares with spacing between",
    svgPath: "/sprites/default/grid.svg",
  },
  {
    value: "heart",
    label: "Heart",
    description: "Romantic shapes that add warmth and emotion",
    svgPath: "/sprites/default/heart.svg",
  },
  {
    value: "smiley",
    label: "Smiley",
    description: "Friendly circular faces with expressive features",
    svgPath: "/sprites/default/smiley.svg",
  },
  {
    value: "x",
    label: "X",
    description: "Bold X marks with diagonal crossing lines",
    svgPath: "/sprites/default/cross.svg",
  },
  {
    value: "arrow",
    label: "Arrow",
    description: "Directional arrows pointing upward and right",
    svgPath: "/sprites/default/arrow.svg",
  },
];

