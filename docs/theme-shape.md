# Complete Guide: Theme Shape (Box/Rounded) in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Theme Shape](#understanding-theme-shape)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Operations: Modify Theme Shape](#operations-modify-theme-shape)
5. [Testing & Verification](#testing--verification)
6. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** allows toggling between "box" (sharp corners) and "rounded" (rounded corners) UI styling.

### What Is Theme Shape?

Theme shape controls the border radius of UI elements:
- **Box**: Sharp, square corners (0px border-radius)
- **Rounded**: Soft, rounded corners (varies by element)

This affects buttons, cards, inputs, and other UI components.

---

## Understanding Theme Shape

### Shape Options

1. **Box** - Sharp corners, geometric look
2. **Rounded** - Rounded corners, softer look

### How It Works

- Stored in localStorage as `"retro-theme-shape"`
- Applied via `data-theme-shape` attribute on document root
- CSS uses attribute selector to apply border-radius
- Persists across sessions

---

## File-by-File Breakdown

### 1. `src/hooks/useTheme.ts` - Theme Shape Management

**Location:** `src/hooks/useTheme.ts`  
**Purpose:** Theme shape state and persistence

**Key Code:**
```typescript
const [themeShape, setThemeShape] = useState<"box" | "rounded">(() =>
  getStoredThemeShape(),
);

// Applies to document:
root.setAttribute("data-theme-shape", shape);
```

### 2. `src/components/Header/Header.tsx` - Shape Toggle UI

**Location:** `src/components/Header/Header.tsx`  
**Purpose:** UI for toggling theme shape

**Key Code:**
```typescript
const cycleThemeShape = useCallback(() => {
  onThemeShapeChange(themeShape === "box" ? "rounded" : "box");
}, [themeShape, onThemeShapeChange]);
```

---

## Operations: Modify Theme Shape

### Changing Default Shape

**To set a different default:**

1. Open `src/hooks/useTheme.ts`
2. Find `getStoredThemeShape()` (around line 34):
```typescript
const getStoredThemeShape = (): "box" | "rounded" => {
  // ...
  return stored === "rounded" ? "rounded" : "box";  // Change default
};
```

---

## Testing & Verification

### Testing Checklist

- [ ] Shape toggle works
- [ ] Box mode shows sharp corners
- [ ] Rounded mode shows rounded corners
- [ ] Shape persists after reload
- [ ] All UI elements update correctly
- [ ] No console errors

---

## Best Practices

### Theme Shape Guidelines

1. **Consistency**: Apply consistently across all UI elements
2. **Accessibility**: Both shapes should be accessible
3. **User Preference**: Allow easy switching

---

## Summary

The theme shape system provides:
- **Two Options**: Box or Rounded
- **Easy Toggle**: Single button to switch
- **Persistence**: Saves to localStorage
- **Global Application**: Updates entire UI

**Key Files:**
- `src/hooks/useTheme.ts` - Shape management
- `src/components/Header/Header.tsx` - Toggle UI
- `src/index.css` - CSS styling

**Key Features:**
- Box/Rounded toggle
- localStorage persistence
- Global UI updates

