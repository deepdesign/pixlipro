import { useState, useEffect } from "react";
import { Field, Label, Description } from "@/components/ui/fieldset";
import { Switch, SwitchField } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/Button";
import { generateQRCodeDataURL, getWebSocketURL } from "@/lib/utils/qrCode";
import { Wifi, WifiOff, Copy, Check } from "lucide-react";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/storage/settingsStorage";

interface RemoteControlTabProps {
  onConnectionChange?: (connected: boolean) => void;
  webSocketState?: {
    connected: boolean;
    connecting: boolean;
    error: string | null;
    clients: number;
  };
}

export function RemoteControlTab({ onConnectionChange, webSocketState }: RemoteControlTabProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [wsUrl, setWsUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [port, setPort] = useState(settings.remoteControlPort || 8080);
  
  // Use WebSocket state from parent if provided, otherwise use local state
  const isConnected = webSocketState?.connected || false;
  const isConnecting = webSocketState?.connecting || false;
  const wsError = webSocketState?.error || null;
  const clientCount = webSocketState?.clients || 0;

  // Load settings and generate QR code
  useEffect(() => {
    const loadData = async () => {
      const loaded = loadSettings();
      setSettings(loaded);
      
      if (loaded.remoteControlEnabled) {
        try {
          const url = await getWebSocketURL(port);
          setWsUrl(url);
          const qr = await generateQRCodeDataURL(url);
          setQrCodeDataURL(qr);
        } catch (error) {
          console.error("Failed to generate QR code:", error);
        }
      }
    };
    
    loadData();
  }, [port]);

  const handleToggle = (enabled: boolean) => {
    const newSettings = { ...settings, remoteControlEnabled: enabled };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    if (enabled) {
      // Generate QR code when enabled
      getWebSocketURL(port).then((url) => {
        setWsUrl(url);
        generateQRCodeDataURL(url).then(setQrCodeDataURL).catch(console.error);
      });
    } else {
      setQrCodeDataURL("");
      setWsUrl("");
      onConnectionChange?.(false);
    }
  };

  const handleCopyUrl = async () => {
    if (wsUrl) {
      try {
        await navigator.clipboard.writeText(wsUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy URL:", error);
      }
    }
  };

  const handlePortChange = (value: string) => {
    const newPort = parseInt(value) || 8080;
    setPort(newPort);
    if (settings.remoteControlEnabled) {
      getWebSocketURL(newPort).then((url) => {
        setWsUrl(url);
        generateQRCodeDataURL(url).then(setQrCodeDataURL).catch(console.error);
      });
    }
  };

  return (
    <div className="space-y-6 px-6">
      {/* Remote Control Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-theme-primary">Mobile Remote Control</h3>
              <p className="text-sm text-theme-muted mt-1">
                Control Pixli from your mobile device. Scan the QR code or enter the connection URL on your phone.
              </p>
            </div>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-status-success flex-shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="h-5 w-5 text-theme-subtle flex-shrink-0 mt-0.5" />
            )}
          </div>
        </div>
        <div className="p-6">
          <Field>
            <SwitchField>
              <Switch
                checked={settings.remoteControlEnabled || false}
                onChange={handleToggle}
              />
              <div className="flex-1">
                <Label>Enable Remote Control</Label>
                <Description>
                  Start the WebSocket server to allow mobile devices to connect and control Pixli remotely.
                </Description>
              </div>
            </SwitchField>
          </Field>

          {settings.remoteControlEnabled && (
            <div className="mt-6 pt-6 border-t border-theme-card space-y-4">
              {/* Port Configuration */}
              <Field>
                <Label htmlFor="ws-port">WebSocket Port</Label>
                <Description>
                  Port number for the WebSocket server (default: 8080)
                </Description>
                <div data-slot="control" className="mt-2">
                  <Input
                    id="ws-port"
                    type="number"
                    value={port.toString()}
                    onChange={(e) => handlePortChange(e.target.value)}
                    min={1024}
                    max={65535}
                    className="w-32"
                  />
                </div>
              </Field>

              {/* Connection URL */}
              {wsUrl && (
                <Field>
                  <Label>Connection URL</Label>
                  <Description>
                    Enter this URL in the mobile app or scan the QR code below
                  </Description>
                  <div data-slot="control" className="mt-2 flex gap-2">
                    <Input
                      type="text"
                      value={wsUrl}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyUrl}
                      title="Copy URL"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Field>
              )}

              {/* QR Code */}
              {qrCodeDataURL && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-theme-panel rounded-lg border border-theme-card">
                    <img
                      src={qrCodeDataURL}
                      alt="QR Code for mobile connection"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-theme-muted text-center">
                    Scan this QR code with your mobile device to connect
                  </p>
                </div>
              )}

              {/* Connection Status */}
              <div className={`p-3 rounded-lg border bg-theme-status border-theme-card`}>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-[var(--accent-primary)]" />
                      <div className="flex-1">
                        <p className="text-sm text-theme-primary">
                          <span className="font-medium">Connected:</span> Pixli app connected to WebSocket server
                        </p>
                        {clientCount > 0 && (
                          <p className="text-xs text-theme-muted mt-1">
                            {clientCount} mobile device{clientCount !== 1 ? "s" : ""} connected
                          </p>
                        )}
                      </div>
                    </>
                  ) : isConnecting ? (
                    <>
                      <Wifi className="h-4 w-4 text-[var(--accent-primary)] animate-pulse" />
                      <p className="text-sm text-theme-primary">
                        <span className="font-medium">Connecting...</span> Attempting to connect to WebSocket server
                      </p>
                    </>
                  ) : wsError ? (
                    <>
                      <WifiOff className="h-4 w-4 text-theme-muted" />
                      <p className="text-sm text-theme-primary">
                        <span className="font-medium">Connection Error:</span> {wsError}
                      </p>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-theme-subtle" />
                      <p className="text-sm text-theme-primary">
                        <span className="font-medium">Waiting for connection:</span> Start the WebSocket server (<code className="text-xs bg-theme-icon px-1 py-0.5 rounded">npm run server:ws</code>) and scan the QR code from your mobile device
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

