# Nightclub Projection Features

## Overview

Transform Pixli into a professional tool for nightclub projectionists and visual designers. Add dual monitor support, mobile remote control, preset sequencing, industry API integration (OSC, MIDI, DMX/Art-Net), and smooth animation transitions.

## Settings Infrastructure

**Files:** `src/pages/SettingsPage.tsx` (new), `src/components/Settings/` (new directory), `src/App.tsx`, `src/index.css`

**Changes:**

- **Settings Page Architecture:**
  - Convert settings from modal to full-page view
  - Settings button in header opens dedicated settings page (route-based navigation)
  - Use tabs to organize settings into logical groups:
    - **Display** - Aspect ratio (16:9, 21:9, 16:10, custom), resolution presets, dual monitor, projector mode, canvas settings
    - **Remote Control** - Mobile remote, WebSocket server, QR code display
    - **Sequences** - Sequence management, playback controls, timing settings
    - **Integrations** - OSC, MIDI, DMX/Art-Net configuration and mapping
    - **Projection** - Edge blending, keystone correction, projection mapping tools
    - **Performance** - FPS monitoring, GPU usage, memory warnings
    - **Keyboard Shortcuts** - Customizable keyboard bindings
    - **Audio** - Audio reactivity settings (future)
  - Use button groups to organize related controls within each tab
  - Maintain consistent spacing using existing spacing system (`docs/spacing.md`)

- **Navigation:**
  - Add routing support (React Router or similar)
  - Settings page accessible via `/settings` route
  - Back button or "Close Settings" returns to main app
  - Preserve current generator state when navigating to/from settings
  - URL-based tab navigation (e.g., `/settings?tab=integrations`)

- **UI Components:**
  - Create reusable `SettingsTab` component
  - Create `SettingsSection` component for grouping related controls
  - Create `ButtonGroup` component for organizing action buttons
  - Use existing RetroUI components (Button, Switch, Input, Select) for consistency
  - Responsive layout: stack tabs vertically on mobile, horizontal on desktop

- **Settings Persistence:**
  - Store all settings in localStorage (`pixli-settings`)
  - Settings persist across sessions
  - Export/import settings as JSON for backup/sharing

**Implementation Notes:**

- Many features (dual monitor, integrations, sequences) will require settings UI
- Settings page should be accessible even when canvas is in fullscreen/projector mode
- Consider adding a settings icon in the fullscreen HUD for quick access
- Settings changes should apply immediately (no "Save" button needed)
- Use accordion pattern for collapsible sections within tabs if needed

## Implementation Steps

### 1. Aspect Ratio Control (Industry Standard Projector Ratios)

**Files:** `src/generator.ts`, `src/App.tsx`, `src/components/Settings/DisplayTab.tsx`, `src/index.css`

**Changes:**

- Add `aspectRatio: "square" | "16:9" | "21:9" | "16:10" | "custom"` to `GeneratorState` interface
- Add `customAspectRatio: { width: number; height: number }` for custom configurations
- Update `DEFAULT_STATE` with `aspectRatio: "16:9"` (industry standard for projectors)
- Modify canvas sizing logic in `p.setup()` and `resizeCanvas()`:
  - Square (1:1): `canvas = p.createCanvas(size, size)` (current behavior)
  - 16:9 (Widescreen): `canvas = p.createCanvas(size, size * 9/16)` (width-based)
  - 21:9 (Ultra-Wide): `canvas = p.createCanvas(size, size * 9/21)` (width-based)
  - 16:10 (WUXGA): `canvas = p.createCanvas(size, size * 10/16)` (width-based)
  - Custom: `canvas = p.createCanvas(customWidth, customHeight)` (user-defined)
- Add aspect ratio selector in Settings page (Display tab) with:
  - Radio buttons or select dropdown for standard ratios
  - Custom ratio input fields (width × height)
  - Resolution presets (e.g., 1920x1080 for 16:9, 2560x1080 for 21:9, 1920x1200 for 16:10)
  - Native resolution display (show recommended resolution for selected ratio)
