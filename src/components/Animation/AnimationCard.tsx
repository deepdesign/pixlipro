import { useState } from "react";
import { Button } from "@/components/Button";
import { Copy, Trash2, Pencil, Lock } from "lucide-react";
import { AnimationThumbnail } from "./AnimationThumbnail";
import type { Animation, DefaultAnimation, CustomAnimation } from "@/types/animations";
import type { MovementMode } from "@/types/generator";

interface AnimationCardProps {
  animation: Animation;
  onSelect?: (animationId: string) => void;
  onDuplicate?: (animation: Animation) => void;
  onDelete?: (animationId: string) => void;
  onEdit?: (animationId: string) => void;
  isSelected?: boolean;
}

// Map movement modes to their waveform types
function getWaveformForMode(mode: MovementMode): string {
  const waveformMap: Record<MovementMode, string> = {
    pulse: "Sine",
    "pulse-meander": "Sine/Cosine",
    drift: "Sine/Cosine",
    ripple: "Sine/Cosine (Radial)",
    zigzag: "Sawtooth",
    cascade: "Sine/Cosine (Exponential)",
    spiral: "Sine/Cosine (Polar)",
    comet: "Sine/Cosine (Orbital)",
    linear: "Sine (Oscillation)",
    isometric: "Sine (Oscillation)",
    triangular: "Sine (Oscillation)",
  };
  return waveformMap[mode] || "Unknown";
}

// Get waveform information for an animation
function getWaveformInfo(animation: Animation): string {
  if (animation.isDefault) {
    const defaultAnim = animation as DefaultAnimation;
    return getWaveformForMode(defaultAnim.movementMode);
  } else {
    const customAnim = animation as CustomAnimation;
    // For custom animations, show the path type
    const pathTypeMap: Record<string, string> = {
      linear: "Linear Path",
      bezier: "Bezier Curve",
      spline: "Spline",
      custom: "Custom Path",
    };
    return pathTypeMap[customAnim.path?.type] || "Custom Path";
  }
}

export function AnimationCard({
  animation,
  onSelect,
  onDuplicate,
  onDelete,
  onEdit,
  isSelected = false,
}: AnimationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isDefault = animation.isDefault;
  const isCustom = !isDefault;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(animation.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(animation);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete "${animation.name}"?`)) {
      onDelete(animation.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(animation.id);
    }
  };

  return (
    <div
      className={`group relative bg-theme-panel rounded-lg border transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? "border-[var(--accent-primary)] shadow-lg"
          : "border-theme-card hover:shadow-md"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* Thumbnail Preview */}
      <div className="w-full aspect-video bg-theme-panel flex items-center justify-center overflow-hidden relative">
        <AnimationThumbnail animation={animation} size={320} />
        
        {/* Lock icon for default animations */}
        {isDefault && (
          <div className="absolute top-2 left-2">
            <Lock className="h-4 w-4 text-theme-subtle" />
          </div>
        )}

        {/* Action buttons overlay - shown on hover */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex gap-2">
            {onDuplicate && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleDuplicate}
                className="bg-theme-panel/90 backdrop-blur-sm hover:bg-theme-panel shadow-md"
                title="Duplicate animation"
                aria-label="Duplicate animation"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onEdit && isCustom && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleEdit}
                className="bg-theme-panel/90 backdrop-blur-sm hover:bg-theme-panel shadow-md"
                title="Edit animation"
                aria-label="Edit animation"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && isCustom && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleDelete}
                className="bg-theme-panel/90 backdrop-blur-sm hover:bg-status-error shadow-md text-status-error"
                title="Delete animation"
                aria-label="Delete animation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Animation Info */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-theme-primary mb-1 truncate">
          {animation.name}
        </h3>
        {'description' in animation && animation.description && (
          <p className="text-sm text-theme-muted line-clamp-2">
            {animation.description}
          </p>
        )}
        <p className="text-xs text-theme-subtle mt-2">
          Waveform: {getWaveformInfo(animation)}
        </p>
      </div>
    </div>
  );
}

