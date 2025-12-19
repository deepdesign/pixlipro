import { useState, useCallback, useEffect, useRef } from "react";
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
  type CustomSprite,
  type CustomSpriteCollection,
} from "@/lib/storage/customSpriteStorage";
import { getAllCollections, cleanupCollectionBlobUrls, getCollection, type SpriteCollection } from "@/constants/spriteCollections";
import { Lock } from "lucide-react";

// Read-only sprite grid for file-based collections
function ReadOnlySpriteGrid({ collection }: { collection: SpriteCollection }) {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  // Listen for theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Process SVG files with theme colors
  useEffect(() => {
    let cancelled = false;
    const currentUrls = new Map<string, string>();
    
    const processSprites = async () => {
      // Get theme color
      const getSpriteColor = () => {
        if (typeof window === 'undefined') {
          return theme === 'light' ? '#0f172a' : '#f8fafc';
        }
        
        const root = document.documentElement;
        if (theme === 'light') {
          const textPrimary = getComputedStyle(root).getPropertyValue('--theme-primary-textPrimary').trim();
          return textPrimary || '#0f172a';
        } else {
          const tint50 = getComputedStyle(root).getPropertyValue('--theme-primary-tint50').trim();
          return tint50 || '#f8fafc';
        }
      };

      const spriteColor = getSpriteColor();

      for (const sprite of collection.sprites) {
        if (cancelled) break;
        
        if (sprite.svgPath) {
          try {
            // Fetch SVG
            const response = await fetch(sprite.svgPath);
            if (!response.ok) continue;
            
            let svgText = await response.text();
            
            // Remove background rectangles
            svgText = svgText.replace(/<rect[^>]*fill\s*=\s*["']#[fF]{6}["'][^>]*\/?>/gi, '');
            svgText = svgText.replace(/<rect[^>]*fill\s*=\s*["']#000000["'][^>]*\/?>/gi, '');
            svgText = svgText.replace(/<rect[^>]*fill\s*=\s*["']none["'][^>]*\/?>/gi, '');
            
            // Replace fill colors
            svgText = svgText.replace(/fill\s*=\s*["']([^"']+)["']/gi, (match, color) => {
              const lowerColor = color.toLowerCase();
              if (lowerColor === 'none' || lowerColor === 'transparent') {
                return match;
              }
              return `fill="${spriteColor}"`;
            });
            
            // Replace stroke colors
            svgText = svgText.replace(/stroke\s*=\s*["']([^"']+)["']/gi, (match, color) => {
              const lowerColor = color.toLowerCase();
              if (lowerColor === 'none' || lowerColor === 'transparent') {
                return match;
              }
              return `stroke="${spriteColor}"`;
            });
            
            // Replace fill/stroke in style attributes
            svgText = svgText.replace(/style\s*=\s*["']([^"']*)["']/gi, (_match: string, styleContent: string) => {
              let newStyle = styleContent.replace(/fill\s*:\s*([^;]+)/gi, (_fillMatch: string, fillValue: string) => {
                const trimmedFill = fillValue.trim().toLowerCase();
                if (trimmedFill === 'none' || trimmedFill === 'transparent') {
                  return _fillMatch;
                }
                return `fill: ${spriteColor}`;
              });
              newStyle = newStyle.replace(/stroke\s*:\s*([^;]+)/gi, (_strokeMatch: string, strokeValue: string) => {
                const trimmedStroke = strokeValue.trim().toLowerCase();
                if (trimmedStroke === 'none' || trimmedStroke === 'transparent') {
                  return _strokeMatch;
                }
                return `stroke: ${spriteColor}`;
              });
              return `style="${newStyle}"`;
            });
            
            // Ensure root SVG has theme color as default fill
            const svgMatch = svgText.match(/<svg([^>]*)>/i);
            if (svgMatch && !svgMatch[1].includes('fill=')) {
              svgText = svgText.replace(/<svg([^>]*)>/i, `<svg$1 fill="${spriteColor}">`);
            }
            
            if (!cancelled) {
              const blob = new Blob([svgText], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              currentUrls.set(sprite.id, url);
            }
          } catch (error) {
            console.warn(`Failed to process sprite ${sprite.id}:`, error);
          }
        }
      }
      
      if (!cancelled) {
        // Revoke old URLs before setting new ones
        previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        previewUrlsRef.current = new Map(currentUrls);
        setPreviewUrls(new Map(currentUrls));
      }
    };

    processSprites();
    
    // Cleanup function - revoke URLs when component unmounts or dependencies change
    return () => {
      cancelled = true;
      // Revoke all URLs
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
      currentUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [collection, theme]);

  if (collection.sprites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-theme-muted mb-2">No sprites in this collection</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-theme-subtle" />
        <p className="text-sm text-theme-muted">
          Read-only collection • {collection.sprites.length} sprite{collection.sprites.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {collection.sprites.map((sprite) => {
          const previewUrl = previewUrls.get(sprite.id);
          
          return (
            <div
              key={sprite.id}
              className="group relative bg-theme-card rounded-lg border border-theme-card p-2 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-theme-panel rounded border border-theme-border-card flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={sprite.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-theme-subtle text-xs">Loading...</div>
                )}
              </div>
              <p className="mt-2 text-xs text-theme-primary text-center truncate" title={sprite.name}>
                {sprite.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpritesPage() {
  const [customCollections, setCustomCollections] = useState<CustomSpriteCollection[]>(
    getAllCustomCollections()
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  
  // Get all collections and filter out custom ones to get only file-based collections
  const allCollections = getAllCollections();
  const customCollectionIds = new Set(customCollections.map(c => c.id));
  const allFileBasedCollections = allCollections.filter(c => !customCollectionIds.has(c.id));
  
  // Only include custom collections in the dropdown (file-based collections are read-only)
  const availableCollections = customCollections.map(c => ({ 
    id: c.id, 
    name: c.name 
  }));

  // Get selected collection (can be file-based or custom)
  const selectedCustomCollection = selectedCollectionId
    ? customCollections.find(c => c.id === selectedCollectionId) || null
    : null;
  
  const selectedFileBasedCollection = selectedCollectionId
    ? getCollection(selectedCollectionId) || null
    : null;
  
  // Check if selected collection is file-based (read-only)
  const isFileBasedCollection = selectedCollectionId
    ? !customCollections.some(c => c.id === selectedCollectionId)
    : false;

  // Auto-select first collection on load (prefer file-based collections, then custom)
  useEffect(() => {
    if (!selectedCollectionId) {
      if (allFileBasedCollections.length > 0) {
        setSelectedCollectionId(allFileBasedCollections[0].id);
      } else if (availableCollections.length > 0) {
        setSelectedCollectionId(availableCollections[0].id);
      }
    }
  }, [selectedCollectionId, allFileBasedCollections, availableCollections]);

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
    <div className="h-full w-full flex flex-col bg-theme-bg-base min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 mb-3 shrink-0">
        <h2 className="text-xl font-semibold text-theme-primary">
          Sprites
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-theme-card rounded-lg border border-theme-card shadow-sm h-full flex overflow-hidden">
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Sidebar */}
            <CollectionSidebar
              selectedCollectionId={selectedCollectionId}
              customCollections={customCollections}
              fileBasedCollections={allFileBasedCollections}
              onSelectCollection={setSelectedCollectionId}
              onCreateCollection={handleCreateCollection}
              onRenameCollection={handleRenameCollection}
              onDeleteCollection={handleDeleteCollection}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto overflow-x-visible p-6 bg-theme-panel">
              {isFileBasedCollection && selectedFileBasedCollection ? (
                <ReadOnlySpriteGrid collection={selectedFileBasedCollection} />
              ) : (
                <SpriteGrid
                  collection={selectedCustomCollection}
                  onAddSprite={handleAddSprite}
                  onRenameSprite={handleRenameSprite}
                  onDeleteSprite={handleDeleteSprite}
                  onMoveSprite={handleMoveSprite}
                  availableCollections={availableCollections.filter(c => c.id !== selectedCollectionId)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadSpriteModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSave={handleSaveSprite}
        availableCollections={availableCollections}
        defaultCollectionId={selectedCollectionId || undefined}
        initialMode="upload"
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
