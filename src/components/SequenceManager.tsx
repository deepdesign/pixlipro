import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/Button";
import { Input } from "@/components/catalyst/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  getAllSequences,
  saveSequence,
  deleteSequence,
  createSequence,
  generateSequenceId,
  generateSequenceItemId,
  type Sequence,
  type SequenceItem,
  validateSequenceItems,
} from "@/lib/storage/sequenceStorage";
import { getAllScenes, type Scene, loadSceneState } from "@/lib/storage/sceneStorage";
import { SequencePlayer } from "@/components/SequencePlayer";
import { GripVertical, Trash2, Plus, Copy, Download, Upload } from "lucide-react";
import { getPalette } from "@/data/palettes";
import { SPRITE_MODES } from "@/constants/sprites";
import { formatMovementMode } from "@/constants/movement";
import type { GeneratorState } from "@/types/generator";
import { SceneThumbnail } from "./SequenceManager/SceneThumbnail";

interface SequenceManagerProps {
  onLoadScene?: (state: GeneratorState) => void;
  onLoadPreset?: (state: GeneratorState) => void; // Backward compatibility
  currentState?: GeneratorState | null;
  onClose?: () => void;
}

interface SortableItemProps {
  item: SequenceItem;
  scene: Scene | null;
  scenes: Scene[];
  onUpdate: (item: SequenceItem) => void;
  onDelete: (itemId: string) => void;
}

