/**
 * Custom Sprite Collections Storage
 * 
 * Manages custom sprite collections stored in localStorage.
 * Collections contain user-uploaded or pasted SVG sprites.
 */

export interface CustomSprite {
  id: string;
  name: string;
  svgContent: string; // Raw SVG string
  optimizedSvgContent?: string; // Optional optimized version
  originalSize?: number; // Bytes before optimization
  optimizedSize?: number; // Bytes after optimization
  createdAt: number;
  updatedAt: number;
}

export interface CustomSpriteCollection {
  id: string;
  name: string;
  sprites: CustomSprite[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "pixli-custom-sprite-collections";
const MAX_COLLECTIONS = 20;
const MAX_SPRITES_PER_COLLECTION = 100;

/**
 * Get all custom collections
 */
export function getAllCustomCollections(): CustomSpriteCollection[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as CustomSpriteCollection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load custom collections:", error);
    return [];
  }
}

/**
 * Get a specific custom collection by ID
 */
export function getCustomCollection(id: string): CustomSpriteCollection | undefined {
  const collections = getAllCustomCollections();
  return collections.find((c) => c.id === id);
}

/**
 * Save a custom collection (create or update)
 */
export function saveCustomCollection(collection: CustomSpriteCollection): boolean {
  try {
    const collections = getAllCustomCollections();
    const existingIndex = collections.findIndex((c) => c.id === collection.id);
    
    if (existingIndex >= 0) {
      // Update existing
      collections[existingIndex] = {
        ...collection,
        updatedAt: Date.now(),
      };
    } else {
      // Check max collections limit
      if (collections.length >= MAX_COLLECTIONS) {
        throw new Error(`Maximum of ${MAX_COLLECTIONS} custom collections allowed`);
      }
      // Add new
      collections.push({
        ...collection,
        createdAt: collection.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    return true;
  } catch (error) {
    console.error("Failed to save custom collection:", error);
    if (error instanceof Error && error.message.includes("Maximum")) {
      throw error;
    }
    throw new Error("Failed to save custom collection. Storage may be full.");
  }
}

/**
 * Delete a custom collection
 */
export function deleteCustomCollection(id: string): boolean {
  try {
    const collections = getAllCustomCollections();
    const filtered = collections.filter((c) => c.id !== id);
    if (filtered.length === collections.length) {
      return false; // Collection not found
    }
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete custom collection:", error);
    return false;
  }
}

/**
 * Create a new collection with a generated ID
 */
export function createCustomCollection(name: string): CustomSpriteCollection {
  const now = Date.now();
  const id = `custom-${now}-${Math.random().toString(36).substring(2, 9)}`;
  
  return {
    id,
    name: name.trim() || `Custom Collection ${getAllCustomCollections().length + 1}`,
    sprites: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add a sprite to a collection
 */
export function addSpriteToCollection(
  collectionId: string,
  sprite: CustomSprite
): boolean {
  try {
    const collection = getCustomCollection(collectionId);
    if (!collection) {
      return false;
    }
    
    // Check max sprites limit
    if (collection.sprites.length >= MAX_SPRITES_PER_COLLECTION) {
      throw new Error(`Maximum of ${MAX_SPRITES_PER_COLLECTION} sprites per collection allowed`);
    }
    
    // Check for duplicate ID
    if (collection.sprites.some((s) => s.id === sprite.id)) {
      throw new Error(`Sprite with ID "${sprite.id}" already exists in this collection`);
    }
    
    collection.sprites.push({
      ...sprite,
      createdAt: sprite.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    collection.updatedAt = Date.now();
    
    return saveCustomCollection(collection);
  } catch (error) {
    console.error("Failed to add sprite to collection:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add sprite to collection");
  }
}

/**
 * Update a sprite in a collection
 */
export function updateSpriteInCollection(
  collectionId: string,
  spriteId: string,
  updates: Partial<CustomSprite>
): boolean {
  try {
    const collection = getCustomCollection(collectionId);
    if (!collection) {
      return false;
    }
    
    const spriteIndex = collection.sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) {
      return false;
    }
    
    // If updating ID, check for conflicts
    if (updates.id && updates.id !== spriteId) {
      if (collection.sprites.some((s) => s.id === updates.id && s.id !== spriteId)) {
        throw new Error(`Sprite with ID "${updates.id}" already exists in this collection`);
      }
    }
    
    collection.sprites[spriteIndex] = {
      ...collection.sprites[spriteIndex],
      ...updates,
      updatedAt: Date.now(),
    };
    collection.updatedAt = Date.now();
    
    return saveCustomCollection(collection);
  } catch (error) {
    console.error("Failed to update sprite in collection:", error);
    if (error instanceof Error) {
      throw error;
    }
    return false;
  }
}

/**
 * Delete a sprite from a collection
 */
export function deleteSpriteFromCollection(
  collectionId: string,
  spriteId: string
): boolean {
  try {
    const collection = getCustomCollection(collectionId);
    if (!collection) {
      return false;
    }
    
    const filtered = collection.sprites.filter((s) => s.id !== spriteId);
    if (filtered.length === collection.sprites.length) {
      return false; // Sprite not found
    }
    
    collection.sprites = filtered;
    collection.updatedAt = Date.now();
    
    return saveCustomCollection(collection);
  } catch (error) {
    console.error("Failed to delete sprite from collection:", error);
    return false;
  }
}

/**
 * Move a sprite from one collection to another
 */
export function moveSpriteBetweenCollections(
  fromCollectionId: string,
  toCollectionId: string,
  spriteId: string
): boolean {
  try {
    const fromCollection = getCustomCollection(fromCollectionId);
    const toCollection = getCustomCollection(toCollectionId);
    
    if (!fromCollection || !toCollection) {
      return false;
    }
    
    // Check if target collection has space
    if (toCollection.sprites.length >= MAX_SPRITES_PER_COLLECTION) {
      throw new Error(`Target collection is full (maximum ${MAX_SPRITES_PER_COLLECTION} sprites)`);
    }
    
    // Find sprite in source collection
    const spriteIndex = fromCollection.sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) {
      return false;
    }
    
    // Check for ID conflict in target collection
    if (toCollection.sprites.some((s) => s.id === spriteId)) {
      throw new Error(`Sprite with ID "${spriteId}" already exists in target collection`);
    }
    
    // Move sprite
    const sprite = fromCollection.sprites[spriteIndex];
    fromCollection.sprites.splice(spriteIndex, 1);
    toCollection.sprites.push({
      ...sprite,
      updatedAt: Date.now(),
    });
    
    fromCollection.updatedAt = Date.now();
    toCollection.updatedAt = Date.now();
    
    // Save both collections
    return saveCustomCollection(fromCollection) && saveCustomCollection(toCollection);
  } catch (error) {
    console.error("Failed to move sprite between collections:", error);
    if (error instanceof Error) {
      throw error;
    }
    return false;
  }
}

/**
 * Generate a unique sprite ID
 */
export function generateSpriteId(name: string, existingIds: string[]): string {
  const baseId = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sprite";
  
  let id = baseId;
  let counter = 1;
  
  while (existingIds.includes(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  
  return id;
}

/**
 * Get storage limits
 */
export function getStorageLimits() {
  return {
    maxCollections: MAX_COLLECTIONS,
    maxSpritesPerCollection: MAX_SPRITES_PER_COLLECTION,
  };
}

