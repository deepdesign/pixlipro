import { useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/Button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/retroui/Select";
import { MobileMenu } from "@/components/MobileMenu";
import { BitlabLogo } from "./BitlabLogo";
import { useHeaderOverflow } from "@/hooks/useHeaderOverflow";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  THEME_COLOR_OPTIONS,
  THEME_COLOR_PREVIEW,
  type ThemeColor,
} from "@/constants/theme";
import { Moon, Monitor, Sun } from "lucide-react";
import type { CSSProperties } from "react";

interface HeaderProps {
  themeMode: "system" | "light" | "dark";
  themeColor: ThemeColor;
  themeShape: "box" | "rounded";
  onThemeModeChange: (mode: "system" | "light" | "dark") => void;
  onThemeColorChange: (color: ThemeColor) => void;
  onThemeShapeChange: (shape: "box" | "rounded") => void;
}

export function Header({
  themeMode,
  themeColor,
  themeShape,
  onThemeModeChange,
  onThemeColorChange,
  onThemeShapeChange,
}: HeaderProps) {
  const isMobile = useIsMobile();
  const headerToolbarRef = useRef<HTMLDivElement | null>(null);
  const headerActionsRef = useRef<HTMLDivElement | null>(null);

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

  const cycleThemeShape = useCallback(() => {
    onThemeShapeChange(themeShape === "box" ? "rounded" : "box");
  }, [themeShape, onThemeShapeChange]);

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

  const handleThemeSelect = useCallback(
    (value: string) => {
      const validColors = [
        "amber",
        "mint",
        "violet",
        "ember",
        "lagoon",
        "rose",
        "battleship",
        "cyan",
        "midnight",
        "indigo",
        "gold",
      ];
      if (validColors.includes(value)) {
        onThemeColorChange(value as ThemeColor);
      }
    },
    [onThemeColorChange],
  );

  const handleShapeSelect = useCallback(
    (value: string) => {
      onThemeShapeChange(value === "rounded" ? "rounded" : "box");
    },
    [onThemeShapeChange],
  );

  return (
    <header className={`app-header${isMobile ? " app-header--mobile" : ""}`}>
      {isMobile ? (
        <div className="app-header-mobile-row">
          <button
            type="button"
            className="app-logo-button app-logo-button--mobile"
            aria-label="BitLab"
          >
            <BitlabLogo className="app-logo-svg" />
          </button>
          <MobileMenu
            themeColor={themeColor}
            themeShape={themeShape}
            themeModeText={themeModeText}
            ThemeModeIcon={ThemeModeIconComponent}
            onThemeColorChange={handleThemeSelect}
            onThemeShapeChange={handleShapeSelect}
            onThemeModeCycle={cycleThemeMode}
            themeColorOptions={THEME_COLOR_OPTIONS}
            themeColorPreview={THEME_COLOR_PREVIEW}
          />
        </div>
      ) : (
        <>
          <button type="button" className="app-logo-button" aria-label="BitLab">
            <BitlabLogo className="app-logo-svg" />
          </button>
          <div className="header-toolbar" ref={headerToolbarRef}>
            <div className="header-spacer"></div>
            {showHeaderOverflow ? (
              <div className="header-actions header-actions--overflow">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="header-icon-button header-overflow-trigger"
                  onClick={() => setIsHeaderOverflowOpen((prev) => !prev)}
                  aria-label="Theme options"
                  aria-expanded={isHeaderOverflowOpen}
                  ref={headerOverflowTriggerRef}
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ display: "block" }}
                    aria-hidden="true"
                  >
                    <line x1={3} y1={6} x2={21} y2={6} />
                    <line x1={3} y1={12} x2={21} y2={12} />
                    <line x1={3} y1={18} x2={21} y2={18} />
                  </svg>
                </Button>
                {isHeaderOverflowOpen && (
                  <div
                    className="header-overflow-popover"
                    role="dialog"
                    aria-label="Theme options"
                  >
                    <div className="header-overflow-content">
                      <Select value={themeColor} onValueChange={handleThemeSelect}>
                        <SelectTrigger
                          className="header-theme-trigger"
                          aria-label="Theme colour"
                        >
                          <SelectValue placeholder="Theme">
                            {THEME_COLOR_OPTIONS.find(
                              (option) => option.value === themeColor,
                            )?.label ?? "Theme"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="header-theme-menu">
                          <SelectGroup>
                            {THEME_COLOR_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="header-theme-item"
                                style={
                                  {
                                    "--theme-preview": THEME_COLOR_PREVIEW[option.value],
                                  } as CSSProperties
                                }
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="header-icon-button"
                        onClick={cycleThemeShape}
                        aria-label={`Switch theme shape (current ${themeShape === "rounded" ? "rounded" : "box"})`}
                        title={`Shape: ${themeShape === "rounded" ? "Rounded" : "Box"}`}
                      >
                        {themeShape === "rounded" ? (
                          <svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            style={{ display: "block" }}
                            aria-hidden="true"
                          >
                            <rect x={4} y={4} width={16} height={16} rx={3} ry={3} />
                          </svg>
                        ) : (
                          <svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            style={{ display: "block" }}
                            aria-hidden="true"
                          >
                            <rect x={4} y={4} width={16} height={16} />
                          </svg>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="header-icon-button"
                        onClick={cycleThemeMode}
                        aria-label={`Switch theme mode (current ${themeModeText})`}
                        title={`Theme: ${themeModeText}`}
                      >
                        <ThemeModeIconComponent className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-actions" ref={headerActionsRef}>
                <Select value={themeColor} onValueChange={handleThemeSelect}>
                  <SelectTrigger
                    className="header-theme-trigger"
                    aria-label="Theme colour"
                  >
                    <SelectValue placeholder="Theme">
                      {THEME_COLOR_OPTIONS.find(
                        (option) => option.value === themeColor,
                      )?.label ?? "Theme"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="header-theme-menu">
                    <SelectGroup>
                      {THEME_COLOR_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="header-theme-item"
                          style={
                            {
                              "--theme-preview": THEME_COLOR_PREVIEW[option.value],
                            } as CSSProperties
                          }
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="header-icon-button"
                  onClick={cycleThemeShape}
                  aria-label={`Switch theme shape (current ${themeShape === "rounded" ? "rounded" : "box"})`}
                  title={`Shape: ${themeShape === "rounded" ? "Rounded" : "Box"}`}
                >
                  {themeShape === "rounded" ? (
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ display: "block" }}
                      aria-hidden="true"
                    >
                      <rect x={4} y={4} width={16} height={16} rx={3} ry={3} />
                    </svg>
                  ) : (
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ display: "block" }}
                      aria-hidden="true"
                    >
                      <rect x={4} y={4} width={16} height={16} />
                    </svg>
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="header-icon-button"
                  onClick={cycleThemeMode}
                  aria-label={`Switch theme mode (current ${themeModeText})`}
                  title={`Theme: ${themeModeText}`}
                >
                  <ThemeModeIconComponent className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}

