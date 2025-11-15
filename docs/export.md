# Complete Guide: Export in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Export](#understanding-export)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Operations: Modify Export](#operations-modify-export)
5. [Testing & Verification](#testing--verification)
6. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** allows exporting canvas compositions as high-resolution images in various formats and dimensions.

### What Is Export?

Export captures the current canvas state and saves it as an image file. Supports:
- **Custom Dimensions**: Any width/height
- **Preset Dimensions**: Common sizes (Social, Wallpapers, Print)
- **Aspect Ratio Locking**: Maintain canvas proportions
- **High Resolution**: Up to 8K+ with quality scaling
- **Format**: PNG (always, for quality)

---

## Understanding Export

### Export Process

1. **Pause Animation**: Animation pauses during export for crisp capture
2. **Create Offscreen Canvas**: Temporary canvas at target resolution
3. **Scale & Render**: Current canvas scaled to target size with high-quality smoothing
4. **Export**: Convert to PNG and download
5. **Resume Animation**: Animation resumes after export

### Dimension Presets

**Quick:**
- Current: Uses current canvas size

**Social:**
- Instagram Post: 1080×1080
- Instagram Story: 1080×1920
- Twitter/X: 1200×675
- Facebook: 1200×630

**Wallpapers:**
- HD: 1920×1080
- 4K: 3840×2160
- 5K: 5120×2880
- 8K: 7680×4320

**Print:**
- A4 (300 DPI): 2480×3508
- Square Print: 3000×3000

---

## File-by-File Breakdown

### 1. `src/components/ExportModal.tsx` - Export UI

**Location:** `src/components/ExportModal.tsx`  
**Purpose:** Modal interface for export settings

**Key Features:**
- Dimension presets organized by category
- Custom dimension inputs
- Aspect ratio locking
- Progress indicator
- Error handling

### 2. `src/lib/services/exportService.ts` - Export Logic

**Location:** `src/lib/services/exportService.ts`  
**Purpose:** Core export functionality

**Key Functions:**
- `exportCanvas()`: Main export function
- `downloadImage()`: File download helper
- `createThumbnail()`: Preview generation
- `getCanvasFromP5()`: Canvas extraction

**Export Process:**
```typescript
export async function exportCanvas(
  p5Instance: p5,
  config: ExportConfig
): Promise<string> {
  // 1. Get current canvas
  // 2. Create offscreen canvas at target size
  // 3. Enable high-quality smoothing
  // 4. Draw current canvas scaled to target size
  // 5. Convert to blob and return data URL
}
```

---

## Operations: Modify Export

### Adding New Dimension Presets

**Step 1: Update Presets**
1. Open `src/components/ExportModal.tsx`
2. Find `DIMENSION_PRESETS` (around line 22)
3. Add new preset to appropriate category:

```typescript
const DIMENSION_PRESETS = {
  "Quick": [/* ... */],
  "Social": [
    // ... existing
    { label: "New Format", width: 1920, height: 1080 },
  ],
  // ... other categories
};
```

---

### Changing Default Format

Currently always PNG. To add JPEG/WebP support:

1. Update `ExportConfig` interface to allow format selection
2. Modify `exportCanvas()` to handle different formats
3. Add format selector to UI

---

## Testing & Verification

### Testing Checklist

- [ ] Export modal opens correctly
- [ ] Dimension presets work
- [ ] Custom dimensions work
- [ ] Aspect ratio locking works
- [ ] Export creates correct file
- [ ] File downloads successfully
- [ ] Animation pauses during export
- [ ] Animation resumes after export
- [ ] High-resolution exports work (4K+)
- [ ] Progress indicator shows
- [ ] Error handling works
- [ ] No console errors

---

## Best Practices

### Export Guidelines

1. **PNG Format**: Always use PNG for quality (supports transparency)
2. **High Resolution**: Use scale factor for very large exports
3. **Aspect Ratio**: Lock aspect ratio for consistent proportions
4. **Animation**: Always pause during export for crisp capture

---

## Summary

The export system provides:
- **Flexible Dimensions**: Custom or preset sizes
- **High Quality**: PNG format with quality scaling
- **User-Friendly**: Preset categories and aspect ratio locking
- **Reliable**: Error handling and progress indication

**Key Files:**
- `src/components/ExportModal.tsx` - Export UI
- `src/lib/services/exportService.ts` - Export logic

**Key Features:**
- Dimension presets
- Custom dimensions
- Aspect ratio locking
- High-resolution support
- PNG format

