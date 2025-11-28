import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/catalyst/input";
import {
  deleteSequence,
  saveSequence,
  createSequence,
  type Sequence,
} from "@/lib/storage/sequenceStorage";
import { Edit2, Copy, Download, Trash2, MoreVertical } from "lucide-react";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "@/components/catalyst/dropdown";

interface SequenceListTableProps {
  sequences: Sequence[];
  onSequenceSelect: (sequence: Sequence) => void;
  onSequenceUpdate: () => void;
}

interface SequenceListRowProps {
  sequence: Sequence;
  onSelect: (sequence: Sequence) => void;
  onUpdate: () => void;
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

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return "Just now";
}

function SequenceListRow({ sequence, onSelect, onUpdate }: SequenceListRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sequence.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleNameClick = () => {
    setIsEditing(true);
    setEditName(sequence.name);
  };

  const handleNameSubmit = useCallback(() => {
    if (editName.trim() && editName !== sequence.name) {
      const updated = { ...sequence, name: editName.trim() };
      saveSequence(updated);
      onUpdate();
    }
    setIsEditing(false);
  }, [editName, sequence, onUpdate]);

  const handleNameCancel = () => {
    setEditName(sequence.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const handleDuplicate = () => {
    const duplicated: Sequence = {
      ...sequence,
      id: `sequence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `${sequence.name} (Copy)`,
      scenes: sequence.scenes.map((scene) => ({
        ...scene,
        id: `scene-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sequenceId: "", // Will be set after save
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Set sequenceId on all scenes
    duplicated.scenes.forEach((scene) => {
      scene.sequenceId = duplicated.id;
    });
    saveSequence(duplicated);
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

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteSequence(sequence.id);
      onUpdate();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <tr className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {/* Name */}
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="w-full"
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="text-left text-slate-900 dark:text-slate-50 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {sequence.name}
          </button>
        )}
      </td>

      {/* Scenes Count */}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
        {sequence.scenes.length}
      </td>

      {/* Duration */}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
        {formatDuration(sequence)}
      </td>

      {/* Background Colour */}
      <td className="px-4 py-3">
        <div
          className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600"
          style={{ backgroundColor: sequence.backgroundColour }}
          title={sequence.backgroundColour}
        />
      </td>

      {/* Last Updated */}
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        {formatRelativeTime(sequence.updatedAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="naked"
            size="icon"
            onClick={() => onSelect(sequence)}
            title="Edit sequence"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Dropdown>
            <DropdownButton as={Button} variant="naked" size="icon">
              <MoreVertical className="h-4 w-4" />
            </DropdownButton>
            <DropdownMenu>
              <DropdownItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4" data-slot="icon" />
                Duplicate
              </DropdownItem>
              <DropdownItem onClick={handleExport}>
                <Download className="h-4 w-4" data-slot="icon" />
                Export JSON
              </DropdownItem>
              <DropdownItem onClick={handleDelete}>
                <Trash2 className="h-4 w-4" data-slot="icon" />
                {showDeleteConfirm ? "Confirm Delete" : "Delete"}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
}

export function SequenceListTable({
  sequences,
  onSequenceSelect,
  onSequenceUpdate,
}: SequenceListTableProps) {
  if (sequences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-center">
          No sequences yet. Create your first sequence to get started.
        </p>
        <Button onClick={() => {
          const newSeq = createSequence("New Sequence");
          onSequenceSelect(newSeq);
        }}>
          Create your first sequence
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
              Scenes
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
              Duration
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
              Background
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
              Last Updated
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sequences.map((sequence) => (
            <SequenceListRow
              key={sequence.id}
              sequence={sequence}
              onSelect={onSequenceSelect}
              onUpdate={onSequenceUpdate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

