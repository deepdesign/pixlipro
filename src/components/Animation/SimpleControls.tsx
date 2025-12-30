import { Input } from "@/components/ui/Input";
import { TextWithTooltip } from "@/components/ControlPanel/shared";

interface SimpleControlsProps {
  duration: number;
  onDurationChange: (value: number) => void;
}

export function SimpleControls({
  duration,
  onDurationChange,
}: SimpleControlsProps) {
  return (
    <div className="space-y-4 p-4 bg-theme-panel rounded-lg border border-theme-structural">
      <div className="space-y-2">
        <TextWithTooltip id="duration-tooltip" text="How long (in seconds) it takes for the animation to complete one full cycle. The 't' parameter in your code functions goes from 0 to 1 over this duration.">
          <label className="text-sm font-medium text-theme-text">Cycle Duration (seconds)</label>
        </TextWithTooltip>
        <Input
          type="number"
          min="0.1"
          max="60"
          step="0.1"
          value={duration}
          onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0.1)}
        />
      </div>

      <div className="pt-2 border-t border-theme-structural">
        <TextWithTooltip id="variables-tooltip" text="Variables you can use in your code functions">
          <label className="text-sm font-medium text-theme-text">Available Variables</label>
        </TextWithTooltip>
        <div className="mt-2 space-y-1 text-sm text-theme-subtle">
          <div>• <code className="text-theme-text">t</code> - Time (0-1, normalized)</div>
          <div>• <code className="text-theme-text">phase</code> - Sprite phase offset (0-1)</div>
          <div>• <code className="text-theme-text">layerIndex</code> - Layer number (0, 1, 2)</div>
          <div>• <code className="text-theme-text">baseUnit</code> - Base sprite size unit</div>
          <div>• <code className="text-theme-text">motionScale</code> - Motion intensity (0-1.5)</div>
        </div>
      </div>
    </div>
  );
}

