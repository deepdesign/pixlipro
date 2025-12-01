import { SequenceManager } from "@/components/SequenceManager";
import type { GeneratorState } from "@/types/generator";

interface SequencesPageProps {
  currentState?: GeneratorState | null;
  onLoadPreset?: (state: GeneratorState) => void;
}

export function SequencesPage({ currentState, onLoadPreset }: SequencesPageProps) {
  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
          Sequences
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm h-full flex overflow-hidden">
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
