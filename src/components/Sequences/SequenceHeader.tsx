import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { BackgroundColorPicker } from "./BackgroundColorPicker";
import type { Sequence } from "@/lib/storage/sequenceStorage";
import { ArrowLeft, Save, Download } from "lucide-react";

interface SequenceHeaderProps {
  sequence: Sequence;
  onSequenceUpdate: (sequence: Sequence) => void;
  onSave: () => void;
  onExport: () => void;
  onBack: () => void;
  hasUnsavedChanges: boolean;
}

export function SequenceHeader({
  sequence,
  onSequenceUpdate,
  onSave,
  onExport,
  onBack,
  hasUnsavedChanges,
}: SequenceHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(sequence.name);

  const handleNameClick = () => {
    setIsEditingName(true);
    setEditName(sequence.name);
  };

  const handleNameSubmit = useCallback(() => {
    if (editName.trim() && editName !== sequence.name) {
      onSequenceUpdate({
        ...sequence,
        name: editName.trim(),
        updatedAt: Date.now(),
      });
    }
    setIsEditingName(false);
  }, [editName, sequence, onSequenceUpdate]);

  const handleNameCancel = () => {
    setEditName(sequence.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    onSequenceUpdate({
      ...sequence,
      backgroundColour: color,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button variant="naked" size="icon" onClick={onBack} title="Back to sequences">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {isEditingName ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0"
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="text-xl font-semibold text-slate-900 dark:text-slate-50 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-left truncate"
          >
            {sequence.name}
          </button>
        )}

        <BackgroundColorPicker
          color={sequence.backgroundColour}
          onChange={handleBackgroundColorChange}
        />
      </div>

      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Unsaved changes
          </span>
        )}
        <Button variant="outline" onClick={onSave} disabled={!hasUnsavedChanges}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
      </div>
    </div>
  );
}

