import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Download, Upload, Trash2 } from "lucide-react";
import { animateSuccess, animateShake } from "@/lib/utils/animations";
import {
  getAllPresets,
  savePreset,
  deletePreset,
  loadPresetState,
  exportPresetsAsJSON,
  exportPresetAsJSON,
  importPresetsFromJSON,
  type Preset,
} from "@/lib/storage";
import type { GeneratorState } from "@/generator";

interface PresetManagerProps {
  currentState: GeneratorState | null;
  onLoadPreset: (state: GeneratorState) => void;
  onClose: () => void;
}

export const PresetManager = ({
  currentState,
  onLoadPreset,
  onClose,
}: PresetManagerProps) => {
  const [presets, setPresets] = useState<Preset[]>(getAllPresets());
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const refreshPresets = useCallback(() => {
    setPresets(getAllPresets());
  }, []);

  const handleSave = useCallback(() => {
    if (!currentState) {
      return;
    }
    setSaveError(null);
    try {
      savePreset(saveName, currentState);
      setSaveName("");
      refreshPresets();
      // Animate success on save button
      if (saveButtonRef.current) {
        animateSuccess(saveButtonRef.current);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save preset");
      // Animate shake on error
      if (saveButtonRef.current) {
        animateShake(saveButtonRef.current);
      }
    }
  }, [currentState, saveName, refreshPresets]);

  const handleLoad = useCallback(
    (preset: Preset) => {
    const state = loadPresetState(preset);
    if (state) {
      onLoadPreset(state);
      onClose();
    }
    },
    [onLoadPreset, onClose],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this preset?")) {
        try {
          deletePreset(id);
          refreshPresets();
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
    [refreshPresets],
  );

  const handleExportAll = useCallback(() => {
    const json = exportPresetsAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixli-presets-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPreset = useCallback((preset: Preset) => {
    const json = exportPresetAsJSON(preset);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixli-preset-${preset.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
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

        const result = importPresetsFromJSON(text);
        if (result.success) {
          setImportSuccess(`Successfully imported ${result.imported} preset(s)`);
          refreshPresets();
          if (result.errors.length > 0) {
            setImportError(`Some errors: ${result.errors.join("; ")}`);
          }
        } else {
          setImportError(
            result.errors.length > 0
              ? result.errors.join("; ")
              : "Failed to import presets",
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
    [refreshPresets],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onClose();
    },
    [onClose],
  );

  return (
    <div className="preset-manager-overlay" onClick={handleOverlayClick}>
      <Card
        className="preset-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preset-manager-header">
          <h2 className="preset-manager-title">Preset management</h2>
          <button
            type="button"
            className="preset-manager-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="preset-manager-content">
          {/* Save Section */}
          <div className="section">
            <h3 className="section-title">
              Save preset
            </h3>
            <div className="preset-save-form">
              <input
                type="text"
                className="preset-name-input"
                placeholder="Preset name..."
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
              <div className="preset-error mt-[theme(spacing.2)]" role="alert">
                {saveError}
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className="section">
            <h3 className="section-title">
              Import preset
            </h3>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="preset-import-input"
              />
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import preset
              </Button>
            </div>
            {importSuccess && (
              <div className="preset-success mt-[theme(spacing.2)]" role="alert">
                {importSuccess}
              </div>
            )}
            {importError && (
              <div className="preset-error mt-[theme(spacing.2)]" role="alert">
                {importError}
              </div>
            )}
          </div>

          {/* Presets List */}
          <div className="section">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                Your presets ({presets.length})
              </h3>
              {presets.length > 0 && (
                <Button
                  type="button"
                  size="md"
                  variant="link"
                  onClick={handleExportAll}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs"
                >
                  Export all
                </Button>
              )}
            </div>
            {presets.length === 0 ? (
              <p className="preset-empty">No saved presets</p>
            ) : (
              <div className="flex flex-col gap-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-3"
                  >
                    <span style={{ flex: 1, fontSize: "0.875rem", textTransform: "uppercase", fontWeight: 500 }}>
                      {preset.name}
                    </span>
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      onClick={() => handleLoad(preset)}
                    >
                      Load
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleExportPreset(preset)}
                      title="Export preset as JSON"
                      aria-label="Export preset"
                    >
                      <Download className="h-6 w-6" />
                    </Button>
                    <Button
                      ref={(el) => {
                        if (el) {
                          deleteButtonRefs.current.set(preset.id, el);
                        }
                      }}
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleDelete(preset.id)}
                      title="Delete preset"
                      aria-label="Delete preset"
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

