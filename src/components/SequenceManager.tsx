import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { GripVertical, Trash2, Plus, Copy, Download, Upload, Search, Edit, Check, X } from "lucide-react";
import type { GeneratorState } from "@/types/generator";
import { SceneThumbnail } from "./SequenceManager/SceneThumbnail";

interface SequenceNameEditorProps {
  sequence: Sequence;
  onUpdate: (sequence: Sequence) => void;
}

function SequenceNameEditor({ sequence, onUpdate }: SequenceNameEditorProps) {
  const [editName, setEditName] = useState(sequence.name);

  // Update edit name when sequence changes
  useEffect(() => {
    setEditName(sequence.name);
  }, [sequence.id, sequence.name]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(e.target.value);
  }, []);

  const handleNameBlur = useCallback(() => {
    if (editName.trim() && editName !== sequence.name) {
      onUpdate({
        ...sequence,
        name: editName.trim(),
        updatedAt: Date.now(),
      });
    } else if (!editName.trim()) {
      // Reset to original if empty
      setEditName(sequence.name);
    }
  }, [editName, sequence, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditName(sequence.name);
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      type="text"
      value={editName}
      onChange={handleNameChange}
      onBlur={handleNameBlur}
      onKeyDown={handleKeyDown}
      className="text-base font-semibold text-theme-primary inline-block max-w-md"
      style={{ caretColor: 'var(--text-primary)' }}
    />
  );
}

interface SequenceManagerProps {
  onLoadScene?: (state: GeneratorState) => void;
  onLoadPreset?: (state: GeneratorState) => void; // Backward compatibility
  currentState?: GeneratorState | null;
  onClose?: () => void;
  onNavigateToPerform?: (sequenceId: string) => void;
  onNavigateToCanvas?: () => void;
}

interface SortableItemProps {
  item: SequenceItem;
  scene: Scene | null;
  scenes: Scene[];
  onUpdate: (item: SequenceItem) => void;
  onDelete: (itemId: string) => void;
  onEditScene?: (scene: Scene) => void;
}

