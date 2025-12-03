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
  const stateIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // Create a stable identifier for the state
  const stateId = JSON.stringify(state);

  useEffect(() => {
    // Don't re-initialize if we already have a thumbnail for this state
    if (stateIdRef.current === stateId && thumbnail) {
      return;
    }

    // Prevent concurrent initializations
    if (isInitializingRef.current) {
      return;
    }

    if (!containerRef.current) return;

    // Mark as initializing
    isInitializingRef.current = true;
    stateIdRef.current = stateId;

    // Reset loading state
    setIsLoading(true);
    setThumbnail(null);

    // Create a hidden container for the preview
    const container = containerRef.current;
    // Use 2x size for better thumbnail quality
    const containerSize = size * 2;
    
    // Ensure container has explicit dimensions and is properly contained
    container.style.width = `${containerSize}px`;
    container.style.height = `${containerSize}px`;
    container.style.position = "absolute";
    container.style.opacity = "0";
    container.style.pointerEvents = "none";
    container.style.top = "0";
    container.style.left = "0";
    container.style.zIndex = "-1";
    container.style.overflow = "hidden";
    
    // Wait for container to be laid out
    const checkLayout = () => {
      const rect = container.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    const initController = () => {
      // Check if container is properly laid out
      if (!checkLayout()) {
        // Retry after a short delay
        setTimeout(() => {
          if (checkLayout()) {
            initController();
          } else {
            console.warn("SceneThumbnail: Container not laid out, cannot initialize");
            setIsLoading(false);
          }
        }, 100);
        return;
      }

      try {
        // Validate state
        if (!state) {
          console.error("SceneThumbnail: Invalid state provided");
          setIsLoading(false);
          return;
        }

        // Create sprite controller
        const controller = createSpriteController(container, {
          onStateChange: () => {},
        });

        // Apply the scene state
        controller.applyState(state);
        
        // Set custom aspect ratio to square (1:1) after applying state
        controller.setCustomAspectRatio(containerSize, containerSize);

        // Disable animation for static thumbnail
        controller.setAnimationEnabled(false);
        
        // Pause animation to ensure we capture a static frame
        controller.pauseAnimation();

        controllerRef.current = controller;

        // Wait for p5 to initialize and then capture
        let captured = false;
        let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;
        let pollInterval: ReturnType<typeof setInterval> | null = null;
        
        const attemptCapture = () => {
          if (captured) return true;
          
          try {
            const p5Instance = controller.getP5Instance();
            if (!p5Instance) {
              return false;
            }
            
            const canvas = getCanvasFromP5(p5Instance);
            if (!canvas) {
              return false;
            }
            
            // Check if canvas has valid dimensions
            if (canvas.width === 0 || canvas.height === 0) {
              return false;
            }
            
            // Canvas is ready - force multiple redraws to ensure content is rendered
            if ('redraw' in p5Instance && typeof p5Instance.redraw === 'function') {
              p5Instance.redraw();
              // Request another redraw after a short delay to ensure sprites are drawn
              setTimeout(() => {
                p5Instance.redraw();
              }, 50);
            }
            
            // Wait for redraw to complete, then capture
            if (cleanupTimeout) clearTimeout(cleanupTimeout);
            cleanupTimeout = setTimeout(() => {
              if (captured) return; // Already captured
              
              try {
                const p5Instance = controller.getP5Instance();
                const canvasToCapture = p5Instance ? getCanvasFromP5(p5Instance) : null;
                if (!canvasToCapture || canvasToCapture.width === 0 || canvasToCapture.height === 0) {
                  console.warn("SceneThumbnail: Canvas invalid during capture");
                  return;
                }
                
                const thumb = createThumbnail(canvasToCapture, size);
                if (thumb && thumb.length > 0) {
                  setThumbnail(thumb);
                  setIsLoading(false);
                  captured = true;
                  isInitializingRef.current = false; // Mark initialization complete
                  
                  // Clean up polling and controller after capture
                  if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                  }
                  
                  // Destroy controller after successful capture to free resources
                  if (controllerRef.current) {
                    setTimeout(() => {
                      if (controllerRef.current) {
                        controllerRef.current.destroy();
                        controllerRef.current = null;
                      }
                    }, 100);
                  }
                } else {
                  console.warn("SceneThumbnail: Empty thumbnail data generated");
                  isInitializingRef.current = false;
                }
              } catch (error) {
                console.error("SceneThumbnail: Error creating thumbnail:", error);
                setIsLoading(false);
                isInitializingRef.current = false;
              }
            }, 200); // Wait longer for redraws to complete
            
            return true; // Canvas is ready, capture initiated
          } catch (error) {
            console.error("SceneThumbnail: Error checking canvas:", error);
            return false;
          }
        };
        
        // Start polling after a short delay
        const startPolling = () => {
          // Try once immediately
          if (attemptCapture()) {
            return;
          }
          
          // Poll every 100ms
          let attempts = 0;
          const maxAttempts = 80; // 8 seconds total
          
          pollInterval = setInterval(() => {
            if (captured) {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              return;
            }
            
            attempts++;
            if (attemptCapture()) {
              // Capture initiated, wait for it to complete
              return;
            }
            
            if (attempts >= maxAttempts) {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              
              console.warn(`SceneThumbnail: Max attempts (${maxAttempts}) reached`);
              setIsLoading(false);
              isInitializingRef.current = false;
            }
          }, 100);
        };
        
        // Wait 800ms for controller to initialize, then start polling
        const initialDelay = setTimeout(() => {
          startPolling();
        }, 800);

        return () => {
          clearTimeout(initialDelay);
          if (cleanupTimeout) {
            clearTimeout(cleanupTimeout);
          }
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          if (controllerRef.current) {
            controllerRef.current.destroy();
            controllerRef.current = null;
          }
          isInitializingRef.current = false;
        };
      } catch (error) {
        console.error("SceneThumbnail: Failed to initialize controller:", error);
        setIsLoading(false);
        isInitializingRef.current = false;
        return () => {
          if (controllerRef.current) {
            controllerRef.current.destroy();
            controllerRef.current = null;
          }
        };
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      // Double RAF to ensure layout is complete
      requestAnimationFrame(() => {
        initController();
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, [stateId, size]);

  return (
    <div 
      className="relative" 
      style={{ 
        width: size, 
        height: size, 
        overflow: "hidden",
        contain: "layout style paint"
      }}
    >
      {/* Hidden container for canvas rendering - clipped by parent overflow */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          opacity: 0,
          width: `${size * 2}px`,
          height: `${size * 2}px`,
          pointerEvents: "none",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
      
      {/* Display thumbnail or placeholder */}
      {isLoading ? (
        <div
          className="flex items-center justify-center bg-theme-panel rounded border border-theme-panel"
          style={{ width: size, height: size }}
        >
          <div 
            className="border-2 border-theme-subtle border-t-theme-primary rounded-full animate-spin"
            style={{ 
              width: Math.max(12, size * 0.2), 
              height: Math.max(12, size * 0.2),
            }}
            aria-label="Loading"
          />
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
    </div>
  );
}

