/**
 * DMX/Art-Net Integration
 * 
 * Handles DMX output via Art-Net protocol.
 * Note: Requires Node.js backend server for actual DMX output.
 */

export interface DMXSettings {
  enabled: boolean;
  universe: number;
  ipAddress: string;
  port: number;
}

export interface DMXChannel {
  channel: number;
  value: number; // 0-255
}

export class DMXClient {
  private ws: WebSocket | null = null;
  private settings: DMXSettings;
  private channels: Map<number, number> = new Map();

  constructor(settings: DMXSettings) {
    this.settings = settings;
  }

  /**
   * Connect to DMX server via WebSocket (requires backend server)
   */
  async connect(): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    try {
      // DMX messages are routed through the WebSocket server
      // The backend server handles actual Art-Net protocol
      const wsUrl = `ws://localhost:${this.settings.port}/dmx`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[DMX] Connected to DMX server");
        // Send initial configuration
        this.sendConfig();
      };

      this.ws.onerror = (error) => {
        console.error("[DMX] Connection error:", error);
      };

      this.ws.onclose = () => {
        console.log("[DMX] Disconnected from DMX server");
        this.ws = null;
      };
    } catch (error) {
      console.error("[DMX] Failed to connect:", error);
    }
  }

  /**
   * Send configuration to server
   */
  private sendConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "config",
        universe: this.settings.universe,
        ipAddress: this.settings.ipAddress,
        port: this.settings.port,
      })
    );
  }

  /**
   * Set DMX channel value
   */
  setChannel(channel: number, value: number): void {
    if (channel < 1 || channel > 512) {
      console.warn(`[DMX] Invalid channel: ${channel}`);
      return;
    }

    const clampedValue = Math.max(0, Math.min(255, Math.round(value)));
    this.channels.set(channel, clampedValue);
    this.sendChannelUpdate(channel, clampedValue);
  }

  /**
   * Set multiple DMX channels
   */
  setChannels(channels: DMXChannel[]): void {
    channels.forEach(({ channel, value }) => {
      this.setChannel(channel, value);
    });
  }

  /**
   * Send channel update to server
   */
  private sendChannelUpdate(channel: number, value: number): void {
    if (!this.settings.enabled || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "channel",
        universe: this.settings.universe,
        channel,
        value,
      })
    );
  }

  /**
   * Send all channels at once (for efficiency)
   */
  sendAllChannels(): void {
    if (!this.settings.enabled || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const channels: DMXChannel[] = Array.from(this.channels.entries()).map(([channel, value]) => ({
      channel,
      value,
    }));

    this.ws.send(
      JSON.stringify({
        type: "channels",
        universe: this.settings.universe,
        channels,
      })
    );
  }

  /**
   * Get current channel value
   */
  getChannel(channel: number): number {
    return this.channels.get(channel) || 0;
  }

  /**
   * Clear all channels (set to 0)
   */
  clearAll(): void {
    this.channels.clear();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "clear",
          universe: this.settings.universe,
        })
      );
    }
  }

  /**
   * Update settings and reconnect if needed
   */
  updateSettings(newSettings: DMXSettings): void {
    const wasEnabled = this.settings.enabled;
    this.settings = newSettings;

    if (wasEnabled && !newSettings.enabled) {
      this.disconnect();
    } else if (!wasEnabled && newSettings.enabled) {
      this.connect();
    } else if (wasEnabled && newSettings.enabled) {
      // Update config if universe/IP/port changed
      if (
        this.settings.universe !== newSettings.universe ||
        this.settings.ipAddress !== newSettings.ipAddress ||
        this.settings.port !== newSettings.port
      ) {
        this.disconnect();
        this.connect();
      }
    }
  }

  /**
   * Disconnect from DMX server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Map generator state to DMX channels
   * Channels 1-3: RGB from current palette average
   * Channel 4: Motion intensity (0-255)
   * Channel 5: Palette cycle progress (0-255)
   */
  mapGeneratorState(state: {
    palette?: { colors?: string[] };
    motionIntensity?: number;
  }): void {
    // RGB from palette average
    if (state.palette?.colors && state.palette.colors.length > 0) {
      const avgColor = this.averageColor(state.palette.colors);
      this.setChannel(1, avgColor.r);
      this.setChannel(2, avgColor.g);
      this.setChannel(3, avgColor.b);
    }

    // Motion intensity
    if (state.motionIntensity !== undefined) {
      this.setChannel(4, Math.round(state.motionIntensity * 2.55)); // 0-100 to 0-255
    }

  }

  /**
   * Calculate average color from palette
   */
  private averageColor(colors: string[]): { r: number; g: number; b: number } {
    let r = 0;
    let g = 0;
    let b = 0;

    colors.forEach((color) => {
      const rgb = this.hexToRgb(color);
      if (rgb) {
        r += rgb.r;
        g += rgb.g;
        b += rgb.b;
      }
    });

    const count = colors.length;
    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    };
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}

/**
 * Create DMX client instance
 */
export function createDMXClient(settings: DMXSettings): DMXClient {
  return new DMXClient(settings);
}


