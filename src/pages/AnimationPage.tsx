import { useState, useCallback } from "react";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";
import { AnimationBrowser } from "@/components/Animation/AnimationBrowser";
import { AnimationEditor } from "@/components/Animation/AnimationEditor";
import { Button } from "@/components/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Plus } from "lucide-react";
import type { Animation, CustomAnimation } from "@/types/animations";
import { duplicateAnimation, deleteCustomAnimation, updateCustomAnimation, saveCustomAnimation, getAnimationById } from "@/lib/storage/animationStorage";

export function AnimationPage() {
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render after storage changes
  const [activeTab, setActiveTab] = useState<"default" | "custom">("default");
  const [editingAnimation, setEditingAnimation] = useState<Animation | undefined>();
  const [showEditor, setShowEditor] = useState(false);

  const handleSelectAnimation = useCallback((animationId: string) => {
    setSelectedAnimationId(animationId);
    // TODO: Apply animation to generator (Phase 8)
  }, []);

  const handleDuplicateAnimation = useCallback((animation: Animation) => {
    try {
      duplicateAnimation(animation, undefined);
      setRefreshKey(prev => prev + 1); // Force browser to refresh
      setActiveTab("custom"); // Switch to custom tab after duplication
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

  const handleEditAnimation = useCallback((animationId: string) => {
    const animation = getAnimationById(animationId);
    if (animation) {
      setEditingAnimation(animation);
      setShowEditor(true);
    }
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingAnimation(undefined);
    setShowEditor(true);
  }, []);

  const handleSaveAnimation = useCallback((animation: CustomAnimation) => {
    try {
      if (animation.id && animation.id !== "preview-temp") {
        // Update existing
        updateCustomAnimation(animation);
      } else {
        // Create new
        saveCustomAnimation({
          name: animation.name,
          description: animation.description,
          codeFunctions: animation.codeFunctions,
          expressionMode: animation.expressionMode,
          duration: animation.duration,
          loop: animation.loop,
          author: animation.author,
          tags: animation.tags,
        });
      }
      setRefreshKey(prev => prev + 1);
      setShowEditor(false);
      setEditingAnimation(undefined);
      setActiveTab("custom"); // Switch to custom tab after saving
    } catch (error) {
      console.error("Failed to save animation:", error);
      alert(`Failed to save animation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const handleCancelEditor = useCallback(() => {
    setShowEditor(false);
    setEditingAnimation(undefined);
  }, []);

  return (
    <SettingsPageLayout 
      title="Animation"
      headerActions={
        !showEditor ? (
          <Button
            type="button"
            variant="default"
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:bg-[var(--accent-primary)]/90"
          >
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        ) : null
      }
    >
      <div className="w-full">
        {showEditor ? (
          <AnimationEditor
            animation={editingAnimation}
            onSave={handleSaveAnimation}
            onCancel={handleCancelEditor}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-4">
              <ButtonGroup
                value={activeTab}
                onChange={(value) => setActiveTab(value as "default" | "custom")}
                options={[
                  { value: "default", label: "Default" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </div>

            <AnimationBrowser
              key={refreshKey} // Force refresh when storage changes
              selectedAnimationId={selectedAnimationId}
              onSelectAnimation={handleSelectAnimation}
              onDuplicateAnimation={handleDuplicateAnimation}
              onDeleteAnimation={handleDeleteAnimation}
              onEditAnimation={handleEditAnimation}
              filter={activeTab}
            />
          </>
        )}
      </div>
    </SettingsPageLayout>
  );
}