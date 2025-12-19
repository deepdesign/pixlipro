import { useEffect, useRef, useCallback, useMemo, useState, memo } from "react";
import { Button } from "@/components/Button";
import { Play, Pause, Square, SkipForward, SkipBack, GripVertical } from "lucide-react";
import type { Sequence, SequenceItem } from "@/lib/storage/sequenceStorage";
import type { GeneratorState } from "@/types/generator";
import { getAllScenes, loadSceneState, type Scene } from "@/lib/storage/sceneStorage";
import { saveSequence } from "@/lib/storage/sequenceStorage";
import { SceneThumbnail } from "@/components/SequenceManager/SceneThumbnail";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableSceneRowProps {
  item: any;
  index: number;
  scene: Scene | null;
  isCurrent: boolean;
  onJumpToScene: (index: number) => void;
}

// Sortable row component - defined outside to prevent recreation on every render
// This matches the pattern from SequenceManager where SortableTableRow is top-level
const SortableSceneRow = memo(function SortableSceneRow({ item, index, scene, isCurrent, onJumpToScene }: SortableSceneRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id || `item-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const itemDuration = item.durationSeconds || (item.durationMode === "manual" ? 0 : item.durationSeconds || 0) || item.duration || 0;
  const durationMode = item.durationMode || (itemDuration === 0 ? "manual" : "seconds");
  
  // Memoize sceneState per scene ID to prevent recreation
  const sceneState = useMemo(() => {
    if (!scene) return null;
    return loadSceneState(scene);
  }, [scene?.id]); // Only recreate if scene ID changes

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border p-3 flex items-center gap-3 ${
        isCurrent
          ? "bg-theme-icon border-theme-card"
          : "bg-theme-panel border-theme-card"
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-theme-subtle hover:text-theme-muted transition-colors p-1 -m-1 shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Thumbnail - match SequenceManager pattern exactly (no wrapper div, no key) */}
      {sceneState ? (
        <SceneThumbnail state={sceneState} size={60} />
      ) : (
        <div className="w-[60px] h-[60px] bg-theme-panel rounded border border-theme-card flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-theme-subtle">No preview</span>
        </div>
      )}

      {/* Scene Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isCurrent ? "text-theme-primary" : "text-theme-primary"
        }`}>
          {scene?.name || `Scene ${index + 1}`}
        </p>
        <p className="text-xs text-theme-subtle">
          {durationMode === "manual" ? "Manual" : `${itemDuration}s`}
        </p>
      </div>

      {/* Play Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onJumpToScene(index)}
        title="Jump to scene"
        className="shrink-0"
      >
        <Play className="h-4 w-4" />
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: return true if props are equal (skip re-render), false if different (re-render)
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.scene?.id === nextProps.scene?.id &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.index === nextProps.index &&
    prevProps.onJumpToScene === nextProps.onJumpToScene
  );
});

interface PlaybackControlsProps {
  sequence: Sequence | null;
  playbackState: "stopped" | "playing" | "paused";
  currentIndex: number;
  onPlaybackStateChange: (state: "stopped" | "playing" | "paused") => void;
  onCurrentIndexChange: (index: number) => void;
  onLoadScene?: (state: GeneratorState) => void;
}

export function PlaybackControls({
  sequence,
  playbackState,
  currentIndex,
  onPlaybackStateChange,
  onCurrentIndexChange,
  onLoadScene,
}: PlaybackControlsProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousSequenceIdRef = useRef<string | null>(null);
  const sequenceIdWhenPlaybackStartedRef = useRef<string | null>(null);
  // Memoize allScenes to prevent creating new array/object references on every render
  const allScenes = useMemo(() => getAllScenes(), []);
  const [localSequence, setLocalSequence] = useState<Sequence | null>(sequence);

  // Update local sequence when prop changes
  useEffect(() => {
    // Track sequence changes to prevent loading scenes when just switching sequences
    if (sequence?.id !== previousSequenceIdRef.current) {
      previousSequenceIdRef.current = sequence?.id || null;
      // When sequence changes, clear the playback start tracking
      // This ensures we don't load scenes when just selecting a new sequence
      if (playbackState === "stopped") {
        sequenceIdWhenPlaybackStartedRef.current = null;
      }
    }
    setLocalSequence(sequence);
  }, [sequence, playbackState]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Support both old format (items) and new format (scenes)
  const items = useMemo(() => (localSequence as any)?.items || [], [localSequence]);
  const sequenceScenes = useMemo(() => (localSequence as any)?.scenes || [], [localSequence]);
  const sequenceItems = useMemo(() => sequenceScenes.length > 0 ? sequenceScenes : items, [sequenceScenes, items]);
  const isNewFormat = useMemo(() => sequenceScenes.length > 0 || (items.length === 0 && !(localSequence as any)?.items), [sequenceScenes.length, items.length, localSequence]);

  // Get current item - memoized to prevent infinite loops
  const currentItem: SequenceItem | null = useMemo(() => {
    if (!localSequence || sequenceItems.length === 0 || currentIndex >= sequenceItems.length) {
      return null;
    }
    
    if (isNewFormat) {
      const scene = sequenceScenes[currentIndex];
      return {
        id: scene.id,
        sceneId: scene.sceneId || scene.presetId || "",
        duration: scene.durationSeconds || (scene.durationMode === "manual" ? 0 : scene.durationSeconds || 0),
        transition: scene.fadeTypeOverride === "cut" ? "instant" : scene.fadeTypeOverride === "crossfade" ? "fade" : "instant",
        order: scene.order,
      };
    }
    return items[currentIndex];
  }, [localSequence, sequenceItems.length, currentIndex, isNewFormat, sequenceScenes, items]);

  // Get current scene - memoized
  const currentScene: Scene | null = useMemo(() => {
    if (!currentItem) return null;
    return allScenes.find((s) => s.id === (currentItem.sceneId || currentItem.presetId)) || null;
  }, [currentItem?.sceneId, currentItem?.presetId, allScenes]);

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!localSequence || !over || active.id === over.id) return;

    if (isNewFormat) {
      const oldIndex = sequenceScenes.findIndex((scene: any) => scene.id === active.id);
      const newIndex = sequenceScenes.findIndex((scene: any) => scene.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sequenceScenes, oldIndex, newIndex);
      const updated = {
        ...localSequence,
        scenes: reordered.map((scene: any, index: number) => ({ ...scene, order: index })),
      };
      setLocalSequence(updated);
      saveSequence(updated);
      
      // Update current index if it was affected
      if (oldIndex === currentIndex) {
        onCurrentIndexChange(newIndex);
      } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
        onCurrentIndexChange(currentIndex - 1);
      } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
        onCurrentIndexChange(currentIndex + 1);
      }
    } else {
      const oldIndex = items.findIndex((item: SequenceItem) => item.id === active.id);
      const newIndex = items.findIndex((item: SequenceItem) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(items, oldIndex, newIndex) as SequenceItem[];
      const updated = {
        ...localSequence,
        items: reordered.map((item: SequenceItem, index: number) => ({ ...item, order: index })),
      };
      setLocalSequence(updated);
      saveSequence(updated);
      
      // Update current index if it was affected
      if (oldIndex === currentIndex) {
        onCurrentIndexChange(newIndex);
      } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
        onCurrentIndexChange(currentIndex - 1);
      } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
        onCurrentIndexChange(currentIndex + 1);
      }
    }
  }, [localSequence, isNewFormat, sequenceScenes, items, currentIndex, onCurrentIndexChange]);

  // Handle jump to scene
  const handleJumpToScene = useCallback((index: number) => {
    if (!localSequence || index < 0 || index >= sequenceItems.length) return;
    
    onCurrentIndexChange(index);
    // If playing, load the scene immediately (transition will be handled by the useEffect)
    if (playbackState === "playing" && onLoadScene) {
      const item = sequenceItems[index];
      const sceneId = item.sceneId || item.presetId || "";
      const scene = allScenes.find((s) => s.id === sceneId);
      if (scene) {
        const state = loadSceneState(scene);
        if (state) {
          onLoadScene(state);
        }
      }
    }
  }, [localSequence, sequenceItems, playbackState, onLoadScene, onCurrentIndexChange, allScenes]);

  // Auto-advance to next scene
  const handleNext = useCallback(() => {
    if (!localSequence || sequenceItems.length === 0) return;

    const nextIndex = (currentIndex + 1) % sequenceItems.length;
    if (nextIndex === 0) {
      // Reached end, stop
      onPlaybackStateChange("stopped");
      onCurrentIndexChange(0);
      return;
    }

    onCurrentIndexChange(nextIndex);
    // Don't call loadCurrentScene here - it will be triggered by the useEffect when index changes
  }, [sequence?.id, sequenceItems.length, currentIndex, onPlaybackStateChange, onCurrentIndexChange]);

  const handlePrevious = useCallback(() => {
    if (!localSequence || sequenceItems.length === 0) return;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : sequenceItems.length - 1;
    onCurrentIndexChange(prevIndex);
    // Don't call loadCurrentScene here - it will be triggered by the useEffect when index changes
  }, [sequence?.id, sequenceItems.length, currentIndex, onCurrentIndexChange]);

  const handlePlay = () => {
    if (!localSequence || sequenceItems.length === 0) return;
    
    // If stopped, start from beginning
    if (playbackState === "stopped") {
      onCurrentIndexChange(0);
      // Track that playback is starting for this sequence
      sequenceIdWhenPlaybackStartedRef.current = localSequence.id;
    }
    
    onPlaybackStateChange("playing");
    // Scene will be loaded by the useEffect when playbackState changes
  };

  const handlePause = () => {
    onPlaybackStateChange("paused");
  };

  const handleStop = () => {
    onPlaybackStateChange("stopped");
    onCurrentIndexChange(0);
    // Clear playback start tracking when stopping
    sequenceIdWhenPlaybackStartedRef.current = null;
  };

  // Start playback timer
  useEffect(() => {
    if (playbackState !== "playing" || !currentItem) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If duration is 0, don't auto-advance
    if (currentItem.duration === 0) {
      return;
    }

    // Start countdown
    intervalRef.current = setInterval(() => {
      handleNext();
    }, currentItem.duration * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playbackState, currentItem?.id, currentItem?.duration, handleNext]);

  // Load scene when index changes or when starting playback
  // Only load if actually playing (not just switching sequences)
  useEffect(() => {
    // Don't load scenes when just switching sequences - only load when actually playing
    if (playbackState !== "playing" || !currentItem || !currentScene || !onLoadScene) {
      return;
    }

    // Don't load scenes if sequence changed but playback hasn't started for the new sequence yet
    // This prevents loading a scene when user just selects a new sequence while another is playing
    if (currentIndex === 0 && sequence?.id !== sequenceIdWhenPlaybackStartedRef.current) {
      // We're at index 0 but playback hasn't been started for this sequence yet
      // This means user just selected a new sequence - don't load the scene yet
      // Let the existing sequence keep playing until user presses play
      return;
    }

    const state = loadSceneState(currentScene);
    if (!state) return;

    // Transitions are handled in PerformPage's handleLoadScene callback
    // It will get the transition from the previous scene (transitions are applied BETWEEN scenes, not at start)
    // For the first scene (index 0), there's no previous scene, so no transition
    onLoadScene(state);
  }, [currentIndex, playbackState, currentItem?.id, currentScene?.id, onLoadScene, isNewFormat, sequenceScenes, items, sequence?.id]);

  if (!localSequence) {
    return (
      <div className="text-center py-8 text-theme-subtle">
        Select a sequence from the dropdown above to begin playback.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Playback Controls Header */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Sequence Name & Info */}
        <div className="flex-shrink-0">
          <h3 className="text-base font-semibold text-theme-primary">{localSequence.name}</h3>
          <p className="text-xs text-theme-subtle">
            Scene {currentIndex + 1} of {sequenceItems.length}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={playbackState === "stopped" || sequenceItems.length === 0}
            title="Previous"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {playbackState === "playing" ? (
            <Button variant="default" size="icon" onClick={handlePause} title="Pause">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="default" size="icon" onClick={handlePlay} title="Play">
              <Play className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleStop}
            disabled={playbackState === "stopped"}
            title="Stop"
          >
            <Square className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={playbackState === "stopped" || sequenceItems.length === 0}
            title="Next"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Scene Info */}
        {currentScene && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-sm text-theme-subtle min-w-0">
              <p className="font-medium text-theme-primary truncate">{currentScene.name}</p>
              {currentItem && currentItem.duration > 0 && (
                <p className="text-xs">Duration: {currentItem.duration}s</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sequence Items List */}
      {sequenceItems.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sequenceItems.map((item: any) => item.id || sequenceItems.indexOf(item))}
              strategy={verticalListSortingStrategy}
            >
          <div className="space-y-2">
            {sequenceItems.map((item: any, index: number) => {
              const sceneId = item.sceneId || item.presetId || "";
              const scene = allScenes.find((s) => s.id === sceneId);
              const isCurrent = index === currentIndex;

                  // Use item.id as key (same as SequenceManager) - this is stable
              return (
                    <SortableSceneRow
                      key={item.id}
                      item={item}
                      index={index}
                      scene={scene || null}
                      isCurrent={isCurrent}
                      onJumpToScene={handleJumpToScene}
                    />
              );
            })}
          </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

