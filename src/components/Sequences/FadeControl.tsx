import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Label } from "@/components/catalyst/fieldset";
import type { FadeType } from "@/lib/storage/sequenceStorage";

interface FadeControlProps {
  fadeType?: FadeType;
  defaultFadeType: FadeType;
  onChange: (fadeType?: FadeType) => void;
}

const FADE_LABELS: Record<FadeType, string> = {
  cut: "Hard cut",
  crossfade: "Crossfade",
  fadeToBlack: "Fade to black",
  custom: "Custom",
};

export function FadeControl({
  fadeType,
  defaultFadeType,
  onChange,
}: FadeControlProps) {
  const value = fadeType || "default";

  const handleChange = (newValue: string) => {
    if (newValue === "default") {
      onChange(undefined);
    } else {
      onChange(newValue as FadeType);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
        Fade
      </Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {value === "default"
              ? `Use sequence default (${FADE_LABELS[defaultFadeType]})`
              : FADE_LABELS[fadeType!]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            Use sequence default ({FADE_LABELS[defaultFadeType]})
          </SelectItem>
          <SelectItem value="cut">{FADE_LABELS.cut}</SelectItem>
          <SelectItem value="crossfade">{FADE_LABELS.crossfade}</SelectItem>
          <SelectItem value="fadeToBlack">{FADE_LABELS.fadeToBlack}</SelectItem>
          <SelectItem value="custom">{FADE_LABELS.custom}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

