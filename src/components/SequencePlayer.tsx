import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/Button";
import { Play, Pause, Square, ChevronLeft, ChevronRight } from "lucide-react";
import type { Sequence, SequenceItem } from "@/lib/storage/sequenceStorage";
import type { GeneratorState } from "@/types/generator";
import { getAllPresets, loadPresetState, type Preset } from "@/lib/storage/presetStorage";

import type { TransitionType } from "@/generator";

interface SequencePlayerProps {
  sequence: Sequence | null;
  currentState: GeneratorState | null;
  onLoadPreset: (state: GeneratorState, transition?: TransitionType) => void;
  onRandomize: () => void;
}

type PlaybackState = "stopped" | "playing" | "paused";

export function SequencePlayer({
  sequence,
  onLoadPreset,
}: SequencePlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loop, setLoop] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presets = getAllPresets();

  // Support both old format (items) and new format (scenes)
  const items = (sequence as any)?.items || [];
  const scenes = (sequence as any)?.scenes || [];
  const sequenceItems = scenes.length > 0 ? scenes : items;
  const isNewFormat = scenes.length > 0 || (items.length === 0 && !(sequence as any)?.items);
  
  // Get current item
  const currentItem: SequenceItem | null =
    sequence && sequenceItems.length > 0 && currentIndex < sequenceItems.length
      ? (isNewFormat ? {
          id: scenes[currentIndex].id,
          presetId: scenes[currentIndex].presetId || "",
          duration: scenes[currentIndex].durationSeconds || (scenes[currentIndex].durationMode === "manual" ? 0 : scenes[currentIndex].durationSeconds || 0),
          transition: scenes[currentIndex].fadeTypeOverride === "cut" ? "instant" : scenes[currentIndex].fadeTypeOverride === "crossfade" ? "fade" : "instant",
          order: scenes[currentIndex].order,
        } : items[currentIndex])
      : null;

  const currentPreset: Preset | null = currentItem
    ? presets.find((p) => p.id === currentItem.presetId) || null
    : null;

  // Load preset from current item
  const loadCurrentPreset = useCallback(() => {
    if (!currentItem || !currentPreset) return;
    const state = loadPresetState(currentPreset);
    if (state) {
      onLoadPreset(state, currentItem.transition);
    }
  }, [currentItem, currentPreset, onLoadPreset]);

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

  // Load preset when current item changes
  useEffect(() => {
    if (playbackState === "playing" && currentItem) {
      loadCurrentPreset();
    }
  }, [currentIndex, playbackState, loadCurrentPreset, currentItem]);

  const handlePlay = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    if (playbackState === "stopped") {
      // Start from beginning
      setCurrentIndex(0);
      setPlaybackState("playing");
      loadCurrentPreset();
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
      loadCurrentPreset();
    }
  };

  const handlePrevious = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    const prevIndex = currentIndex <= 0 ? sequenceItems.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    if (playbackState === "playing") {
      loadCurrentPreset();
    }
  };

  if (!sequence || sequenceItems.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        <p>No sequence selected or sequence is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="space-y-4">
        {/* Sequence Info */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {sequence.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {sequenceItems.length}
          </p>
        </div>

        {/* Current Preset */}
        {currentPreset && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Preset</p>
            <p className="font-medium text-slate-900 dark:text-white">{currentPreset.name}</p>
            {currentItem && currentItem.duration > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {timeRemaining}s remaining
              </p>
            )}
            {currentItem && currentItem.duration === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            title="Previous preset"
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
            title="Next preset"
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
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <label
            htmlFor="loop-sequence"
            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Loop sequence
          </label>
        </div>

        {/* Progress Indicator */}
        {currentItem && currentItem.duration > 0 && playbackState === "playing" && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
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

