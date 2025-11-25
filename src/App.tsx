import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { AppLayout } from "@/components/layout/AppLayout";

import type {
  BlendModeOption,
  GeneratorState,
  SpriteMode,
  MovementMode,
} from "./types/generator";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OnboardingPanel } from "./components/Onboarding";
import { hasSeenWelcome } from "./lib/storage/onboardingStorage";

// Lazy load modals for better initial load performance
const PresetManager = lazy(() => import("./components/PresetManager").then(module => ({ default: module.PresetManager })));
const ExportModal = lazy(() => import("./components/ExportModal").then(module => ({ default: module.ExportModal })));
const CustomPaletteManager = lazy(() => import("./components/CustomPaletteManager").then(module => ({ default: module.CustomPaletteManager })));
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { PixliLogo } from "./components/Header/PixliLogo";
import {
  SpriteControls,
  FxControls,
  MotionControls,
} from "./components/ControlPanel";
import { getPalette } from "./data/palettes";
import { useIsMobile } from "./hooks/useIsMobile";
import { useTheme } from "./hooks/useTheme";
import { useFullscreen } from "./hooks/useFullscreen";
import { useSpriteController } from "./hooks/useSpriteController";
import { formatMovementMode } from "./constants/movement";
import { SPRITE_MODES } from "./constants/sprites";
import { getCollection, getSpriteInCollection } from "./constants/spriteCollections";
import {
  formatBlendMode,
  generatePaletteOptions,
} from "./lib/utils";
import { hasCanvas } from "./types/p5-extensions";

/**
 * Hook to track media query matches
 * Used for responsive layout detection
 */
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [query]);

  return matches;
};

// Shared control components are now imported from ControlPanel/shared



