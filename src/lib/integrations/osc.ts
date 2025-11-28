/**
 * OSC (Open Sound Control) Integration
 * 
 * Handles OSC message sending and receiving for industry-standard control.
 * Note: OSC requires a Node.js backend server for full functionality.
 */

export interface OSCMessage {
  address: string;
  args: (number | string)[];
}

export interface OSCSettings {
  enabled: boolean;
  port: number;
  listenPort: number;
}

export class OSCClient {
  private ws: WebSocket | null = null;
  private settings: OSCSettings;
  private onMessageCallback: ((message: OSCMessage) => void) | null = null;

  constructor(settings: OSCSettings) {
    this.settings = settings;
  }

  /**
   * Connect to OSC server via WebSocket (requires backend server)
   */
  async connect(): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    try {
      // OSC messages are routed through the WebSocket server
      // The backend server handles actual OSC protocol
      const wsUrl = `ws://localhost:${this.settings.port}/osc`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[OSC] Connected to OSC server");
      };

      this.ws.onmessage = (event) => {
        try {
          const message: OSCMessage = JSON.parse(event.data);
          this.onMessageCallback?.(message);
        } catch (error) {
          console.error("[OSC] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[OSC] Connection error:", error);
      };

      this.ws.onclose = () => {
        console.log("[OSC] Disconnected from OSC server");
        this.ws = null;
      };
    } catch (error) {
      console.error("[OSC] Failed to connect:", error);
    }
  }

  /**
   * Send OSC message
   */
  send(address: string, ...args: (number | string)[]): void {
    if (!this.settings.enabled || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: OSCMessage = {
      address,
      args,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Set callback for incoming OSC messages
   */
  onMessage(callback: (message: OSCMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Disconnect from OSC server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Update settings and reconnect if needed
   */
  updateSettings(newSettings: OSCSettings): void {
    const wasEnabled = this.settings.enabled;
    this.settings = newSettings;

    if (wasEnabled && !newSettings.enabled) {
      this.disconnect();
    } else if (!wasEnabled && newSettings.enabled) {
      this.connect();
    } else if (wasEnabled && newSettings.enabled && this.settings.port !== newSettings.port) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Send preset load command
   */
  sendPresetLoad(presetId: string): void {
    this.send("/pixli/preset/load", presetId);
  }

  /**
   * Send motion intensity command
   */
  sendMotionIntensity(intensity: number): void {
    this.send("/pixli/motion/intensity", Math.max(0, Math.min(100, intensity)));
  }

  /**
   * Send palette cycle toggle
   */
  sendPaletteCycle(enabled: boolean): void {
    this.send("/pixli/palette/cycle", enabled ? 1 : 0);
  }

  /**
   * Send sequence next command
   */
  sendSequenceNext(): void {
    this.send("/pixli/sequence/next");
  }

  /**
   * Send sequence previous command
   */
  sendSequencePrevious(): void {
    this.send("/pixli/sequence/previous");
  }
}

/**
 * Create OSC client instance
 */
export function createOSCClient(settings: OSCSettings): OSCClient {
  return new OSCClient(settings);
}


