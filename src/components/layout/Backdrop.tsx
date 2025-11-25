import { useSidebar } from "@/context/SidebarContext";

export const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 lg:hidden"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 60%, transparent)' }}
      onClick={toggleMobileSidebar}
      aria-hidden="true"
    />
  );
};

