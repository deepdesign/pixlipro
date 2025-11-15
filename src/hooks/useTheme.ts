import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  THEME_MODE_STORAGE_KEY,
  THEME_COLOR_STORAGE_KEY,
  THEME_SHAPE_STORAGE_KEY,
  type ThemeMode,
  type ThemeColor,
} from "@/constants/theme";

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
};

const getStoredThemeColor = (): ThemeColor => {
  if (typeof window === "undefined") {
    return "amber";
  }
  const stored = window.localStorage.getItem(THEME_COLOR_STORAGE_KEY);
  const validColors: ThemeColor[] = [
    "amber",
    "mint",
    "violet",
    "ember",
    "lagoon",
    "rose",
    "battleship",
    "cyan",
    "lime",
    "coral",
    "indigo",
    "gold",
  ];
  return validColors.includes(stored as ThemeColor)
    ? (stored as ThemeColor)
    : "amber";
};

const getStoredThemeShape = (): "box" | "rounded" => {
  if (typeof window === "undefined") {
    return "box";
  }
  const stored = window.localStorage.getItem(THEME_SHAPE_STORAGE_KEY);
  return stored === "rounded" ? "rounded" : "box";
};

/**
 * Custom hook for managing theme state (mode, color, shape)
 * Handles localStorage persistence and applies theme to document
 */
export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getStoredThemeMode(),
  );
  const [themeColor, setThemeColor] = useState<ThemeColor>(() =>
    getStoredThemeColor(),
  );
  const [themeShape, setThemeShape] = useState<"box" | "rounded">(() =>
    getStoredThemeShape(),
  );

  const applyDocumentTheme = useCallback(
    (mode: ThemeMode, color: ThemeColor, shape: "box" | "rounded") => {
      if (typeof document === "undefined") {
        return;
      }
      const root = document.documentElement;
      const prefersDark =
        mode === "system" &&
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : false;
      const resolved: Exclude<ThemeMode, "system"> =
        mode === "system" ? (prefersDark ? "dark" : "light") : mode;
      root.setAttribute("data-theme-mode", mode);
      root.setAttribute("data-theme", resolved);
      root.setAttribute("data-theme-color", color);
      root.setAttribute("data-theme-shape", shape);
      root.style.setProperty("color-scheme", resolved);
    },
    [],
  );

  useLayoutEffect(() => {
    applyDocumentTheme(themeMode, themeColor, themeShape);
  }, [applyDocumentTheme, themeMode, themeColor, themeShape]);

  useEffect(() => {
    if (
      themeMode !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyDocumentTheme("system", themeColor, themeShape);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, [applyDocumentTheme, themeColor, themeMode, themeShape]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_COLOR_STORAGE_KEY, themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_SHAPE_STORAGE_KEY, themeShape);
  }, [themeShape]);

  return {
    themeMode,
    setThemeMode,
    themeColor,
    setThemeColor,
    themeShape,
    setThemeShape,
  };
}

