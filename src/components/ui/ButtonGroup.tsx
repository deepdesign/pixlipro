import clsx from 'clsx'

export interface ButtonGroupOption {
  value: string;
  label: string;
}

export interface ButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: ButtonGroupOption[];
  className?: string;
  disabled?: boolean;
}

/**
 * Segmented button group component
 */
export const ButtonGroup = ({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: ButtonGroupProps) => {
  return (
    <div className={clsx("inline-flex rounded-lg border border-[var(--select-border)] p-0.5", className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={clsx(
              "relative rounded-md px-3 py-1.5 text-sm font-semibold transition",
              "focus:outline-none",
              isSelected
                ? "bg-[var(--theme-supporting-light)] text-[var(--text-primary)] shadow-sm dark:bg-theme-card dark:text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};


