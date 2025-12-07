interface SettingsPageLayoutProps {
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function SettingsPageLayout({ title, children, headerActions }: SettingsPageLayoutProps) {
  return (
    <div className="h-full w-full flex flex-col bg-theme-bg-base min-h-0">
      {/* Header */}
      <div className="px-6 py-3 mb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-theme-primary">
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
      <div className="flex-1 pb-6 bg-theme-bg-base min-h-0">
        <div className="w-full px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

