import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/catalyst/input";
import { getAllPresets, type Preset } from "@/lib/storage/presetStorage";
import type { GeneratorState } from "@/types/generator";
import { Plus, Upload, Search } from "lucide-react";

interface PresetLibraryPanelProps {
  presets: Preset[];
  onAddPreset: (preset: Preset | GeneratorState) => void;
}

export function PresetLibraryPanel({
  presets,
  onAddPreset,
}: PresetLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPresets = presets.filter((preset) =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const presetData = JSON.parse(json) as GeneratorState;
          // Validate it's a GeneratorState-like object
          if (presetData && typeof presetData === "object") {
            onAddPreset(presetData);
          } else {
            alert("Invalid preset JSON format");
          }
        } catch (error) {
          alert("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onAddPreset]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Preset library
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpload}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload JSON preset
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredPresets.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {searchQuery ? "No presets found" : "No presets available"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                    {preset.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Linked preset
                  </div>
                </div>
                <Button
                  variant="naked"
                  size="icon"
                  onClick={() => onAddPreset(preset)}
                  title="Add to sequence"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

