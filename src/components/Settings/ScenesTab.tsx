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
  type Scene,
} from "@/lib/storage/sceneStorage";
import type { GeneratorState } from "@/types/generator";
import { SceneThumbnail } from "@/components/SequenceManager/SceneThumbnail";

interface ScenesTabProps {
  currentState?: GeneratorState | null;
  onLoadScene?: (state: GeneratorState) => void;
}

export function ScenesTab({ currentState, onLoadScene }: ScenesTabProps) {
  const [scenes, setScenes] = useState<Scene[]>(getAllScenes());
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshScenes();
  }, []);

  const refreshScenes = useCallback(() => {
    setScenes(getAllScenes());
  }, []);

  const filteredScenes = scenes.filter((scene) =>
    scene.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = useCallback(() => {
    if (!currentState) {
      setSaveError("No current state to save");
      return;
    }
    setSaveError(null);
    try {
      saveScene(saveName, currentState);
      setSaveName("");
      refreshScenes();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save scene");
    }
  }, [currentState, saveName, refreshScenes]);

  const handleLoad = useCallback(
    (scene: Scene) => {
      const state = loadSceneState(scene);
      if (state && onLoadScene) {
        onLoadScene(state);
      }
    },
    [onLoadScene]
  );

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
              <Button onClick={handleSave} disabled={!saveName.trim()}>
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
                    {sceneState && (
                      <div className="flex-shrink-0">
                        <SceneThumbnail state={sceneState} size={60} />
                      </div>
                    )}
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
                      variant="naked"
                      size="icon"
                      onClick={() => handleExportScene(scene)}
                      title="Export scene"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="naked"
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
    </div>
  );
}

