import { PresetsTab } from "@/components/Settings/PresetsTab";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";
import type { GeneratorState } from "@/types/generator";

interface PresetsPageProps {
  currentState?: GeneratorState | null;
  onLoadPreset?: (state: GeneratorState) => void;
}

export function PresetsPage({ currentState, onLoadPreset }: PresetsPageProps) {
  return (
    <SettingsPageLayout title="Presets">
      <PresetsTab 
        currentState={currentState}
        onLoadPreset={onLoadPreset}
      />
    </SettingsPageLayout>
  );
}

