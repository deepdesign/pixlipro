import { useState, useEffect } from "react";
import { Field, Label, Description } from "@/components/ui/Fieldset";
import { RadioGroup, RadioField, Radio } from "@/components/ui/radio";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/storage/settingsStorage";
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
    const newSettings: AppSettings = { 
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
    const newSettings: AppSettings = { 
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
    <div className="space-y-6 px-6">
      {/* Aspect Ratio Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div>
            <h3 className="text-base font-semibold text-theme-primary">Aspect ratio</h3>
            <p className="text-sm text-theme-muted mt-1">
              Set the canvas aspect ratio for projection displays. Match your projector's native aspect ratio to avoid distortion.
            </p>
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
                        <label className="font-medium text-theme-primary">{preset.label}</label>
                        <p className="text-sm text-theme-muted mt-0.5">
                          {preset.description}
                        </p>
                        {"resolutions" in preset && preset.resolutions && (
                          <p className="text-xs text-theme-subtle mt-1">
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
            <div className="mt-6 pt-6 border-t border-theme-card">
              <Field>
                <Label>Custom dimensions</Label>
                <Description>
                  Enter width and height in pixels for your custom projection setup.
                </Description>
                <div data-slot="control" className="mt-4 flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="custom-width" className="block text-sm font-medium text-theme-muted mb-1">
                      Width (px)
                    </label>
                    <Input
                      id="custom-width"
                      type="number"
                      value={customWidth}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomWidthChange(e.target.value)}
                      min={320}
                      max={7680}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="custom-height" className="block text-sm font-medium text-theme-muted mb-1">
                      Height (px)
                    </label>
                    <Input
                      id="custom-height"
                      type="number"
                      value={customHeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomHeightChange(e.target.value)}
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
            <div className="mt-4 p-3 bg-theme-status rounded-lg border border-theme-card">
              <p className="text-sm text-theme-primary">
                    <span className="font-medium">Recommended resolution:</span> {recommendedResolution}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dual Monitor Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-theme-primary">Dual monitor support</h3>
                <Switch
                  checked={settings.dualMonitorEnabled}
                  onChange={handleDualMonitorToggle}
                />
              </div>
              <p className="text-sm text-theme-muted mt-1">
                Split the app across two monitors: controls on primary, canvas on secondary (projector)
              </p>
            </div>
          </div>
        </div>
        {settings.dualMonitorEnabled && (
          <div className="p-6 !border-b-0">
            <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-theme-muted">
                    Projector window
                  </label>
                  <p className="text-sm text-theme-muted mt-1">
                    {dualMonitor.isProjectorMode 
                      ? "Projector window is open on secondary display"
                      : "Click the button below to open the projector window"}
                  </p>
                </div>
                {dualMonitor.isProjectorMode ? (
                  <button
                    type="button"
                    onClick={dualMonitor.closeProjectorWindow}
                    className="px-4 py-2 text-sm font-medium text-white bg-status-error hover:opacity-90 rounded-lg transition-colors"
                  >
                    Close projector window
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dualMonitor.openProjectorWindow}
                    className="px-4 py-2 text-sm font-medium bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:opacity-90 rounded-lg transition-colors"
                  >
                    Open projector window
                  </button>
                )}
              </div>
              {!dualMonitor.hasMultipleScreens && (
                <div className="mt-4 p-3 bg-theme-status rounded-lg border border-theme-card">
                  <p className="text-sm text-theme-primary">
                    <span className="font-medium">Note:</span> Multiple screens not detected. Make sure your secondary display is connected and configured in your system settings.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

