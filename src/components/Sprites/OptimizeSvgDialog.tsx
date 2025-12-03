import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogBody, DialogActions } from "@/components/ui/dialog";
import { Button } from "@/components/Button";
import { Label } from "@/components/ui/fieldset";
import { Loader2 } from "lucide-react";
import { optimizeSvg } from "@/lib/utils/svgOptimizer";

interface OptimizeSvgDialogProps {
  isOpen: boolean;
  onClose: () => void;
  svgContent: string;
  onUseOptimized: (optimized: string) => void;
  onUseOriginal: () => void;
}

export function OptimizeSvgDialog({
  isOpen,
  onClose,
  svgContent,
  onUseOptimized,
  onUseOriginal,
}: OptimizeSvgDialogProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [optimizedPreviewUrl, setOptimizedPreviewUrl] = useState<string | null>(null);

  // Optimize on open
  useEffect(() => {
    if (isOpen && svgContent) {
      setIsOptimizing(true);
      setError(null);
      
      optimizeSvg(svgContent)
        .then((result) => {
          setOptimized(result.optimized);
          setOriginalSize(result.originalSize);
          setOptimizedSize(result.optimizedSize);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Optimization failed");
        })
        .finally(() => {
          setIsOptimizing(false);
        });
    }
  }, [isOpen, svgContent]);

  // Create preview URLs
  useEffect(() => {
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setOriginalPreviewUrl(url);
    }

    return () => {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    };
  }, [svgContent]);

  useEffect(() => {
    if (optimizedPreviewUrl) URL.revokeObjectURL(optimizedPreviewUrl);
    if (optimized) {
      const blob = new Blob([optimized], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setOptimizedPreviewUrl(url);
    }

    return () => {
      if (optimizedPreviewUrl) URL.revokeObjectURL(optimizedPreviewUrl);
    };
  }, [optimized]);

  const reductionPercent = originalSize > 0 && optimizedSize > 0
    ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
    : 0;

  const handleUseOptimized = () => {
    if (optimized) {
      onUseOptimized(optimized);
      onClose();
    }
  };

  const handleUseOriginal = () => {
    onUseOriginal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="2xl">
      <DialogTitle>Optimize SVG</DialogTitle>
      <DialogBody>
        <div className="space-y-6">
          {isOptimizing ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-theme-subtle" />
                <p className="text-theme-muted">Optimizing SVG...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-sm text-status-error" role="alert">
              {error}
            </div>
          ) : (
            <>
              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div>
                  <Label>Original</Label>
                  <div className="mt-2 aspect-square bg-theme-panel rounded border border-theme-panel flex items-center justify-center overflow-hidden">
                    {originalPreviewUrl ? (
                      <img
                        src={originalPreviewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-theme-subtle text-xs">Loading...</div>
                    )}
                  </div>
                  <p className="text-xs text-theme-muted mt-1">
                    {originalSize} bytes
                  </p>
                </div>

                {/* Optimized */}
                <div>
                  <Label>Optimized</Label>
                  <div className="mt-2 aspect-square bg-theme-panel rounded border border-theme-panel flex items-center justify-center overflow-hidden">
                    {optimizedPreviewUrl ? (
                      <img
                        src={optimizedPreviewUrl}
                        alt="Optimized"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-theme-subtle text-xs">No preview</div>
                    )}
                  </div>
                  <p className="text-xs text-theme-muted mt-1">
                    {optimizedSize} bytes
                    {reductionPercent > 0 && (
                      <span className="text-status-success ml-1">
                        (-{reductionPercent}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Stats */}
              {reductionPercent > 0 && (
                <div className="bg-status-success border border-status-success rounded-lg p-4">
                  <p className="text-sm text-status-success">
                    Optimization reduced file size by <strong>{reductionPercent}%</strong> ({originalSize - optimizedSize} bytes saved)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="outline" onClick={handleUseOriginal}>
          Use Original
        </Button>
        <Button
          onClick={handleUseOptimized}
          disabled={!optimized || isOptimizing}
        >
          Use Optimized
        </Button>
      </DialogActions>
    </Dialog>
  );
}

