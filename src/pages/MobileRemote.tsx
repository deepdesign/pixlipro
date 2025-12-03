import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { ChevronLeft, ChevronRight, RotateCcw, Wifi, WifiOff } from "lucide-react";
import type { Scene } from "@/lib/storage/sceneStorage";
import type { GeneratorState } from "@/types/generator";

interface MobileRemoteProps {
  wsUrl?: string;
}

export function MobileRemote({ wsUrl }: MobileRemoteProps) {
  const [connected, setConnected] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [, setCurrentState] = useState<GeneratorState | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get WebSocket URL from query params or prop
  const getWebSocketURL = () => {
    if (wsUrl) return wsUrl;
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (url) return url;
    // Default: try to connect to localhost:8080
    return "ws://localhost:8080/pixli-remote";
  };

  const connect = () => {
    const url = getWebSocketURL();
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Pixli");
        setConnected(true);
        // Request scene list and current state after a short delay
        setTimeout(() => {
          ws.send(JSON.stringify({ type: "request-scenes" })); // Backward compatibility: server may still use "request-presets"
          ws.send(JSON.stringify({ type: "request-state" }));
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "scene-list":
            case "preset-list": // Backward compatibility
              setScenes(message.scenes || message.presets || []);
              break;
            case "current-scene":
            case "current-preset": // Backward compatibility
              setCurrentScene(message.scene || message.preset || null);
              break;
            case "state-update":
              setCurrentState(message.state || null);
              break;
            default:
              console.log("Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };

      ws.onclose = () => {
        console.log("Disconnected from Pixli");
        setConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error("Failed to connect:", error);
      setConnected(false);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendCommand = (type: string, data?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  };

  const handleLoadScene = (sceneId: string) => {
    sendCommand("load-scene", { sceneId }); // Backward compatibility: server may still use "load-preset"
  };

  const handleNextScene = () => {
    if (scenes.length === 0) return;
    const currentIndex = currentScene
      ? scenes.findIndex((s) => s.id === currentScene.id)
      : -1;
    const nextIndex = (currentIndex + 1) % scenes.length;
    handleLoadScene(scenes[nextIndex].id);
  };

  const handlePreviousScene = () => {
    if (scenes.length === 0) return;
    const currentIndex = currentScene
      ? scenes.findIndex((s) => s.id === currentScene.id)
      : -1;
    const prevIndex = currentIndex <= 0 ? scenes.length - 1 : currentIndex - 1;
    handleLoadScene(scenes[prevIndex].id);
  };

  const handleRandomize = () => {
    sendCommand("randomize-all");
  };

  return (
    <div className="min-h-screen bg-theme-bg-base p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-primary mb-2">
            Pixli Remote
          </h1>
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-status-success">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-status-error">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Current Scene */}
        {currentScene && (
          <div className="bg-theme-card rounded-lg p-4 mb-4 shadow-sm">
            <p className="text-sm text-theme-muted mb-1">Current Scene</p>
            <p className="text-lg font-semibold text-theme-primary">
              {currentScene.name}
            </p>
          </div>
        )}

        {/* Scene Navigation */}
        <div className="bg-theme-card rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePreviousScene}
              disabled={!connected || scenes.length === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <p className="text-sm text-theme-muted">
                {scenes.length > 0
                  ? `${(currentScene ? scenes.findIndex((s) => s.id === currentScene.id) : 0) + 1} / ${scenes.length}`
                  : "No scenes"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNextScene}
              disabled={!connected || scenes.length === 0}
              className="flex-1"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Scene List */}
          {scenes.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleLoadScene(scene.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentScene?.id === scene.id
                      ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                      : "bg-[var(--icon-bg)] text-theme-primary hover:bg-[var(--icon-hover)]"
                  }`}
                >
                  <p className="font-medium">{scene.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-theme-card rounded-lg p-4 shadow-sm">
          <Button
            type="button"
            variant="outline"
            onClick={handleRandomize}
            disabled={!connected}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Randomize All
          </Button>
        </div>

        {/* Connection Info */}
        {!connected && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              Waiting for connection. Make sure the WebSocket server is running and the URL is correct.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

