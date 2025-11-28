import { CustomPalettesTab } from "@/components/Settings/CustomPalettesTab";

export function PalettesPage() {
  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Palettes
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full px-6">
          <CustomPalettesTab />
        </div>
      </div>
    </div>
  );
}

