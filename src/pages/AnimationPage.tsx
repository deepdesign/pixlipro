export function AnimationPage() {
  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Animation
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 text-center">
              <p className="text-gray-600 dark:text-slate-400">
                Animation controls and settings coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

