import { Button } from "@/components/Button";
import { ArrowLeft, Settings } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/catalyst/switch-adapter";
import { SwitchField } from "@/components/catalyst/switch";

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage = ({ onClose }: SettingsPageProps) => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Back to canvas"
            title="Back to canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--accent-primary)]" />
            <h1 className="text-lg font-semibold text-[var(--heading-color)]">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Theme Settings */}
          <div className="section">
            <h3 className="section-title">Appearance</h3>
            <SwitchField>
              <SwitchField.Label>Theme</SwitchField.Label>
              <SwitchField.Description>
                Choose between light, dark, or system theme
              </SwitchField.Description>
              <SwitchField.Control>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={themeMode === "light"}
                      onChange={() => setThemeMode("light")}
                      className="sr-only"
                    />
                    <div className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      themeMode === "light"
                        ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                        : "bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-primary)]"
                    }`}>
                      Light
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={themeMode === "dark"}
                      onChange={() => setThemeMode("dark")}
                      className="sr-only"
                    />
                    <div className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      themeMode === "dark"
                        ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                        : "bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-primary)]"
                    }`}>
                      Dark
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={themeMode === "system"}
                      onChange={() => setThemeMode("system")}
                      className="sr-only"
                    />
                    <div className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      themeMode === "system"
                        ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                        : "bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-primary)]"
                    }`}>
                      System
                    </div>
                  </label>
                </div>
              </SwitchField.Control>
            </SwitchField>
          </div>
        </div>
      </div>
    </div>
  );
};

