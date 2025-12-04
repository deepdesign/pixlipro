import { SequenceManager } from "@/components/SequenceManager";
import { Button } from "@/components/Button";
import { Eye } from "lucide-react";
import type { GeneratorState } from "@/types/generator";

interface SequencesPageProps {
  currentState?: GeneratorState | null;
  onLoadPreset?: (state: GeneratorState) => void;
  onNavigateToCanvas?: () => void;
}

export function SequencesPage({ currentState, onLoadPreset, onNavigateToCanvas }: SequencesPageProps) {
  return (
    <div className="h-full w-full flex flex-col bg-theme-bg-base">
      {/* Header */}
      <div className="px-6 py-3 mb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-theme-primary">
            Sequences
          </h2>
          {onNavigateToCanvas && (
            <Button
              variant="outline"
              onClick={onNavigateToCanvas}
              title="View Canvas"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Canvas
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <SequenceManager 
          onLoadPreset={onLoadPreset}
          currentState={currentState}
        />
      </div>
    </div>
  );
}
