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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const controller = createSpriteController(container, {
      onStateChange: (state) => {
        setSpriteState(state);
      },
      onFrameRate: setFrameRate,
    });

    controllerRef.current = controller;
    controller.randomizeAll();
    // Set state synchronously to ensure it's available immediately
    const initialState = controller.getState();
    setSpriteState(initialState);

    return () => {
      controller.destroy();
      controllerRef.current = null;
      setSpriteState(null);
    };
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

