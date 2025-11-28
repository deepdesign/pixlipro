import { useState, useEffect } from "react";
import { Input } from "@/components/catalyst/input";
import { Label } from "@/components/catalyst/fieldset";
import type { DurationMode } from "@/lib/storage/sequenceStorage";

interface DurationControlProps {
  durationMode: DurationMode;
  durationSeconds?: number;
  onChange: (mode: DurationMode, seconds?: number) => void;
}

export function DurationControl({
  durationMode,
  durationSeconds = 0,
  onChange,
}: DurationControlProps) {
  const [localSeconds, setLocalSeconds] = useState(
    durationSeconds?.toString() || "0"
  );

  useEffect(() => {
    setLocalSeconds(durationSeconds?.toString() || "0");
  }, [durationSeconds]);

  const handleModeChange = (mode: DurationMode) => {
    if (mode === "seconds") {
      onChange(mode, parseFloat(localSeconds) || 0);
    } else {
      onChange(mode);
    }
  };

  const handleSecondsChange = (value: string) => {
    setLocalSeconds(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange("seconds", numValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
        Duration
      </Label>
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("seconds")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            durationMode === "seconds"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          Duration
        </button>
        <button
          onClick={() => handleModeChange("manual")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            durationMode === "manual"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          Manual advance
        </button>
      </div>
      {durationMode === "seconds" ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={localSeconds}
            onChange={(e) => handleSecondsChange(e.target.value)}
            className="w-24"
            placeholder="0"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            seconds
          </span>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Advances when manually triggered
        </p>
      )}
    </div>
  );
}

