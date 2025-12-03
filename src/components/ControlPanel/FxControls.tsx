import { Switch } from "@/components/ui/switch-adapter";
import { ControlSlider, ControlSelect, TextWithTooltip } from "./shared";
import type {
  GeneratorState,
  SpriteController,
} from "@/types/generator";

interface FxControlsProps {
  spriteState: GeneratorState;
  controller: SpriteController | null;
  ready: boolean;
}

/**
 * FxControls Component
 * 
 * Renders controls for visual effects including Depth of Field, Bloom, and Noise/Grain.
 */
export function FxControls({
  spriteState,
  controller,
  ready,
}: FxControlsProps) {
  return (
    <>
      <h2 className="panel-heading">FX</h2>
      {/* Depth of Field Section */}
      <div className="section">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="dof-tip"
              text="Blur sprites based on their distance from the focus point, creating a depth effect."
            >
              <h3 className="section-title">Depth of Field</h3>
            </TextWithTooltip>
          </div>
          <Switch
            checked={spriteState.depthOfFieldEnabled}
            onCheckedChange={(checked) =>
              controller?.setDepthOfFieldEnabled(checked)
            }
            disabled={!ready}
            aria-label="Enable depth of field"
          />
        </div>
        {spriteState.depthOfFieldEnabled && (
          <>
            <ControlSlider
              id="dof-focus"
              label="Focus point"
              min={0}
              max={100}
              value={Math.round(spriteState.depthOfFieldFocus)}
              displayValue={`${Math.round(spriteState.depthOfFieldFocus)}%`}
              onChange={(value) => controller?.setDepthOfFieldFocus(value)}
              disabled={!ready}
              tooltip="Sets the focus point in the depth range (0% = near, 100% = far)."
            />
            <ControlSlider
              id="dof-strength"
              label="Blur strength"
              min={0}
              max={100}
              value={Math.round(spriteState.depthOfFieldStrength)}
              displayValue={`${Math.round(spriteState.depthOfFieldStrength)}%`}
              onChange={(value) => controller?.setDepthOfFieldStrength(value)}
              disabled={!ready}
              tooltip="Controls the intensity of the blur effect (0% = no blur, 100% = maximum blur)."
            />
          </>
        )}
      </div>

      {/* Bloom Section */}
      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="bloom-tip"
              text="Add a bright, glowing effect to bright areas of the canvas."
            >
              <h3 className="section-title">Bloom</h3>
            </TextWithTooltip>
          </div>
          <Switch
            checked={spriteState.bloomEnabled}
            onCheckedChange={(checked) =>
              controller?.setBloomEnabled(checked)
            }
            disabled={!ready}
            aria-label="Enable bloom"
          />
        </div>
        {spriteState.bloomEnabled && (
          <>
            <ControlSlider
              id="bloom-intensity"
              label="Intensity"
              min={0}
              max={100}
              value={Math.round(spriteState.bloomIntensity)}
              displayValue={`${Math.round(spriteState.bloomIntensity)}%`}
              onChange={(value) => controller?.setBloomIntensity(value)}
              disabled={!ready}
              tooltip="Controls the brightness of the bloom effect."
            />
            <ControlSlider
              id="bloom-threshold"
              label="Threshold"
              min={0}
              max={100}
              value={Math.round(spriteState.bloomThreshold)}
              displayValue={`${Math.round(spriteState.bloomThreshold)}%`}
              onChange={(value) => controller?.setBloomThreshold(value)}
              disabled={!ready}
              tooltip="Brightness threshold for areas that will bloom."
            />
            <ControlSlider
              id="bloom-radius"
              label="Radius"
              min={0}
              max={100}
              value={Math.round(spriteState.bloomRadius)}
              displayValue={`${Math.round(spriteState.bloomRadius)}px`}
              onChange={(value) => controller?.setBloomRadius(value)}
              disabled={!ready}
              tooltip="Size of the bloom effect in pixels."
            />
          </>
        )}
      </div>

      {/* Noise/Grain Section */}
      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="noise-tip"
              text="Add film grain or static noise overlay to the canvas."
            >
              <h3 className="section-title">Noise &amp; Grain</h3>
            </TextWithTooltip>
          </div>
          <Switch
            checked={spriteState.noiseEnabled}
            onCheckedChange={(checked) =>
              controller?.setNoiseEnabled(checked)
            }
            disabled={!ready}
            aria-label="Enable noise"
          />
        </div>
        {spriteState.noiseEnabled && (
          <>
            <ControlSelect
              id="noise-type"
              label="Type"
              value={spriteState.noiseType}
              onChange={(value) =>
                controller?.setNoiseType(value as "grain" | "crt" | "bayer" | "static" | "scanlines")
              }
              disabled={!ready}
              options={[
                { value: "grain", label: "Grain" },
                { value: "crt", label: "CRT" },
                { value: "bayer", label: "Bayer" },
                { value: "static", label: "Static" },
                { value: "scanlines", label: "TV Scanlines" },
              ]}
              tooltip="Type of noise effect to apply."
              currentLabel={
                spriteState.noiseType === "grain"
                  ? "Grain"
                  : spriteState.noiseType === "crt"
                  ? "CRT"
                  : spriteState.noiseType === "bayer"
                  ? "Bayer"
                  : spriteState.noiseType === "static"
                  ? "Static"
                  : "TV Scanlines"
              }
            />
            <ControlSlider
              id="noise-strength"
              label="Strength"
              min={0}
              max={100}
              value={Math.round(spriteState.noiseStrength)}
              displayValue={`${Math.round(spriteState.noiseStrength)}%`}
              onChange={(value) => controller?.setNoiseStrength(value)}
              disabled={!ready}
              tooltip="Intensity of the noise effect."
            />
          </>
        )}
      </div>

      {/* Pixelation Section */}
      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="pixelation-tip"
              text="Reduce canvas resolution by grouping pixels into blocks for a retro game aesthetic."
            >
              <h3 className="section-title">Pixelation</h3>
            </TextWithTooltip>
          </div>
          <Switch
            checked={spriteState.pixelationEnabled}
            onCheckedChange={(checked) => {
              controller?.setPixelationEnabled(checked);
            }}
            disabled={!ready}
            aria-label="Enable pixelation"
          />
        </div>
        {spriteState.pixelationEnabled && (
          <ControlSlider
            id="pixelation-size"
            label="Pixelation size"
            min={1}
            max={50}
            value={Math.round(spriteState.pixelationSize)}
            displayValue={`${Math.round(spriteState.pixelationSize)}px`}
            onChange={(value) => controller?.setPixelationSize(value)}
            disabled={!ready}
            tooltip="Size of pixel blocks. Higher values create more blocky, retro look."
          />
        )}
      </div>

      {/* Colour Quantization Section */}
      <div className="section section--spaced">
        <hr className="section-divider border-t" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TextWithTooltip
              id="colour-quantization-tip"
              text="Reduce colour palette depth for retro 8-bit/16-bit game aesthetic."
            >
              <h3 className="section-title">Colour quantization</h3>
            </TextWithTooltip>
          </div>
          <Switch
            checked={spriteState.colorQuantizationEnabled}
            onCheckedChange={(checked) =>
              controller?.setColorQuantizationEnabled(checked)
            }
            disabled={!ready}
            aria-label="Enable colour quantization"
          />
        </div>
        {spriteState.colorQuantizationEnabled && (
          <ControlSlider
            id="color-quantization-bits"
            label="Colour depth"
            min={4}
            max={24}
            step={4}
            value={spriteState.colorQuantizationBits}
            displayValue={`${spriteState.colorQuantizationBits}-bit`}
            onChange={(value) => controller?.setColorQuantizationBits(value)}
            disabled={!ready}
            tooltip="Reduce colour palette depth. Lower values (4-bit, 8-bit) create retro game aesthetic."
          />
        )}
      </div>
    </>
  );
}

