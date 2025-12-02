import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import { createThumbnail, getCanvasFromP5 } from "@/lib/services/exportService";
import type { GeneratorState } from "@/types/generator";

interface SceneThumbnailProps {
  state: GeneratorState;
  size?: number;
}

export function SceneThumbnail({ state, size = 80 }: SceneThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createSpriteController> | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a hidden container for the preview
    const container = containerRef.current;
    
    // Create sprite controller
    const controller = createSpriteController(container, {
      onStateChange: () => {},
    });

    // Apply the scene state
    controller.applyState(state);
    
    // Set custom aspect ratio to square (1:1) after applying state
    controller.setCustomAspectRatio(size * 2, size * 2);

    controllerRef.current = controller;

    // Wait a bit for the canvas to render, then capture thumbnail
    const timeoutId = setTimeout(() => {
      try {
        const p5Instance = controller.getP5Instance();
        if (p5Instance) {
          const canvas = getCanvasFromP5(p5Instance);
          if (canvas) {
            const thumb = createThumbnail(canvas, size);
            setThumbnail(thumb);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to create thumbnail:", error);
        setIsLoading(false);
      }
    }, 800); // Wait 800ms for rendering

    return () => {
      clearTimeout(timeoutId);
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [state, size]);

  return (
    <>
      {/* Hidden container for canvas rendering */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          width: `${size * 2}px`,
          height: `${size * 2}px`,
          pointerEvents: "none",
        }}
      />
      
      {/* Display thumbnail or placeholder */}
      {isLoading ? (
        <div
          className="flex items-center justify-center bg-theme-panel rounded border border-theme-panel"
          style={{ width: size, height: size }}
        >
          <div className="text-xs text-theme-subtle">Loading...</div>
        </div>
      ) : thumbnail ? (
        <img
          src={thumbnail}
          alt="Scene preview"
          className="rounded border border-theme-panel"
          style={{ width: size, height: size, objectFit: "cover" }}
        />
      ) : (
        <div
          className="flex items-center justify-center bg-theme-panel rounded border border-theme-panel"
          style={{ width: size, height: size }}
        >
          <div className="text-xs text-theme-subtle">No preview</div>
        </div>
      )}
    </>
  );
}

