import { DEFAULT_STATE, type GeneratorState } from "@/generator";

type LegacyPresetStateExtras = {
  iconId?: string;
  iconAssetId?: string;
};

export interface Preset {
  id: string;
  name: string;
  state: GeneratorState & LegacyPresetStateExtras;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "bitlab-presets";
const MAX_PRESETS = 50;

export const getAllPresets = (): Preset[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as Preset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const savePreset = (name: string, state: GeneratorState): Preset => {
  const presets = getAllPresets();
  const now = Date.now();
  const stateSnapshot: GeneratorState = { ...state };
  const preset: Preset = {
    id: `preset-${now}-${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim() || `Preset ${presets.length + 1}`,
    state: stateSnapshot,
    createdAt: now,
    updatedAt: now,
  };

  presets.push(preset);
  if (presets.length > MAX_PRESETS) {
    presets.shift();
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error("Failed to save preset:", error);
    throw new Error("Failed to save preset. Storage may be full.");
  }

  return preset;
};

export const updatePreset = (id: string, name: string, state: GeneratorState): Preset | null => {
  const presets = getAllPresets();
  const index = presets.findIndex((p) => p.id === id);
  if (index === -1) {
    return null;
  }

  const preset = presets[index];
  preset.name = name.trim() || preset.name;
  preset.updatedAt = Date.now();
  preset.state = { ...state };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error("Failed to update preset:", error);
    throw new Error("Failed to update preset. Storage may be full.");
  }

  return preset;
};

export const deletePreset = (id: string): boolean => {
  const presets = getAllPresets();
  const filtered = presets.filter((p) => p.id !== id);
  if (filtered.length === presets.length) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete preset:", error);
    return false;
  }
};

export const loadPresetState = (preset: Preset): GeneratorState | null => {
  const { state: storedState } = preset;
  if (!storedState) {
    return null;
  }

  const { iconId: _legacyIconId, iconAssetId: _legacyIconAssetId, ...rest } =
    storedState;

  return {
    ...DEFAULT_STATE,
    ...rest,
  };
};

export const exportPresetsAsJSON = (): string => {
  const presets = getAllPresets();
  return JSON.stringify(presets, null, 2);
};

export const exportPresetAsJSON = (preset: Preset): string => {
  return JSON.stringify(preset, null, 2);
};

export const importPresetsFromJSON = (json: string): {
  success: boolean;
  imported: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let imported = 0;

  try {
    const parsed = JSON.parse(json);
    const presetsToImport = Array.isArray(parsed) ? parsed : [parsed];

    const existingPresets = getAllPresets();
    const existingIds = new Set(existingPresets.map((p) => p.id));

    for (const presetData of presetsToImport) {
      if (!presetData || typeof presetData !== "object") {
        errors.push("Invalid preset format");
        continue;
      }

      if (!presetData.state || typeof presetData.state !== "object") {
        errors.push(`Preset "${presetData.name || "Unknown"}" missing state data`);
        continue;
      }

      const {
        iconId: _legacyIconId,
        iconAssetId: _legacyIconAssetId,
        ...stateWithoutIcons
      } = presetData.state as LegacyPresetStateExtras & Partial<GeneratorState>;

      const sanitizedState: GeneratorState = {
        ...DEFAULT_STATE,
        ...stateWithoutIcons,
      };

      const newId = `preset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const preset: Preset = {
        id: existingIds.has(presetData.id) ? newId : presetData.id,
        name: presetData.name || `Imported Preset ${imported + 1}`,
        state: sanitizedState,
        createdAt: presetData.createdAt || Date.now(),
        updatedAt: presetData.updatedAt || Date.now(),
      };

      existingPresets.push(preset);
      imported++;
    }

    if (imported > 0) {
      const allPresets = existingPresets.slice(-MAX_PRESETS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allPresets));
    }

    return { success: imported > 0, imported, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Failed to parse JSON");
    return { success: false, imported: 0, errors };
  }
};

