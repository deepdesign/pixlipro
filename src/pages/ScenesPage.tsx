import { ScenesTab } from "@/components/Settings/ScenesTab";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";
import type { GeneratorState } from "@/types/generator";

interface ScenesPageProps {
  currentState?: GeneratorState | null;
  onLoadScene?: (state: GeneratorState) => void;
}

export function ScenesPage({ currentState, onLoadScene }: ScenesPageProps) {
  return (
    <SettingsPageLayout title="Scenes">
      <ScenesTab 
        currentState={currentState}
        onLoadScene={onLoadScene}
      />
    </SettingsPageLayout>
  );
}

