# Complete Guide: Presets in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Presets](#understanding-presets)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Operations: Modify Presets](#operations-modify-presets)
5. [Testing & Verification](#testing--verification)
6. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** allows saving and loading complete generator state configurations as presets.

### What Are Presets?

Presets save the entire generator state (all sliders, toggles, selections) so you can:
- **Save**: Store current configuration
- **Load**: Restore saved configuration
- **Share**: Export/import as JSON
- **Manage**: Rename, delete, organize

---

## Understanding Presets

### Preset Structure

```typescript
interface Preset {
  id: string;              // Unique identifier
  name: string;            // Display name
  state: GeneratorState;   // Complete generator state
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

### Storage

- **Location**: Browser localStorage
- **Key**: `"bitlab-presets"`
- **Limit**: 50 presets maximum
- **Format**: JSON array

### Preset State

Includes all generator settings:
- Sprite mode, density, scale
- Palette, variance, hue shift
- Canvas background, blend mode, opacity
- Motion mode, intensity, speed
- Rotation settings
- And more...

---

## File-by-File Breakdown

### 1. `src/lib/storage/presetStorage.ts` - Preset Storage

**Location:** `src/lib/storage/presetStorage.ts`  
**Purpose:** localStorage operations for presets

**Key Functions:**
- `getAllPresets()`: Load all presets
- `savePreset()`: Save new preset
- `updatePreset()`: Update existing preset
- `deletePreset()`: Delete preset
- `loadPresetState()`: Convert preset to generator state
- `exportPresetsAsJSON()`: Export all presets
- `importPresetsFromJSON()`: Import presets from JSON

### 2. `src/components/PresetManager.tsx` - Preset UI

**Location:** `src/components/PresetManager.tsx`  
**Purpose:** Modal interface for preset management

**Key Features:**
- Save current state
- Load saved preset
- Delete preset
- Rename preset
- Export all presets
- Import presets from JSON

---

## Operations: Modify Presets

### Changing Maximum Presets

**To adjust the preset limit:**

1. Open `src/lib/storage/presetStorage.ts`
2. Find `MAX_PRESETS` (around line 17):
```typescript
const MAX_PRESETS = 50;  // Change this value
```

---

### Changing Storage Key

**To use a different localStorage key:**

1. Open `src/lib/storage/presetStorage.ts`
2. Find `STORAGE_KEY` (around line 16):
```typescript
const STORAGE_KEY = "bitlab-presets";  // Change this value
```

**Note:** Changing this will make existing presets inaccessible.

---

## Testing & Verification

### Testing Checklist

- [ ] Save preset works
- [ ] Load preset works
- [ ] Delete preset works
- [ ] Rename preset works
- [ ] Export presets works
- [ ] Import presets works
- [ ] Presets persist after page reload
- [ ] Maximum preset limit enforced
- [ ] No console errors

---

## Best Practices

### Preset Guidelines

1. **Naming**: Use descriptive names
2. **Organization**: Export/import for backup
3. **Limit**: 50 presets is reasonable
4. **Sharing**: JSON format allows easy sharing

---

## Summary

The preset system provides:
- **State Persistence**: Save complete configurations
- **Easy Management**: Load, rename, delete presets
- **Sharing**: Export/import as JSON
- **Reliable**: localStorage persistence

**Key Files:**
- `src/lib/storage/presetStorage.ts` - Storage logic
- `src/components/PresetManager.tsx` - UI component

**Key Features:**
- Save/Load presets
- Rename/Delete presets
- Export/Import JSON
- 50 preset limit

