import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import { Field, Label, Description } from "@/components/catalyst/fieldset";
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
import { getAllPresets, type Preset, loadPresetState } from "@/lib/storage/presetStorage";
import { SequencePlayer } from "@/components/SequencePlayer";
import { GripVertical, Trash2, Plus, Copy, Download, Upload } from "lucide-react";
import { getPalette } from "@/data/palettes";
import { SPRITE_MODES } from "@/constants/sprites";
import { formatMovementMode } from "@/constants/movement";
import { createSpriteController, getCanvasFromP5 } from "@/generator";
import { createThumbnail } from "@/lib/services/exportService";
import type { GeneratorState } from "@/types/generator";
import { PresetThumbnail } from "./SequenceManager/PresetThumbnail";

interface SequenceManagerProps {
  onLoadPreset?: (state: GeneratorState) => void;
  currentState?: GeneratorState | null;
  onClose?: () => void;
}

interface SortableItemProps {
  item: SequenceItem;
  preset: Preset | null;
  presets: Preset[];
  onUpdate: (item: SequenceItem) => void;
  onDelete: (itemId: string) => void;
}

function SortableTableRow({ item, preset, presets, onUpdate, onDelete }: SortableItemProps) {
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
  const palette = preset ? getPalette(preset.state.paletteId) : null;
  
  // Get sprite label
  const spriteLabel = preset
    ? SPRITE_MODES.find((m) => m.value === preset.state.spriteMode)?.label || preset.state.spriteMode
    : "—";

  // Get motion label
  const motionLabel = preset ? formatMovementMode(preset.state.movementMode) : "—";

  // Get preset state for thumbnail
  const presetState = preset ? loadPresetState(preset) : null;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-200 dark:border-slate-800 ${
        isDragging ? "bg-slate-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-900"
      } hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Thumbnail */}
      <td className="px-4 py-3">
        {presetState ? (
          <PresetThumbnail state={presetState} size={60} />
        ) : (
          <div className="w-[60px] h-[60px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <span className="text-xs text-slate-400">No preview</span>
          </div>
        )}
      </td>

      {/* Preset Name */}
      <td className="px-4 py-3">
        <Select
          value={item.presetId}
          onValueChange={(value) => onUpdate({ ...item, presetId: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!preset && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Preset not found
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
              <span className="text-xs text-slate-500 dark:text-slate-400">
                +{palette.colors.length - 5}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>

      {/* Sprite */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-900 dark:text-white">{spriteLabel}</span>
      </td>

      {/* Motion */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-900 dark:text-white">{motionLabel}</span>
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
          <span className="text-xs text-slate-500 dark:text-slate-400">
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

export function SequenceManager({ onLoadPreset, currentState, onClose }: SequenceManagerProps) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
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
    setPresets(getAllPresets());
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
    if (!selectedSequence || presets.length === 0) return;
    
    // Support both old format (items) and new format (scenes)
    const items = (selectedSequence as any).items || [];
    const scenes = (selectedSequence as any).scenes || [];
    const isNewFormat = scenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
    
    if (isNewFormat) {
      // New format - use scenes
      const newScene = {
        id: generateSequenceItemId(),
        sequenceId: selectedSequence.id,
        presetId: presets[0].id,
        name: presets[0].name,
        durationMode: "manual" as const,
        order: scenes.length,
      };
      const updated = {
        ...selectedSequence,
        scenes: [...scenes, newScene],
      };
      handleUpdateSequence(updated);
    } else {
      // Old format - use items
      const newItem: SequenceItem = {
        id: generateSequenceItemId(),
        presetId: presets[0].id,
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
      const scenes = (selectedSequence as any).scenes || [];
      const isNewFormat = scenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
      
      if (isNewFormat) {
        // For new format, try to find matching scene and update it
        const updated = {
          ...selectedSequence,
          scenes: scenes.map((scene: any) =>
            scene.id === updatedItem.id 
              ? { ...scene, presetId: updatedItem.presetId, durationSeconds: updatedItem.duration, durationMode: updatedItem.duration === 0 ? "manual" : "seconds" }
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
      const scenes = (selectedSequence as any).scenes || [];
      const isNewFormat = scenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
      
      if (isNewFormat) {
        const updated = {
          ...selectedSequence,
          scenes: scenes
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
      const scenes = (selectedSequence as any).scenes || [];
      const isNewFormat = scenes.length > 0 || (items.length === 0 && !(selectedSequence as any).items);
      
      if (isNewFormat) {
        const oldIndex = scenes.findIndex((scene: any) => scene.id === active.id);
        const newIndex = scenes.findIndex((scene: any) => scene.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(scenes, oldIndex, newIndex);
        const updated = {
          ...selectedSequence,
          scenes: reordered.map((scene: any, index: number) => ({ ...scene, order: index })),
        };
        handleUpdateSequence(updated);
      } else {
        const oldIndex = items.findIndex((item: SequenceItem) => item.id === active.id);
        const newIndex = items.findIndex((item: SequenceItem) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(items, oldIndex, newIndex);
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
    ? validateSequenceItems(selectedSequence, presets)
    : { valid: true, missingPresets: [] };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950 px-6">
      {/* Top Bar with Sequence Selector and Actions */}
      <div className="py-6 bg-white dark:bg-slate-900 mt-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm px-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
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
              <span className="font-medium">Warning:</span> {validation.missingPresets.length} preset(s) not found
            </p>
          </div>
        )}
      </div>

      {/* Sequence Editor - Full Width */}
      {selectedSequence ? (
        <div className="flex-1 flex flex-col overflow-hidden pb-6">
          <div className="flex-1 overflow-auto pt-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
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
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              <span className="sr-only">Drag</span>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Preview
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Preset
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Colors
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Sprite
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Motion
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Duration (sec)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Transition
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {((selectedSequence as any).scenes || (selectedSequence as any).items || []).map((item: any) => {
                            // Convert scene to item format for backward compatibility
                            const itemForRow: SequenceItem = (item as any).presetId 
                              ? {
                                  id: item.id,
                                  presetId: item.presetId,
                                  duration: item.durationSeconds || (item.durationMode === "manual" ? 0 : item.durationSeconds || 0),
                                  transition: item.fadeTypeOverride === "cut" ? "instant" : item.fadeTypeOverride === "crossfade" ? "fade" : "instant",
                                  order: item.order,
                                }
                              : item;
                            const preset = presets.find((p) => p.id === itemForRow.presetId);
                            return (
                              <SortableTableRow
                                key={itemForRow.id}
                                item={itemForRow}
                                preset={preset}
                                presets={presets}
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
                  disabled={presets.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Preset
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 p-6">
            <p>Select a sequence to edit or create a new one</p>
          </div>
        )}

      {/* Sequence Player */}
      {selectedSequence && onLoadPreset && (
        <div className="p-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <SequencePlayer
            sequence={selectedSequence}
            currentState={currentState || null}
            onLoadPreset={(state) => {
              onLoadPreset(state);
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

