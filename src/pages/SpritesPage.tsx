import { useState, useCallback, useEffect } from "react";
import { CollectionSidebar, SpriteGrid, UploadSpriteModal, CreateCollectionModal } from "@/components/Sprites";
import {
  getAllCustomCollections,
  getCustomCollection,
  createCustomCollection,
  saveCustomCollection,
  deleteCustomCollection,
  addSpriteToCollection,
  updateSpriteInCollection,
  deleteSpriteFromCollection,
  moveSpriteBetweenCollections,
  generateSpriteId,
  type CustomSprite,
  type CustomSpriteCollection,
} from "@/lib/storage/customSpriteStorage";
import { getAllCollections, cleanupCollectionBlobUrls } from "@/constants/spriteCollections";

export function SpritesPage() {
  const [customCollections, setCustomCollections] = useState<CustomSpriteCollection[]>(
    getAllCustomCollections()
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"upload" | "paste">("upload");

  // Get all collections (file-based + custom)
  const allCollections = getAllCollections();
  
  // Get custom collection IDs to filter them out
  const customCollectionIds = new Set(customCollections.map(c => c.id));
  
  // Only include custom collections in the dropdown (file-based collections are read-only)
  const availableCollections = customCollections.map(c => ({ 
    id: c.id, 
    name: c.name 
  }));

  // Get selected collection (only custom collections can be edited)
  const selectedCollection = selectedCollectionId
    ? customCollections.find(c => c.id === selectedCollectionId) || null
    : null;
  
  // Check if selected collection is file-based (read-only)
  const isFileBasedCollection = selectedCollectionId
    ? !customCollections.some(c => c.id === selectedCollectionId)
    : false;

  // Auto-select first collection on load
  useEffect(() => {
    if (!selectedCollectionId && availableCollections.length > 0) {
      setSelectedCollectionId(availableCollections[0].id);
    }
  }, [selectedCollectionId, availableCollections]);

  const refreshCollections = useCallback(() => {
    setCustomCollections(getAllCustomCollections());
  }, []);

  const handleCreateCollection = useCallback(() => {
    setShowCreateCollectionModal(true);
  }, []);

  const handleCreateCollectionSubmit = useCallback((name: string) => {
    try {
      const collection = createCustomCollection(name);
      saveCustomCollection(collection);
      refreshCollections();
      setSelectedCollectionId(collection.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create collection");
    }
  }, [refreshCollections]);

  const handleRenameCollection = useCallback((collectionId: string, newName: string) => {
    const collection = getCustomCollection(collectionId);
    if (!collection) return;

    if (!newName.trim()) {
      alert("Collection name cannot be empty");
      return;
    }

    try {
      collection.name = newName.trim();
      saveCustomCollection(collection);
      refreshCollections();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to rename collection");
    }
  }, [refreshCollections]);

  const handleDeleteCollection = useCallback((collectionId: string) => {
    if (deleteCustomCollection(collectionId)) {
      // Clean up blob URLs for this collection
      cleanupCollectionBlobUrls(collectionId);
      refreshCollections();
      if (selectedCollectionId === collectionId) {
        // Select first available collection
        const remaining = getAllCustomCollections();
        const fileCollections = getAllCollections();
        if (remaining.length > 0) {
          setSelectedCollectionId(remaining[0].id);
        } else if (fileCollections.length > 0) {
          setSelectedCollectionId(fileCollections[0].id);
        } else {
          setSelectedCollectionId(null);
        }
      }
    }
  }, [selectedCollectionId, refreshCollections]);

  const handleAddSprite = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleSaveSprite = useCallback((
    sprite: CustomSprite,
    collectionId: string,
    useOptimized: boolean
  ) => {
    try {
      const collection = getCustomCollection(collectionId);
      if (!collection) {
        alert("Collection not found");
        return;
      }

      // Use optimized version if available and requested
      const finalSvg = useOptimized && sprite.optimizedSvgContent
        ? sprite.optimizedSvgContent
        : sprite.svgContent;

      const spriteToAdd: CustomSprite = {
        ...sprite,
        svgContent: finalSvg,
      };

      addSpriteToCollection(collectionId, spriteToAdd);
      refreshCollections();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add sprite");
    }
  }, [refreshCollections]);

  const handleRenameSprite = useCallback((spriteId: string, newName: string) => {
    if (!selectedCollectionId) return;

    const collection = getCustomCollection(selectedCollectionId);
    if (!collection) return;

    if (!newName.trim()) {
      alert("Sprite name cannot be empty");
      return;
    }

    // Check for duplicate names
    const hasDuplicate = collection.sprites.some(
      s => s.id !== spriteId && s.name.toLowerCase() === newName.trim().toLowerCase()
    );
    if (hasDuplicate) {
      alert("A sprite with this name already exists in this collection");
      return;
    }

    try {
      updateSpriteInCollection(selectedCollectionId, spriteId, { name: newName.trim() });
      refreshCollections();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to rename sprite");
    }
  }, [selectedCollectionId, refreshCollections]);

  const handleDeleteSprite = useCallback((spriteId: string) => {
    if (!selectedCollectionId) return;

    try {
      deleteSpriteFromCollection(selectedCollectionId, spriteId);
      refreshCollections();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete sprite");
    }
  }, [selectedCollectionId, refreshCollections]);

  const handleMoveSprite = useCallback((spriteId: string, toCollectionId: string) => {
    if (!selectedCollectionId) return;

    try {
      moveSpriteBetweenCollections(selectedCollectionId, toCollectionId, spriteId);
      refreshCollections();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to move sprite");
    }
  }, [selectedCollectionId, refreshCollections]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-slate-950 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Sprites
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <CollectionSidebar
          selectedCollectionId={selectedCollectionId}
          customCollections={customCollections}
          onSelectCollection={setSelectedCollectionId}
          onCreateCollection={handleCreateCollection}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-visible p-6">
          {isFileBasedCollection ? (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <p className="mb-2">This is a read-only collection</p>
                <p className="text-sm">File-based collections cannot be edited here.</p>
                <p className="text-sm mt-2">Create a custom collection to add your own sprites.</p>
              </div>
            </div>
          ) : (
            <SpriteGrid
              collection={selectedCollection}
              onAddSprite={handleAddSprite}
              onRenameSprite={handleRenameSprite}
              onDeleteSprite={handleDeleteSprite}
              onMoveSprite={handleMoveSprite}
              availableCollections={availableCollections.filter(c => c.id !== selectedCollectionId)}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadSpriteModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSave={handleSaveSprite}
        availableCollections={availableCollections}
        defaultCollectionId={selectedCollectionId || undefined}
        initialMode={uploadMode}
      />

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateCollectionModal}
        onClose={() => setShowCreateCollectionModal(false)}
        onCreate={handleCreateCollectionSubmit}
      />
    </div>
  );
}
