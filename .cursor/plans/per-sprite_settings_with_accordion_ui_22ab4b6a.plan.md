---
name: Per-Sprite Settings with Accordion UI
overview: Refactor the shape panel to support per-sprite settings using an accordion pattern. Each sprite set will have its own collection selector, density, scale, outline, and rotation controls. Users can add new sprite sets and delete existing ones. Each set generates tiles independently using its own settings.
todos:
  - id: add-sprite-set-interface
    content: Add SpriteSet interface and update GeneratorState to include spriteSets array
    status: pending
  - id: add-migration-logic
    content: Add migration function to convert selectedSprites to spriteSets
    status: pending
    dependencies:
      - add-sprite-set-interface
  - id: update-compute-sprite
    content: Refactor computeSprite to iterate over sprite sets and generate tiles per set
    status: pending
    dependencies:
      - add-sprite-set-interface
      - add-migration-logic
  - id: update-rendering-loop
    content: Update rendering loop to use per-sprite-set settings for outline, rotation, etc.
    status: pending
    dependencies:
      - update-compute-sprite
  - id: add-controller-methods
    content: Add controller methods for sprite set management (add, remove, update)
    status: pending
    dependencies:
      - add-sprite-set-interface
  - id: refactor-sprite-controls-ui
    content: Refactor SpriteControls.tsx to use Accordion component with per-sprite-set controls
    status: pending
    dependencies:
      - add-controller-methods
  - id: add-sprite-set-id-to-tiles
    content: Add spriteSetId to SvgTile interface to track which set each tile belongs to
    status: pending
    dependencies:
      - add-sprite-set-interface
---

# Pe

r-Sprite Settings with Accordion UI

## Overview

Refactor the shape panel to support per-sprite settings. Instead of a single global set of controls with multiple selected sprites, each sprite will have its own complete set of controls (collection, density, scale, outline, rotation) organized in collapsible accordion sections.

## Data Structure Changes

### New Interface: `SpriteSet`

Add a new interface in `src/generator.ts` to represent a sprite set with all its settings:

```typescript
interface SpriteSet {
  id: string; // Unique identifier for this sprite set (UUID or timestamp-based)
  spriteIdentifier: string; // Single sprite identifier (not an array)
  spriteCollectionId: string;
  // Density & Scale
  scalePercent: number;
  scaleBase: number;
  scaleSpread: number;
  scaleWeighting: number;
  linesRatio: number;
  // Outline
  outlineEnabled: boolean;
  outlineStrokeWidth: number;
  outlineMixed: boolean;
  outlineBalance: number;
  // Rotation
  rotationEnabled: boolean;
  rotationAmount: number;
  rotationSpeed: number;
  rotationAnimated: boolean;
}
```



### Update `GeneratorState`

In `src/generator.ts` (~line 176):

- **Deprecate** `selectedSprites: string[]` (keep for backward compatibility)
- **Add** `spriteSets: SpriteSet[]` - array of sprite sets, minimum 1 set
- **Deprecate** global sprite settings (keep for backward compatibility):
- `spriteCollectionId`, `scalePercent`, `scaleBase`, `scaleSpread`, `scaleWeighting`, `linesRatio`
- `outlineEnabled`, `outlineStrokeWidth`, `outlineMixed`, `outlineBalance`
- `rotationEnabled`, `rotationAmount`, `rotationSpeed`, `rotationAnimated`

### Migration Logic

Add migration function in `src/generator.ts` to convert old `selectedSprites` array to new `spriteSets` array:

```typescript
function migrateToSpriteSets(state: GeneratorState): SpriteSet[] {
  // If spriteSets already exists, use it
  if (state.spriteSets && state.spriteSets.length > 0) {
    return state.spriteSets;
  }
  
  // Migrate from selectedSprites array
  const selectedSprites = state.selectedSprites || [];
  if (selectedSprites.length === 0) {
    // Create default sprite set
    return [createDefaultSpriteSet(state)];
  }
  
  // Convert each selected sprite to a sprite set
  return selectedSprites.map((spriteId, index) => ({
    id: `set-${Date.now()}-${index}`,
    spriteIdentifier: spriteId,
    spriteCollectionId: state.spriteCollectionId || "default",
    // Copy global settings to each set
    scalePercent: state.scalePercent,
    scaleBase: state.scaleBase,
    scaleSpread: state.scaleSpread,
    scaleWeighting: state.scaleWeighting ?? 50,
    linesRatio: state.linesRatio,
    outlineEnabled: state.outlineEnabled,
    outlineStrokeWidth: state.outlineStrokeWidth,
    outlineMixed: state.outlineMixed,
    outlineBalance: state.outlineBalance ?? 50,
    rotationEnabled: state.rotationEnabled,
    rotationAmount: state.rotationAmount,
    rotationSpeed: state.rotationSpeed,
    rotationAnimated: state.rotationAnimated,
  }));
}
```



## Core Logic Changes

### Update `computeSprite` Function

In `src/generator.ts` (~line 1119), refactor to iterate over sprite sets:

1. **Get sprite sets** (with migration):
   ```typescript
               const spriteSets = migrateToSpriteSets(state);
   ```




