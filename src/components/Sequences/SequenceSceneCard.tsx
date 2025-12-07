import { useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/Button";
import { DurationControl } from "./DurationControl";
import { FadeControl } from "./FadeControl";
import type { Sequence, SequenceScene } from "@/lib/storage/sequenceStorage";
import type { Scene } from "@/lib/storage/sceneStorage";
import { GripVertical, Trash2, Copy } from "lucide-react";

interface SequenceSceneCardProps {
  scene: SequenceScene;
  sequence: Sequence;
  scenes: Scene[];
  onUpdate: (scene: SequenceScene) => void;
  onDelete: (sceneId: string) => void;
  onDuplicate: (sceneId: string) => void;
}

export function SequenceSceneCard({
  scene,
  sequence,
  scenes,
  onUpdate,
  onDelete,
  onDuplicate,
}: SequenceSceneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(scene.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const linkedScene = (scene.sceneId || scene.presetId)
    ? scenes.find((s) => s.id === (scene.sceneId || scene.presetId))
    : null;

  const handleNameClick = () => {
    setIsEditingName(true);
    setEditName(scene.name);
  };

  const handleNameSubmit = useCallback(() => {
    if (editName.trim() && editName !== scene.name) {
      onUpdate({
        ...scene,
        name: editName.trim(),
      });
    }
    setIsEditingName(false);
  }, [editName, scene, onUpdate]);

  const handleNameCancel = () => {
    setEditName(scene.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const handleDurationChange = (mode: "seconds" | "manual", seconds?: number) => {
    onUpdate({
      ...scene,
      durationMode: mode,
      durationSeconds: mode === "seconds" ? seconds : undefined,
    });
  };

  const handleFadeChange = (fadeType?: "cut" | "crossfade" | "fadeToBlack" | "custom") => {
    onUpdate({
      ...scene,
      fadeTypeOverride: fadeType,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-theme-card border border-theme-card rounded-lg p-6 ${
        isDragging ? "shadow-lg" : "shadow-sm"
      } transition-shadow`}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-theme-subtle hover:text-theme-muted mt-1"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Scene Name */}
          <div>
            {isEditingName ? (
              <Input
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleKeyDown}
                className="w-full"
                autoFocus
              />
            ) : (
              <button
                onClick={handleNameClick}
                className="text-base font-medium text-theme-heading hover:text-theme-muted transition-colors text-left"
              >
                {scene.name}
              </button>
            )}
          </div>

          {/* Scene Indicator */}
          <div className="text-sm">
            {linkedScene ? (
              <span className="text-theme-muted">
                Linked scene: <span className="font-medium">{linkedScene.name}</span>
              </span>
            ) : (scene.inlineSceneJson || scene.inlinePresetJson) ? (
              <span className="text-theme-muted">
                Imported JSON scene
              </span>
            ) : (
              <span className="text-status-error">
                Scene not found
              </span>
            )}
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DurationControl
              durationMode={scene.durationMode}
              durationSeconds={scene.durationSeconds}
              onChange={handleDurationChange}
            />
            <FadeControl
              fadeType={scene.fadeTypeOverride}
              defaultFadeType={sequence.defaultFadeType}
              onChange={handleFadeChange}
            />
          </div>

          {/* Background Indicator */}
          <div>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-theme-icon text-theme-muted">
              BG: inherited from sequence
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="link"
            size="icon"
            onClick={() => onDuplicate(scene.id)}
            title="Duplicate scene"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="link"
            size="icon"
            onClick={() => onDelete(scene.id)}
            title="Remove scene"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

