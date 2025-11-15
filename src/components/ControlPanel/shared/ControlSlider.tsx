import { useCallback } from "react";
import { Slider } from "@/components/retroui/Slider";
import { TooltipIcon } from "./TooltipIcon";

interface ControlSliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  tooltip?: string;
}

/**
 * ControlSlider Component
 * 
 * A reusable slider control with label, value display, and optional tooltip.
 * Used throughout the control panels for numeric inputs.
 */
export function ControlSlider({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  disabled,
  tooltip,
}: ControlSliderProps) {
  const tooltipId = tooltip ? `${id}-tip` : undefined;
  const sliderValue = Number.isFinite(value) ? value : min;

  const handleSliderChange = useCallback(
    (values: number[]) => {
      if (!values.length) {
        return;
      }
      const [next] = values;
      if (!Number.isFinite(next)) {
        return;
      }
      const clamped = Math.min(max, Math.max(min, next));
      onChange(clamped);
    },
    [max, min, onChange],
  );

  return (
    <div className="control-field">
      <div className="field-heading">
        <div className="field-heading-left">
          <span className="field-label" id={`${id}-label`}>
            {label}
          </span>
          {tooltipId && (
            <TooltipIcon id={tooltipId} text={tooltip!} label={label} />
          )}
        </div>
        <span className="field-value">{displayValue}</span>
      </div>
      <Slider
        className="control-slider"
        value={[sliderValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
      />
    </div>
  );
}

