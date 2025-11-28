import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState, SpriteController } from "@/types/generator";

/**
 * Custom hook for managing the sprite controller
 * Handles controller initialization, state updates, and cleanup
 */
export function useSpriteController(containerRef: React.RefObject<HTMLDivElement | null>) {
  const controllerRef = useRef<SpriteController | null>(null);
  const [spriteState, setSpriteState] = useState<GeneratorState | null>(null);
  const [frameRate, setFrameRate] = useState<number>(60);
  const containerElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isInitializing = false;

    const initializeController = () => {
      // Prevent duplicate initialization
      if (isInitializing) {
        return;
      }

      const container = containerRef.current;
      if (!container || !isMounted) {
        return;
      }

      // CRITICAL: Ensure container is attached to DOM and has proper parent structure
      if (!container.parentNode) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }

      // Check if parent container exists and has dimensions
      // sketch-container is absolutely positioned, so we need parent to have dimensions
      const parentContainer = container.parentElement;
      if (!parentContainer) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }
      
      // Verify parent is a valid container
      // Main app now uses simple div with padding-top (no canvas-wrapper)
      // ProjectorPage uses 'h-screen w-screen bg-black overflow-hidden'
      const hasValidClass = parentContainer.classList.contains('canvas-wrapper') ||
                            parentContainer.classList.contains('canvas-card-shell');
      const hasPaddingTop = parentContainer.style.paddingTop && parseFloat(parentContainer.style.paddingTop) > 0;
      const hasWidth = parentContainer.clientWidth > 0 || parentContainer.offsetWidth > 0;
      const isMainApp = hasValidClass || hasPaddingTop || hasWidth;
      const isProjectorPage = window.location.pathname === '/projector' || 
                              parentContainer.classList.contains('h-screen');
      
      if (!isMainApp && !isProjectorPage) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }
      
      const parentWidth = parentContainer.clientWidth || 0;
      if (parentWidth === 0) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }

      // Don't re-initialize if container hasn't changed and controller exists and canvas is properly parented
      if (containerElementRef.current === container && controllerRef.current) {
        // Check if canvas actually exists and is in the right place
        const p5Instance = controllerRef.current.getP5Instance();
        if (p5Instance && (p5Instance as any).canvas && (p5Instance as any).canvas.elt) {
          const canvasElt = (p5Instance as any).canvas.elt;
          if (canvasElt.parentElement === container) {
            return; // Everything is good, skip
          }
        }
        // Canvas missing or wrong parent, destroy and recreate
        try {
          controllerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying controller:", error);
        }
        controllerRef.current = null;
      }

      isInitializing = true;

      // Destroy old controller if container changed
      if (controllerRef.current && containerElementRef.current !== container) {
        try {
          controllerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying old sprite controller:", error);
        }
        controllerRef.current = null;
      }

      // Create new controller
      containerElementRef.current = container;
      try {
        const controller = createSpriteController(container, {
          onStateChange: (state) => {
            if (isMounted) {
              setSpriteState(state);
            }
          },
          onFrameRate: (rate) => {
            if (isMounted) {
              setFrameRate(rate);
            }
          },
        });

        controllerRef.current = controller;
        controller.randomizeAll();
        const initialState = controller.getState();
        if (isMounted) {
          setSpriteState(initialState);
        }
      } catch (error) {
        console.error("Failed to create sprite controller:", error);
        if (isMounted) {
          setSpriteState(null);
        }
      } finally {
        isInitializing = false;
      }
    };

    // Start initialization - use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (isMounted) {
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
          console.error("Error destroying sprite controller:", error);
        }
        controllerRef.current = null;
        containerElementRef.current = null;
      }
    };
  }, [containerRef]);

  // Poll for container availability when it becomes available after being unmounted
  useEffect(() => {
    // Only poll if controller doesn't exist
    if (controllerRef.current) {
      return;
    }

    const checkContainer = () => {
      const container = containerRef.current;
      if (container && container.parentNode) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (!controllerRef.current || containerElementRef.current !== container)) {
          // Container is ready, trigger re-initialization
          setSpriteState((prev) => prev);
        }
      }
    };

    const interval = setInterval(checkContainer, 200);
    return () => clearInterval(interval);
  }, [containerRef]);

  // Check if controller is ready
  // Note: p5 instance might not be ready immediately, so we just check controller and state
  const isControllerReady = controllerRef.current !== null && spriteState !== null;

  return {
    controller: controllerRef.current,
    spriteState,
    frameRate,
    ready: isControllerReady,
  };
}
