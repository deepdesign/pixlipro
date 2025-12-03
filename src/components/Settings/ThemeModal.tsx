import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogBody, DialogActions } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label, Description } from "@/components/ui/Fieldset";
import { Input } from "@/components/ui/Input";
import { 
  saveTheme, 
  updateTheme, 
  type CustomTheme 
} from "@/lib/storage/themeStorage";
import { PRIMARY_COLORS, ACCENT_COLORS, getAccentColorName, type PrimaryColor, type AccentColor } from "@/lib/theme/tailwindColors";

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTheme: CustomTheme | null;
}

const PRIMARY_COLOR_OPTIONS: PrimaryColor[] = ["slate", "gray", "zinc", "neutral"];
const ACCENT_COLOR_OPTIONS: AccentColor[] = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"
];

export function ThemeModal({ isOpen, onClose, editingTheme }: ThemeModalProps) {
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>("slate");
  const [accentColor, setAccentColor] = useState<AccentColor>("teal");

  useEffect(() => {
    if (editingTheme) {
      setName(editingTheme.name);
      setPrimaryColor(editingTheme.primaryColor);
      setAccentColor(editingTheme.accentColor);
    } else {
      setName("");
      setPrimaryColor("slate");
      setAccentColor("teal");
    }
  }, [editingTheme, isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    if (editingTheme) {
      updateTheme(editingTheme.id, {
        name: name.trim(),
        primaryColor,
        accentColor,
      });
    } else {
      saveTheme({
        name: name.trim(),
        primaryColor,
        accentColor,
        isDefault: false,
      });
    }

    onClose();
  };

  const getPrimaryColorHex = (color: PrimaryColor, shade: "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950" = "500") => {
    return PRIMARY_COLORS[color]?.[shade] || PRIMARY_COLORS.slate[shade];
  };

  const getAccentColorHex = (color: AccentColor, shade: "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950" = "400") => {
    return ACCENT_COLORS[color]?.[shade] || ACCENT_COLORS.teal[shade];
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="lg">
      <DialogTitle>{editingTheme ? "Edit Theme" : "Create New Theme"}</DialogTitle>
      <DialogBody>
        <div className="space-y-6">
          {/* Name Field */}
          <Field>
            <Label>Theme Name</Label>
            <Description>
              Give your theme a descriptive name.
            </Description>
            <div data-slot="control" className="mt-4">
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="e.g., Slate + Teal"
              />
            </div>
          </Field>

          {/* Primary Color Field */}
          <Field>
            <Label>Primary Color</Label>
            <Description>
              Choose the main UI color for backgrounds, text, and borders.
            </Description>
            <div data-slot="control" className="mt-4">
              <div className="grid grid-cols-4 gap-3">
                {PRIMARY_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPrimaryColor(color)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      primaryColor === color
                        ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-theme-panel"
                        : "border-theme-card hover:border-theme-border"
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded mb-2"
                      style={{ backgroundColor: getPrimaryColorHex(color, "500") }}
                    />
                    <div className="text-sm font-medium text-theme-primary capitalize">
                      {color}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Accent Color Field */}
          <Field>
            <Label>Accent Color</Label>
            <Description>
              Choose the accent color for buttons, highlights, and links.
            </Description>
            <div data-slot="control" className="mt-4">
              <div className="grid grid-cols-4 gap-3">
                {ACCENT_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      accentColor === color
                        ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-theme-panel"
                        : "border-theme-card hover:border-theme-border"
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded mb-2"
                      style={{ backgroundColor: getAccentColorHex(color, "400") }}
                    />
                    <div className="text-sm font-medium text-theme-primary">
                      {getAccentColorName(color)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Live Preview */}
          <Field>
            <Label>Preview</Label>
            <Description>
              Preview of your theme colors.
            </Description>
            <div data-slot="control" className="mt-4">
              <div className="flex gap-4 p-4 bg-theme-panel rounded-lg border border-theme-card">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-lg border border-theme-card"
                    style={{ backgroundColor: getPrimaryColorHex(primaryColor, "500") }}
                  />
                  <span className="text-xs text-theme-muted">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-lg border border-theme-card"
                    style={{ backgroundColor: getAccentColorHex(accentColor, "400") }}
                  />
                  <span className="text-xs text-theme-muted">Accent</span>
                </div>
              </div>
            </div>
          </Field>
        </div>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          {editingTheme ? "Save Changes" : "Create Theme"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

