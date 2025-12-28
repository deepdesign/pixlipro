import { useState, useEffect, useCallback, useRef } from "react";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";
import { LivePreviewCanvas } from "@/components/Perform/LivePreviewCanvas";
import { PlaybackControls } from "@/components/Perform/PlaybackControls";
import { EditQueuePanel } from "@/components/Perform/EditQueuePanel";
import { ProjectorStatus } from "@/components/Perform/ProjectorStatus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/Button";
import { Edit } from "lucide-react";
import type { Sequence } from "@/lib/storage/sequenceStorage";
import type { GeneratorState } from "@/types/generator";
import { getAllSequences } from "@/lib/storage/sequenceStorage";

interface PersistedPerformState {
  selectedSequence: Sequence | null;
  playbackState: "stopped" | "playing" | "paused";
  currentIndex: number;
  previewState: GeneratorState | null;
}

interface PerformPageProps {
  currentState?: GeneratorState | null;
  onLoadScene?: (state: GeneratorState) => void;
  initialSequenceId?: string;
  persistedState?: PersistedPerformState;
  onStateChange?: (state: PersistedPerformState) => void;
}

export function PerformPage({ 
  currentState, 
  onLoadScene, 
  initialSequenceId,
  persistedState,
  onStateChange,
}: PerformPageProps) {
  // Use persisted state if provided, otherwise use local state
  const [localSelectedSequence, setLocalSelectedSequence] = useState<Sequence | null>(null);
  const [localPlaybackState, setLocalPlaybackState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [localCurrentIndex, setLocalCurrentIndex] = useState(0);
  const [localPreviewState, setLocalPreviewState] = useState<GeneratorState | null>(null);
  
  // Derive actual state from persisted or local
  const selectedSequence = persistedState?.selectedSequence ?? localSelectedSequence;
  const playbackState = persistedState?.playbackState ?? localPlaybackState;
  const currentIndex = persistedState?.currentIndex ?? localCurrentIndex;
  const previewState = persistedState?.previewState ?? localPreviewState;
  
  // Use refs to always get latest values (avoids stale closure issues)
  const stateRef = useRef({ selectedSequence, playbackState, currentIndex, previewState });
  stateRef.current = { selectedSequence, playbackState, currentIndex, previewState };
  
  // State setters that update both local and persisted state
  const setSelectedSequence = useCallback((seq: Sequence | null) => {
    setLocalSelectedSequence(seq);
    if (onStateChange) {
      const current = stateRef.current;
      onStateChange({ 
        selectedSequence: seq, 
        playbackState: current.playbackState, 
        currentIndex: current.currentIndex, 
        previewState: current.previewState 
      });
    }
  }, [onStateChange]);
  
  const setPlaybackState = useCallback((state: "stopped" | "playing" | "paused") => {
    setLocalPlaybackState(state);
    if (onStateChange) {
      const current = stateRef.current;
      onStateChange({ 
        selectedSequence: current.selectedSequence, 
        playbackState: state, 
        currentIndex: current.currentIndex, 
        previewState: current.previewState 
      });
    }
  }, [onStateChange]);
  
  const setCurrentIndex = useCallback((index: number) => {
    setLocalCurrentIndex(index);
    if (onStateChange) {
      const current = stateRef.current;
      onStateChange({ 
        selectedSequence: current.selectedSequence, 
        playbackState: current.playbackState, 
        currentIndex: index, 
        previewState: current.previewState 
      });
    }
  }, [onStateChange]);
  
  const setPreviewState = useCallback((state: GeneratorState | null) => {
    setLocalPreviewState(state);
    if (onStateChange) {
      const current = stateRef.current;
      onStateChange({ 
        selectedSequence: current.selectedSequence, 
        playbackState: current.playbackState, 
        currentIndex: current.currentIndex, 
        previewState: state 
      });
    }
  }, [onStateChange]);
  
  const [editQueue, setEditQueue] = useState<Partial<GeneratorState>[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [previewTransition, setPreviewTransition] = useState<"instant" | "fade" | "smooth" | "pixellate" | undefined>(undefined);
  const [previewTransitionDuration, setPreviewTransitionDuration] = useState<number | undefined>(undefined);

  // Clear preview state when sequence is deselected or stopped
  useEffect(() => {
    if (!selectedSequence || playbackState === "stopped") {
      setPreviewState(null);
      setPreviewTransition(undefined);
      setPreviewTransitionDuration(undefined);
    }
  }, [selectedSequence, playbackState, setPreviewState]);

  // Load sequences
  useEffect(() => {
    setSequences(getAllSequences());
  }, []);

  // Load initial sequence from sessionStorage or prop
  useEffect(() => {
    const sequenceId = initialSequenceId || sessionStorage.getItem("performSequenceId");
    if (sequenceId) {
      const sequence = sequences.find((s) => s.id === sequenceId);
      if (sequence) {
        setSelectedSequence(sequence);
        // Clear sessionStorage after loading
        sessionStorage.removeItem("performSequenceId");
      }
    }
  }, [initialSequenceId, sequences]);

  // Stable callback for loading scenes - use refs for values that change often
  const handleLoadScene = useCallback((state: GeneratorState) => {
    // Update main canvas
    if (onLoadScene) {
      onLoadScene(state);
    }
    
    // Get current values from ref to avoid stale closures
    const currentSeq = stateRef.current.selectedSequence;
    const currentIdx = stateRef.current.currentIndex;
    
    // Get transition info from PREVIOUS scene (transitions are applied BETWEEN scenes, not at start)
    // The transition on scene N is used when transitioning FROM scene N TO scene N+1
    // For the first scene (index 0), there's no previous scene, so no transition
    if (currentSeq && currentIdx > 0) {
      const sequenceScenes = (currentSeq as any).scenes || [];
      const sequenceItems = (currentSeq as any).items || [];
      const isNewFormat = sequenceScenes.length > 0 || (sequenceItems.length === 0 && !(currentSeq as any).items);
      
      if (isNewFormat && sequenceScenes[currentIdx - 1]) {
        // Get transition from previous scene (the one we're transitioning FROM)
        const previousScene = sequenceScenes[currentIdx - 1];
        const transitionType = previousScene.transitionType || "fade";
        const transitionTimeMs = previousScene.transitionTimeSeconds 
          ? previousScene.transitionTimeSeconds * 1000 
          : undefined;
        
        setPreviewTransition(transitionType as any);
        setPreviewTransitionDuration(transitionTimeMs);
      } else if (!isNewFormat && sequenceItems[currentIdx - 1]) {
        // Old format - get transition from previous item
        const previousItem = sequenceItems[currentIdx - 1];
        const transition = previousItem.transition || "fade";
        setPreviewTransition(transition === "instant" ? "instant" : transition === "fade" ? "fade" : "fade");
        // Old format doesn't have transitionTimeSeconds, use default
        setPreviewTransitionDuration(undefined);
      } else {
        // No previous scene/item - no transition
        setPreviewTransition(undefined);
        setPreviewTransitionDuration(undefined);
      }
    } else {
      // First scene (index 0) - no transition
      setPreviewTransition(undefined);
      setPreviewTransitionDuration(undefined);
    }
    // Update preview canvas state
    setPreviewState(state);
  }, [onLoadScene, setPreviewState]);

  return (
    <SettingsPageLayout title="Perform">
      <div className="flex flex-col h-full gap-4">
        {/* Main Content Area - Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Left Column - Sequence Features */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Sequence Selector */}
            <div className="bg-theme-panel rounded-lg border border-theme-card p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-theme-primary">
                  Select Sequence
                </label>
                {selectedSequence && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Store sequence ID in sessionStorage for pre-selection
                      sessionStorage.setItem("editSequenceId", selectedSequence.id);
                      // Navigate to sequences page
                      window.history.pushState({}, "", "/settings/sequences");
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                    title="Edit sequence"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              <Select
                value={selectedSequence?.id || ""}
                onValueChange={(value) => {
                  const sequence = sequences.find((s) => s.id === value);
                  if (sequence) {
                    setSelectedSequence(sequence);
                    setCurrentIndex(0);
                    setPlaybackState("stopped");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a sequence to perform" />
                </SelectTrigger>
                <SelectContent>
                  {sequences.length === 0 ? (
                    <SelectItem value="" disabled>
                      No sequences available
                    </SelectItem>
                  ) : (
                    sequences.map((seq) => (
                      <SelectItem key={seq.id} value={seq.id}>
                        {seq.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Playback Controls */}
            <div className="bg-theme-panel rounded-lg border border-theme-card p-4 flex-1 flex flex-col min-h-0">
              <PlaybackControls
                sequence={selectedSequence}
                playbackState={playbackState}
                currentIndex={currentIndex}
                onPlaybackStateChange={setPlaybackState}
                onCurrentIndexChange={setCurrentIndex}
                onLoadScene={handleLoadScene}
              />
            </div>

            {/* Edit Queue Panel */}
            <EditQueuePanel
              queue={editQueue}
              onApplyNow={() => {
                // Apply queued edits
                if (editQueue.length > 0 && onLoadScene && currentState) {
                  const mergedState = { ...currentState, ...editQueue[editQueue.length - 1] };
                  onLoadScene(mergedState);
                  setEditQueue([]);
                }
              }}
              onClearQueue={() => setEditQueue([])}
            />
          </div>

          {/* Right Column - Display Features */}
          <div className="flex flex-col min-h-0">
            <div className="bg-theme-panel rounded-lg border border-theme-card overflow-hidden flex-1 flex flex-col">
              {/* Live Preview Canvas */}
              <div className="flex-1 min-h-0">
                <LivePreviewCanvas
                  currentState={previewState}
                  isPlaying={playbackState === "playing"}
                  transition={previewTransition}
                  transitionDurationMs={previewTransitionDuration}
                />
              </div>
              
              {/* Display Config Tools at bottom of preview */}
              <div className="border-t border-theme-card p-3 flex-shrink-0">
                <ProjectorStatus />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsPageLayout>
  );
}

