import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Accordion } from "@/components/retroui/Accordion";
import { X, Settings2 } from "lucide-react";
import p5 from "p5";
import { exportCanvas, downloadImage, createThumbnail, getCanvasFromP5 } from "@/lib/services";
import type { SpriteController } from "../generator";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  p5Instance: p5 | null;
  currentCanvasSize: { width: number; height: number };
  controller: SpriteController | null;
}

/**
 * Dimension presets for common export sizes
 * Organized by category for better UX
 */
const DIMENSION_PRESETS = {
  "Quick": [
    { label: "Current", width: 0, height: 0 }, // Special: uses current canvas size
  ],
  "Social": [
    { label: "Instagram Post", width: 1080, height: 1080 },
    { label: "Instagram Story", width: 1080, height: 1920 },
    { label: "Twitter/X", width: 1200, height: 675 },
    { label: "Facebook", width: 1200, height: 630 },
  ],
  "Wallpapers": [
    { label: "HD", width: 1920, height: 1080 },
    { label: "4K", width: 3840, height: 2160 },
    { label: "5K", width: 5120, height: 2880 },
    { label: "8K", width: 7680, height: 4320 },
  ],
  "Print": [
    { label: "A4 (300 DPI)", width: 2480, height: 3508 },
    { label: "Square Print", width: 3000, height: 3000 },
  ],
} as const;

