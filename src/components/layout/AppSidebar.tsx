import { useSidebar } from "@/context/SidebarContext";
import { SpriteControls } from "@/components/ControlPanel/SpriteControls";
import { FxControls } from "@/components/ControlPanel/FxControls";
import { MotionControls } from "@/components/ControlPanel/MotionControls";
import { Shapes, Palette, Zap, Settings, Moon, Monitor, Sun } from "lucide-react";
import { useMemo } from "react";
import type { GeneratorState, SpriteController, SpriteMode, MovementMode } from "@/types/generator";
import type { BlendModeOption } from "@/types/generator";

interface AppSidebarProps {
  // Control panel state
  activePanel: "sprites" | "colours" | "motion";
  onPanelChange: (panel: "sprites" | "colours" | "motion") => void;
  
  // Sprite state
  spriteState: GeneratorState | null;
  controller: SpriteController | null;
  ready: boolean;
  currentModeLabel: string;
  
  // Lock states
  lockedSpriteMode: boolean;
  lockedSpritePalette: boolean;
  lockedCanvasPalette: boolean;
  lockedBlendMode: boolean;
  lockedMovementMode: boolean;
  
  // Lock handlers
  onLockSpriteMode: (locked: boolean) => void;
  onLockSpritePalette: (locked: boolean) => void;
  onLockCanvasPalette: (locked: boolean) => void;
  onLockBlendMode: (locked: boolean) => void;
  onModeChange: (mode: SpriteMode) => void;
  onRotationToggle: (checked: boolean) => void;
  onRotationAmountChange: (value: number) => void;
  onOutlineToggle: (checked: boolean) => void;
  onOutlineStrokeWidthChange: (value: number) => void;
  onOutlineMixedToggle: (checked: boolean) => void;
  onOutlineBalanceChange: (value: number) => void;
  onRandomizeOutlineDistribution: () => void;
  
  // Palette
  currentPaletteId: string;
  currentPaletteName: string;
  paletteOptions: Array<{ value: string; label: string }>;
  canvasPaletteOptions: Array<{ value: string; label: string }>;
  onPaletteSelection: (paletteId: string) => void;
  onPaletteOptionSelect: (option: { value: string; label: string }) => void;
  
  // Blend mode
  onBlendSelect: (mode: BlendModeOption) => void;
  onBlendAutoToggle: (enabled: boolean) => void;
  
  // Motion
  onLockMovementMode: (locked: boolean) => void;
  onMovementSelect: (mode: MovementMode) => void;
  onRotationAnimatedToggle: (checked: boolean) => void;
  onRotationSpeedChange: (value: number) => void;
  onHueRotationEnabledToggle: (checked: boolean) => void;
  onHueRotationSpeedChange: (value: number) => void;
  onPaletteCycleEnabledToggle: (checked: boolean) => void;
  onPaletteCycleSpeedChange: (value: number) => void;
  onCanvasHueRotationEnabledToggle: (checked: boolean) => void;
  onCanvasHueRotationSpeedChange: (value: number) => void;
  
  // Layout
  isWideLayout: boolean;
  
  // Theme and Settings
  themeMode?: "system" | "light" | "dark";
  onThemeModeChange?: (mode: "system" | "light" | "dark") => void;
  onOpenSettings?: () => void;
  onNavigate?: (page: "create" | "sprites" | "palettes" | "presets" | "sequences" | "settings") => void;
  currentPage?: "create" | "sprites" | "palettes" | "presets" | "sequences" | "settings" | null;
}

