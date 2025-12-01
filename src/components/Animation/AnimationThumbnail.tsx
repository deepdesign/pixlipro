import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState } from "@/types/generator";
import type { Animation } from "@/types/animations";
import { getDefaultAnimation } from "@/constants/animations";

interface AnimationThumbnailProps {
  animation: Animation;
  size?: number;
}

export function AnimationThumbnail({ animation, size = 160 }: AnimationThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createSpriteController> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [shouldInitialize, setShouldInitialize] = useState(false);

  // Use IntersectionObserver to only initialize when thumbnail is visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldInitialize) {
            // Add a small random delay to stagger initialization
            const delay = Math.random() * 200; // 0-200ms random delay
            setTimeout(() => {
              setShouldInitialize(true);
            }, delay);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading slightly before visible
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [shouldInitialize]);

  useEffect(() => {
    if (!containerRef.current || !shouldInitialize) return;

    // Get square sprite - use the actual SVG path, not shape identifier
    const squareSpritePath = "/sprites/default/square.svg";

    // Create container for the animated preview - visible and square
    const container = containerRef.current;
    
    // Create sprite controller
    const controller = createSpriteController(container, {
      onStateChange: () => {},
    });

    // Build generator state from animation
    let state: GeneratorState;
    
    if (animation.isDefault) {
      // For default animations, use the movement mode
      const defaultAnim = getDefaultAnimation(animation.id);
      if (!defaultAnim) {
        setIsReady(false);
        return;
      }
      
      // Create a basic state with the animation's movement mode
      state = controller.getState();
      
      // Calculate scale values: baseScale = lerp(0.12, 5.5, scaleBase/100)
      // Make primary sprite 75% smaller
      const scaleBaseValue = 50 / 100; // 0.5 (50% of max scale)
      const MIN_TILE_SCALE = 0.12;
      const MAX_TILE_SCALE = 5.5;
      const basePrimaryScale = MIN_TILE_SCALE + (MAX_TILE_SCALE - MIN_TILE_SCALE) * scaleBaseValue; // ~2.81
      const primaryScale = basePrimaryScale * 0.25; // 75% smaller (~0.703)
      const secondaryScale = primaryScale * 0.4; // 60% smaller than primary (~0.281)
      
      state = {
        ...state,
        movementMode: defaultAnim.movementMode,
        motionIntensity: 50,
        motionSpeed: 25, // 50% of 50% = 25% speed for animation (half of current speed)
        animationEnabled: true, // Enable animation
        // Density to show exactly 8 sprites total (1 primary + 7 secondary)
        // Use higher density to ensure we get at least 8 sprites in layer 0
        // The thumbnail mode will ensure we have exactly 8 (1 primary + 7 secondary)
        scalePercent: 40, // Increased to ensure we get at least 8 sprites
        scaleBase: 50, // Base size for primary sprite (larger for visibility)
        scaleSpread: 0, // No spread - thumbnail mode will control sizes
        selectedSprites: [squareSpritePath], // Force square sprite using SVG path
        randomSprites: false,
        // Use slate palette: slate-50 (index 0) for primary, slate-800 (index 1) for secondary
        paletteId: "slate",
        paletteVariance: 0, // No color variation - use exact palette colors
        seed: `animation-thumbnail-${animation.id}`, // Unique seed per animation
        colorSeedSuffix: "", // No suffix to use default color RNG
        // Use slate-800 background (dark mode)
        backgroundMode: "slate-bg", // Use slate-bg palette for background
        backgroundBrightness: 100, // Full brightness for slate-800
        backgroundHueShift: 0,
        backgroundColorIndex: 0, // Use first color from slate-bg palette (slate-800)
        // Thumbnail mode: control primary and secondary sprites
        thumbnailMode: {
          primaryColorIndex: 0, // slate-50 (first color in slate palette)
          secondaryColorIndex: 1, // slate-800 (second color in slate palette)
          primaryScale: primaryScale, // Base scale for primary sprite
          secondaryScale: secondaryScale, // 50% of primary for secondary sprites
          secondaryCount: 7, // 7 secondary sprites
          primaryPosition: { u: 0.5, v: 0.5 }, // Center position for primary sprite
        },
      };
    } else {
      // For custom animations, create basic state
      // TODO: Apply custom path when path system is implemented (Phase 3)
      state = controller.getState();
      
      // Calculate scale values: baseScale = lerp(0.12, 5.5, scaleBase/100)
      // Make primary sprite 75% smaller
      const scaleBaseValue = 30 / 100; // 0.3
      const MIN_TILE_SCALE = 0.12;
      const MAX_TILE_SCALE = 5.5;
      const basePrimaryScale = MIN_TILE_SCALE + (MAX_TILE_SCALE - MIN_TILE_SCALE) * scaleBaseValue; // ~1.734
      const primaryScale = basePrimaryScale * 0.25; // 75% smaller (~0.434)
      const secondaryScale = primaryScale * 0.4; // 60% smaller than primary (~0.174)
      
      state = {
        ...state,
        movementMode: "pulse", // Fallback until custom paths are implemented
        motionIntensity: 50,
        motionSpeed: 25, // 50% of 50% = 25% speed for animation (half of current speed)
        animationEnabled: true, // Enable animation
        // Density to show exactly 8 sprites total (1 primary + 7 secondary)
        // Use higher density to ensure we get at least 8 sprites in layer 0
        // The thumbnail mode will ensure we have exactly 8 (1 primary + 7 secondary)
        scalePercent: 40, // Increased to ensure we get at least 8 sprites
        scaleBase: 50, // Base size for primary sprite (larger for visibility)
        scaleSpread: 0, // No spread - thumbnail mode will control sizes
        selectedSprites: [squareSpritePath], // Force square sprite using SVG path
        randomSprites: false,
        // Use slate palette: slate-50 (index 0) for primary, slate-800 (index 1) for secondary
        paletteId: "slate",
        paletteVariance: 0, // No color variation - use exact palette colors
        seed: `animation-thumbnail-${animation.id}`, // Unique seed per animation
        colorSeedSuffix: "", // No suffix to use default color RNG
        // Use slate-800 background (dark mode)
        backgroundMode: "slate-bg", // Use slate-bg palette for background
        backgroundBrightness: 100, // Full brightness for slate-800
        backgroundHueShift: 0,
        backgroundColorIndex: 0, // Use first color from slate-bg palette (slate-800)
        // Thumbnail mode: control primary and secondary sprites
        thumbnailMode: {
          primaryColorIndex: 0, // slate-50 (first color in slate palette)
          secondaryColorIndex: 1, // slate-800 (second color in slate palette)
          primaryScale: primaryScale, // Base scale for primary sprite
          secondaryScale: secondaryScale, // 50% of primary for secondary sprites
          secondaryCount: 7, // 7 secondary sprites
          primaryPosition: { u: 0.5, v: 0.5 }, // Center position for primary sprite
        },
      };
    }

    // Apply the state first
    controller.applyState(state);
    
    // Set custom aspect ratio to square (1:1) after applying state
    controller.setCustomAspectRatio(size * 2, size * 2);
    
    controllerRef.current = controller;

    // Ensure p5 loop is running for continuous animation
    // Reduced timeout for faster initialization
    const timeoutId = setTimeout(() => {
      try {
        const p5Instance = controller.getP5Instance();
        if (p5Instance) {
          // Ensure p5 loop is running (it should be by default, but make sure)
          if ('loop' in p5Instance && typeof p5Instance.loop === 'function') {
            p5Instance.loop();
          }
          setIsReady(true);
        } else {
          console.warn("P5 instance not found for animation thumbnail");
          setIsReady(false);
        }
      } catch (error) {
        console.error("Failed to initialize animation thumbnail:", error);
        setIsReady(false);
      }
    }, 200); // Reduced from 500ms to 200ms for faster initialization

    return () => {
      clearTimeout(timeoutId);
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [animation, size, shouldInitialize]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      style={{
        minHeight: `${size}px`,
        minWidth: `${size}px`,
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-400">Loading...</div>
        </div>
      )}
    </div>
  );
}