export const ExportModal = ({
  isOpen,
  onClose,
  p5Instance,
  currentCanvasSize,
  controller,
}: ExportModalProps) => {
  const [width, setWidth] = useState(currentCanvasSize.width);
  const [height, setHeight] = useState(currentCanvasSize.height);
  const wasAnimatingRef = useRef(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1); // Store the aspect ratio when locked
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Quick-Current"); // Track selected preset

  // Update dimensions when canvas size changes
  useEffect(() => {
    if (isOpen) {
      setWidth(currentCanvasSize.width);
      setHeight(currentCanvasSize.height);
      // Update aspect ratio based on current canvas (should be 1:1 for square canvas)
      setAspectRatio(currentCanvasSize.width / currentCanvasSize.height);
      // Set "Current" as selected by default
      setSelectedPreset("Quick-Current");
    }
  }, [currentCanvasSize, isOpen]);

  // Handle width change with aspect ratio lock
  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (lockAspectRatio && aspectRatio > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  }, [lockAspectRatio, aspectRatio]);

  // Handle height change with aspect ratio lock
  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight);
    if (lockAspectRatio && aspectRatio > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  }, [lockAspectRatio, aspectRatio]);

  // Generate thumbnail when modal opens and pause animation
  useEffect(() => {
    if (isOpen && p5Instance && controller) {
      // Pause animation when modal opens
      wasAnimatingRef.current = true; // Assume it was animating
      controller.pauseAnimation();
      
      try {
        const canvas = getCanvasFromP5(p5Instance);
        if (canvas) {
          const thumb = createThumbnail(canvas, 160);
          setThumbnail(thumb);
        }
      } catch (err) {
        console.error("Failed to create thumbnail:", err);
      }
    } else if (!isOpen && controller && wasAnimatingRef.current) {
      // Resume animation when modal closes
      controller.resumeAnimation();
      wasAnimatingRef.current = false;
    }
  }, [isOpen, p5Instance, controller]);

  // Calculate greatest common divisor to simplify aspect ratio
  const gcd = useCallback((a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  }, []);

  // Get simplified aspect ratio as string (e.g., "1:1", "16:9")
  const getSimplifiedRatio = useCallback((w: number, h: number): string => {
    const divisor = gcd(w, h);
    const simplifiedW = w / divisor;
    const simplifiedH = h / divisor;
    // Limit to reasonable values (e.g., if ratio is very large, show decimal)
    if (simplifiedW > 100 || simplifiedH > 100) {
      return `${(w / h).toFixed(2)}:1`;
    }
    return `${simplifiedW}:${simplifiedH}`;
  }, [gcd]);

  const handlePresetSelect = useCallback((preset: { width: number; height: number; label: string }, presetKey: string) => {
    setSelectedPreset(presetKey);
    if (preset.width === 0 && preset.height === 0) {
      // "Current" preset - use current canvas size
      setWidth(currentCanvasSize.width);
      setHeight(currentCanvasSize.height);
      setAspectRatio(currentCanvasSize.width / currentCanvasSize.height);
    } else {
      setWidth(preset.width);
      setHeight(preset.height);
      // Update aspect ratio when preset is selected
      setAspectRatio(preset.width / preset.height);
    }
  }, [currentCanvasSize]);

  const handleExport = useCallback(async () => {
    if (!p5Instance) {
      setError("Canvas not available");
      return;
    }

    // Get canvas reference before any async operations
    const canvas = getCanvasFromP5(p5Instance);
    if (!canvas) {
      setError("Canvas not found");
      return;
    }

    // Use current canvas size for quick export, or custom dimensions for advanced
    // For now, always use custom dimensions when advanced options are available
    const exportWidth = width;
    const exportHeight = height;

    // Validate dimensions
    if (exportWidth < 100 || exportWidth > 16384 || exportHeight < 100 || exportHeight > 16384) {
      setError("Dimensions must be between 100px and 16384px");
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      // Ensure animation is paused and wait for redraw to complete
      if (controller) {
        controller.pauseAnimation();
        // Wait a bit to ensure the canvas is stable after pausing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // For high-resolution exports, we use a scale factor to render at higher quality
      // The export service will scale up the canvas with high-quality smoothing
      // For best results, we scale based on how much larger the export is than the source
      const currentSize = Math.max(currentCanvasSize.width, currentCanvasSize.height);
      const targetSize = Math.max(exportWidth, exportHeight);
      // Use scale factor of 2-3x for very large exports to ensure smooth rendering
      // This helps prevent jaggies when scaling up significantly
      const scale = targetSize > currentSize * 2 
        ? Math.min(3, Math.ceil(targetSize / currentSize / 1.5))
        : 1;
      
      // Simulate progress for large exports
      if (targetSize > 4000) {
        setExportProgress(25);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setExportProgress(50);
      const dataUrl = await exportCanvas(p5Instance, {
        width: exportWidth,
        height: exportHeight,
        format: "png", // Always use PNG
        scale: Math.min(scale, 3), // Cap at 3x to avoid memory issues
      });

      setExportProgress(75);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const filename = `bitlab-export-${exportWidth}x${exportHeight}-${timestamp}.png`;

      setExportProgress(90);
      downloadImage(dataUrl, filename);

      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Resume animation before closing modal
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      console.error("Export error:", err);
      // Resume animation even if export fails
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [p5Instance, width, height, currentCanvasSize, controller, onClose]);

  const handleClose = useCallback(() => {
    if (!isExporting && controller) {
      // Resume animation when closing
      controller.resumeAnimation();
      wasAnimatingRef.current = false;
    }
    onClose();
  }, [onClose, isExporting, controller]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isExporting) {
        handleClose();
      }
    },
    [handleClose, isExporting],
  );

  if (!isOpen) {
    return null;
  }

  const isLargeExport = Math.max(width, height) > 4000;
  const pixelCount = width * height;
  const fileSizeEstimate = `${(pixelCount * 4 / 1024 / 1024).toFixed(1)} MB`;

  // Quick export uses current canvas size
  const quickExportSize = currentCanvasSize;

  return (
    <div className="export-modal-overlay" onClick={handleOverlayClick}>
      <Card className="export-modal export-modal--compact" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2 className="export-modal-title">Export Canvas</h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClose}
            disabled={isExporting}
            aria-label="Close"
            className="export-modal-close"
          >
            <X />
          </Button>
        </div>

        <div className="export-modal-content">
          {/* Compact Preview & Quick Export */}
          <div className="export-quick-section">
            <div className="export-preview-compact">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Canvas preview"
                  className="export-thumbnail-compact"
                />
              ) : (
                <div className="export-thumbnail-placeholder-compact">Loading...</div>
              )}
              <div className="export-quick-info">
                <div className="export-quick-size">
                  {quickExportSize.width} × {quickExportSize.height}px
                </div>
                <div className="export-quick-format">
                  PNG
                </div>
                <div className="export-quick-size-label">Current size</div>
              </div>
            </div>
          </div>

          {/* Advanced Options Accordion */}
          <Accordion type="single" collapsible className="export-accordion">
            <Accordion.Item value="advanced">
              <Accordion.Header>
                <Settings2 className="export-accordion-icon" />
                <span>Advanced Options</span>
              </Accordion.Header>
              <Accordion.Content>
              {/* Dimensions */}
              <div className="section">
                <div className="field-heading">
                  <span className="section-title">Dimensions</span>
                </div>
                <div className="control-field">
                  <div className="field-heading">
                    <span className="field-label">Size</span>
                  </div>
                  <div className="export-dimension-inputs-compact">
                    <input
                      type="number"
                      className="preset-name-input"
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      min={100}
                      max={16384}
                      disabled={isExporting}
                      placeholder="Width"
                    />
                    <span className="export-dimension-separator-compact">×</span>
                    <input
                      type="number"
                      className="preset-name-input"
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      min={100}
                      max={16384}
                      disabled={isExporting}
                      placeholder="Height"
                    />
                  </div>
                  <div className="export-aspect-ratio-control">
                    <input
                      type="checkbox"
                      id="aspect-ratio-lock"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      disabled={isExporting}
                      className="export-aspect-ratio-checkbox"
                    />
                    <label htmlFor="aspect-ratio-lock" className="export-aspect-ratio-label">
                      Lock aspect ratio to {getSimplifiedRatio(width, height)}
                    </label>
                  </div>
                </div>

                {/* Presets - Compact Grid */}
                <div className="export-presets-compact">
                  {Object.entries(DIMENSION_PRESETS).map(([category, presets]) => (
                    <div key={category} className="export-preset-category">
                      <div className="export-preset-category-label">{category}</div>
                      <div className="export-presets-row">
                        {presets.map((preset) => {
                          const presetKey = `${category}-${preset.label}`;
                          const isSelected = selectedPreset === presetKey;
                          return (
                            <Button
                              key={presetKey}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePresetSelect(preset, presetKey)}
                              disabled={isExporting}
                              title={preset.label}
                              className="export-preset-button-compact"
                            >
                              {preset.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File size estimate */}
              <div className="export-file-size-compact">
                ~{fileSizeEstimate}
                {isLargeExport && <span className="export-warning-compact"> · Large export</span>}
              </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>

          {/* Export Button */}
          <Button
            type="button"
            variant="default"
            size="md"
            onClick={handleExport}
            disabled={isExporting || !p5Instance}
            className="export-button-full-width"
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>

          {/* Progress */}
          {isExporting && (
            <div className="export-progress-compact">
              <div className="export-progress-bar-compact">
                <div
                  className="export-progress-fill-compact"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="export-progress-text-compact">
                {exportProgress}%
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="export-error-compact" role="alert">
              {error}
            </div>
          )}
        </div>

      </Card>
    </div>
  );
};

