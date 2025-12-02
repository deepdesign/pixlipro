interface SettingsPageHeaderProps {
  title: string;
}

export function SettingsPageHeader({ title }: SettingsPageHeaderProps) {
  return (
    <div className="px-6 py-4">
      <h2 className="text-xl font-semibold text-theme-primary">
        {title}
      </h2>
    </div>
  );
}

