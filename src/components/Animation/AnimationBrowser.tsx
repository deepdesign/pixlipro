import { useMemo } from "react";
import { AnimationCard } from "./AnimationCard";
import type { Animation } from "@/types/animations";
import { getAllDefaultAnimations } from "@/constants/animations";
import { getAllCustomAnimations } from "@/lib/storage/animationStorage";

interface AnimationBrowserProps {
  selectedAnimationId?: string;
  onSelectAnimation?: (animationId: string) => void;
  onDuplicateAnimation?: (animation: Animation) => void;
  onDeleteAnimation?: (animationId: string) => void;
  onEditAnimation?: (animationId: string) => void;
  filter?: "default" | "custom";
}

export function AnimationBrowser({
  selectedAnimationId,
  onSelectAnimation,
  onDuplicateAnimation,
  onDeleteAnimation,
  onEditAnimation,
  filter,
}: AnimationBrowserProps) {
  // Get default and custom animations separately
  const defaultAnimations = useMemo(() => getAllDefaultAnimations(), []);
  const customAnimations = useMemo(() => getAllCustomAnimations(), []);

  // Filter animations based on active tab
  const filteredAnimations = useMemo(() => {
    if (filter === "default") {
      return defaultAnimations;
    } else if (filter === "custom") {
      return customAnimations;
    }
    // No filter: show all
    return [...defaultAnimations, ...customAnimations];
  }, [defaultAnimations, customAnimations, filter]);

  if (filteredAnimations.length === 0) {
    if (filter === "custom") {
      return (
        <div className="w-full py-12 text-center">
          <p className="text-theme-muted mb-4">
            No custom animations yet.
          </p>
          <p className="text-sm text-theme-subtle">
            Create your first custom animation or duplicate a default one to get started.
          </p>
        </div>
      );
    }
    return (
      <div className="w-full py-12 text-center">
        <p className="text-theme-muted">
          No animations available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAnimations.map((animation) => (
          <AnimationCard
            key={animation.id}
            animation={animation}
            isSelected={animation.id === selectedAnimationId}
            onSelect={onSelectAnimation}
            onDuplicate={onDuplicateAnimation}
            onDelete={onDeleteAnimation}
            onEdit={onEditAnimation}
          />
        ))}
      </div>
    </div>
  );
}

