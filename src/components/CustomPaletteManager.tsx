import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Download, Upload } from "lucide-react";
import { ButtonGroup } from "@/components/retroui/ButtonGroup";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import {
  getAllCustomPalettes,
  saveCustomPalette,
  updateCustomPalette,
  deleteCustomPalette,
  exportPaletteAsJSON,
  importPaletteFromJSON,
  getMaxCustomPalettes,
  type CustomPalette,
} from "@/lib/storage";
import { extractColorsFromImage } from "@/lib/services";

interface CustomPaletteManagerProps {
  onClose: () => void;
  onPaletteCreated: () => void;
}

export const CustomPaletteManager = ({
  onClose,
  onPaletteCreated,
}: CustomPaletteManagerProps) => {
  const [customPalettes, setCustomPalettes] = useState<CustomPalette[]>(
    getAllCustomPalettes(),
  );
  const [imageUrl, setImageUrl] = useState("");
  const [paletteName, setPaletteName] = useState("");
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [buttonGroupValue, setButtonGroupValue] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportInputRef = useRef<HTMLInputElement>(null);

  const refreshPalettes = useCallback(() => {
    setCustomPalettes(getAllCustomPalettes());
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      setError(null);
      setIsExtracting(true);
      setImageUrl("");
      setExtractedColors([]);

      try {
        const colors = await extractColorsFromImage(file);
        setExtractedColors(colors);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to extract colors",
        );
      } finally {
        setIsExtracting(false);
        // Reset input so same file can be selected again
        event.target.value = "";
      }
    },
    [],
  );

  const handleUrlExtract = useCallback(async () => {
    if (!imageUrl.trim()) {
      setError("Please enter an image URL");
      return;
    }

    setError(null);
    setIsExtracting(true);
    setExtractedColors([]);

    try {
      const colors = await extractColorsFromImage(imageUrl.trim());
      setExtractedColors(colors);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to extract colors",
      );
    } finally {
      setIsExtracting(false);
    }
  }, [imageUrl]);

  const handleSave = useCallback(() => {
    if (!paletteName.trim()) {
      setError("Please enter a palette name");
      return;
    }

    if (extractedColors.length === 0) {
      setError("Please extract colors from an image first");
      return;
    }

    setError(null);
    try {
      saveCustomPalette(
        paletteName.trim(),
        extractedColors,
        imageUrl || undefined,
      );
      refreshPalettes();
      onPaletteCreated();
      // Reset form
      setPaletteName("");
      setImageUrl("");
      setExtractedColors([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save palette");
    }
  }, [paletteName, extractedColors, imageUrl, refreshPalettes, onPaletteCreated]);

  const handleEdit = useCallback((palette: CustomPalette) => {
    setEditingId(palette.id);
    setEditingName(palette.name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editingName.trim()) {
      return;
    }

    setError(null);
    try {
      updateCustomPalette(editingId, editingName.trim());
      refreshPalettes();
      onPaletteCreated();
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update palette");
    }
  }, [editingId, editingName, refreshPalettes, onPaletteCreated]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  const handleReExtract = useCallback(
    async (palette: CustomPalette) => {
      if (!palette.imageUrl) {
        setError("Cannot re-extract: no image URL saved");
        return;
      }

      setError(null);
      setIsExtracting(true);

      try {
        const colors = await extractColorsFromImage(palette.imageUrl);
        updateCustomPalette(palette.id, undefined, colors);
        refreshPalettes();
        onPaletteCreated();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to re-extract colors",
        );
      } finally {
        setIsExtracting(false);
      }
    },
    [refreshPalettes, onPaletteCreated],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this custom palette?")) {
        deleteCustomPalette(id);
        refreshPalettes();
        onPaletteCreated();
        if (editingId === id) {
          setEditingId(null);
        }
      }
    },
    [editingId, refreshPalettes, onPaletteCreated],
  );

  const handleExportPalette = useCallback((palette: CustomPalette) => {
    const json = exportPaletteAsJSON(palette);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixli-palette-${palette.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportPalette = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.name.endsWith(".json")) {
        setError("Please select a JSON file");
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") {
          setError("Failed to read file");
          return;
        }

        const result = importPaletteFromJSON(text);
        if (result.success && result.palette) {
          refreshPalettes();
          onPaletteCreated();
          setError(null);
        } else {
          setError(result.error || "Failed to import palette");
        }
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsText(file);
      // Reset input so same file can be imported again
      event.target.value = "";
    },
    [refreshPalettes, onPaletteCreated],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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

  const maxPalettes = getMaxCustomPalettes();
  const isMaxReached = customPalettes.length >= maxPalettes;

  return (
    <div
      className="custom-palette-manager-overlay"
      onClick={handleOverlayClick}
    >
      <Card
        className="custom-palette-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-palette-manager-header">
          <h2 className="custom-palette-manager-title">Custom Palettes</h2>
          <button
            type="button"
            className="custom-palette-manager-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="custom-palette-manager-content">
          <div className="section">
            <h3 className="section-title">Create Palette</h3>
            <ButtonGroup
              value={buttonGroupValue}
              onChange={setButtonGroupValue}
              options={[
                { value: "upload", label: "Upload" },
                { value: "url", label: "URL" },
                { value: "import", label: "Import" },
              ]}
            />
            <div className="mt-4">
              {buttonGroupValue === "upload" && (
                  <div className="preset-import-section">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="preset-import-input"
                      disabled={isMaxReached}
                    />
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isMaxReached}
                    >
                      Upload Image
                    </Button>
                  </div>
              )}
              {buttonGroupValue === "url" && (
                  <div className="preset-import-section">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="image-url">IMAGE URL</Label>
                      <Input
                        id="image-url"
                        type="text"
                        placeholder="Enter image URL..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && imageUrl.trim()) {
                            handleUrlExtract();
                          }
                        }}
                        disabled={isMaxReached || isExtracting}
                      />
                    </div>
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={handleUrlExtract}
                      disabled={isMaxReached || isExtracting || !imageUrl.trim()}
                    >
                      {isExtracting ? "Extracting..." : "Extract Colors"}
                    </Button>
                  </div>
              )}
              {buttonGroupValue === "import" && (
                  <div className="preset-import-section">
                    <input
                      ref={jsonImportInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportPalette}
                      className="preset-import-input"
                      disabled={isMaxReached}
                    />
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="w-full"
                      onClick={() => jsonImportInputRef.current?.click()}
                      disabled={isMaxReached}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Palette JSON
                    </Button>
                  </div>
              )}
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="palette-name">PALETTE NAME</Label>
              <Input
                id="palette-name"
                type="text"
                placeholder="Enter palette name..."
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && paletteName.trim() && extractedColors.length > 0) {
                    handleSave();
                  }
                }}
                disabled={isMaxReached}
              />
            </div>
            {extractedColors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="control-select-color-preview">
                  {extractedColors.map((color, idx) => (
                    <span
                      key={idx}
                      className="control-select-color-square"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                  ))}
                </span>
                <Button
                  type="button"
                  size="md"
                  onClick={handleSave}
                  disabled={isMaxReached || !paletteName.trim()}
                >
                  Save
                </Button>
              </div>
            )}
            {isMaxReached && (
              <p className="preset-empty mt-2">
                Maximum of {maxPalettes} custom palettes reached
              </p>
            )}
            {error && (
              <div className="preset-error mt-2" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="section">
            <h3 className="section-title">
              Your Custom Palettes ({customPalettes.length} / {maxPalettes})
            </h3>
            {customPalettes.length === 0 ? (
              <p className="preset-empty">No custom palettes</p>
            ) : (
              <div className="flex flex-col gap-3">
                {customPalettes.map((palette) => (
                  <div
                    key={palette.id}
                    className="flex items-center gap-3 p-3"
                    style={{
                      border: "1px solid var(--select-border)",
                      borderRadius: "4px",
                    }}
                  >
                    <span className="control-select-color-preview">
                      {palette.colors.map((color, idx) => (
                        <span
                          key={idx}
                          className="control-select-color-square"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                    {editingId === palette.id ? (
                      <>
                        <div className="flex-1 grid items-center gap-1.5">
                          <Label htmlFor={`edit-${palette.id}`}>PALETTE NAME</Label>
                          <Input
                            id={`edit-${palette.id}`}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          size="md"
                          onClick={handleSaveEdit}
                          disabled={!editingName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="md"
                          variant="secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: "0.7rem" }}>
                          {palette.name}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleExportPalette(palette)}
                          title="Export palette as JSON"
                          aria-label="Export palette"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="md"
                          variant="outline"
                          onClick={() => handleEdit(palette)}
                        >
                          Edit
                        </Button>
                        {palette.imageUrl && (
                          <Button
                            type="button"
                            size="md"
                            variant="outline"
                            onClick={() => handleReExtract(palette)}
                            disabled={isExtracting}
                            title="Re-extract colors from image"
                          >
                            Re-extract
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="md"
                          variant="link"
                          onClick={() => handleDelete(palette.id)}
                          className="text-[var(--destructive)]"
                        >
                          Delete
                        </Button>
                      </>
                    )}
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

