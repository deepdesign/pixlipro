import { memo } from "react";
import type { GeneratorState } from "@/types/generator";

interface SceneThumbnailProps {
  state: GeneratorState;
  size?: number;
  thumbnail?: string; // Optional stored thumbnail (generated on save)
}

function SceneThumbnailComponent({ state, size = 80, thumbnail }: SceneThumbnailProps) {
  // Debug logging
  if (thumbnail) {
    console.log("[SceneThumbnail] Rendering with thumbnail:", {
      hasThumbnail: !!thumbnail,
      thumbnailLength: thumbnail.length,
      thumbnailStart: thumbnail.substring(0, 50),
      size
    });
  }

  return (
    <div 
      className="relative" 
      style={{ 
        width: size, 
        height: size, 
        overflow: "hidden",
      }}
    >
      {/* Display thumbnail or placeholder */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="Scene preview"
          className="rounded border border-theme-panel"
          style={{ width: size, height: size, objectFit: "cover" }}
          onError={(e) => {
            console.error("[SceneThumbnail] Image load error:", e);
            console.error("[SceneThumbnail] Thumbnail data:", thumbnail.substring(0, 100));
          }}
          onLoad={() => {
            console.log("[SceneThumbnail] Image loaded successfully");
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center bg-theme-panel rounded border border-theme-panel"
          style={{ width: size, height: size }}
        >
          <div className="text-xs text-theme-subtle">No preview</div>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders that cause flashing
export const SceneThumbnail = memo(SceneThumbnailComponent, (prevProps, nextProps) => {
  // React.memo comparison: return true if props are equal (skip re-render), false if different (re-render)
  
  // Check size first (cheapest comparison)
  if (prevProps.size !== nextProps.size) {
    return false; // Props changed, should re-render
  }
  
  // Check thumbnail prop (important for displaying stored thumbnails)
  if (prevProps.thumbnail !== nextProps.thumbnail) {
    return false; // Thumbnail changed, should re-render
  }
  
  // Handle null/undefined states
  if (!prevProps.state || !nextProps.state) {
    return prevProps.state === nextProps.state;
  }
  
  // Quick reference check - if same object reference, definitely equal
  if (prevProps.state === nextProps.state) {
    return true; // Same object, skip re-render
  }
  
  // Deep equality check using JSON.stringify
  // This handles cases where loadSceneState creates new objects with same content
  try {
    const prevStateStr = JSON.stringify(prevProps.state);
    const nextStateStr = JSON.stringify(nextProps.state);
    return prevStateStr === nextStateStr; // true = equal (skip), false = different (re-render)
  } catch (error) {
    // If comparison fails, assume different to be safe
    return false;
  }
});

