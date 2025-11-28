import { useEffect, useRef, useCallback } from "react";
import { createOSCClient, type OSCClient } from "@/lib/integrations/osc";
import { loadSettings, type OSCSettings } from "@/lib/storage/settingsStorage";
import type { GeneratorState } from "@/types/generator";

interface UseOSCOptions {
  onPresetLoad?: (presetId: string) => void;
  onMotionIntensityChange?: (intensity: number) => void;
  onPaletteCycleToggle?: (enabled: boolean) => void;
  onSequenceNext?: () => void;
  onSequencePrevious?: () => void;
  onStateUpdate?: (state: GeneratorState) => void;
}

export function useOSC(options: UseOSCOptions = {}) {
  const clientRef = useRef<OSCClient | null>(null);
  const settingsRef = useRef<OSCSettings | null>(null);

  // Initialize OSC client
  useEffect(() => {
    const settings = loadSettings();
    const oscSettings = settings.integrations.osc;
    settingsRef.current = oscSettings;

    if (oscSettings.enabled) {
      const client = createOSCClient(oscSettings);
      clientRef.current = client;

      // Setup message handlers
      client.onMessage((message) => {
        switch (message.address) {
          case "/pixli/preset/load":
            if (message.args[0] && typeof message.args[0] === "string") {
              options.onPresetLoad?.(message.args[0]);
            }
            break;

          case "/pixli/motion/intensity":
            if (typeof message.args[0] === "number") {
              options.onMotionIntensityChange?.(message.args[0]);
            }
            break;

          case "/pixli/palette/cycle":
            if (typeof message.args[0] === "number") {
              options.onPaletteCycleToggle?.(message.args[0] === 1);
            }
            break;

          case "/pixli/sequence/next":
            options.onSequenceNext?.();
            break;

          case "/pixli/sequence/previous":
            options.onSequencePrevious?.();
            break;
        }
      });

      client.connect().catch((error) => {
        console.error("[useOSC] Failed to connect:", error);
      });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update settings when they change
  useEffect(() => {
    const settings = loadSettings();
    const oscSettings = settings.integrations.osc;

    if (clientRef.current && settingsRef.current) {
      // Check if settings changed
      if (
        settingsRef.current.enabled !== oscSettings.enabled ||
        settingsRef.current.port !== oscSettings.port ||
        settingsRef.current.listenPort !== oscSettings.listenPort
      ) {
        clientRef.current.updateSettings(oscSettings);
        settingsRef.current = oscSettings;
      }
    } else if (oscSettings.enabled && !clientRef.current) {
      // Create new client if enabled but doesn't exist
      const client = createOSCClient(oscSettings);
      clientRef.current = client;
      settingsRef.current = oscSettings;

      client.onMessage((message) => {
        switch (message.address) {
          case "/pixli/preset/load":
            if (message.args[0] && typeof message.args[0] === "string") {
              options.onPresetLoad?.(message.args[0]);
            }
            break;
          case "/pixli/motion/intensity":
            if (typeof message.args[0] === "number") {
              options.onMotionIntensityChange?.(message.args[0]);
            }
            break;
          case "/pixli/palette/cycle":
            if (typeof message.args[0] === "number") {
              options.onPaletteCycleToggle?.(message.args[0] === 1);
            }
            break;
          case "/pixli/sequence/next":
            options.onSequenceNext?.();
            break;
          case "/pixli/sequence/previous":
            options.onSequencePrevious?.();
            break;
        }
      });

      client.connect().catch((error) => {
        console.error("[useOSC] Failed to connect:", error);
      });
    }
  }, [options.onPresetLoad, options.onMotionIntensityChange, options.onPaletteCycleToggle, options.onSequenceNext, options.onSequencePrevious]);

  // Send state updates
  const sendStateUpdate = useCallback((state: GeneratorState) => {
    if (clientRef.current) {
      // Send relevant state information via OSC
      // This would typically be handled by the backend server
      options.onStateUpdate?.(state);
    }
  }, [options.onStateUpdate]);

  return {
    client: clientRef.current,
    sendStateUpdate,
    sendPresetLoad: useCallback((presetId: string) => {
      clientRef.current?.sendPresetLoad(presetId);
    }, []),
    sendMotionIntensity: useCallback((intensity: number) => {
      clientRef.current?.sendMotionIntensity(intensity);
    }, []),
    sendPaletteCycle: useCallback((enabled: boolean) => {
      clientRef.current?.sendPaletteCycle(enabled);
    }, []),
    sendSequenceNext: useCallback(() => {
      clientRef.current?.sendSequenceNext();
    }, []),
    sendSequencePrevious: useCallback(() => {
      clientRef.current?.sendSequencePrevious();
    }, []),
  };
}


