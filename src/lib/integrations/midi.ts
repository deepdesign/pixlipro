/**
 * MIDI Integration
 * 
 * Handles MIDI input/output using Web MIDI API.
 */

export interface MIDIMessage {
  type: "cc" | "noteon" | "noteoff";
  channel: number;
  number: number;
  value: number;
}

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: "connected" | "disconnected";
}

export interface MIDISettings {
  enabled: boolean;
  deviceId: string | null;
  learnMode: boolean;
  mappings: {
    [key: string]: {
      type: "cc" | "note";
      channel: number;
      number: number;
    };
  };
}

export interface MIDIMapping {
  parameter: string;
  type: "cc" | "note";
  channel: number;
  number: number;
}

export class MIDIClient {
  private access: MIDIAccess | null = null;
  private settings: MIDISettings;
  private onMessageCallback: ((message: MIDIMessage) => void) | null = null;
  private onLearnCallback: ((message: MIDIMessage) => void) | null = null;
  private devices: MIDIDevice[] = [];

  constructor(settings: MIDISettings) {
    this.settings = settings;
  }

  /**
   * Request MIDI access and initialize
   */
  async initialize(): Promise<boolean> {
    if (!this.settings.enabled) {
      return false;
    }

    if (!navigator.requestMIDIAccess) {
      console.warn("[MIDI] Web MIDI API not available");
      return false;
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.setupInputs();
      this.setupOutputs();
      return true;
    } catch (error) {
      console.error("[MIDI] Failed to request MIDI access:", error);
      return false;
    }
  }

  /**
   * Setup MIDI input listeners
   */
  private setupInputs(): void {
    if (!this.access) return;

    // List all input devices
    this.devices = Array.from(this.access.inputs.values()).map((input) => ({
      id: input.id,
      name: input.name || "Unknown Device",
      manufacturer: input.manufacturer || "Unknown",
      state: input.state === "connected" ? "connected" : "disconnected",
    }));

    // Listen to all inputs or specific device
    this.access.inputs.forEach((input) => {
      if (!this.settings.deviceId || input.id === this.settings.deviceId) {
        input.onmidimessage = (event) => {
          this.handleMIDIMessage(event);
        };
      }
    });

    // Listen for device connections/disconnections
    this.access.onstatechange = (event) => {
      if (event.port.type === "input") {
        const device = {
          id: event.port.id,
          name: event.port.name || "Unknown Device",
          manufacturer: event.port.manufacturer || "Unknown",
          state: event.port.state === "connected" ? "connected" : "disconnected",
        };

        if (event.port.state === "connected") {
          // Add new device
          if (!this.devices.find((d) => d.id === device.id)) {
            this.devices.push(device);
          }

          // Setup listener for new device
          if (!this.settings.deviceId || event.port.id === this.settings.deviceId) {
            const input = this.access?.inputs.get(event.port.id);
            if (input) {
              input.onmidimessage = (event) => {
                this.handleMIDIMessage(event);
              };
            }
          }
        } else {
          // Remove disconnected device
          this.devices = this.devices.filter((d) => d.id !== device.id);
        }
      }
    };
  }

  /**
   * Setup MIDI outputs (for sending MIDI messages)
   */
  private setupOutputs(): void {
    // Output setup can be added here if needed
  }

  /**
   * Handle incoming MIDI message
   */
  private handleMIDIMessage(event: MIDIMessageEvent): void {
    const [status, number, value] = event.data;
    const messageType = status & 0xf0;
    const channel = status & 0x0f;

    let message: MIDIMessage | null = null;

    if (messageType === 0xb0) {
      // Control Change (CC)
      message = {
        type: "cc",
        channel,
        number,
        value,
      };
    } else if (messageType === 0x90) {
      // Note On
      message = {
        type: "noteon",
        channel,
        number,
        value,
      };
    } else if (messageType === 0x80) {
      // Note Off
      message = {
        type: "noteoff",
        channel,
        number,
        value: 0,
      };
    }

    if (message) {
      if (this.settings.learnMode && this.onLearnCallback) {
        this.onLearnCallback(message);
      } else {
        this.onMessageCallback?.(message);
      }
    }
  }

  /**
   * Set callback for incoming MIDI messages
   */
  onMessage(callback: (message: MIDIMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Set callback for MIDI learn mode
   */
  onLearn(callback: (message: MIDIMessage) => void): void {
    this.onLearnCallback = callback;
  }

  /**
   * Get available MIDI devices
   */
  getDevices(): MIDIDevice[] {
    return [...this.devices];
  }

  /**
   * Update settings and reinitialize if needed
   */
  async updateSettings(newSettings: MIDISettings): Promise<void> {
    const wasEnabled = this.settings.enabled;
    this.settings = newSettings;

    if (wasEnabled && !newSettings.enabled) {
      // Disconnect
      this.access = null;
    } else if (!wasEnabled && newSettings.enabled) {
      // Connect
      await this.initialize();
    } else if (wasEnabled && newSettings.enabled) {
      // Reinitialize if device changed
      if (this.settings.deviceId !== newSettings.deviceId) {
        await this.initialize();
      }
    }
  }

  /**
   * Get parameter mapping for a MIDI message
   */
  getMapping(message: MIDIMessage): string | null {
    const key = `${message.type}-${message.channel}-${message.number}`;
    return this.settings.mappings[key]?.parameter || null;
  }

  /**
   * Add MIDI mapping
   */
  addMapping(parameter: string, message: MIDIMessage): void {
    const key = `${message.type}-${message.channel}-${message.number}`;
    this.settings.mappings[key] = {
      parameter,
      type: message.type === "cc" ? "cc" : "note",
      channel: message.channel,
      number: message.number,
    };
  }

  /**
   * Remove MIDI mapping
   */
  removeMapping(parameter: string): void {
    const entries = Object.entries(this.settings.mappings);
    for (const [key, mapping] of entries) {
      if (mapping.parameter === parameter) {
        delete this.settings.mappings[key];
        break;
      }
    }
  }
}

/**
 * Create MIDI client instance
 */
export function createMIDIClient(settings: MIDISettings): MIDIClient {
  return new MIDIClient(settings);
}


