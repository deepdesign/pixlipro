import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState, SpriteController } from "@/types/generator";

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

  // Initialize sprite controller
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isInitialized) {
      return;
    }

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
    } catch (error) {
      console.error("Failed to initialize projector controller:", error);
    }

    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying projector controller:", error);
        }
        controllerRef.current = null;
      }
    };
  }, [isInitialized]);

  // Sync state from main window via BroadcastChannel
  useEffect(() => {
    if (!isInitialized || !controllerRef.current) {
      return;
    }

    if (typeof BroadcastChannel === "undefined") {
      console.warn("BroadcastChannel not available");
      return;
    }

    const channel = new BroadcastChannel("pixli-projector-sync");
    let lastStateUpdate: GeneratorState | null = null;

    channel.onmessage = (event) => {
      console.log("[ProjectorPage] Received message:", event.data.type);
      if (event.data.type === "state-update" && controllerRef.current) {
        const state: GeneratorState = event.data.state;
        lastStateUpdate = state;
        
        console.log("[ProjectorPage] Applying state update");
        // Apply entire state to controller using applyState method
        try {
          const controller = controllerRef.current;
          controller.applyState(state, "instant");
          
          if (!isConnected) {
            console.log("[ProjectorPage] Connected!");
            setIsConnected(true);
          }
        } catch (error) {
          console.error("[ProjectorPage] Error applying state to projector controller:", error);
        }
      }
    };

    // Request initial state immediately
    channel.postMessage({ type: "request-state" });
    
    // Also set up a retry mechanism in case the main window isn't ready yet
    const retryInterval = setInterval(() => {
      if (!isConnected && controllerRef.current) {
        channel.postMessage({ type: "request-state" });
      } else {
        clearInterval(retryInterval);
      }
    }, 500);

    return () => {
      clearInterval(retryInterval);
      channel.close();
    };
  }, [isInitialized, isConnected]);

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

