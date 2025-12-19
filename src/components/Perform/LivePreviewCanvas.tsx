import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState, SpriteController } from "@/types/generator";

interface LivePreviewCanvasProps {
  currentState?: GeneratorState | null;
  isPlaying: boolean;
  transition?: "instant" | "fade" | "smooth" | "pixellate";
  transitionDurationMs?: number;
}

export function LivePreviewCanvas({ currentState, isPlaying, transition, transitionDurationMs }: LivePreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpriteController | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [frameRate, setFrameRate] = useState(0);
  const transitionRef = useRef<"instant" | "fade" | "smooth" | "pixellate" | undefined>(transition);
  const transitionDurationMsRef = useRef<number | undefined>(transitionDurationMs);
  const lastAppliedStateRef = useRef<string | null>(null);
  const pendingStateRef = useRef<{ state: GeneratorState; transition?: string; durationMs?: number } | null>(null);

  // Initialize sprite controller (only once on mount)
  useEffect(() => {
    if (controllerRef.current) return;

    const container = containerRef.current;
    if (!container) {
      // Container not ready yet, will retry via the retry effect
      return;
    }

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const initializeController = () => {
      if (!isMounted || !container || controllerRef.current) return;

      const parentWidth = container.parentElement?.clientWidth || container.clientWidth || 0;
      if (parentWidth === 0) {
        timeoutId = setTimeout(() => {
          if (isMounted && !controllerRef.current) {
            initializeController();
          }
        }, 100);
        return;
      }

      try {
        const controller = createSpriteController(container, {
          onStateChange: () => {},
          onFrameRateUpdate: (fps) => {
            if (isMounted) {
              setFrameRate(Math.round(fps));
            }
          },
        });

        controllerRef.current = controller;
        
        // Immediately pause animation and disable it to prevent any default content from rendering
        controller.setAnimationEnabled(false);
        controller.pauseAnimation();
        
        setIsInitialized(true);

        // Apply pending state if we had one queued
        // Don't apply currentState on init - only apply when explicitly set via props during playback
        if (pendingStateRef.current) {
          const { state, transition: pendingTransition, durationMs } = pendingStateRef.current;
          const transitionToUse = pendingTransition || transitionRef.current || "instant";
          // Re-enable animation for real state
          controller.setAnimationEnabled(true);
          controller.resumeAnimation();
          controller.applyState(state, transitionToUse as any, durationMs);
          lastAppliedStateRef.current = JSON.stringify(state);
          pendingStateRef.current = null;
        } else {
          // If no pending state, clear the canvas immediately by disabling animation and hiding sprites
          // Apply blank state synchronously to prevent any default content from showing
          // Use a completely blank state with no sprites and black background
          const blankState: GeneratorState = {
            ...controller.getState(),
            animationEnabled: false, // Disable animation
            scalePercent: 0, // Hide all sprites by setting scale to 0
            motionIntensity: 0, // Disable motion
            backgroundBrightness: 0, // Set background to black
            layerOpacity: 0, // Make layer completely transparent
            selectedSprites: [], // Clear sprite selection
          };
          // Apply blank state immediately (animation already paused above)
          // Use a small delay to ensure p5.js is fully initialized
          requestAnimationFrame(() => {
            if (controllerRef.current) {
              controllerRef.current.applyState(blankState, "instant");
            }
          });
        }
      } catch (error) {
        console.error("[LivePreviewCanvas] Error initializing controller:", error);
        // Retry on error
        timeoutId = setTimeout(() => {
          if (isMounted && !controllerRef.current) {
            initializeController();
          }
        }, 500);
      }
    };

    // Start initialization
    requestAnimationFrame(() => {
      if (isMounted && !controllerRef.current) {
        initializeController();
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy();
        } catch (error) {
          console.error("[LivePreviewCanvas] Error destroying controller:", error);
        }
        controllerRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []); // Only run once on mount

  // Retry initialization if container becomes available
  useEffect(() => {
    if (controllerRef.current) return;
    if (!containerRef.current) {
      const timeoutId = setTimeout(() => {
        if (!controllerRef.current && containerRef.current) {
          // Force re-run by toggling isInitialized
          setIsInitialized(false);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isInitialized]);

  // Update transition refs when props change
  useEffect(() => {
    transitionRef.current = transition;
    transitionDurationMsRef.current = transitionDurationMs;
  }, [transition, transitionDurationMs]);

  // Don't sync from BroadcastChannel - we only want to show state explicitly passed via props
  // This prevents the preview from showing the main canvas state when not playing

  // Apply state directly when currentState prop changes
  // Only apply if currentState is explicitly provided (not null/undefined)
  useEffect(() => {
    if (!currentState) {
      // Clear the canvas when no state is provided by applying a blank/minimal state
      if (controllerRef.current && isInitialized) {
        try {
          // Apply a minimal state that effectively clears the canvas
          const currentState = controllerRef.current.getState();
          const blankState: GeneratorState = {
            ...currentState,
            animationEnabled: false, // Disable animation
            scalePercent: 0, // Hide all sprites by setting scale to 0
            motionIntensity: 0, // Disable motion
            backgroundBrightness: 0, // Set background to black
            backgroundMode: "auto", // Keep background mode but make it black
          };
          // Disable animation and pause first, then apply blank state
          controllerRef.current.setAnimationEnabled(false);
          controllerRef.current.pauseAnimation();
          controllerRef.current.applyState(blankState, "instant");
          lastAppliedStateRef.current = null;
        } catch (error) {
          console.error("[LivePreviewCanvas] Error clearing canvas:", error);
        }
      }
      return;
    }

    // If controller isn't ready yet, queue the state
    if (!controllerRef.current || !isInitialized) {
      pendingStateRef.current = {
        state: currentState,
        transition: transitionRef.current,
        durationMs: transitionDurationMsRef.current,
      };
      return;
    }

    // Prevent applying the same state twice by comparing JSON
    const stateKey = JSON.stringify(currentState);
    if (lastAppliedStateRef.current === stateKey) {
      return; // Already applied this state
    }

    // Apply state with transition if provided, otherwise use instant
    const transitionToUse = transitionRef.current || "instant";
    const durationMs = transitionDurationMsRef.current;
    try {
      // Re-enable animation when applying a real state (not blank)
      // Use requestAnimationFrame to ensure this happens after any pending blank state
      requestAnimationFrame(() => {
        if (controllerRef.current && currentState) {
          controllerRef.current.setAnimationEnabled(true);
          controllerRef.current.resumeAnimation();
          controllerRef.current.applyState(currentState, transitionToUse, durationMs);
          lastAppliedStateRef.current = stateKey;
        }
      });
    } catch (error) {
      console.error("[LivePreviewCanvas] Error applying state:", error);
    }
  }, [currentState, isInitialized]);

  // Handle window resize to ensure canvas scales properly
  useEffect(() => {
    if (!controllerRef.current || !isInitialized) return;

    const handleResize = () => {
      // Trigger a resize on the p5 instance
      const p5Instance = controllerRef.current?.getP5Instance();
      if (p5Instance && typeof p5Instance.windowResized === 'function') {
        // Call windowResized to trigger p5.js resize logic
        p5Instance.windowResized();
      }
    };

    // Use ResizeObserver to watch the container
    const container = containerRef.current;
    if (container && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        // Debounce resize calls
        handleResize();
      });
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }

    // Fallback to window resize listener
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isInitialized]);

  return (
    <div ref={containerRef} className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
      {/* Connection Status Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-white bg-black/50 px-2 py-1 rounded z-10">
        <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500" : "bg-gray-500"}`} />
        <span>{isPlaying ? "Playing" : "Stopped"}</span>
      </div>
      {/* FPS Counter Overlay */}
      <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded z-10">
        FPS: {frameRate || 0}
      </div>
    </div>
  );
}

