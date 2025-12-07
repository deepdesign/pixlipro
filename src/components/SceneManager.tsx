import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Download, Upload, Trash2 } from "lucide-react";
import { animateSuccess, animateShake } from "@/lib/utils/animations";
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
} from "@/lib/storage";
import type { GeneratorState } from "@/generator";
import { SceneThumbnail } from "@/components/SequenceManager/SceneThumbnail";
import { SceneNameConflictDialog } from "@/components/SceneNameConflictDialog";

interface SceneManagerProps {
  currentState: GeneratorState | null;
  onLoadScene: (state: GeneratorState) => void;
  onClose: () => void;
}

export const SceneManager = ({
  currentState,
  onLoadScene,
  onClose,
}: SceneManagerProps) => {
  const [scenes, setScenes] = useState<Scene[]>(getAllScenes());
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [loadedSceneId, setLoadedSceneId] = useState<string | null>(null);
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean;
    existingSceneId: string;
    existingSceneName: string;
  }>({ isOpen: false, existingSceneId: "", existingSceneName: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const refreshScenes = useCallback(() => {
    setScenes(getAllScenes());
  }, []);

  const handleSave = useCallback(() => {
    if (!currentState) {
      return;
    }
    setSaveError(null);
    
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
          saveScene(nameToUse, currentState, loadedSceneId);
          setSaveName("");
          refreshScenes();
          if (saveButtonRef.current) {
            animateSuccess(saveButtonRef.current);
          }
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "Failed to update scene");
          if (saveButtonRef.current) {
            animateShake(saveButtonRef.current);
          }
        }
        return;
      }
    }
    
    // New scene - check for conflicts
    try {
      saveScene(sceneName, currentState);
      setSaveName("");
      refreshScenes();
      if (saveButtonRef.current) {
        animateSuccess(saveButtonRef.current);
      }
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
        if (saveButtonRef.current) {
          animateShake(saveButtonRef.current);
        }
      }
    }
  }, [currentState, saveName, refreshScenes, loadedSceneId, scenes]);

  const handleLoad = useCallback(
    (scene: Scene) => {
    const state = loadSceneState(scene);
    if (state) {
      setLoadedSceneId(scene.id);
      onLoadScene(state);
      onClose();
    }
    },
    [onLoadScene, onClose],
  );
  
  const handleConflictUpdate = useCallback(() => {
    if (!currentState || !conflictDialog.existingSceneId) return;
    
    try {
      saveScene(saveName.trim() || conflictDialog.existingSceneName, currentState, conflictDialog.existingSceneId);
      setSaveName("");
      setConflictDialog({ isOpen: false, existingSceneId: "", existingSceneName: "" });
      refreshScenes();
      if (saveButtonRef.current) {
        animateSuccess(saveButtonRef.current);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update scene");
      if (saveButtonRef.current) {
        animateShake(saveButtonRef.current);
      }
    }
  }, [currentState, conflictDialog, saveName, refreshScenes]);
  
  const handleConflictSaveNew = useCallback((newName: string) => {
    if (!currentState) return;
    
    try {
      saveScene(newName, currentState);
      setSaveName("");
      setConflictDialog({ isOpen: false, existingSceneId: "", existingSceneName: "" });
      refreshScenes();
      if (saveButtonRef.current) {
        animateSuccess(saveButtonRef.current);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save scene");
      if (saveButtonRef.current) {
        animateShake(saveButtonRef.current);
      }
    }
  }, [currentState, refreshScenes]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this scene?")) {
        try {
          deleteScene(id);
          refreshScenes();
          // Animate success on delete button
          const deleteButton = deleteButtonRefs.current.get(id);
          if (deleteButton) {
            animateSuccess(deleteButton);
          }
        } catch (error) {
          // Animate shake on error
          const deleteButton = deleteButtonRefs.current.get(id);
          if (deleteButton) {
            animateShake(deleteButton);
          }
        }
      }
    },
    [refreshScenes],
  );

  const handleExportAll = useCallback(() => {
    const json = exportScenesAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixli-scenes-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportScene = useCallback((scene: Scene) => {
    const json = exportSceneAsJSON(scene);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixli-scene-${scene.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setImportError(null);
      setImportSuccess(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") {
          setImportError("Failed to read file");
          return;
        }

        const result = importScenesFromJSON(text);
        if (result.success) {
          setImportSuccess(`Successfully imported ${result.imported} scene(s)`);
          refreshScenes();
          if (result.errors.length > 0) {
            setImportError(`Some errors: ${result.errors.join("; ")}`);
          }
        } else {
          setImportError(
            result.errors.length > 0
              ? result.errors.join("; ")
              : "Failed to import scenes",
          );
        }
      };
      reader.onerror = () => {
        setImportError("Failed to read file");
      };
      reader.readAsText(file);

      // Reset input so same file can be imported again
      event.target.value = "";
    },
    [refreshScenes],
  );

  const handleOverlayClick = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>) => {
      onClose();
    },
    [onClose],
  );

  return (
    <div className="scene-manager-overlay" onClick={handleOverlayClick}>
      <Card
        className="scene-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scene-manager-header">
          <h2 className="scene-manager-title">Scene management</h2>
          <button
            type="button"
            className="scene-manager-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="scene-manager-content">
          {/* Save Section */}
          <div className="section">
            <h3 className="section-title">
              Save scene
            </h3>
            <div className="scene-save-form">
              <input
                type="text"
                className="scene-name-input"
                placeholder="Scene name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveName.trim() && currentState) {
                    handleSave();
                  }
                }}
                disabled={!currentState}
              />
              <Button
                ref={saveButtonRef}
                type="button"
                size="md"
                variant="outline"
                onClick={handleSave}
                disabled={!currentState || !saveName.trim()}
              >
                Save
              </Button>
            </div>
            {saveError && (
              <div className="scene-error mt-[theme(spacing.2)]" role="alert">
                {saveError}
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className="section">
            <h3 className="section-title">
              Import scene
            </h3>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="scene-import-input"
              />
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import scene
              </Button>
            </div>
            {importSuccess && (
              <div className="scene-success mt-[theme(spacing.2)]" role="alert">
                {importSuccess}
              </div>
            )}
            {importError && (
              <div className="scene-error mt-[theme(spacing.2)]" role="alert">
                {importError}
              </div>
            )}
          </div>

          {/* Scenes List */}
          <div className="section">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                Your scenes ({scenes.length})
              </h3>
              {scenes.length > 0 && (
                <Button
                  type="button"
                  size="md"
                  variant="link"
                  onClick={handleExportAll}
                  className="text-theme-muted hover:text-theme-primary text-xs"
                >
                  Export all
                </Button>
              )}
            </div>
            {scenes.length === 0 ? (
              <p className="scene-empty">No saved scenes</p>
            ) : (
              <div className="flex flex-col gap-3">
                {scenes.map((scene) => {
                  const sceneState = loadSceneState(scene);
                  return (
                    <div
                      key={scene.id}
                      className="flex items-center gap-3"
                    >
                      {sceneState && (
                        <div className="flex-shrink-0">
                          <SceneThumbnail state={sceneState} size={60} />
                        </div>
                      )}
                      <span style={{ flex: 1, fontSize: "0.875rem", textTransform: "uppercase", fontWeight: 500 }}>
                        {scene.name}
                      </span>
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      onClick={() => handleLoad(scene)}
                    >
                      Load
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleExportScene(scene)}
                      title="Export scene as JSON"
                      aria-label="Export scene"
                    >
                      <Download className="h-6 w-6" />
                    </Button>
                    <Button
                      ref={(el) => {
                        if (el) {
                          deleteButtonRefs.current.set(scene.id, el);
                        }
                      }}
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleDelete(scene.id)}
                      title="Delete scene"
                      aria-label="Delete scene"
                      className="btn-error"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <SceneNameConflictDialog
        isOpen={conflictDialog.isOpen}
        existingSceneName={conflictDialog.existingSceneName}
        onUpdate={handleConflictUpdate}
        onSaveNew={handleConflictSaveNew}
        onCancel={() => setConflictDialog({ isOpen: false, existingSceneId: "", existingSceneName: "" })}
      />
    </div>
  );
};

