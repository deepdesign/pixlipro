import { Info } from "lucide-react";

interface TooltipIconProps {
  id: string;
  text: string;
  label: string;
}

export function TooltipIcon({ id, text, label }: TooltipIconProps) {
  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="tooltip-trigger"
        aria-label={`${label} - ${text}`}
        aria-describedby={id}
        data-tooltip-id={id}
      >
        <Info className="tooltip-icon" />
      </button>
      <span id={id} className="tooltip-text" role="tooltip">
        {text}
      </span>
    </span>
  );
}

