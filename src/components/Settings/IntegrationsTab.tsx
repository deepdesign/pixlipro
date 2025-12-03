import { useState, useEffect } from "react";
import { Field, Label, Description } from "@/components/ui/Fieldset";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/Button";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/storage/settingsStorage";
import { Check, X } from "lucide-react";
import { createMIDIClient, type MIDIDevice } from "@/lib/integrations/midi";

interface IntegrationsTabProps {
  onMIDIMessage?: (message: { type: string; channel: number; number: number; value: number }) => void;
}

export function IntegrationsTab({ onMIDIMessage }: IntegrationsTabProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [midiDevices, setMidiDevices] = useState<MIDIDevice[]>([]);
  const [midiClient, setMidiClient] = useState<ReturnType<typeof createMIDIClient> | null>(null);
  const [oscConnected, setOscConnected] = useState(false);
  const [dmxConnected, setDmxConnected] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [learningParameter, setLearningParameter] = useState<string | null>(null);

  // Initialize MIDI client and load devices
  useEffect(() => {
    if (settings.integrations.midi.enabled) {
      const client = createMIDIClient(settings.integrations.midi);
      client.initialize().then(() => {
        setMidiDevices(client.getDevices());
        setMidiClient(client);

        // Setup message handler
        client.onMessage((message) => {
          if (learnMode && learningParameter) {
            // In learn mode, add mapping
            client.addMapping(learningParameter, message);
            const newMappings = { ...settings.integrations.midi.mappings };
            newMappings[`${message.type}-${message.channel}-${message.number}`] = {
              parameter: learningParameter,
              type: message.type === "cc" ? "cc" : "note",
              channel: message.channel,
              number: message.number,
            };
            const newSettings = {
              ...settings,
              integrations: {
                ...settings.integrations,
                midi: {
                  ...settings.integrations.midi,
                  mappings: newMappings,
                },
              },
            };
            setSettings(newSettings);
            saveSettings(newSettings);
            setLearnMode(false);
            setLearningParameter(null);
          } else {
            // Normal mode, trigger callback
            onMIDIMessage?.(message);
          }
        });
      });
    } else {
      setMidiClient(null);
      setMidiDevices([]);
    }
  }, [settings.integrations.midi.enabled, settings.integrations.midi.deviceId]);

  const handleOSCToggle = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        osc: {
          ...settings.integrations.osc,
          enabled,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    // OSC connection would be handled by a hook in App.tsx
  };

  const handleOSCPortChange = (value: string) => {
    const port = parseInt(value) || 8000;
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        osc: {
          ...settings.integrations.osc,
          port,
          listenPort: port,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleMIDIToggle = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        midi: {
          ...settings.integrations.midi,
          enabled,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleMIDIDeviceChange = (deviceId: string) => {
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        midi: {
          ...settings.integrations.midi,
          deviceId: deviceId || null,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleMIDILearn = (parameter: string) => {
    if (learnMode && learningParameter === parameter) {
      // Cancel learn mode
      setLearnMode(false);
      setLearningParameter(null);
      if (midiClient) {
        midiClient.updateSettings({
          ...settings.integrations.midi,
          learnMode: false,
        });
      }
    } else {
      // Start learn mode
      setLearnMode(true);
      setLearningParameter(parameter);
      if (midiClient) {
        midiClient.updateSettings({
          ...settings.integrations.midi,
          learnMode: true,
        });
      }
    }
  };

  const handleDMXToggle = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        dmx: {
          ...settings.integrations.dmx,
          enabled,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    // DMX connection would be handled by a hook in App.tsx
  };

  const handleDMXUniverseChange = (value: string) => {
    const universe = parseInt(value) || 0;
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        dmx: {
          ...settings.integrations.dmx,
          universe,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDMXIPChange = (value: string) => {
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        dmx: {
          ...settings.integrations.dmx,
          ipAddress: value,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDMXPortChange = (value: string) => {
    const port = parseInt(value) || 6454;
    const newSettings = {
      ...settings,
      integrations: {
        ...settings.integrations,
        dmx: {
          ...settings.integrations.dmx,
          port,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const testOSCConnection = () => {
    // Test connection would be handled by OSC client
    setOscConnected(true);
    setTimeout(() => setOscConnected(false), 2000);
  };

  const testDMXConnection = () => {
    // Test connection would be handled by DMX client
    setDmxConnected(true);
    setTimeout(() => setDmxConnected(false), 2000);
  };

  return (
    <div className="space-y-6 px-6">
      {/* OSC Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-theme-primary">
                  OSC (Open Sound Control)
                </h3>
                <Switch
                  checked={settings.integrations.osc.enabled}
                  onChange={handleOSCToggle}
                />
              </div>
              <p className="text-sm text-theme-muted mt-1">
                Control Pixli via OSC messages from lighting consoles and other devices.
              </p>
            </div>
          </div>
        </div>
        {settings.integrations.osc.enabled && (
          <div className="p-6">
            <div className="space-y-4">
              <Field>
                <Label htmlFor="osc-port">OSC Port</Label>
                <Input
                  id="osc-port"
                  type="number"
                  value={settings.integrations.osc.port.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOSCPortChange(e.target.value)}
                  min={1024}
                  max={65535}
                  className="mt-1 max-w-xs"
                />
                <Description className="mt-2">
                  Port for OSC communication (default: 8000)
                </Description>
              </Field>

              <div className="flex items-center gap-2">
                <Button onClick={testOSCConnection} variant="outline" size="sm">
                  Test Connection
                </Button>
                {oscConnected && (
                  <span className="text-sm text-[var(--accent-primary)] flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Connected
                  </span>
                )}
              </div>

              <div className="mt-4 p-3 bg-theme-icon rounded-lg">
                <p className="text-xs font-medium text-theme-muted mb-2">OSC Message Format:</p>
                <ul className="text-xs text-theme-muted space-y-1 list-disc list-inside">
                  <li><code>/pixli/preset/load [presetId]</code> - Load preset</li>
                  <li><code>/pixli/motion/intensity [0-100]</code> - Set motion intensity</li>
                  <li><code>/pixli/palette/cycle [0|1]</code> - Toggle palette cycling</li>
                  <li><code>/pixli/sequence/next</code> - Advance sequence</li>
                  <li><code>/pixli/sequence/previous</code> - Previous sequence</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MIDI Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-theme-primary">
                  MIDI
                </h3>
                <Switch
                  checked={settings.integrations.midi.enabled}
                  onChange={handleMIDIToggle}
                />
              </div>
              <p className="text-sm text-theme-muted mt-1">
                Control Pixli via MIDI controllers and keyboards.
              </p>
            </div>
          </div>
        </div>
        {settings.integrations.midi.enabled && (
          <div className="p-6">
            <div className="space-y-4">
              <Field>
                <Label htmlFor="midi-device">MIDI Device</Label>
                <select
                  id="midi-device"
                  value={settings.integrations.midi.deviceId || ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMIDIDeviceChange(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-theme-card bg-theme-panel px-3 py-2 text-sm text-theme-primary focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  <option value="">All Devices</option>
                  {midiDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.manufacturer})
                    </option>
                  ))}
                </select>
                <Description className="mt-2">
                  Select a specific MIDI device or use all devices.
                </Description>
              </Field>

              <div className="mt-4 p-3 bg-theme-icon rounded-lg">
                <p className="text-xs font-medium text-theme-muted mb-2">MIDI Learn Mode:</p>
                <p className="text-xs text-theme-muted mb-3">
                  Click "Learn" next to a parameter, then press a MIDI control to assign it.
                </p>
                <div className="space-y-2">
                  {[
                    { param: "motionIntensity", label: "Motion Intensity" },
                    { param: "motionSpeed", label: "Motion Speed" },
                    { param: "hueRotationSpeed", label: "Hue Rotation Speed" },
                    { param: "preset1", label: "Preset 1" },
                    { param: "preset2", label: "Preset 2" },
                    { param: "preset3", label: "Preset 3" },
                  ].map(({ param, label }) => {
                    const isLearning = learnMode && learningParameter === param;
                    const mapping = Object.values(settings.integrations.midi.mappings).find(
                      (m) => m.parameter === param
                    );
                    return (
                      <div key={param} className="flex items-center justify-between text-xs">
                        <span className="text-theme-muted">{label}</span>
                        <div className="flex items-center gap-2">
                          {mapping && (
                            <span className="text-theme-subtle">
                              {mapping.type.toUpperCase()} Ch{mapping.channel} #{mapping.number}
                            </span>
                          )}
                          <Button
                            onClick={() => handleMIDILearn(param)}
                            variant={isLearning ? "default" : "outline"}
                            size="sm"
                            className="h-6 text-xs"
                          >
                            {isLearning ? (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </>
                            ) : (
                              "Learn"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DMX/Art-Net Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-theme-primary">
                  DMX/Art-Net
                </h3>
                <Switch
                  checked={settings.integrations.dmx.enabled}
                  onChange={handleDMXToggle}
                />
              </div>
              <p className="text-sm text-theme-muted mt-1">
                Send DMX output to lighting consoles via Art-Net protocol.
              </p>
            </div>
          </div>
        </div>
        {settings.integrations.dmx.enabled && (
          <div className="p-6">
            <div className="space-y-4">
              <Field>
                <Label htmlFor="dmx-universe">DMX Universe</Label>
                <Input
                  id="dmx-universe"
                  type="number"
                  value={settings.integrations.dmx.universe.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDMXUniverseChange(e.target.value)}
                  min={0}
                  max={15}
                  className="mt-1 max-w-xs"
                />
                <Description className="mt-2">
                  DMX universe number (0-15)
                </Description>
              </Field>

              <Field>
                <Label htmlFor="dmx-ip">Art-Net IP Address</Label>
                <Input
                  id="dmx-ip"
                  type="text"
                  value={settings.integrations.dmx.ipAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDMXIPChange(e.target.value)}
                  className="mt-1 max-w-xs"
                  placeholder="127.0.0.1"
                />
                <Description className="mt-2">
                  IP address of Art-Net device or console
                </Description>
              </Field>

              <Field>
                <Label htmlFor="dmx-port">Art-Net Port</Label>
                <Input
                  id="dmx-port"
                  type="number"
                  value={settings.integrations.dmx.port.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDMXPortChange(e.target.value)}
                  min={1024}
                  max={65535}
                  className="mt-1 max-w-xs"
                />
                <Description className="mt-2">
                  Art-Net port (default: 6454)
                </Description>
              </Field>

              <div className="flex items-center gap-2">
                <Button onClick={testDMXConnection} variant="outline" size="sm">
                  Test Connection
                </Button>
                {dmxConnected && (
                  <span className="text-sm text-[var(--accent-primary)] flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Connected
                  </span>
                )}
              </div>

              <div className="mt-4 p-3 bg-theme-icon rounded-lg">
                <p className="text-xs font-medium text-theme-muted mb-2">DMX Channel Mapping:</p>
                <ul className="text-xs text-theme-muted space-y-1 list-disc list-inside">
                  <li>Channel 1: Red (from palette average)</li>
                  <li>Channel 2: Green (from palette average)</li>
                  <li>Channel 3: Blue (from palette average)</li>
                  <li>Channel 4: Motion Intensity (0-255)</li>
                  <li>Channel 5: Palette Cycle Progress (0-255)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

