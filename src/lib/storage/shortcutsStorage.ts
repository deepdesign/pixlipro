/**
 * Keyboard Shortcuts Storage
 * 
 * Handles persistence of keyboard shortcut bindings.
 */

export interface ShortcutBinding {
  action: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface ShortcutsSettings {
  bindings: { [action: string]: ShortcutBinding };
}

const SHORTCUTS_KEY = "pixli-shortcuts";

const DEFAULT_SHORTCUTS: ShortcutsSettings = {
  bindings: {
    playPauseSequence: {
      action: "playPauseSequence",
      key: " ",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    nextPreset: {
      action: "nextPreset",
      key: "ArrowRight",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    previousPreset: {
      action: "previousPreset",
      key: "ArrowLeft",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    loadPreset1: {
      action: "loadPreset1",
      key: "1",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    loadPreset2: {
      action: "loadPreset2",
      key: "2",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    loadPreset3: {
      action: "loadPreset3",
      key: "3",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    loadPreset4: {
      action: "loadPreset4",
      key: "4",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    loadPreset5: {
      action: "loadPreset5",
      key: "5",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    toggleFullscreen: {
      action: "toggleFullscreen",
      key: "F11",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    randomizeAll: {
      action: "randomizeAll",
      key: "r",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    showPresets: {
      action: "showPresets",
      key: "p",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    showExport: {
      action: "showExport",
      key: "e",
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
  },
};

/**
 * Load shortcuts from localStorage
 */
export function loadShortcuts(): ShortcutsSettings {
  try {
    const stored = localStorage.getItem(SHORTCUTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SHORTCUTS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load shortcuts:", error);
  }
  return { ...DEFAULT_SHORTCUTS };
}

/**
 * Save shortcuts to localStorage
 */
export function saveShortcuts(shortcuts: Partial<ShortcutsSettings>): void {
  try {
    const current = loadShortcuts();
    const updated = {
      ...current,
      bindings: {
        ...current.bindings,
        ...(shortcuts.bindings || {}),
      },
    };
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save shortcuts:", error);
  }
}

/**
 * Get shortcut binding for an action
 */
export function getShortcutBinding(action: string): ShortcutBinding | null {
  const shortcuts = loadShortcuts();
  return shortcuts.bindings[action] || null;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.ctrl || binding.meta) {
    parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (binding.alt) {
    parts.push("Alt");
  }
  if (binding.shift) {
    parts.push("Shift");
  }
  
  // Format key name
  let keyName = binding.key;
  if (keyName === " ") {
    keyName = "Space";
  } else if (keyName.startsWith("Arrow")) {
    keyName = keyName.replace("Arrow", "");
  } else if (keyName.startsWith("F")) {
    // Function keys are fine as-is
  } else {
    keyName = keyName.toUpperCase();
  }
  
  parts.push(keyName);
  return parts.join(" + ");
}

/**
 * Check if a keyboard event matches a shortcut binding
 */
export function matchesShortcut(
  event: KeyboardEvent,
  binding: ShortcutBinding
): boolean {
  if (event.key !== binding.key && event.code !== binding.key) {
    return false;
  }
  
  const ctrlMatch = binding.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatch = binding.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = binding.alt ? event.altKey : !event.altKey;
  const metaMatch = binding.meta ? event.metaKey : !event.metaKey;
  
  return ctrlMatch && shiftMatch && altMatch && metaMatch;
}


