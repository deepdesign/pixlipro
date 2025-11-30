import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/catalyst/switch-adapter";
import { RefreshCw } from "lucide-react";
import { BLEND_MODES } from "@/constants/blend";
import { ControlSlider, ControlSelect, TooltipIcon, TextWithTooltip } from "./shared";
import { varianceToUi, uiToVariance, formatBlendMode } from "@/lib/utils";
import { animatePulse } from "@/lib/utils/animations";
import type {
  GeneratorState,
  SpriteController,
  BlendModeOption,
  BackgroundMode,
} from "@/types/generator";

interface ColourControlsProps {
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
 * ColourControls Component
 * 
 * Renders controls for palette selection, variance, canvas background,
 * blend modes, and opacity. This is the "Colours" tab content.
 */
export function ColourControls({
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
}: ColourControlsProps) {
  const blendAutoLabelId = "blend-auto-label";
  const refreshPaletteButtonRef = useRef<HTMLButtonElement>(null);
  const randomizeBlendButtonRef = useRef<HTMLButtonElement>(null);
  const isCanvasGradient = spriteState.canvasFillMode === "gradient";
  const currentCanvasLabel =
    canvasPaletteOptions.find(
      (option) => option.value === spriteState.backgroundMode,
    )?.label ?? canvasPaletteOptions[0]?.label;

  // Smart collapse for Blend & opacity section
  // Show toggle when: opacity is 100%, blend mode is NONE, and random sprite blend is off
  const canCollapseBlendSection = useMemo(() => {
    if (spriteState.outlineMixed) {
      // In mixed mode, check both opacities
      return (
        spriteState.filledOpacity === 100 &&
        spriteState.outlinedOpacity === 100 &&
        spriteState.blendMode === "NONE" &&
        !spriteState.blendModeAuto
      );
    }
    return (
      spriteState.layerOpacity === 100 &&
      spriteState.blendMode === "NONE" &&
      !spriteState.blendModeAuto
    );
  }, [
    spriteState.outlineMixed,
    spriteState.layerOpacity,
    spriteState.filledOpacity,
    spriteState.outlinedOpacity,
    spriteState.blendMode,
    spriteState.blendModeAuto,
  ]);

  // Toggle is always visible - allows user to collapse/expand the section
  const blendToggleVisible = true;
  const [blendSectionCollapsed, setBlendSectionCollapsed] = useState(true);

  // Smart collapse for Canvas section
  // Show toggle when: solid mode (not gradient), hue shift is 0, brightness is 50
  const canCollapseCanvasSection = useMemo(() => {
    return (
      spriteState.canvasFillMode === "solid" &&
      spriteState.backgroundHueShift === 0 &&
      spriteState.backgroundBrightness === 50
    );
  }, [
    spriteState.canvasFillMode,
    spriteState.backgroundHueShift,
    spriteState.backgroundBrightness,
  ]);

  // Toggle is always visible - allows user to collapse/expand the section
  const canvasToggleVisible = true;
  const [canvasSectionCollapsed, setCanvasSectionCollapsed] = useState(true);

  // Smart collapse for Color Adjustments section
  const canCollapseColorAdjustmentsSection = useMemo(() => {
    return (
      (spriteState.hueShift ?? 0) === 0 &&
      (spriteState.saturation ?? 100) === 100 &&
      (spriteState.brightness ?? 100) === 100 &&
      (spriteState.contrast ?? 100) === 100
    );
  }, [
    spriteState.hueShift,
    spriteState.saturation,
    spriteState.brightness,
    spriteState.contrast,
  ]);

  // Toggle is always visible - allows user to collapse/expand the section
  const colorAdjustmentsToggleVisible = true;
  const [colorAdjustmentsSectionCollapsed, setColorAdjustmentsSectionCollapsed] = useState(true);

  // Smart collapse for Gradients section
  const canCollapseGradientsSection = useMemo(() => {
    return spriteState.spriteFillMode === "solid";
  }, [spriteState.spriteFillMode]);

  // Toggle visible when section can be collapsed
  const gradientsToggleVisible = canCollapseGradientsSection;
  const [gradientsSectionCollapsed, setGradientsSectionCollapsed] = useState(true);

  // Sync collapsed state with enable flags in GeneratorState
  useEffect(() => {
    if (controller) {
      controller.setColorAdjustmentsEnabled(!colorAdjustmentsSectionCollapsed);
    }
  }, [controller, colorAdjustmentsSectionCollapsed]);

  useEffect(() => {
    if (controller) {
      controller.setGradientsEnabled(!gradientsSectionCollapsed);
    }
  }, [controller, gradientsSectionCollapsed]);

  useEffect(() => {
    if (controller) {
      controller.setBlendOpacityEnabled(!blendSectionCollapsed);
    }
  }, [controller, blendSectionCollapsed]);

  useEffect(() => {
    if (controller) {
      controller.setCanvasEnabled(!canvasSectionCollapsed);
    }
  }, [controller, canvasSectionCollapsed]);

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
      <h2 className="panel-heading">Colour</h2>
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
        />
        <div className="control-field">
          <div className="switch-row">
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
            >
              <RefreshCw className="h-6 w-6" data-slot="icon" />
            </Button>
            <div className="field-heading-left">
              <TextWithTooltip
                id="refresh-palette-tip"
                text="Re-apply the selected palette randomly across sprites without changing their positions or shapes."
              >
                <span className="field-label" id="refresh-palette-label">
                  Re-apply palette
                </span>
              </TextWithTooltip>
            </div>
          </div>
        </div>
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
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">Colour adjustments</h3>
          {colorAdjustmentsToggleVisible && (
            <Switch
              checked={!colorAdjustmentsSectionCollapsed}
              onCheckedChange={(checked) => setColorAdjustmentsSectionCollapsed(!checked)}
              disabled={!ready}
              aria-label={colorAdjustmentsSectionCollapsed ? "Show colour adjustments" : "Hide colour adjustments"}
            />
          )}
        </div>
        {!colorAdjustmentsSectionCollapsed && (
          <>
            <ControlSlider
              id="hue-shift"
              label="Hue"
              min={0}
              max={100}
              value={spriteState.hueShift ?? 0}
              displayValue={`${spriteState.hueShift ?? 0}%`}
              onChange={(value) => controller?.setHueShift(value)}
              disabled={!ready}
              tooltip="Shifts all palette colours around the colour wheel (0–360°)."
            />
            <ControlSlider
              id="saturation"
              label="Saturation"
              min={0}
              max={200}
              value={spriteState.saturation ?? 100}
              displayValue={`${spriteState.saturation ?? 100}%`}
              onChange={(value) => controller?.setSaturation(value)}
              disabled={!ready}
              tooltip="Adjusts colour saturation (0% = grayscale, 100% = normal, 200% = max saturation)."
            />
            <ControlSlider
              id="brightness"
              label="Brightness"
              min={0}
              max={200}
              value={spriteState.brightness ?? 100}
              displayValue={`${spriteState.brightness ?? 100}%`}
              onChange={(value) => controller?.setBrightness(value)}
              disabled={!ready}
              tooltip="Adjusts colour brightness (0% = black, 100% = normal, 200% = max brightness)."
            />
            <ControlSlider
              id="contrast"
              label="Contrast"
              min={0}
              max={200}
              value={spriteState.contrast ?? 100}
              displayValue={`${spriteState.contrast ?? 100}%`}
              onChange={(value) => controller?.setContrast(value)}
              disabled={!ready}
              tooltip="Adjusts colour contrast (0% = no contrast, 100% = normal, 200% = max contrast)."
            />
          </>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="gradients-tip"
              text="Enable gradient fills for sprites instead of solid colours."
            >
              <h3 className="section-title">Gradients</h3>
            </TextWithTooltip>
          </div>
          <Switch
            checked={spriteState.spriteFillMode === "gradient"}
            onCheckedChange={(checked) =>
              controller?.setSpriteFillMode(checked ? "gradient" : "solid")
            }
            disabled={!ready}
            aria-label="Enable gradients"
          />
        </div>
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">Blend &amp; opacity</h3>
          {blendToggleVisible && (
            <Switch
              checked={!blendSectionCollapsed}
              onCheckedChange={(checked) => setBlendSectionCollapsed(!checked)}
              disabled={!ready}
              aria-label={blendSectionCollapsed ? "Show blend and opacity controls" : "Hide blend and opacity controls"}
            />
          )}
        </div>
        {!blendSectionCollapsed && (
          <>
            {spriteState.outlineMixed ? (
              <>
                <ControlSlider
              id="filled-opacity-range"
              label="Filled opacity"
              min={0}
              max={100}
              value={Math.round(spriteState.filledOpacity)}
              displayValue={`${Math.round(spriteState.filledOpacity)}%`}
              onChange={(value) => controller?.setFilledOpacity(value)}
              disabled={!ready}
              tooltip="Sets the transparency for filled sprites when mixed mode is enabled."
            />
            <ControlSlider
              id="outlined-opacity-range"
              label="Outlined opacity"
              min={0}
              max={100}
              value={Math.round(spriteState.outlinedOpacity)}
              displayValue={`${Math.round(spriteState.outlinedOpacity)}%`}
              onChange={(value) => controller?.setOutlinedOpacity(value)}
              disabled={!ready}
              tooltip="Sets the transparency for outlined sprites when mixed mode is enabled."
            />
              </>
            ) : (
              <ControlSlider
          id="opacity-range"
          label="Layer opacity"
            min={0}
          max={100}
          value={Math.round(spriteState.layerOpacity)}
          displayValue={`${Math.round(spriteState.layerOpacity)}%`}
          onChange={(value) => controller?.setLayerOpacity(value)}
          disabled={!ready}
          tooltip="Sets the base transparency for each rendered layer before blending."
        />
            )}
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
              <TextWithTooltip
                id="blend-auto-tip"
                text="Give every sprite an individual blend mode"
              >
                <span className="field-label" id={blendAutoLabelId}>
                  Random sprite blend
                </span>
              </TextWithTooltip>
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
          </div>
        </div>
            {spriteState.blendModeAuto && (
          <div className="control-field control-field--spaced-top">
            <div className="field-heading">
              <div className="field-heading-left">
                <TextWithTooltip
                  id="randomize-blend-tip"
                  text="Re-apply sprite blend modes randomly across sprites"
                >
                  <span className="field-label" id="randomize-blend-label">
                    Re-apply sprite blends
                  </span>
                </TextWithTooltip>
              </div>
            </div>
            <div className="switch-row">
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
                disabled={!ready}
                aria-label="Randomise sprite blend modes"
                title="Randomise sprite blend modes"
              >
                <RefreshCw className="h-6 w-6" />
              </Button>
            </div>
          </div>
            )}
          </>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">Canvas</h3>
          {canvasToggleVisible && (
            <Switch
              checked={!canvasSectionCollapsed}
              onCheckedChange={(checked) => setCanvasSectionCollapsed(!checked)}
              disabled={!ready}
              aria-label={canvasSectionCollapsed ? "Show canvas controls" : "Hide canvas controls"}
            />
          )}
        </div>
        {!canvasSectionCollapsed && (
          <>
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
                  <TextWithTooltip
                    id="canvas-fill-mode-tip"
                    text="Enable gradient fills for canvas background instead of solid colour."
                  >
                    <span className="field-label">Use gradients</span>
                  </TextWithTooltip>
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
          </>
        )}
      </div>
    </>
  );
}

