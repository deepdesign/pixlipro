import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Pencil, Trash2 } from "lucide-react";
import type { CustomSprite } from "@/lib/storage/customSpriteStorage";

interface SpriteCardProps {
  sprite: CustomSprite;
  onRename: (spriteId: string, newName: string) => void;
  onDelete: (spriteId: string) => void;
  onMove: (spriteId: string) => void;
  availableCollections: Array<{ id: string; name: string }>;
  onMoveToCollection: (spriteId: string, collectionId: string) => void;
}

export function SpriteCard({
  sprite,
  onRename,
  onDelete,
  onMove: _onMove,
  availableCollections: _availableCollections,
  onMoveToCollection: _onMoveToCollection,
}: SpriteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sprite.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create blob URL for SVG preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([sprite.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [sprite.svgContent]);


  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== sprite.name) {
      onRename(sprite.id, editName.trim());
    } else {
      setEditName(sprite.name);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(sprite.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${sprite.name}"?`)) {
      onDelete(sprite.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2 hover:shadow-md transition-shadow overflow-visible">
      {/* SVG Preview */}
      <div className="w-full aspect-square bg-slate-100 dark:bg-slate-700 rounded mb-2 flex items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={sprite.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-slate-400 text-xs">Loading...</div>
        )}
        
        {/* Action buttons overlay - shown on hover */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="background"
            size="icon"
            onClick={handleEdit}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 shadow-md"
            title="Rename sprite"
            aria-label="Rename sprite"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="background"
            size="icon"
            onClick={handleDelete}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/20 shadow-md text-red-600 dark:text-red-400"
            title="Delete sprite"
            aria-label="Delete sprite"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sprite Name */}
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
          }}
          className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleEdit}
            className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 truncate"
            title="Click to rename"
          >
            {sprite.name}
          </button>
        </div>
      )}
    </div>
  );
}

