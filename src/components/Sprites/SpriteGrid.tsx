import { Button } from "@/components/Button";
import { Plus } from "lucide-react";
import { SpriteCard } from "./SpriteCard";
import type { CustomSprite, CustomSpriteCollection } from "@/lib/storage/customSpriteStorage";
import { getAllCollections } from "@/constants/spriteCollections";

interface SpriteGridProps {
  collection: CustomSpriteCollection | null;
  onAddSprite: () => void;
  onRenameSprite: (spriteId: string, newName: string) => void;
  onDeleteSprite: (spriteId: string) => void;
  onMoveSprite: (spriteId: string, toCollectionId: string) => void;
  availableCollections: Array<{ id: string; name: string }>;
}

export function SpriteGrid({
  collection,
  onAddSprite,
  onRenameSprite,
  onDeleteSprite,
  onMoveSprite,
  availableCollections,
}: SpriteGridProps) {
  if (!collection) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <p>Select a collection to view sprites</p>
      </div>
    );
  }

  if (collection.sprites.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={onAddSprite}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add SVG
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            No sprites in this collection
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Add SVG files to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          size="md"
          variant="outline"
          onClick={onAddSprite}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add SVG
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {collection.sprites.length} sprite{collection.sprites.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sprite-grid-container">
        {collection.sprites.map((sprite) => (
          <SpriteCard
            key={sprite.id}
            sprite={sprite}
            onRename={onRenameSprite}
            onDelete={onDeleteSprite}
            onMove={() => {}}
            availableCollections={availableCollections.filter(c => c.id !== collection.id)}
            onMoveToCollection={onMoveSprite}
          />
        ))}
      </div>
    </div>
  );
}

