import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/retroui/Select";
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
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save preset");
    }
  }, [currentState, saveName, refreshPresets]);

  const handleLoad = useCallback(() => {
    if (!selectedPresetId) {
      return;
    }
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) {
      return;
    }
    const state = loadPresetState(preset);
    if (state) {
      onLoadPreset(state);
      onClose();
    }
  }, [selectedPresetId, presets, onLoadPreset, onClose]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this preset?")) {
        deletePreset(id);
        refreshPresets();
        if (selectedPresetId === id) {
          setSelectedPresetId(null);
        }
      }
    },
    [selectedPresetId, refreshPresets],
  );

  const handleExportAll = useCallback(() => {
    const json = exportPresetsAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bitlab-presets-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportSelected = useCallback(() => {
    if (!selectedPresetId) {
      return;
    }
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) {
      return;
    }
    const json = exportPresetAsJSON(preset);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bitlab-preset-${preset.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedPresetId, presets]);

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
      // Don't close if clicking on the dropdown (which is rendered in a Portal)
      const target = e.target as HTMLElement;
      if (
        target.closest(".preset-select-dropdown") ||
        target.closest("[data-radix-portal]")
      ) {
        return;
      }
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
          <h2 className="preset-manager-title">Preset Management</h2>
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
          <div className="section">
            <h3 className="section-title">Save Current State</h3>
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
                type="button"
                size="md"
                onClick={handleSave}
                disabled={!currentState || !saveName.trim()}
              >
                Save
              </Button>
            </div>
            {saveError && (
              <div className="preset-error" role="alert">
                {saveError}
              </div>
            )}
          </div>

          <div className="section">
            <h3 className="section-title">Load Preset</h3>
            {presets.length === 0 ? (
              <p className="preset-empty">No saved presets</p>
            ) : (
              <>
                <Select
                  value={selectedPresetId ?? undefined}
                  onValueChange={setSelectedPresetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset..." />
                  </SelectTrigger>
                  <SelectContent className="preset-select-dropdown">
                    <SelectGroup>
                      {presets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="preset-actions">
                  <Button
                    type="button"
                    size="md"
                    onClick={handleLoad}
                    disabled={!selectedPresetId}
                    className="flex-1"
                  >
                    Load
                  </Button>
                  {selectedPresetId && (
                    <Button
                      type="button"
                      size="md"
                      variant="secondary"
                      onClick={() => handleDelete(selectedPresetId)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="section">
            <h3 className="section-title">Export &amp; Import</h3>
            <div className="preset-export-actions">
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={handleExportAll}
                disabled={presets.length === 0}
                className="flex-1"
              >
                Export all
              </Button>
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={handleExportSelected}
                disabled={!selectedPresetId}
                className="flex-1"
              >
                Export selected
              </Button>
            </div>
            <div className="preset-import-section">
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
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Import presets
              </Button>
            </div>
            {importSuccess && (
              <div className="preset-success" role="alert">
                {importSuccess}
              </div>
            )}
            {importError && (
              <div className="preset-error" role="alert">
                {importError}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

