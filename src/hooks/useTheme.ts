import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  THEME_MODE_STORAGE_KEY,
  type ThemeMode,
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

/**
 * Custom hook for managing theme state (mode only - light/dark/system)
 * Handles localStorage persistence and applies theme to document
 */
export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getStoredThemeMode(),
  );

  const applyDocumentTheme = useCallback(
    (mode: ThemeMode) => {
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
      root.style.setProperty("color-scheme", resolved);
    },
    [],
  );

  useLayoutEffect(() => {
    applyDocumentTheme(themeMode);
  }, [applyDocumentTheme, themeMode]);

  useEffect(() => {
    if (
      themeMode !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia === "function"
    ) {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyDocumentTheme("system");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, [applyDocumentTheme, themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return {
    themeMode,
    setThemeMode,
  };
}
