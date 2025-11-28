import { useRef } from "react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/catalyst/switch-adapter";
import { RefreshCw } from "lucide-react";
import { BLEND_MODES } from "@/constants/blend";
import { ControlSlider, ControlSelect, TooltipIcon } from "./shared";
import { varianceToUi, uiToVariance, formatBlendMode } from "@/lib/utils";
import { animatePulse } from "@/lib/utils/animations";
import type {
  GeneratorState,
  SpriteController,
  BlendModeOption,
  BackgroundMode,
} from "@/types/generator";

interface FxControlsProps {
  spriteState: GeneratorState;
  controller: SpriteController | null;
  ready: boolean;
  currentPaletteId: string;
  currentPaletteName: string;
  paletteOptions: Array<{
    value: string;
    label: string;
    category?: string;
    colors?: string[];
  }>;
  canvasPaletteOptions: Array<{
    value: string;
    label: string;
    category?: string;
    colors?: string[];
  }>;
  lockedSpritePalette: boolean;
  lockedCanvasPalette: boolean;
  lockedBlendMode: boolean;
  onLockSpritePalette: (locked: boolean) => void;
  onLockCanvasPalette: (locked: boolean) => void;
  onLockBlendMode: (locked: boolean) => void;
  onPaletteSelection: (paletteId: string) => void;
  onPaletteOptionSelect: (paletteId: string) => void;
  onBlendSelect: (mode: BlendModeOption) => void;
  onBlendAutoToggle: (checked: boolean) => void;
  onOpenSettings?: () => void;
}

/**
 * FxControls Component
 * 
 * Renders controls for palette selection, variance, canvas background,
 * blend modes, and opacity. This is the "Colours" tab content.
 */
