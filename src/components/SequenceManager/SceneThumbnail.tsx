import { useEffect, useRef, useState, memo } from "react";
import { createSpriteController } from "@/generator";
import { createThumbnail, getCanvasFromP5 } from "@/lib/services/exportService";
import type { GeneratorState } from "@/types/generator";

interface SceneThumbnailProps {
  state: GeneratorState;
  size?: number;
}

function SceneThumbnailComponent({ state, size = 80 }: SceneThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createSpriteController> | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const stateIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // Create a stable identifier for the state
  // Always use full JSON to ensure uniqueness - seed alone is not unique enough
  // This ensures we correctly identify when state actually changes
  const stateId = JSON.stringify(state);

  useEffect(() => {
    // Don't re-initialize if we already have a thumbnail for this exact state
    // This is the key check - if stateId matches and we have a thumbnail, do nothing
    if (stateIdRef.current === stateId && thumbnail) {
      // Ensure loading state is false if we have a thumbnail
      if (isLoading) {
        setIsLoading(false);
      }
      return; // Already have thumbnail for this state, don't re-initialize
    }

    // If we're already initializing the same state, wait
    if (stateIdRef.current === stateId && isInitializingRef.current) {
      return; // Already initializing this state
    }

    // If state changed while initializing, cancel previous and start new
    if (isInitializingRef.current && stateIdRef.current !== stateId) {
      // Cancel previous initialization
      isInitializingRef.current = false;
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy();
        } catch (error) {
          // Ignore cleanup errors
        }
        controllerRef.current = null;
      }
    }

    if (!containerRef.current) return;

    // Check if container is actually laid out before proceeding
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Container not ready, skip initialization
      return;
    }

    // Mark as initializing and update stateId
    const previousStateId = stateIdRef.current;
    isInitializingRef.current = true;
    stateIdRef.current = stateId;

    // Only reset loading/thumbnail if this is actually a new state
    // Don't clear existing thumbnail if state hasn't changed
    const isNewState = previousStateId !== stateId;
    if (isNewState || !thumbnail) {
    setIsLoading(true);
      // Only clear thumbnail if state actually changed
      if (isNewState) {
    setThumbnail(null);
      }
    }

    // Clean up any existing controller first
    if (controllerRef.current) {
      try {
        controllerRef.current.destroy();
      } catch (error) {
        console.error("SceneThumbnail: Error destroying existing controller:", error);
      }
      controllerRef.current = null;
    }

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
        // Only retry a few times to avoid infinite loops
        let retryCount = 0;
        const maxRetries = 5;
        const retry = () => {
          if (retryCount >= maxRetries) {
            console.warn("SceneThumbnail: Container not laid out after max retries, skipping");
            setIsLoading(false);
            isInitializingRef.current = false;
            return;
          }
          retryCount++;
        setTimeout(() => {
          if (checkLayout()) {
            initController();
          } else {
              retry();
          }
        }, 100);
        };
        retry();
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
                  // Only update if state hasn't changed during capture
                  if (stateIdRef.current === stateId) {
                  setThumbnail(thumb);
                  setIsLoading(false);
                  captured = true;
                  isInitializingRef.current = false; // Mark initialization complete
                  }
                  
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
          
          // Poll every 100ms, but with a shorter timeout to avoid too many contexts
          let attempts = 0;
          const maxAttempts = 40; // 4 seconds total (reduced from 80)
          
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
              
              // Clean up controller if we failed to capture
              if (controllerRef.current) {
                try {
                  controllerRef.current.destroy();
                } catch (error) {
                  console.error("SceneThumbnail: Error destroying controller after timeout:", error);
                }
                controllerRef.current = null;
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
        
        // Clean up any partial controller
        if (controllerRef.current) {
          try {
            controllerRef.current.destroy();
          } catch (destroyError) {
            console.error("SceneThumbnail: Error destroying controller after init failure:", destroyError);
          }
          controllerRef.current = null;
        }
        
        return () => {
          // Cleanup on error
          if (controllerRef.current) {
            try {
            controllerRef.current.destroy();
            } catch (destroyError) {
              // Ignore cleanup errors
            }
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
      // Cleanup function - ensure everything is destroyed
      cancelAnimationFrame(rafId);
      isInitializingRef.current = false;
      
      // Destroy controller if it exists
      if (controllerRef.current) {
        try {
        controllerRef.current.destroy();
        } catch (error) {
          console.error("SceneThumbnail: Error destroying controller in cleanup:", error);
        }
        controllerRef.current = null;
      }
    };
  }, [stateId, size]); // Only depend on stateId and size - thumbnail is a result, not a dependency

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
          key={thumbnail} // Use thumbnail URL as key to prevent flickering
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

// Memoize to prevent unnecessary re-renders that cause flashing
export const SceneThumbnail = memo(SceneThumbnailComponent, (prevProps, nextProps) => {
  // React.memo comparison: return true if props are equal (skip re-render), false if different (re-render)
  
  // Check size first (cheapest comparison)
  if (prevProps.size !== nextProps.size) {
    return false; // Props changed, should re-render
  }
  
  // Handle null/undefined states
  if (!prevProps.state || !nextProps.state) {
    return prevProps.state === nextProps.state;
  }
  
  // Quick reference check - if same object reference, definitely equal
  if (prevProps.state === nextProps.state) {
    return true; // Same object, skip re-render
  }
  
  // Deep equality check using JSON.stringify
  // This handles cases where loadSceneState creates new objects with same content
  try {
    const prevStateStr = JSON.stringify(prevProps.state);
    const nextStateStr = JSON.stringify(nextProps.state);
    return prevStateStr === nextStateStr; // true = equal (skip), false = different (re-render)
  } catch (error) {
    // If comparison fails, assume different to be safe
    return false;
  }
});

