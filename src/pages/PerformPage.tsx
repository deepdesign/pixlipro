import { useState, useEffect } from "react";
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

interface PerformPageProps {
  currentState?: GeneratorState | null;
  onLoadScene?: (state: GeneratorState) => void;
  initialSequenceId?: string;
}

export function PerformPage({ currentState, onLoadScene, initialSequenceId }: PerformPageProps) {
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [playbackState, setPlaybackState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editQueue, setEditQueue] = useState<Partial<GeneratorState>[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);

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
                onLoadScene={onLoadScene}
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
                  currentState={currentState}
                  isPlaying={playbackState === "playing"}
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

