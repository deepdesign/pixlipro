import { Button } from "@/components/Button";
import { Play } from "lucide-react";
import type { Sequence } from "@/lib/storage/sequenceStorage";

interface RowPlayerProps {
  sequence: Sequence;
  onNavigateToPerform?: (sequenceId: string) => void;
}

export function RowPlayer({ sequence, onNavigateToPerform }: RowPlayerProps) {
  // Support both old format (items) and new format (scenes)
  const items = (sequence as any)?.items || [];
  const sequenceScenes = (sequence as any)?.scenes || [];
  const sequenceItems = sequenceScenes.length > 0 ? sequenceScenes : items;

  const handlePlay = () => {
    if (!sequence || sequenceItems.length === 0) return;
    
    if (onNavigateToPerform) {
      onNavigateToPerform(sequence.id);
    }
  };

  if (!sequence || sequenceItems.length === 0) {
    return null;
  }

  return (
    <Button
      variant="default"
      size="icon"
      onClick={handlePlay}
      title="Play sequence"
    >
      <Play className="h-4 w-4" />
    </Button>
  );
}


