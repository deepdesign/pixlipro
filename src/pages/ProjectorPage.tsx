import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState, SpriteController } from "@/types/generator";
import { getActiveTheme } from "@/lib/storage/themeStorage";
import { applyTheme } from "@/lib/theme/themeApplier";
import { loadSettings } from "@/lib/storage/settingsStorage";

/**
 * Projector Page - Canvas-only view for secondary display
 * This page creates its own sprite controller and syncs state with the main window
 * to display the exact same animation
 */
export function ProjectorPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpriteController | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [controllerReady, setControllerReady] = useState(false);
  const controllerReadyRef = useRef(false);

  // Apply active theme on projector page load
  useEffect(() => {
    const activeTheme = getActiveTheme();
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  }, []);

  // Initialize sprite controller (only once on mount)
  useEffect(() => {
    if (isInitialized || controllerRef.current) {
      return;
    }

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const initializeController = () => {
      const container = containerRef.current;
      
      if (!container || !isMounted) {
        if (!container) {
          timeoutId = setTimeout(() => {
            if (isMounted) {
              initializeController();
            }
          }, 100);
        }
        return;
      }

      // Ensure container is attached to DOM and has dimensions
      if (!container.parentNode) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }

      const containerWidth = container.clientWidth || container.offsetWidth || 0;
      if (containerWidth === 0) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }
      
      // Load projector max resolution setting
      const settings = loadSettings();
      let maxResolution: number | undefined;
      switch (settings.projectorMaxResolution) {
        case "720p":
          maxResolution = 1280; // 720p width
          break;
        case "1080p":
          maxResolution = 1920; // 1080p width
          break;
        case "1440p":
          maxResolution = 2560; // 1440p width
          break;
        case "4k":
          maxResolution = 3840; // 4K width
          break;
        case "unlimited":
        default:
          maxResolution = undefined; // No cap
          break;
      }
      
      try {
        const controller = createSpriteController(container, {
          onStateChange: () => {
            // State changes are handled via BroadcastChannel sync
          },
          onFrameRate: () => {
            // Frame rate updates not needed for projector
          },
          maxResolution,
        });

        controllerRef.current = controller;
        controllerReadyRef.current = true;
        setIsInitialized(true);
        setControllerReady(true);
      } catch (error) {
        console.error("🔴 [ProjectorPage] Failed to initialize projector controller:", error);
        // Clear refs on error
        controllerRef.current = null;
        controllerReadyRef.current = false;
        setIsInitialized(false);
        setControllerReady(false);
        // Retry on error
        timeoutId = setTimeout(() => {
          if (isMounted && !isInitialized) {
            initializeController();
          }
        }, 500);
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
          console.error("🔴 [ProjectorPage] Error destroying projector controller:", error);
        }
        controllerRef.current = null;
        controllerReadyRef.current = false;
      }
    };
  }, []); // Only run on mount/unmount, not when isInitialized changes

  // Sync state from main window via BroadcastChannel
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const windowMessageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  
  useEffect(() => {
    // Check refs directly to ensure we have current values
    const currentRefReady = controllerReadyRef.current;
    const currentHasController = !!controllerRef.current;
    
    if (!currentRefReady || !currentHasController) {
      return;
    }

    // Try BroadcastChannel first, fallback to window.postMessage
    let useBroadcastChannel = typeof BroadcastChannel !== "undefined";
    
    if (useBroadcastChannel) {
      try {
        // Create channel once and keep it open
        if (!broadcastChannelRef.current) {
          const channel = new BroadcastChannel("pixli-projector-sync");
          broadcastChannelRef.current = channel;

          channel.onmessage = (event) => {
            if (event.data.type === "state-update" && controllerRef.current) {
              const state: GeneratorState = event.data.state;
              try {
                controllerRef.current.applyState(state, "instant");
                if (!isConnected) {
                  setIsConnected(true);
                  if (retryIntervalRef.current) {
                    clearInterval(retryIntervalRef.current);
                    retryIntervalRef.current = null;
                  }
                }
              } catch (error) {
                console.error("[ProjectorPage] Error applying state:", error);
              }
            }
          };

          // Request initial state immediately
          channel.postMessage({ type: "request-state" });
        }
      } catch (error) {
        console.warn("[ProjectorPage] BroadcastChannel failed, falling back to window.postMessage:", error);
        useBroadcastChannel = false;
      }
    }

    // Fallback to window.postMessage if BroadcastChannel not available
    if (!useBroadcastChannel || !broadcastChannelRef.current) {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data?.type === "pixli-state-update" && controllerRef.current) {
          const state: GeneratorState = event.data.state;
          try {
            controllerRef.current.applyState(state, "instant");
            if (!isConnected) {
              setIsConnected(true);
              if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
              }
            }
          } catch (error) {
            console.error("[ProjectorPage] Error applying state:", error);
          }
        }
      };
      
      windowMessageHandlerRef.current = handleMessage;
      window.addEventListener("message", handleMessage);
      
      // Request state from opener window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "pixli-request-state" }, window.location.origin);
      }
    }
    
    // Set up retry mechanism
    if (!retryIntervalRef.current) {
      retryIntervalRef.current = setInterval(() => {
        if (controllerRef.current && !isConnected) {
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({ type: "request-state" });
          } else if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: "pixli-request-state" }, window.location.origin);
          }
        } else if (isConnected && retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }
      }, 500);
    }

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      if (windowMessageHandlerRef.current) {
        window.removeEventListener("message", windowMessageHandlerRef.current);
        windowMessageHandlerRef.current = null;
      }
      // Don't close channel here - keep it open
    };
  }, [isInitialized, controllerReady, isConnected]);
  
  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-screen w-screen bg-theme-bg-base overflow-hidden"
      style={{
        position: "relative",
      }}
    >
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-theme-bg-base text-theme-primary z-10">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Connecting to Canvas...</div>
            <div className="text-sm text-theme-muted">Waiting for main window</div>
          </div>
        </div>
      )}
    </div>
  );
}

