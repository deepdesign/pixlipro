import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/Button";
import {
  loadShortcuts,
  saveShortcuts,
  formatShortcut,
  type ShortcutBinding,
  type ShortcutsSettings,
} from "@/lib/storage/shortcutsStorage";
import { Keyboard, Edit2, X } from "lucide-react";

interface ShortcutsTabProps {
  onShortcutChange?: (action: string, binding: ShortcutBinding) => void;
}

export function ShortcutsTab({ onShortcutChange }: ShortcutsTabProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutsSettings>(() => loadShortcuts());
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [, setCapturingKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAction && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAction]);

  const handleStartEdit = (action: string) => {
    setEditingAction(action);
    setCapturingKey(true);
  };

  const handleCancelEdit = () => {
    setEditingAction(null);
    setCapturingKey(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, action: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape") {
      handleCancelEdit();
      return;
    }

    // Don't capture modifier keys alone
    if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
      return;
    }

    const binding: ShortcutBinding = {
      action,
      key: event.key === " " ? " " : event.code || event.key,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    };

    const newShortcuts = {
      ...shortcuts,
      bindings: {
        ...shortcuts.bindings,
        [action]: binding,
      },
    };

    setShortcuts(newShortcuts);
    saveShortcuts(newShortcuts);
    setEditingAction(null);
    setCapturingKey(false);
    onShortcutChange?.(action, binding);
  };

  const handleReset = (action: string) => {
    const defaultShortcuts = loadShortcuts();
    const defaultBinding = defaultShortcuts.bindings[action];
    if (defaultBinding) {
      const newShortcuts = {
        ...shortcuts,
        bindings: {
          ...shortcuts.bindings,
          [action]: defaultBinding,
        },
      };
      setShortcuts(newShortcuts);
      saveShortcuts(newShortcuts);
      onShortcutChange?.(action, defaultBinding);
    }
  };

  const shortcutGroups = [
    {
      title: "Sequence Control",
      shortcuts: [
        { action: "playPauseSequence", label: "Play/Pause Sequence" },
        { action: "nextPreset", label: "Next Preset" },
        { action: "previousPreset", label: "Previous Preset" },
      ],
    },
    {
      title: "Preset Loading",
      shortcuts: [
        { action: "loadPreset1", label: "Load Preset 1" },
        { action: "loadPreset2", label: "Load Preset 2" },
        { action: "loadPreset3", label: "Load Preset 3" },
        { action: "loadPreset4", label: "Load Preset 4" },
        { action: "loadPreset5", label: "Load Preset 5" },
      ],
    },
    {
      title: "General",
      shortcuts: [
        { action: "toggleFullscreen", label: "Toggle Fullscreen" },
        { action: "randomizeAll", label: "Randomize All" },
        { action: "showPresets", label: "Show Presets" },
        { action: "showExport", label: "Show Export" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Keyboard Shortcuts Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-theme-primary flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <p className="text-sm text-theme-muted mt-1">
                Customize keyboard bindings for quick actions. Click a shortcut to edit it.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={groupIndex > 0 ? "mt-6 pt-6 border-t border-theme-card" : ""}>
              <h4 className="text-sm font-semibold text-theme-primary mb-3">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map(({ action, label }) => {
                  const binding = shortcuts.bindings[action];
                  const isEditing = editingAction === action;

                  return (
                    <div
                      key={action}
                      className="flex items-center justify-between p-3 bg-theme-icon rounded-lg hover:bg-theme-icon/80 transition-colors"
                    >
                      <Label className="text-sm text-theme-muted">
                        {label}
                      </Label>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <Input
                            ref={inputRef}
                            type="text"
                            value=""
                            placeholder="Press a key..."
                            onKeyDown={(e) => handleKeyDown(e, action)}
                            onBlur={handleCancelEdit}
                            className="w-48 text-sm"
                            autoFocus
                          />
                        ) : (
                          <>
                            <kbd className="px-2 py-1 text-xs font-semibold text-theme-primary bg-theme-select border border-theme-panel rounded">
                              {binding ? formatShortcut(binding) : "Not set"}
                            </kbd>
                            <Button
                              onClick={() => handleStartEdit(action)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              title="Edit shortcut"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleReset(action)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              title="Reset to default"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <h3 className="text-base font-semibold text-theme-primary">
            How to Set Shortcuts
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2 text-sm text-theme-muted list-disc list-inside">
            <li>Click the edit icon next to a shortcut to change it</li>
            <li>Press the key combination you want to assign</li>
            <li>Press Escape to cancel editing</li>
            <li>Click the X icon to reset a shortcut to its default</li>
            <li>Shortcuts work globally when the app is focused</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


