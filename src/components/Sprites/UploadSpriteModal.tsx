import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogTitle, DialogBody, DialogActions } from "@/components/ui/dialog";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/fieldset";
import { SwitchField } from "@/components/ui/switch";
import { Switch } from "@/components/ui/switch-adapter";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { validateSvg, extractSpriteNameFromSvg, optimizeSvg } from "@/lib/utils/svgOptimizer";
import { generateSpriteId } from "@/lib/storage/customSpriteStorage";
import type { CustomSprite } from "@/lib/storage/customSpriteStorage";
import { getCollection } from "@/constants/spriteCollections";

interface UploadSpriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sprite: CustomSprite, collectionId: string, useOptimized: boolean) => void;
  availableCollections: Array<{ id: string; name: string }>;
  defaultCollectionId?: string;
  initialMode?: "upload" | "paste";
}

export function UploadSpriteModal({
  isOpen,
  onClose,
  onSave,
  availableCollections,
  defaultCollectionId,
  initialMode = "upload",
}: UploadSpriteModalProps) {
  const [mode, setMode] = useState<"upload" | "paste">(initialMode);
  const [svgContent, setSvgContent] = useState("");
  const [spriteName, setSpriteName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState(defaultCollectionId || availableCollections[0]?.id || "");
  const [optimizeEnabled, setOptimizeEnabled] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedSvg, setOptimizedSvg] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [optimizedPreviewUrl, setOptimizedPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens (only when isOpen changes from false to true)
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened - reset state
      setMode(initialMode);
      setSvgContent("");
      setSpriteName("");
      const firstCollectionId = availableCollections.length > 0 ? availableCollections[0].id : "";
      setSelectedCollectionId(defaultCollectionId || firstCollectionId);
      setOptimizeEnabled(false);
      setOptimizedSvg(null);
      setError(null);
      setPreviewUrl(null);
      setOptimizedPreviewUrl(null);
    } else if (!isOpen && prevIsOpenRef.current) {
      // Modal just closed - clean up blob URLs
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (optimizedPreviewUrl) URL.revokeObjectURL(optimizedPreviewUrl);
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode, defaultCollectionId]);

  // Update preview when SVG content changes
  useEffect(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (svgContent && validateSvg(svgContent)) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [svgContent]);

  // Update optimized preview when optimized SVG changes
  useEffect(() => {
    if (optimizedPreviewUrl) URL.revokeObjectURL(optimizedPreviewUrl);
    if (optimizedSvg) {
      const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setOptimizedPreviewUrl(url);
    } else {
      setOptimizedPreviewUrl(null);
    }
  }, [optimizedSvg]);

  // Auto-extract name from SVG
  useEffect(() => {
    if (svgContent && !spriteName) {
      const extracted = extractSpriteNameFromSvg(svgContent);
      if (extracted) {
        setSpriteName(extracted);
      }
    }
  }, [svgContent, spriteName]);

  // Optimize SVG when checkbox is checked
  useEffect(() => {
    if (optimizeEnabled && svgContent && validateSvg(svgContent)) {
      setIsOptimizing(true);
      optimizeSvg(svgContent)
        .then((result) => {
          setOptimizedSvg(result.optimized);
          setOriginalSize(result.originalSize);
          setOptimizedSize(result.optimizedSize);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Optimization failed");
        })
        .finally(() => {
          setIsOptimizing(false);
        });
    } else {
      setOptimizedSvg(null);
    }
  }, [optimizeEnabled, svgContent]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg')) {
      setError("Please select an SVG file");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setError("Failed to read file");
        return;
      }

      if (!validateSvg(text)) {
        setError("Invalid SVG file");
        return;
      }

      setSvgContent(text);
      if (!spriteName) {
        // Extract name from filename
        const nameWithoutExt = file.name.replace(/\.svg$/i, '');
        setSpriteName(nameWithoutExt);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
    event.target.value = "";
  }, [spriteName]);

  const handlePasteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setSvgContent(text);
    
    if (text && !validateSvg(text)) {
      setError("Invalid SVG code");
    } else {
      setError(null);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!svgContent || !validateSvg(svgContent)) {
      setError("Please provide valid SVG content");
      return;
    }

    if (!spriteName.trim()) {
      setError("Please enter a sprite name");
      return;
    }

    if (!selectedCollectionId) {
      setError("Please select a collection");
      return;
    }

    // Find collection to get existing sprite IDs
    const collection = getCollection(selectedCollectionId);
    
    const existingIds = collection?.sprites?.map((s) => s.id) || [];
    const spriteId = generateSpriteId(spriteName, existingIds);

    const sprite: CustomSprite = {
      id: spriteId,
      name: spriteName.trim(),
      svgContent: svgContent,
      optimizedSvgContent: optimizedSvg || undefined,
      originalSize: new Blob([svgContent], { type: 'text/plain' }).size,
      optimizedSize: optimizedSvg ? optimizedSize : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSave(sprite, selectedCollectionId, optimizeEnabled && !!optimizedSvg);
    onClose();
  }, [svgContent, spriteName, selectedCollectionId, optimizeEnabled, optimizedSvg, originalSize, optimizedSize, onSave, onClose, availableCollections]);

  const reductionPercent = originalSize > 0 && optimizedSize > 0
    ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onClose={onClose} size="2xl">
      <DialogTitle>Add Sprite</DialogTitle>
      <DialogBody>
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => setMode("upload")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              type="button"
              variant={mode === "paste" ? "default" : "outline"}
              onClick={() => setMode("paste")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Paste Code
            </Button>
          </div>

          {/* Upload Mode */}
          {mode === "upload" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose SVG File
              </Button>
            </div>
          )}

          {/* Paste Mode */}
          {mode === "paste" && (
            <Field>
              <Label htmlFor="svg-code">SVG Code</Label>
              <textarea
                ref={textareaRef}
                id="svg-code"
                value={svgContent}
                onChange={handlePasteChange}
                placeholder="Paste SVG code here..."
                className="w-full h-32 px-3 py-2 border border-theme-panel rounded-md bg-theme-select text-theme-primary font-mono text-sm"
              />
            </Field>
          )}

          {/* Sprite Name */}
          <Field>
            <Label htmlFor="sprite-name">Sprite Name</Label>
            <Input
              id="sprite-name"
              type="text"
              value={spriteName}
              onChange={(e) => setSpriteName(e.target.value)}
              placeholder="Enter sprite name..."
            />
          </Field>

          {/* Collection Selection */}
          <Field>
            <Label htmlFor="collection-select">Add to Collection</Label>
            <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
              <SelectTrigger id="collection-select">
                <SelectValue placeholder="Select collection..." />
              </SelectTrigger>
              <SelectContent>
                {availableCollections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Optimization Toggle */}
          <SwitchField>
            <Label>Optimize SVG</Label>
            <Switch
              checked={optimizeEnabled}
              onCheckedChange={setOptimizeEnabled}
            />
          </SwitchField>

          {/* Preview Section */}
          {svgContent && validateSvg(svgContent) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Original Preview */}
                <div>
                  <label className="block text-sm font-medium text-theme-primary">
                    Original
                  </label>
                  <div className="mt-2 aspect-square bg-theme-panel rounded border border-theme-panel flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-theme-subtle text-xs">Loading...</div>
                    )}
                  </div>
                  {originalSize > 0 && (
                    <p className="text-xs text-theme-muted mt-1">
                      {originalSize} bytes
                    </p>
                  )}
                </div>

                {/* Optimized Preview */}
                {optimizeEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-theme-primary">
                      Optimized
                      {isOptimizing && (
                        <Loader2 className="h-3 w-3 inline-block ml-2 animate-spin" />
                      )}
                    </label>
                    <div className="mt-2 aspect-square bg-theme-panel rounded border border-theme-panel flex items-center justify-center overflow-hidden">
                      {optimizedPreviewUrl ? (
                        <img
                          src={optimizedPreviewUrl}
                          alt="Optimized"
                          className="w-full h-full object-contain"
                        />
                      ) : isOptimizing ? (
                        <div className="text-theme-subtle text-xs">Optimizing...</div>
                      ) : (
                        <div className="text-theme-subtle text-xs">No preview</div>
                      )}
                    </div>
                    {optimizedSize > 0 && (
                      <p className="text-xs text-theme-muted mt-1">
                        {optimizedSize} bytes ({reductionPercent > 0 ? `-${reductionPercent}%` : '0%'})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-status-error" role="alert">
              {error}
            </div>
          )}
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!svgContent || !validateSvg(svgContent) || !spriteName.trim() || !selectedCollectionId}
        >
          Add Sprite
        </Button>
      </DialogActions>
    </Dialog>
  );
}