export function FxControls({
  spriteState,
  controller,
  ready,
  currentPaletteId,
  currentPaletteName,
  paletteOptions,
  canvasPaletteOptions,
  lockedSpritePalette,
  lockedCanvasPalette,
  lockedBlendMode,
  onLockSpritePalette,
  onLockCanvasPalette,
  onLockBlendMode,
  onPaletteSelection,
  onPaletteOptionSelect,
  onBlendSelect,
  onBlendAutoToggle,
  onOpenSettings,
}: FxControlsProps) {
  const blendAutoLabelId = "blend-auto-label";
  const refreshPaletteButtonRef = useRef<HTMLButtonElement>(null);
  const randomizeBlendButtonRef = useRef<HTMLButtonElement>(null);
  const isCanvasGradient = spriteState.canvasFillMode === "gradient";
  const currentCanvasLabel =
    canvasPaletteOptions.find(
      (option) => option.value === spriteState.backgroundMode,
    )?.label ?? canvasPaletteOptions[0]?.label;

  const handleCanvasPaletteChange = (value: string) => {
    if (!controller) {
      return;
    }
    if (isCanvasGradient) {
      controller.setBackgroundMode(value as BackgroundMode);
      controller.setCanvasGradientMode(value as BackgroundMode);
    } else {
      controller.setBackgroundMode(value as BackgroundMode);
    }
  };

  return (
    <>
      <div className="section">
        <h3 className="section-title">Palette &amp; variance</h3>
        <ControlSelect
          id="palette-presets"
          label="Sprite palette"
          value={currentPaletteId}
          onChange={onPaletteSelection}
          disabled={!ready}
          options={paletteOptions}
          tooltip="Select the core palette used for tinting sprites before variance is applied."
          currentLabel={currentPaletteName}
          locked={lockedSpritePalette}
          onLockToggle={() => onLockSpritePalette(!lockedSpritePalette)}
          prefixButton={
            <Button
              ref={refreshPaletteButtonRef}
              type="button"
              size="icon"
              variant="background"
              onClick={() => {
                if (refreshPaletteButtonRef.current) {
                  animatePulse(refreshPaletteButtonRef.current);
                }
                controller?.refreshPaletteApplication();
              }}
              disabled={!ready || lockedSpritePalette}
              aria-label="Refresh palette application"
              title="Re-apply the selected palette randomly across sprites"
              className="flex-shrink-0"
            >
              <RefreshCw className="h-6 w-6" data-slot="icon" />
            </Button>
          }
        />
        {onOpenSettings && (
          <div className="control-field">
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline-offset-4 hover:underline transition-colors"
            >
              Create palette
            </button>
          </div>
        )}
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label">Use gradients</span>
              <TooltipIcon
                id="sprite-fill-mode-tip"
                text="Enable gradient fills for sprites instead of solid colours."
                label="Use gradients"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              checked={spriteState.spriteFillMode === "gradient"}
              onCheckedChange={(checked) =>
                controller?.setSpriteFillMode(checked ? "gradient" : "solid")
              }
              disabled={!ready}
            />
          </div>
        </div>
        <ControlSlider
          id="palette-range"
          label="Sprite palette variance"
          min={0}
          max={100}
          value={varianceToUi(spriteState.paletteVariance)}
          displayValue={`${varianceToUi(spriteState.paletteVariance)}%`}
          onChange={(value) =>
            controller?.setPaletteVariance(uiToVariance(value))
          }
          disabled={!ready}
          tooltip="Controls how much each colour can drift away from the base palette swatches."
        />
        <ControlSlider
          id="hue-shift"
          label="Sprite hue shift"
          min={0}
          max={100}
          value={spriteState.hueShift ?? 0}
          displayValue={`${spriteState.hueShift ?? 0}%`}
          onChange={(value) => controller?.setHueShift(value)}
          disabled={!ready}
          tooltip="Shifts all palette colours around the colour wheel (0–360°)."
        />
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <h3 className="section-title">Blend &amp; opacity</h3>
        <ControlSlider
          id="opacity-range"
          label="Layer opacity"
          min={15}
          max={100}
          value={Math.round(spriteState.layerOpacity)}
          displayValue={`${Math.round(spriteState.layerOpacity)}%`}
          onChange={(value) => controller?.setLayerOpacity(value)}
          disabled={!ready}
          tooltip="Sets the base transparency for each rendered layer before blending."
        />
        <ControlSelect
          id="blend-mode"
          label="Blend mode"
          value={spriteState.blendMode as string}
          onChange={(value) => onBlendSelect(value as BlendModeOption)}
          disabled={!ready || spriteState.blendModeAuto}
          options={BLEND_MODES.map((mode) => ({
            value: mode,
            label: formatBlendMode(mode),
          }))}
          tooltip="Choose the compositing mode applied when layers draw over each other."
          currentLabel={formatBlendMode(spriteState.blendMode as BlendModeOption)}
          locked={lockedBlendMode}
          onLockToggle={() => onLockBlendMode(!lockedBlendMode)}
        />
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id={blendAutoLabelId}>
                Random sprite blend
              </span>
              <TooltipIcon
                id="blend-auto-tip"
                text="Give every sprite an individual blend mode"
                label="Random sprite blend"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="blend-auto"
              checked={spriteState.blendModeAuto}
              onCheckedChange={onBlendAutoToggle}
              aria-labelledby={blendAutoLabelId}
              disabled={!ready}
            />
            <Button
              ref={randomizeBlendButtonRef}
              type="button"
              size="icon"
              variant="background"
              onClick={() => {
                if (randomizeBlendButtonRef.current) {
                  animatePulse(randomizeBlendButtonRef.current);
                }
                controller?.randomizeBlendMode();
              }}
              disabled={!ready || !spriteState.blendModeAuto}
              aria-label="Randomise sprite blend modes"
              title="Randomise sprite blend modes"
            >
              <RefreshCw className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <h3 className="section-title">Canvas</h3>
        <ControlSelect
          id={isCanvasGradient ? "canvas-gradient" : "background-mode"}
          label="Canvas"
          value={spriteState.backgroundMode}
          onChange={handleCanvasPaletteChange}
          disabled={!ready}
          options={canvasPaletteOptions}
          tooltip={
            isCanvasGradient
              ? "Choose the theme for the canvas gradient background."
              : "Choose the colour applied behind the canvas."
          }
          currentLabel={currentCanvasLabel}
          locked={lockedCanvasPalette}
          onLockToggle={() => onLockCanvasPalette(!lockedCanvasPalette)}
        />
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label">Use gradients</span>
              <TooltipIcon
                id="canvas-fill-mode-tip"
                text="Enable gradient fills for canvas background instead of solid colour."
                label="Use gradients"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              checked={isCanvasGradient}
              onCheckedChange={(checked) =>
                controller?.setCanvasFillMode(checked ? "gradient" : "solid")
              }
              disabled={!ready}
            />
          </div>
        </div>
        <ControlSlider
          id="background-hue-shift"
          label="Canvas hue shift"
          min={0}
          max={100}
          value={Math.round(spriteState.backgroundHueShift ?? 0)}
          displayValue={`${Math.round(spriteState.backgroundHueShift ?? 0)}%`}
          onChange={(value) => controller?.setBackgroundHueShift(value)}
          disabled={!ready}
          tooltip="Shifts the canvas colours around the colour wheel (0–360°)."
        />
        <ControlSlider
          id="background-brightness"
          label="Canvas brightness"
          min={0}
          max={100}
          value={Math.round(spriteState.backgroundBrightness ?? 50)}
          displayValue={`${Math.round(spriteState.backgroundBrightness ?? 50)}%`}
          onChange={(value) => controller?.setBackgroundBrightness(value)}
          disabled={!ready}
          tooltip="Adjusts the canvas brightness (0% = darkest, 100% = brightest)."
        />
      </div>
    </>
  );
}
