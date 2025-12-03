<!-- 0b679539-ee9e-4ad4-9282-01b5de414acd b929380e-42ee-40fe-b538-1bee1c74963d -->
# Sprite Performance Optimization

## Overview

Eliminate frame drops when switching sprite collections, selecting sprites, and rendering large collections (snowflakes, nature) by optimizing cache management, preloading strategy, and state updates.

## Performance Issues Identified

1. **Cache clearing**: `clearSpriteImageCache()` clears ALL sprites when switching collections, forcing expensive reloads
2. **Aggressive preloading**: All sprites in a collection are preloaded, blocking the main thread for large collections
3. **Unnecessary recomputation**: Sprite selection triggers full `computeSprite()` regeneration
4. **Inefficient lookups**: Multiple `findSpriteByIdentifier()` calls search all collections repeatedly
5. **SVG processing**: SVGO optimization is CPU-intensive for complex sprites

## Implementation Plan

### 1. Optimize Cache Management

**File**: `src/generator.ts` (setSpriteCollection)

- **Remove** `clearSpriteImageCache()` call when switching collections
- **Rationale**: Cache should persist across collections - sprites from different collections can coexist in cache
- **Alternative**: Only clear cache if memory becomes an issue (can be added later with LRU eviction)

### 2. Optimize Preloading Strategy

**File**: `src/generator.ts` (setSpriteCollection, setSpriteMode, toggleSpriteSelection)

- **Change**: Only preload sprites that are actually selected/used, not entire collections
- **Implementation**:
- In `setSpriteCollection`: Only preload sprites from `selectedSprites` that belong to the new collection
- In `setSpriteMode`: Only preload the specific sprite being selected (already done, but verify)
- In `toggleSpriteSelection`: Don't preload entire collection, only the toggled sprite
- **Batch preloading**: Use `requestIdleCallback` or `setTimeout` to batch preload operations and avoid blocking

### 3. Avoid Unnecessary Recomputation

**File**: `src/generator.ts` (toggleSpriteSelection, setSpriteCollection)

- **Change**: Use `recompute: false` when sprite selection changes but structure doesn't need regeneration
- **Implementation**:
- `toggleSpriteSelection`: Use `recompute: false` - sprite structure doesn't change, only which sprites are selected
- `setSpriteCollection`: Only recompute if `selectedSprites` from new collection require structure changes
- Keep `recompute: true` only when sprite structure actually changes (e.g., density, scale, seed)

### 4. Optimize Sprite Lookups

**File**: `src/generator.ts` (setSpriteCollection)

- **Cache lookup results**: Store `findSpriteByIdentifier()` results in a Map to avoid repeated searches
- **Implementation**:
- Create a `Map<string, { sprite: SpriteInfo; collectionId: string } | null>` to cache identifier lookups
- Check cache before calling `findSpriteByIdentifier()`
- Populate cache during initial filtering pass

### 5. Defer Expensive Operations

**File**: `src/generator.ts` (setSpriteCollection, updateSprite)

- **Use requestIdleCallback**: Defer non-critical preloading to idle time
- **Implementation**:
- Wrap `preloadSpriteImages()` calls in `requestIdleCallback` with fallback to `setTimeout`
- Only preload sprites that are immediately needed (selected) synchronously
- Defer preloading of other sprites in the collection

### 6. Optimize SVG Processing

**File**: `src/lib/services/spriteImageLoader.ts`

- **Lazy SVGO processing**: Consider processing SVGs in a Web Worker (future optimization)
- **For now**: Ensure SVGO processing doesn't block - it's already async, but verify it's not causing issues
- **Cache processed SVGs**: Ensure processed SVG strings are cached (already done via imageCache)

## Files to Modify

1. `src/generator.ts`:

- `setSpriteCollection()`: Remove cache clear, optimize preloading, add lookup caching
- `toggleSpriteSelection()`: Use `recompute: false`
- `updateSprite()`: Optimize preloading strategy

2. `src/lib/services/spriteImageLoader.ts` (optional, future):

- Consider Web Worker for SVGO processing if issues persist

## Testing Checklist

- [ ] Switching collections doesn't cause frame drops
- [ ] Selecting sprites doesn't cause frame drops
- [ ] Snowflake collection loads smoothly
- [ ] Nature collection loads smoothly
- [ ] Previously loaded sprites remain cached when switching collections
- [ ] Sprite selection updates immediately without regeneration lag
- [ ] Memory usage remains reasonable (cache doesn't grow unbounded)

## Performance Targets

- Collection switching: < 16ms (60fps)
- Sprite selection: < 16ms (60fps)
- Large collection (100+ sprites) initial load: < 100ms
- No visible stuttering or frame drops during interactions

### To-dos

- [x] Update ProjectorPage to create its own sprite controller instead of just displaying streamed frames
- [x] Sync projector window sprite controller state with main window via BroadcastChannel