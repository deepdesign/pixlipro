/**
 * Settings Storage Utilities
 * 
 * Handles persistence of application settings in localStorage.
 */

export interface OSCSettings {
  enabled: boolean;
  port: number;
  listenPort: number;
}

export interface MIDISettings {
  enabled: boolean;
  deviceId: string | null;
  learnMode: boolean;
  mappings: {
    [key: string]: {
      parameter: string;
      type: "cc" | "note";
      channel: number;
      number: number;
    };
  };
}

export interface DMXSettings {
  enabled: boolean;
  universe: number;
  ipAddress: string;
  port: number;
}

export interface IntegrationSettings {
  osc: OSCSettings;
  midi: MIDISettings;
  dmx: DMXSettings;
}

export interface AppSettings {
  aspectRatio: "16:9" | "21:9" | "16:10" | "custom"; // Square removed, defaults to 16:9
  customAspectRatio: { width: number; height: number };
  dualMonitorEnabled: boolean;
  remoteControlEnabled: boolean;
  remoteControlPort: number;
  canvasBlackBackground: boolean;
  projectorMaxResolution: "720p" | "1080p" | "1440p" | "4k" | "unlimited";
  integrations: IntegrationSettings;
}

const SETTINGS_KEY = "pixli-settings";

const DEFAULT_SETTINGS: AppSettings = {
  aspectRatio: "16:9",
  customAspectRatio: { width: 1920, height: 1080 },
  dualMonitorEnabled: false,
  remoteControlEnabled: false,
  remoteControlPort: 8080,
  canvasBlackBackground: false,
  projectorMaxResolution: "1080p",
  integrations: {
    osc: {
      enabled: false,
      port: 8000,
      listenPort: 8000,
    },
    midi: {
      enabled: false,
      deviceId: null,
      learnMode: false,
      mappings: {},
    },
    dmx: {
      enabled: false,
      universe: 0,
      ipAddress: "127.0.0.1",
      port: 6454,
    },
  },
};

/**
 * Load settings from localStorage
 */
export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate "square" to "16:9" (remove square support)
      if (parsed.aspectRatio === "square") {
        parsed.aspectRatio = "16:9";
      }
      // Merge with defaults to ensure all properties exist
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

/**
 * Export settings as JSON
 */
export function exportSettings(): string {
  const settings = loadSettings();
  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON
 */
export function importSettings(json: string): AppSettings {
  try {
    const parsed = JSON.parse(json);
    const settings = { ...DEFAULT_SETTINGS, ...parsed };
    saveSettings(settings);
    return settings;
  } catch (error) {
    console.error("Failed to import settings:", error);
    throw new Error("Invalid settings JSON");
  }
}

/**
 * Initialize settings on app startup
 */
export function initializeSettings(): void {
  // Ensure settings exist in localStorage
  loadSettings();
}