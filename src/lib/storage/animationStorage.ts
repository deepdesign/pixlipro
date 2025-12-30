/**
 * Animation Storage Utilities
 * 
 * Handles persistence of custom animations in localStorage.
 * Follows the same pattern as customPaletteStorage.ts and sequenceStorage.ts
 */

import type { CustomAnimation, Animation, DefaultAnimation } from "@/types/animations";
import { DEFAULT_ANIMATIONS } from "@/constants/animations";
import { movementModeToCodeFunctions } from "@/lib/utils/movementModeToAnimation";

const STORAGE_KEY = "pixli-custom-animations";
const MAX_CUSTOM_ANIMATIONS = 50;

// Temporary in-memory store for preview animations (not persisted)
const previewAnimations = new Map<string, CustomAnimation>();

/**
 * Get all custom animations from storage
 */
export function getAllCustomAnimations(): CustomAnimation[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as CustomAnimation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Failed to parse custom animations from localStorage.");
    return [];
  }
}

/**
 * Save a custom animation
 */
export function saveCustomAnimation(animation: Omit<CustomAnimation, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>): CustomAnimation {
  const customAnimations = getAllCustomAnimations();

  if (customAnimations.length >= MAX_CUSTOM_ANIMATIONS) {
    throw new Error(`Maximum of ${MAX_CUSTOM_ANIMATIONS} custom animations allowed.`);
  }

  const now = Date.now();
  const newAnimation: CustomAnimation = {
    ...animation,
    id: `custom-${now}-${Math.random().toString(36).substring(2, 9)}`,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  customAnimations.push(newAnimation);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customAnimations));
  return newAnimation;
}

/**
 * Update a custom animation
 */
export function updateCustomAnimation(updatedAnimation: CustomAnimation): void {
  let customAnimations = getAllCustomAnimations();
  const index = customAnimations.findIndex(anim => anim.id === updatedAnimation.id);

  if (index !== -1) {
    customAnimations[index] = { ...updatedAnimation, updatedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customAnimations));
  } else {
    throw new Error(`Animation with ID ${updatedAnimation.id} not found.`);
  }
}

/**
 * Delete a custom animation
 */
export function deleteCustomAnimation(animationId: string): boolean {
  let customAnimations = getAllCustomAnimations();
  const initialLength = customAnimations.length;
  customAnimations = customAnimations.filter(anim => anim.id !== animationId);

  if (customAnimations.length < initialLength) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customAnimations));
    return true;
  }
  return false;
}

/**
 * Get animation by ID (default or custom)
 */
export function getAnimationById(id: string): Animation | undefined {
  // Check preview animations first (temporary in-memory animations)
  const preview = previewAnimations.get(id);
  if (preview) return preview;
  
  // Then check custom animations in storage
  const custom = getAllCustomAnimations().find(anim => anim.id === id);
  if (custom) return custom;
  
  // Finally check default animations
  return DEFAULT_ANIMATIONS.find(anim => anim.id === id);
}

/**
 * Register a temporary preview animation (for editor previews)
 */
export function registerPreviewAnimation(animation: CustomAnimation): void {
  previewAnimations.set(animation.id, animation);
}

/**
 * Unregister a preview animation
 */
export function unregisterPreviewAnimation(id: string): void {
  previewAnimations.delete(id);
}

/**
 * Get all animations (default and custom)
 */
export function getAllAnimations(): Animation[] {
  return [...DEFAULT_ANIMATIONS, ...getAllCustomAnimations()];
}

/**
 * Duplicate an animation (default or custom) and save as new custom animation
 */
export function duplicateAnimation(animation: Animation, newName?: string): CustomAnimation {
  const baseName = newName?.trim() || `${animation.name} custom`;

  // Create animation data without id, createdAt, updatedAt, isDefault (saveCustomAnimation will add these)
  let animationData: Omit<CustomAnimation, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>;

  if (animation.isDefault) {
    // Convert default animation to custom animation with code functions
    const defaultAnim = animation as DefaultAnimation;
    const codeFunctions = movementModeToCodeFunctions(defaultAnim.movementMode);
    
    animationData = {
      name: baseName,
      description: `Custom version of ${animation.name}`,
      codeFunctions,
      expressionMode: "javascript",
      duration: 2.0,
      loop: true,
      author: "User",
      tags: undefined,
    };
  } else {
    // Duplicate existing custom animation
    const customAnim = animation as CustomAnimation;
    animationData = {
      name: baseName,
      description: customAnim.description,
      codeFunctions: { ...customAnim.codeFunctions },
      expressionMode: customAnim.expressionMode,
      duration: customAnim.duration,
      loop: customAnim.loop,
      author: customAnim.author,
      tags: customAnim.tags,
    };
  }

  return saveCustomAnimation(animationData);
}

/**
 * Export animation as JSON
 */
export function exportAnimationAsJSON(animation: Animation): void {
  const filename = `${animation.name.replace(/\s/g, "-").toLowerCase()}.json`;
  const data = JSON.stringify(animation, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import animation from JSON
 */
export function importAnimationFromJSON(jsonString: string): CustomAnimation {
  const parsed = JSON.parse(jsonString);
  // Basic validation - check for codeFunctions instead of path
  if (!parsed || typeof parsed.name !== "string" || !parsed.codeFunctions) {
    throw new Error("Invalid animation JSON structure. Expected codeFunctions field.");
  }

  // Ensure it's treated as a new custom animation
  const now = Date.now();
  const importedAnimation: CustomAnimation = {
    ...parsed,
    id: `custom-${now}-${Math.random().toString(36).substring(2, 9)}`,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  return saveCustomAnimation(importedAnimation);
}

