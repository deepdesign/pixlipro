import { CustomPalettesTab } from "@/components/Settings/CustomPalettesTab";
import { SettingsPageLayout } from "@/components/Settings/SettingsPageLayout";

export function PalettesPage() {
  return (
    <SettingsPageLayout title="Palettes">
      <CustomPalettesTab />
    </SettingsPageLayout>
  );
}

