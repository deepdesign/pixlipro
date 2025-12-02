import { ArrowLeft } from "lucide-react";

interface SettingsBreadcrumbProps {
  onNavigateHome: () => void;
}

export function SettingsBreadcrumb({ onNavigateHome }: SettingsBreadcrumbProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onNavigateHome}
        className="inline-flex items-center gap-1.5 text-base font-semibold leading-none text-theme-muted hover:text-theme-primary transition-colors"
        style={{ fontSize: '1rem', fontWeight: 600 }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Canvas
      </button>
      <div className="h-4 w-px bg-theme-border" />
      <span 
        className="text-base font-semibold leading-none text-theme-primary"
        style={{ fontSize: '1rem', fontWeight: 600 }}
      >
        Settings
      </span>
    </div>
  );
}

