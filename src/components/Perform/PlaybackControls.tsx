import { useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/Button";
import { Play, Pause, Square, SkipForward, SkipBack } from "lucide-react";
import type { Sequence, SequenceItem } from "@/lib/storage/sequenceStorage";
import type { GeneratorState } from "@/types/generator";
import { getAllScenes, loadSceneState, type Scene } from "@/lib/storage/sceneStorage";

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
  const allScenes = getAllScenes();

  // Support both old format (items) and new format (scenes)
  const items = useMemo(() => (sequence as any)?.items || [], [sequence]);
  const sequenceScenes = useMemo(() => (sequence as any)?.scenes || [], [sequence]);
  const sequenceItems = useMemo(() => sequenceScenes.length > 0 ? sequenceScenes : items, [sequenceScenes, items]);
  const isNewFormat = useMemo(() => sequenceScenes.length > 0 || (items.length === 0 && !(sequence as any)?.items), [sequenceScenes.length, items.length, sequence]);

  // Get current item - memoized to prevent infinite loops
  const currentItem: SequenceItem | null = useMemo(() => {
    if (!sequence || sequenceItems.length === 0 || currentIndex >= sequenceItems.length) {
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
  }, [sequence, sequenceItems.length, currentIndex, isNewFormat, sequenceScenes, items]);

  // Get current scene - memoized
  const currentScene: Scene | null = useMemo(() => {
    if (!currentItem) return null;
    return allScenes.find((s) => s.id === (currentItem.sceneId || currentItem.presetId)) || null;
  }, [currentItem?.sceneId, currentItem?.presetId, allScenes]);

  // Auto-advance to next scene
  const handleNext = useCallback(() => {
    if (!sequence || sequenceItems.length === 0) return;

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
    if (!sequence || sequenceItems.length === 0) return;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : sequenceItems.length - 1;
    onCurrentIndexChange(prevIndex);
    // Don't call loadCurrentScene here - it will be triggered by the useEffect when index changes
  }, [sequence?.id, sequenceItems.length, currentIndex, onCurrentIndexChange]);

  const handlePlay = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    // If stopped, start from beginning
    if (playbackState === "stopped") {
      onCurrentIndexChange(0);
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
  useEffect(() => {
    if (playbackState === "playing" && currentItem && currentScene && onLoadScene) {
      const state = loadSceneState(currentScene);
      if (state) {
        onLoadScene(state);
      }
    }
  }, [currentIndex, playbackState, currentItem?.id, currentScene?.id, onLoadScene]);

  if (!sequence) {
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
          <h3 className="text-base font-semibold text-theme-primary">{sequence.name}</h3>
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
          <div className="space-y-2">
            {sequenceItems.map((item: any, index: number) => {
              const sceneId = item.sceneId || item.presetId || "";
              const scene = allScenes.find((s) => s.id === sceneId);
              const isCurrent = index === currentIndex;
              const itemDuration = item.durationSeconds || (item.durationMode === "manual" ? 0 : item.durationSeconds || 0) || item.duration || 0;

              return (
                <div
                  key={item.id || index}
                  className={`rounded-md border p-3 ${
                    isCurrent
                      ? "bg-theme-icon border-theme-card"
                      : "bg-theme-panel border-theme-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-theme-bg-base flex items-center justify-center text-xs font-medium text-theme-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrent ? "text-theme-primary" : "text-theme-primary"
                        }`}>
                          {scene?.name || `Scene ${index + 1}`}
                        </p>
                        {itemDuration > 0 && (
                          <p className="text-xs text-theme-subtle">
                            {itemDuration}s
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

