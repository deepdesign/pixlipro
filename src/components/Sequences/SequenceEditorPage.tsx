import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { SequenceHeader } from "./SequenceHeader";
import { PresetLibraryPanel } from "./PresetLibraryPanel";
import { SequenceTimeline } from "./SequenceTimeline";
import {
  saveSequence,
  type Sequence,
  type SequenceScene,
  generateSequenceSceneId,
} from "@/lib/storage/sequenceStorage";
import { getAllPresets, type Preset } from "@/lib/storage/presetStorage";
import type { GeneratorState } from "@/types/generator";

interface SequenceEditorPageProps {
  sequence: Sequence;
  isNew?: boolean;
  onBack: () => void;
  onUpdate: () => void;
}

export function SequenceEditorPage({
  sequence: initialSequence,
  isNew = false,
  onBack,
  onUpdate,
}: SequenceEditorPageProps) {
  const [sequence, setSequence] = useState<Sequence>(initialSequence);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"scenes" | "presets">("scenes");
  const savedSequenceRef = useRef<Sequence>(initialSequence);

  useEffect(() => {
    setPresets(getAllPresets());
    
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

  const handleAddPreset = (preset: Preset | GeneratorState) => {
    const newScene: SequenceScene = {
      id: generateSequenceSceneId(),
      sequenceId: sequence.id,
      order: sequence.scenes.length,
      name: "preset" in preset ? preset.name : "Imported Scene",
      durationMode: "manual",
      ...("id" in preset && preset.id
        ? { presetId: preset.id }
        : { inlinePresetJson: preset as GeneratorState }),
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
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("scenes")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "scenes"
                  ? "text-slate-900 dark:text-slate-50 border-b-2 border-slate-900 dark:border-slate-50"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Scenes
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "presets"
                  ? "text-slate-900 dark:text-slate-50 border-b-2 border-slate-900 dark:border-slate-50"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Presets
            </button>
          </div>

          {/* Mobile content */}
          {activeTab === "scenes" ? (
            <SequenceTimeline
              sequence={sequence}
              onSequenceUpdate={handleSequenceUpdate}
              presets={presets}
            />
          ) : (
            <PresetLibraryPanel
              presets={presets}
              onAddPreset={handleAddPreset}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop two-pane layout */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 overflow-auto">
            <PresetLibraryPanel
              presets={presets}
              onAddPreset={handleAddPreset}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <SequenceTimeline
              sequence={sequence}
              onSequenceUpdate={handleSequenceUpdate}
              presets={presets}
            />
          </div>
        </div>
      )}
    </div>
  );
}

