import { useEffect, useRef, useState } from "react";
import { createSpriteController } from "@/generator";
import type { GeneratorState } from "@/types/generator";
import type { Animation, CustomAnimation } from "@/types/animations";
import { getDefaultAnimation } from "@/constants/animations";
import { registerPreviewAnimation, unregisterPreviewAnimation } from "@/lib/storage/animationStorage";

interface AnimationThumbnailProps {
  animation: Animation;
  size?: number;
}

export function AnimationThumbnail({ animation, size = 160 }: AnimationThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createSpriteController> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [shouldInitialize, setShouldInitialize] = useState(false);
  const [themeMode, setThemeMode] = useState<string>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  // Use IntersectionObserver to only initialize when thumbnail is visible
  // For editor previews, always initialize immediately (no observer delay)
  useEffect(() => {
    if (!containerRef.current) return;

    // In editor context, initialize immediately to prevent flashing
    // Check if we're in an editor by looking for a parent with specific class or data attribute
    const isInEditor = containerRef.current.closest('[data-animation-editor]') !== null;
    
    if (isInEditor) {
      // In editor: initialize immediately, no delay
      if (!shouldInitialize) {
        setShouldInitialize(true);
      }
      return;
    }

    // Outside editor: use IntersectionObserver for lazy loading
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

  // Watch for theme changes and update state
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          setThemeMode(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !shouldInitialize) return;

    // Check if we're in the editor context (for smooth updates without remounting)
    const isInEditor = containerRef.current.closest('[data-animation-editor]') !== null;
    
    // If controller already exists and we're in editor, update its state instead of recreating
    if (controllerRef.current && isInEditor) {
      const controller = controllerRef.current;
      
      // Build new state from animation
      const squareSpritePath = "/sprites/default/square.svg";
      let state: GeneratorState;
      
      if (animation.isDefault) {
        const defaultAnim = getDefaultAnimation(animation.id);
        if (!defaultAnim) {
          setIsReady(false);
          return;
        }
        
        state = controller.getState();
        const scaleBaseValue = 50 / 100;
        const MIN_TILE_SCALE = 0.12;
        const MAX_TILE_SCALE = 5.5;
        const basePrimaryScale = MIN_TILE_SCALE + (MAX_TILE_SCALE - MIN_TILE_SCALE) * scaleBaseValue;
        const primaryScale = basePrimaryScale * 0.25;
        const secondaryScale = primaryScale * 0.4;
        const isParallax = defaultAnim.movementMode === "parallax";
        const previewMotionSpeed = isParallax ? 1 : 25;
        
        state = {
          ...state,
          movementMode: defaultAnim.movementMode,
          motionIntensity: 50,
          motionSpeed: previewMotionSpeed,
          animationEnabled: true,
          scalePercent: 40,
          scaleBase: 50,
          scaleSpread: 0,
          selectedSprites: [squareSpritePath],
          randomSprites: false,
          paletteId: "pastel",
          paletteVariance: 0,
          seed: `animation-thumbnail-${animation.id}`,
          colorSeedSuffix: "",
          backgroundMode: "auto",
          backgroundBrightness: 100,
          backgroundHueShift: 0,
          backgroundColorIndex: 0,
          thumbnailMode: {
            primaryColorIndex: 0,
            secondaryColorIndex: 0,
            primaryScale: primaryScale,
            secondaryScale: secondaryScale,
            secondaryCount: 7,
            primaryPosition: { u: 0.5, v: 0.5 },
          },
        };
      } else {
        const customAnim = animation as CustomAnimation;
        state = controller.getState();
        const scaleBaseValue = 50 / 100; // Same as default animations for consistency
        const MIN_TILE_SCALE = 0.12;
        const MAX_TILE_SCALE = 5.5;
        const basePrimaryScale = MIN_TILE_SCALE + (MAX_TILE_SCALE - MIN_TILE_SCALE) * scaleBaseValue;
        const primaryScale = basePrimaryScale * 0.25;
        const secondaryScale = primaryScale * 0.4;
        
        state = {
          ...state,
          movementMode: "pulse",
          customAnimationId: customAnim.id, // Update with new animation ID
          motionIntensity: 50,
          motionSpeed: 1, // Very slow for preview (1% of max speed)
          animationEnabled: true,
          scalePercent: 40,
          scaleBase: 50,
          scaleSpread: 0,
          selectedSprites: [squareSpritePath],
          randomSprites: false,
          paletteId: "pastel",
          paletteVariance: 0,
          seed: `animation-thumbnail-${animation.id}`, // Update seed to trigger recompute
          colorSeedSuffix: "",
          backgroundMode: "auto",
          backgroundBrightness: 100,
          backgroundHueShift: 0,
          backgroundColorIndex: 0,
          thumbnailMode: {
            primaryColorIndex: 0,
            secondaryColorIndex: 0,
            primaryScale: primaryScale,
            secondaryScale: secondaryScale,
            secondaryCount: 7,
            primaryPosition: { u: 0.5, v: 0.5 },
          },
        };
      }
      
      // Unregister old preview animation first (if it exists and ID changed)
      if (!animation.isDefault) {
        const oldState = controller.getState();
        const newAnimId = (animation as CustomAnimation).id;
        // Always unregister old one if it exists and is different
        if (oldState.customAnimationId && oldState.customAnimationId !== newAnimId) {
          unregisterPreviewAnimation(oldState.customAnimationId);
        }
        // Always re-register to ensure latest code functions are used (even if same ID, code might have changed)
        unregisterPreviewAnimation(newAnimId); // Unregister first in case it exists
        registerPreviewAnimation(animation as CustomAnimation);
      }
      
      // Update existing controller state instead of recreating
      controller.applyState(state, "instant");
      setIsReady(true);
      return;
    }

    // If controller doesn't exist or we're not in editor, create new controller
    // const isLightMode = themeMode === 'light'; // Unused

    // Get square sprite - use the actual SVG path, not shape identifier
    const squareSpritePath = "/sprites/default/square.svg";

    // Create container for the animated preview - visible and square
    const container = containerRef.current;
    
    // If controller already exists, destroy it first
    if (controllerRef.current) {
      try {
        controllerRef.current.destroy();
      } catch (error) {
        console.error("Error destroying old animation thumbnail:", error);
      }
      controllerRef.current = null;
    }
    
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
      
      // Parallax animations use a much higher base speed (700 px/s), so reduce speed significantly for preview
      const isParallax = defaultAnim.movementMode === "parallax";
      const previewMotionSpeed = isParallax ? 1 : 25; // 1% for parallax (slower for preview), 25% for others
      
      state = {
        ...state,
        movementMode: defaultAnim.movementMode,
        motionIntensity: 50,
        motionSpeed: previewMotionSpeed, // Reduced speed for parallax preview
        animationEnabled: true, // Enable animation
        // Density to show exactly 8 sprites total (1 primary + 7 secondary)
        // Use higher density to ensure we get at least 8 sprites in layer 0
        // The thumbnail mode will ensure we have exactly 8 (1 primary + 7 secondary)
        scalePercent: 40, // Increased to ensure we get at least 8 sprites
        scaleBase: 50, // Base size for primary sprite (larger for visibility)
        scaleSpread: 0, // No spread - thumbnail mode will control sizes
        selectedSprites: [squareSpritePath], // Force square sprite using SVG path
        randomSprites: false,
        // Use neutral palette for thumbnails
        paletteId: "pastel",
        paletteVariance: 0, // No color variation - use exact palette colors
        seed: `animation-thumbnail-${animation.id}`, // Unique seed per animation
        colorSeedSuffix: "", // No suffix to use default color RNG
        // Use auto background mode (uses same palette as sprites)
        backgroundMode: "auto",
        backgroundBrightness: 100,
        backgroundHueShift: 0,
        backgroundColorIndex: 0,
        // Thumbnail mode: control primary and secondary sprites
        thumbnailMode: {
          primaryColorIndex: 0, // First color for main sprite
          secondaryColorIndex: 0, // First color for background sprites
          primaryScale: primaryScale,
          secondaryScale: secondaryScale,
          secondaryCount: 7,
          primaryPosition: { u: 0.5, v: 0.5 },
        },
      };
    } else {
      // For custom animations, use the custom animation code
      const customAnim = animation as CustomAnimation;
      state = controller.getState();
      
      // Calculate scale values: baseScale = lerp(0.12, 5.5, scaleBase/100)
      // Use same scale as default animations for consistency
      const scaleBaseValue = 50 / 100; // 0.5 (same as default animations)
      const MIN_TILE_SCALE = 0.12;
      const MAX_TILE_SCALE = 5.5;
      const basePrimaryScale = MIN_TILE_SCALE + (MAX_TILE_SCALE - MIN_TILE_SCALE) * scaleBaseValue; // ~2.81
      const primaryScale = basePrimaryScale * 0.25; // 75% smaller (~0.703, same as default)
      const secondaryScale = primaryScale * 0.4; // 60% smaller than primary (~0.281, same as default)
      
      state = {
        ...state,
        movementMode: "pulse", // Fallback movement mode (custom animation will override)
        customAnimationId: customAnim.id, // Use custom animation
        motionIntensity: 50,
        motionSpeed: 1, // Very slow for preview (1% of max speed)
        animationEnabled: true, // Enable animation
        // Density to show exactly 8 sprites total (1 primary + 7 secondary)
        // Use higher density to ensure we get at least 8 sprites in layer 0
        // The thumbnail mode will ensure we have exactly 8 (1 primary + 7 secondary)
        scalePercent: 40, // Increased to ensure we get at least 8 sprites
        scaleBase: 50, // Base size for primary sprite (larger for visibility)
        scaleSpread: 0, // No spread - thumbnail mode will control sizes
        selectedSprites: [squareSpritePath], // Force square sprite using SVG path
        randomSprites: false,
        // Use neutral palette for thumbnails
        paletteId: "pastel",
        paletteVariance: 0, // No color variation - use exact palette colors
        seed: `animation-thumbnail-${animation.id}`, // Unique seed per animation
        colorSeedSuffix: "", // No suffix to use default color RNG
        // Use auto background mode (uses same palette as sprites)
        backgroundMode: "auto",
        backgroundBrightness: 100,
        backgroundHueShift: 0,
        backgroundColorIndex: 0,
        // Thumbnail mode: control primary and secondary sprites
        thumbnailMode: {
          primaryColorIndex: 0, // First color for main sprite
          secondaryColorIndex: 0, // First color for background sprites
          primaryScale: primaryScale,
          secondaryScale: secondaryScale,
          secondaryCount: 7,
          primaryPosition: { u: 0.5, v: 0.5 },
        },
      };
    }

    // Register the preview animation temporarily so the controller can find it
    if (!animation.isDefault) {
      registerPreviewAnimation(animation as CustomAnimation);
    }

    // Apply the state first
    controller.applyState(state);
    
    // Set custom aspect ratio to a fixed resolution based on size prop
    // This ensures sprites appear the same size regardless of container width
    // Use size prop directly (not container dimensions) for consistent sprite sizing
    const aspectRatio = 16 / 9;
    const width = size; // Use size prop directly (320px for both contexts)
    const height = Math.round(width / aspectRatio); // Calculate height for 16:9
    controller.setCustomAspectRatio(width, height);
    
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
      // Unregister preview animation when component unmounts or animation changes
      if (!animation.isDefault) {
        unregisterPreviewAnimation(animation.id);
      }
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying animation thumbnail:", error);
        }
        controllerRef.current = null;
      }
    };
  }, [JSON.stringify(animation), size, shouldInitialize, themeMode]); // Use JSON.stringify to detect deep changes in animation object

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
        <div className="absolute inset-0 flex items-center justify-center bg-theme-panel rounded border border-theme-panel">
          <div className="text-xs text-theme-subtle">Loading...</div>
        </div>
      )}
    </div>
  );
}
