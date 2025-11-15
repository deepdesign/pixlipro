# Complete Guide: Theme Mode (Dark/Light) in BitLab

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Theme Mode](#understanding-theme-mode)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Operations: Modify Theme Mode](#operations-modify-theme-mode)
5. [Testing & Verification](#testing--verification)
6. [Best Practices](#best-practices)

---

## Project Overview

**BitLab** supports light, dark, and system (auto) theme modes for the UI.

### What Is Theme Mode?

Theme mode controls the color scheme of the UI:
- **Light**: Light background, dark text
- **Dark**: Dark background, light text
- **System**: Follows OS/browser preference

---

## Understanding Theme Mode

### Mode Options

1. **System** - Follows OS preference (default)
2. **Light** - Always light mode
3. **Dark** - Always dark mode

### How It Works

- Stored in localStorage as `"retro-theme-mode"`
- Applied via `data-theme-mode` and `data-theme` attributes
- System mode listens to `prefers-color-scheme` media query
- Persists across sessions

---

## File-by-File Breakdown

### 1. `src/hooks/useTheme.ts` - Theme Mode Management

**Location:** `src/hooks/useTheme.ts`  
**Purpose:** Theme mode state and persistence

**Key Code:**
```typescript
const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
  getStoredThemeMode(),
);

// Resolves system mode to light/dark:
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;

// Applies to document:
root.setAttribute("data-theme-mode", mode);
root.setAttribute("data-theme", resolved);
```

### 2. `src/components/Header/Header.tsx` - Mode Toggle UI

**Location:** `src/components/Header/Header.tsx`  
**Purpose:** UI for cycling theme mode

**Key Code:**
```typescript
const cycleThemeMode = useCallback(() => {
  onThemeModeChange(
    themeMode === "system" ? "light" : themeMode === "light" ? "dark" : "system",
  );
}, [themeMode, onThemeModeChange]);
```

---

## Operations: Modify Theme Mode

### Changing Default Mode

**To set a different default:**

1. Open `src/hooks/useTheme.ts`
2. Find `getStoredThemeMode()` (around line 10):
```typescript
const getStoredThemeMode = (): ThemeMode => {
  // ...
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";  // Change default
};
```

---

## Testing & Verification

### Testing Checklist

- [ ] Mode toggle cycles correctly (System → Light → Dark → System)
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] System mode follows OS preference
- [ ] Mode persists after reload
- [ ] System mode updates when OS preference changes
- [ ] All UI elements update correctly
- [ ] No console errors

---

## Best Practices

### Theme Mode Guidelines

1. **System Default**: Use "system" as default for best UX
2. **Media Query**: Listen to OS preference changes
3. **Accessibility**: Ensure good contrast in both modes
4. **Persistence**: Save user preference

---

## Summary

The theme mode system provides:
- **Three Options**: System, Light, Dark
- **Easy Toggle**: Single button cycles modes
- **OS Integration**: System mode follows OS preference
- **Persistence**: Saves to localStorage

**Key Files:**
- `src/hooks/useTheme.ts` - Mode management
- `src/components/Header/Header.tsx` - Toggle UI
- `src/index.css` - CSS styling

**Key Features:**
- System/Light/Dark modes
- OS preference detection
- localStorage persistence
- Global UI updates

