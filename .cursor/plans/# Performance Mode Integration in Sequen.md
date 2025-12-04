# Performance Mode Integration in Sequences

## Overview

Integrate Performance Mode directly into the Sequences page, providing a unified interface for sequence management and live performance. The mode includes a live preview of the performance output, set (playlist) management, queued editing system, and full responsive support for mobile control.

## Research: Similar Products Analysis

### QLab (Theater Software)
- **Interface:** Cue list on left, preview window center, controls on right
- **Live Preview:** Always-visible preview window showing current output
- **Editing:** Changes can be made during playback, applied on next cue
- **Key Feature:** Visual timeline with current position indicator

### Resolume Arena (VJ Software)
- **Interface:** Deck columns (compositions) on left, preview center, output right
- **Live Preview:** Multiple preview windows (composition preview + output preview)
- **Editing:** Real-time parameter changes with immediate feedback
- **Key Feature:** Layer-based composition with live mixing

### GrandMA (Lighting Console)
- **Interface:** Command line + fader banks + 3D visualizer
- **Live Editing:** Changes queued and applied on "Go" command
- **Key Feature:** Command queue system for non-destructive editing

### Design Principles Applied
1. **Always-visible preview** - User must see what's playing
2. **Non-destructive editing** - Changes don't interrupt playback
3. **Clear visual hierarchy** - Playback controls prominent, editing secondary
4. **Responsive layouts** - Adapt to screen size while maintaining functionality

## Sequences Page Layout Redesign

### Desktop Layout (>1024px)

**File:** `src/pages/SequencesPage.tsx`

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Header: Sequences + [Performance Mode Toggle]          │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│ │              │ │                  │ │              │ │
│ │  Sequence    │ │  Live Preview    │ │  Playback    │ │
│ │  Library     │ │  (PiP or Canvas) │ │  Controls    │ │
│ │              │ │                  │ │              │ │
│ │  - Sets      │ │  [Projector      │ │  - Play/Pause│ │
│ │  - Sequences │ │   Output]         │ │  - Next/Prev │ │
│ │              │ │                  │ │  - Tempo     │ │
│ │  [Selected   │ │  Connection: ✓   │ │  - Queue: 3   │ │
│ │   Sequence]  │ │  FPS: 60         │ │              │ │
│ │              │ │                  │ │  Edit Queue: │ │
│ │  Sequence    │ │                  │ │  - Change 1   │ │
│ │  Editor      │ │                  │ │  - Change 2   │ │
│ │  (Table)     │ │                  │ │  [Apply Now] │ │
│ │              │ │                  │ │              │ │
│ └──────────────┘ └──────────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Layout Options:**
- **Option A:** Picture-in-Picture (PiP) - Floating preview window
- **Option B:** Top Canvas - Fixed preview canvas at top of page
- **Option C:** Toggleable - User can switch between PiP and top canvas

**Recommendation:** Start with Option B (Top Canvas) for simplicity, add PiP as enhancement.

### Tablet Layout (768px-1024px)

**Structure:**
```
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   Live Preview          │ │
│ │   (Top Canvas)          │ │
│ └─────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐  │
│ │ Sequence │ │ Playback │  │
│ │ Library  │ │ Controls │  │
│ └──────────┘ └──────────┘  │
│ ┌─────────────────────────┐ │
│ │ Sequence Editor         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Mobile Layout (<768px)

**Structure:**
```
┌─────────────────┐
│ Header          │
├─────────────────┤
│ ┌─────────────┐ │
│ │ Live Preview│ │
│ │ (Compact)   │ │
│ └─────────────┘ │
│ [Play/Pause]    │
│ [Next] [Prev]   │
│ Queue: 2 items  │
│ ┌─────────────┐ │
│ │ Sequences   │ │
│ │ (Collapsed) │ │
│ └─────────────┘ │
└─────────────────┘
```

## Core Features

### 1. Performance Mode Toggle

**File:** `src/components/SequenceManager/PerformanceModeToggle.tsx` (NEW)

**Features:**
- Toggle button in Sequences page header
- When enabled:
  - Shows live preview canvas
  - Enables playback controls
  - Shows edit queue
  - Activates projector sync
- Visual indicator when active
- Keyboard shortcut (P for Performance)

**State Management:**
- `isPerformanceMode: boolean` in SequenceManager
- Persists to localStorage
- Affects layout and available features

### 2. Live Preview Canvas

**File:** `src/components/SequenceManager/LivePreviewCanvas.tsx` (NEW)

**Implementation Options:**

**Option A: Top Canvas (Recommended for MVP)**
- Fixed canvas at top of Sequences page
- Uses same controller instance as main canvas (shared state)
- Lower resolution for performance (e.g., 640x360)
- Shows exactly what projector sees
- Connection status overlay
- FPS counter overlay

**Option B: Picture-in-Picture**
- Floating draggable window
- Uses Browser PiP API if available
- Falls back to custom draggable div
- Can be minimized/maximized
- Always-on-top option

**Option C: Embedded iframe**
- Iframe pointing to projector route
- Simpler but less control
- Potential security/cors issues

**Recommendation:** Start with Option A, add Option B as enhancement.

**Technical Implementation:**
```typescript
// Create separate controller instance for preview
const previewControllerRef = useRef<SpriteController | null>(null);
const previewContainerRef = useRef<HTMLDivElement | null>(null);

