interface SettingsPageLayoutProps {
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function SettingsPageLayout({ title, children, headerActions }: SettingsPageLayoutProps) {
  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
            {title}
          </h2>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

