import { 
  PlayCircle, 
  Shapes, 
  Palette, 
  Bookmark, 
  List, 
  Monitor, 
  Smartphone, 
  Plug, 
  Zap,
  Paintbrush,
  Radio
} from "lucide-react";
import { 
  Sidebar, 
  SidebarBody, 
  SidebarSection, 
  SidebarHeading, 
  SidebarItem, 
  SidebarLabel 
} from "@/components/ui/sidebar";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "data-slot"?: string }>;
}

const contentManagementItems: NavItem[] = [
  { id: "animation", label: "Animation", icon: PlayCircle },
  { id: "sprites", label: "Sprites", icon: Shapes },
  { id: "palettes", label: "Palettes", icon: Palette },
  { id: "presets", label: "Scenes", icon: Bookmark },
  { id: "sequences", label: "Sequences", icon: List },
  { id: "perform", label: "Perform", icon: Radio },
];

const configurationItems: NavItem[] = [
  { id: "display", label: "Display", icon: Monitor },
  { id: "remote-control", label: "Remote Control", icon: Smartphone },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "theme", label: "Theme", icon: Paintbrush },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <Sidebar className="settings-sidebar-nav bg-theme-panel [&_*[data-slot='icon']]:!fill-none [&_*[data-slot='icon']]:stroke-2">
      <SidebarBody>
        {/* Canvas Section */}
        <SidebarSection>
          <SidebarHeading className="field-label">Canvas</SidebarHeading>
          {contentManagementItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.id}
                current={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon data-slot="icon" className="stroke-current" />
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        {/* Configuration Section */}
        <SidebarSection>
          <SidebarHeading className="field-label">Configuration</SidebarHeading>
          {configurationItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.id}
                current={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon data-slot="icon" className="stroke-current" />
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  );
}

