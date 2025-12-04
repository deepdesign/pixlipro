import { useState, useEffect, useCallback, useRef } from "react";
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
import { Input } from "@/components/ui/Input";
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
import { RowPlayer } from "@/components/SequenceManager/RowPlayer";
import { GripVertical, Trash2, Plus, Copy, Download, Upload, Search } from "lucide-react";
import { SPRITE_MODES } from "@/constants/sprites";
import { formatMovementMode } from "@/constants/movement";
import { findSpriteByIdentifier } from "@/constants/spriteCollections";
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

  // Get scene state for thumbnail
  const sceneState = scene ? loadSceneState(scene) : null;
  
  // Get sprite labels - list all selected sprites
  const getSpriteLabels = (): string => {
    if (!scene || !sceneState) return "—";
    
    // Use selectedSprites if available, otherwise fallback to spriteMode
    const spriteIdentifiers = sceneState.selectedSprites && sceneState.selectedSprites.length > 0
      ? sceneState.selectedSprites
      : sceneState.spriteMode
      ? [sceneState.spriteMode]
      : [];
    
    if (spriteIdentifiers.length === 0) return "—";
    
    const spriteNames = spriteIdentifiers
      .map((identifier) => {
        // Try to find sprite by identifier
        const spriteInfo = findSpriteByIdentifier(identifier);
        if (spriteInfo) {
          return spriteInfo.sprite.name;
        }
        // Fallback to SPRITE_MODES for shape-based sprites
        const spriteMode = SPRITE_MODES.find((m) => m.value === identifier);
        if (spriteMode) {
          return spriteMode.label;
        }
        // Last resort: use identifier itself (cleaned up)
        return identifier.split('/').pop()?.replace('.svg', '') || identifier;
      })
      .filter(Boolean);
    
    return spriteNames.length > 0 ? spriteNames.join(", ") : "—";
  };
  
  const spriteLabel = getSpriteLabels();

  // Get motion label
  const motionLabel = scene ? formatMovementMode(scene.state.movementMode) : "—";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-theme-card ${
        isDragging ? "bg-theme-icon" : "bg-theme-panel"
      } hover:bg-theme-icon transition-colors`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-theme-subtle hover:text-theme-muted transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Thumbnail */}
      <td className="px-4 py-3">
        {sceneState ? (
          <SceneThumbnail state={sceneState} size={60} />
        ) : (
          <div className="w-[60px] h-[60px] bg-theme-panel rounded border border-theme-card flex items-center justify-center">
            <span className="text-xs text-theme-subtle">No preview</span>
          </div>
        )}
      </td>

      {/* Scene Name */}
      <td className="px-4 py-3">
        <Select
          value={item.sceneId}
          onValueChange={(value) => {
            if (value !== item.sceneId) {
              onUpdate({ ...item, sceneId: value });
            }
          }}
        >
          <SelectTrigger className="w-full max-w-xs">
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
          <p className="text-xs text-status-error mt-1">
            Scene not found
          </p>
        )}
      </td>

      {/* Sprite */}
      <td className="px-4 py-3">
        <span className="field-label leading-none">{spriteLabel}</span>
      </td>

      {/* Motion */}
      <td className="px-4 py-3 min-w-[120px]">
        <span className="field-label leading-none">{motionLabel}</span>
      </td>

      {/* Duration */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={item.duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newDuration = parseInt(e.target.value) || 0;
              if (newDuration !== item.duration) {
                onUpdate({ ...item, duration: newDuration });
              }
            }}
            min={0}
            max={300}
            className="w-20"
          />
          <span className="text-xs text-theme-muted whitespace-nowrap">
            {item.duration === 0 ? "Manual" : `${item.duration}s`}
          </span>
        </div>
      </td>

      {/* Transition */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Select
            value={item.transition}
            onValueChange={(value) => {
              const newTransition = value as SequenceItem["transition"];
              // Set default fade duration if switching to fade and no duration exists
              const fadeDuration = newTransition === "fade" && !item.fadeDuration 
                ? 1.5 
                : item.fadeDuration;
              onUpdate({ ...item, transition: newTransition, fadeDuration });
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
            </SelectContent>
          </Select>
          {item.transition === "fade" && (
            <>
              <Input
                type="number"
                value={item.fadeDuration ?? 1.5}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newDuration = parseFloat(e.target.value) || 0.5;
                  onUpdate({ ...item, fadeDuration: Math.max(0.1, Math.min(10, newDuration)) });
                }}
                min={0.1}
                max={10}
                step={0.1}
                className="w-20"
              />
              <span className="text-xs text-theme-muted whitespace-nowrap">s</span>
            </>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <Button
          type="button"
          variant="naked"
          size="icon"
          onClick={() => onDelete(item.id)}
          title="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export function SequenceManager({ onLoadScene, onLoadPreset, onClose: _onClose }: SequenceManagerProps) {
  const handleLoadScene = onLoadScene || onLoadPreset; // Use onLoadScene if provided, fallback to onLoadPreset for backward compatibility
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const selectedSequenceRef = useRef<Sequence | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [newSequenceName, setNewSequenceName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setPlayingSequences] = useState<Map<string, { state: "stopped" | "playing" | "paused"; currentIndex: number }>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    selectedSequenceRef.current = selectedSequence;
  }, [selectedSequence]);

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

  const filteredSequences = sequences.filter((sequence) =>
    sequence.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      const currentSequence = selectedSequenceRef.current;
      if (!currentSequence) return;
      
      // Support both formats
      const items = (currentSequence as any).items || [];
      const sequenceScenes = (currentSequence as any).scenes || [];
      const isNewFormat = sequenceScenes.length > 0 || (items.length === 0 && !(currentSequence as any).items);
      
      if (isNewFormat) {
        // For new format, try to find matching scene and update it
        // Map transition to fadeTypeOverride: "instant" -> "cut", "fade" -> "crossfade"
        const fadeTypeOverride = updatedItem.transition === "instant" 
          ? "cut" 
          : updatedItem.transition === "fade"
          ? "crossfade"
          : "cut";
        
        // Check if anything actually changed to prevent unnecessary updates
        const existingScene = sequenceScenes.find((scene: any) => scene.id === updatedItem.id);
        if (existingScene) {
          const sceneIdChanged = existingScene.sceneId !== (updatedItem.sceneId || updatedItem.presetId);
          const durationChanged = existingScene.durationSeconds !== updatedItem.duration;
          const fadeTypeChanged = existingScene.fadeTypeOverride !== fadeTypeOverride;
          
          if (!sceneIdChanged && !durationChanged && !fadeTypeChanged) {
            // No changes, skip update
            return;
          }
        }
        
        const updated = {
          ...currentSequence,
          scenes: sequenceScenes.map((scene: any) =>
            scene.id === updatedItem.id 
              ? { 
                  ...scene, 
                  sceneId: updatedItem.sceneId || updatedItem.presetId, 
                  presetId: updatedItem.presetId, 
                  durationSeconds: updatedItem.duration, 
                  durationMode: updatedItem.duration === 0 ? "manual" : "seconds",
                  fadeTypeOverride: fadeTypeOverride
                }
              : scene
          ),
        };
        handleUpdateSequence(updated);
      } else {
        // Check if anything actually changed to prevent unnecessary updates
        const existingItem = items.find((item: SequenceItem) => item.id === updatedItem.id);
        if (existingItem && JSON.stringify(existingItem) === JSON.stringify(updatedItem)) {
          // No changes, skip update
          return;
        }
        
        const updated = {
          ...currentSequence,
          items: items.map((item: SequenceItem) =>
            item.id === updatedItem.id ? updatedItem : item
          ),
        };
        handleUpdateSequence(updated);
      }
    },
    [handleUpdateSequence]
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

  const handleDuplicateSequence = (sequence?: Sequence) => {
    const targetSequence = sequence || selectedSequence;
    if (!targetSequence) return;
    const duplicated: Sequence = {
      ...targetSequence,
      id: generateSequenceId(),
      name: `${targetSequence.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSequence(duplicated);
    setSelectedSequence(duplicated);
    loadData();
  };

  const handleExportSequence = (sequence?: Sequence) => {
    const targetSequence = sequence || selectedSequence;
    if (!targetSequence) return;
    const json = JSON.stringify(targetSequence, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetSequence.name.replace(/\s+/g, "-")}.json`;
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

  const sequenceItems = selectedSequence
    ? ((selectedSequence as any).scenes || (selectedSequence as any).items || [])
    : [];

  return (
    <div className="space-y-6">
      {/* Create New Sequence Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <h3 className="text-base font-semibold text-theme-primary">
            Create new sequence
          </h3>
          <p className="text-sm text-theme-muted mt-1">
            Create a new sequence to organize and play scenes in order.
          </p>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            <Input
              type="text"
              value={newSequenceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSequenceName(e.target.value)}
              placeholder="Sequence name"
              className="flex-1"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleCreateSequence();
                }
              }}
            />
            <Button
              onClick={handleCreateSequence}
              disabled={!newSequenceName.trim()}
            >
              Create sequence
            </Button>
          </div>
        </div>
      </div>

      {/* Sequences List Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-theme-primary">
                Saved sequences
              </h3>
              <p className="text-sm text-theme-muted mt-1">
                Manage your sequences. Select a sequence to edit or play it.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImportSequence}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-subtle" />
            <Input
              type="text"
              placeholder="Search sequences..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="p-6">
          {filteredSequences.length === 0 ? (
            <div className="text-center py-12 text-theme-subtle">
              {searchQuery ? "No sequences found" : "No sequences saved yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSequences.map((sequence) => {
                const itemCount = (sequence as any).scenes?.length || (sequence as any).items?.length || 0;
                const isSelected = selectedSequence?.id === sequence.id;
                return (
                  <div
                    key={sequence.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                      isSelected
                        ? "border-[var(--accent-primary)] bg-theme-icon"
                        : "border-theme-card hover:bg-theme-icon"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-theme-primary truncate">
                        {sequence.name}
                      </div>
                      <div className="text-xs text-theme-subtle mt-1">
                        {itemCount} {itemCount === 1 ? "item" : "items"} • Created {new Date(sequence.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RowPlayer
                        sequence={sequence}
                        onLoadScene={(state) => {
                          if (handleLoadScene) {
                            handleLoadScene(state);
                          }
                        }}
                        onStateChange={(sequenceId, state, currentIndex) => {
                          setPlayingSequences((prev) => {
                            const next = new Map(prev);
                            next.set(sequenceId, { state, currentIndex });
                            return next;
                          });
                        }}
                      />
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectSequence(sequence)}
                      >
                        {isSelected ? "Editing" : "Edit"}
                      </Button>
                      <Button
                        variant="naked"
                        size="icon"
                        onClick={() => handleDuplicateSequence(sequence)}
                        title="Duplicate sequence"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="naked"
                        size="icon"
                        onClick={() => handleExportSequence(sequence)}
                        title="Export sequence"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="naked"
                        size="icon"
                        onClick={() => handleDeleteSequence(sequence.id)}
                        title="Delete sequence"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sequence Editor Card */}
      {selectedSequence && (
        <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
          <div className="p-6 border-b border-theme-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-theme-primary">
                  {selectedSequence.name}
                </h3>
                <p className="text-sm text-theme-muted mt-1">
                  Edit the sequence items. Drag to reorder, or add new scenes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDuplicateSequence()}
                  title="Duplicate sequence"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleExportSequence()}
                  title="Export sequence"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteSequence(selectedSequence.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            {!validation.valid && (
              <div className="mt-4 p-3 bg-status-warning/10 rounded-lg border border-status-warning">
                <p className="text-sm text-status-warning">
                  <span className="font-medium">Warning:</span> {validation.missingScenes?.length || validation.missingPresets?.length || 0} scene(s) not found
                </p>
              </div>
            )}
          </div>
          <div className="p-6">
            {sequenceItems.length === 0 ? (
              <div className="text-center py-12 text-theme-subtle">
                <p className="mb-4">No items in this sequence</p>
                <Button
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={scenes.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add scene
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sequenceItems.map((item: any) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <table className="w-full">
                        <thead className="bg-theme-icon border-b border-theme-card">
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
                              Sprite(s)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider min-w-[120px]">
                              Motion
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              Transition
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sequenceItems.map((item: any) => {
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
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleAddItem}
                    disabled={scenes.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add scene
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
