/**
 * Sequence Storage Utilities
 * 
 * Handles persistence of preset sequences (recipes) in localStorage.
 */

import type { Preset } from "./presetStorage";
import type { GeneratorState } from "@/types/generator";

// Legacy interface for backward compatibility
export interface SequenceItem {
  id: string;
  presetId: string;
  duration: number; // seconds, 0 = manual advance
  transition: "instant" | "fade" | "smooth"; // transition type
  order: number; // for drag-drop reordering
}

// New types for enhanced sequence editor
export type FadeType = 'cut' | 'crossfade' | 'fadeToBlack' | 'custom';
export type DurationMode = 'seconds' | 'manual';

export interface SequenceScene {
  id: string;
  sequenceId: string;
  order: number; // Integer index for ordering
  presetId?: string; // For linked preset
  inlinePresetJson?: GeneratorState; // For uploaded/ad-hoc preset (full GeneratorState)
  name: string; // Editable scene name (defaults to preset name)
  durationSeconds?: number; // Only used when durationMode === 'seconds'
  durationMode: DurationMode; // 'seconds' | 'manual'
  fadeTypeOverride?: FadeType; // Override sequence default, undefined = use default
  notes?: string; // Optional notes for live performance
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  backgroundColour: string; // CSS color string (e.g., "#000000" or "rgb(0,0,0)")
  defaultFadeType: FadeType; // Default fade for all scenes
  scenes: SequenceScene[]; // Renamed from 'items' for clarity
  createdAt: number;
  updatedAt: number;
  // Legacy support: keep items for backward compatibility during migration
  items?: SequenceItem[]; // Deprecated, use scenes instead
}

const STORAGE_KEY = "pixli-sequences";
const MAX_SEQUENCES = 50;

/**
 * Migrate old Sequence format (with items) to new format (with scenes)
 */
export function migrateSequenceToNewFormat(oldSequence: Sequence & { items?: SequenceItem[] }): Sequence {
  // If already migrated (has scenes), return as-is
  if (oldSequence.scenes && oldSequence.scenes.length > 0) {
    return {
      ...oldSequence,
      backgroundColour: oldSequence.backgroundColour || "#000000",
      defaultFadeType: oldSequence.defaultFadeType || "cut",
    };
  }

  // Migrate from items to scenes
  const scenes: SequenceScene[] = (oldSequence.items || []).map((item, index) => {
    // Map transition types
    let fadeTypeOverride: FadeType | undefined;
    if (item.transition === "instant") {
      fadeTypeOverride = "cut";
    } else if (item.transition === "fade" || item.transition === "smooth") {
      fadeTypeOverride = "crossfade";
    }

    // Map duration
    const durationMode: DurationMode = item.duration === 0 ? "manual" : "seconds";
    const durationSeconds = durationMode === "seconds" ? item.duration : undefined;

    return {
      id: item.id,
      sequenceId: oldSequence.id,
      order: item.order !== undefined ? item.order : index,
      presetId: item.presetId,
      name: `Scene ${index + 1}`, // Default name, will be updated from preset name if available
      durationMode,
      durationSeconds,
      fadeTypeOverride,
    };
  });

  return {
    id: oldSequence.id,
    name: oldSequence.name,
    description: oldSequence.description,
    backgroundColour: oldSequence.backgroundColour || "#000000",
    defaultFadeType: oldSequence.defaultFadeType || "cut",
    scenes,
    createdAt: oldSequence.createdAt,
    updatedAt: oldSequence.updatedAt,
  };
}

/**
 * Load all sequences from localStorage and migrate old formats
 */
export function getAllSequences(): Sequence[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as (Sequence & { items?: SequenceItem[] })[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Migrate sequences that need migration
    const migratedSequences: Sequence[] = [];
    let needsSave = false;

    for (const seq of parsed) {
      const migrated = migrateSequenceToNewFormat(seq);
      if (migrated.scenes.length > 0 && (!seq.scenes || seq.scenes.length === 0)) {
        needsSave = true;
      }
      migratedSequences.push(migrated);
    }

    // Save migrated sequences back if any were migrated
    if (needsSave) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedSequences));
      } catch (error) {
        console.error("Failed to save migrated sequences:", error);
      }
    }

    return migratedSequences;
  } catch (error) {
    console.error("Failed to load sequences:", error);
    return [];
  }
}

/**
 * Save a sequence
 */
