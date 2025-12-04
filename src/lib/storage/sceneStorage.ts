import { DEFAULT_STATE, type GeneratorState } from "@/generator";
import { generateExportFilename } from "@/lib/services/exportService";

type LegacySceneStateExtras = {
  iconId?: string;
  iconAssetId?: string;
};

export interface Scene {
  id: string;
  name: string;
  state: GeneratorState & LegacySceneStateExtras;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "pixli-scenes";
const MAX_SCENES = 50;

export const getAllScenes = (): Scene[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as Scene[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const generateSceneName = (state: GeneratorState): string => {
  const exportName = generateExportFilename(state);
  // Remove .png extension and timestamp (format: -YYYYMMDD-HHMM)
  return exportName.replace(/\.png$/, "").replace(/-\d{8}-\d{4}$/, "");
};

export interface SceneNameConflict {
  existingSceneId: string;
  existingSceneName: string;
}

export const checkSceneNameConflict = (name: string, excludeId?: string): SceneNameConflict | null => {
  const scenes = getAllScenes();
  const trimmedName = name.trim();
  const existingScene = scenes.find(
    (s) => s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== excludeId
  );
  if (existingScene) {
    return {
      existingSceneId: existingScene.id,
      existingSceneName: existingScene.name,
    };
  }
  return null;
};

export const saveScene = (name: string, state: GeneratorState, updateExistingId?: string): Scene => {
  const scenes = getAllScenes();
  const now = Date.now();
  const stateSnapshot: GeneratorState = { ...state };
  const sceneName = name.trim() || generateSceneName(state);
  
  // If updating existing scene
  if (updateExistingId) {
    const index = scenes.findIndex((s) => s.id === updateExistingId);
    if (index !== -1) {
      const scene = scenes[index];
      scene.name = sceneName;
      scene.updatedAt = now;
      scene.state = stateSnapshot;
      
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
      } catch (error) {
        console.error("Failed to update scene:", error);
        throw new Error("Failed to update scene. Storage may be full.");
      }
      
      return scene;
    }
  }
  
  // Check for name conflict
  const conflict = checkSceneNameConflict(sceneName);
  if (conflict) {
    throw new Error(`SCENE_NAME_CONFLICT:${conflict.existingSceneId}:${conflict.existingSceneName}`);
  }
  
  const scene: Scene = {
    id: `scene-${now}-${Math.random().toString(36).substring(2, 9)}`,
    name: sceneName,
    state: stateSnapshot,
    createdAt: now,
    updatedAt: now,
  };

  scenes.push(scene);
  if (scenes.length > MAX_SCENES) {
    scenes.shift();
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch (error) {
    console.error("Failed to save scene:", error);
    throw new Error("Failed to save scene. Storage may be full.");
  }

  return scene;
};

export const updateScene = (id: string, name: string, state: GeneratorState): Scene | null => {
  const scenes = getAllScenes();
  const index = scenes.findIndex((s) => s.id === id);
  if (index === -1) {
    return null;
  }

  const scene = scenes[index];
  const newName = name.trim() || scene.name;
  
  // Check for name conflict (excluding current scene)
  const conflict = checkSceneNameConflict(newName, id);
  if (conflict) {
    throw new Error(`SCENE_NAME_CONFLICT:${conflict.existingSceneId}:${conflict.existingSceneName}`);
  }
  
  scene.name = newName;
  scene.updatedAt = Date.now();
  scene.state = { ...state };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch (error) {
    console.error("Failed to update scene:", error);
    throw new Error("Failed to update scene. Storage may be full.");
  }

  return scene;
};

export const deleteScene = (id: string): boolean => {
  const scenes = getAllScenes();
  const filtered = scenes.filter((s) => s.id !== id);
  if (filtered.length === scenes.length) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete scene:", error);
    return false;
  }
};

export const loadSceneState = (scene: Scene): GeneratorState | null => {
  const { state: storedState } = scene;
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

export const exportScenesAsJSON = (): string => {
  const scenes = getAllScenes();
  return JSON.stringify(scenes, null, 2);
};

export const exportSceneAsJSON = (scene: Scene): string => {
  return JSON.stringify(scene, null, 2);
};

export const importScenesFromJSON = (json: string): {
  success: boolean;
  imported: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let imported = 0;

  try {
    const parsed = JSON.parse(json);
    const scenesToImport = Array.isArray(parsed) ? parsed : [parsed];

    const existingScenes = getAllScenes();
    const existingIds = new Set(existingScenes.map((s) => s.id));

    for (const sceneData of scenesToImport) {
      if (!sceneData || typeof sceneData !== "object") {
        errors.push("Invalid scene format");
        continue;
      }

      if (!sceneData.state || typeof sceneData.state !== "object") {
        errors.push(`Scene "${sceneData.name || "Unknown"}" missing state data`);
        continue;
      }

      const {
        iconId: _legacyIconId,
        iconAssetId: _legacyIconAssetId,
        ...stateWithoutIcons
      } = sceneData.state as LegacySceneStateExtras & Partial<GeneratorState>;

      const sanitizedState: GeneratorState = {
        ...DEFAULT_STATE,
        ...stateWithoutIcons,
      };

      const newId = `scene-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const scene: Scene = {
        id: existingIds.has(sceneData.id) ? newId : sceneData.id,
        name: sceneData.name || `Imported Scene ${imported + 1}`,
        state: sanitizedState,
        createdAt: sceneData.createdAt || Date.now(),
        updatedAt: sceneData.updatedAt || Date.now(),
      };

      existingScenes.push(scene);
      imported++;
    }

    if (imported > 0) {
      const allScenes = existingScenes.slice(-MAX_SCENES);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allScenes));
    }

    return { success: imported > 0, imported, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Failed to parse JSON");
    return { success: false, imported: 0, errors };
  }
};