function SortableTableRow({ item, scene, scenes, onUpdate, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get palette colors
  const palette = scene ? getPalette(scene.state.paletteId) : null;
  
  // Get sprite label
  const spriteLabel = scene
    ? SPRITE_MODES.find((m) => m.value === scene.state.spriteMode)?.label || scene.state.spriteMode
    : "—";

  // Get motion label
  const motionLabel = scene ? formatMovementMode(scene.state.movementMode) : "—";

  // Get scene state for thumbnail
  const sceneState = scene ? loadSceneState(scene) : null;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-theme-divider ${
        isDragging ? "bg-theme-icon" : "bg-theme-card"
      } hover:bg-theme-icon transition-colors`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-theme-subtle hover:text-theme-muted"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Thumbnail */}
      <td className="px-4 py-3">
        {sceneState ? (
          <SceneThumbnail state={sceneState} size={60} />
        ) : (
          <div className="w-[60px] h-[60px] bg-theme-panel rounded border border-theme-panel flex items-center justify-center">
            <span className="text-xs text-theme-subtle">No preview</span>
          </div>
        )}
      </td>

      {/* Scene Name */}
      <td className="px-4 py-3">
        <Select
          value={item.sceneId}
          onValueChange={(value) => onUpdate({ ...item, sceneId: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scenes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!scene && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Scene not found
          </p>
        )}
      </td>

      {/* Colors */}
      <td className="px-4 py-3">
        {palette ? (
          <div className="flex items-center gap-1.5">
            {palette.colors.slice(0, 5).map((color, idx) => (
              <span
                key={idx}
                className="control-select-color-square"
                style={{ backgroundColor: color }}
                title={color}
                aria-hidden="true"
              />
            ))}
            {palette.colors.length > 5 && (
              <span className="text-xs text-theme-muted">
                +{palette.colors.length - 5}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-theme-subtle">—</span>
        )}
      </td>

      {/* Sprite */}
      <td className="px-4 py-3">
        <span className="text-sm text-theme-heading">{spriteLabel}</span>
      </td>

      {/* Motion */}
      <td className="px-4 py-3">
        <span className="text-sm text-theme-heading">{motionLabel}</span>
      </td>

      {/* Duration */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={item.duration}
            onChange={(e) => {
              const newDuration = parseInt(e.target.value) || 0;
              if (newDuration !== item.duration) {
                onUpdate({ ...item, duration: newDuration });
              }
            }}
            min={0}
            max={300}
            className="w-20"
          />
          <span className="text-xs text-theme-muted">
            {item.duration === 0 ? "Manual" : `${item.duration}s`}
          </span>
        </div>
      </td>

      {/* Transition */}
      <td className="px-4 py-3">
        <Select
          value={item.transition}
          onValueChange={(value) =>
            onUpdate({ ...item, transition: value as SequenceItem["transition"] })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instant">Instant</SelectItem>
            <SelectItem value="fade">Fade</SelectItem>
            <SelectItem value="smooth">Smooth</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" data-slot="icon" />
        </Button>
      </td>
    </tr>
  );
}

export function SequenceManager({ onLoadScene, onLoadPreset, currentState, onClose: _onClose }: SequenceManagerProps) {
  const handleLoadScene = onLoadScene || onLoadPreset; // Use onLoadScene if provided, fallback to onLoadPreset for backward compatibility
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [newSequenceName, setNewSequenceName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSequences(getAllSequences());
    setScenes(getAllScenes());
  };

  const handleCreateSequence = () => {
    if (!newSequenceName.trim()) return;
    const sequence = createSequence(newSequenceName.trim());
    saveSequence(sequence);
    setSelectedSequence(sequence);
    setNewSequenceName("");
    loadData();
  };

  const handleSelectSequence = (sequence: Sequence) => {
    setSelectedSequence(sequence);
  };

  const handleUpdateSequence = useCallback((updatedSequence: Sequence) => {
    saveSequence(updatedSequence);
    setSelectedSequence(updatedSequence);
    // Update sequences list without full reload to prevent re-render loops
    setSequences((prev) =>
      prev.map((s) => (s.id === updatedSequence.id ? updatedSequence : s))
    );
  }, []);

  const handleDeleteSequence = (sequenceId: string) => {
    if (confirm("Are you sure you want to delete this sequence?")) {
      deleteSequence(sequenceId);
      if (selectedSequence?.id === sequenceId) {
        setSelectedSequence(null);
      }
      loadData();
    }
  };

  const handleAddItem = () => {
    if (!selectedSequence || scenes.length === 0) return;
    
    // Support both old format (items) and new format (scenes)
    const items = (selectedSequence as any).items || [];
    const sequenceScenes = (selectedSequence as any).scenes || [];
    const isNewFormat = sequenceScenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
    
    if (isNewFormat) {
      // New format - use scenes
      const newScene = {
        id: generateSequenceItemId(),
        sequenceId: selectedSequence.id,
        sceneId: scenes[0].id,
        name: scenes[0].name,
        durationMode: "manual" as const,
        order: sequenceScenes.length,
      };
      const updated = {
        ...selectedSequence,
        scenes: [...sequenceScenes, newScene],
      };
      handleUpdateSequence(updated);
    } else {
      // Old format - use items (backward compatibility - still uses sceneId)
      const newItem: SequenceItem = {
        id: generateSequenceItemId(),
        sceneId: scenes[0].id,
        duration: 0,
        transition: "instant",
        order: items.length,
      };
      const updated = {
        ...selectedSequence,
        items: [...items, newItem],
      };
      handleUpdateSequence(updated);
    }
  };

  const handleUpdateItem = useCallback(
    (updatedItem: SequenceItem) => {
      if (!selectedSequence) return;
      
      // Support both formats
      const items = (selectedSequence as any).items || [];
      const sequenceScenes = (selectedSequence as any).scenes || [];
      const isNewFormat = sequenceScenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
      
      if (isNewFormat) {
        // For new format, try to find matching scene and update it
        const updated = {
          ...selectedSequence,
          scenes: sequenceScenes.map((scene: any) =>
            scene.id === updatedItem.id 
              ? { ...scene, sceneId: updatedItem.sceneId || updatedItem.presetId, presetId: updatedItem.presetId, durationSeconds: updatedItem.duration, durationMode: updatedItem.duration === 0 ? "manual" : "seconds" }
              : scene
          ),
        };
        handleUpdateSequence(updated);
      } else {
        const updated = {
          ...selectedSequence,
          items: items.map((item: SequenceItem) =>
            item.id === updatedItem.id ? updatedItem : item
          ),
        };
        handleUpdateSequence(updated);
      }
    },
    [selectedSequence, handleUpdateSequence]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!selectedSequence) return;
      
      // Support both formats
      const items = (selectedSequence as any).items || [];
      const sequenceScenes = (selectedSequence as any).scenes || [];
      const isNewFormat = sequenceScenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
      
      if (isNewFormat) {
        const updated = {
          ...selectedSequence,
          scenes: sequenceScenes
            .filter((scene: any) => scene.id !== itemId)
            .map((scene: any, index: number) => ({ ...scene, order: index })),
        };
        handleUpdateSequence(updated);
      } else {
        const updated = {
          ...selectedSequence,
          items: items
            .filter((item: SequenceItem) => item.id !== itemId)
            .map((item: SequenceItem, index: number) => ({ ...item, order: index })),
        };
        handleUpdateSequence(updated);
      }
    },
    [selectedSequence, handleUpdateSequence]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!selectedSequence || !over || active.id === over.id) return;

      // Support both formats
      const items = (selectedSequence as any).items || [];
      const sequenceScenes = (selectedSequence as any).scenes || [];
      const isNewFormat = sequenceScenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
      
      if (isNewFormat) {
        const oldIndex = sequenceScenes.findIndex((scene: any) => scene.id === active.id);
        const newIndex = sequenceScenes.findIndex((scene: any) => scene.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(sequenceScenes, oldIndex, newIndex);
        const updated = {
          ...selectedSequence,
          scenes: reordered.map((scene: any, index: number) => ({ ...scene, order: index })),
        };
        handleUpdateSequence(updated);
      } else {
        const oldIndex = items.findIndex((item: SequenceItem) => item.id === active.id);
        const newIndex = items.findIndex((item: SequenceItem) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(items, oldIndex, newIndex) as SequenceItem[];
        const updated = {
          ...selectedSequence,
          items: reordered.map((item: SequenceItem, index: number) => ({ ...item, order: index })),
        };
        handleUpdateSequence(updated);
      }
    },
    [selectedSequence, handleUpdateSequence]
  );

  const handleDuplicateSequence = () => {
    if (!selectedSequence) return;
    const duplicated: Sequence = {
      ...selectedSequence,
      id: generateSequenceId(),
      name: `${selectedSequence.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSequence(duplicated);
    setSelectedSequence(duplicated);
    loadData();
  };

  const handleExportSequence = () => {
    if (!selectedSequence) return;
    const json = JSON.stringify(selectedSequence, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSequence.name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSequence = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const result = JSON.parse(json);
          const sequence: Sequence = {
            id: generateSequenceId(),
            name: result.name || "Imported Sequence",
            backgroundColour: result.backgroundColour || "#000000",
            defaultFadeType: result.defaultFadeType || "cut",
            scenes: result.scenes || [],
            items: result.items || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          saveSequence(sequence);
          setSelectedSequence(sequence);
          loadData();
        } catch (error) {
          alert("Failed to import sequence. Invalid JSON format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const validation = selectedSequence
    ? validateSequenceItems(selectedSequence, scenes)
    : { valid: true, missingScenes: [] };

  return (
    <div className="h-full w-full flex flex-col px-6">
      {/* Top Bar with Sequence Selector and Actions */}
      <div className="py-6 bg-theme-card mt-6 rounded-lg border border-theme-panel shadow-sm px-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <label className="text-sm font-medium text-theme-muted whitespace-nowrap">
                Sequence:
              </label>
              <Select
                value={selectedSequence?.id || ""}
                onValueChange={(value) => {
                  const seq = sequences.find((s) => s.id === value);
                  if (seq) handleSelectSequence(seq);
                }}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select a sequence..." />
                </SelectTrigger>
                <SelectContent>
                  {sequences.map((sequence) => (
                    <SelectItem key={sequence.id} value={sequence.id}>
                      {sequence.name} ({(sequence as any).scenes?.length || (sequence as any).items?.length || 0} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newSequenceName}
                onChange={(e) => setNewSequenceName(e.target.value)}
                placeholder="New sequence name"
                className="w-48"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSequence();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCreateSequence}
                disabled={!newSequenceName.trim()}
                title="Create new sequence"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleImportSequence}
                title="Import sequence"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
          {selectedSequence && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDuplicateSequence}
                title="Duplicate sequence"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleExportSequence}
                title="Export sequence"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteSequence(selectedSequence.id)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
        {selectedSequence && !validation.valid && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              <span className="font-medium">Warning:</span> {validation.missingScenes?.length || validation.missingPresets?.length || 0} scene(s) not found
            </p>
          </div>
        )}
      </div>

      {/* Sequence Editor - Full Width */}
      {selectedSequence ? (
        <div className="flex-1 flex flex-col overflow-hidden pb-6">
          <div className="flex-1 overflow-auto pt-6">
            <div className="bg-theme-card rounded-lg border border-theme-panel shadow-sm p-6">
              <div className="overflow-x-auto w-full">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={((selectedSequence as any).scenes || (selectedSequence as any).items || []).map((item: any) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <table className="w-full">
                        <thead className="bg-theme-icon border-b border-theme-divider">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              <span className="sr-only">Drag</span>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Preview
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Scene
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Colors
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Sprite
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Motion
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Duration (sec)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Transition
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {((selectedSequence as any).scenes || (selectedSequence as any).items || []).map((item: any) => {
                            // Convert scene to item format for backward compatibility
                            const itemForRow: SequenceItem = (item as any).sceneId || (item as any).presetId
                              ? {
                                  id: item.id,
                                  sceneId: item.sceneId || item.presetId,
                                  presetId: item.presetId, // Keep for backward compatibility
                                  duration: item.durationSeconds || (item.durationMode === "manual" ? 0 : item.durationSeconds || 0),
                                  transition: item.fadeTypeOverride === "cut" ? "instant" : item.fadeTypeOverride === "crossfade" ? "fade" : "instant",
                                  order: item.order,
                                }
                              : item;
                            const scene = scenes.find((s) => s.id === itemForRow.sceneId) || null;
                            return (
                              <SortableTableRow
                                key={itemForRow.id}
                                item={itemForRow}
                                scene={scene}
                                scenes={scenes}
                                onUpdate={handleUpdateItem}
                                onDelete={handleDeleteItem}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={scenes.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scene
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-theme-muted p-6">
            <p>Select a sequence to edit or create a new one</p>
          </div>
        )}

      {/* Sequence Player */}
      {selectedSequence && handleLoadScene && (
        <div className="p-6 pt-6 border-t border-theme-divider">
          <SequencePlayer
            sequence={selectedSequence}
            currentState={currentState || null}
            onLoadScene={(state) => {
              handleLoadScene(state);
            }}
            onRandomize={() => {
              // Randomize is handled by the main app
            }}
          />
        </div>
      )}
    </div>
  );
}

