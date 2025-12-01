import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { ChevronLeft, ChevronRight, RotateCcw, Wifi, WifiOff } from "lucide-react";
import type { Preset } from "@/lib/storage/presetStorage";
import type { GeneratorState } from "@/types/generator";

interface MobileRemoteProps {
  wsUrl?: string;
}

export function MobileRemote({ wsUrl }: MobileRemoteProps) {
  const [connected, setConnected] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);
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
        // Request preset list and current state after a short delay
        setTimeout(() => {
          ws.send(JSON.stringify({ type: "request-presets" }));
          ws.send(JSON.stringify({ type: "request-state" }));
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "preset-list":
              setPresets(message.presets || []);
              break;
            case "current-preset":
              setCurrentPreset(message.preset || null);
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

  const handleLoadPreset = (presetId: string) => {
    sendCommand("load-preset", { presetId });
  };

  const handleNextPreset = () => {
    if (presets.length === 0) return;
    const currentIndex = currentPreset
      ? presets.findIndex((p) => p.id === currentPreset.id)
      : -1;
    const nextIndex = (currentIndex + 1) % presets.length;
    handleLoadPreset(presets[nextIndex].id);
  };

  const handlePreviousPreset = () => {
    if (presets.length === 0) return;
    const currentIndex = currentPreset
      ? presets.findIndex((p) => p.id === currentPreset.id)
      : -1;
    const prevIndex = currentIndex <= 0 ? presets.length - 1 : currentIndex - 1;
    handleLoadPreset(presets[prevIndex].id);
  };

  const handleRandomize = () => {
    sendCommand("randomize-all");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pixli Remote
          </h1>
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Current Preset */}
        {currentPreset && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Preset</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentPreset.name}
            </p>
          </div>
        )}

        {/* Preset Navigation */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePreviousPreset}
              disabled={!connected || presets.length === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {presets.length > 0
                  ? `${(currentPreset ? presets.findIndex((p) => p.id === currentPreset.id) : 0) + 1} / ${presets.length}`
                  : "No presets"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNextPreset}
              disabled={!connected || presets.length === 0}
              className="flex-1"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Preset List */}
          {presets.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentPreset?.id === preset.id
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      : "bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-600"
                  }`}
                >
                  <p className="font-medium">{preset.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-sm">
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

