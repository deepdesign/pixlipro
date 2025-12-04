import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/ui/switch-adapter";
import { RefreshCw, ChevronDown } from "lucide-react";
import { BLEND_MODES } from "@/constants/blend";
import { ControlSlider, ControlSelect, TextWithTooltip } from "./shared";
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
  onPaletteOptionSelect: _onPaletteOptionSelect,
  onBlendSelect,
  onBlendAutoToggle,
  onOpenSettings,
}: ColourControlsProps) {
  const blendAutoLabelId = "blend-auto-label";
  const refreshPaletteButtonRef = useRef<HTMLButtonElement>(null);
  const randomizeBlendButtonRef = useRef<HTMLButtonElement>(null);
  const randomizeGradientColorsButtonRef = useRef<HTMLButtonElement>(null);
  const isCanvasGradient = spriteState.canvasFillMode === "gradient";
  const currentCanvasLabel =
    canvasPaletteOptions.find(
      (option) => option.value === spriteState.backgroundMode,
    )?.label ?? canvasPaletteOptions[0]?.label;

  // Smart collapse for Blend & opacity section
  // Show toggle when: opacity is 100%, blend mode is NONE, and random sprite blend is off
  // Smart collapse logic removed - toggle always visible

  // Toggle is always visible - allows user to collapse/expand the section
  const blendToggleVisible = true;
  const [blendSectionCollapsed, setBlendSectionCollapsed] = useState(true);

  // Smart collapse for Canvas section
  // Show toggle when: solid mode (not gradient), hue shift is 0, brightness is 50
  // Smart collapse logic removed - toggle always visible

  // Toggle is always visible - allows user to collapse/expand the section
  const canvasToggleVisible = true;
  const [canvasSectionCollapsed, setCanvasSectionCollapsed] = useState(true);

  // Smart collapse for Color Adjustments section
  // Smart collapse logic removed - toggle always visible

  // Toggle is always visible - allows user to collapse/expand the section
  const colorAdjustmentsToggleVisible = true;
  const [colorAdjustmentsSectionCollapsed, setColorAdjustmentsSectionCollapsed] = useState(true);

  // Smart collapse for Gradients section
  // Smart collapse logic removed - toggle always visible

  // Toggle visible when section can be collapsed
  // Toggle always visible
  const [gradientsSectionCollapsed, _setGradientsSectionCollapsed] = useState(true);

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
              className="text-sm text-theme-muted hover:text-theme-primary underline-offset-4 hover:underline transition-colors"
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
        <hr className="section-divider border-t" />
          {colorAdjustmentsToggleVisible && (
          <button
            type="button"
            onClick={() => setColorAdjustmentsSectionCollapsed(!colorAdjustmentsSectionCollapsed)}
              disabled={!ready}
            className="flex items-center justify-between gap-2 w-full cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={colorAdjustmentsSectionCollapsed ? "Expand colour adjustments section" : "Collapse colour adjustments section"}
            aria-expanded={!colorAdjustmentsSectionCollapsed}
          >
            <TextWithTooltip
              id="color-adjustments-tip"
              text="Adjust hue, saturation, brightness, and contrast for all sprites."
            >
              <h3 className="section-title">Colour adjustments</h3>
            </TextWithTooltip>
            <ChevronDown
              className={`h-5 w-5 text-theme-subtle transition-transform duration-200 ${
                !colorAdjustmentsSectionCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
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
        <hr className="section-divider border-t" />
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
        {spriteState.spriteFillMode === "gradient" && (
          <>
            <ControlSlider
              id="sprite-gradient-direction"
              label="Sprite gradient direction"
              min={0}
              max={360}
              value={Math.round(spriteState.spriteGradientDirection ?? 0)}
              displayValue={`${Math.round(spriteState.spriteGradientDirection ?? 0)}°`}
              onChange={(value) => controller?.setSpriteGradientDirection(value)}
              disabled={!ready || spriteState.spriteGradientDirectionRandom}
              tooltip="Sets the angle of the sprite gradient (0° = horizontal left to right, 90° = vertical top to bottom)."
            />
            <div className="control-field">
              <div className="field-heading">
                <div className="field-heading-left">
                  <TextWithTooltip
                    id="sprite-gradient-direction-random-tip"
                    text="Give each sprite a random gradient direction"
                  >
                    <span className="field-label">Random sprite gradient direction</span>
                  </TextWithTooltip>
                </div>
              </div>
              <div className="switch-row">
                <Switch
                  checked={spriteState.spriteGradientDirectionRandom ?? false}
                  onCheckedChange={(checked) =>
                    controller?.setSpriteGradientDirectionRandom(checked)
                  }
                  disabled={!ready}
                  aria-label="Random sprite gradient direction"
                />
              </div>
            </div>
            <div className="control-field control-field--spaced-top">
              <div className="switch-row">
                <Button
                  ref={randomizeGradientColorsButtonRef}
                  type="button"
                  size="icon"
                  variant="background"
                  onClick={() => {
                    if (randomizeGradientColorsButtonRef.current) {
                      animatePulse(randomizeGradientColorsButtonRef.current);
                    }
                    controller?.randomizeGradientColors();
                  }}
                  disabled={!ready}
                  aria-label="Randomise gradient colors"
                  title="Randomise gradient colors"
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
                <div className="field-heading-left">
                  <TextWithTooltip
                    id="randomize-gradient-colors-tip"
                    text="Randomize which 2 colors from the palette are used for gradients"
                  >
                    <span className="field-label" id="randomize-gradient-colors-label">
                      Randomise gradient colours
                    </span>
                  </TextWithTooltip>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t" />
          {blendToggleVisible && (
          <button
            type="button"
            onClick={() => setBlendSectionCollapsed(!blendSectionCollapsed)}
              disabled={!ready}
            className="flex items-center justify-between gap-2 w-full cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={blendSectionCollapsed ? "Expand blend and opacity section" : "Collapse blend and opacity section"}
            aria-expanded={!blendSectionCollapsed}
          >
            <TextWithTooltip
              id="blend-opacity-tip"
              text="Control layer opacity and blending modes for compositing effects."
            >
              <h3 className="section-title">Blend &amp; opacity</h3>
            </TextWithTooltip>
            <ChevronDown
              className={`h-5 w-5 text-theme-subtle transition-transform duration-200 ${
                !blendSectionCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
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
          </div>
            )}
          </>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t" />
          {canvasToggleVisible && (
          <button
            type="button"
            onClick={() => setCanvasSectionCollapsed(!canvasSectionCollapsed)}
              disabled={!ready}
            className="flex items-center justify-between gap-2 w-full cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={canvasSectionCollapsed ? "Expand canvas section" : "Collapse canvas section"}
            aria-expanded={!canvasSectionCollapsed}
          >
            <TextWithTooltip
              id="canvas-tip"
              text="Configure the canvas background color, gradients, hue shift, and brightness."
            >
              <h3 className="section-title">Canvas</h3>
            </TextWithTooltip>
            <ChevronDown
              className={`h-5 w-5 text-theme-subtle transition-transform duration-200 ${
                !canvasSectionCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
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
            {isCanvasGradient && (
              <ControlSlider
                id="canvas-gradient-direction"
                label="Canvas gradient direction"
                min={0}
                max={360}
                value={Math.round(spriteState.canvasGradientDirection ?? 0)}
                displayValue={`${Math.round(spriteState.canvasGradientDirection ?? 0)}°`}
                onChange={(value) => controller?.setCanvasGradientDirection(value)}
                disabled={!ready}
                tooltip="Sets the angle of the canvas gradient (0° = horizontal left to right, 90° = vertical top to bottom)."
              />
            )}
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
              id="background-saturation"
              label="Canvas saturation"
              min={0}
              max={200}
              value={Math.round(spriteState.backgroundSaturation ?? 100)}
              displayValue={`${Math.round(spriteState.backgroundSaturation ?? 100)}%`}
              onChange={(value) => controller?.setBackgroundSaturation(value)}
              disabled={!ready}
              tooltip="Adjusts canvas colour saturation (0% = grayscale, 100% = normal, 200% = max saturation)."
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
            <ControlSlider
              id="background-contrast"
              label="Canvas contrast"
              min={0}
              max={200}
              value={Math.round(spriteState.backgroundContrast ?? 100)}
              displayValue={`${Math.round(spriteState.backgroundContrast ?? 100)}%`}
              onChange={(value) => controller?.setBackgroundContrast(value)}
              disabled={!ready}
              tooltip="Adjusts canvas colour contrast (0% = no contrast, 100% = normal, 200% = max contrast)."
            />
          </>
        )}
      </div>
    </>
  );
}

