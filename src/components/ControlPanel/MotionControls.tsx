import { Switch } from "@/components/retroui/Switch";
import { MOVEMENT_MODES, formatMovementMode } from "@/constants/movement";
import { ControlSlider, ControlSelect, TooltipIcon } from "./shared";
import { speedToUi, uiToSpeed } from "@/lib/utils";
import type { GeneratorState, SpriteController, MovementMode } from "@/types/generator";

interface MotionControlsProps {
  spriteState: GeneratorState;
  controller: SpriteController | null;
  ready: boolean;
  showHeading: boolean;
  lockedMovementMode: boolean;
  onLockMovementMode: (locked: boolean) => void;
  onMovementSelect: (mode: MovementMode) => void;
  onRotationAnimatedToggle: (checked: boolean) => void;
  onRotationSpeedChange: (value: number) => void;
}

/**
 * MotionControls Component
 * 
 * Renders controls for sprite movement and rotation animation.
 * Includes movement mode selection, motion intensity/speed, and rotation animation.
 */
export function MotionControls({
  spriteState,
  controller,
  ready,
  showHeading,
  lockedMovementMode,
  onLockMovementMode,
  onMovementSelect,
  onRotationAnimatedToggle,
  onRotationSpeedChange,
}: MotionControlsProps) {
  return (
    <>
      <div className="section">
        {showHeading && <h3 className="section-title">Motion</h3>}
        <ControlSelect
          id="movement-mode"
          label="Movement"
          value={spriteState.movementMode}
          onChange={(value) => onMovementSelect(value as MovementMode)}
          disabled={!ready}
          options={MOVEMENT_MODES.map((mode) => ({
            value: mode.value,
            label: mode.label,
          }))}
          tooltip="Select the animation path applied to each sprite layer."
          currentLabel={formatMovementMode(spriteState.movementMode)}
          locked={lockedMovementMode}
          onLockToggle={() => onLockMovementMode(!lockedMovementMode)}
        />
        <ControlSlider
          id="motion-range"
          label="Motion Intensity"
          min={0}
          max={100}
          value={Math.round(spriteState.motionIntensity)}
          displayValue={`${Math.round(spriteState.motionIntensity)}%`}
          onChange={(value) => controller?.setMotionIntensity(value)}
          disabled={!ready}
          tooltip="Adjust how far sprites travel within their chosen movement path."
        />
        <ControlSlider
          id="motion-speed"
          label="Motion Speed"
          min={0}
          max={100}
          value={speedToUi(spriteState.motionSpeed)}
          displayValue={`${speedToUi(spriteState.motionSpeed)}%`}
          onChange={(value) => controller?.setMotionSpeed(uiToSpeed(value))}
          disabled={!ready}
          tooltip="Slow every layer down or accelerate the motion-wide choreography."
        />
      </div>

      <div className="section" style={{ marginTop: "2rem" }}>
        <hr className="section-divider" />
        <h3 className="section-title">Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="switch-row" style={{ gap: "0.75rem" }}>
            <Switch
              id="rotation-animate"
              checked={spriteState.rotationAnimated}
              onCheckedChange={onRotationAnimatedToggle}
              disabled={!ready}
              aria-labelledby="rotation-animate-label"
            />
            <div className="field-heading-left">
              <span className="field-label" id="rotation-animate-label">
                Animate Rotation
              </span>
              <TooltipIcon
                id="rotation-animate-tip"
                text="Toggle continuous spinning when rotation offsets are enabled."
                label="Animate Rotation"
              />
            </div>
          </div>
        </div>
        {spriteState.rotationAnimated && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="rotation-speed"
              label="Rotation Speed"
              min={0}
              max={100}
              value={Math.round(spriteState.rotationSpeed)}
              displayValue={`${Math.round(spriteState.rotationSpeed)}%`}
              onChange={onRotationSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly sprites spin when rotation is enabled."
            />
          </div>
        )}
      </div>
    </>
  );
}

