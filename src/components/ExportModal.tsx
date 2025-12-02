import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Accordion } from "@/components/ui/Accordion";
import { Input } from "@/components/catalyst/input";
import { Label } from "@/components/ui/Label";
import { Settings2, Share2, Copy, Check, Download } from "lucide-react";
import p5 from "p5";
import { exportCanvas, downloadImage, getCanvasFromP5, generateExportFilename, createThumbnail } from "@/lib/services";
import { animateSuccess } from "@/lib/utils/animations";
import type { SpriteController } from "../generator";
// Loop recording uses MediaRecorder on the canvas stream

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordFps, setRecordFps] = useState(30);
  const [recordDuration, setRecordDuration] = useState(3); // seconds
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1); // Store the aspect ratio when locked
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Quick-Current"); // Track selected preset
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const [exportType] = useState<"image" | "movie">("image"); // Movie export not ready yet
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update dimensions when canvas size changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Force update canvas size when modal opens to ensure we have the latest size
      if (p5Instance) {
        const canvas = getCanvasFromP5(p5Instance);
        if (canvas) {
          const actualWidth = canvas.width || currentCanvasSize.width;
          const actualHeight = canvas.height || currentCanvasSize.height;
          setWidth(actualWidth);
          setHeight(actualHeight);
          setAspectRatio(actualWidth / actualHeight);
        } else {
          setWidth(currentCanvasSize.width);
          setHeight(currentCanvasSize.height);
          setAspectRatio(currentCanvasSize.width / currentCanvasSize.height);
        }
      } else {
        setWidth(currentCanvasSize.width);
        setHeight(currentCanvasSize.height);
        setAspectRatio(currentCanvasSize.width / currentCanvasSize.height);
      }
      // Set "Current" as selected by default
      setSelectedPreset("Quick-Current");
    }
  }, [currentCanvasSize, isOpen, p5Instance]);

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
    // Reset share state when modal opens/closes
    if (isOpen) {
      setShareError(null);
      setCopied(false);
      setIsSharing(false);
    }
  }, [isOpen, p5Instance, controller]);

  // Calculate greatest common divisor to simplify aspect ratio
  const gcd = useCallback((a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  }, []);

  // Get simplified aspect ratio as string (e.g., "1:1", "16:9")
  // Returns common aspect ratio names when they match (e.g., "16:9" instead of "1.78:1")
  const getSimplifiedRatio = useCallback((w: number, h: number): string => {
    // Common aspect ratios with their decimal equivalents (within tolerance)
    const commonRatios: Array<{ name: string; ratio: number }> = [
      { name: "16:9", ratio: 16 / 9 },      // ~1.7778
      { name: "21:9", ratio: 21 / 9 },      // ~2.3333
      { name: "16:10", ratio: 16 / 10 },   // 1.6
      { name: "4:3", ratio: 4 / 3 },        // ~1.3333
      { name: "3:2", ratio: 3 / 2 },        // 1.5
      { name: "1:1", ratio: 1 / 1 },        // 1.0
      { name: "9:16", ratio: 9 / 16 },      // ~0.5625 (portrait)
      { name: "2:3", ratio: 2 / 3 },        // ~0.6667 (portrait)
    ];
    
    const currentRatio = w / h;
    const tolerance = 0.01; // 1% tolerance for matching
    
    // Check if current ratio matches any common ratio
    for (const { name, ratio } of commonRatios) {
      if (Math.abs(currentRatio - ratio) < tolerance) {
        return name;
      }
    }
    
    // If no match, calculate simplified ratio as before
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

  // @ts-expect-error - intentionally unused, kept for future use
  const _handleExport = useCallback(async () => {
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

    // Validate dimensions with more detailed error messages
    if (!isFinite(exportWidth) || !isFinite(exportHeight)) {
      setError("Dimensions must be valid numbers");
      return;
    }
    if (exportWidth < 100 || exportWidth > 16384) {
      setError(`Width must be between 100px and 16384px (got ${exportWidth}px)`);
      return;
    }
    if (exportHeight < 100 || exportHeight > 16384) {
      setError(`Height must be between 100px and 16384px (got ${exportHeight}px)`);
      return;
    }
    // Check for reasonable aspect ratio to prevent memory issues
    const aspectRatio = exportWidth / exportHeight;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      setError("Aspect ratio is too extreme. Please use dimensions between 1:10 and 10:1");
      return;
    }
    // Warn about very large exports (but allow them)
    const pixelCount = exportWidth * exportHeight;
    if (pixelCount > 268435456) { // 16384 * 16384
      const sizeMB = (pixelCount * 4 / 1024 / 1024).toFixed(1);
      console.warn(`Large export detected: ${sizeMB}MB. This may take a while.`);
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
      const paletteId = controller?.getState()?.paletteId;
      const dataUrl = await exportCanvas(p5Instance, {
        width: exportWidth,
        height: exportHeight,
        format: "png", // Always use PNG
        scale: Math.min(scale, 3), // Cap at 3x to avoid memory issues
      }, paletteId);

      setExportProgress(75);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Generate filename based on generator settings
      const state = controller?.getState() || null;
      const filename = generateExportFilename(state, exportWidth, exportHeight);

      setExportProgress(90);
      downloadImage(dataUrl, filename);

      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Animate success on export button
      if (exportButtonRef.current) {
        animateSuccess(exportButtonRef.current);
      }
      
      // Resume animation before closing modal
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
      
      // Delay close slightly to show success animation
      await new Promise(resolve => setTimeout(resolve, 300));
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
      if (e.target === e.currentTarget && !isExporting && !isSharing) {
        handleClose();
      }
    },
    [handleClose, isExporting, isSharing],
  );

  const handleShare = useCallback(async () => {
    try {
      if (!p5Instance) {
        setShareError("Canvas not available");
        return;
      }

      setIsSharing(true);
      setShareError(null);

      // Use custom dimensions from advanced options
      const exportWidth = width;
      const exportHeight = height;

      // Validate dimensions
      if (!isFinite(exportWidth) || !isFinite(exportHeight)) {
        setShareError("Dimensions must be valid numbers");
        setIsSharing(false);
        return;
      }
      if (exportWidth < 100 || exportWidth > 16384 || exportHeight < 100 || exportHeight > 16384) {
        setShareError("Dimensions must be between 100px and 16384px");
        setIsSharing(false);
        return;
      }

      // Ensure animation is paused
      if (controller) {
        controller.pauseAnimation();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate scale factor for high-resolution exports
      const currentSize = Math.max(currentCanvasSize.width, currentCanvasSize.height);
      const targetSize = Math.max(exportWidth, exportHeight);
      const scale = targetSize > currentSize * 2 
        ? Math.min(3, Math.ceil(targetSize / currentSize / 1.5))
        : 1;

      // Export canvas at custom dimensions
      const paletteId = controller?.getState()?.paletteId;
      const dataUrl = await exportCanvas(p5Instance, {
        width: exportWidth,
        height: exportHeight,
        format: "png",
        scale: Math.min(scale, 3),
      }, paletteId);

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      if (!blob) {
        setShareError("Failed to create image");
        setIsSharing(false);
        return;
      }

      // Generate filename for share
      const state = controller?.getState() || null;
      const shareFilename = generateExportFilename(state, exportWidth, exportHeight);
      const file = new File([blob], shareFilename, { type: "image/png" });

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Pixli Art",
          text: "Check out this art I created with Pixli!",
          files: [file],
        });
        if (shareButtonRef.current) {
          animateSuccess(shareButtonRef.current);
        }
      } else if (navigator.share) {
        // Fallback: share URL if file sharing not supported
        await navigator.share({
          title: "Pixli Art",
          text: "Check out this art I created with Pixli!",
          url: window.location.href,
        });
        if (shareButtonRef.current) {
          animateSuccess(shareButtonRef.current);
        }
      } else {
        // Fallback: copy image to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopied(true);
          if (copyButtonRef.current) {
            animateSuccess(copyButtonRef.current);
          }
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // If clipboard API fails, fall back to download
          const state = controller?.getState() || null;
          const filename = generateExportFilename(state, exportWidth, exportHeight);
          downloadImage(dataUrl, filename);
          if (shareButtonRef.current) {
            animateSuccess(shareButtonRef.current);
          }
        }
      }

      // Resume animation
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        setShareError(error.message || "Share failed");
      }
      // Resume animation even if share fails
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
    } finally {
      setIsSharing(false);
    }
  }, [p5Instance, controller, width, height, currentCanvasSize]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      if (!p5Instance) {
        setShareError("Canvas not available");
        return;
      }

      setShareError(null);

      // Use custom dimensions from advanced options
      const exportWidth = width;
      const exportHeight = height;

      // Validate dimensions
      if (!isFinite(exportWidth) || !isFinite(exportHeight)) {
        setShareError("Dimensions must be valid numbers");
        return;
      }
      if (exportWidth < 100 || exportWidth > 16384 || exportHeight < 100 || exportHeight > 16384) {
        setShareError("Dimensions must be between 100px and 16384px");
        return;
      }

      // Ensure animation is paused
      if (controller) {
        controller.pauseAnimation();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate scale factor for high-resolution exports
      const currentSize = Math.max(currentCanvasSize.width, currentCanvasSize.height);
      const targetSize = Math.max(exportWidth, exportHeight);
      const scale = targetSize > currentSize * 2 
        ? Math.min(3, Math.ceil(targetSize / currentSize / 1.5))
        : 1;

      // Export canvas at custom dimensions
      const paletteId = controller?.getState()?.paletteId;
      const dataUrl = await exportCanvas(p5Instance, {
        width: exportWidth,
        height: exportHeight,
        format: "png",
        scale: Math.min(scale, 3),
      }, paletteId);

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      if (!blob) {
        setShareError("Failed to create image");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setCopied(true);
      if (copyButtonRef.current) {
        animateSuccess(copyButtonRef.current);
      }
      setTimeout(() => setCopied(false), 2000);

      // Resume animation
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
    } catch (error) {
      setShareError(
        error instanceof Error
          ? error.message
          : "Failed to copy to clipboard"
      );
      // Resume animation even if copy fails
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
    }
    }
  }, [p5Instance, controller, width, height, currentCanvasSize]);

  const handleQuickDownload = useCallback(async () => {
    if (!p5Instance) {
      setError("Canvas not available");
      return;
    }

    // Use custom dimensions from advanced options
    const exportWidth = width;
    const exportHeight = height;

    // Validate dimensions
    if (!isFinite(exportWidth) || !isFinite(exportHeight)) {
      setError("Dimensions must be valid numbers");
      return;
    }
    if (exportWidth < 100 || exportWidth > 16384 || exportHeight < 100 || exportHeight > 16384) {
      setError("Dimensions must be between 100px and 16384px");
      return;
    }

    try {
      // Ensure animation is paused
      if (controller) {
        controller.pauseAnimation();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate scale factor for high-resolution exports
      const currentSize = Math.max(currentCanvasSize.width, currentCanvasSize.height);
      const targetSize = Math.max(exportWidth, exportHeight);
      const scale = targetSize > currentSize * 2 
        ? Math.min(3, Math.ceil(targetSize / currentSize / 1.5))
        : 1;
      
      // Export canvas at custom dimensions
      const paletteId = controller?.getState()?.paletteId;
      const dataUrl = await exportCanvas(p5Instance, {
        width: exportWidth,
        height: exportHeight,
        format: "png",
        scale: Math.min(scale, 3),
      }, paletteId);

      // Generate filename based on generator settings
      const state = controller?.getState() || null;
      const filename = generateExportFilename(state, exportWidth, exportHeight);
      downloadImage(dataUrl, filename);
      if (exportButtonRef.current) {
        animateSuccess(exportButtonRef.current);
      }

      // Resume animation
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to download image");
      // Resume animation even if download fails
      if (controller && wasAnimatingRef.current) {
        controller.resumeAnimation();
        wasAnimatingRef.current = false;
    }
    }
  }, [p5Instance, controller, width, height, currentCanvasSize]);

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
          <h2 className="export-modal-title">Export canvas</h2>
          <button
            type="button"
            className="preset-manager-close"
            onClick={handleClose}
            disabled={isExporting}
            aria-label="Close export modal"
          >
            ×
          </button>
        </div>

        <div className="export-modal-content">
          {/* <div className="mb-4">
            <ButtonGroup
              value={exportType}
              onChange={(value) => setExportType(value as "image" | "movie")}
              options={[
                { value: "image", label: "Image" },
                { value: "movie", label: "Movie" },
              ]}
            />
          </div> */}
          {exportType === "image" && (
            <div>
                {/* Compact Preview & Quick Actions */}
                <div className="export-quick-section mb-4">
                  <div className="export-preview-compact">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt="Canvas preview"
                        className="export-thumbnail-compact"
                      />
                    ) : (
                      <div className="export-thumbnail-placeholder-compact" aria-label="Loading preview"></div>
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
                <Accordion type="single" collapsible className="export-accordion mb-4">
                  <Accordion.Item value="advanced" className="export-accordion-item">
                    <Accordion.Header>
                      <Settings2 className="export-accordion-icon" />
                      <span>Advanced options</span>
                    </Accordion.Header>
                    <Accordion.Content className="mb-0 pb-0">
                    {/* Dimensions */}
                    <div className="section">
                      <div className="field-heading">
                        <span className="section-title">Dimensions</span>
                      </div>
                      <div className="control-field mt-3">
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
                      <div className="export-presets-compact mt-3">
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
                                    size="md"
                                    onClick={() => handlePresetSelect(preset, presetKey)}
                                    disabled={isExporting}
                                    title={preset.label}
                                    className="export-preset-button-compact"
                                    aria-label={`Select ${preset.label} preset (${preset.width}x${preset.height}px)`}
                                    aria-pressed={isSelected}
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
                    <div className="export-file-size-compact mt-2">
                      ~{fileSizeEstimate}
                      {isLargeExport && <span className="export-warning-compact"> · Large export</span>}
                    </div>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion>

                {/* Share & Download Actions */}
                <div className="section">
                  <div className="export-actions">
                    {typeof navigator.share !== "undefined" && (
                    <Button
                        ref={shareButtonRef}
                      type="button"
                        size="md"
                      variant="outline"
                        onClick={handleShare}
                        disabled={isSharing || !p5Instance}
                        className="export-action-button"
                      >
                        <Share2 className="h-4 w-4" />
                        {isSharing ? "Sharing..." : "Share"}
                      </Button>
                    )}

                    {typeof navigator.clipboard !== "undefined" && typeof ClipboardItem !== "undefined" && (
                      <Button
                        ref={copyButtonRef}
                        type="button"
                      size="md"
                        variant="outline"
                        onClick={handleCopyToClipboard}
                        disabled={!p5Instance}
                        className="export-action-button"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy image
                          </>
                        )}
                    </Button>
                    )}

                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      onClick={handleQuickDownload}
                      disabled={!p5Instance}
                      className="export-action-button"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  {(shareError || error) && (
                    <div className="export-error mt-2" role="alert">
                      {shareError || error}
                    </div>
                  )}
                </div>
            </div>
          )}
          {exportType === "movie" && (
            <div>
                {/* Looping Video Export */}
                <div className="section">
                  <div className="field-heading">
                    <span className="section-title">Seamless loop (WebM)</span>
                  </div>
                  <div className="export-dimension-inputs-compact items-center gap-3 mt-3">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="export-fps">Frames per second</Label>
                      <Input
                        id="export-fps"
                        type="number"
                        min={1}
                        max={120}
                        value={recordFps}
                        onChange={(e) =>
                          setRecordFps(Math.max(1, Math.min(120, parseInt(e.target.value) || 30)))
                        }
                        placeholder="30"
                        aria-label="Frames per second"
                      />
                    </div>
                    <span className="export-dimension-separator-compact mx-[theme(spacing.2)]">×</span>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="export-seconds">Duration (seconds)</Label>
                      <Input
                        id="export-seconds"
                        type="number"
                        min={1}
                        max={20}
                        value={recordDuration}
                        onChange={(e) =>
                          setRecordDuration(Math.max(1, Math.min(20, parseInt(e.target.value) || 3)))
                        }
                        placeholder="3"
                        aria-label="Duration in seconds"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="md"
                    variant="default"
                    onClick={async () => {
                        try {
                        if (typeof MediaRecorder === "undefined") {
                          setError("Recording is not supported in this browser.");
                          return;
                        }
                        if (!window.isSecureContext) {
                          setError("Recording requires a secure context (HTTPS or localhost).");
                          return;
                        }
                        if (!p5Instance) {
                            setError("Canvas not available");
                            return;
                          }
                          const canvas = getCanvasFromP5(p5Instance);
                          if (!canvas) {
                            setError("Canvas not found");
                            return;
                          }
                        const fps = Math.max(1, Math.min(120, recordFps));
                        const duration = Math.max(1, Math.min(20, recordDuration));
                        const stream = (canvas as HTMLCanvasElement).captureStream?.(fps);
                        if (!stream) {
                          setError("Failed to capture canvas stream.");
                          return;
                        }
                        const mimeCandidates = [
                          "video/webm;codecs=vp9",
                          "video/webm;codecs=vp8",
                          "video/webm",
                        ];
                        const mime = mimeCandidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
                        if (!mime) {
                          setError("No supported WebM codec found for recording.");
                          return;
                        }
                        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
                          const chunks: BlobPart[] = [];
                        // Deterministic frame stepping to guarantee seamless loop
                        const totalFrames = Math.max(1, Math.floor(fps * duration));
                        let frameIndex = 0;
                        let stepTimer: number | null = null;
                          recorder.ondataavailable = (e) => {
                            if (e.data && e.data.size > 0) chunks.push(e.data);
                          };
                          recorder.onstop = () => {
                            const blob = new Blob(chunks, { type: mime });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
                          a.download = `pixli-seamless-loop-${currentCanvasSize.width}x${currentCanvasSize.height}-${fps}fps-${duration}s-${timestamp}.webm`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            setIsRecording(false);
                            // Disable loop override
                            // @ts-ignore
                            controller?.__setLoopMode(false);
                          // @ts-ignore
                          controller?.__clearLoopFrame?.();
                          if (stepTimer !== null) {
                            window.clearInterval(stepTimer);
                          }
                          };
                          // Enable loop override to keep motion periodic over period seconds
                          // @ts-ignore
                          controller?.__setLoopMode(true, duration);
                        // Enable deterministic frame stepping for perfect loop alignment
                        // @ts-ignore
                        controller?.__setLoopFrame?.(0, totalFrames);
                        stepTimer = window.setInterval(() => {
                          frameIndex = (frameIndex + 1) % totalFrames;
                          // @ts-ignore
                          controller?.__setLoopFrame?.(frameIndex, totalFrames);
                        }, Math.max(4, Math.floor(1000 / fps)));
                          setIsRecording(true);
                        try {
                          recorder.start();
                        } catch (recErr) {
                          setIsRecording(false);
                          // @ts-ignore
                          controller?.__setLoopMode(false);
                          // @ts-ignore
                          controller?.__clearLoopFrame?.();
                          throw recErr instanceof Error ? recErr : new Error("Unable to start recorder.");
                        }
                          // Stop after duration seconds
                          setTimeout(() => {
                            try {
                              recorder.stop();
                            } catch {}
                          }, duration * 1000);
                        } catch (err) {
                        console.error(err);
                        const message = err instanceof Error ? err.message : "Unknown error";
                        setError(`Failed to record video: ${message}`);
                          setIsRecording(false);
                          // @ts-ignore
                          controller?.__setLoopMode(false);
                        // @ts-ignore
                        controller?.__clearLoopFrame?.();
                        }
                      }}
                    disabled={!p5Instance || isExporting || isRecording}
                    aria-label="Export seamless looping video"
                    title="Export seamless looping video (WebM)"
                    className="export-button-full-width mt-[theme(spacing.4)]"
                  >
                    {isRecording ? "Recording..." : "Export seamless loop"}
                  </Button>
                  <div className="text-xs text-theme-muted mt-2">
                    Tip: Exports a seamless loop by syncing animation time to your chosen duration and FPS.
                  </div>
                </div>
            </div>
          )}

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