export const AppSidebar = ({
  activePanel,
  onPanelChange,
  spriteState,
  controller,
  ready,
  currentModeLabel,
  lockedSpriteMode,
  lockedSpritePalette,
  lockedCanvasPalette,
  lockedBlendMode,
  lockedMovementMode,
  onLockSpriteMode,
  onLockSpritePalette,
  onLockCanvasPalette,
  onLockBlendMode,
  onModeChange,
  onRotationToggle,
  onRotationAmountChange,
  onOutlineToggle,
  onOutlineStrokeWidthChange,
  onOutlineMixedToggle,
  onOutlineBalanceChange,
  onRandomizeOutlineDistribution,
  currentPaletteId,
  currentPaletteName,
  paletteOptions,
  canvasPaletteOptions,
  onPaletteSelection,
  onPaletteOptionSelect,
  onBlendSelect,
  onBlendAutoToggle,
  onLockMovementMode,
  onMovementSelect,
  onRotationAnimatedToggle,
  onRotationSpeedChange,
  onHueRotationEnabledToggle,
  onHueRotationSpeedChange,
  onPaletteCycleEnabledToggle,
  onPaletteCycleSpeedChange,
  onCanvasHueRotationEnabledToggle,
  onCanvasHueRotationSpeedChange,
  isWideLayout,
  themeMode,
  onThemeModeChange,
  onOpenSettings,
  onNavigate,
  currentPage,
}: AppSidebarProps) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  
  const cycleThemeMode = () => {
    if (!onThemeModeChange || !themeMode) return;
    onThemeModeChange(
      themeMode === "system" ? "light" : themeMode === "light" ? "dark" : "system",
    );
  };

  const ThemeModeIcon = useMemo(() => {
    if (!themeMode) return Monitor;
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
  
  const navigationItems = [
    { value: "sprites" as const, label: "Sprites", icon: Shapes },
    { value: "colours" as const, label: "Colours", icon: Palette },
    ...(isWideLayout ? [] : [{ value: "motion" as const, label: "Motion", icon: Zap }]),
  ];

  const showRightColumn = isExpanded || isHovered || isMobileOpen;
  const sidebarWidth = showRightColumn ? 370 : 64; // 64px left column (was 80px, reduced by 16px/spacing.4) + 290px right column = 370px total

  return (
    <aside
      className={`fixed flex top-[var(--header-height)] left-0 h-[calc(100vh-var(--header-height)-var(--footer-height))] transition-all duration-300 ease-in-out z-50 border-r
        bg-white border-slate-200 text-slate-900
        dark:bg-slate-900 dark:border-slate-800 dark:text-white
        ${sidebarWidth === 370 ? "w-[370px]" : "w-[64px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: 50 }}
    >
      {/* Left Column - Icon Navigation */}
      <div className="flex flex-col w-[64px] border-r border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 px-[14px] pt-8 flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onPanelChange(item.value)}
                disabled={!ready}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors icon-button ${
                  activePanel === item.value
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                    : "bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        
        {/* Bottom Actions - Theme Toggle and Settings */}
        <div className="flex flex-col gap-2 px-[14px] pb-8">
          {onThemeModeChange && themeMode && (
            <button
              type="button"
              onClick={cycleThemeMode}
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors icon-button bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              aria-label={`Switch theme mode (current ${themeMode === "system" ? "System" : themeMode === "light" ? "Light" : "Dark"})`}
              title={`Theme: ${themeMode === "system" ? "System" : themeMode === "light" ? "Light" : "Dark"}`}
            >
              <ThemeModeIconComponent className="h-5 w-5" />
            </button>
          )}
          {(onNavigate || onOpenSettings) && (
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("settings");
                } else if (onOpenSettings) {
                  onOpenSettings();
                }
              }}
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors icon-button ${
                currentPage === "settings"
                  ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Column - Control Panels */}
      {showRightColumn && (
        <div className="flex flex-col w-[282px] px-5 overflow-y-auto overflow-x-visible no-scrollbar flex-1 transition-opacity duration-300 border-t border-slate-200 dark:border-slate-800">
          {/* Control Panel Content */}
          {spriteState && (
            <div className="flex-1 pt-8 overflow-x-visible">
              {activePanel === "sprites" && (
                <SpriteControls
                  spriteState={spriteState}
                  controller={controller}
                  ready={ready}
                  currentModeLabel={currentModeLabel}
                  lockedSpriteMode={lockedSpriteMode}
                  onLockSpriteMode={onLockSpriteMode}
                  onModeChange={onModeChange}
                  onRotationToggle={onRotationToggle}
                  onRotationAmountChange={onRotationAmountChange}
                  onOutlineToggle={onOutlineToggle}
                  onOutlineStrokeWidthChange={onOutlineStrokeWidthChange}
                  onOutlineMixedToggle={onOutlineMixedToggle}
                  onOutlineBalanceChange={onOutlineBalanceChange}
                  onRandomizeOutlineDistribution={onRandomizeOutlineDistribution}
                />
              )}
              {activePanel === "colours" && (
                <FxControls
                  spriteState={spriteState}
                  controller={controller}
                  ready={ready}
                  currentPaletteId={currentPaletteId}
                  currentPaletteName={currentPaletteName}
                  paletteOptions={paletteOptions}
                  canvasPaletteOptions={canvasPaletteOptions}
                  lockedSpritePalette={lockedSpritePalette}
                  lockedCanvasPalette={lockedCanvasPalette}
                  lockedBlendMode={lockedBlendMode}
                  onLockSpritePalette={onLockSpritePalette}
                  onLockCanvasPalette={onLockCanvasPalette}
                  onLockBlendMode={onLockBlendMode}
                  onPaletteSelection={onPaletteSelection}
                  onPaletteOptionSelect={onPaletteOptionSelect}
                  onBlendSelect={onBlendSelect}
                  onBlendAutoToggle={onBlendAutoToggle}
                />
              )}
              {activePanel === "motion" && !isWideLayout && (
                <MotionControls
                  spriteState={spriteState}
                  controller={controller}
                  ready={ready}
                  showHeading={true}
                  lockedMovementMode={lockedMovementMode}
                  onLockMovementMode={onLockMovementMode}
                  onMovementSelect={onMovementSelect}
                  onRotationAnimatedToggle={onRotationAnimatedToggle}
                  onRotationSpeedChange={onRotationSpeedChange}
                  onHueRotationEnabledToggle={onHueRotationEnabledToggle}
                  onHueRotationSpeedChange={onHueRotationSpeedChange}
                  onPaletteCycleEnabledToggle={onPaletteCycleEnabledToggle}
                  onPaletteCycleSpeedChange={onPaletteCycleSpeedChange}
                  onCanvasHueRotationEnabledToggle={onCanvasHueRotationEnabledToggle}
                  onCanvasHueRotationSpeedChange={onCanvasHueRotationSpeedChange}
                />
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

