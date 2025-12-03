import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Download, Upload, X } from "lucide-react";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Input } from "@/components/ui/Input";
import { Label, Field } from "@/components/ui/Fieldset";
import { SwitchField, Switch } from "@/components/ui/switch";
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
import { loadSettings, saveSettings } from "@/lib/storage/settingsStorage";

export function CustomPalettesTab() {
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
  const [buttonGroupValue, setButtonGroupValue] = useState("custom");
  const [canvasBlackBackground, setCanvasBlackBackground] = useState(false);
  const [manualColors, setManualColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportInputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings();
    setCanvasBlackBackground(settings.canvasBlackBackground ?? false);
  }, []);

  const handleCanvasBlackBackgroundChange = useCallback((checked: boolean) => {
    setCanvasBlackBackground(checked);
    saveSettings({ canvasBlackBackground: checked });
  }, []);

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
        // Limit to 5 colours
        const limitedColors = colors.slice(0, 5);
        setExtractedColors(limitedColors);
        if (colors.length > 5) {
          setError(`Extracted ${colors.length} colours, limited to 5`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to extract colors",
        );
      } finally {
        setIsExtracting(false);
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
      // Limit to 5 colours
      const limitedColors = colors.slice(0, 5);
      setExtractedColors(limitedColors);
      if (colors.length > 5) {
        setError(`Extracted ${colors.length} colours, limited to 5`);
      }
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

    const colorsToSave = buttonGroupValue === "custom" ? manualColors : extractedColors;
    if (colorsToSave.length === 0) {
      setError(buttonGroupValue === "custom" 
        ? "Please add at least one colour" 
        : "Please extract colours from an image first");
      return;
    }

    setError(null);
    try {
      saveCustomPalette(
        paletteName.trim(),
        colorsToSave,
        buttonGroupValue === "custom" ? undefined : (imageUrl || undefined),
      );
      refreshPalettes();
      // Reset form
      setPaletteName("");
      setImageUrl("");
      setExtractedColors([]);
      setManualColors([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save palette");
    }
  }, [paletteName, extractedColors, manualColors, imageUrl, buttonGroupValue, refreshPalettes]);

  const handleAddColor = useCallback((color: string) => {
    // Check palette limit
    if (manualColors.length >= 5) {
      setError("Palette is limited to 5 colours");
      return;
    }
    
    // Validate hex color
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexPattern.test(color)) {
      setError("Please enter a valid hex colour (e.g., #FF0000)");
      return;
    }
    
    // Normalize to 6-digit hex
    const normalizedColor = color.length === 4 
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color.toUpperCase();
    
    if (manualColors.includes(normalizedColor)) {
      setError("This colour is already in the palette");
      return;
    }
    
    setError(null);
    setManualColors([...manualColors, normalizedColor]);
  }, [manualColors]);

  const handleRemoveColor = useCallback((index: number) => {
    setManualColors(manualColors.filter((_, i) => i !== index));
  }, [manualColors]);

  const handleColorChange = useCallback((index: number, newColor: string) => {
    // Validate hex color
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexPattern.test(newColor)) {
      setError("Please enter a valid hex colour (e.g., #FF0000)");
      return;
    }
    
    // Normalize to 6-digit hex
    const normalizedColor = newColor.length === 4 
      ? `#${newColor[1]}${newColor[1]}${newColor[2]}${newColor[2]}${newColor[3]}${newColor[3]}`
      : newColor.toUpperCase();
    
    // Check if this color already exists at a different index
    const existingIndex = manualColors.findIndex((c, i) => c === normalizedColor && i !== index);
    if (existingIndex !== -1) {
      setError("This colour is already in the palette");
      return;
    }
    
    setError(null);
    const updatedColors = [...manualColors];
    updatedColors[index] = normalizedColor;
    setManualColors(updatedColors);
  }, [manualColors]);

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
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update palette");
    }
  }, [editingId, editingName, refreshPalettes]);

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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to re-extract colors",
        );
      } finally {
        setIsExtracting(false);
      }
    },
    [refreshPalettes],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Delete this custom palette?")) {
        deleteCustomPalette(id);
        refreshPalettes();
        if (editingId === id) {
          setEditingId(null);
        }
      }
    },
    [editingId, refreshPalettes],
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
          setError(null);
        } else {
          setError(result.error || "Failed to import palette");
        }
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    [refreshPalettes],
  );

  const maxPalettes = getMaxCustomPalettes();
  const isMaxReached = customPalettes.length >= maxPalettes;

  return (
    <div className="space-y-6">
      {/* Canvas Background Option */}
      <div className="bg-theme-panel rounded-lg border border-theme-panel shadow-sm">
        <div className="p-6 border-b border-theme-divider">
          <h3 className="text-base font-semibold text-theme-primary">Canvas background</h3>
          <p className="text-sm text-theme-muted mt-1">
            Control the canvas background colour
          </p>
        </div>
        <div className="p-6">
          <SwitchField>
            <Label>Use black canvas background (#000000)</Label>
            <Switch
              checked={canvasBlackBackground}
              onCheckedChange={handleCanvasBlackBackgroundChange}
            />
          </SwitchField>
          <p className="text-sm text-theme-muted mt-2">
            When enabled, the canvas background will always be black (#000000) regardless of the selected palette.
          </p>
        </div>
      </div>

      {/* Create Palette Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-panel shadow-sm">
        <div className="p-6 border-b border-theme-divider">
          <h3 className="text-base font-semibold text-theme-primary">Create custom palette</h3>
          <p className="text-sm text-theme-muted mt-1">
            Create a palette manually, or extract colours from an image
          </p>
        </div>
        <div className="p-6 space-y-4">
          <ButtonGroup
            value={buttonGroupValue}
            onChange={(value) => {
              setButtonGroupValue(value);
              // Reset colors when switching methods
              if (value !== "custom") {
                setManualColors([]);
              }
              if (value !== "upload" && value !== "url") {
                setExtractedColors([]);
                setImageUrl("");
              }
            }}
            options={[
              { value: "custom", label: "Custom" },
              { value: "upload", label: "Upload" },
              { value: "url", label: "URL" },
              { value: "import", label: "Import" },
            ]}
          />
          
          {buttonGroupValue === "custom" && (
            <div className="space-y-4">
              <Field>
                <Label htmlFor="color-input">Add colour</Label>
                <div data-slot="control" className="flex gap-2 items-center">
                  <input
                    id="color-input"
                    type="color"
                    defaultValue="#000000"
                    onChange={(e) => {
                      if (manualColors.length >= 5) {
                        setError("Palette is limited to 5 colours");
                        return;
                      }
                      const color = e.target.value.toUpperCase();
                      if (!manualColors.includes(color)) {
                        setManualColors([...manualColors, color]);
                        setError(null);
                      } else {
                        setError("This colour is already in the palette");
                      }
                    }}
                    disabled={isMaxReached || manualColors.length >= 5}
                  />
                  <Input
                    type="text"
                    placeholder="#FF0000"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.target as HTMLInputElement;
                        handleAddColor(input.value);
                        input.value = "";
                      }
                    }}
                    disabled={isMaxReached || manualColors.length >= 5}
                    className="flex-1"
                  />
                </div>
              </Field>
              {manualColors.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-theme-primary">
                    Palette colours ({manualColors.length} / 5)
                  </label>
                  <div className="flex flex-wrap items-center gap-2 p-3 border border-theme-panel rounded-lg">
                    {manualColors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className="relative group">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(idx, e.target.value.toUpperCase())}
                            className="w-8 h-8 rounded border border-theme-panel cursor-pointer appearance-none overflow-hidden"
                            style={{ backgroundColor: color }}
                            disabled={isMaxReached}
                            aria-label={`Change colour ${idx + 1}`}
                            title="Click to change colour"
                          />
                          <div className="absolute inset-0 rounded border-2 border-transparent group-hover:border-theme-panel pointer-events-none transition-colors" />
                        </div>
                        <Button
                          type="button"
                          variant="circle"
                          onClick={() => handleRemoveColor(idx)}
                          aria-label={`Remove ${color}`}
                          title="Remove colour"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {manualColors.length >= 5 && (
                    <p className="text-sm text-theme-muted mt-2">
                      Maximum of 5 colours reached
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {buttonGroupValue === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
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
                Upload image
              </Button>
            </div>
          )}
          
          {buttonGroupValue === "url" && (
            <div className="space-y-4">
              <Field>
                <Label htmlFor="image-url">Image URL</Label>
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
              </Field>
              <Button
                type="button"
                size="md"
                variant="outline"
                className="w-full"
                onClick={handleUrlExtract}
                disabled={isMaxReached || isExtracting || !imageUrl.trim()}
              >
                {isExtracting ? "Extracting..." : "Extract colours"}
              </Button>
            </div>
          )}
          
          {buttonGroupValue === "import" && (
            <div className="space-y-4">
              <input
                ref={jsonImportInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportPalette}
                className="hidden"
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
                Import palette JSON
              </Button>
            </div>
          )}
          
          <Field>
            <Label htmlFor="palette-name">Palette name</Label>
            <Input
              id="palette-name"
              type="text"
              placeholder="Enter palette name..."
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              onKeyDown={(e) => {
                const colorsToCheck = buttonGroupValue === "custom" ? manualColors : extractedColors;
                if (e.key === "Enter" && paletteName.trim() && colorsToCheck.length > 0) {
                  handleSave();
                }
              }}
              disabled={isMaxReached}
            />
          </Field>
          
          {(extractedColors.length > 0 || manualColors.length > 0) && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                {(buttonGroupValue === "custom" ? manualColors : extractedColors).map((color, idx) => (
                  <span
                    key={idx}
                    className="w-8 h-8 rounded border border-theme-panel"
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
                Save palette
              </Button>
            </div>
          )}
          
          {isMaxReached && (
            <p className="text-sm text-theme-muted">
              Maximum of {maxPalettes} custom palettes reached
            </p>
          )}
          
          {error && (
            <div className="text-sm text-theme-muted" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Your Custom Palettes Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-panel shadow-sm">
        <div className="p-6 border-b border-theme-divider">
          <h3 className="text-base font-semibold text-theme-primary">
            Your custom palettes ({customPalettes.length} / {maxPalettes})
          </h3>
        </div>
        <div className="p-6">
          {customPalettes.length === 0 ? (
            <p className="text-sm text-theme-muted">No custom palettes.</p>
          ) : (
            <div className="space-y-3">
              {customPalettes.map((palette) => (
                <div
                  key={palette.id}
                  className="flex items-center gap-3 p-3 border border-theme-panel rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    {palette.colors.map((color, idx) => (
                      <span
                        key={idx}
                        className="w-8 h-8 rounded border border-theme-panel"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  {editingId === palette.id ? (
                    <>
                      <div className="flex-1">
                        <Field>
                          <Label htmlFor={`edit-${palette.id}`}>Palette name</Label>
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
                        </Field>
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
                      <span className="flex-1 text-sm font-medium text-theme-primary">
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
                        title="Re-extract colours from image"
                      >
                        Re-extract
                      </Button>
                      )}
                      <Button
                        type="button"
                        size="md"
                        variant="link"
                        onClick={() => handleDelete(palette.id)}
                        className="text-theme-muted"
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
    </div>
  );
}
