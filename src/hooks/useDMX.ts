import { useEffect, useRef, useCallback } from "react";
import { createDMXClient, type DMXClient } from "@/lib/integrations/dmx";
import { loadSettings, type DMXSettings } from "@/lib/storage/settingsStorage";
import type { GeneratorState } from "@/types/generator";

interface UseDMXOptions {
  onStateUpdate?: (state: GeneratorState) => void;
}

export function useDMX(_options: UseDMXOptions = {}) {
  const clientRef = useRef<DMXClient | null>(null);
  const settingsRef = useRef<DMXSettings | null>(null);
  const lastStateRef = useRef<GeneratorState | null>(null);

  // Initialize DMX client
  useEffect(() => {
    const settings = loadSettings();
    const dmxSettings = settings.integrations.dmx;
    settingsRef.current = dmxSettings;

    if (dmxSettings.enabled) {
      const client = createDMXClient(dmxSettings);
      clientRef.current = client;

      client.connect().catch((error) => {
        console.error("[useDMX] Failed to connect:", error);
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
    const dmxSettings = settings.integrations.dmx;

    if (clientRef.current && settingsRef.current) {
      // Check if settings changed
      if (
        settingsRef.current.enabled !== dmxSettings.enabled ||
        settingsRef.current.universe !== dmxSettings.universe ||
        settingsRef.current.ipAddress !== dmxSettings.ipAddress ||
        settingsRef.current.port !== dmxSettings.port
      ) {
        clientRef.current.updateSettings(dmxSettings);
        settingsRef.current = dmxSettings;
      }
    } else if (dmxSettings.enabled && !clientRef.current) {
      // Create new client if enabled but doesn't exist
      const client = createDMXClient(dmxSettings);
      clientRef.current = client;
      settingsRef.current = dmxSettings;

      client.connect().catch((error) => {
        console.error("[useDMX] Failed to connect:", error);
      });
    }
  }, []);

  // Send state updates to DMX
  const sendStateUpdate = useCallback((state: GeneratorState) => {
    if (clientRef.current && settingsRef.current?.enabled) {
      // Only update if state actually changed
      if (lastStateRef.current !== state) {
        // Map generator state to DMX channels
        // Use dynamic import to avoid circular dependencies
        if (state.paletteId) {
          import("@/data/palettes").then(({ getPalette }) => {
            const palette = getPalette(state.paletteId);
            if (palette && clientRef.current) {
              clientRef.current.mapGeneratorState({
                palette: { colors: palette.colors },
                motionIntensity: state.motionIntensity,
              });
              clientRef.current.sendAllChannels();
            }
          }).catch(() => {
            // Fallback if palette not found
            if (clientRef.current) {
              clientRef.current.mapGeneratorState({
                motionIntensity: state.motionIntensity,
              });
              clientRef.current.sendAllChannels();
            }
          });
        } else {
          clientRef.current.mapGeneratorState({
            motionIntensity: state.motionIntensity,
          });
          clientRef.current.sendAllChannels();
        }
        
        lastStateRef.current = state;
      }
    }
  }, []);

  return {
    client: clientRef.current,
    sendStateUpdate,
    setChannel: useCallback((channel: number, value: number) => {
      clientRef.current?.setChannel(channel, value);
    }, []),
    clearAll: useCallback(() => {
      clientRef.current?.clearAll();
    }, []),
  };
}