function SortableTableRow({ item, scene, scenes, onUpdate, onDelete, onEditScene }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  
  // Track current values to prevent unnecessary updates
  const currentSceneIdRef = useRef(item.sceneId);
  const currentFadeDurationRef = useRef(item.fadeDuration ?? 0);
  const onUpdateRef = useRef(onUpdate);
  
  // Local state for manual checkbox to ensure immediate UI update
  const isManual = (item as any).durationMode === "manual";
  const [manualChecked, setManualChecked] = useState(isManual);
  
  // Local state for input values to allow typing
  const currentDuration = (item as any).durationSeconds ?? item.duration ?? 0;
  const [localMinutes, setLocalMinutes] = useState(Math.floor(currentDuration / 60).toString());
  const [localSeconds, setLocalSeconds] = useState((currentDuration % 60).toString());
  const [localTransitionTime, setLocalTransitionTime] = useState(
    ((item as any).transitionTimeSeconds ?? 1.5).toString()
  );
  
  // Update local state when item changes (but not during typing)
  useEffect(() => {
    const newIsManual = (item as any).durationMode === "manual";
    setManualChecked(newIsManual);
    
    // Only sync if input is not focused
    const isInputFocused = document.activeElement?.matches('input[type="number"]');
    if (!isInputFocused) {
      const newDuration = (item as any).durationSeconds ?? item.duration ?? 0;
      const newMinutes = Math.floor(newDuration / 60);
      const newSeconds = newDuration % 60;
      setLocalMinutes(newMinutes.toString());
      setLocalSeconds(newSeconds.toString());
      
      const newTransitionTime = (item as any).transitionTimeSeconds ?? 1.5;
      setLocalTransitionTime(newTransitionTime.toString());
    }
  }, [(item as any).durationMode, (item as any).durationSeconds, item.duration, (item as any).transitionTimeSeconds]);
  
  // Update refs when props change
  useEffect(() => {
    currentFadeDurationRef.current = item.fadeDuration ?? 0;
    currentSceneIdRef.current = item.sceneId;
  }, [item.fadeDuration, item.sceneId]);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Stable callback for scene change
  const handleSceneChange = useCallback((newValue: string) => {
    // Only update if value actually changed
    const currentSceneId = item.sceneId || item.presetId || "";
    if (newValue === currentSceneId) {
      return;
    }
    
    // Update ref immediately to prevent duplicate calls
    currentSceneIdRef.current = newValue;
    
    // Call onUpdate with the new scene ID - ensure we clear presetId if it exists
    // Explicitly set sceneId to ensure the change is detected
    const updatedItem = { 
      ...item, 
      sceneId: newValue, // Always set sceneId explicitly
      presetId: undefined, // Clear presetId when setting sceneId
    } as any;
    
    // Force the update
    onUpdateRef.current(updatedItem);
  }, [item, onUpdate]); // Include item and onUpdate in deps


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get scene state for thumbnail
  const sceneState = scene ? loadSceneState(scene) : null;
  
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
          className="cursor-grab active:cursor-grabbing text-theme-subtle hover:text-theme-muted transition-colors p-1 -m-1"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-6 w-6" />
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
            key={`scene-${item.id}-${item.sceneId || item.presetId || 'none'}`}
            value={item.sceneId || item.presetId || ""}
            onValueChange={handleSceneChange}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select a scene" />
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


      {/* Duration */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
            <Input
              type="number"
              value={localMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value.replace(/\D/g, '').slice(0, 3);
                setLocalMinutes(inputValue);
                const minutes = inputValue === '' ? 0 : parseInt(inputValue, 10);
                if (!isNaN(minutes) && minutes >= 0) {
                  const currentDuration = (item as any).durationSeconds ?? item.duration ?? 0;
                  const seconds = currentDuration % 60;
                const newDuration = minutes * 60 + seconds;
                  onUpdate({ 
                    ...item, 
                    duration: newDuration,
                    durationSeconds: newDuration,
                    durationMode: "seconds",
                  } as any);
                }
              }}
              min={0}
              className="text-center w-12"
              placeholder="0"
              maxLength={3}
              disabled={manualChecked}
            />
            <span className="text-xs text-theme-muted">m</span>
            <Input
              type="number"
              value={localSeconds}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value.replace(/\D/g, '').slice(0, 2);
                setLocalSeconds(inputValue);
                const seconds = inputValue === '' ? 0 : parseInt(inputValue, 10);
                if (!isNaN(seconds) && seconds >= 0) {
                  const currentDuration = (item as any).durationSeconds ?? item.duration ?? 0;
                  const minutes = Math.floor(currentDuration / 60);
                const newDuration = minutes * 60 + Math.max(0, Math.min(59, seconds));
                  onUpdate({ 
                    ...item, 
                    duration: newDuration,
                    durationSeconds: newDuration,
                    durationMode: "seconds",
                  } as any);
                }
              }}
              min={0}
              max={59}
              className="text-center w-10"
              placeholder="0"
              maxLength={2}
              disabled={manualChecked}
            />
            <span className="text-xs text-theme-muted">s</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={manualChecked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.stopPropagation();
                const isManual = e.target.checked;
                setManualChecked(isManual); // Update local state immediately
                const currentDuration = (item as any).durationSeconds ?? item.duration ?? 0;
                onUpdate({ 
                  ...item, 
                  durationMode: isManual ? "manual" : "seconds",
                  duration: isManual ? 0 : (currentDuration > 0 ? currentDuration : 30),
                  durationSeconds: isManual ? 0 : (currentDuration > 0 ? currentDuration : 30),
                } as any);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="rounded border-theme-card cursor-pointer w-4 h-4"
            />
            <span className="text-xs text-theme-muted whitespace-nowrap">Manual</span>
          </label>
        </div>
      </td>

      {/* Transition */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Transition Type Dropdown */}
          <Select
            value={(item as any).transitionType || "fade"}
            onValueChange={(value) => {
              const transitionType = value as "fade" | "pixellate";
              onUpdate({ 
                ...item, 
                transitionType,
                // For backward compatibility, also update fadeTypeOverride
                fadeTypeOverride: transitionType === "fade" ? "crossfade" : undefined,
              } as any);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue>
                {(item as any).transitionType === "pixellate" ? "Pixelate" : "Fade"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">Fade</SelectItem>
              <SelectItem value="pixellate">Pixelate</SelectItem>
            </SelectContent>
          </Select>
          {/* Transition Time Input */}
          <div className="flex items-center gap-1.5">
          <Input
            type="number"
              value={localTransitionTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value;
                setLocalTransitionTime(inputValue);
                // Allow empty string while typing
                if (inputValue === '' || inputValue === '.') {
                  onUpdate({ 
                    ...item, 
                    transitionTimeSeconds: undefined,
                    fadeDuration: undefined,
                  } as any);
                  return;
                }
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value >= 0) {
                  onUpdate({ 
                    ...item, 
                    transitionTimeSeconds: value > 0 ? value : undefined,
                    // For backward compatibility, also update fadeDuration
                    fadeDuration: value > 0 ? value : undefined,
                  } as any);
                }
            }}
            min={0}
            step={0.1}
              className="text-center w-16"
              placeholder="1.5"
          />
            <span className="text-xs text-theme-muted whitespace-nowrap">s</span>
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {scene && onEditScene && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onEditScene(scene)}
              title="Edit scene"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onDelete(item.id)}
            title="Delete item"
            className="btn-error"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function SequenceManager({ onLoadScene, onLoadPreset, onClose: _onClose, onNavigateToPerform: _onNavigateToPerform, onNavigateToCanvas }: SequenceManagerProps) {
  const handleLoadScene = onLoadScene || onLoadPreset; // Use onLoadScene if provided, fallback to onLoadPreset for backward compatibility
  
  // Handler to edit a scene - loads scene and navigates to canvas
  const handleEditScene = useCallback((scene: Scene) => {
    const sceneState = loadSceneState(scene);
    if (sceneState && handleLoadScene) {
      handleLoadScene(sceneState);
      // Navigate to canvas if navigation function is provided
      if (onNavigateToCanvas) {
        onNavigateToCanvas();
      }
    }
  }, [handleLoadScene, onNavigateToCanvas]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  // Check for sequence ID in sessionStorage for pre-selection
  const getInitialSequenceId = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("editSequenceId");
    }
    return null;
  };

  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const selectedSequenceRef = useRef<Sequence | null>(null);
  const originalSequenceRef = useRef<Sequence | null>(null);

  // Pre-select sequence from sessionStorage
  useEffect(() => {
    const initialSequenceId = getInitialSequenceId();
    if (initialSequenceId && sequences.length > 0 && !selectedSequence) {
      const sequence = sequences.find((s) => s.id === initialSequenceId);
      if (sequence) {
        setSelectedSequence(sequence);
        // Store original for comparison
        originalSequenceRef.current = JSON.parse(JSON.stringify(sequence));
        // Clear sessionStorage after loading
        sessionStorage.removeItem("editSequenceId");
      }
    }
  }, [sequences, selectedSequence]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [newSequenceName, setNewSequenceName] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");

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
    // Store original for comparison
    originalSequenceRef.current = JSON.parse(JSON.stringify(sequence));
    setNewSequenceName("");
    loadData();
  };

  const handleSelectSequence = (sequence: Sequence) => {
    setSelectedSequence(sequence);
    // Store a deep copy of the original sequence for comparison
    // Only update if this is a different sequence
    if (originalSequenceRef.current?.id !== sequence.id) {
      originalSequenceRef.current = JSON.parse(JSON.stringify(sequence));
    }
  };

  const handleUpdateSequence = useCallback((updatedSequence: Sequence) => {
    // Only update if sequence actually changed
    const currentSequence = selectedSequenceRef.current;
    if (!currentSequence || currentSequence.id !== updatedSequence.id) {
      // Different sequence or no current sequence, proceed with update
      saveSequence(updatedSequence);
      setSelectedSequence(updatedSequence);
      setSequences((prev) =>
        prev.map((s) => (s.id === updatedSequence.id ? updatedSequence : s))
      );
      return;
    }
    
    // Always proceed with update - the individual field checks in handleUpdateItem prevent unnecessary saves
    // This ensures the UI updates even if the deep comparison thinks nothing changed
    // The comparison in handleUpdateItem is sufficient to prevent unnecessary saves
    
    // Update the ref immediately to prevent duplicate calls
    selectedSequenceRef.current = updatedSequence;
    
    saveSequence(updatedSequence);
    setSelectedSequence(updatedSequence);
    // Update sequences list without full reload to prevent re-render loops
    setSequences((prev) =>
      prev.map((s) => (s.id === updatedSequence.id ? updatedSequence : s))
    );
  }, []);

  // Check if sequence has been modified
  const hasChanges = useMemo(() => {
    if (!selectedSequence || !originalSequenceRef.current) {
      return false;
    }
    
    // Compare current sequence with original
    const current = selectedSequence;
    const original = originalSequenceRef.current;
    
    // Compare basic properties
    if (current.name !== original.name ||
        current.backgroundColour !== original.backgroundColour ||
        current.defaultFadeType !== original.defaultFadeType) {
      return true;
    }
    
    // Compare scenes/items
    const currentScenes = (current as any).scenes || [];
    const originalScenes = (original as any).scenes || [];
    const currentItems = (current as any).items || [];
    const originalItems = (original as any).items || [];
    
    if (JSON.stringify(currentScenes) !== JSON.stringify(originalScenes) ||
        JSON.stringify(currentItems) !== JSON.stringify(originalItems)) {
      return true;
    }
    
    return false;
  }, [selectedSequence]);

  // Handle cancel/close - discard changes and close editor
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      const confirmed = confirm(
        "You have unsaved changes. Are you sure you want to discard them and close the editor?"
      );
      if (!confirmed) {
        return;
      }
    }
    
    // Reset to original sequence if it exists
    if (originalSequenceRef.current) {
      setSelectedSequence(JSON.parse(JSON.stringify(originalSequenceRef.current)));
    } else {
      // No original, just close
      setSelectedSequence(null);
    }
  }, [hasChanges]);

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
        transition: "fade",
        fadeDuration: 5, // Default fade duration
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
        
        // Get transitionType and transitionTimeSeconds from updatedItem (may be undefined for old items)
        const transitionType = (updatedItem as any).transitionType;
        const transitionTimeSeconds = (updatedItem as any).transitionTimeSeconds;
        
        // Get durationMode from updatedItem if provided - prioritize explicit durationMode
        const durationMode = (updatedItem as any).durationMode !== undefined 
          ? (updatedItem as any).durationMode 
          : (updatedItem.duration === 0 ? "manual" : "seconds");
        const durationSeconds = (updatedItem as any).durationSeconds !== undefined 
          ? (updatedItem as any).durationSeconds 
          : updatedItem.duration;
        
        // Check if anything actually changed to prevent unnecessary updates
        const existingScene = sequenceScenes.find((scene: any) => scene.id === updatedItem.id);
        if (existingScene) {
          // Check if sceneId was explicitly provided in updatedItem (from dropdown change)
          // This is the key check - if sceneId is provided and different, we must update
          // Compare against both sceneId and presetId - use empty string for undefined
          const existingSceneIdOrPreset = (existingScene.sceneId || existingScene.presetId || "").trim();
          const newSceneId = (updatedItem.sceneId || "").trim();
          const sceneIdExplicitlyChanged = updatedItem.sceneId !== undefined && 
            newSceneId !== existingSceneIdOrPreset;
          
          const durationChanged = existingScene.durationSeconds !== durationSeconds;
          // Handle undefined durationMode - if existing is undefined, infer from duration
          const existingDurationMode = existingScene.durationMode ?? (existingScene.durationSeconds === 0 ? "manual" : "seconds");
          const durationModeChanged = existingDurationMode !== durationMode;
          const fadeTypeChanged = existingScene.fadeTypeOverride !== fadeTypeOverride;
          const fadeDurationChanged = existingScene.fadeDurationSeconds !== updatedItem.fadeDuration;
          const transitionTypeChanged = existingScene.transitionType !== transitionType;
          // Compare transitionTimeSeconds with proper handling of undefined/null
          const existingTransitionTime = existingScene.transitionTimeSeconds ?? existingScene.fadeDurationSeconds;
          const newTransitionTime = transitionTimeSeconds ?? updatedItem.fadeDuration;
          const transitionTimeChanged = existingTransitionTime !== newTransitionTime;
          
          // Always allow sceneId changes - this is critical
          if (sceneIdExplicitlyChanged) {
            // Force the update to proceed - sceneId change is important
            // Don't check other conditions, just update
          } else if ((updatedItem as any).durationMode !== undefined && durationModeChanged) {
            // Force the update to proceed - durationMode change is important
          } else if (!durationChanged && !durationModeChanged && !fadeTypeChanged && !fadeDurationChanged && !transitionTypeChanged && !transitionTimeChanged) {
            // No changes, skip update completely - DO NOT call handleUpdateSequence
            return;
          }
        } else {
          // Scene not found - this shouldn't happen, but allow update to proceed
        }
        
        // Only create updated sequence if something actually changed
        const updatedScenes = sequenceScenes.map((scene: any) =>
          scene.id === updatedItem.id 
            ? { 
                ...scene, 
                // Use new sceneId if provided in updatedItem, otherwise keep existing sceneId
                sceneId: updatedItem.sceneId !== undefined 
                  ? updatedItem.sceneId 
                  : scene.sceneId,
                // Clear presetId if sceneId is being set, otherwise keep existing presetId
                presetId: updatedItem.sceneId !== undefined
                  ? undefined 
                  : (updatedItem.presetId !== undefined ? updatedItem.presetId : scene.presetId),
                durationSeconds: durationSeconds, 
                durationMode: durationMode, // Always set durationMode explicitly
                fadeTypeOverride: fadeTypeOverride,
                fadeDurationSeconds: updatedItem.fadeDuration,
                // Add new transition fields if provided
                ...(transitionType !== undefined && { transitionType }),
                ...(transitionTimeSeconds !== undefined && { transitionTimeSeconds }),
              }
            : scene
        );
        
        // Triple-check: compare the updated scenes with current scenes using deep equality
        // But skip this check if sceneId changed, as that's a critical update
        const existingSceneIdOrPresetForCheck = existingScene ? ((existingScene.sceneId || existingScene.presetId || "").trim()) : "";
        const newSceneIdForCheck = (updatedItem.sceneId || "").trim();
        const sceneIdWasChanged = existingScene && 
          (updatedItem.sceneId !== undefined && 
           newSceneIdForCheck !== existingSceneIdOrPresetForCheck);
        
        // Always proceed if sceneId changed - don't do JSON comparison
        if (sceneIdWasChanged) {
          // Force update - sceneId change is critical
        } else {
        const scenesEqual = JSON.stringify(sequenceScenes) === JSON.stringify(updatedScenes);
        if (scenesEqual) {
          // No actual changes after mapping, skip update - DO NOT call handleUpdateSequence
          return;
          }
        }
        
        // Update the ref BEFORE calling handleUpdateSequence to prevent loops
        const updated = {
          ...currentSequence,
          scenes: updatedScenes,
          updatedAt: Date.now(), // Force update timestamp to ensure React sees it as new
        };
        selectedSequenceRef.current = updated;
        handleUpdateSequence(updated);
      } else {
        // Check if anything actually changed to prevent unnecessary updates
        const existingItem = items.find((item: SequenceItem) => item.id === updatedItem.id);
        if (existingItem) {
          const sceneIdChanged = existingItem.sceneId !== updatedItem.sceneId;
          const durationChanged = existingItem.duration !== updatedItem.duration;
          const transitionChanged = existingItem.transition !== updatedItem.transition;
          const fadeDurationChanged = existingItem.fadeDuration !== updatedItem.fadeDuration;
          
          if (!sceneIdChanged && !durationChanged && !transitionChanged && !fadeDurationChanged) {
            // No changes, skip update completely - DO NOT call handleUpdateSequence
            return;
          }
        }
        
        // Only create updated sequence if something actually changed
        const updatedItems = items.map((item: SequenceItem) =>
          item.id === updatedItem.id ? updatedItem : item
        );
        
        // Triple-check: compare the updated items with current items using deep equality
        const itemsEqual = JSON.stringify(items) === JSON.stringify(updatedItems);
        if (itemsEqual) {
          // No actual changes after mapping, skip update - DO NOT call handleUpdateSequence
          return;
        }
        
        // Update the ref BEFORE calling handleUpdateSequence to prevent loops
        const updated = {
          ...currentSequence,
          items: updatedItems,
        };
        selectedSequenceRef.current = updated;
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
              variant="secondary"
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
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="icon"
                        onClick={() => handleSelectSequence(sequence)}
                        title={isSelected ? "Editing" : "Edit sequence"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDuplicateSequence(sequence)}
                        title="Duplicate sequence"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportSequence(sequence)}
                        title="Export sequence"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteSequence(sequence.id)}
                        title="Delete sequence"
                        className="btn-error"
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
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <SequenceNameEditor
                  sequence={selectedSequence}
                  onUpdate={handleUpdateSequence}
                />
                <p className="text-sm text-theme-muted mt-3">
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
                  size="icon"
                  onClick={() => handleDeleteSequence(selectedSequence.id)}
                  title="Delete sequence"
                  className="btn-error"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="link"
                  size="icon"
                  onClick={handleCancel}
                  title={hasChanges ? "Discard changes and close" : "Close editor"}
                  className="text-theme-subtle hover:text-theme-primary"
                >
                  <X className="h-4 w-4" />
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
                                  sceneId: item.sceneId || item.presetId || "",
                                  presetId: item.presetId, // Keep for backward compatibility
                                  duration: item.durationSeconds ?? (item.durationMode === "manual" ? 0 : item.durationSeconds ?? 0),
                                  transition: item.fadeTypeOverride === "cut" ? "instant" : item.fadeTypeOverride === "crossfade" ? "fade" : "instant",
                                  fadeDuration: item.fadeDurationSeconds || item.transitionTimeSeconds,
                                  order: item.order,
                                  // Include new transition fields and durationMode
                                  transitionType: item.transitionType,
                                  transitionTimeSeconds: item.transitionTimeSeconds,
                                  durationMode: item.durationMode ?? (item.durationSeconds === 0 ? "manual" : "seconds"),
                                  durationSeconds: item.durationSeconds,
                                } as any
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
                                onEditScene={handleEditScene}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleAddItem}
                    disabled={scenes.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add scene
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Save the current sequence (it's already saved on each change, but this confirms it)
                      if (selectedSequence) {
                        saveSequence(selectedSequence);
                        // Update original ref to match current state
                        originalSequenceRef.current = JSON.parse(JSON.stringify(selectedSequence));
                        // Close the editor by deselecting the sequence
                        setSelectedSequence(null);
                      }
                    }}
                    disabled={!hasChanges}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </>
            )}
            {sequenceItems.length === 0 && (
              <div className="flex justify-end pt-4 border-t border-theme-card">
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Save the current sequence (it's already saved on each change, but this confirms it)
                    if (selectedSequence) {
                      saveSequence(selectedSequence);
                      // Update original ref to match current state
                      originalSequenceRef.current = JSON.parse(JSON.stringify(selectedSequence));
                      // Close the editor by deselecting the sequence
                      setSelectedSequence(null);
                    }
                  }}
                  disabled={!hasChanges}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