export function saveSequence(sequence: Sequence): boolean {
  try {
    const sequences = getAllSequences();
    const existingIndex = sequences.findIndex((s) => s.id === sequence.id);
    
    if (existingIndex >= 0) {
      sequences[existingIndex] = {
        ...sequence,
        updatedAt: Date.now(),
      };
    } else {
      sequences.push({
        ...sequence,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Limit to MAX_SEQUENCES
    const limited = sequences.slice(-MAX_SEQUENCES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    return true;
  } catch (error) {
    console.error("Failed to save sequence:", error);
    return false;
  }
}

/**
 * Delete a sequence
 */
export function deleteSequence(sequenceId: string): boolean {
  try {
    const sequences = getAllSequences();
    const filtered = sequences.filter((s) => s.id !== sequenceId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete sequence:", error);
    return false;
  }
}

/**
 * Get a sequence by ID
 */
export function getSequence(sequenceId: string): Sequence | null {
  const sequences = getAllSequences();
  return sequences.find((s) => s.id === sequenceId) || null;
}

/**
 * Generate a new sequence ID
 */
export function generateSequenceId(): string {
  return `sequence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a new sequence item ID
 */
export function generateSequenceItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a new sequence scene ID
 */
export function generateSequenceSceneId(): string {
  return `scene-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new sequence with default values
 */
export function createSequence(name: string, presetIds: string[] = []): Sequence {
  const scenes: SequenceScene[] = presetIds.map((presetId, index) => ({
    id: generateSequenceSceneId(),
    sequenceId: "", // Will be set after sequence creation
    presetId,
    name: `Scene ${index + 1}`,
    durationMode: "manual",
    order: index,
  }));

  const sequenceId = generateSequenceId();
  
  // Set sequenceId on all scenes
  scenes.forEach(scene => {
    scene.sequenceId = sequenceId;
  });

  return {
    id: sequenceId,
    name,
    backgroundColour: "#000000",
    defaultFadeType: "cut",
    scenes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Export sequences as JSON
 */
export function exportSequencesAsJSON(): string {
  const sequences = getAllSequences();
  return JSON.stringify(sequences, null, 2);
}

/**
 * Export a single sequence as JSON
 */
export function exportSequenceAsJSON(sequence: Sequence): string {
  return JSON.stringify(sequence, null, 2);
}

/**
 * Import sequences from JSON
 */
export function importSequencesFromJSON(json: string): {
  success: boolean;
  imported: number;
  errors: string[];
} {
  const errors: string[] = [];
  let imported = 0;

  try {
    const parsed = JSON.parse(json);
    const sequencesToImport = Array.isArray(parsed) ? parsed : [parsed];

    const existingSequences = getAllSequences();
    const existingIds = new Set(existingSequences.map((s) => s.id));

    for (const sequenceData of sequencesToImport) {
      if (!sequenceData || typeof sequenceData !== "object") {
        errors.push("Invalid sequence format");
        continue;
      }

      // Support both old format (items) and new format (scenes)
      const hasItems = sequenceData.items && Array.isArray(sequenceData.items);
      const hasScenes = sequenceData.scenes && Array.isArray(sequenceData.scenes);
      
      if (!hasItems && !hasScenes) {
        errors.push(`Sequence "${sequenceData.name || "Unknown"}" missing items or scenes`);
        continue;
      }

      const newId = existingIds.has(sequenceData.id)
        ? generateSequenceId()
        : sequenceData.id;

      let sequence: Sequence;
      
      if (hasScenes) {
        // New format - use scenes directly
        sequence = {
          id: newId,
          name: sequenceData.name || `Imported Sequence ${imported + 1}`,
          description: sequenceData.description,
          backgroundColour: sequenceData.backgroundColour || "#000000",
          defaultFadeType: sequenceData.defaultFadeType || "cut",
          scenes: sequenceData.scenes.map((scene: any, index: number) => ({
            id: scene.id || generateSequenceSceneId(),
            sequenceId: newId,
            presetId: scene.presetId,
            inlinePresetJson: scene.inlinePresetJson,
            name: scene.name || `Scene ${index + 1}`,
            durationMode: scene.durationMode || (scene.durationSeconds !== undefined ? "seconds" : "manual"),
            durationSeconds: scene.durationSeconds,
            fadeTypeOverride: scene.fadeTypeOverride,
            notes: scene.notes,
            order: scene.order !== undefined ? scene.order : index,
          })),
          createdAt: sequenceData.createdAt || Date.now(),
          updatedAt: sequenceData.updatedAt || Date.now(),
        };
      } else {
        // Old format - migrate items to scenes
        const tempSequence: Sequence & { items: SequenceItem[] } = {
          id: newId,
          name: sequenceData.name || `Imported Sequence ${imported + 1}`,
          backgroundColour: "#000000",
          defaultFadeType: "cut",
          scenes: [],
          items: sequenceData.items.map((item: any, index: number) => ({
            id: item.id || generateSequenceItemId(),
            presetId: item.presetId,
            duration: item.duration || 0,
            transition: item.transition || "instant",
            order: item.order !== undefined ? item.order : index,
          })),
          createdAt: sequenceData.createdAt || Date.now(),
          updatedAt: sequenceData.updatedAt || Date.now(),
        };
        sequence = migrateSequenceToNewFormat(tempSequence);
      }

      existingSequences.push(sequence);
      imported++;
    }

    if (imported > 0) {
      const allSequences = existingSequences.slice(-MAX_SEQUENCES);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allSequences));
    }

    return { success: imported > 0, imported, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Failed to parse JSON");
    return { success: false, imported: 0, errors };
  }
}

/**
 * Validate sequence scenes against existing presets
 */
export function validateSequenceScenes(
  sequence: Sequence,
  presets: Preset[]
): {
  valid: boolean;
  missingPresets: string[];
} {
  const presetIds = new Set(presets.map((p) => p.id));
  const missingPresets: string[] = [];

  for (const scene of sequence.scenes) {
    // Only validate scenes with presetId (not inline JSON presets)
    if (scene.presetId && !presetIds.has(scene.presetId)) {
      missingPresets.push(scene.presetId);
    }
  }

  return {
    valid: missingPresets.length === 0,
    missingPresets,
  };
}

/**
 * Validate sequence items against existing presets (legacy function for backward compatibility)
 */
export function validateSequenceItems(
  sequence: Sequence,
  presets: Preset[]
): {
  valid: boolean;
  missingPresets: string[];
} {
  return validateSequenceScenes(sequence, presets);
}

