import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { Menu, X } from "lucide-react";

interface MobileMenuProps {
  themeModeText: string;
  ThemeModeIcon: React.ComponentType<{ className?: string }>;
  onThemeModeCycle: () => void;
}

export const MobileMenu = ({
  themeModeText,
  ThemeModeIcon,
  onThemeModeCycle,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="mobile-menu">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="icon-button header-icon-button"
        onClick={handleToggle}
        aria-label="Open menu"
        aria-expanded={isOpen}
        title="Menu"
      >
        {isOpen ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Menu className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
      {isOpen && (
        <div className="mobile-menu-overlay" onClick={handleClose}>
          <div
            className="mobile-menu-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile menu"
          >
            <div className="mobile-menu-header">
              <h2 className="mobile-menu-title">Menu</h2>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="icon-button"
                onClick={handleClose}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mobile-menu-actions">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  handleClose();
                  onThemeModeCycle();
                }}
                className="w-full justify-start gap-2"
              >
                <ThemeModeIcon className="h-4 w-4" />
                Theme: {themeModeText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
