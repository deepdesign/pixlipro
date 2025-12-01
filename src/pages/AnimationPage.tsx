import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";

export function AnimationPage() {
  return (
    <SettingsPageLayout title="Animation">
      <div className="w-full">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Animation controls and settings coming soon...
          </p>
        </div>
      </div>
    </SettingsPageLayout>
  );
}

