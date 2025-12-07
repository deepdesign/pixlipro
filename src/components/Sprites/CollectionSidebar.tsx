import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { CustomSpriteCollection } from "@/lib/storage/customSpriteStorage";

interface CollectionSidebarProps {
  selectedCollectionId: string | null;
  customCollections: CustomSpriteCollection[];
  onSelectCollection: (collectionId: string) => void;
  onCreateCollection: () => void;
  onRenameCollection: (collectionId: string, newName: string) => void;
  onDeleteCollection: (collectionId: string) => void;
}

export function CollectionSidebar({
  selectedCollectionId,
  customCollections,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
}: CollectionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Only show custom collections (file-based collections are managed elsewhere)
  const collections = customCollections.map(c => ({
    id: c.id,
    name: c.name,
    spriteCount: c.sprites.length,
    isCustom: true,
  }));

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (collection: { id: string; name: string; isCustom: boolean }) => {
    setEditingId(collection.id);
    setEditName(collection.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameCollection(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (collection: { id: string; name: string; isCustom: boolean }) => {
    if (confirm(`Delete "${collection.name}" and all its sprites?`)) {
      onDeleteCollection(collection.id);
    }
  };

  return (
    <div className="w-64 h-full flex flex-col bg-theme-panel border-r border-theme-card">
      {/* Header */}
      <div className="p-4 border-b border-theme-card">
        <Button
          type="button"
          size="md"
          variant="outline"
          className="w-full"
          onClick={onCreateCollection}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-1">
          {collections.map((collection) => {
            const isSelected = collection.id === selectedCollectionId;
            const isEditing = editingId === collection.id;

            return (
              <div
                key={collection.id}
                className={`
                  group relative flex items-center gap-2 px-3 py-2 rounded-lg
                  ${isSelected
                    ? 'bg-theme-icon text-theme-primary'
                    : 'text-theme-muted hover:bg-theme-icon'
                  }
                  cursor-pointer transition-colors
                `}
                onClick={() => !isEditing && onSelectCollection(collection.id)}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-2 py-1 text-sm border border-theme-panel rounded bg-theme-select text-theme-primary"
                  />
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">
                      {collection.name}
                    </span>
                    <span className="text-xs text-theme-subtle">
                      {collection.spriteCount}
                    </span>
                  </>
                )}

                {!isEditing && collection.isCustom && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="link"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(collection);
                      }}
                      className="h-6 w-6"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(collection);
                      }}
                      className="h-6 w-6 text-status-error"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

