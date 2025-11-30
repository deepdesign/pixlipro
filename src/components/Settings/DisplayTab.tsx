import { useState, useEffect } from "react";
import { Field, Label, Description } from "@/components/catalyst/fieldset";
import { RadioGroup, RadioField, Radio } from "@/components/catalyst/radio";
import { Input } from "@/components/catalyst/input";
import { Switch, SwitchField } from "@/components/catalyst/switch";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/storage/settingsStorage";
import { Info, Monitor } from "lucide-react";
import { useDualMonitor } from "@/hooks/useDualMonitor";

interface DisplayTabProps {
  onAspectRatioChange?: (aspectRatio: AppSettings["aspectRatio"], custom?: { width: number; height: number }) => void;
}

const ASPECT_RATIO_PRESETS = {
  "16:9": { 
    label: "16:9 (Widescreen)", 
    ratio: 16/9, 
    description: "Industry standard for most events, conferences, video playback",
    resolutions: ["1920×1080 (Full HD)", "3840×2160 (4K UHD)"]
  },
  "21:9": { 
    label: "21:9 (Ultra-Wide)", 
    ratio: 21/9, 
    description: "Immersive displays, wide rooms, edge-blended multi-projector setups",
    resolutions: ["2560×1080 (Full HD Ultra-Wide)", "3440×1440 (QHD Ultra-Wide)"]
  },
  "16:10": { 
    label: "16:10 (WUXGA)", 
    ratio: 16/10, 
    description: "Professional/commercial projectors, versatile for presentations",
    resolutions: ["1920×1200 (WUXGA)"]
  },
  "custom": { 
    label: "Custom", 
    ratio: null, 
    description: "Unique stage designs, projection mapping, modular LED walls" 
  },
} as const;

export function DisplayTab({ onAspectRatioChange }: DisplayTabProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [customWidth, setCustomWidth] = useState(settings.customAspectRatio.width.toString());
  const [customHeight, setCustomHeight] = useState(settings.customAspectRatio.height.toString());
  const dualMonitor = useDualMonitor();

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setCustomWidth(loaded.customAspectRatio.width.toString());
    setCustomHeight(loaded.customAspectRatio.height.toString());
  }, []);

  const handleAspectRatioChange = (value: string) => {
    const aspectRatio = value as AppSettings["aspectRatio"];
    const newSettings = { ...settings, aspectRatio };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    if (aspectRatio === "custom") {
      const width = parseInt(customWidth) || 1920;
      const height = parseInt(customHeight) || 1080;
      onAspectRatioChange?.(aspectRatio, { width, height });
    } else {
      onAspectRatioChange?.(aspectRatio);
    }
  };

  const handleCustomWidthChange = (value: string) => {
    setCustomWidth(value);
    const width = parseInt(value) || 1920;
    const height = parseInt(customHeight) || 1080;
    const newSettings = { 
      ...settings, 
      aspectRatio: "custom",
      customAspectRatio: { width, height }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    onAspectRatioChange?.("custom", { width, height });
  };

  const handleCustomHeightChange = (value: string) => {
    setCustomHeight(value);
    const width = parseInt(customWidth) || 1920;
    const height = parseInt(value) || 1080;
    const newSettings = { 
      ...settings, 
      aspectRatio: "custom",
      customAspectRatio: { width, height }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    onAspectRatioChange?.("custom", { width, height });
  };

  const handleDualMonitorToggle = (enabled: boolean) => {
    const newSettings = { ...settings, dualMonitorEnabled: enabled };
    setSettings(newSettings);
    saveSettings(newSettings);
    dualMonitor.setEnabled(enabled);
  };

  const currentPreset = ASPECT_RATIO_PRESETS[settings.aspectRatio];
  const recommendedResolution = settings.aspectRatio === "custom" 
    ? `${settings.customAspectRatio.width}×${settings.customAspectRatio.height}`
    : (currentPreset && "resolutions" in currentPreset && currentPreset.resolutions?.[0]) || "";

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Aspect ratio</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Set the canvas aspect ratio for projection displays. Match your projector's native aspect ratio to avoid distortion.
              </p>
            </div>
            <Info className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
          </div>
        </div>
        <div className="p-6">
          <Field>
            <Label>Aspect ratio</Label>
            <Description>
              Choose a standard ratio or define custom dimensions for unique projection setups.
            </Description>
            <div data-slot="control" className="mt-4">
              <RadioGroup value={settings.aspectRatio} onChange={handleAspectRatioChange}>
                {(Object.keys(ASPECT_RATIO_PRESETS) as Array<keyof typeof ASPECT_RATIO_PRESETS>).map((key) => {
                  const preset = ASPECT_RATIO_PRESETS[key];
                  return (
                    <RadioField key={key}>
                      <Radio value={key} />
                      <div className="flex-1">
                        <label className="font-medium text-slate-900 dark:text-white">{preset.label}</label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {preset.description}
                        </p>
                        {"resolutions" in preset && preset.resolutions && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Recommended: {preset.resolutions.join(", ")}
                          </p>
                        )}
                      </div>
                    </RadioField>
                  );
                })}
              </RadioGroup>
            </div>
          </Field>

          {/* Custom Aspect Ratio Inputs */}
          {settings.aspectRatio === "custom" && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Field>
                <Label>Custom dimensions</Label>
                <Description>
                  Enter width and height in pixels for your custom projection setup.
                </Description>
                <div data-slot="control" className="mt-4 flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="custom-width" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Width (px)
                    </label>
                    <Input
                      id="custom-width"
                      type="number"
                      value={customWidth}
                      onChange={(e) => handleCustomWidthChange(e.target.value)}
                      min={320}
                      max={7680}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="custom-height" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Height (px)
                    </label>
                    <Input
                      id="custom-height"
                      type="number"
                      value={customHeight}
                      onChange={(e) => handleCustomHeightChange(e.target.value)}
                      min={240}
                      max={4320}
                    />
                  </div>
                </div>
              </Field>
            </div>
          )}

          {/* Recommended Resolution Display */}
          {recommendedResolution && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                    <span className="font-medium">Recommended resolution:</span> {recommendedResolution}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dual Monitor Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dual monitor support</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Split the app across two monitors: controls on primary, canvas on secondary (projector)
              </p>
            </div>
            <Monitor className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
          </div>
        </div>
        <div className="p-6">
          <Field>
            <SwitchField>
              <Switch
                checked={settings.dualMonitorEnabled}
                onChange={handleDualMonitorToggle}
              />
              <div className="flex-1">
                <Label>Enable dual monitor mode</Label>
                <Description>
                  When enabled, you can open a projector window on your secondary display. The primary monitor shows all controls, while the secondary shows only the canvas.
                </Description>
              </div>
            </SwitchField>
          </Field>

          {settings.dualMonitorEnabled && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Projector window
                  </label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {dualMonitor.isProjectorMode 
                      ? "Projector window is open on secondary display"
                      : "Click the button below to open the projector window"}
                  </p>
                </div>
                {dualMonitor.isProjectorMode ? (
                  <button
                    type="button"
                    onClick={dualMonitor.closeProjectorWindow}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Close projector window
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dualMonitor.openProjectorWindow}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Open projector window
                  </button>
                )}
              </div>
              {!dualMonitor.hasMultipleScreens && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    <span className="font-medium">Note:</span> Multiple screens not detected. Make sure your secondary display is connected and configured in your system settings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Resolution</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure canvas resolution presets
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Resolution presets coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

