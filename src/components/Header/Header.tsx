import { useMemo, useCallback } from "react";
import { Button } from "@/components/Button";
import { MobileMenu } from "@/components/MobileMenu";
import { PixliLogo } from "./PixliLogo";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSidebar } from "@/context/SidebarContext";
import { Moon, Monitor, Sun, Settings, Menu, X, Sparkles, Bookmark, List, Palette } from "lucide-react";
import { Navbar, NavbarSection, NavbarSpacer } from "@/components/catalyst/navbar";
interface HeaderProps {
  themeMode: "system" | "light" | "dark";
  onThemeModeChange: (mode: "system" | "light" | "dark") => void;
  onOpenSettings?: () => void;
  onNavigate?: (page: "create" | "palettes" | "presets" | "sequences" | "settings") => void;
  currentPage?: "create" | "palettes" | "presets" | "sequences" | "settings" | null;
}

export function Header({
  themeMode,
  onThemeModeChange,
  onOpenSettings,
  onNavigate,
  currentPage,
}: HeaderProps) {
  const isMobile = useIsMobile();
  
  // Sidebar context (may not be available if not wrapped in SidebarProvider)
  let sidebarContext: ReturnType<typeof useSidebar> | null = null;
  try {
    sidebarContext = useSidebar();
  } catch {
    // Sidebar context not available, sidebar toggle won't work
  }
  
  const handleSidebarToggle = () => {
    if (!sidebarContext) return;
    if (window.innerWidth >= 1024) {
      sidebarContext.toggleSidebar();
    } else {
      sidebarContext.toggleMobileSidebar();
    }
  };

  const cycleThemeMode = useCallback(() => {
    onThemeModeChange(
      themeMode === "system" ? "light" : themeMode === "light" ? "dark" : "system",
    );
  }, [themeMode, onThemeModeChange]);

  const themeModeText = useMemo(() => {
    switch (themeMode) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  }, [themeMode]);

  const ThemeModeIcon = useMemo(() => {
    switch (themeMode) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      default:
        return Monitor;
    }
  }, [themeMode]);

  const ThemeModeIconComponent = ThemeModeIcon;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 min-h-[64px] flex flex-col">
      <Navbar className="px-4 py-4 pb-0 flex-1 items-end">
        {/* Left section: Sidebar toggle (desktop) and Logo */}
        <NavbarSection>
          {sidebarContext && !isMobile && (
            <Button
              type="button"
              size="icon"
              variant="naked"
              onClick={handleSidebarToggle}
              aria-label="Toggle Sidebar"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" data-slot="icon" aria-hidden="true" />
            </Button>
          )}
          {sidebarContext && isMobile && (
            <Button
              type="button"
              size="icon"
              variant="naked"
              onClick={handleSidebarToggle}
              aria-label="Toggle Sidebar"
              className="lg:hidden"
            >
              {sidebarContext.isMobileOpen ? (
                <X className="h-5 w-5" data-slot="icon" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" data-slot="icon" aria-hidden="true" />
              )}
            </Button>
          )}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Pixli: generative art toy"
            className="p-1"
          >
            <PixliLogo className="h-24 w-24 sm:h-18 sm:w-18" />
          </a>
        </NavbarSection>

        {/* Center section: Navigation items */}
        {onNavigate && (
          <NavbarSection className="self-end">
            <nav className="flex items-end gap-1 -mb-px">
              <button
                type="button"
                onClick={() => onNavigate("create")}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  currentPage === "create"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("palettes")}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  currentPage === "palettes"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Palettes</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("presets")}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  currentPage === "presets"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Presets</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("sequences")}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  currentPage === "sequences"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Sequences</span>
              </button>
            </nav>
          </NavbarSection>
        )}

        {/* Spacer to push right section to the end */}
        <NavbarSpacer />

        {/* Right section: Settings and Theme toggle */}
        <NavbarSection>
          {onNavigate ? (
            <Button
              type="button"
              size="icon"
              variant={currentPage === "settings" ? "default" : "naked"}
              onClick={() => onNavigate("settings")}
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" data-slot="icon" aria-hidden="true" />
            </Button>
          ) : onOpenSettings ? (
            <Button
              type="button"
              size="icon"
              variant="naked"
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" data-slot="icon" aria-hidden="true" />
            </Button>
          ) : null}
          {isMobile ? (
            <MobileMenu
              themeModeText={themeModeText}
              ThemeModeIcon={ThemeModeIconComponent}
              onThemeModeCycle={cycleThemeMode}
            />
          ) : (
            <Button
              type="button"
              size="icon"
              variant="naked"
              onClick={cycleThemeMode}
              aria-label={`Switch theme mode (current ${themeModeText})`}
              title={`Theme: ${themeModeText}`}
            >
              <ThemeModeIconComponent className="h-5 w-5" data-slot="icon" aria-hidden="true" />
            </Button>
          )}
        </NavbarSection>
      </Navbar>
    </header>
  );
}

