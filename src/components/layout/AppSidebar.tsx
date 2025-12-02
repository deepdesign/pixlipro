import { useSidebar } from "@/context/SidebarContext";
import { SpriteControls } from "@/components/ControlPanel/SpriteControls";
import { ColourControls } from "@/components/ControlPanel/ColourControls";
import { FxControls } from "@/components/ControlPanel/FxControls";
import { MotionControls } from "@/components/ControlPanel/MotionControls";
import { Shapes, Palette, PlayCircle, Settings, Moon, Monitor, Sun, Sparkles } from "lucide-react";
import { PixliLogo } from "@/components/Header/PixliLogo";
import { useMemo } from "react";
import type { GeneratorState, SpriteController, SpriteMode, MovementMode } from "@/types/generator";
import type { BlendModeOption } from "@/types/generator";

interface AppSidebarProps {
  // Control panel state
  activePanel: "sprites" | "colours" | "motion" | "fx";
  onPanelChange: (panel: "sprites" | "colours" | "motion" | "fx") => void;
  
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
  onPaletteOptionSelect: (paletteId: string) => void;
  
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
  onNavigate?: (page: "create" | "sprites" | "palettes" | "scenes" | "sequences" | "settings" | "animation") => void;
  currentPage?: "create" | "sprites" | "palettes" | "scenes" | "sequences" | "settings" | "animation" | null;
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
    { value: "sprites" as const, label: "Shape", icon: Shapes },
    { value: "colours" as const, label: "Colour", icon: Palette },
    ...(isWideLayout ? [] : [{ value: "motion" as const, label: "Animation", icon: PlayCircle }]),
    { value: "fx" as const, label: "FX", icon: Sparkles },
  ];

  const showRightColumn = (isExpanded || isHovered || isMobileOpen) && currentPage !== "settings";
  const sidebarWidth = showRightColumn ? 370 : 64; // 64px left column (was 80px, reduced by 16px/spacing.4) + 290px right column = 370px total
  // Disable width transition when switching between canvas and settings
  const isCanvasOrSettings = currentPage === "create" || currentPage === "settings" || currentPage === null;

  return (
    <aside
      className={`fixed flex top-[var(--header-height)] left-0 h-[calc(100vh-var(--header-height)-var(--footer-height))] z-50 border-r
        bg-theme-panel border-theme-panel text-theme-primary
        ${sidebarWidth === 370 ? "w-[370px]" : "w-[64px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        transition-[opacity,transform] duration-300 ease-in-out`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        zIndex: 50,
        willChange: sidebarWidth === 370 || isHovered ? 'width, opacity' : 'auto',
        transition: isCanvasOrSettings ? 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out' : 'width 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
      }}
    >
      {/* Left Column - Icon Navigation */}
      <div className="flex flex-col w-[64px] border-r border-t border-theme-panel bg-theme-panel">
        {/* Logo at top */}
        <div className="flex items-center justify-center pt-4 pb-6 px-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) {
                onNavigate("create");
              }
            }}
            aria-label="Pixli: generative art toy"
            className="flex items-center justify-center"
          >
            <PixliLogo className="h-7 w-7" />
          </a>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 px-[14px] flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            // Deselect all control panel buttons when on settings page
            const isSelected = currentPage !== "settings" && activePanel === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  // If on settings page, navigate to canvas and activate the panel
                  if (currentPage === "settings" && onNavigate) {
                    onNavigate("create");
                    onPanelChange(item.value);
                  } else {
                    // Normal behavior: just change the panel
                    onPanelChange(item.value);
                  }
                }}
                disabled={!ready}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors icon-button ${
                  isSelected
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                    : "bg-transparent text-theme-muted hover:bg-theme-icon"
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
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors icon-button bg-transparent text-theme-muted hover:bg-theme-icon"
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
                  : "bg-transparent text-theme-muted hover:bg-theme-icon"
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
        <div className="flex flex-col w-[282px] px-5 overflow-y-auto overflow-x-visible no-scrollbar flex-1 transition-opacity duration-300 border-t border-theme-panel">
          {/* Control Panel Content */}
          {spriteState && (
            <div className="flex-1 pt-8 pb-6 overflow-x-visible">
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
                <ColourControls
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
              {activePanel === "fx" && (
                <FxControls
                  spriteState={spriteState}
                  controller={controller}
                  ready={ready}
                />
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

