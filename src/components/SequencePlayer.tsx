import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/Button";
import { Play, Pause, Square, ChevronLeft, ChevronRight } from "lucide-react";
import type { Sequence, SequenceItem } from "@/lib/storage/sequenceStorage";
import type { GeneratorState } from "@/types/generator";
import { getAllScenes, loadSceneState, type Scene } from "@/lib/storage/sceneStorage";

import type { TransitionType } from "@/generator";

interface SequencePlayerProps {
  sequence: Sequence | null;
  currentState: GeneratorState | null;
  onLoadScene: (state: GeneratorState, transition?: TransitionType) => void;
  onRandomize: () => void;
}

type PlaybackState = "stopped" | "playing" | "paused";

export function SequencePlayer({
  sequence,
  onLoadScene,
}: SequencePlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loop, setLoop] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allScenes = getAllScenes();

  // Support both old format (items) and new format (scenes)
  const items = (sequence as any)?.items || [];
  const sequenceScenes = (sequence as any)?.scenes || [];
  const sequenceItems = sequenceScenes.length > 0 ? sequenceScenes : items;
  const isNewFormat = sequenceScenes.length > 0 || (items.length === 0 && !(sequence as any)?.items);
  
  // Get current item
  const currentItem: SequenceItem | null =
    sequence && sequenceItems.length > 0 && currentIndex < sequenceItems.length
      ? (isNewFormat ? {
          id: sequenceScenes[currentIndex].id,
          sceneId: sequenceScenes[currentIndex].sceneId || sequenceScenes[currentIndex].presetId || "",
          duration: sequenceScenes[currentIndex].durationSeconds || (sequenceScenes[currentIndex].durationMode === "manual" ? 0 : sequenceScenes[currentIndex].durationSeconds || 0),
          transition: sequenceScenes[currentIndex].fadeTypeOverride === "cut" ? "instant" : sequenceScenes[currentIndex].fadeTypeOverride === "crossfade" ? "fade" : "instant",
          order: sequenceScenes[currentIndex].order,
        } : items[currentIndex])
      : null;

  const currentScene: Scene | null = currentItem
    ? allScenes.find((s) => s.id === (currentItem.sceneId || currentItem.presetId)) || null
    : null;

  // Load scene from current item
  const loadCurrentScene = useCallback(() => {
    if (!currentItem || !currentScene) return;
    const state = loadSceneState(currentScene);
    if (state) {
      onLoadScene(state, currentItem.transition);
    }
  }, [currentItem, currentScene, onLoadScene]);

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

    // Set initial time remaining
    setTimeRemaining(currentItem.duration);

    // Start countdown
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up, advance to next item
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playbackState, currentItem]);

  // Load scene when current item changes
  useEffect(() => {
    if (playbackState === "playing" && currentItem) {
      loadCurrentScene();
    }
  }, [currentIndex, playbackState, loadCurrentPreset, currentItem]);

  const handlePlay = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    if (playbackState === "stopped") {
      // Start from beginning
      setCurrentIndex(0);
      setPlaybackState("playing");
      loadCurrentScene();
    } else if (playbackState === "paused") {
      // Resume
      setPlaybackState("playing");
    }
  };

  const handlePause = () => {
    setPlaybackState("paused");
  };

  const handleStop = () => {
    setPlaybackState("stopped");
    setCurrentIndex(0);
    setTimeRemaining(0);
  };

  const handleNext = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % sequenceItems.length;
    
    if (nextIndex === 0 && !loop) {
      // Reached end, stop
      handleStop();
      return;
    }
    
    setCurrentIndex(nextIndex);
    if (playbackState === "playing") {
      loadCurrentScene();
    }
  };

  const handlePrevious = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    const prevIndex = currentIndex <= 0 ? sequenceItems.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    if (playbackState === "playing") {
      loadCurrentScene();
    }
  };

  if (!sequence || sequenceItems.length === 0) {
    return (
      <div className="p-4 text-center text-theme-muted">
        <p>No sequence selected or sequence is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-card rounded-lg border border-theme-panel shadow-sm p-6">
      <div className="space-y-4">
        {/* Sequence Info */}
        <div>
          <h3 className="text-lg font-semibold text-theme-heading mb-1">
            {sequence.name}
          </h3>
          <p className="text-sm text-theme-muted">
            {currentIndex + 1} / {sequenceItems.length}
          </p>
        </div>

        {/* Current Scene */}
        {currentScene && (
          <div className="bg-theme-icon rounded-lg p-3">
            <p className="text-sm text-theme-muted mb-1">Current Scene</p>
            <p className="font-medium text-theme-heading">{currentScene.name}</p>
            {currentItem && currentItem.duration > 0 && (
              <p className="text-xs text-theme-muted mt-1">
                {timeRemaining}s remaining
              </p>
            )}
            {currentItem && currentItem.duration === 0 && (
              <p className="text-xs text-theme-muted mt-1">
                Manual advance
              </p>
            )}
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={playbackState === "stopped"}
            title="Previous scene"
          >
            <ChevronLeft className="h-6 w-6" data-slot="icon" />
          </Button>

          {playbackState === "playing" ? (
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={handlePause}
              title="Pause"
            >
              <Pause className="h-6 w-6" data-slot="icon" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={handlePlay}
              title="Play"
            >
              <Play className="h-6 w-6" data-slot="icon" />
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleStop}
            disabled={playbackState === "stopped"}
            title="Stop"
          >
            <Square className="h-6 w-6" data-slot="icon" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={playbackState === "stopped"}
            title="Next scene"
          >
            <ChevronRight className="h-6 w-6" data-slot="icon" />
          </Button>
        </div>

        {/* Loop Toggle */}
        <div className="flex items-center justify-center gap-2">
          <input
            type="checkbox"
            id="loop-sequence"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="rounded border-theme-panel"
          />
          <label
            htmlFor="loop-sequence"
            className="text-sm text-theme-muted cursor-pointer"
          >
            Loop sequence
          </label>
        </div>

        {/* Progress Indicator */}
        {currentItem && currentItem.duration > 0 && playbackState === "playing" && (
          <div className="w-full bg-theme-icon rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${(timeRemaining / currentItem.duration) * 100}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

