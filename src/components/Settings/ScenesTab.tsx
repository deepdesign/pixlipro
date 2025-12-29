import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Download, Upload, Trash2, Search } from "lucide-react";
import {
  getAllScenes,
  saveScene,
  deleteScene,
  loadSceneState,
  exportScenesAsJSON,
  exportSceneAsJSON,
  importScenesFromJSON,
  checkSceneNameConflict,
  type Scene,
} from "@/lib/storage/sceneStorage";
import { SceneNameConflictDialog } from "@/components/SceneNameConflictDialog";
import type { GeneratorState } from "@/types/generator";
import { DEFAULT_STATE } from "@/generator";
import { SceneThumbnail } from "@/components/SequenceManager/SceneThumbnail";
import { generateSceneThumbnail } from "@/lib/services/thumbnailService";
import type { SpriteController } from "@/generator";
import { updateScene } from "@/lib/storage/sceneStorage";

interface ScenesTabProps {
  currentState?: GeneratorState | null;
  onLoadScene?: (state: GeneratorState) => void;
  controller?: SpriteController | null;
}

export function ScenesTab({ currentState, onLoadScene, controller }: ScenesTabProps) {
  // Log to multiple console methods to ensure visibility
  console.log("[ScenesTab] Component rendered", { 
    hasController: !!controller, 
    hasCurrentState: !!currentState 
  });
  console.warn("[ScenesTab] Component rendered (warn)", { 
    hasController: !!controller, 
    hasCurrentState: !!currentState 
  });
  
  const [scenes, setScenes] = useState<Scene[]>(getAllScenes());
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedSceneId, setLoadedSceneId] = useState<string | null>(null);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState<{ current: number; total: number } | null>(null);
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean;
    existingSceneId: string;
    existingSceneName: string;
  }>({ isOpen: false, existingSceneId: "", existingSceneName: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshScenes();
  }, []);

  const refreshScenes = useCallback(() => {
    const updatedScenes = getAllScenes();
    console.log("[ScenesTab] refreshScenes called", {
      sceneCount: updatedScenes.length,
      scenesWithThumbnails: updatedScenes.filter(s => s.thumbnail).length,
      sceneDetails: updatedScenes.map(s => ({
        id: s.id,
        name: s.name,
        hasThumbnail: !!s.thumbnail,
        thumbnailLength: s.thumbnail?.length || 0
      }))
    });
    setScenes(updatedScenes);
  }, []);

  const filteredScenes = scenes.filter((scene) =>
    scene.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = useCallback(async () => {
    // Use alert as a fallback to ensure we see if this is called
    console.log("[ScenesTab] handleSave CALLED - START", { 
      hasController: !!controller, 
      hasCurrentState: !!currentState,
      controllerType: controller ? typeof controller : 'null',
      saveName: saveName.trim()
    });
    console.warn("[ScenesTab] handleSave CALLED - START (warn)", { 
      hasController: !!controller, 
      hasCurrentState: !!currentState 
    });
    
    if (!currentState) {
      console.warn("[ScenesTab] No currentState, cannot save");
      setSaveError("No current state to save");
      return;
    }
    setSaveError(null);
    
    // Generate thumbnail using main controller's canvas
    let thumbnail: string | undefined;
    console.log("[ScenesTab] About to generate thumbnail", { 
      hasController: !!controller, 
      hasCurrentState: !!currentState
    });
    
    if (controller) {
      try {
        console.log("[ScenesTab] Generating thumbnail with controller...");
        thumbnail = await generateSceneThumbnail(currentState, 80, controller);
        console.log("[ScenesTab] Thumbnail generated successfully:", thumbnail ? `yes (${thumbnail.length} chars, starts with: ${thumbnail.substring(0, 50)})` : "no");
      } catch (error) {
        console.error("[ScenesTab] Failed to generate thumbnail:", error);
        // Continue without thumbnail
      }
    } else {
      console.warn("[ScenesTab] No controller available for thumbnail generation");
    }
    
    const sceneName = saveName.trim() || "";
    
    // If a scene is loaded, offer to update it
    if (loadedSceneId) {
      const loadedScene = scenes.find((s) => s.id === loadedSceneId);
      if (loadedScene) {
        // Check if name changed or conflicts
        const nameToUse = sceneName || loadedScene.name;
        const conflict = checkSceneNameConflict(nameToUse, loadedSceneId);
        
        if (conflict) {
          // Name conflicts with a different scene
          setConflictDialog({
            isOpen: true,
            existingSceneId: conflict.existingSceneId,
            existingSceneName: conflict.existingSceneName,
          });
          return;
        }
        
        // Update the loaded scene
    try {
          saveScene(nameToUse, currentState, loadedSceneId, thumbnail);
          setSaveName("");
          refreshScenes();
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "Failed to update scene");
        }
        return;
      }
    }
    
    // New scene - check for conflicts
    try {
      const savedScene = saveScene(sceneName, currentState, undefined, thumbnail);
      console.log("[ScenesTab] Scene saved with thumbnail:", { 
        sceneId: savedScene.id, 
        sceneName: savedScene.name,
        hasThumbnail: !!savedScene.thumbnail,
        thumbnailLength: savedScene.thumbnail?.length,
        thumbnailPreview: savedScene.thumbnail ? savedScene.thumbnail.substring(0, 50) : 'none'
      });
      setSaveName("");
      refreshScenes();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save scene";
      
      // Check if it's a name conflict error
      if (errorMessage.startsWith("SCENE_NAME_CONFLICT:")) {
        const [, existingSceneId, existingSceneName] = errorMessage.split(":");
        setConflictDialog({
          isOpen: true,
          existingSceneId,
          existingSceneName: decodeURIComponent(existingSceneName),
        });
      } else {
        setSaveError(errorMessage);
      }
    }
  }, [currentState, saveName, refreshScenes, loadedSceneId, scenes, controller]);

  const handleLoad = useCallback(
    (scene: Scene) => {
      const state = loadSceneState(scene);
      if (state && onLoadScene) {
        setLoadedSceneId(scene.id);
        onLoadScene(state);
      }
    },
    [onLoadScene]
  );
  
  const handleConflictUpdate = useCallback(async () => {
    if (!currentState || !conflictDialog.existingSceneId) return;
    
    // Generate thumbnail using main controller's canvas
    let thumbnail: string | undefined;
    try {
      thumbnail = await generateSceneThumbnail(currentState, 80, controller);
    } catch (error) {
      console.warn("Failed to generate thumbnail:", error);
      // Continue without thumbnail
    }
    
    try {
      saveScene(saveName.trim() || conflictDialog.existingSceneName, currentState, conflictDialog.existingSceneId, thumbnail);
      setSaveName("");
      setConflictDialog({ isOpen: false, existingSceneId: "", existingSceneName: "" });
      refreshScenes();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update scene");
    }
  }, [currentState, conflictDialog, saveName, refreshScenes, controller]);
  
  const handleConflictSaveNew = useCallback(async (newName: string) => {
    if (!currentState) return;
    
    // Generate thumbnail using main controller's canvas
    let thumbnail: string | undefined;
    try {
      thumbnail = await generateSceneThumbnail(currentState, 80, controller);
    } catch (error) {
      console.warn("Failed to generate thumbnail:", error);
      // Continue without thumbnail
    }
    
    try {
      saveScene(newName, currentState, undefined, thumbnail);
      setSaveName("");
      setConflictDialog({ isOpen: false, existingSceneId: "", existingSceneName: "" });
      refreshScenes();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save scene");
    }
  }, [currentState, refreshScenes, controller]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this scene?")) {
        try {
          deleteScene(id);
          refreshScenes();
        } catch (error) {
          console.error("Failed to delete scene:", error);
        }
      }
    },
    [refreshScenes]
  );

  const handleExportAll = useCallback(() => {
    const json = exportScenesAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixli-scenes.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleGenerateMissingThumbnails = useCallback(async () => {
    if (!controller) {
      setSaveError("Controller not available. Please ensure the canvas is loaded.");
      return;
    }

    const allScenes = getAllScenes();
    const scenesWithoutThumbnails = allScenes.filter(scene => !scene.thumbnail);
    
    if (scenesWithoutThumbnails.length === 0) {
      setImportSuccess("All scenes already have thumbnails!");
      return;
    }

    setIsGeneratingThumbnails(true);
    setThumbnailProgress({ current: 0, total: scenesWithoutThumbnails.length });
    setSaveError(null);
    setImportSuccess(null);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < scenesWithoutThumbnails.length; i++) {
      const scene = scenesWithoutThumbnails[i];
      setThumbnailProgress({ current: i + 1, total: scenesWithoutThumbnails.length });

      try {
        const thumbnail = await generateSceneThumbnail(scene.state, 80, controller);
        if (thumbnail) {
          updateScene(scene.id, scene.name, scene.state, thumbnail);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to generate thumbnail for scene "${scene.name}":`, error);
        errorCount++;
      }

      // Small delay between thumbnails to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsGeneratingThumbnails(false);
    setThumbnailProgress(null);
    refreshScenes();

    if (successCount > 0) {
      setImportSuccess(`Generated ${successCount} thumbnail(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
    } else {
      setSaveError(`Failed to generate thumbnails${errorCount > 0 ? ` (${errorCount} error(s))` : ''}`);
    }
  }, [controller, refreshScenes]);

  const handleExportScene = useCallback(
    (scene: Scene) => {
      const json = exportSceneAsJSON(scene);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scene.name.replace(/\s+/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const result = importScenesFromJSON(json);
          if (result.success) {
            setImportSuccess(`Successfully imported ${result.imported} scene(s)`);
            setImportError(null);
            refreshScenes();
            setTimeout(() => setImportSuccess(null), 3000);
          } else {
            setImportError(result.errors.join(", ") || "Failed to import scenes");
            setImportSuccess(null);
          }
        } catch (error) {
          setImportError("Failed to parse JSON file");
          setImportSuccess(null);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [refreshScenes]
  );

  return (
    <div className="space-y-6">
      {/* Save Current State */}
      {currentState && (
        <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
          <div className="p-6 border-b border-theme-card">
            <h3 className="text-base font-semibold text-theme-primary">
              Save current scene
            </h3>
            <p className="text-sm text-theme-muted mt-1">
              Save your current generator settings as a scene for quick access later.
            </p>
          </div>
          <div className="p-6">
            <div className="flex gap-4">
              <Input
                type="text"
                value={saveName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveName(e.target.value)}
                placeholder="Scene name"
                className="flex-1"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
              <Button 
                onClick={() => {
                  console.log("[ScenesTab] Save button clicked!");
                  handleSave();
                }} 
                disabled={!saveName.trim()}
              >
                Save scene
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-theme-muted mt-2">
                {saveError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scenes List */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-theme-primary">
                Saved scenes
              </h3>
              <p className="text-sm text-theme-muted mt-1">
                Manage your saved scenes. Load, export, or delete scenes.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateMissingThumbnails}
                disabled={isGeneratingThumbnails || !controller}
                title={!controller ? "Controller not available" : "Generate thumbnails for scenes missing them"}
              >
                {isGeneratingThumbnails ? (
                  <>
                    <span className="mr-2">
                      {thumbnailProgress ? `${thumbnailProgress.current}/${thumbnailProgress.total}` : '...'}
                    </span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate thumbnails
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="h-4 w-4 mr-2" />
                Export all
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-subtle" />
            <Input
              type="text"
              placeholder="Search scenes..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          {importError && (
            <p className="text-sm text-theme-muted mt-2">
              {importError}
            </p>
          )}
          {importSuccess && (
            <p className="text-sm text-[var(--accent-primary)] mt-2">
              {importSuccess}
            </p>
          )}
        </div>
        <div className="p-6">
          {filteredScenes.length === 0 ? (
            <div className="text-center py-12 text-theme-subtle">
              {searchQuery ? "No scenes found" : "No scenes saved yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScenes.map((scene) => {
                const sceneState = loadSceneState(scene);
                return (
                  <div
                    key={scene.id}
                    className="flex items-center gap-4 p-4 border border-theme-card rounded-lg hover:bg-theme-icon transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <SceneThumbnail state={sceneState || currentState || DEFAULT_STATE} size={60} thumbnail={scene.thumbnail} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-theme-primary truncate">
                        {scene.name}
                      </div>
                      <div className="text-xs text-theme-subtle mt-1">
                        Created {new Date(scene.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    {onLoadScene && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoad(scene)}
                      >
                        Load
                      </Button>
                    )}
                    <Button
                      variant="link"
                      size="icon"
                      onClick={() => handleExportScene(scene)}
                      title="Export scene"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="link"
                      size="icon"
                      onClick={() => handleDelete(scene.id)}
                      title="Delete scene"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <SceneNameConflictDialog
        isOpen={conflictDialog.isOpen}
        existingSceneName={conflictDialog.existingSceneName}
        onUpdate={handleConflictUpdate}
        onSaveNew={handleConflictSaveNew}
        onCancel={() => setConflictDialog({ isOpen: false, existingSceneId: "", existingSceneName: "" })}
      />
    </div>
  );
}

