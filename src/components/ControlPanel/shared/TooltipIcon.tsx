import { HelpCircle } from "lucide-react";

interface TooltipIconProps {
  id: string;
  text: string;
  label: string;
}

/**
 * TooltipIcon Component
 * 
 * Displays a help icon with a tooltip that appears on hover.
 * Uses standard tooltip styling.
 */
export function TooltipIcon({ id, text, label }: TooltipIconProps) {
  return (
    <span className="retro-tooltip">
      <button
        type="button"
        className="tooltip-trigger"
        aria-describedby={id}
        aria-label={`Information about ${label}`}
      >
        <HelpCircle className="h-5 w-5" strokeWidth={1} />
      </button>
      <span id={id} role="tooltip" className="tooltip-content">
        {text}
      </span>
    </span>
  );
}

