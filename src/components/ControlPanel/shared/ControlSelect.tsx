import { Button } from "@/components/Button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/ui/Select";
import { Lock, Unlock } from "lucide-react";
import { TooltipIcon } from "./TooltipIcon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCallback, useRef, useEffect, useState } from "react";

interface ControlSelectOption {
  value: string;
  label: string;
  category?: string;
  colors?: string[];
}

interface ControlSelectProps {
  id: string;
  label: string;
  options: ControlSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  tooltip?: string;
  currentLabel?: string;
  locked?: boolean;
  onLockToggle?: () => void;
  prefixButton?: React.ReactNode;
  suffixButton?: React.ReactNode;
}

/**
 * ControlSelect Component
 * 
 * A reusable select control with label, optional tooltip, lock button, and category grouping.
 * Supports color previews for palette options and custom prefix buttons.
 */
export function ControlSelect({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  tooltip,
  currentLabel,
  locked,
  onLockToggle,
  prefixButton,
  suffixButton,
}: ControlSelectProps) {
  const isMobile = useIsMobile();
  // Apply modal behavior to these dropdowns on mobile
  const isModalSelect = 
    id === "palette-presets" || 
    id === "movement-mode" || 
    id === "canvas-gradient" || 
    id === "background-mode" || 
    id === "blend-mode";
  const tooltipId = tooltip ? `${id}-tip` : undefined;
  const resolvedLabel =
    currentLabel ??
    options.find((option) => option.value === value)?.label ??
    placeholder ??
    "Select";

  // Track the current value prop to compare against
  const currentValueRef = useRef<string | null>(value);
  const onChangeRef = useRef(onChange);
  
  // Update refs when props change
  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Handler that only calls onChange if the value actually changed from the prop
  const handleValueChange = useCallback((newValue: string) => {
    // CRITICAL: Only call onChange if the new value is different from the current prop value
    // This prevents Radix UI initialization calls from triggering state updates
    if (newValue !== currentValueRef.current) {
      // Update ref immediately to prevent duplicate calls
      currentValueRef.current = newValue;
      // Call onChange - it will update state, which will update the prop, which will update currentValueRef
      onChangeRef.current(newValue);
    }
  }, []); // Stable callback - never changes

  // Separate options with and without categories
  const optionsWithCategories = options.filter((opt) => opt.category);
  const optionsWithoutCategories = options.filter((opt) => !opt.category);
  const hasCategories = optionsWithCategories.length > 0;

  const groupedOptions = hasCategories
    ? (() => {
        const categoryOrder = [
          "Neon/Cyber",
          "Warm/Fire",
          "Cool/Ocean",
          "Nature",
          "Soft/Pastel",
          "Dark/Mysterious",
        ];
        const groups = new Map<string, typeof options>();
        for (const option of optionsWithCategories) {
          const category = option.category || "Other";
          if (!groups.has(category)) {
            groups.set(category, []);
          }
          groups.get(category)!.push(option);
        }
        // Return ordered array of [category, options] pairs
        const ordered: Array<[string, typeof options]> = [];
        for (const category of categoryOrder) {
          if (groups.has(category)) {
            ordered.push([category, groups.get(category)!]);
          }
        }
        // Add any uncategorized groups
        for (const [category, categoryOptions] of groups.entries()) {
          if (!categoryOrder.includes(category)) {
            ordered.push([category, categoryOptions]);
          }
        }
        return ordered;
      })()
    : null;

  return (
    <div className="control-field">
      <div className="field-heading">
        <div className="field-heading-left">
          <span className="field-label" id={`${id}-label`}>
            {label}
          </span>
          {tooltip && tooltipId && (
            <TooltipIcon id={tooltipId} text={tooltip} label={label} />
          )}
        </div>
        {currentLabel ? (
          <span className="field-value">{currentLabel}</span>
        ) : null}
      </div>
      <div className="control-select-with-lock">
        <Select
          key={`${id}-${value}`}
          value={value ?? undefined}
          onValueChange={handleValueChange}
          disabled={disabled || locked}
        >
          <SelectTrigger 
            aria-labelledby={`${id}-label`}
            aria-describedby={tooltipId ? `${tooltipId}` : undefined}
            aria-disabled={disabled || locked}
          >
            <SelectValue placeholder={placeholder ?? "Select"}>
              {resolvedLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            modal={isMobile && isModalSelect}
            className={isMobile && isModalSelect ? "select-mobile-modal" : undefined}
          >
            <SelectGroup>
              {/* Render options without categories first (e.g., "auto" option) */}
              {optionsWithoutCategories.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
            {hasCategories && groupedOptions
              ? // Render with category groups
                groupedOptions.map(([category, categoryOptions]) => (
                  <SelectGroup key={category}>
                    <SelectLabel>
                      {category}
                    </SelectLabel>
                    {categoryOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        <span className="flex items-center gap-2">
                          {option.colors && (
                            <>
                              {option.colors.map((color, idx) => (
                                <span
                                  key={idx}
                                  className="control-select-color-square"
                                  style={{ backgroundColor: color }}
                                  aria-hidden="true"
                                />
                              ))}
                            </>
                          )}
                          <span className="control-select-item-label">
                            {option.label}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))
              : null}
            {/* Fallback: render without categories if no categories exist */}
            {!hasCategories && optionsWithoutCategories.length === 0 && (
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        {prefixButton}
        {suffixButton}
        {onLockToggle && (
          <Button
            type="button"
            size="icon"
            variant="lock"
            data-locked={locked}
            onClick={onLockToggle}
            disabled={disabled}
            className="control-lock-button"
            aria-label={locked ? "Unlock" : "Lock"}
            title={locked ? "Unlock this value" : "Lock this value"}
          >
            {locked ? (
            <Lock className="h-6 w-6" data-slot="icon" />
            ) : (
            <Unlock className="h-6 w-6" data-slot="icon" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
