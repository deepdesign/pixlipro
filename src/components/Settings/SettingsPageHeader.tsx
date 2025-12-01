interface SettingsPageHeaderProps {
  title: string;
}

export function SettingsPageHeader({ title }: SettingsPageHeaderProps) {
  return (
    <div className="px-6 py-4">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
        {title}
      </h2>
    </div>
  );
}

