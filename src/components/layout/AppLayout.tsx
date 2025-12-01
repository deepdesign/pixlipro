import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Backdrop } from "./Backdrop";
import { AppSidebar } from "./AppSidebar";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  sidebarProps: React.ComponentProps<typeof AppSidebar>;
  hideSidebar?: boolean;
}

const LayoutContent: React.FC<AppLayoutProps> = ({ children, sidebarProps, hideSidebar = false }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  
  // When on settings page, right column is hidden, so always use 64px margin
  const isSettingsPage = sidebarProps.currentPage === "settings";
  const effectiveExpanded = isExpanded || isHovered;
  const shouldUseWideMargin = !isSettingsPage && effectiveExpanded;

  return (
    <div className="flex flex-1 lg:flex-row h-full">
      {!hideSidebar && (
        <div className="lg:flex-shrink-0">
          <AppSidebar {...sidebarProps} />
          <Backdrop />
        </div>
      )}
      <div
        className={`flex-1 min-w-0 h-full border-t border-slate-200 dark:border-slate-800 ${
          hideSidebar 
            ? "lg:ml-0" 
            : shouldUseWideMargin
              ? "lg:ml-[370px]" 
              : "lg:ml-[64px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {children}
      </div>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, sidebarProps, hideSidebar = false }) => {
  return (
    <SidebarProvider>
      <LayoutContent sidebarProps={sidebarProps} hideSidebar={hideSidebar}>{children}</LayoutContent>
    </SidebarProvider>
  );
};

