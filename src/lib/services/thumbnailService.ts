import { createThumbnail, getCanvasFromP5 } from "./exportService";
import type { GeneratorState } from "@/generator";
import type { SpriteController } from "@/generator";

/**
 * Generates a thumbnail for a scene using the main controller's canvas
 * This is the simpler approach that uses the existing canvas directly
 */
export async function generateSceneThumbnail(
  state: GeneratorState,
  size: number = 80,
  controller?: SpriteController | null
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("[thumbnailService] generateSceneThumbnail called", {
      hasController: !!controller,
      size,
      stateSeed: state?.seed
    });
    
    try {
      // If controller is provided, use its canvas directly (simpler approach)
      if (!controller) {
        console.error("[thumbnailService] No controller provided");
        reject(new Error("Controller is required to generate thumbnail"));
        return;
      }

      // Save the current state so we can restore it after capturing
      const currentState = controller.getState();
      console.log("[thumbnailService] Saved current state, applying new state...");
      
      // Apply the state to the controller first
      controller.applyState(state, "instant");
      console.log("[thumbnailService] State applied, waiting for render...");
      
      let retryCount = 0;
      const maxRetries = 30; // Try for up to 3 seconds (30 * 100ms)
      
      const tryCapture = () => {
        try {
          const p5Instance = controller.getP5Instance();
          if (!p5Instance) {
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(tryCapture, 100);
              return;
            }
            // Restore state before rejecting
            controller.applyState(currentState, "instant");
            reject(new Error("P5 instance not available after retries"));
            return;
          }

          const canvas = getCanvasFromP5(p5Instance);
          if (!canvas) {
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(tryCapture, 100);
              return;
            }
            // Restore state before rejecting
            controller.applyState(currentState, "instant");
            reject(new Error("Canvas not found after retries"));
            return;
          }

          if (canvas.width === 0 || canvas.height === 0) {
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(tryCapture, 100);
              return;
            }
            // Restore state before rejecting
            controller.applyState(currentState, "instant");
            reject(new Error(`Canvas has zero dimensions: ${canvas.width}x${canvas.height}`));
            return;
          }

          // Wait for rendering to complete - use multiple frames to ensure state is rendered
          // Give it extra time to ensure the new state is fully rendered
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // One more frame to be absolutely sure
                requestAnimationFrame(() => {
                  try {
                    console.log("[thumbnailService] Capturing thumbnail from canvas", {
                      canvasWidth: canvas.width,
                      canvasHeight: canvas.height,
                      targetSize: size
                    });
                    
                    const thumbnail = createThumbnail(canvas, size);
                    
                    console.log("[thumbnailService] Thumbnail created", {
                      hasThumbnail: !!thumbnail,
                      thumbnailLength: thumbnail?.length || 0,
                      thumbnailStart: thumbnail ? thumbnail.substring(0, 50) : 'none'
                    });
                    
                    if (!thumbnail || thumbnail.length === 0) {
                      // Restore state before rejecting
                      controller.applyState(currentState, "instant");
                      throw new Error("createThumbnail returned empty string");
                    }
                    
                    // Restore the original state after successful capture
                    console.log("[thumbnailService] Restoring original state...");
                    controller.applyState(currentState, "instant");
                    
                    console.log("[thumbnailService] Thumbnail generation complete, resolving...");
                    resolve(thumbnail);
                  } catch (error) {
                    console.error("[thumbnailService] Error creating thumbnail:", error);
                    // Restore state before rejecting
                    controller.applyState(currentState, "instant");
                    reject(error);
                  }
                });
              });
            });
          });
        } catch (error) {
          console.error("Error getting canvas from controller:", error);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(tryCapture, 100);
          } else {
            // Restore state before rejecting
            controller.applyState(currentState, "instant");
            reject(error);
          }
        }
      };

      // Start trying to capture after a delay to allow state to apply
      // Use a longer initial delay to ensure state is applied
      setTimeout(tryCapture, 300);
    } catch (error) {
      console.error("Error in generateSceneThumbnail:", error);
      reject(error);
    }
  });
}

