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
    setSpriteState(controller.getState());

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [containerRef]);

  return {
    controller: controllerRef.current,
    spriteState,
    frameRate,
    ready: spriteState !== null && controllerRef.current !== null,
  };
}

