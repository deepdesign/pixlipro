import { useEffect, useRef, useCallback, useState } from "react";
import { createMIDIClient, type MIDIClient, type MIDIMessage } from "@/lib/integrations/midi";
import { loadSettings, type MIDISettings } from "@/lib/storage/settingsStorage";
import type { GeneratorState } from "@/types/generator";

interface UseMIDIOptions {
  onPresetLoad?: (presetId: string) => void;
  onMotionIntensityChange?: (intensity: number) => void;
  onMotionSpeedChange?: (speed: number) => void;
  onHueRotationSpeedChange?: (speed: number) => void;
  onRandomizeAll?: () => void;
  onStateUpdate?: (state: GeneratorState) => void;
}

export function useMIDI(options: UseMIDIOptions = {}) {
  const clientRef = useRef<MIDIClient | null>(null);
  const settingsRef = useRef<MIDISettings | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<ReturnType<MIDIClient["getDevices"]>>([]);

  // Initialize MIDI client
  useEffect(() => {
    const settings = loadSettings();
    const midiSettings = settings.integrations.midi;
    settingsRef.current = midiSettings;

    if (midiSettings.enabled) {
      const client = createMIDIClient(midiSettings);
      clientRef.current = client;

      // Setup message handlers
      client.onMessage((message: MIDIMessage) => {
        const mapping = client.getMapping(message);
        
        if (mapping) {
          // Handle mapped parameters
          switch (mapping) {
            case "motionIntensity":
              if (message.type === "cc") {
                // CC values are 0-127, convert to 0-100
                const intensity = (message.value / 127) * 100;
                options.onMotionIntensityChange?.(intensity);
              }
              break;

            case "motionSpeed":
              if (message.type === "cc") {
                const speed = (message.value / 127) * 100;
                options.onMotionSpeedChange?.(speed);
              }
              break;

            case "hueRotationSpeed":
              if (message.type === "cc") {
                const speed = (message.value / 127) * 100;
                options.onHueRotationSpeedChange?.(speed);
              }
              break;

            case "preset1":
            case "preset2":
            case "preset3":
            case "preset4":
            case "preset5":
              if (message.type === "noteon" && message.value > 0) {
                const presetIndex = parseInt(mapping.replace("preset", "")) - 1;
                // Load preset by index (would need preset list)
                break;
              }
              break;
          }
        } else {
          // Handle unmapped messages with default behavior
          if (message.type === "cc") {
            switch (message.number) {
              case 1: // Modulation wheel - Motion Intensity
                const intensity = (message.value / 127) * 100;
                options.onMotionIntensityChange?.(intensity);
                break;
              case 2: // Motion Speed
                const speed = (message.value / 127) * 100;
                options.onMotionSpeedChange?.(speed);
                break;
              case 3: // Hue Rotation Speed
                const hueSpeed = (message.value / 127) * 100;
                options.onHueRotationSpeedChange?.(hueSpeed);
                break;
            }
          } else if (message.type === "noteon" && message.value > 0) {
            // Note C4 (60) = Preset 1, C#4 (61) = Preset 2, etc.
            const noteNumber = message.number;
            if (noteNumber >= 60 && noteNumber <= 64) {
              const presetIndex = noteNumber - 60;
              // Load preset by index (would need preset list)
            }
          }
        }
      });

      client.initialize().then((success) => {
        setIsConnected(success);
        if (success) {
          setDevices(client.getDevices());
        }
      });
    }

    return () => {
      if (clientRef.current) {
        // MIDI client cleanup is handled internally
        clientRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update settings when they change
  useEffect(() => {
    const settings = loadSettings();
    const midiSettings = settings.integrations.midi;

    if (clientRef.current && settingsRef.current) {
      // Check if settings changed
      if (
        settingsRef.current.enabled !== midiSettings.enabled ||
        settingsRef.current.deviceId !== midiSettings.deviceId
      ) {
        clientRef.current.updateSettings(midiSettings).then(() => {
          setIsConnected(midiSettings.enabled);
          if (midiSettings.enabled) {
            setDevices(clientRef.current?.getDevices() || []);
          }
        });
        settingsRef.current = midiSettings;
      }
    } else if (midiSettings.enabled && !clientRef.current) {
      // Create new client if enabled but doesn't exist
      const client = createMIDIClient(midiSettings);
      clientRef.current = client;
      settingsRef.current = midiSettings;

      client.onMessage((message: MIDIMessage) => {
        const mapping = client.getMapping(message);
        
        if (mapping) {
          switch (mapping) {
            case "motionIntensity":
              if (message.type === "cc") {
                const intensity = (message.value / 127) * 100;
                options.onMotionIntensityChange?.(intensity);
              }
              break;
            case "motionSpeed":
              if (message.type === "cc") {
                const speed = (message.value / 127) * 100;
                options.onMotionSpeedChange?.(speed);
              }
              break;
            case "hueRotationSpeed":
              if (message.type === "cc") {
                const speed = (message.value / 127) * 100;
                options.onHueRotationSpeedChange?.(speed);
              }
              break;
          }
        } else {
          if (message.type === "cc") {
            switch (message.number) {
              case 1:
                const intensity = (message.value / 127) * 100;
                options.onMotionIntensityChange?.(intensity);
                break;
              case 2:
                const speed = (message.value / 127) * 100;
                options.onMotionSpeedChange?.(speed);
                break;
              case 3:
                const hueSpeed = (message.value / 127) * 100;
                options.onHueRotationSpeedChange?.(hueSpeed);
                break;
            }
          }
        }
      });

      client.initialize().then((success) => {
        setIsConnected(success);
        if (success) {
          setDevices(client.getDevices());
        }
      });
    }
  }, [options.onMotionIntensityChange, options.onMotionSpeedChange, options.onHueRotationSpeedChange]);

  return {
    client: clientRef.current,
    isConnected,
    devices,
    addMapping: useCallback((parameter: string, message: MIDIMessage) => {
      clientRef.current?.addMapping(parameter, message);
    }, []),
    removeMapping: useCallback((parameter: string) => {
      clientRef.current?.removeMapping(parameter);
    }, []),
  };
}


