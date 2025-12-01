import { 
  PlayCircle, 
  Shapes, 
  Palette, 
  Bookmark, 
  List, 
  Monitor, 
  Smartphone, 
  Plug, 
  Zap
} from "lucide-react";
import { 
  Sidebar, 
  SidebarBody, 
  SidebarSection, 
  SidebarHeading, 
  SidebarItem, 
  SidebarLabel 
} from "@/components/catalyst/sidebar";

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
  { id: "presets", label: "Presets", icon: Bookmark },
  { id: "sequences", label: "Sequences", icon: List },
];

const configurationItems: NavItem[] = [
  { id: "display", label: "Display", icon: Monitor },
  { id: "remote-control", label: "Remote Control", icon: Smartphone },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "performance", label: "Performance", icon: Zap },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <Sidebar className="settings-sidebar-nav bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 [&_*[data-slot='icon']]:fill-none [&_*[data-slot='icon']]:stroke-current">
      <SidebarBody>
        {/* Canvas Section */}
        <SidebarSection>
          <SidebarHeading>Canvas</SidebarHeading>
          {contentManagementItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.id}
                current={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon data-slot="icon" className="fill-none stroke-current" />
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        {/* Configuration Section */}
        <SidebarSection>
          <SidebarHeading>Configuration</SidebarHeading>
          {configurationItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.id}
                current={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon data-slot="icon" className="fill-none stroke-current" />
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  );
}

