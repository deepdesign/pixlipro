import { useSidebar } from "@/context/SidebarContext";
import { SpriteControls } from "@/components/ControlPanel/SpriteControls";
import { FxControls } from "@/components/ControlPanel/FxControls";
import { MotionControls } from "@/components/ControlPanel/MotionControls";
import { Shapes, Palette, Zap } from "lucide-react";
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
  
  // Custom palette manager
  onShowCustomPaletteManager: () => void;
  
  // Layout
  isWideLayout: boolean;
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
  onShowCustomPaletteManager,
  isWideLayout,
}: AppSidebarProps) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  
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
        bg-[var(--bg-top)]
        border-[var(--panel-border)]
        text-[var(--text-primary)]
        ${sidebarWidth === 370 ? "w-[370px]" : "w-[64px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: 50 }}
    >
      {/* Left Column - Icon Navigation */}
      <div className="flex flex-col w-[64px] border-r border-[var(--panel-border)] bg-[var(--bg-top)]">
        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 px-[10px] pt-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onPanelChange(item.value)}
                disabled={!ready}
                className={`w-[44px] h-[44px] rounded-lg flex items-center justify-center transition-colors ${
                  activePanel === item.value
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
                    : "bg-[var(--panel-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-base)]"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column - Control Panels */}
      {showRightColumn && (
        <div className="flex flex-col w-[290px] px-5 overflow-y-auto overflow-x-visible no-scrollbar flex-1 transition-opacity duration-300">
          {/* Control Panel Content */}
          {spriteState && (
            <div className="flex-1 pt-8">
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
                  onShowCustomPaletteManager={onShowCustomPaletteManager}
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

