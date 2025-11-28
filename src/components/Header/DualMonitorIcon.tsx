import { Monitor } from "lucide-react";

/**
 * Dual Monitor Icon Component
 * 
 * Renders two Monitor icons side by side to represent dual monitor/projector mode
 */
export function DualMonitorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span className="relative inline-flex items-center" aria-hidden="true">
      <Monitor className={className} strokeWidth={2} />
      <Monitor className={`${className} -ml-1.5`} strokeWidth={2} />
    </span>
  );
}

