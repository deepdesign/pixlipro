import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  getAllThemes, 
  getActiveThemeId, 
  setActiveThemeId, 
  deleteTheme, 
  updateTheme,
  type CustomTheme,
  DEFAULT_THEME_ID
} from "@/lib/storage/themeStorage";
import { applyTheme } from "@/lib/theme/themeApplier";
import { ThemeModal } from "./ThemeModal";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PRIMARY_COLORS, ACCENT_COLORS, getAccentColorName } from "@/lib/theme/tailwindColors";

export function ThemeTab() {
  const [themes, setThemes] = useState<CustomTheme[]>([]);
  const [activeThemeId, setActiveThemeIdState] = useState<string>(DEFAULT_THEME_ID);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);

  // Load themes and active theme on mount
  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = () => {
    const allThemes = getAllThemes();
    setThemes(allThemes);
    const activeId = getActiveThemeId();
    setActiveThemeIdState(activeId);
    
    // Apply active theme
    const activeTheme = allThemes.find((t) => t.id === activeId);
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  };

  const handleApplyTheme = (theme: CustomTheme) => {
    setActiveThemeId(theme.id);
    setActiveThemeIdState(theme.id);
    applyTheme(theme);
  };

  const handleDeleteTheme = (theme: CustomTheme) => {
    if (theme.isDefault) {
      return; // Cannot delete default theme
    }
    if (confirm(`Are you sure you want to delete "${theme.name}"?`)) {
      deleteTheme(theme.id);
      loadThemes();
      // If deleted theme was active, switch to default
      if (activeThemeId === theme.id) {
        const defaultTheme = themes.find((t) => t.id === DEFAULT_THEME_ID);
        if (defaultTheme) {
          handleApplyTheme(defaultTheme);
        }
      }
    }
  };

  const handleStartRename = (theme: CustomTheme) => {
    if (theme.isDefault) {
      return; // Cannot rename default theme
    }
    setEditingThemeId(theme.id);
    setEditingName(theme.name);
  };

  const handleCancelRename = () => {
    setEditingThemeId(null);
    setEditingName("");
  };

  const handleSaveRename = (theme: CustomTheme) => {
    if (editingName.trim()) {
      updateTheme(theme.id, { name: editingName.trim() });
      loadThemes();
      setEditingThemeId(null);
      setEditingName("");
    }
  };

  const handleEditTheme = (theme: CustomTheme) => {
    if (theme.isDefault) {
      return; // Cannot edit default theme
    }
    setEditingTheme(theme);
    setShowModal(true);
  };

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTheme(null);
    loadThemes();
  };

  const getPrimaryColorHex = (color: CustomTheme["primaryColor"], shade: keyof typeof PRIMARY_COLORS.slate = "500") => {
    return PRIMARY_COLORS[color]?.[shade] || PRIMARY_COLORS.slate[shade];
  };

  const getAccentColorHex = (color: CustomTheme["accentColor"], shade: keyof typeof ACCENT_COLORS.teal = "400") => {
    return ACCENT_COLORS[color]?.[shade] || ACCENT_COLORS.teal[shade];
  };

  return (
    <div className="space-y-6 px-6">
      {/* Create New Theme Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreateTheme}>
          Create New Theme
        </Button>
      </div>

      {/* Themes List */}
      <div className="space-y-4">
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const isEditing = editingThemeId === theme.id;

          return (
            <div
              key={theme.id}
              className={`bg-theme-panel rounded-lg border ${
                isActive ? "border-[var(--accent-primary)]" : "border-theme-card"
              } shadow-sm`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Theme Preview and Info */}
                  <div className="flex-1 flex items-start gap-4">
                    {/* Color Swatches */}
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded-lg border border-theme-card"
                        style={{ backgroundColor: getPrimaryColorHex(theme.primaryColor, "500") }}
                        title={`Primary: ${theme.primaryColor}`}
                      />
                      <div
                        className="w-12 h-12 rounded-lg border border-theme-card"
                        style={{ backgroundColor: getAccentColorHex(theme.accentColor, "400") }}
                        title={`Accent: ${getAccentColorName(theme.accentColor)}`}
                      />
                    </div>

                    {/* Theme Name */}
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveRename(theme);
                              } else if (e.key === "Escape") {
                                handleCancelRename();
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(theme)}
                            className="p-1 text-[var(--accent-primary)] hover:opacity-80"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 text-theme-muted hover:text-theme-primary"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-theme-primary">
                              {theme.name}
                            </h3>
                            {theme.isDefault && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-theme-status text-theme-muted rounded">
                                Default
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-theme-muted mt-1">
                            {theme.primaryColor.charAt(0).toUpperCase() + theme.primaryColor.slice(1)} + {getAccentColorName(theme.accentColor)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <Button
                          onClick={() => handleApplyTheme(theme)}
                          size="sm"
                        >
                          Apply
                        </Button>
                      )}
                      {!theme.isDefault && (
                        <>
                          <button
                            onClick={() => handleStartRename(theme)}
                            className="p-2 text-theme-muted hover:text-theme-primary rounded-lg hover:bg-theme-status transition-colors"
                            title="Rename"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditTheme(theme)}
                            className="p-2 text-theme-muted hover:text-theme-primary rounded-lg hover:bg-theme-status transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTheme(theme)}
                            className="p-2 text-theme-muted hover:text-status-error rounded-lg hover:bg-theme-status transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Theme Modal */}
      {showModal && (
        <ThemeModal
          isOpen={showModal}
          onClose={handleModalClose}
          editingTheme={editingTheme}
        />
      )}
    </div>
  );
}