- Update CSS for all aspect ratios (maintain aspect ratio, center in container)
- Ensure export respects aspect ratio setting
- Add aspect ratio info tooltip explaining industry use cases

**Aspect Ratio Specifications:**

- **16:9 (Widescreen)** - Industry standard for most events
  - Use Cases: General sessions, conferences, video playback, live broadcasts, standard-sized screens
  - Resolution Examples: 1920x1080 (Full HD), 3840x2160 (4K UHD)
  - Advantage: Wide compatibility with most modern content creation tools, laptops, and displays

- **21:9 (Ultra-Wide)** - For immersive displays and cinematic VFX
  - Use Cases: Immersive effects, wide rooms, edge-blended multi-projector setups, cinematic experiences
  - Resolution Examples: 2560x1080 (Full HD Ultra-Wide), 3440x1440 (QHD Ultra-Wide)
  - Advantage: Creates dramatic, expansive visual canvas that wraps around viewer's field of vision

- **16:10 (WUXGA)** - Professional/commercial projectors
  - Use Cases: Commercial projectors, professional presentations, versatile for both presentations and 16:9 content
  - Resolution Examples: 1920x1200 (WUXGA)
  - Advantage: Slightly more vertical space than 16:9, versatile for presentations and 16:9 content (minimal black bars)

- **Custom Configurations** - For unique stage designs and projection mapping
  - Use Cases: Unique stage designs, complex projection mapping projects, modular LED walls, multi-projector blending
  - Advantage: Maximum creative flexibility for bespoke event experiences

**Implementation Notes:**

- Use `container.clientWidth` for width-based sizing (recommended for projectors)
- Remove max canvas size constraints for professional use (allow full resolution)
- Update `currentCanvasSize` state to track both width and height separately
- Add resolution validation (ensure valid aspect ratio, reasonable min/max sizes)
- Display current resolution and aspect ratio in status bar or canvas overlay
- Match projector's native aspect ratio to avoid distortion or black bars
- For high-impact VFX and cinematic feel, recommend 21:9 for wider displays
- Higher resolutions (4K) crucial for large screens and intricate graphics

### 2. Dual Monitor Support

**Files:** `src/App.tsx`, `src/index.css`, `src/hooks/useDualMonitor.ts` (new)

**Changes:**

- Create `useDualMonitor` hook using `window.screen` API:
  - Detect available screens via `window.screen.availWidth`, `window.screen.availHeight`
  - Use `window.screen.isExtended` or check `screen.width > window.screen.width` to detect multi-monitor
- Add dual monitor mode toggle in Settings page (Display tab)
- When enabled:
  - **Primary monitor (laptop/PC):** Show all controls expanded (no tabs), full control panel
  - **Secondary monitor (projector):** Show canvas only, no borders, fullscreen on that display
- Use `window.open()` with `screenX`, `screenY` positioning to open canvas window on secondary display
- Implement WebSocket or BroadcastChannel API for state synchronization between windows
- Add "Projector Mode" button in header that:
  - Opens new window on secondary display
  - Removes all UI chrome (borders, padding, controls)
  - Syncs generator state in real-time
  - Handles window close/reopen gracefully

**Implementation Notes:**

- Use `BroadcastChannel` API for same-origin communication (simpler than WebSocket for local)
- Fallback to `window.postMessage` if BroadcastChannel unavailable
- Store dual monitor preference in localStorage
- Handle window focus/blur events for proper sync

### 3. Mobile Remote Control (QR Code + WebSocket)

**Files:** `src/lib/server/websocketServer.ts` (new), `src/components/MobileRemote.tsx` (new), `src/App.tsx`, `src/lib/utils/qrCode.ts` (new)

**Changes:**

- **Backend Server (Node.js/Express):**
  - Create WebSocket server using `ws` library
  - Run on configurable port (default 8080)
  - Handle connections, state sync, command routing
  - Generate QR code with connection URL (local IP + port)
- **QR Code Display:**
  - Add "Remote Control" section in Settings page (Remote Control tab)
  - Display QR code and connection URL in settings page
  - QR code contains: `ws://[local-ip]:8080/pixli-remote`
  - Display local IP address (use `os.networkInterfaces()` or browser API)
