import { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/Settings/SettingsSidebar";
import { SettingsBreadcrumb } from "@/components/Settings/SettingsBreadcrumb";
import { SettingsSectionWrapper } from "@/components/Settings/SettingsSectionWrapper";
import { DisplayTab } from "@/components/Settings/DisplayTab";
import { RemoteControlTab } from "@/components/Settings/RemoteControlTab";
import { IntegrationsTab } from "@/components/Settings/IntegrationsTab";
import { PerformanceTab } from "@/components/Settings/PerformanceTab";
import { ThemeTab } from "@/components/Settings/ThemeTab";
import { AnimationPage } from "@/pages/AnimationPage";
import { SpritesPage } from "@/pages/SpritesPage";
import { PalettesPage } from "@/pages/PalettesPage";
import { ScenesPage } from "@/pages/ScenesPage";
import { SequencesPage } from "@/pages/SequencesPage";
import { PerformPage } from "@/pages/PerformPage";
import { SettingsFooter } from "@/components/Footer/SettingsFooter";
import type { AppSettings } from "@/lib/storage/settingsStorage";
import type { GeneratorState } from "@/types/generator";
import type { Sequence } from "@/lib/storage/sequenceStorage";

interface PersistedPerformState {
  selectedSequence: Sequence | null;
  playbackState: "stopped" | "playing" | "paused";
  currentIndex: number;
  previewState: GeneratorState | null;
}

interface SettingsPageProps {
  onClose: () => void;
  onAspectRatioChange?: (aspectRatio: AppSettings["aspectRatio"], custom?: { width: number; height: number }) => void;
  onLoadPreset?: (state: GeneratorState) => void;
  currentState?: GeneratorState | null;
  frameRate?: number;
  ready?: boolean;
  webSocketState?: {
    connected: boolean;
    connecting: boolean;
    error: string | null;
    clients: number;
  };
  initialSection?: string;
  performState?: PersistedPerformState;
  onPerformStateChange?: (state: PersistedPerformState) => void;
}

export const SettingsPage = ({ 
  onClose, 
  onAspectRatioChange, 
  onLoadPreset,
  currentState,
  frameRate = 60, 
  ready = false, 
  webSocketState,
  initialSection = "display",
  performState,
  onPerformStateChange,
}: SettingsPageProps) => {
  // Get initial section from URL or props
  const getInitialSection = () => {
    if (initialSection) return initialSection;
    const path = window.location.pathname;
    const match = path.match(/^\/settings(?:\/([^/]+))?/);
    return match?.[1] || "display";
  };

  const [activeSection, setActiveSection] = useState<string>(getInitialSection());

  // Update section from URL changes
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/settings(?:\/([^/]+))?/);
      const section = match?.[1] || "display";
      setActiveSection(section);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Update URL without reload
    window.history.pushState({}, "", `/settings/${section}`);
  };

  const renderContent = () => {

    switch (activeSection) {
      case "animation":
        return <AnimationPage />;
      case "sprites":
        return <SpritesPage />;
      case "palettes":
        return <PalettesPage />;
      case "presets":
      case "scenes":
        return <ScenesPage currentState={currentState} onLoadScene={onLoadPreset} />;
      case "sequences":
        return <SequencesPage currentState={currentState} onLoadPreset={onLoadPreset} />;
      case "perform":
        return (
          <PerformPage
            currentState={currentState}
            onLoadScene={onLoadPreset}
            initialSequenceId={typeof window !== "undefined" ? sessionStorage.getItem("performSequenceId") || undefined : undefined}
            persistedState={performState}
            onStateChange={onPerformStateChange}
          />
        );
      case "display":
        return (
          <SettingsSectionWrapper title="Display">
            <DisplayTab onAspectRatioChange={onAspectRatioChange} />
          </SettingsSectionWrapper>
        );
      case "remote-control":
        return (
          <SettingsSectionWrapper title="Remote Control">
            <RemoteControlTab 
              webSocketState={webSocketState}
              onConnectionChange={(_connected) => {
                // Connection status is managed by useWebSocket hook
              }}
            />
          </SettingsSectionWrapper>
        );
      case "integrations":
        return (
          <SettingsSectionWrapper title="Integrations">
            <IntegrationsTab />
          </SettingsSectionWrapper>
        );
      case "performance":
        return (
          <SettingsSectionWrapper title="Performance">
            <PerformanceTab frameRate={frameRate} ready={ready} />
          </SettingsSectionWrapper>
        );
      case "theme":
        return (
          <SettingsSectionWrapper title="Theme">
            <ThemeTab />
          </SettingsSectionWrapper>
        );
      default:
        return (
          <SettingsSectionWrapper title="Display">
            <DisplayTab onAspectRatioChange={onAspectRatioChange} />
          </SettingsSectionWrapper>
        );
    }
  };

  return (
    <div className="relative isolate flex h-svh w-full flex-col bg-theme-bg-base">
      {/* Main content area with sidebar */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 border-r border-theme-structural bg-theme-bg-base flex-shrink-0">
          <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        </div>

        {/* Content area */}
        <main className="flex-1 min-w-0 flex flex-col bg-theme-bg-base overflow-hidden" style={{ transition: 'none' }}>
          <div className="w-full flex-1 flex flex-col min-h-0" style={{ transition: 'none' }}>
            {/* Breadcrumb - at top of main container */}
            <div className="w-full py-4 px-6 border-b border-theme-structural bg-theme-bg-base flex-shrink-0">
              <SettingsBreadcrumb onNavigateHome={onClose} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-scroll min-h-0">
              {renderContent()}
            </div>
            
            {/* Footer - sticks to bottom */}
            <div className="w-full mt-auto flex-shrink-0" style={{ transition: 'none' }}>
              <div className="mt-6 pt-6 pb-4 px-6 border-t border-theme-structural">
              <SettingsFooter />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
