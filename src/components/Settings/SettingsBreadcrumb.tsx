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
        className="inline-flex items-center gap-1.5 text-base font-semibold leading-none text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
        style={{ fontSize: '1rem', fontWeight: 600 }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Canvas
      </button>
      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
      <span 
        className="text-base font-semibold leading-none text-slate-900 dark:text-slate-50"
        style={{ fontSize: '1rem', fontWeight: 600 }}
      >
        Settings
      </span>
    </div>
  );
}

