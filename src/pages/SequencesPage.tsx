import { SequenceManager } from "@/components/SequenceManager";
import type { GeneratorState } from "@/types/generator";

interface SequencesPageProps {
  currentState?: GeneratorState | null;
  onLoadPreset?: (state: GeneratorState) => void;
}

export function SequencesPage({ currentState, onLoadPreset }: SequencesPageProps) {
  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Sequences
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
        <div className="h-full overflow-auto">
          <SequenceManager 
            onLoadPreset={onLoadPreset}
            currentState={currentState}
          />
        </div>
      </div>
    </div>
  );
}