// Sync state from main controller or projector
useEffect(() => {
  if (isPerformanceMode && previewContainerRef.current) {
    const controller = createSpriteController(previewContainerRef.current, {
      // Lower quality for performance
      maxCanvasSize: 1280,
      // Sync from main state or projector
      onStateChange: () => {}
    });
    previewControllerRef.current = controller;
  }
}, [isPerformanceMode]);
```

**Performance Considerations:**
- Lower resolution (640x360 or 1280x720 max)
- Reduced frame rate (30fps instead of 60fps)
- Throttle state updates (every 2-3 frames)
- Use `requestAnimationFrame` for smooth updates
- Pause preview when tab is hidden (Page Visibility API)

### 3. Set Management (Playlists)

**File:** `src/lib/storage/setStorage.ts` (NEW)

**Interface:**
```typescript
export interface Set {
  id: string;
  name: string;
  description?: string;
  sequences: SetItem[]; // Ordered list
  createdAt: number;
  updatedAt: number;
}

export interface SetItem {
  sequenceId: string;
  order: number;
  autoAdvance: boolean; // Auto-play next sequence when current ends
  transition?: TransitionType; // Transition between sequences
  notes?: string; // Performance notes
}
```

**Features:**
- Create sets from multiple sequences
- Reorder sequences (drag-drop)
- Auto-advance toggle per sequence
- Transition types between sequences
- Save/load sets
- Export/import sets as JSON

**File:** `src/components/SequenceManager/SetManager.tsx` (NEW)

**UI:**
- Card-based set list (similar to sequence list)
- "Create New Set" button
- Set editor with sequence list
- Drag-drop reordering
- Auto-advance toggles
- Transition selectors

### 4. Playback Engine

**File:** `src/lib/performance/playbackEngine.ts` (NEW)

**Core Logic:**
```typescript
export class PlaybackEngine {
  private currentSequence: Sequence | null = null;
  private currentSet: Set | null = null;
  private currentSequenceIndex: number = 0;
  private currentSceneIndex: number = 0;
  private playbackState: 'stopped' | 'playing' | 'paused' = 'stopped';
  private timer: ReturnType<typeof setInterval> | null = null;
  private editQueue: GeneratorState[] = [];
  
  play(sequence: Sequence | Set): void;
  pause(): void;
  stop(): void;
  next(): void;
  previous(): void;
  applyEditQueue(): void; // Apply queued changes on transition
}
```

**Features:**
- Sequence playback (scenes with durations/transitions)
- Set playback (sequences with auto-advance)
- Manual advance (duration = 0)
- Auto-advance (timed scenes)
- Transition handling (cut/fade)
- Tempo/playback speed control
- Queue application on scene transitions
- Loop support (sequence/set level)

**Edge Cases:**
- Empty sequence/set
- Missing scenes (skip with warning)
- Invalid durations (fallback to manual)
- Transition during fade (wait for fade to complete)
- Queue application timing (only on clean transitions)
- Multiple rapid edits (merge intelligently)

### 5. Edit Queue System

**File:** `src/lib/performance/editQueue.ts` (NEW)

**Interface:**
```typescript
export interface QueuedEdit {
  id: string;
  timestamp: number;
  changes: Partial<GeneratorState>;
  preview?: GeneratorState; // Full state preview
}

export class EditQueue {
  private queue: QueuedEdit[] = [];
  
