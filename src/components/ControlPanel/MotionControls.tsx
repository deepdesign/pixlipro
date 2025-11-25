import { Switch } from "@/components/catalyst/switch-adapter";
import { MOVEMENT_MODES, formatMovementMode } from "@/constants/movement";
import { ControlSlider, ControlSelect, TooltipIcon } from "./shared";
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
  showHeading,
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
      <div className="section">
        {showHeading && <h3 className="section-title">Animation</h3>}
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
          label="Motion intensity"
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
          label="Motion speed"
          min={0}
          max={100}
          value={speedToUi(spriteState.motionSpeed)}
          displayValue={`${speedToUi(spriteState.motionSpeed)}%`}
          onChange={(value) => controller?.setMotionSpeed(uiToSpeed(value))}
          disabled={!ready}
          tooltip="Slow every layer down or accelerate the motion-wide choreography."
        />
      </div>

      <div className="section section--spaced">
        <hr className="section-divider" />
        <h3 className="section-title">Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="rotation-animate-label">
                Animate rotation
              </span>
              <TooltipIcon
                id="rotation-animate-tip"
                text="Toggle continuous spinning when rotation offsets are enabled."
                label="Animate rotation"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="rotation-animate"
              checked={spriteState.rotationAnimated}
              onCheckedChange={onRotationAnimatedToggle}
              disabled={!ready}
              aria-labelledby="rotation-animate-label"
            />
          </div>
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
        <hr className="section-divider" />
        <h3 className="section-title">Sprite Hue Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="hue-rotation-animate-label">
                Animate hue rotation
              </span>
              <TooltipIcon
                id="hue-rotation-animate-tip"
                text="Continuously rotate sprite colors through the color wheel."
                label="Animate hue rotation"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="hue-rotation-animate"
              checked={spriteState.hueRotationEnabled}
              onCheckedChange={onHueRotationEnabledToggle}
              disabled={!ready}
              aria-labelledby="hue-rotation-animate-label"
            />
          </div>
        </div>
        {spriteState.hueRotationEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="hue-rotation-speed"
              label="Rotation speed"
              min={1}
              max={100}
              value={Math.round(spriteState.hueRotationSpeed)}
              displayValue={`${Math.round(spriteState.hueRotationSpeed)}%`}
              onChange={onHueRotationSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly sprite colors rotate through the color wheel."
            />
          </div>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider" />
        <h3 className="section-title">Palette Cycling</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="palette-cycle-animate-label">
                Cycle palettes
              </span>
              <TooltipIcon
                id="palette-cycle-animate-tip"
                text="Smoothly cycle through all available palettes."
                label="Cycle palettes"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="palette-cycle-animate"
              checked={spriteState.paletteCycleEnabled}
              onCheckedChange={onPaletteCycleEnabledToggle}
              disabled={!ready}
              aria-labelledby="palette-cycle-animate-label"
            />
          </div>
        </div>
        {spriteState.paletteCycleEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="palette-cycle-speed"
              label="Cycle speed"
              min={1}
              max={100}
              value={Math.round(spriteState.paletteCycleSpeed)}
              displayValue={`${Math.round(spriteState.paletteCycleSpeed)}%`}
              onChange={onPaletteCycleSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly palettes cycle."
            />
            <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
              {currentPaletteName}
            </div>
          </div>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider" />
        <h3 className="section-title">Canvas Hue Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="canvas-hue-rotation-animate-label">
                Animate canvas hue
              </span>
              <TooltipIcon
                id="canvas-hue-rotation-animate-tip"
                text="Continuously rotate canvas background colors through the color wheel."
                label="Animate canvas hue"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="canvas-hue-rotation-animate"
              checked={spriteState.canvasHueRotationEnabled}
              onCheckedChange={onCanvasHueRotationEnabledToggle}
              disabled={!ready}
              aria-labelledby="canvas-hue-rotation-animate-label"
            />
          </div>
        </div>
        {spriteState.canvasHueRotationEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="canvas-hue-rotation-speed"
              label="Rotation speed"
              min={1}
              max={100}
              value={Math.round(spriteState.canvasHueRotationSpeed)}
              displayValue={`${Math.round(spriteState.canvasHueRotationSpeed)}%`}
              onChange={onCanvasHueRotationSpeedChange}
              disabled={!ready}
              tooltip="Control how quickly canvas background colors rotate through the color wheel."
            />
          </div>
        )}
      </div>
    </>
  );
}

