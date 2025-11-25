import { useRef, useMemo, useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { MobileMenu } from "@/components/MobileMenu";
import { PixliLogo } from "./PixliLogo";
import { useHeaderOverflow } from "@/hooks/useHeaderOverflow";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSidebar } from "@/context/SidebarContext";
import { Moon, Monitor, Sun, HelpCircle, Settings, Menu, X } from "lucide-react";
// Help has moved under Settings; header Help menu removed

interface HeaderProps {
  themeMode: "system" | "light" | "dark";
  onThemeModeChange: (mode: "system" | "light" | "dark") => void;
  onOpenOnboarding?: () => void;
  onOpenSettings?: () => void;
}

export function Header({
  themeMode,
  onThemeModeChange,
  onOpenOnboarding,
  onOpenSettings,
}: HeaderProps) {
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const isMobile = useIsMobile();
  const headerToolbarRef = useRef<HTMLDivElement | null>(null);
  const headerActionsRef = useRef<HTMLDivElement | null>(null);
  
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

  const {
    showHeaderOverflow,
    isHeaderOverflowOpen,
    setIsHeaderOverflowOpen,
    headerOverflowTriggerRef,
  } = useHeaderOverflow(headerToolbarRef, headerActionsRef);

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
    <header className={`app-header sticky top-0 z-50 bg-[var(--bg-top)] border-b border-[var(--panel-border)]${isMobile ? " app-header--mobile" : ""}`}>
      {isMobile ? (
        <div className="app-header-mobile-row">
          {sidebarContext && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="icon-button header-icon-button lg:hidden"
              onClick={handleSidebarToggle}
              aria-label="Toggle Sidebar"
            >
              {sidebarContext.isMobileOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          )}
          <div
            className="app-logo-button app-logo-button--mobile"
            aria-label="Pixli: generative art toy"
          >
            <PixliLogo className="app-logo-svg" />
          </div>
          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="icon-button header-icon-button"
                onClick={onOpenSettings}
                aria-label="Open settings"
                title="Settings"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {onOpenOnboarding && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="icon-button header-icon-button"
                onClick={onOpenOnboarding}
                aria-label="Open help and onboarding"
                title="Help & Getting Started"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          <MobileMenu
            themeModeText={themeModeText}
            ThemeModeIcon={ThemeModeIconComponent}
            onThemeModeCycle={cycleThemeMode}
          />
          </div>
        </div>
      ) : (
        <>
          {sidebarContext && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="icon-button header-icon-button"
              onClick={handleSidebarToggle}
              aria-label="Toggle Sidebar"
              title="Toggle Sidebar"
            >
              {sidebarContext.isExpanded ? (
                <Menu className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          )}
          <div className="app-logo-button" aria-label="Pixli">
            <PixliLogo className="app-logo-svg" />
          </div>
          <div className="header-toolbar" ref={headerToolbarRef}>
            <div className="header-spacer"></div>
            <div className="header-actions" ref={headerActionsRef}>
              {onOpenSettings && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="icon-button header-icon-button"
                  onClick={onOpenSettings}
                  aria-label="Open settings"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              {onOpenOnboarding && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="icon-button header-icon-button"
                  onClick={onOpenOnboarding}
                  aria-label="Open help and onboarding"
                  title="Help & Getting Started"
                >
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="icon-button header-icon-button"
                onClick={cycleThemeMode}
                aria-label={`Switch theme mode (current ${themeModeText})`}
                title={`Theme: ${themeModeText}`}
              >
                <ThemeModeIconComponent className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Help menu removed; access Help via Settings */}
    </header>
  );
}

