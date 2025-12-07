import { Button } from "@/components/Button";
import type { GeneratorState } from "@/types/generator";

interface EditQueuePanelProps {
  queue: Partial<GeneratorState>[];
  onApplyNow: () => void;
  onClearQueue: () => void;
}

export function EditQueuePanel({ queue, onApplyNow, onClearQueue }: EditQueuePanelProps) {
  if (queue.length === 0) {
    return (
      <div className="bg-theme-panel rounded-lg border border-theme-card p-4">
        <h3 className="text-sm font-semibold text-theme-primary mb-2">Edit Queue</h3>
        <p className="text-sm text-theme-subtle">No queued edits</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-panel rounded-lg border border-theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-theme-primary">
          Edit Queue ({queue.length} {queue.length === 1 ? "change" : "changes"})
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onApplyNow}>
            Apply Now
          </Button>
          <Button variant="outline" size="sm" onClick={onClearQueue}>
            Clear Queue
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {queue.map((edit, index) => (
          <div key={index} className="text-xs text-theme-subtle bg-theme-icon p-2 rounded">
            <p>Edit #{index + 1}</p>
            <p className="text-theme-muted">
              {Object.keys(edit).join(", ")}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-theme-subtle mt-3">
        Changes will be applied automatically on the next scene transition, or click "Apply Now" to apply immediately.
      </p>
    </div>
  );
}