  add(changes: Partial<GeneratorState>): void;
  clear(): void;
  apply(): GeneratorState | null; // Returns merged state
  preview(): GeneratorState | null; // Preview of all queued changes
  getCount(): number;
}
```

**Behavior:**
- Changes made during playback are queued automatically
- Queue visible in UI with count badge
- Preview of queued state (optional)
- "Apply Now" button (cuts to queued state immediately)
- "Clear Queue" button (discards all queued changes)
- Auto-apply on next scene transition
- Merge logic: Latest change wins for each property

**File:** `src/components/SequenceManager/EditQueuePanel.tsx` (NEW)

**UI:**
- Collapsible panel showing queued changes
- List of queued edits with timestamps
- Preview button (shows what queued state looks like)
- Apply Now button
- Clear Queue button
- Visual indicator when queue has items

### 6. Independent Scene Creation

**File:** `src/components/SequenceManager/QuickSceneBuilder.tsx` (NEW)

**Features:**
- "Create Scene" button in Performance Mode
- Opens modal/panel for scene creation
- Uses current canvas state as starting point
- Quick naming (auto-generated or manual)
- "Save and Add to Sequence" option
- "Save and Queue" option (adds to end of current sequence)
- Scene creation doesn't interrupt playback
- New scenes immediately available in sequence editor

**Workflow:**
1. User edits canvas during playback
2. Clicks "Save as New Scene"
3. Modal opens with scene name input
4. Options: "Save", "Save and Add to Sequence", "Save and Queue"
5. Scene saved, playback continues
6. If "Add to Sequence" selected, scene added to current sequence

### 7. Projector Integration Enhancements

**File:** `src/components/SequenceManager/ProjectorStatus.tsx` (NEW)

**Features:**
- Connection status indicator (connected/disconnected/connecting)
- Sync status (in sync / lagging / out of sync)
- Latency display (ms)
- Frame drop counter
- Reconnect button
- Open/close projector window button
- Quality indicator (resolution, FPS)

**Enhancements to existing projector:**
- Better error handling and auto-reconnection
- Latency monitoring (ping/pong messages)
- Frame drop detection (missed frames counter)
- Quality settings (resolution, frame rate)
- Network projection support (future: WebRTC)

### 8. Responsive Design

**File:** `src/components/SequenceManager/PerformanceMode.mobile.tsx` (NEW)

**Mobile Optimizations:**
- Stacked vertical layout
- Large touch targets (min 44px)
- Swipe gestures (swipe left/right for next/prev)
- Bottom sheet for controls
- Collapsible sections
- Essential controls only
- Simplified preview (smaller, lower quality)
- Touch-optimized buttons
- Haptic feedback (if available)

**Adaptive Features:**
- Detect screen size/orientation
- Show/hide panels based on available space
- Collapsible sidebars
- Responsive typography
- Touch-friendly spacing

## Edge Cases and Error Handling

### Playback Edge Cases

1. **Empty Sequence/Set**
   - Show warning message
   - Disable play button
   - Allow adding scenes/sequences

2. **Missing Scenes**
   - Skip scene with warning
   - Show "Scene not found" in editor
   - Continue playback if possible
   - Log error for debugging

3. **Invalid Durations**
   - Negative durations → treat as 0 (manual)
   - Very large durations → cap at max (e.g., 3600s)
   - NaN/undefined → fallback to manual

4. **Transition During Fade**
   - Wait for fade to complete before next transition
   - Queue next transition
   - Show "Transitioning..." indicator

5. **Rapid Scene Changes**
   - Debounce rapid next/prev clicks
   - Queue changes if too fast
   - Show "Processing..." indicator

6. **Projector Disconnection**
   - Detect disconnection (no messages for X seconds)
   - Show warning banner
   - Auto-reconnect with exponential backoff
   - Continue playback on main window
   - Option to stop playback

7. **Browser Tab Hidden**
   - Pause preview canvas (Page Visibility API)
   - Continue playback logic (timers)
   - Resume preview when tab visible
   - Throttle updates when hidden

8. **Low Performance**
   - Detect frame drops
   - Reduce preview quality automatically
   - Show performance warning
   - Option to disable preview

9. **Multiple Sequences Playing**
   - Only one sequence/set can play at a time
   - Stop current before starting new
   - Warn if switching during playback

10. **Edit Queue Overflow**
    - Limit queue size (e.g., 50 items)
    - Warn when approaching limit
    - Auto-apply oldest if limit reached
    - Option to clear queue

### State Synchronization Edge Cases

1. **Stale State**
   - Timestamp all state updates
   - Ignore older updates
   - Request fresh state on reconnect

2. **State Conflicts**
   - Last-write-wins for conflicts
   - Merge non-conflicting changes
   - Log conflicts for debugging

3. **Network Issues**
   - Graceful degradation (local playback only)
   - Queue updates when offline
   - Sync when reconnected

## Performance Requirements

### Frame Rate Targets
- **Main Canvas:** 60fps (uncompromised)
- **Preview Canvas:** 30fps minimum, 60fps preferred
- **Projector:** 60fps (full quality)
- **Mobile Preview:** 24-30fps acceptable

### Latency Targets
- **Preview Update:** <100ms from state change
- **Projector Sync:** <50ms latency
- **Queue Application:** <16ms (one frame at 60fps)
- **Scene Transition:** <100ms (excluding fade duration)

### Resource Usage
- **Preview Canvas:** Max 1280x720 resolution
- **Memory:** Monitor and limit canvas instances
- **CPU:** Throttle preview updates when needed
- **Network:** Efficient state sync (only changes, not full state)

### Optimization Strategies
1. **Preview Canvas:**
   - Lower resolution (640x360 or 1280x720)
   - Reduced frame rate (30fps)
   - Throttle state updates (every 2-3 frames)
   - Pause when tab hidden

2. **State Sync:**
   - Only send changed properties (diffs)
   - Batch multiple changes
   - Throttle rapid updates
   - Use efficient serialization

3. **Rendering:**
   - Use `requestAnimationFrame` for smooth updates
   - Avoid layout thrashing
   - Optimize canvas operations
   - Use Web Workers for heavy computations (future)

## Files to Create

1. `src/components/SequenceManager/PerformanceModeToggle.tsx` - Toggle button
2. `src/components/SequenceManager/LivePreviewCanvas.tsx` - Preview canvas component
3. `src/components/SequenceManager/SetManager.tsx` - Set creation/management
4. `src/components/SequenceManager/PlaybackControls.tsx` - Enhanced playback controls
5. `src/components/SequenceManager/EditQueuePanel.tsx` - Edit queue UI
6. `src/components/SequenceManager/QuickSceneBuilder.tsx` - Quick scene creation
7. `src/components/SequenceManager/ProjectorStatus.tsx` - Projector status/controls
8. `src/lib/storage/setStorage.ts` - Set storage (localStorage)
9. `src/lib/performance/playbackEngine.ts` - Playback logic engine
10. `src/lib/performance/editQueue.ts` - Edit queue management
11. `src/hooks/usePerformanceMode.ts` - Performance mode hook
12. `src/hooks/useLivePreview.ts` - Live preview canvas hook

## Files to Modify

1. `src/pages/SequencesPage.tsx`
   - Add Performance Mode toggle
   - Integrate live preview canvas
   - Add performance mode layout

2. `src/components/SequenceManager.tsx`
   - Add `isPerformanceMode` state
   - Integrate playback engine
   - Add edit queue management
   - Add set management
   - Update layout for performance mode

3. `src/pages/ProjectorPage.tsx`
   - Enhance error handling
   - Add latency monitoring
   - Add frame drop detection
   - Improve reconnection logic

4. `src/App.tsx`
   - Ensure state sync works with performance mode
   - Handle multiple canvas instances
   - Performance optimizations

## User Workflows

### Starting a Performance
1. Navigate to Sequences page
2. Enable Performance Mode (toggle in header)
3. Select a sequence or set
4. Open projector window (optional)
5. Click play
6. Sequences/scenes play automatically

### Live Editing During Performance
1. Make changes to canvas (automatically queued)
2. See changes in edit queue panel
3. Changes apply automatically on next scene transition
4. Or click "Apply Now" to cut immediately
5. Or click "Clear Queue" to discard changes

### Creating New Scene During Performance
1. Edit canvas to desired state
2. Click "Save as New Scene"
3. Enter scene name
4. Choose: "Save", "Save and Add to Sequence", or "Save and Queue"
5. Scene saved, playback continues
6. New scene available immediately

### Managing Sets
1. Click "Sets" tab in sequence library
2. Click "Create New Set"
3. Add sequences in desired order
4. Configure auto-advance and transitions
5. Save set
6. Select set for playback

## Testing Strategy

### Unit Tests
- Playback engine logic
- Edit queue merging
- Set management
- State synchronization

### Integration Tests
- Playback with projector
- Edit queue application
- Scene creation during playback
- Set playback

### Performance Tests
- Frame rate under load
- Latency measurements
- Memory usage
- CPU usage

### User Acceptance Tests
- Complete performance workflow
- Mobile responsiveness
- Error recovery
- Edge case handling

## Future Enhancements

1. **Picture-in-Picture API** - Native browser PiP support
2. **WebRTC Projection** - Network-based projection
3. **MIDI/OSC Control** - External hardware control
4. **Cue Points** - Markers in sequences for quick navigation
5. **Tempo Sync** - Sync with audio/MIDI clock
6. **Recording** - Record performances for playback
7. **Multi-Projector** - Support multiple projector outputs
8. **Touch Gestures** - Swipe, pinch, etc. for mobile
9. **Haptic Feedback** - Vibration on mobile for feedback
10. **Voice Control** - Voice commands for hands-free operation