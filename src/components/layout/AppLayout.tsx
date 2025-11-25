import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Backdrop } from "./Backdrop";
import { AppSidebar } from "./AppSidebar";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  sidebarProps: React.ComponentProps<typeof AppSidebar>;
}

const LayoutContent: React.FC<AppLayoutProps> = ({ children, sidebarProps }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="flex flex-1 lg:flex-row pb-[var(--footer-height)]">
      <div className="lg:flex-shrink-0">
        <AppSidebar {...sidebarProps} />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[370px]" : "lg:ml-[64px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {children}
      </div>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, sidebarProps }) => {
  return (
    <SidebarProvider>
      <LayoutContent sidebarProps={sidebarProps}>{children}</LayoutContent>
    </SidebarProvider>
  );
};

