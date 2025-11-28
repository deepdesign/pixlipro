import { Monitor, Zap, Smartphone, Plug } from "lucide-react";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import { useState } from "react";
import { DisplayTab } from "@/components/Settings/DisplayTab";
import { RemoteControlTab } from "@/components/Settings/RemoteControlTab";
import { IntegrationsTab } from "@/components/Settings/IntegrationsTab";
import { PerformanceTab } from "@/components/Settings/PerformanceTab";
import type { AppSettings } from "@/lib/storage/settingsStorage";
import type { GeneratorState } from "@/types/generator";

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
}

export const SettingsPage = ({ onClose, onAspectRatioChange, onLoadPreset, currentState, frameRate = 60, ready = false, webSocketState }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Page Title and Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-full">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Settings
          </h2>
          <nav>
            <ol className="flex items-center gap-1.5">
              <li>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Canvas
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
              <li className="text-sm text-gray-800 dark:text-white/90">
                Settings
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full px-6">
          {/* Tabs */}
          <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
            <TabList className="flex gap-8 border-b border-gray-200 dark:border-slate-800 mb-6">
              <Tab className={({ selected }) =>
                `px-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selected
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`
              }>
                <Monitor className="h-4 w-4" />
                Display
              </Tab>
              <Tab className={({ selected }) =>
                `px-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selected
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`
              }>
                <Smartphone className="h-4 w-4" />
                Remote control
              </Tab>
              <Tab className={({ selected }) =>
                `px-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selected
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`
              }>
                <Plug className="h-4 w-4" />
                Integrations
              </Tab>
              <Tab className={({ selected }) =>
                `px-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selected
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`
              }>
                <Zap className="h-4 w-4" />
                Performance
              </Tab>
            </TabList>

            <TabPanels>
              {/* Display Tab */}
              <TabPanel>
                <DisplayTab onAspectRatioChange={onAspectRatioChange} />
              </TabPanel>

              {/* Remote Control Tab */}
              <TabPanel>
                <RemoteControlTab 
                  webSocketState={webSocketState}
                  onConnectionChange={(connected) => {
                    // Connection status is managed by useWebSocket hook
                  }}
                />
              </TabPanel>

              {/* Integrations Tab */}
              <TabPanel>
                <IntegrationsTab />
              </TabPanel>

              {/* Performance Tab */}
              <TabPanel>
                <PerformanceTab frameRate={frameRate} ready={ready} />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
};
