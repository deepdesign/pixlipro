interface SettingsSectionWrapperProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSectionWrapper({ title, children }: SettingsSectionWrapperProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-6 py-4 mb-6">
        <h2 className="text-xl font-semibold text-theme-primary">
          {title}
        </h2>
      </div>

      {/* Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

