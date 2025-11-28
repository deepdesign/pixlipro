import { useCallback, ChangeEvent } from "react";
import { TooltipIcon } from "./TooltipIcon";
import { cn } from "@/lib/utils";

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
 * 
 * Using native HTML range input styled to match Radix UI slider exactly.
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
  
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (Number.isFinite(newValue)) {
        onChange(newValue);
      }
    },
    [onChange],
  );

  const percentage = ((sliderValue - min) / (max - min)) * 100;
  // Thumb width is 18px (1.125rem), so half-width is 9px
  // Account for thumb center position: fill should extend to thumb center
  // The thumb is positioned at percentage, so fill extends to that percentage
  // No adjustment needed - native range input positions thumb center at percentage

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
      <div className={cn(
        "relative flex w-full touch-none select-none items-center",
        "min-h-[1.125rem] pt-[0.1875rem] pb-[0.1875rem] -mt-[0.1875rem] -mb-[0.1875rem]",
        "control-slider" // Keep for pseudo-element styling (thumb)
      )}>
        {/* Track background with filled range inside */}
        <div className={cn(
          "relative h-2 w-full grow overflow-visible rounded-sm",
          "bg-slate-100",
          "dark:bg-slate-800"
        )}>
          {/* Filled range - positioned inside track, extends to thumb center */}
          <div 
            className={cn(
              "absolute h-full rounded-sm left-0 top-0",
              "bg-[var(--accent-primary)]"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Native range input for interaction */}
        <input
          type="range"
          id={id}
          className={cn(
            "absolute inset-0 w-full h-full",
            "appearance-none bg-transparent cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={handleChange}
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={tooltipId ? `${tooltipId}` : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={sliderValue}
          aria-valuetext={displayValue}
        />
      </div>
    </div>
  );
}