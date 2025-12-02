import { useEffect, useRef, useState, useCallback } from "react";
import type { GeneratorState } from "@/types/generator";
import type { Scene } from "@/lib/storage/sceneStorage";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  clients: number;
}

/**
 * Hook for WebSocket connection from Pixli app to WebSocket server
 * Handles bidirectional communication for mobile remote control
 */
export function useWebSocket(
  port: number = 8080,
  enabled: boolean = false,
  onSceneLoad?: (sceneId: string) => void,
  onPresetLoad?: (presetId: string) => void, // Backward compatibility
  onRandomize?: () => void,
  getCurrentState?: () => GeneratorState | null,
  getScenes?: () => Scene[],
  getPresets?: () => Scene[] // Backward compatibility - maps to getScenes
) {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    clients: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Use refs for callbacks to prevent recreating connect on every render
  const onSceneLoadRef = useRef(onSceneLoad || onPresetLoad);
  const onPresetLoadRef = useRef(onPresetLoad); // Backward compatibility
  const onRandomizeRef = useRef(onRandomize);
  const getCurrentStateRef = useRef(getCurrentState);
  const getScenesRef = useRef(getScenes || getPresets);
  const getPresetsRef = useRef(getPresets); // Backward compatibility
  const sendStateUpdateRef = useRef<(() => void) | undefined>(undefined);
  const sendSceneListRef = useRef<(() => void) | undefined>(undefined);
  const sendPresetListRef = useRef<(() => void) | undefined>(undefined); // Backward compatibility
  const handleMessageRef = useRef<((message: WebSocketMessage) => void) | undefined>(undefined);

  // Update refs immediately when callbacks change (synchronous)
  onSceneLoadRef.current = onSceneLoad || onPresetLoad;
  onPresetLoadRef.current = onPresetLoad;
  onRandomizeRef.current = onRandomize;
  getCurrentStateRef.current = getCurrentState;
  getScenesRef.current = getScenes || getPresets;
  getPresetsRef.current = getPresets;

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      // Note: WebSocket API doesn't support custom headers in browser
      // We'll identify as Pixli app via a message after connection
      const ws = new WebSocket(`ws://localhost:${port}/pixli-remote`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected to server");
        setState({
          connected: true,
          connecting: false,
          error: null,
          clients: 0,
        });
        reconnectAttemptsRef.current = 0;

        // Identify as Pixli app client
        ws.send(JSON.stringify({
          type: "pixli-app-connect",
          userAgent: navigator.userAgent,
        }));

        // Send initial state and scene list
        setTimeout(() => {
          sendStateUpdateRef.current?.();
          sendSceneListRef.current?.();
          sendPresetListRef.current?.(); // Backward compatibility
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessageRef.current?.(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setState((prev) => ({
          ...prev,
          error: "Connection error",
          connecting: false,
        }));
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected from server");
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
        }));

        // Attempt to reconnect
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
      setState({
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : "Failed to connect",
        clients: 0,
      });
    }
  }, [enabled, port]); // Only depend on enabled and port

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "client-connected":
        case "client-disconnected":
          setState((prev) => ({
            ...prev,
            clients: message.clients || 0,
          }));
          // Send current state to new client
          if (message.type === "client-connected") {
            setTimeout(() => {
              sendStateUpdateRef.current?.();
              sendSceneListRef.current?.();
              sendPresetListRef.current?.(); // Backward compatibility
            }, 100);
          }
          break;

        case "load-scene":
        case "load-preset": // Backward compatibility
          const sceneId = message.sceneId || message.presetId;
          if (sceneId && onSceneLoadRef.current) {
            onSceneLoadRef.current(sceneId);
          } else if (sceneId && onPresetLoadRef.current) {
            onPresetLoadRef.current(sceneId);
          }
          break;

        case "randomize-all":
          if (onRandomizeRef.current) {
            console.log("[WebSocket] Randomizing all");
            onRandomizeRef.current();
            // Send updated state after randomizing
            setTimeout(() => {
              sendStateUpdateRef.current?.();
            }, 200);
          }
          break;

        case "request-state":
          sendStateUpdateRef.current?.();
          break;

        case "request-scenes":
        case "request-presets": // Backward compatibility
          sendSceneListRef.current?.();
          sendPresetListRef.current?.(); // Backward compatibility
          break;

        default:
          console.log("[WebSocket] Unknown message type:", message.type);
      }
    },
    [] // Empty deps - use refs instead
  );
  
  // Store handleMessage ref synchronously
  handleMessageRef.current = handleMessage;

  const sendStateUpdate = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && getCurrentStateRef.current) {
      const currentState = getCurrentStateRef.current();
      if (currentState) {
        wsRef.current.send(
          JSON.stringify({
            type: "state-update",
            state: currentState,
            timestamp: Date.now(),
          })
        );
      }
    }
  }, []); // Empty deps - use ref instead

  const sendSceneList = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && getScenesRef.current) {
      const scenes = getScenesRef.current();
      wsRef.current.send(
        JSON.stringify({
          type: "scene-list",
          scenes: scenes.map((s) => ({
            id: s.id,
            name: s.name,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          })),
          timestamp: Date.now(),
        })
      );
    }
  }, []); // Empty deps - use ref instead

  const sendPresetList = useCallback(() => {
    // Backward compatibility - sends both scene-list and preset-list
    if (wsRef.current?.readyState === WebSocket.OPEN && getScenesRef.current) {
      const scenes = getScenesRef.current();
      wsRef.current.send(
        JSON.stringify({
          type: "preset-list",
          presets: scenes.map((s) => ({
            id: s.id,
            name: s.name,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          })),
          timestamp: Date.now(),
        })
      );
    }
  }, []); // Empty deps - use ref instead
  
  // Store send functions in refs synchronously
  sendStateUpdateRef.current = sendStateUpdate;
  sendSceneListRef.current = sendSceneList;
  sendPresetListRef.current = sendPresetList;

  const sendCurrentScene = useCallback((scene: Scene | null) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "current-scene",
          scene: scene
            ? {
                id: scene.id,
                name: scene.name,
              }
            : null,
          timestamp: Date.now(),
        })
      );
      // Also send as current-preset for backward compatibility
      wsRef.current.send(
        JSON.stringify({
          type: "current-preset",
          preset: scene
            ? {
                id: scene.id,
                name: scene.name,
              }
            : null,
          timestamp: Date.now(),
        })
      );
    }
  }, []);

  const sendCurrentPreset = sendCurrentScene; // Backward compatibility alias

  // Connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setState({
        connected: false,
        connecting: false,
        error: null,
        clients: 0,
      });
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, connect]); // Keep connect in deps but it's now stable

  return {
    ...state,
    sendStateUpdate,
    sendSceneList,
    sendPresetList, // Backward compatibility
    sendCurrentScene,
    sendCurrentPreset, // Backward compatibility
    reconnect: connect,
  };
}