const App = () => {
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelpPage, setShowHelpPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  
  // Use extracted hooks
  const { themeMode, setThemeMode } = useTheme();
  const {
    isFullscreen,
    hudVisible,
    handleFullscreenToggle,
    handleFullscreenClose,
    handleHUDMouseEnter,
    handleHUDMouseLeave,
  } = useFullscreen(canvasWrapperRef);
  const { controller, spriteState, frameRate, ready } = useSpriteController(sketchContainerRef);
  const controllerRef = useRef(controller);
  
  // Update controller ref when controller changes
  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);
  
  const [activePanel, setActivePanel] = useState<"sprites" | "colours" | "motion">("sprites");
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCustomPaletteManager, setShowCustomPaletteManager] = useState(false);
  const [customPalettesRefresh, setCustomPalettesRefresh] = useState(0);
  const [lockedMovementMode, setLockedMovementMode] = useState(false);
  const [lockedSpritePalette, setLockedSpritePalette] = useState(false);
  const [lockedCanvasPalette, setLockedCanvasPalette] = useState(false);
  const [lockedBlendMode, setLockedBlendMode] = useState(false);
  const [lockedSpriteMode, setLockedSpriteMode] = useState(false);
  const [forceLoader, setForceLoader] = useState(false);
  
  const isStudioLayout = useMediaQuery("(min-width: 1760px)");
  // NOTE: 03/02/2025 – Responsive split/merge logic is currently disabled to
  // simplify the layout while we concentrate on other features. The previous
  // implementation relied on viewport measurements and observers to decide
  // when to split the columns. Should we need that behaviour again, the old
  // state and effects can be restored from version control.
  const isWideLayout = false;
  const canvasCardShellRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [isSmallCanvas, setIsSmallCanvas] = useState(false);
  const statusBarRef = useRef<HTMLDivElement | null>(null);
  
  // Mobile device detection
  const isMobile = useIsMobile();

  // Check viewport width to determine when to stack canvas above controls
  // Stack when viewport is too narrow to fit control column (344px) + gap (20px) + canvas (480px) + padding (48px) = 892px
  useEffect(() => {
    const checkViewportSize = () => {
      if (typeof window === "undefined") {
        return;
      }
      // Calculate minimum width needed for side-by-side layout
      // Control column (344px) + gap (20px) + canvas min (480px) + padding (48px) = 892px
      const minWidthForSideBySide = 892;
      const viewportWidth = window.innerWidth;
      // Stack when viewport is smaller than needed for side-by-side layout
      setIsSmallCanvas(viewportWidth < minWidthForSideBySide);
    };

    // Check initial size
    checkViewportSize();

    // Listen to window resize
    window.addEventListener("resize", checkViewportSize);

    return () => {
      window.removeEventListener("resize", checkViewportSize);
    };
  }, []);

  // Header overflow logic is now handled by Header component

  useEffect(() => {
    // Wait for sprite controller to be ready before hiding loader
    if (forceLoader) {
        return;
      }

    // Simple check: wait for spriteState and controller to be ready
    if (!spriteState || !controller) {
        return;
      }

    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let initialLoader: HTMLElement | null = null;
    let handleTransitionEnd: ((event: TransitionEvent) => void) | null = null;
    
    // Hide loader once sprite controller is ready
    const hideLoader = () => {
      initialLoader = document.getElementById("initial-loader");
      if (!initialLoader) {
        return;
      }
      
      // Update percentage to 100% before hiding
      const loaderText = document.getElementById("initial-loader-text");
      if (loaderText) {
        loaderText.textContent = "loading 100%";
      }
      
      // Add hidden class to trigger fade-out
      initialLoader.classList.add("initial-loader--hidden");
      
      // Remove after transition completes or fallback timeout
      const removeLoader = () => {
        if (initialLoader && initialLoader.parentNode) {
          initialLoader.parentNode.removeChild(initialLoader);
        }
      };
      
      handleTransitionEnd = (event: TransitionEvent) => {
        if (event.propertyName === "opacity" && event.target === initialLoader) {
          if (initialLoader && handleTransitionEnd) {
            initialLoader.removeEventListener("transitionend", handleTransitionEnd);
          }
          removeLoader();
        }
      };
      
      if (initialLoader && handleTransitionEnd) {
        initialLoader.addEventListener("transitionend", handleTransitionEnd);
      }
      
      // Fallback: remove after 400ms if transition doesn't fire
      fallbackTimeout = window.setTimeout(() => {
        if (initialLoader && handleTransitionEnd) {
          initialLoader.removeEventListener("transitionend", handleTransitionEnd);
        }
        removeLoader();
      }, 400);
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    const frameId = requestAnimationFrame(hideLoader);
    
    // Cleanup for the effect
    return () => {
      cancelAnimationFrame(frameId);
      if (fallbackTimeout) {
        window.clearTimeout(fallbackTimeout);
      }
      if (initialLoader && handleTransitionEnd) {
        initialLoader.removeEventListener("transitionend", handleTransitionEnd);
      }
    };
  }, [spriteState, controller, forceLoader]);

  // Check if welcome screen should be shown
  useEffect(() => {
    if (!hasSeenWelcome() && ready) {
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ready]);


  /**
   * Check if columns should be split or merged based on viewport width
   * 
   * Uses the responsive layout utilities to determine if there's enough
   * space to split columns while maintaining the canvas at maximum size.
   * 
   * This prevents the "snapping" behavior where columns split before the
   * canvas reaches its maximum size.
   */
  // Theme mode/shape cycling and icon logic is now handled by Header component

  // Generate palette options reactively (includes custom palettes)
  const PALETTE_OPTIONS = useMemo(() => {
    return generatePaletteOptions();
  }, [customPalettesRefresh]);

  // Generate canvas palette options from palette options
  const CANVAS_PALETTE_OPTIONS = useMemo(() => {
    return [
      { value: "auto", label: "Palette (auto)" },
      ...PALETTE_OPTIONS,
    ];
  }, [PALETTE_OPTIONS]);

  const handleCustomPaletteCreated = useCallback(() => {
    setCustomPalettesRefresh((prev) => prev + 1);
  }, []);

  // Badge compact mode logic is now handled by StatusBar component

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    // Debug loader only in development
    if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const debugLoader = params.get("debugLoader");
    if (debugLoader === "1") {
      setForceLoader(true);
      }
    }
  }, []);

  // Calculate current canvas size for export modal
  // Use state to track canvas size so it updates when canvas is resized
  const [currentCanvasSize, setCurrentCanvasSize] = useState({ width: 720, height: 720 });
  
  // Function to update canvas size from the actual canvas element
  const updateCanvasSize = useCallback(() => {
    try {
    if (!controllerRef.current) {
        setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
    const p5Instance = controllerRef.current.getP5Instance();
    if (!p5Instance) {
        setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
    // p5.js stores canvas as a property, but TypeScript types don't include it
      const canvas = hasCanvas(p5Instance) ? p5Instance.canvas : null;
    if (!canvas) {
        setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
      // Validate canvas dimensions
      const width = canvas.width || 720;
      const height = canvas.height || 720;
      
      if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
        console.warn("Invalid canvas dimensions, using defaults");
        setCurrentCanvasSize({ width: 720, height: 720 });
        return;
      }
      
      setCurrentCanvasSize({ width, height });
    } catch (error) {
      console.error("Error updating canvas size:", error);
      setCurrentCanvasSize({ width: 720, height: 720 });
    }
  }, []);
  
  // Update canvas size when controller or spriteState changes, and watch for canvas resize
  useEffect(() => {
    if (!controllerRef.current) {
      setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
    const p5Instance = controllerRef.current.getP5Instance();
    if (!p5Instance) {
      setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
    // p5.js stores canvas as a property, but TypeScript types don't include it
    const canvas = hasCanvas(p5Instance) ? p5Instance.canvas : null;
    if (!canvas) {
      setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
    const container = sketchContainerRef.current;
    
    // Update immediately with a small delay to ensure canvas is ready
    const initialUpdate = setTimeout(() => {
      updateCanvasSize();
    }, 100);
    
    // Watch the container for size changes (triggers when layout changes)
    // This will catch both container resizes and window resizes (since container resizes with window)
    let containerResizeObserver: ResizeObserver | null = null;
    let canvasResizeObserver: ResizeObserver | null = null;
    let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    
    if (container && typeof ResizeObserver !== 'undefined') {
      containerResizeObserver = new ResizeObserver(() => {
        // Clear any pending resize timeout
        if (resizeTimeoutId) {
          clearTimeout(resizeTimeoutId);
        }
        // Delay to ensure p5.js has processed the resize
        resizeTimeoutId = setTimeout(() => {
          updateCanvasSize();
          resizeTimeoutId = null;
        }, 50);
      });
      containerResizeObserver.observe(container);
    }
    
    // Also watch the canvas element directly for size changes
    if (canvas && typeof ResizeObserver !== 'undefined') {
      canvasResizeObserver = new ResizeObserver(() => {
        // Clear any pending resize timeout
        if (resizeTimeoutId) {
          clearTimeout(resizeTimeoutId);
        }
        // Delay to ensure p5.js has processed the resize
        resizeTimeoutId = setTimeout(() => {
          updateCanvasSize();
          resizeTimeoutId = null;
        }, 50);
      });
      canvasResizeObserver.observe(canvas);
    }
    
    // Also listen for window resize events as a fallback
    const handleWindowResize = () => {
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
      }
      resizeTimeoutId = setTimeout(() => {
        updateCanvasSize();
        resizeTimeoutId = null;
      }, 100);
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      clearTimeout(initialUpdate);
      // Clear any pending resize timeout
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
        resizeTimeoutId = null;
      }
      // Disconnect ResizeObservers
      if (containerResizeObserver) {
        containerResizeObserver.disconnect();
        containerResizeObserver = null;
      }
      if (canvasResizeObserver) {
        canvasResizeObserver.disconnect();
        canvasResizeObserver = null;
      }
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [spriteState, controllerRef.current, updateCanvasSize]);
  
  // Also update canvas size when layout changes (columns split/merge)
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     updateCanvasSize();
  //   }, 100);
  //   return () => clearTimeout(timeoutId);
  // }, [isWideLayout, updateCanvasSize]);

  const currentPalette = useMemo(() => {
    if (!spriteState?.paletteId) {
      return getPalette("neon"); // Fallback to default palette
    }
    return getPalette(spriteState.paletteId);
  }, [spriteState?.paletteId]);

  const currentModeLabel = useMemo(() => {
    if (!spriteState) return SPRITE_MODES[0].label;
    
    // Check if it's a shape-based mode (primitives)
    const shapeMode = SPRITE_MODES.find((mode) => mode.value === spriteState.spriteMode);
    if (shapeMode) {
      return shapeMode.label;
    }
    
    // Otherwise, it might be an SVG sprite from a collection
    const collection = getCollection(spriteState.spriteCollectionId || "primitives");
    if (collection && !collection.isShapeBased) {
      const sprite = getSpriteInCollection(spriteState.spriteCollectionId || "primitives", spriteState.spriteMode);
      if (sprite) {
        return sprite.name;
      }
    }
    
    return SPRITE_MODES[0].label;
  }, [spriteState]);

  // Removed: This was preventing Motion tab from working when merged
  // The tabs should work fine when merged since they're rendered conditionally
  // useEffect(() => {
  //   if (!isWideLayout && controlTabIndex > 1) {
  //     setControlTabIndex(0);
  //   }
  // }, [isWideLayout, controlTabIndex]);


  // Controller initialization is now handled by useSpriteController hook

  const handlePaletteSelection = useCallback((paletteId: string) => {
    if (!controllerRef.current) {
      return;
    }
    controllerRef.current.setHueShift(0);
    controllerRef.current.usePalette(paletteId);
  }, []);

  const handlePaletteOptionSelect = useCallback((paletteId: string) => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }
    controller.setHueShift(0);
    if (controller.getState().paletteId === paletteId) {
      controller.usePalette(paletteId);
    }
  }, []);

  const handleBlendSelect = useCallback((mode: BlendModeOption) => {
    controllerRef.current?.setBlendMode(mode);
  }, []);

  const handleBlendAutoToggle = useCallback((checked: boolean) => {
    controllerRef.current?.setBlendModeAuto(checked);
  }, []);

  const handleModeChange = useCallback((mode: SpriteMode) => {
    controllerRef.current?.setSpriteMode(mode);
  }, []);

  const handleMovementSelect = useCallback((mode: MovementMode) => {
    controllerRef.current?.setMovementMode(mode);
  }, []);

  const handleRotationToggle = useCallback((checked: boolean) => {
    controllerRef.current?.setRotationEnabled(checked);
  }, []);


  const handleRotationAmountChange = useCallback((value: number) => {
    controllerRef.current?.setRotationAmount(value);
  }, []);

  const handleRotationSpeedChange = useCallback((value: number) => {
    controllerRef.current?.setRotationSpeed(value);
  }, []);

  const handleHueRotationEnabledToggle = useCallback(
    (enabled: boolean) => {
      controllerRef.current?.setHueRotationEnabled(enabled);
    },
    [],
  );

  const handleHueRotationSpeedChange = useCallback(
    (speed: number) => {
      controllerRef.current?.setHueRotationSpeed(speed);
    },
    [],
  );

  const handlePaletteCycleEnabledToggle = useCallback(
    (enabled: boolean) => {
      controllerRef.current?.setPaletteCycleEnabled(enabled);
    },
    [],
  );

  const handlePaletteCycleSpeedChange = useCallback(
    (speed: number) => {
      controllerRef.current?.setPaletteCycleSpeed(speed);
    },
    [],
  );

  const handleCanvasHueRotationEnabledToggle = useCallback(
    (enabled: boolean) => {
      controllerRef.current?.setCanvasHueRotationEnabled(enabled);
    },
    [],
  );

  const handleCanvasHueRotationSpeedChange = useCallback(
    (speed: number) => {
      controllerRef.current?.setCanvasHueRotationSpeed(speed);
    },
    [],
  );

  const handleRotationAnimatedToggle = useCallback(
    (checked: boolean) => {
      controllerRef.current?.setRotationAnimated(checked);
    },
    [],
  );


  // Theme selection handlers are now handled by Header component

  const handleRandomiseAll = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    // Randomise core state
    controller.randomizeAll();
    // Also randomise blend mode when not locked.
    // Do NOT change the user's auto toggle preference.
    if (!lockedBlendMode) {
      controller.randomizeBlendMode();
    }
  }, [lockedBlendMode]);

  // Keyboard shortcuts removed

  // Fullscreen management is now handled by useFullscreen hook

  // Theme management is now handled by useTheme hook

  // SpriteControls rendering is now handled by SpriteControls component

  // MotionControls rendering is now handled by MotionControls component


  // FxControls rendering is now handled by FxControls component



  const handleLoadPreset = useCallback(
    (state: GeneratorState) => {
      controllerRef.current?.applyState(state);
    },
    [],
  );



  // StatusBar rendering is now handled by StatusBar component

  const renderDisplayContent = () => (
    <div className="canvas-card-shell" ref={canvasCardShellRef}>
      <div className={`canvas-wrapper ${isFullscreen ? "canvas-card--fullscreen" : ""}`} ref={canvasWrapperRef}>
        <div
          className="sketch-container"
          ref={sketchContainerRef}
          aria-live="polite"
        />
        {/* Fullscreen HUD - MUST be inside canvas-wrapper (the actual fullscreen element) */}
        {isFullscreen && (
          <div
            id="fullscreen-hud"
            style={{
              position: "fixed",
              bottom: "24px",
              left: "50%",
              transform: hudVisible
                ? "translateX(-50%)"
                : "translateX(-50%) translateY(20px)",
              pointerEvents: hudVisible ? "auto" : "none",
              opacity: hudVisible ? 1 : 0,
              visibility: hudVisible ? "visible" : "hidden",
              display: "flex",
              zIndex: 2147483648,
              transition:
                "opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease",
              width: "800px",
              minWidth: "800px",
              gap: "16px",
              whiteSpace: "nowrap",
            }}
          >
            <StatusBar
              spriteState={spriteState}
              frameRate={frameRate}
              ready={ready}
              isFullscreen={isFullscreen}
              hudVisible={hudVisible}
              onMouseEnter={handleHUDMouseEnter}
              onMouseLeave={handleHUDMouseLeave}
              onRandomiseAll={handleRandomiseAll}
              onShowPresets={() => setShowPresetManager(true)}
              onShowExport={() => setShowExportModal(true)}
              onFullscreenToggle={handleFullscreenToggle}
              onFullscreenClose={handleFullscreenClose}
              formatBlendMode={formatBlendMode}
              formatMovementMode={formatMovementMode}
              currentModeLabel={currentModeLabel}
              currentPaletteName={currentPalette.name}
              statusBarRef={statusBarRef}
            />
          </div>
        )}
      </div>
      {!isFullscreen && (
        <StatusBar
          spriteState={spriteState}
          frameRate={frameRate}
          ready={ready}
          isFullscreen={isFullscreen}
          hudVisible={hudVisible}
          onMouseEnter={handleHUDMouseEnter}
          onMouseLeave={handleHUDMouseLeave}
          onRandomiseAll={handleRandomiseAll}
          onShowPresets={() => setShowPresetManager(true)}
          onShowExport={() => setShowExportModal(true)}
          onFullscreenToggle={handleFullscreenToggle}
          onFullscreenClose={handleFullscreenClose}
          formatBlendMode={formatBlendMode}
          formatMovementMode={formatMovementMode}
          currentModeLabel={currentModeLabel}
          currentPaletteName={currentPalette.name}
          statusBarRef={statusBarRef}
        />
      )}
    </div>
  );

  // Prepare sidebar props
  const sidebarProps = {
    activePanel,
    onPanelChange: setActivePanel,
    spriteState,
    controller,
    ready,
    currentModeLabel,
    lockedSpriteMode,
    lockedSpritePalette,
    lockedCanvasPalette,
    lockedBlendMode,
    lockedMovementMode,
    onLockSpriteMode: setLockedSpriteMode,
    onLockSpritePalette: setLockedSpritePalette,
    onLockCanvasPalette: setLockedCanvasPalette,
    onLockBlendMode: setLockedBlendMode,
    onModeChange: handleModeChange,
    onRotationToggle: handleRotationToggle,
    onRotationAmountChange: handleRotationAmountChange,
    currentPaletteId: currentPalette.id,
    currentPaletteName: currentPalette.name,
    paletteOptions: PALETTE_OPTIONS,
    canvasPaletteOptions: CANVAS_PALETTE_OPTIONS,
    onPaletteSelection: handlePaletteSelection,
    onPaletteOptionSelect: handlePaletteOptionSelect,
    onBlendSelect: handleBlendSelect,
    onBlendAutoToggle: handleBlendAutoToggle,
    onLockMovementMode: setLockedMovementMode,
    onMovementSelect: handleMovementSelect,
    onRotationAnimatedToggle: handleRotationAnimatedToggle,
    onRotationSpeedChange: handleRotationSpeedChange,
    onHueRotationEnabledToggle: handleHueRotationEnabledToggle,
    onHueRotationSpeedChange: handleHueRotationSpeedChange,
    onPaletteCycleEnabledToggle: handlePaletteCycleEnabledToggle,
    onPaletteCycleSpeedChange: handlePaletteCycleSpeedChange,
    onCanvasHueRotationEnabledToggle: handleCanvasHueRotationEnabledToggle,
    onCanvasHueRotationSpeedChange: handleCanvasHueRotationSpeedChange,
    onShowCustomPaletteManager: () => setShowCustomPaletteManager(true),
    isWideLayout,
  };

  // Calculate header height and set CSS variable
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        const height = footerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--footer-height', `${height}px`);
      }
    };
    updateFooterHeight();
    window.addEventListener('resize', updateFooterHeight);
    return () => window.removeEventListener('resize', updateFooterHeight);
  }, []);

  return (
    <>
    {/* Header - Full width, outside AppLayout */}
    <div ref={headerRef} className="app-frame app-frame--compact app-frame--header w-full">
      <Header
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        onOpenOnboarding={() => {
          setShowOnboarding(true);
        }}
        onOpenSettings={() => {
          setShowOnboarding(true);
        }}
      />
    </div>

    <AppLayout sidebarProps={sidebarProps}>
      <div className="app-shell">

        <div className={`app-frame app-frame--compact app-frame--main${isSmallCanvas ? " app-frame--stacked" : ""}`}>
          <main className="app-main">
            <div
              ref={layoutRef}
              className={`app-layout${isStudioLayout ? " app-layout--studio" : ""}${isWideLayout ? " app-layout--wide" : ""}${isMobile ? " app-layout--mobile" : ""}${isSmallCanvas ? " app-layout--small-canvas" : ""}`}
            >
              <div className="display-column">
                {renderDisplayContent()}
              </div>
            </div>
          </main>
        </div>
      <div ref={footerRef} className="app-frame app-frame--compact app-frame--footer">
        <footer className={`app-footer${isMobile ? " app-footer--mobile" : ""}`}>
          <div className="footer-brand">
            {!isMobile && <PixliLogo className="footer-logo" />}
          </div>
          <span className="footer-text">
            © {new Date().getFullYear()} Pixli · generative art toy · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} ·{" "}
            <a href="https://jamescutts.me/" target="_blank" rel="noreferrer">
              jamescutts.me
            </a>
          </span>
        </footer>
      </div>
      </div>
    </AppLayout>

      {showPresetManager && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
        <PresetManager
          currentState={spriteState}
          onLoadPreset={handleLoadPreset}
          onClose={() => setShowPresetManager(false)}
        />
          </Suspense>
        </ErrorBoundary>
      )}
      {showExportModal && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          p5Instance={controllerRef.current?.getP5Instance() || null}
          currentCanvasSize={currentCanvasSize}
          controller={controllerRef.current}
        />
          </Suspense>
        </ErrorBoundary>
      )}
      {showCustomPaletteManager && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
            <CustomPaletteManager
              onClose={() => setShowCustomPaletteManager(false)}
              onPaletteCreated={handleCustomPaletteCreated}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Onboarding Panel */}
      <OnboardingPanel
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
};

export default App;
