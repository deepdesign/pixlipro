import { useState, useEffect, useRef } from "react";
import { Dialog, DialogTitle, DialogBody, DialogActions } from "@/components/ui/dialog";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label, Field } from "@/components/ui/Fieldset";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCollectionModalProps) {
  const [collectionName, setCollectionName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setCollectionName("");
      // Focus input after a short delay to ensure dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = collectionName.trim();
    if (trimmedName) {
      onCreate(trimmedName);
      onClose();
    }
  };

  const handleCancel = () => {
    setCollectionName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleCancel} size="sm">
      <DialogTitle>Create Collection</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogBody>
          <Field>
            <Label htmlFor="collection-name">Collection Name</Label>
            <Input
              ref={inputRef}
              id="collection-name"
              type="text"
              value={collectionName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              autoFocus
            />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!collectionName.trim()}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

