import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/catalyst/input";
import { Download, Upload, Trash2, Search } from "lucide-react";
import {
  getAllPresets,
  savePreset,
  deletePreset,
  loadPresetState,
  exportPresetsAsJSON,
  exportPresetAsJSON,
  importPresetsFromJSON,
  type Preset,
} from "@/lib/storage/presetStorage";
import type { GeneratorState } from "@/types/generator";

interface PresetsTabProps {
  currentState?: GeneratorState | null;
  onLoadPreset?: (state: GeneratorState) => void;
}

export function PresetsTab({ currentState, onLoadPreset }: PresetsTabProps) {
  const [presets, setPresets] = useState<Preset[]>(getAllPresets());
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshPresets();
  }, []);

  const refreshPresets = useCallback(() => {
    setPresets(getAllPresets());
  }, []);

  const filteredPresets = presets.filter((preset) =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = useCallback(() => {
    if (!currentState) {
      setSaveError("No current state to save");
      return;
    }
    setSaveError(null);
    try {
      savePreset(saveName, currentState);
      setSaveName("");
      refreshPresets();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save preset");
    }
  }, [currentState, saveName, refreshPresets]);

  const handleLoad = useCallback(
    (preset: Preset) => {
      const state = loadPresetState(preset);
      if (state && onLoadPreset) {
        onLoadPreset(state);
      }
    },
    [onLoadPreset]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this preset?")) {
        try {
          deletePreset(id);
          refreshPresets();
        } catch (error) {
          console.error("Failed to delete preset:", error);
        }
      }
    },
    [refreshPresets]
  );

  const handleExportAll = useCallback(() => {
    const json = exportPresetsAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixli-presets.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPreset = useCallback(
    (preset: Preset) => {
      const json = exportPresetAsJSON(preset);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${preset.name.replace(/\s+/g, "-")}.json`;
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
          const result = importPresetsFromJSON(json);
          if (result.success) {
            setImportSuccess(`Successfully imported ${result.imported} preset(s)`);
            setImportError(null);
            refreshPresets();
            setTimeout(() => setImportSuccess(null), 3000);
          } else {
            setImportError(result.errors.join(", ") || "Failed to import presets");
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
    [refreshPresets]
  );

  return (
    <div className="space-y-6">
      {/* Save Current State */}
      {currentState && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Save current preset
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Save your current generator settings as a preset for quick access later.
            </p>
          </div>
          <div className="p-6">
            <div className="flex gap-4">
              <Input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Preset name"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
              <Button onClick={handleSave} disabled={!saveName.trim()}>
                Save preset
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {saveError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Presets List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Saved presets
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your saved presets. Load, export, or delete presets.
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {importError}
            </p>
          )}
          {importSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {importSuccess}
            </p>
          )}
        </div>
        <div className="p-6">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {searchQuery ? "No presets found" : "No presets saved yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {preset.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Created {new Date(preset.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onLoadPreset && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoad(preset)}
                      >
                        Load
                      </Button>
                    )}
                    <Button
                      variant="naked"
                      size="icon"
                      onClick={() => handleExportPreset(preset)}
                      title="Export preset"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="naked"
                      size="icon"
                      onClick={() => handleDelete(preset.id)}
                      title="Delete preset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

