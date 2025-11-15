import { Button } from "@/components/Button";
import { Switch } from "@/components/retroui/Switch";
import { Lock, Unlock, RefreshCw } from "lucide-react";
import { SPRITE_MODES } from "@/constants/sprites";
import { ControlSlider, ShapeIcon, TooltipIcon } from "./shared";
import { densityToUi, uiToDensity } from "@/lib/utils";
import type { GeneratorState, SpriteController, SpriteMode } from "@/types/generator";

interface SpriteControlsProps {
  spriteState: GeneratorState;
  controller: SpriteController | null;
  ready: boolean;
  currentModeLabel: string;
  lockedSpriteMode: boolean;
  onLockSpriteMode: (locked: boolean) => void;
  onModeChange: (mode: SpriteMode) => void;
  onRandomSpritesToggle: (checked: boolean) => void;
  onRotationToggle: (checked: boolean) => void;
  onRotationAmountChange: (value: number) => void;
}

/**
 * SpriteControls Component
 * 
 * Renders controls for sprite shape selection, density, scale, and rotation.
 * Includes shape buttons, random sprites toggle, and rotation settings.
 */
export function SpriteControls({
  spriteState,
  controller,
  ready,
  currentModeLabel,
  lockedSpriteMode,
  onLockSpriteMode,
  onModeChange,
  onRandomSpritesToggle,
  onRotationToggle,
  onRotationAmountChange,
}: SpriteControlsProps) {
  const densityValueUi = densityToUi(spriteState.scalePercent);

  return (
    <>
      <div className="section">
        <h3 className="section-title">Shape</h3>
        {/* Label, status, and tooltip for sprite selection */}
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="render-mode-label">
                Select Sprites
              </span>
              <TooltipIcon
                id="render-mode-tip"
                text="Choose the geometric shape used for sprites."
                label="Select Sprites"
              />
            </div>
            {currentModeLabel && (
              <span className="field-value">{currentModeLabel}</span>
            )}
          </div>
        </div>

        {/* Icon button row for sprite selection */}
        <div
          className="sprite-icon-buttons"
          style={{ marginTop: "0.25rem", marginBottom: "0" }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {SPRITE_MODES.map((mode) => {
              const isSelected = spriteState.spriteMode === mode.value;
              return (
                <Button
                  key={mode.value}
                  type="button"
                  size="icon"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onModeChange(mode.value)}
                  disabled={!ready || lockedSpriteMode}
                  title={mode.label}
                  aria-label={mode.label}
                >
                  <ShapeIcon shape={mode.value} size={24} />
                </Button>
              );
            })}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => onLockSpriteMode(!lockedSpriteMode)}
              disabled={!ready}
              className={
                lockedSpriteMode
                  ? "control-lock-button control-lock-button-locked"
                  : "control-lock-button"
              }
              aria-label={
                lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"
              }
              title={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
            >
              {lockedSpriteMode ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Random sprites switch */}
        <div className="control-field" style={{ marginTop: "1rem" }}>
          <div className="switch-row" style={{ gap: "0.75rem" }}>
            <Switch
              id="random-sprites"
              checked={spriteState.randomSprites ?? false}
              onCheckedChange={onRandomSpritesToggle}
              disabled={!ready || lockedSpriteMode}
              aria-labelledby="random-sprites-label"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => controller?.randomizeSpriteShapes()}
              disabled={!ready || !spriteState.randomSprites}
              aria-label="Randomise sprite shapes"
              title="Randomise sprite shapes"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="field-heading-left">
              <span className="field-label" id="random-sprites-label">
                Random sprites
              </span>
              <TooltipIcon
                id="random-sprites-tip"
                text="When enabled, each sprite on the canvas uses a random shape from the selection."
                label="Random sprites"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: "2rem" }}>
        <hr className="section-divider" />
        <h3 className="section-title">Density &amp; Scale</h3>
        <ControlSlider
          id="density-range"
          label="Tile Density"
          min={0}
          max={100}
          value={densityValueUi}
          displayValue={`${densityValueUi}%`}
          onChange={(value) => controller?.setScalePercent(uiToDensity(value))}
          disabled={!ready}
          tooltip="Controls how many tiles spawn per layer; higher values create a busier canvas."
        />
        <ControlSlider
          id="scale-base"
          label="Scale Base"
          min={0}
          max={100}
          value={Math.round(spriteState.scaleBase)}
          displayValue={`${Math.round(spriteState.scaleBase)}%`}
          onChange={(value) => controller?.setScaleBase(value)}
          disabled={!ready}
          tooltip="Sets the baseline sprite size before any random spread is applied."
        />
        <ControlSlider
          id="scale-range"
          label="Scale Range"
          min={0}
          max={100}
          value={Math.round(spriteState.scaleSpread)}
          displayValue={`${Math.round(spriteState.scaleSpread)}%`}
          onChange={(value) => controller?.setScaleSpread(value)}
          disabled={!ready}
          tooltip="Expands or tightens the difference between the smallest and largest sprites."
        />
      </div>

      <div className="section" style={{ marginTop: "2rem" }}>
        <hr className="section-divider" />
        <h3 className="section-title">Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="switch-row" style={{ gap: "0.75rem" }}>
            <Switch
              id="rotation-toggle"
              checked={spriteState.rotationEnabled}
              onCheckedChange={onRotationToggle}
              disabled={!ready}
              aria-labelledby="rotation-toggle-label"
            />
            <div className="field-heading-left">
              <span className="field-label" id="rotation-toggle-label">
                Allow Rotation Offsets
              </span>
              <TooltipIcon
                id="rotation-toggle-tip"
                text="Allow sprites to inherit a static rotation offset based on the slider below."
                label="Allow Rotation Offsets"
              />
            </div>
          </div>
        </div>
        {spriteState.rotationEnabled && (
          <div
            className="rotation-slider-wrapper"
            style={{ marginBottom: "1.5rem" }}
          >
            <ControlSlider
              id="rotation-amount"
              label="Rotation Amount"
              min={0}
              max={180}
              value={Math.round(spriteState.rotationAmount)}
              displayValue={`${Math.round(spriteState.rotationAmount)}°`}
              onChange={onRotationAmountChange}
              disabled={!ready}
              tooltip="Set the maximum angle sprites can rotate (distributed randomly, no animation)."
            />
          </div>
        )}
      </div>
    </>
  );
}

