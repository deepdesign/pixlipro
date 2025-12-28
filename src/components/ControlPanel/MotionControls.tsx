import { Switch } from "@/components/ui/switch-adapter";
import { MOVEMENT_MODES, formatMovementMode } from "@/constants/movement";
import { ControlSlider, ControlSelect, TextWithTooltip } from "./shared";
import { speedToUi, uiToSpeed } from "@/lib/utils";
import type { GeneratorState, SpriteController, MovementMode } from "@/types/generator";
import { getAllPalettes, getPalette } from "@/data/palettes";
import { useMemo, useRef, useEffect, useState } from "react";

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
  onHueRotationEnabledToggle: (enabled: boolean) => void;
  onHueRotationSpeedChange: (speed: number) => void;
  onPaletteCycleEnabledToggle: (enabled: boolean) => void;
  onPaletteCycleSpeedChange: (speed: number) => void;
  onCanvasHueRotationEnabledToggle: (enabled: boolean) => void;
  onCanvasHueRotationSpeedChange: (speed: number) => void;
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
  showHeading: _showHeading,
  lockedMovementMode,
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
}: MotionControlsProps) {
  // Toggle for snapping parallax angle to 45-degree increments
  const [angleSnapping, setAngleSnapping] = useState(true);
  
  // Track palette cycle time for displaying current palette name
  const [paletteCycleTime, setPaletteCycleTime] = useState(0);
  const lastUpdateRef = useRef(Date.now());
  
  useEffect(() => {
    if (!spriteState.paletteCycleEnabled) {
      setPaletteCycleTime(0);
      return;
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      const deltaTime = deltaMs / 16.666;
      const minSpeed = 0.05; // 5% minimum
      const speedFactor = Math.max(minSpeed, spriteState.paletteCycleSpeed / 100);
      setPaletteCycleTime((prev) => {
        const newTime = (prev + deltaTime * speedFactor * (1 / 30)) % 30;
        return newTime;
      });
    }, 16); // Update roughly every frame
    
    return () => clearInterval(interval);
  }, [spriteState.paletteCycleEnabled, spriteState.paletteCycleSpeed]);
  
  // Compute current palette name when cycling
  const currentPaletteName = useMemo(() => {
    if (!spriteState.paletteCycleEnabled) {
      return getPalette(spriteState.paletteId).name;
    }
    
    const allPalettes = getAllPalettes();
    if (allPalettes.length === 0) {
      return getPalette(spriteState.paletteId).name;
    }
    
    const cycleProgress = (paletteCycleTime / 30) * allPalettes.length;
    const currentIndex = Math.floor(cycleProgress) % allPalettes.length;
    return allPalettes[currentIndex].name;
  }, [spriteState.paletteCycleEnabled, spriteState.paletteId, paletteCycleTime]);
  return (
    <>
      <h2 className="panel-heading">Motion</h2>
      <div className="section">
        <h3 className="section-title">Animation type</h3>
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
        {!["parallax", "linear", "isometric", "triangular"].includes(spriteState.movementMode) && (
          <ControlSlider
            id="motion-range"
            label="Motion intensity"
            min={0}
            max={100}
            step={1}
            value={Math.round(spriteState.motionIntensity)}
            displayValue={`${Math.round(spriteState.motionIntensity)}%`}
            onChange={(value) => controller?.setMotionIntensity(value)}
            disabled={!ready}
            tooltip="Adjust how far sprites travel within their chosen movement path."
          />
        )}
        <ControlSlider
          id="motion-speed"
          label="Motion speed"
          min={0}
          max={100}
          step={spriteState.movementMode === "parallax" ? 0.1 : 1}
          value={speedToUi(spriteState.motionSpeed)}
          displayValue={spriteState.movementMode === "parallax"
            ? `${speedToUi(spriteState.motionSpeed).toFixed(1)}%`
            : `${speedToUi(spriteState.motionSpeed)}%`}
          onChange={(value) => controller?.setMotionSpeed(uiToSpeed(value))}
          disabled={!ready}
          tooltip="Slow every layer down or accelerate the motion-wide choreography."
        />
        {spriteState.movementMode === "parallax" && (
          <>
            <ControlSlider
              id="parallax-angle"
              label="Parallax angle"
              min={0}
              max={angleSnapping ? 315 : 359}
              step={angleSnapping ? 45 : 1}
              value={angleSnapping ? Math.round(spriteState.parallaxAngle / 45) * 45 : Math.round(spriteState.parallaxAngle)}
              displayValue={`${Math.round(spriteState.parallaxAngle)}°`}
              onChange={(value) => controller?.setParallaxAngle(value)}
              disabled={!ready}
              tooltip="Adjust the direction of parallax movement (0° = right, 90° = down, 180° = left, 270° = up)."
            />
            <div className="control-field">
              <div className="field-heading">
                <div className="field-heading-left">
                  <TextWithTooltip
                    id="angle-snap-tip"
                    text="Snap angle to 45° increments (0°, 45°, 90°, etc.)"
                  >
                    <span className="field-label">Snap to 45°</span>
                  </TextWithTooltip>
                </div>
              </div>
              <div className="switch-row">
                <Switch
                  id="angle-snapping"
                  checked={angleSnapping}
                  onCheckedChange={setAngleSnapping}
                  disabled={!ready}
                  aria-label="Snap angle to 45 degrees"
                />
              </div>
            </div>
          </>
        )}
        {spriteState.movementMode === "parallax" && (
          <ControlSlider
            id="parallax-depth-effect"
            label="Depth effect"
            min={0}
            max={100}
            value={Math.round(spriteState.parallaxDepthEffect ?? 50)}
            displayValue={`${Math.round(spriteState.parallaxDepthEffect ?? 50)}%`}
            onChange={(value) => controller?.setParallaxDepthEffect(value)}
            disabled={!ready}
            tooltip="Controls the speed difference between foreground and background sprites. 0% = all same speed, 100% = foreground moves 5× faster."
          />
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="rotation-tip"
              text="Toggle continuous spinning when rotation offsets are enabled."
            >
              <h3 className="section-title">Rotation</h3>
            </TextWithTooltip>
          </div>
          <Switch
            id="rotation-animate"
            checked={spriteState.rotationAnimated}
            onCheckedChange={onRotationAnimatedToggle}
            disabled={!ready}
            aria-label="Animate rotation"
          />
        </div>
        {spriteState.rotationAnimated && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="rotation-speed"
              label="Rotation speed"
              min={1}
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

      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="hue-rotation-tip"
              text="Continuously rotate sprite colours through the colour wheel."
            >
              <h3 className="section-title">Sprite hue rotation</h3>
            </TextWithTooltip>
          </div>
          <Switch
            id="hue-rotation-animate"
            checked={spriteState.hueRotationEnabled}
            onCheckedChange={onHueRotationEnabledToggle}
            disabled={!ready}
            aria-label="Animate hue rotation"
          />
        </div>
        {spriteState.hueRotationEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="hue-rotation-speed"
              label="Rotation speed"
              min={0.1}
              max={100}
              step={0.1}
              value={spriteState.hueRotationSpeed}
              displayValue={`${spriteState.hueRotationSpeed < 1 ? spriteState.hueRotationSpeed.toFixed(1) : Math.round(spriteState.hueRotationSpeed)}%`}
              onChange={onHueRotationSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly sprite colours rotate through the colour wheel."
            />
          </div>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="palette-cycle-tip"
              text="Smoothly cycle through all available palettes."
            >
              <h3 className="section-title">Palette cycling</h3>
            </TextWithTooltip>
          </div>
          <Switch
            id="palette-cycle-animate"
            checked={spriteState.paletteCycleEnabled}
            onCheckedChange={onPaletteCycleEnabledToggle}
            disabled={!ready}
            aria-label="Cycle palettes"
          />
        </div>
        {spriteState.paletteCycleEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="palette-cycle-speed"
              label="Cycle speed"
              min={0.1}
              max={100}
              step={0.1}
              value={spriteState.paletteCycleSpeed}
              displayValue={`${spriteState.paletteCycleSpeed < 1 ? spriteState.paletteCycleSpeed.toFixed(1) : Math.round(spriteState.paletteCycleSpeed)}%`}
              onChange={onPaletteCycleSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly palettes cycle."
            />
            <div className="text-xs text-theme-subtle mt-1 text-right">
              {currentPaletteName}
            </div>
          </div>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="canvas-hue-rotation-tip"
              text="Continuously rotate canvas background colours through the colour wheel."
            >
              <h3 className="section-title">Canvas hue rotation</h3>
            </TextWithTooltip>
          </div>
          <Switch
            id="canvas-hue-rotation-animate"
            checked={spriteState.canvasHueRotationEnabled}
            onCheckedChange={onCanvasHueRotationEnabledToggle}
            disabled={!ready}
            aria-label="Animate canvas hue"
          />
        </div>
        {spriteState.canvasHueRotationEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="canvas-hue-rotation-speed"
              label="Rotation speed"
              min={0.1}
              max={100}
              step={0.1}
              value={spriteState.canvasHueRotationSpeed}
              displayValue={`${spriteState.canvasHueRotationSpeed < 1 ? spriteState.canvasHueRotationSpeed.toFixed(1) : Math.round(spriteState.canvasHueRotationSpeed)}%`}
              onChange={onCanvasHueRotationSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly canvas background colours rotate through the colour wheel."
            />
          </div>
        )}
      </div>
    </>
  );
}
