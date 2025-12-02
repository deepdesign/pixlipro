import { useState, useEffect, useCallback, useRef } from "react";
import { SequenceHeader } from "./SequenceHeader";
import { SceneLibraryPanel } from "./SceneLibraryPanel";
import { SequenceTimeline } from "./SequenceTimeline";
import {
  saveSequence,
  type Sequence,
  type SequenceScene,
  generateSequenceSceneId,
} from "@/lib/storage/sequenceStorage";
import { getAllScenes, type Scene } from "@/lib/storage/sceneStorage";
import type { GeneratorState } from "@/types/generator";

interface SequenceEditorPageProps {
  sequence: Sequence;
  isNew?: boolean;
  onBack: () => void;
  onUpdate: () => void;
}

export function SequenceEditorPage({
  sequence: initialSequence,
  isNew: _isNew = false,
  onBack,
  onUpdate,
}: SequenceEditorPageProps) {
  const [sequence, setSequence] = useState<Sequence>(initialSequence);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"scenes">("scenes");
  const savedSequenceRef = useRef<Sequence>(initialSequence);

  useEffect(() => {
    setScenes(getAllScenes());
    
    // Check mobile viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Compare current sequence with saved version
    const hasChanges = JSON.stringify(sequence) !== JSON.stringify(savedSequenceRef.current);
    setHasUnsavedChanges(hasChanges);
  }, [sequence]);

  const handleSequenceUpdate = useCallback((updated: Sequence) => {
    setSequence(updated);
  }, []);

  const handleSave = () => {
    saveSequence(sequence);
    savedSequenceRef.current = { ...sequence };
    setHasUnsavedChanges(false);
    onUpdate();
  };

  const handleExport = () => {
    const json = JSON.stringify(sequence, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sequence.name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddScene = (scene: Scene | GeneratorState) => {
    const newScene: SequenceScene = {
      id: generateSequenceSceneId(),
      sequenceId: sequence.id,
      order: sequence.scenes.length,
      name: ("name" in scene && typeof (scene as any).name === "string") ? (scene as any).name : "Imported Scene",
      durationMode: "manual",
      ...("id" in scene && scene.id
        ? { sceneId: scene.id }
        : { inlineSceneJson: scene as GeneratorState }),
    };

    const updated = {
      ...sequence,
      scenes: [...sequence.scenes, newScene],
      updatedAt: Date.now(),
    };
    handleSequenceUpdate(updated);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SequenceHeader
        sequence={sequence}
        onSequenceUpdate={handleSequenceUpdate}
        onSave={handleSave}
        onExport={handleExport}
        onBack={handleBack}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {isMobile ? (
        <div className="flex-1 overflow-auto">
          {/* Mobile tabs */}
          <div className="flex border-b border-theme-divider">
            <button
              onClick={() => setActiveTab("scenes")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "scenes"
                  ? "text-theme-heading border-b-2 border-theme-heading"
                  : "text-theme-muted"
              }`}
            >
              Scenes
            </button>
            <button
              onClick={() => setActiveTab("scenes")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "scenes"
                  ? "text-theme-heading border-b-2 border-theme-heading"
                  : "text-theme-muted"
              }`}
            >
              Scenes
            </button>
          </div>

          {/* Mobile content */}
          {activeTab === "scenes" ? (
            <SequenceTimeline
              sequence={sequence}
              onSequenceUpdate={handleSequenceUpdate}
              scenes={scenes}
            />
          ) : (
            <SceneLibraryPanel
              scenes={scenes}
              onAddScene={handleAddScene}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop two-pane layout */}
          <div className="w-80 border-r border-theme-divider overflow-auto">
            <SceneLibraryPanel
              scenes={scenes}
              onAddScene={handleAddScene}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <SequenceTimeline
              sequence={sequence}
              onSequenceUpdate={handleSequenceUpdate}
              scenes={scenes}
            />
          </div>
        </div>
      )}
    </div>
  );
}

