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
  const totalSeconds = durationSeconds || 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  const [localMinutes, setLocalMinutes] = useState(minutes.toString());
  const [localSeconds, setLocalSeconds] = useState(seconds.toString().padStart(2, '0'));

  useEffect(() => {
    const total = durationSeconds || 0;
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    setLocalMinutes(mins.toString());
    setLocalSeconds(secs.toString().padStart(2, '0'));
  }, [durationSeconds]);

  const handleModeChange = (mode: DurationMode) => {
    if (mode === "seconds") {
      const mins = parseInt(localMinutes) || 0;
      const secs = parseInt(localSeconds) || 0;
      const total = mins * 60 + secs;
      onChange(mode, total);
    } else {
      onChange(mode);
    }
  };

  const handleMinutesChange = (value: string) => {
    // Only allow digits, max 3 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 3);
    setLocalMinutes(digitsOnly);
    const mins = parseInt(digitsOnly) || 0;
    const secs = parseInt(localSeconds) || 0;
    const total = mins * 60 + secs;
    onChange("seconds", total);
  };

  const handleSecondsChange = (value: string) => {
    // Only allow digits, max 2 characters, pad with leading zero
    const digitsOnly = value.replace(/\D/g, '').slice(0, 2);
    const padded = digitsOnly.padStart(2, '0');
    setLocalSeconds(padded);
    const mins = parseInt(localMinutes) || 0;
    const secs = parseInt(padded) || 0;
    const total = mins * 60 + secs;
    onChange("seconds", total);
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
            type="text"
            inputMode="numeric"
            value={localMinutes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMinutesChange(e.target.value)}
            className="w-6 text-center text-sm"
            placeholder="0"
            maxLength={3}
          />
          <span className="text-sm text-theme-muted">:</span>
          <Input
            type="text"
            inputMode="numeric"
            value={localSeconds}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSecondsChange(e.target.value)}
            className="w-5 text-center text-sm"
            placeholder="00"
            maxLength={2}
          />
          <span className="text-sm text-theme-muted">
            (mm:ss)
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

