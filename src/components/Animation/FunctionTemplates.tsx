/**
 * Function Templates
 * 
 * Pre-made code templates for common animation patterns.
 */

export interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  codeFunctions: {
    path: string;
    scale?: string;
  };
}

export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  {
    id: "circular",
    name: "Circular Motion",
    description: "Moves in a circle",
    codeFunctions: {
      path: `function path(t, phase) {
  return {
    x: Math.sin(t * Math.PI * 2) * 0.5,
    y: Math.cos(t * Math.PI * 2) * 0.5
  };
}`,
    },
  },
  {
    id: "sine-wave",
    name: "Sine Wave",
    description: "Oscillating horizontal motion",
    codeFunctions: {
      path: `function path(t, phase) {
  return {
    x: t - 0.5,
    y: Math.sin(t * Math.PI * 4) * 0.3
  };
}`,
    },
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "Pulsing scale animation",
    codeFunctions: {
      path: `function path(t, phase) {
  return { x: 0, y: 0 };
}`,
      scale: `function scale(t) {
  return 1 + Math.sin(t * Math.PI * 2) * 0.5;
}`,
    },
  },
  {
    id: "spiral",
    name: "Spiral",
    description: "Spiral motion pattern",
    codeFunctions: {
      path: `function path(t, phase) {
  const angle = t * Math.PI * 4 + phase * Math.PI * 2;
  const radius = t * 0.5;
  return {
    x: Math.sin(angle) * radius,
    y: Math.cos(angle) * radius
  };
}`,
    },
  },
  {
    id: "drift",
    name: "Drift",
    description: "Gentle floating motion",
    codeFunctions: {
      path: `function path(t, phase) {
  const driftX = Math.sin(t * Math.PI * 2 * 0.5 + phase * 0.15) * 0.45;
  const driftY = Math.cos(t * Math.PI * 2 * 0.4 + phase * 0.12) * 0.5;
  return { x: driftX, y: driftY };
}`,
    },
  },
  {
    id: "zigzag",
    name: "Zigzag",
    description: "Angular back-and-forth motion",
    codeFunctions: {
      path: `function path(t, phase) {
  const zigzag = Math.sin(t * Math.PI * 2 * 2) * 0.5;
  const zag = Math.cos(t * Math.PI * 2 * 1.5 + phase) * 0.3;
  return { x: zigzag, y: zag };
}`,
    },
  },
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): AnimationTemplate | undefined {
  return ANIMATION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all templates
 */
export function getAllTemplates(): AnimationTemplate[] {
  return [...ANIMATION_TEMPLATES];
}

