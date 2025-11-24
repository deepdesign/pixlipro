import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { animateSuccess, animateShake } from "@/lib/utils/animations";
import { ButtonGroup } from "@/components/retroui/ButtonGroup";
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
  const [view, setView] = useState<"save" | "load">("load");
  const [saveName, setSaveName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
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
        try {
          deletePreset(id);
          refreshPresets();
          if (selectedPresetId === id) {
            setSelectedPresetId(null);
          }
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
    [selectedPresetId, refreshPresets],
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
    a.download = `pixli-preset-${preset.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
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
          <div className="mb-[theme(spacing.4)]">
            <ButtonGroup
              value={view}
              onChange={(value) => setView(value as "save" | "load")}
              options={[
                { value: "save", label: "Save" },
                { value: "load", label: "Load" },
              ]}
            />
          </div>

          {/* Save View */}
          {view === "save" && (
          <div className="section">
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
                  className="flex-1"
              >
                Save
              </Button>
                {presets.length > 0 && (
                  <Button
                    type="button"
                    size="md"
                    variant="link"
                    onClick={handleExportAll}
                    className="text-[var(--text-muted)] hover:text-[var(--text-color)]"
                  >
                    Export all
                  </Button>
                )}
            </div>
            {saveError && (
              <div className="preset-error" role="alert">
                {saveError}
              </div>
            )}
          </div>
          )}

          {/* Load View */}
          {view === "load" && (
          <div className="section">
            {presets.length === 0 ? (
              <p className="preset-empty">No saved presets</p>
            ) : (
                <div className="preset-actions">
                <Select
                  value={selectedPresetId ?? undefined}
                  onValueChange={setSelectedPresetId}
                >
                    <SelectTrigger className="flex-1">
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
                    onClick={handleLoad}
                    disabled={!selectedPresetId}
                  >
                    Load
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    variant="link"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[var(--text-muted)] hover:text-[var(--text-color)]"
                  >
                    Import
                  </Button>
                  {selectedPresetId && (
                    <Button
                      ref={(el) => {
                        if (el && selectedPresetId) {
                          deleteButtonRefs.current.set(selectedPresetId, el);
                        } else if (selectedPresetId) {
                          deleteButtonRefs.current.delete(selectedPresetId);
                        }
                      }}
                      type="button"
                      size="md"
                      variant="outline"
                      onClick={() => handleDelete(selectedPresetId)}
                      className="text-[var(--destructive)] border-[var(--destructive)] hover:bg-[color-mix(in_srgb,var(--destructive)_15%,transparent)]"
                    >
                      Delete
                    </Button>
                  )}
                </div>
            )}
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
          )}

        </div>
      </Card>
    </div>
  );
};