2. **Generate tiles per sprite set**: For each sprite set, generate tiles using that set's settings:

- Use `spriteSet.scalePercent` instead of `state.scalePercent`
- Use `spriteSet.scaleBase` instead of `state.scaleBase`
- Use `spriteSet.scaleSpread` instead of `state.scaleSpread`
- Use `spriteSet.scaleWeighting` instead of `state.scaleWeighting`
- Use `spriteSet.outlineEnabled`, `spriteSet.outlineMixed`, `spriteSet.outlineBalance` for outline logic
- Use `spriteSet.rotationEnabled`, `spriteSet.rotationAmount`, `spriteSet.rotationSpeed` for rotation
- Store `spriteSet.id` in each tile (add `spriteSetId: string` to `SvgTile` interface)

3. **Combine tiles**: Merge tiles from all sprite sets into the same layers (maintain existing layer structure)

### Update Rendering Loop

In `src/generator.ts` (~line 3487), update tile rendering to use per-sprite-set settings:

- When checking outline state, look up the sprite set for each tile and use its settings
- When applying rotation, use the sprite set's rotation settings
- When applying scale, use the sprite set's scale settings (already stored in tile.scale, but verify)

## UI Component Changes

### Refactor `SpriteControls.tsx`

Replace the current single-control-stack UI with an accordion-based UI:

1. **Import Accordion component**:
   ```typescript
               import { Accordion } from "@/components/ui/Accordion";
   ```




2. **Remove global controls**: Remove the single collection selector, sprite selection buttons, density/scale sliders, outline controls, and rotation controls from the top level.
3. **Add Accordion wrapper**: Wrap sprite sets in an Accordion component:
   ```tsx
               <Accordion type="multiple" defaultValue={spriteSets.map(set => set.id)}>
                 {spriteSets.map((spriteSet) => (
                   <Accordion.Item key={spriteSet.id} value={spriteSet.id}>
                     <Accordion.Header>
                       {/* Show sprite name/icon + delete button */}
                     </Accordion.Header>
                     <Accordion.Content>
                       {/* Full control stack for this sprite set */}
                     </Accordion.Content>
                   </Accordion.Item>
                 ))}
               </Accordion>
   ```




4. **Per-set controls**: Each accordion item contains:

- Collection selector (single select, not multi-select)
- Sprite selection (single sprite button row, only one can be selected)
- Regenerate button (per sprite set)
- Density & Scale section (collapsible, using sprite set's values)
- Outline section (using sprite set's values)
- Rotation section (using sprite set's values)

5. **Add sprite button**: Add "Add sprite" button at the bottom that:

- Creates a new sprite set with default settings (copied from the first sprite set or global defaults)
- Adds it to the `spriteSets` array
- Opens the new accordion item

6. **Delete button**: Each accordion header should have a delete button (trash icon) that:

- Only appears when there are 2+ sprite sets (minimum 1 set required)
- Removes the sprite set from the array
- Triggers regeneration

### Update Controller Methods

In `src/generator.ts` (~line 4492), add new controller methods:

```typescript
// Sprite set management
addSpriteSet: () => void;
removeSpriteSet: (setId: string) => void;
updateSpriteSet: (setId: string, updates: Partial<SpriteSet>) => void;
setSpriteSetSprite: (setId: string, spriteIdentifier: string) => void;
setSpriteSetCollection: (setId: string, collectionId: string) => void;
// ... per-sprite-set setters for all settings
```

Update existing methods to work with sprite sets:

- `toggleSpriteSelection` → Update to work with sprite sets (select sprite in a specific set)
- `setScalePercent` → Update to accept `setId` parameter
- `setOutlineEnabled` → Update to accept `setId` parameter
- etc.

## Files to Modify

1. **`src/generator.ts`**:

- Add `SpriteSet` interface
- Add `spriteSets` to `GeneratorState`
- Add migration function
- Update `computeSprite` to iterate over sprite sets
- Update rendering loop to use per-sprite-set settings
- Add new controller methods
- Update `DEFAULT_STATE` to include default sprite set

2. **`src/components/ControlPanel/SpriteControls.tsx`**:

- Complete refactor to accordion-based UI
- Remove global controls
- Add per-sprite-set controls
- Add "Add sprite" button
- Add delete buttons in accordion headers
- Update all event handlers to work with sprite sets

3. **`src/types/generator.ts`** (if it exists):

- Export `SpriteSet` interface
- Update `SpriteController` interface with new methods

## Implementation Notes

- **Backward compatibility**: Keep deprecated fields in `GeneratorState` and migrate automatically
- **Minimum 1 set**: Always ensure at least one sprite set exists
- **Default values**: When creating a new sprite set, copy settings from the first existing set (or use global defaults)
- **Regenerate per set**: Each sprite set's regenerate button should only regenerate tiles for that set (may require per-set seed or separate tile generation)
- **Performance**: Generating tiles per sprite set should have similar performance to current implementation since we're just iterating over sets instead of selected sprites

## Testing Considerations

- Test migration from old `selectedSprites` format