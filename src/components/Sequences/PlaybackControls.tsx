import { useState } from "react";
import { Button } from "@/components/Button";
import type { Sequence } from "@/lib/storage/sequenceStorage";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

interface PlaybackControlsProps {
  sequence: Sequence;
}

export function PlaybackControls({ sequence }: PlaybackControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  const currentScene = sequence.scenes[currentSceneIndex];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Wire up to actual playback engine
  };

  const handlePrevious = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    } else if (isLooping) {
      setCurrentSceneIndex(sequence.scenes.length - 1);
    }
  };

  const handleNext = () => {
    if (currentSceneIndex < sequence.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    } else if (isLooping) {
      setCurrentSceneIndex(0);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentSceneIndex === 0 && !isLooping}
          title="Previous scene"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={
            currentSceneIndex === sequence.scenes.length - 1 && !isLooping
          }
          title="Next scene"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button
          variant={isLooping ? "default" : "outline"}
          size="sm"
          onClick={() => setIsLooping(!isLooping)}
          title="Toggle loop"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      {currentScene && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Now previewing: <span className="font-medium">{currentScene.name}</span>
        </div>
      )}
    </div>
  );
}

