import { useState, useCallback } from "react";
import type { AnimationPreviewSettings } from "@/types/animations";
import { getAllPalettes } from "@/data/palettes";
import { getAllCollections } from "@/constants/spriteCollections";

const DEFAULT_SETTINGS: AnimationPreviewSettings = {
  density: 50,
  scale: 100,
  range: 50,
  paletteId: "neon", // Default to first palette
  spriteShape: "", // Will be set from first collection
};

export function useAnimationPreview() {
  // Initialize with defaults
  const getDefaultSpriteShape = () => {
    const collections = getAllCollections();
    return collections[0]?.sprites?.[0]?.id || "";
  };

  const [settings, setSettings] = useState<AnimationPreviewSettings>(() => ({
    ...DEFAULT_SETTINGS,
    spriteShape: getDefaultSpriteShape(),
  }));

  const updateSettings = useCallback((newSettings: Partial<AnimationPreviewSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({
      ...DEFAULT_SETTINGS,
      spriteShape: getDefaultSpriteShape(),
    });
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

