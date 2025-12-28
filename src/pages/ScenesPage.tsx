import { ScenesTab } from "@/components/Settings/ScenesTab";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";
import type { GeneratorState } from "@/types/generator";
import type { SpriteController } from "@/generator";

interface ScenesPageProps {
  currentState?: GeneratorState | null;
  onLoadScene?: (state: GeneratorState) => void;
  controller?: SpriteController | null;
}

export function ScenesPage({ currentState, onLoadScene, controller }: ScenesPageProps) {
  return (
    <SettingsPageLayout title="Scenes">
      <ScenesTab 
        currentState={currentState}
        onLoadScene={onLoadScene}
        controller={controller}
      />
    </SettingsPageLayout>
  );
}