- **Mobile Web App:**
  - Create minimal mobile-optimized interface (`src/pages/MobileRemote.tsx`)
  - Connect via WebSocket on scan
  - Show preset list, current preset name, next/previous buttons
  - Allow cycling through presets, triggering sequences
  - Show connection status indicator
- **WebSocket Protocol:**
  - Client → Server: `{ type: "loadPreset", presetId: string }`
  - Server → Client: `{ type: "stateUpdate", state: GeneratorState }`
  - Server → Client: `{ type: "presetList", presets: Preset[] }`
- **Integration:**
  - Add WebSocket server startup option (dev mode or production flag)
  - Handle reconnection logic
  - Add authentication token (optional, for security)

**Implementation Notes:**

- Use `qrcode` npm package for QR generation
- Use `ws` package for WebSocket server
- Mobile interface should be minimal, touch-friendly
- Consider adding password protection for production use

### 4. Preset Sequences (Recipes)

**Files:** `src/lib/storage/sequenceStorage.ts` (new), `src/components/SequenceManager.tsx` (new), `src/components/SequencePlayer.tsx` (new), `src/App.tsx`

**Changes:**

- **Sequence Data Structure:**
  ```typescript
  interface Sequence {
    id: string;
    name: string;
    items: SequenceItem[];
    createdAt: number;
    updatedAt: number;
  }
  
  interface SequenceItem {
    id: string;
    presetId: string;
    duration: number; // seconds, 0 = manual advance
    transition: "instant" | "fade" | "smooth"; // transition type
    order: number; // for drag-drop reordering
  }
  ```

- **Sequence Manager UI:**
  - New "Sequences" tab in Preset Manager or separate modal
  - Create new sequence, name it (e.g., "Opening Set", "Peak Hour", "Closing")
  - Drag-drop preset items to reorder
  - Edit duration per item (slider: 0-300 seconds, 0 = manual)
  - Edit transition type per item
  - Delete items, duplicate sequences
  - Export/import sequences as JSON
- **Sequence Player:**
  - Play/pause/stop controls
  - Current item indicator, time remaining
  - Manual advance (next/previous)
  - Loop sequence option
  - Auto-advance when duration expires (if > 0)
- **Storage:**
  - Store sequences in localStorage (`pixli-sequences`)
  - Link sequences to presets (preset IDs reference existing presets)

**Implementation Notes:**

- Use `@dnd-kit/core` or `react-beautiful-dnd` for drag-drop
- Implement smooth transitions between presets (interpolate GeneratorState values)
- Handle preset deletion (remove from sequences or mark as missing)

### 5. Smooth Animation Transitions

**Files:** `src/generator.ts`, `src/lib/utils/animationTransition.ts` (new)

**Changes:**

- **Transition System:**
  - Create `interpolateGeneratorState()` function:
    - Takes two `GeneratorState` objects and interpolation factor (0-1)
    - Interpolates numeric values (sliders, speeds)
    - Handles discrete values (palette IDs, movement modes) with crossfade
  - Add transition state to generator:
    ```typescript
    interface TransitionState {
      isTransitioning: boolean;
      fromState: GeneratorState;
      toState: GeneratorState;
      progress: number; // 0-1
      duration: number; // milliseconds
    }
    ```

- **Apply Transitions:**
  - When loading preset/sequence item, if transition enabled:
    - Store current state as `fromState`
    - Store target state as `toState`
    - Start transition timer
    - In `p.draw()`, use interpolated state during transition
  - For "smooth" transition: interpolate all values over 2-3 seconds
  - For "fade" transition: crossfade canvas opacity while interpolating
  - For "instant": immediate state swap (current behavior)
- **Movement Mode Transitions:**
  - When changing movement mode, smoothly interpolate motion parameters
  - Keep sprite structure stable, only change animation paths
  - Use existing `scaledAnimationTime` for smooth continuity

**Implementation Notes:**

- Interpolate numeric values linearly
- For palettes: interpolate colors using existing `interpolatePaletteColors`
- For movement modes: interpolate `motionIntensity` and `motionSpeed` only
- Ensure transitions don't cause performance issues (60fps target)

