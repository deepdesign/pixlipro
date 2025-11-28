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
 * Segmented button group component with Catalyst styling
 */
export const ButtonGroup = ({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: ButtonGroupProps) => {
  return (
    <div className={clsx("inline-flex rounded-lg border border-slate-950/10 p-0.5 dark:border-white/10", className)}>
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
                ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white",
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


