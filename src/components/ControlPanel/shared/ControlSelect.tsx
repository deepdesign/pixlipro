import { Button } from "@/components/Button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/retroui/Select";
import { Lock, Unlock } from "lucide-react";
import { TooltipIcon } from "./TooltipIcon";

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
  onItemSelect?: (value: string) => void;
  onItemPointerDown?: (value: string) => void;
  locked?: boolean;
  onLockToggle?: () => void;
  prefixButton?: React.ReactNode;
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
  onItemSelect,
  onItemPointerDown,
  locked,
  onLockToggle,
  prefixButton,
}: ControlSelectProps) {
  const tooltipId = tooltip ? `${id}-tip` : undefined;
  const resolvedLabel =
    currentLabel ??
    options.find((option) => option.value === value)?.label ??
    placeholder ??
    "Select";

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
          value={value ?? undefined}
          onValueChange={onChange}
          disabled={disabled || locked}
        >
          <SelectTrigger aria-labelledby={`${id}-label`}>
            <SelectValue placeholder={placeholder ?? "Select"}>
              {resolvedLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {/* Render options without categories first (e.g., "auto" option) */}
              {optionsWithoutCategories.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  onSelect={
                    onItemSelect ? () => onItemSelect(option.value) : undefined
                  }
                  onPointerDown={
                    onItemPointerDown
                      ? (event) => {
                          if (
                            event.pointerType === "mouse" &&
                            event.button !== 0
                          ) {
                            return;
                          }
                          onItemPointerDown(option.value);
                        }
                      : undefined
                  }
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
            {hasCategories && groupedOptions
              ? // Render with category groups
                groupedOptions.map(([category, categoryOptions]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="control-select-category-label">
                      {category}
                    </SelectLabel>
                    {categoryOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        onSelect={
                          onItemSelect
                            ? () => onItemSelect(option.value)
                            : undefined
                        }
                        onPointerDown={
                          onItemPointerDown
                            ? (event) => {
                                if (
                                  event.pointerType === "mouse" &&
                                  event.button !== 0
                                ) {
                                  return;
                                }
                                onItemPointerDown(option.value);
                              }
                            : undefined
                        }
                        className={
                          option.colors
                            ? "control-dropdown-item-with-preview"
                            : undefined
                        }
                      >
                        {option.colors && (
                          <span className="control-select-color-preview">
                            {option.colors.map((color, idx) => (
                              <span
                                key={idx}
                                className="control-select-color-square"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                              />
                            ))}
                          </span>
                        )}
                        <span className="control-select-item-label">
                          {option.label}
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
                    onSelect={
                      onItemSelect ? () => onItemSelect(option.value) : undefined
                    }
                    onPointerDown={
                      onItemPointerDown
                        ? (event) => {
                            if (
                              event.pointerType === "mouse" &&
                              event.button !== 0
                            ) {
                              return;
                            }
                            onItemPointerDown(option.value);
                          }
                        : undefined
                    }
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        {prefixButton}
        {onLockToggle && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onLockToggle}
            disabled={disabled}
            className={
              locked
                ? "control-lock-button control-lock-button-locked"
                : "control-lock-button"
            }
            aria-label={locked ? "Unlock" : "Lock"}
            title={locked ? "Unlock this value" : "Lock this value"}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

