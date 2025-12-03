import { SequenceManager } from "@/components/SequenceManager";
import type { GeneratorState } from "@/types/generator";

interface SequencesPageProps {
  currentState?: GeneratorState | null;
  onLoadPreset?: (state: GeneratorState) => void;
}

export function SequencesPage({ currentState, onLoadPreset }: SequencesPageProps) {
  return (
    <div className="h-full w-full flex flex-col bg-theme-bg-base">
      {/* Header */}
      <div className="px-6 py-3 mb-3 flex-shrink-0">
        <h2 className="text-xl font-semibold text-theme-primary">
          Sequences
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm h-full flex overflow-hidden">
          <div className="flex-1 flex overflow-hidden min-h-0">
            <SequenceManager 
              onLoadPreset={onLoadPreset}
              currentState={currentState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