### 6. Industry API Integration

**Files:** `src/lib/integrations/osc.ts` (new), `src/lib/integrations/midi.ts` (new), `src/lib/integrations/dmx.ts` (new), `src/components/IntegrationSettings.tsx` (new)

**Changes:**

- **OSC (Open Sound Control):**
  - Use `osc-js` or `osc-min` npm package
  - Listen on configurable port (default 8000)
  - Map OSC messages to generator state:
    - `/pixli/preset/load [presetId]` → Load preset
    - `/pixli/motion/intensity [0-100]` → Set motion intensity
    - `/pixli/palette/cycle` → Toggle palette cycling
    - `/pixli/sequence/next` → Advance sequence
  - Send OSC messages for state changes (bidirectional)
- **MIDI:**
  - Use Web MIDI API (`navigator.requestMIDIAccess()`)
  - Map MIDI CC/notes to generator parameters
  - Support MIDI learn (press key/knob, assign to parameter)
  - Common mappings:
    - CC1 (Modulation) → Motion Intensity
    - CC2 → Motion Speed
    - CC3 → Hue Rotation Speed
    - Note C4 → Load Preset 1, C#4 → Preset 2, etc.
- **DMX/Art-Net:**
  - Use `artnet` npm package (Node.js backend required)
  - Map generator state to DMX channels:
    - Channels 1-3: RGB from current palette average
    - Channel 4: Motion intensity (0-255)
    - Channel 5: Palette cycle progress (0-255)
  - Send Art-Net packets to lighting console
  - Receive DMX input for parameter control (if supported)
- **Integration Settings UI:**
  - New "Integrations" tab in Settings page
  - Enable/disable each protocol
  - Configure ports, IP addresses
  - MIDI device selection
  - Test connection buttons
  - Parameter mapping editor
  - Use button groups to organize OSC, MIDI, and DMX settings

**Implementation Notes:**

- OSC and MIDI can run in browser (Web MIDI API)
- DMX/Art-Net requires Node.js backend (add to WebSocket server)
- Add error handling for connection failures
- Document OSC message format in README

### 7. Additional Features for Projectionists

**Files:** Various

**Changes:**

- **Audio Reactivity (Future Enhancement):**
  - Add Web Audio API integration
  - Analyze audio input (microphone/line-in)
  - Map frequency bands to generator parameters
  - Beat detection for auto-sequencing
- **Edge Blending Support:**
  - Add edge blend controls (overlap percentage, gamma correction)
  - Support multi-projector setups
  - Export calibration presets
- **Projection Mapping Tools:**
  - Add keystone correction controls
  - Grid overlay for alignment
  - Corner pin adjustment
- **Performance Monitoring:**
  - Show FPS, frame time in status bar
  - GPU usage indicator (if available)
  - Memory usage warning
- **Keyboard Shortcuts:**
  - Space: Play/pause sequence
  - Arrow keys: Next/previous preset
  - Number keys: Load preset by index
  - F11: Toggle fullscreen
- **Show Timer:**
  - Add countdown timer for events
  - Display current time, show duration
  - Alarm/notification at preset times

## Files to Create

1. `src/pages/SettingsPage.tsx` - Main settings page component
2. `src/components/Settings/SettingsTab.tsx` - Tab component for settings
3. `src/components/Settings/SettingsSection.tsx` - Section grouping component
4. `src/components/Settings/ButtonGroup.tsx` - Button group component
5. `src/components/Settings/DisplayTab.tsx` - Display settings (aspect ratio, dual monitor)
6. `src/components/Settings/RemoteControlTab.tsx` - Remote control settings
7. `src/components/Settings/SequencesTab.tsx` - Sequence management settings
8. `src/components/Settings/IntegrationsTab.tsx` - Industry API integration settings
9. `src/components/Settings/ProjectionTab.tsx` - Projection mapping and calibration settings
10. `src/components/Settings/PerformanceTab.tsx` - Performance monitoring settings
11. `src/components/Settings/ShortcutsTab.tsx` - Keyboard shortcuts configuration
12. `src/hooks/useDualMonitor.ts` - Dual monitor detection and window management
13. `src/lib/server/websocketServer.ts` - WebSocket server for mobile remote
14. `src/lib/utils/qrCode.ts` - QR code generation utilities
15. `src/pages/MobileRemote.tsx` - Mobile remote control interface
16. `src/lib/storage/sequenceStorage.ts` - Sequence storage and management
17. `src/components/SequenceManager.tsx` - Sequence creation/editing UI
18. `src/components/SequencePlayer.tsx` - Sequence playback controls
19. `src/lib/utils/animationTransition.ts` - State interpolation utilities
20. `src/lib/integrations/osc.ts` - OSC protocol integration
21. `src/lib/integrations/midi.ts` - MIDI integration
22. `src/lib/integrations/dmx.ts` - DMX/Art-Net integration
23. `src/lib/storage/settingsStorage.ts` - Settings persistence utilities

