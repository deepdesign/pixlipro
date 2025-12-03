import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Fieldset";
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
      <Label className="text-xs font-medium text-theme-muted">
        Duration
      </Label>
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("seconds")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            durationMode === "seconds"
              ? "bg-theme-primary text-theme-primary-contrast"
              : "bg-theme-icon text-theme-muted hover:bg-theme-icon/80"
          }`}
        >
          Duration
        </button>
        <button
          onClick={() => handleModeChange("manual")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            durationMode === "manual"
              ? "bg-theme-primary text-theme-primary-contrast"
              : "bg-theme-icon text-theme-muted hover:bg-theme-icon/80"
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSecondsChange(e.target.value)}
            className="w-24"
            placeholder="0"
          />
          <span className="text-sm text-theme-muted">
            seconds
          </span>
        </div>
      ) : (
        <p className="text-xs text-theme-muted">
          Advances when manually triggered
        </p>
      )}
    </div>
  );
}

