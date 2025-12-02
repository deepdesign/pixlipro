import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SequenceSceneCard } from "./SequenceSceneCard";
import { PlaybackControls } from "./PlaybackControls";
import { Button } from "@/components/Button";
import {
  type Sequence,
  type SequenceScene,
  generateSequenceSceneId,
} from "@/lib/storage/sequenceStorage";
import type { Scene } from "@/lib/storage/sceneStorage";
import { Plus } from "lucide-react";

interface SequenceTimelineProps {
  sequence: Sequence;
  onSequenceUpdate: (sequence: Sequence) => void;
  scenes: Scene[];
}

function formatDuration(sequence: Sequence): string {
  const hasManual = sequence.scenes.some(
    (scene) => scene.durationMode === "manual"
  );
  if (hasManual) {
    return "Variable";
  }

  const totalSeconds = sequence.scenes.reduce((sum, scene) => {
    return sum + (scene.durationSeconds || 0);
  }, 0);

  if (totalSeconds === 0) {
    return "0s";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${totalSeconds}s`;
}

export function SequenceTimeline({
  sequence,
  onSequenceUpdate,
  scenes,
}: SequenceTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sequence.scenes.findIndex(
        (scene) => scene.id === active.id
      );
      const newIndex = sequence.scenes.findIndex(
        (scene) => scene.id === over.id
      );

      const reorderedScenes = arrayMove(sequence.scenes, oldIndex, newIndex);
      const updatedScenes = reorderedScenes.map((scene, index) => ({
        ...scene,
        order: index,
      }));

      onSequenceUpdate({
        ...sequence,
        scenes: updatedScenes,
        updatedAt: Date.now(),
      });
    }
  };

  const handleSceneUpdate = useCallback(
    (updatedScene: SequenceScene) => {
      const updatedScenes = sequence.scenes.map((scene) =>
        scene.id === updatedScene.id ? updatedScene : scene
      );
      onSequenceUpdate({
        ...sequence,
        scenes: updatedScenes,
        updatedAt: Date.now(),
      });
    },
    [sequence, onSequenceUpdate]
  );

  const handleSceneDelete = useCallback(
    (sceneId: string) => {
      if (confirm("Delete this scene from the sequence?")) {
        const updatedScenes = sequence.scenes
          .filter((scene) => scene.id !== sceneId)
          .map((scene, index) => ({
            ...scene,
            order: index,
          }));
        onSequenceUpdate({
          ...sequence,
          scenes: updatedScenes,
          updatedAt: Date.now(),
        });
      }
    },
    [sequence, onSequenceUpdate]
  );

  const handleSceneDuplicate = useCallback(
    (sceneId: string) => {
      const sceneToDuplicate = sequence.scenes.find(
        (s) => s.id === sceneId
      );
      if (!sceneToDuplicate) return;

      const newScene: SequenceScene = {
        ...sceneToDuplicate,
        id: generateSequenceSceneId(),
        name: `${sceneToDuplicate.name} (Copy)`,
        order: sceneToDuplicate.order + 1,
      };

      const updatedScenes = [
        ...sequence.scenes.slice(0, sceneToDuplicate.order + 1),
        newScene,
        ...sequence.scenes.slice(sceneToDuplicate.order + 1),
      ].map((scene, index) => ({
        ...scene,
        order: index,
      }));

      onSequenceUpdate({
        ...sequence,
        scenes: updatedScenes,
        updatedAt: Date.now(),
      });
    },
    [sequence, onSequenceUpdate]
  );

  const handleAddScene = () => {
    // Simple modal to select scene - for now just use first scene or show alert
    if (scenes.length === 0) {
      alert("No scenes available. Create a scene first.");
      return;
    }
    // In a real implementation, this would open a modal
    // For now, just add the first scene
    const scene = scenes[0];
    const newScene: SequenceScene = {
      id: generateSequenceSceneId(),
      sequenceId: sequence.id,
      sceneId: scene.id,
      name: scene.name,
      durationMode: "manual",
      order: sequence.scenes.length,
    };
    onSequenceUpdate({
      ...sequence,
      scenes: [...sequence.scenes, newScene],
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-theme-divider">
        <PlaybackControls sequence={sequence} />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {sequence.scenes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-theme-muted mb-4">
              No scenes in this sequence yet.
            </p>
            <Button onClick={handleAddScene}>
              <Plus className="h-4 w-4 mr-2" />
              Add scene to sequence
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sequence.scenes.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {sequence.scenes.map((scene) => (
                  <SequenceSceneCard
                    key={scene.id}
                    scene={scene}
                    sequence={sequence}
                    scenes={scenes}
                    onUpdate={handleSceneUpdate}
                    onDelete={handleSceneDelete}
                    onDuplicate={handleSceneDuplicate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {sequence.scenes.length > 0 && (
        <div className="p-4 border-t border-theme-divider bg-theme-icon">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-theme-muted">
                Total scenes: <span className="font-medium">{sequence.scenes.length}</span>
              </div>
              <div className="text-sm text-theme-muted">
                Approximate duration: <span className="font-medium">{formatDuration(sequence)}</span>
              </div>
            </div>
            <Button variant="outline" onClick={handleAddScene}>
              <Plus className="h-4 w-4 mr-2" />
              Add scene
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