## Files to Modify

1. `src/generator.ts` - Add aspect ratio, transition state, interpolation logic
2. `src/App.tsx` - Add routing, settings page navigation, dual monitor mode, sequence player, integration hooks
3. `src/components/ControlPanel/SpriteControls.tsx` - Add aspect ratio toggle (or move to Settings)
4. `src/components/Header/Header.tsx` - Update settings button to navigate to settings page
5. `src/components/PresetManager.tsx` - Add sequences tab (or integrate into Settings page)
6. `src/index.css` - Add 16:9 canvas styles, dual monitor styles, settings page styles
7. `package.json` - Add dependencies: `react-router-dom`, `ws`, `qrcode`, `osc-js`, `artnet`, `@dnd-kit/core`

## Testing Checklist

- [ ] Settings page opens as full page (not modal)
- [ ] Settings tabs navigate correctly
- [ ] Button groups organize controls properly
- [ ] Settings persist across sessions
- [ ] Settings accessible from fullscreen/projector mode
- [ ] Aspect ratio selector works (square, 16:9, 21:9, 16:10, custom)
- [ ] Canvas resizes correctly for all aspect ratios
- [ ] Custom aspect ratio input validates correctly
- [ ] Resolution presets apply correctly
- [ ] Native resolution recommendations display correctly
- [ ] Dual monitor mode detects secondary display
- [ ] Canvas window opens on correct monitor
- [ ] State syncs between windows
- [ ] QR code displays correct connection URL
- [ ] Mobile remote connects via WebSocket
- [ ] Preset loading works from mobile
- [ ] Sequences save/load correctly
- [ ] Drag-drop reordering works
- [ ] Sequence player advances automatically
- [ ] Smooth transitions interpolate correctly
- [ ] OSC messages received and processed
- [ ] MIDI devices detected and mapped
- [ ] DMX output sends correct values
- [ ] All features work in fullscreen mode
- [ ] Performance remains smooth (60fps)

## Notes

- Dual monitor requires user permission for window positioning (browser security)
- WebSocket server can run in same process (dev) or separate (production)
- Industry APIs may require additional hardware (MIDI interface, DMX dongle)
- Smooth transitions add slight performance overhead (monitor FPS)
- Mobile remote requires same network (WiFi) as laptop/PC
- Consider adding password protection for WebSocket server in production
- Document all OSC message formats and MIDI mappings in user guide

## Priority Order (User Feedback)

1. **Priority 1:** Toggle between aspect ratios easily (16:9, 21:9, 16:10, custom) - Industry standard projector support
2. **Priority 2:** Allow the app to be split across two monitors
3. **Priority 3:** Allow a user to control the projected canvas from their phone

## Industry Considerations

**Content is King:** Always match the projector's native aspect ratio to the content you plan to display to avoid distortion or black bars.

**Immersive Experience:** For high-impact VFX and cinematic feel, wider aspect ratios like 21:9 are preferred.

**Resolution Matters:** Higher resolutions (like 4K) are crucial for large screens and intricate graphics to maintain image sharpness and detail.

**Technical Consultation:** For large-scale events, consult with your audiovisual (AV) partner to ensure the screen, projector brightness (lumens), and content specifications are compatible with the venue's physical constraints and your creative vision.

