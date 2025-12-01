/**
 * Animation Storage Utilities
 * 
 * Handles persistence of custom animations in localStorage.
 * Follows the same pattern as customPaletteStorage.ts and sequenceStorage.ts
 */

import type { CustomAnimation, Animation } from "@/types/animations";
import { DEFAULT_ANIMATIONS } from "@/constants/animations";

const STORAGE_KEY = "pixli-custom-animations";
const MAX_CUSTOM_ANIMATIONS = 50;

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
  const custom = getAllCustomAnimations().find(anim => anim.id === id);
  if (custom) return custom;
  return DEFAULT_ANIMATIONS.find(anim => anim.id === id);
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
  const baseName = newName?.trim() || `${animation.name} (Copy)`;

  // Create animation data without id, createdAt, updatedAt, isDefault (saveCustomAnimation will add these)
  const animationData: Omit<CustomAnimation, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> = {
    name: baseName,
    description: animation.description,
    path: animation.isDefault ? { type: "linear", points: [], closed: false } : animation.path, // Default path for duplicated defaults
    duration: animation.isDefault ? 10 : animation.duration, // Default duration for duplicated defaults
    loop: animation.isDefault ? true : animation.loop, // Default loop for duplicated defaults
    keyframes: animation.isDefault ? [] : animation.keyframes, // No keyframes for duplicated defaults
    author: animation.isDefault ? "User" : animation.author,
    tags: animation.tags,
  };

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
  // Basic validation
  if (!parsed || typeof parsed.name !== "string" || !parsed.path) {
    throw new Error("Invalid animation JSON structure.");
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

