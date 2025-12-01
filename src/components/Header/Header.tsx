import { Button } from "@/components/Button";
import { PixliLogo } from "./PixliLogo";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSidebar } from "@/context/SidebarContext";
import { Menu, X } from "lucide-react";
import { Navbar, NavbarSection } from "@/components/catalyst/navbar";
interface HeaderProps {
  themeMode?: "system" | "light" | "dark";
  onThemeModeChange?: (mode: "system" | "light" | "dark") => void;
  onOpenSettings?: () => void;
  onNavigate?: (page: "create" | "sprites" | "palettes" | "presets" | "sequences" | "settings" | "animation") => void;
  currentPage?: "create" | "sprites" | "palettes" | "presets" | "sequences" | "settings" | "animation" | null;
}

export function Header({
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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 min-h-[64px] flex flex-col" style={{ backgroundColor: 'var(--panel-bg)' }}>
      <Navbar className="px-4 py-4 pb-4 flex-1 items-end">
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
            <PixliLogo className="h-12 w-12 sm:h-9 sm:w-9" />
          </a>
        </NavbarSection>
      </Navbar>
    </header>
  );
}

