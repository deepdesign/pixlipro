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
}

export function AnimationBrowser({
  selectedAnimationId,
  onSelectAnimation,
  onDuplicateAnimation,
  onDeleteAnimation,
  onEditAnimation,
}: AnimationBrowserProps) {
  // Combine default and custom animations
  const allAnimations = useMemo(() => {
    const defaults = getAllDefaultAnimations();
    const customs = getAllCustomAnimations();
    return [...defaults, ...customs];
  }, []);

  // Filter animations (can be extended later for search/filter)
  const filteredAnimations = useMemo(() => {
    return allAnimations;
  }, [allAnimations]);

  if (filteredAnimations.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-theme-muted">
          No animations available. Create your first custom animation to get started.
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

