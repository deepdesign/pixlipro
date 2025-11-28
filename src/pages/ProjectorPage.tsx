import { useEffect, useRef, useState } from "react";
import { useSpriteController } from "@/hooks/useSpriteController";
import type { GeneratorState } from "@/types/generator";

/**
 * Projector Page - Canvas-only view for secondary display
 * This page shows only the canvas with no UI chrome, designed for projection
 */
export function ProjectorPage() {
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const { controller, spriteState, ready } = useSpriteController(sketchContainerRef);
  const [syncedState, setSyncedState] = useState<GeneratorState | null>(null);

  // Listen for state updates from main window via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      console.warn("BroadcastChannel not available, using window.postMessage fallback");
      return;
    }

    const channel = new BroadcastChannel("pixli-projector-sync");

    channel.onmessage = (event) => {
      if (event.data.type === "state-update" && controller) {
        // Apply state update to controller
        const state = event.data.state;
        controller.applyState(state);
        setSyncedState(state);
      }
    };

    // Request initial state
    channel.postMessage({ type: "request-state" });

    return () => {
      channel.close();
    };
  }, [controller]);

  // Apply synced state when it changes
  useEffect(() => {
    if (syncedState && controller) {
      controller.applyState(syncedState);
    }
  }, [syncedState, controller]);

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <div
        ref={sketchContainerRef}
        className="h-full w-full flex items-center justify-center"
        style={{
          padding: 0,
          margin: 0,
        }}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Loading Canvas...</div>
            <div className="text-sm text-gray-400">Waiting for connection</div>
          </div>
        </div>
      )}
    </div>
  );
}

