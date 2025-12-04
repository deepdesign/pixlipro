import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState, SpriteController } from "@/types/generator";
import { getActiveTheme } from "@/lib/storage/themeStorage";
import { applyTheme } from "@/lib/theme/themeApplier";

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

  // Log that projector page loaded
  useEffect(() => {
    console.warn("🔴 [ProjectorPage] Projector page loaded, pathname:", window.location.pathname);
    console.warn("🔴 [ProjectorPage] Window opener:", window.opener);
    console.warn("🔴 [ProjectorPage] BroadcastChannel available:", typeof BroadcastChannel !== "undefined");
  }, []);

  // Apply active theme on projector page load
  useEffect(() => {
    const activeTheme = getActiveTheme();
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  }, []);

  // Initialize sprite controller
  useEffect(() => {
    if (isInitialized) {
      return;
    }

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const initializeController = () => {
      const container = containerRef.current;
      console.warn("🔴 [ProjectorPage] Controller init check:", { 
        hasContainer: !!container, 
        isInitialized,
        hasParent: !!container?.parentNode,
        containerWidth: container?.clientWidth || 0
      });
      
      if (!container || !isMounted) {
        if (!container) {
          console.warn("🔴 [ProjectorPage] No container element yet, retrying...");
          timeoutId = setTimeout(() => {
            if (isMounted) {
              initializeController();
            }
          }, 100);
        }
        return;
      }

      // Ensure container is attached to DOM
      if (!container.parentNode) {
        console.warn("🔴 [ProjectorPage] Container not attached to DOM, retrying...");
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }

      // Check if container has dimensions
      const containerWidth = container.clientWidth || container.offsetWidth || 0;
      if (containerWidth === 0) {
        console.warn("🔴 [ProjectorPage] Container has no width yet, retrying...");
        timeoutId = setTimeout(() => {
          if (isMounted) {
            initializeController();
          }
        }, 100);
        return;
      }

      console.warn("🔴 [ProjectorPage] Creating sprite controller...");
      try {
        const controller = createSpriteController(container, {
          onStateChange: () => {
            // State changes are handled via BroadcastChannel sync
          },
          onFrameRate: () => {
            // Frame rate updates not needed for projector
          },
        });

        controllerRef.current = controller;
        setIsInitialized(true);
        console.warn("🔴 [ProjectorPage] Controller initialized successfully!");
      } catch (error) {
        console.error("🔴 [ProjectorPage] Failed to initialize projector controller:", error);
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
      }
    };
  }, [isInitialized]);

  // Sync state from main window via BroadcastChannel
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const windowMessageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  
  useEffect(() => {
    if (!isInitialized || !controllerRef.current) {
      console.log("🔴 [ProjectorPage] Waiting for initialization...", { isInitialized, hasController: !!controllerRef.current });
      return;
    }

    // Try BroadcastChannel first, fallback to window.postMessage
    let useBroadcastChannel = typeof BroadcastChannel !== "undefined";
    
    if (useBroadcastChannel) {
      try {
        // Create channel once and keep it open
        if (!broadcastChannelRef.current) {
          console.warn("🔴 [ProjectorPage] Setting up BroadcastChannel");
          const channel = new BroadcastChannel("pixli-projector-sync");
          broadcastChannelRef.current = channel;

          channel.onmessage = (event) => {
            console.log("🔴 [ProjectorPage] Received message via BroadcastChannel:", event.data.type, event.data);
            if (event.data.type === "state-update" && controllerRef.current) {
              const state: GeneratorState = event.data.state;
              
              console.log("[ProjectorPage] Applying state update", state);
              // Apply entire state to controller using applyState method
              try {
                const controller = controllerRef.current;
                controller.applyState(state, "instant");
                
                if (!isConnected) {
                  console.log("[ProjectorPage] Connected!");
                  setIsConnected(true);
                  // Clear retry interval once connected
                  if (retryIntervalRef.current) {
                    clearInterval(retryIntervalRef.current);
                    retryIntervalRef.current = null;
                  }
                }
              } catch (error) {
                console.error("[ProjectorPage] Error applying state to projector controller:", error);
              }
            }
          };

          // Request initial state immediately
          console.warn("🔴 [ProjectorPage] Requesting initial state via BroadcastChannel");
          channel.postMessage({ type: "request-state" });
        }
      } catch (error) {
        console.warn("[ProjectorPage] BroadcastChannel failed, falling back to window.postMessage:", error);
        useBroadcastChannel = false;
      }
    }

    // Fallback to window.postMessage if BroadcastChannel not available
    if (!useBroadcastChannel || !broadcastChannelRef.current) {
      console.log("[ProjectorPage] Using window.postMessage fallback");
      
      // Set up window message listener
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from same origin
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data && event.data.type === "pixli-state-update" && controllerRef.current) {
          console.log("[ProjectorPage] Received state via window.postMessage:", event.data.state);
          const state: GeneratorState = event.data.state;
          
          try {
            const controller = controllerRef.current;
            controller.applyState(state, "instant");
            
            if (!isConnected) {
              console.log("[ProjectorPage] Connected via window.postMessage!");
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
        console.log("[ProjectorPage] Requesting state from opener window");
        window.opener.postMessage({ type: "pixli-request-state" }, window.location.origin);
      }
    }
    
    // Set up retry mechanism
    if (!retryIntervalRef.current) {
      retryIntervalRef.current = setInterval(() => {
        if (controllerRef.current && !isConnected) {
          if (broadcastChannelRef.current) {
            console.log("[ProjectorPage] Retrying state request via BroadcastChannel...");
            broadcastChannelRef.current.postMessage({ type: "request-state" });
          } else if (window.opener && !window.opener.closed) {
            console.log("[ProjectorPage] Retrying state request via window.postMessage...");
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
  }, [isInitialized, isConnected]);
  
  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      console.log("[ProjectorPage] Cleaning up BroadcastChannel");
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
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

