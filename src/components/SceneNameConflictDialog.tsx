import { useState } from "react";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";

interface SceneNameConflictDialogProps {
  isOpen: boolean;
  existingSceneName: string;
  onUpdate: () => void;
  onSaveNew: (newName: string) => void;
  onCancel: () => void;
}

export function SceneNameConflictDialog({
  isOpen,
  existingSceneName,
  onUpdate,
  onSaveNew,
  onCancel,
}: SceneNameConflictDialogProps) {
  const [newName, setNewName] = useState("");

  const handleSaveNew = () => {
    if (newName.trim()) {
      onSaveNew(newName.trim());
      setNewName("");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <DialogTitle>Scene name already exists</DialogTitle>
      <DialogDescription>
        A scene named "{existingSceneName}" already exists. Would you like to update it or save with a new name?
      </DialogDescription>
      <div className="mt-6 space-y-4">
        <div className="flex gap-2">
          <Button variant="default" onClick={onUpdate}>
            Update existing scene
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="border-t border-theme-card pt-4">
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Save with a new name:
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && newName.trim()) {
                  handleSaveNew();
                }
              }}
              placeholder="Enter new scene name"
              className="flex-1"
              autoFocus
            />
            <Button
              variant="outline"
              onClick={handleSaveNew}
              disabled={!newName.trim()}
            >
              Save as new
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}


