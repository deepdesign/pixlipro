import { useState, useCallback } from "react";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";
import { AnimationBrowser } from "@/components/Animation/AnimationBrowser";
import { Button } from "@/components/Button";
import { Plus } from "lucide-react";
import type { Animation } from "@/types/animations";
import { duplicateAnimation } from "@/lib/storage/animationStorage";
import { deleteCustomAnimation } from "@/lib/storage/animationStorage";

export function AnimationPage() {
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render after storage changes

  const handleSelectAnimation = useCallback((animationId: string) => {
    setSelectedAnimationId(animationId);
    // TODO: Apply animation to generator (Phase 8)
  }, []);

  const handleDuplicateAnimation = useCallback((animation: Animation) => {
    try {
      duplicateAnimation(animation, undefined);
      setRefreshKey(prev => prev + 1); // Force browser to refresh
    } catch (error) {
      console.error("Failed to duplicate animation:", error);
      alert(`Failed to duplicate animation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const handleDeleteAnimation = useCallback((animationId: string) => {
    try {
      deleteCustomAnimation(animationId);
      if (selectedAnimationId === animationId) {
        setSelectedAnimationId(undefined);
      }
      setRefreshKey(prev => prev + 1); // Force browser to refresh
    } catch (error) {
      console.error("Failed to delete animation:", error);
      alert(`Failed to delete animation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedAnimationId]);

  const handleEditAnimation = useCallback((_animationId: string) => {
    // TODO: Open animation editor (Phase 3-6)
    // For now, show a placeholder message
    alert("Animation editor coming soon! This will allow you to edit custom animations with path drawing, keyframes, and bezier curves.");
  }, []);

  const handleCreateNew = useCallback(() => {
    // TODO: Open animation editor for new animation (Phase 3-6)
    // For now, show a placeholder message
    alert("Animation editor coming soon! This will allow you to create custom animations with path drawing, keyframes, and bezier curves.");
  }, []);

  return (
    <SettingsPageLayout 
      title="Animation"
      headerActions={
        <Button
          type="button"
          variant="default"
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:bg-[var(--accent-primary)]/90"
        >
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      }
    >
      <div className="w-full">
        <AnimationBrowser
          key={refreshKey} // Force refresh when storage changes
          selectedAnimationId={selectedAnimationId}
          onSelectAnimation={handleSelectAnimation}
          onDuplicateAnimation={handleDuplicateAnimation}
          onDeleteAnimation={handleDeleteAnimation}
          onEditAnimation={handleEditAnimation}
        />
      </div>
    </SettingsPageLayout>
  );
}