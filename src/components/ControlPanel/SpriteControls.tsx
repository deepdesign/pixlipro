import { useRef, useMemo } from "react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/catalyst/switch-adapter";
import { Lock, Unlock, RefreshCw } from "lucide-react";
import { SPRITE_MODES } from "@/constants/sprites";
import { getAllCollections, getCollection } from "@/constants/spriteCollections";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import { ControlSlider, ShapeIcon, TooltipIcon } from "./shared";
import { densityToUi, uiToDensity } from "@/lib/utils";
import { animatePulse } from "@/lib/utils/animations";
import type { GeneratorState, SpriteController, SpriteMode } from "@/types/generator";

interface SpriteControlsProps {
  spriteState: GeneratorState;
  controller: SpriteController | null;
  ready: boolean;
  currentModeLabel: string;
  lockedSpriteMode: boolean;
  onLockSpriteMode: (locked: boolean) => void;
  onModeChange: (mode: SpriteMode) => void;
  onRotationToggle: (checked: boolean) => void;
  onRotationAmountChange: (value: number) => void;
}

/**
 * SpriteControls Component
 * 
 * Renders controls for sprite shape selection, density, scale, and rotation.
 * Includes shape buttons, regenerate button, and rotation settings.
 */
export function SpriteControls({
  spriteState,
  controller,
  ready,
  currentModeLabel,
  lockedSpriteMode,
  onLockSpriteMode,
  onModeChange,
  onRotationToggle,
  onRotationAmountChange,
}: SpriteControlsProps) {
  const randomizeButtonRef = useRef<HTMLButtonElement>(null);
  const densityValueUi = densityToUi(spriteState.scalePercent);

  // Get all collections and current collection
  const allCollections = useMemo(() => getAllCollections(), []);
  const currentCollection = useMemo(
    () => getCollection(spriteState.spriteCollectionId || "default"),
    [spriteState.spriteCollectionId]
  );

  // Filter available sprites based on current collection
  const availableSprites = useMemo(() => {
    if (!currentCollection) {
      return SPRITE_MODES;
    }

    if (currentCollection.isShapeBased) {
      // For default, filter SPRITE_MODES to only include sprites in the collection
      return SPRITE_MODES.filter(mode =>
        currentCollection.sprites.some(s => s.spriteMode === mode.value)
      );
    } else {
      // For SVG collections, return the SVG sprites
      // Map them to match SPRITE_MODES format for UI compatibility
      return currentCollection.sprites
        .filter(sprite => sprite.svgPath)
        .map(sprite => ({
          value: sprite.id as SpriteMode, // Use sprite ID as the mode value
          label: sprite.name,
          description: `${sprite.name} from ${currentCollection.label}`,
          svgPath: sprite.svgPath,
        }));
    }
  }, [currentCollection]);

  return (
    <>
      <div className="section">
        <h3 className="section-title">Shape</h3>
        {/* Collection selector */}
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="collection-label">
                Collection
              </span>
              <TooltipIcon
                id="collection-tip"
                text="Choose which sprite collection to use. Collections are organized in folders."
                label="Collection"
              />
            </div>
          </div>
          <Select
            value={spriteState.spriteCollectionId || "default"}
            onValueChange={(value) => controller?.setSpriteCollection(value)}
            disabled={!ready}
          >
            <SelectTrigger aria-labelledby="collection-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allCollections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Label, status, and tooltip for sprite selection */}
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="render-mode-label">
                Select sprites
              </span>
              <TooltipIcon
                id="render-mode-tip"
                text="Choose the geometric shape used for sprites."
                label="Select sprites"
              />
            </div>
            {currentModeLabel && (
              <span className="field-value">{currentModeLabel}</span>
            )}
          </div>
          {/* Icon button row for sprite selection */}
          {availableSprites.length > 0 ? (
            <div className="sprite-icon-buttons">
              <div className="flex flex-wrap items-center">
                {availableSprites.map((mode) => {
                  const isSelected = spriteState.spriteMode === mode.value;
                  return (
                    <Button
                      key={mode.value}
                      type="button"
                      size="icon"
                      variant={isSelected ? "default" : "background"}
                      onClick={() => onModeChange(mode.value)}
                      disabled={!ready || lockedSpriteMode}
                      title={mode.label}
                      aria-label={mode.label}
                    >
                      <ShapeIcon 
                        shape={mode.value} 
                        size={20} 
                        svgPath={(mode as any).svgPath}
                        data-slot="icon"
                      />
                    </Button>
                  );
                })}
            <Button
              type="button"
              size="icon"
              variant="lock"
              data-locked={lockedSpriteMode}
              onClick={() => onLockSpriteMode(!lockedSpriteMode)}
              disabled={!ready}
              aria-label={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
              title={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
              className="control-lock-button"
            >
              {lockedSpriteMode ? (
                <Lock className="h-6 w-6" data-slot="icon" />
              ) : (
                <Unlock className="h-6 w-6" data-slot="icon" />
              )}
            </Button>
          </div>
          </div>
          ) : (
            <div className="control-field">
              <p className="text-sm text-muted-foreground">
                No sprites available in this collection. Add SVG files to the collection folder to enable sprites.
              </p>
            </div>
          )}
        </div>

        {/* Regenerate sprites button */}
        <div className="control-field control-field--spaced-top">
          <div className="switch-row">
            <Button
              ref={randomizeButtonRef}
              type="button"
              size="icon"
              variant="background"
              onClick={() => {
                if (randomizeButtonRef.current) {
                  animatePulse(randomizeButtonRef.current);
                }
                // Regenerate sprites by updating the seed
                if (controller) {
                  const currentState = controller.getState();
                  // Update seed to regenerate sprites with new positions and shapes
                  controller.applyState({
                    ...currentState,
                    seed: `${currentState.seed}-regenerate-${Date.now()}`,
                  });
                }
              }}
              disabled={!ready}
              aria-label="Regenerate sprites"
              title="Regenerate all sprites on the canvas with new positions and sizes"
            >
              <RefreshCw className="h-6 w-6" />
            </Button>
            <div className="field-heading-left">
              <span className="field-label" id="regenerate-sprites-label">
                Regenerate
              </span>
              <TooltipIcon
                id="regenerate-sprites-tip"
                text="Regenerate all sprites on the canvas with new positions and sizes."
                label="Regenerate"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <h3 className="section-title">Density &amp; scale</h3>
        <ControlSlider
          id="density-range"
          label="Tile density"
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
          label="Scale base"
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
          label="Scale range"
          min={0}
          max={100}
          value={Math.round(spriteState.scaleSpread)}
          displayValue={`${Math.round(spriteState.scaleSpread)}%`}
          onChange={(value) => controller?.setScaleSpread(value)}
          disabled={!ready}
          tooltip="Expands or tightens the difference between the smallest and largest sprites."
        />
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <h3 className="section-title">Depth</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="depth-of-field-toggle-label">
                Depth of field
              </span>
              <TooltipIcon
                id="depth-of-field-toggle-tip"
                text="Blur sprites based on their distance from a focus plane. Larger sprites (closer) and smaller sprites (farther) get different blur amounts."
                label="Depth of field"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="depth-of-field-toggle"
              checked={spriteState.depthOfFieldEnabled}
              onCheckedChange={(checked) => controller?.setDepthOfFieldEnabled(checked)}
              disabled={!ready}
              aria-labelledby="depth-of-field-toggle-label"
            />
          </div>
        </div>
        {spriteState.depthOfFieldEnabled && (
          <>
            <ControlSlider
              id="depth-focus"
              label="Focus"
              min={0}
              max={100}
              value={Math.round(spriteState.depthOfFieldFocus)}
              displayValue={`${Math.round(spriteState.depthOfFieldFocus)}%`}
              onChange={(value) => controller?.setDepthOfFieldFocus(value)}
              disabled={!ready}
              tooltip="Adjusts which depth is in focus. Objects at this depth remain sharp."
            />
            <ControlSlider
              id="depth-strength"
              label="Blur strength"
              min={0}
              max={100}
              value={Math.round(spriteState.depthOfFieldStrength)}
              displayValue={`${Math.round(spriteState.depthOfFieldStrength)}%`}
              onChange={(value) => controller?.setDepthOfFieldStrength(value)}
              disabled={!ready}
              tooltip="Controls how blurry objects become when out of focus. Does not affect objects on the focus plane."
            />
          </>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider border-t border-slate-200 dark:border-slate-800" />
        <h3 className="section-title">Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="rotation-toggle-label">
                Rotation offsets
              </span>
              <TooltipIcon
                id="rotation-toggle-tip"
                text="Allow sprites to inherit a static rotation offset based on the slider below."
                label="Rotation offsets"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="rotation-toggle"
              checked={spriteState.rotationEnabled}
              onCheckedChange={onRotationToggle}
              disabled={!ready}
              aria-labelledby="rotation-toggle-label"
            />
          </div>
        </div>
        {spriteState.rotationEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="rotation-amount"
              label="Rotation amount"
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

