import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/Card";
import {
  Tabs,
  TabsTriggerList,
  TabsTrigger,
  TabsPanels,
  TabsContent,
} from "@/components/retroui/Tab";

import type {
  BlendModeOption,
  GeneratorState,
  SpriteMode,
  MovementMode,
} from "./types/generator";
import { PresetManager } from "./components/PresetManager";
import { ExportModal } from "./components/ExportModal";
import { CustomPaletteManager } from "./components/CustomPaletteManager";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { BitlabLogo } from "./components/Header/BitlabLogo";
import {
  SpriteControls,
  FxControls,
  MotionControls,
} from "./components/ControlPanel";
import { palettes, getPalette } from "./data/palettes";
import { useIsMobile } from "./hooks/useIsMobile";
import { useTheme } from "./hooks/useTheme";
import { useFullscreen } from "./hooks/useFullscreen";
import { useSpriteController } from "./hooks/useSpriteController";
import { formatMovementMode } from "./constants/movement";
import { SPRITE_MODES } from "./constants/sprites";
import {
  formatBlendMode,
  generatePaletteOptions,
} from "./lib/utils";


// Constants and formatting functions are now imported from their respective modules

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
  
  // Use extracted hooks
  const { themeMode, setThemeMode, themeColor, setThemeColor, themeShape, setThemeShape } = useTheme();
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
  
  const [controlTabIndex, setControlTabIndex] = useState(0);
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

  /**
   * Check if columns should be split or merged based on viewport width
   * 
   * Uses the responsive layout utilities to determine if there's enough
   * space to split columns while maintaining the canvas at maximum size.
   * 
   * This prevents the "snapping" behavior where columns split before the
   * canvas reaches its maximum size.
   */
  // Responsive column splitting disabled – see note above.
  // const checkLayout = useCallback(() => {
  //   if (typeof window === "undefined") return;
  // NOTE: Responsive split/merge logic is currently disabled.
  // If needed, restore from version control history.
  // }, []);
  //
  // useEffect(() => {
  //   if (typeof window === "undefined") return;
  //   checkLayout();
  //   window.addEventListener("resize", checkLayout);
  //   return () => {
  //     window.removeEventListener("resize", checkLayout);
  //   };
  // }, [checkLayout]);
  //
  // useEffect(() => {
  //   if (!layoutRef.current || typeof ResizeObserver === "undefined") return;
  //   const resizeObserver = new ResizeObserver(() => {
  //     setTimeout(checkLayout, 0);
  //   });
  //   resizeObserver.observe(layoutRef.current);
  //   return () => {
  //     resizeObserver.disconnect();
  //   };
  // }, [checkLayout]);

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
    const params = new URLSearchParams(window.location.search);
    const debugLoader = params.get("debugLoader");
    if (debugLoader === "1") {
      setForceLoader(true);
    }
  }, []);

  // Calculate current canvas size for export modal
  // Use state to track canvas size so it updates when canvas is resized
  const [currentCanvasSize, setCurrentCanvasSize] = useState({ width: 720, height: 720 });
  
  // Function to update canvas size from the actual canvas element
  const updateCanvasSize = useCallback(() => {
    if (!controllerRef.current) {
      return;
    }
    
    const p5Instance = controllerRef.current.getP5Instance();
    if (!p5Instance) {
      return;
    }
    
    // p5.js stores canvas as a property, but TypeScript types don't include it
    const canvas = (p5Instance as any).canvas as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }
    
    setCurrentCanvasSize({
      width: canvas.width,
      height: canvas.height,
    });
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
    const canvas = (p5Instance as any).canvas as HTMLCanvasElement | null;
    if (!canvas) {
      setCurrentCanvasSize({ width: 720, height: 720 });
      return;
    }
    
    const container = sketchContainerRef.current;
    
    // Update immediately
    updateCanvasSize();
    
    // Watch the container for size changes (triggers when layout changes)
    // This will catch both container resizes and window resizes (since container resizes with window)
    let containerResizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      containerResizeObserver = new ResizeObserver(() => {
        // Delay to ensure p5.js has processed the resize
        setTimeout(() => {
          updateCanvasSize();
        }, 50);
      });
      containerResizeObserver.observe(container);
    }
    
    return () => {
      if (containerResizeObserver) {
        containerResizeObserver.disconnect();
      }
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
      return palettes[0];
    }
    return getPalette(spriteState.paletteId);
  }, [spriteState?.paletteId]);

  const currentModeLabel = useMemo(() => {
    if (!spriteState) return SPRITE_MODES[0].label;
    return (
      SPRITE_MODES.find((mode) => mode.value === spriteState.spriteMode)
        ?.label ?? SPRITE_MODES[0].label
    );
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

  const handleRandomSpritesToggle = useCallback((checked: boolean) => {
    controllerRef.current?.setRandomSprites(checked);
  }, []);

  const handleRotationAmountChange = useCallback((value: number) => {
    controllerRef.current?.setRotationAmount(value);
  }, []);

  const handleRotationSpeedChange = useCallback((value: number) => {
    controllerRef.current?.setRotationSpeed(value);
  }, []);

  const handleRotationAnimatedToggle = useCallback(
    (checked: boolean) => {
      controllerRef.current?.setRotationAnimated(checked);
    },
    [],
  );


  // Theme selection handlers are now handled by Header component

  const handleRandomiseAll = useCallback(() => {
    controllerRef.current?.randomizeAll();
  }, []);

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
      <Card
        className={`canvas-card ${isFullscreen ? "canvas-card--fullscreen" : ""}`}
      >
        <Card.Content className="canvas-card__content">
          <div className="canvas-wrapper" ref={canvasWrapperRef}>
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
        </Card.Content>
      </Card>
    </div>
  );

  return (
    <>
    <div className="app-shell">
      <div className="app-frame app-frame--compact app-frame--header">
        <Header
          themeMode={themeMode}
              themeColor={themeColor}
              themeShape={themeShape}
          onThemeModeChange={setThemeMode}
          onThemeColorChange={setThemeColor}
          onThemeShapeChange={setThemeShape}
        />
      </div>

      <div className={`app-frame app-frame--compact app-frame--main${isSmallCanvas ? " app-frame--stacked" : ""}`}>
        <main className="app-main">
          <div
            ref={layoutRef}
            className={`app-layout${isStudioLayout ? " app-layout--studio" : ""}${isWideLayout ? " app-layout--wide" : ""}${isMobile ? " app-layout--mobile" : ""}${isSmallCanvas ? " app-layout--small-canvas" : ""}`}
          >
          <aside className="control-column">
            <Card className="panel">
              <Tabs
                selectedIndex={controlTabIndex}
                onChange={setControlTabIndex}
              >
                <TabsTriggerList className="retro-tabs">
                  <TabsTrigger>Sprites</TabsTrigger>
                  <TabsTrigger>Colours</TabsTrigger>
                  {!isWideLayout && (
                    <>
                      <TabsTrigger>Motion</TabsTrigger>
                    </>
                  )}
                </TabsTriggerList>
                <TabsPanels>
                  <TabsContent>
                    {spriteState && (
                      <SpriteControls
                        spriteState={spriteState}
                        controller={controller}
                        ready={ready}
                        currentModeLabel={currentModeLabel}
                        lockedSpriteMode={lockedSpriteMode}
                        onLockSpriteMode={setLockedSpriteMode}
                        onModeChange={handleModeChange}
                        onRandomSpritesToggle={handleRandomSpritesToggle}
                        onRotationToggle={handleRotationToggle}
                        onRotationAmountChange={handleRotationAmountChange}
                      />
                    )}
                  </TabsContent>
                  <TabsContent>
                    {spriteState && (
                      <FxControls
                        spriteState={spriteState}
                        controller={controller}
                        ready={ready}
                        currentPaletteId={currentPalette.id}
                        currentPaletteName={currentPalette.name}
                        paletteOptions={PALETTE_OPTIONS}
                        canvasPaletteOptions={CANVAS_PALETTE_OPTIONS}
                        lockedSpritePalette={lockedSpritePalette}
                        lockedCanvasPalette={lockedCanvasPalette}
                        lockedBlendMode={lockedBlendMode}
                        onLockSpritePalette={setLockedSpritePalette}
                        onLockCanvasPalette={setLockedCanvasPalette}
                        onLockBlendMode={setLockedBlendMode}
                        onPaletteSelection={handlePaletteSelection}
                        onPaletteOptionSelect={handlePaletteOptionSelect}
                        onBlendSelect={handleBlendSelect}
                        onBlendAutoToggle={handleBlendAutoToggle}
                        onShowCustomPaletteManager={() =>
                          setShowCustomPaletteManager(true)
                        }
                      />
                    )}
                  </TabsContent>
                  {!isWideLayout && (
                    <>
                      <TabsContent>
                        {spriteState && (
                          <MotionControls
                            spriteState={spriteState}
                            controller={controller}
                            ready={ready}
                            showHeading={true}
                            lockedMovementMode={lockedMovementMode}
                            onLockMovementMode={setLockedMovementMode}
                            onMovementSelect={handleMovementSelect}
                            onRotationAnimatedToggle={handleRotationAnimatedToggle}
                            onRotationSpeedChange={handleRotationSpeedChange}
                          />
                        )}
                      </TabsContent>
                    </>
                  )}
                </TabsPanels>
              </Tabs>
            </Card>
          </aside>

          <div className="display-column">
            {renderDisplayContent()}
          </div>

          {isWideLayout && (
            <aside className="motion-column">
              <Card className="panel">
                {spriteState && (
                  <MotionControls
                    spriteState={spriteState}
                    controller={controller}
                    ready={ready}
                    showHeading={true}
                    lockedMovementMode={lockedMovementMode}
                    onLockMovementMode={setLockedMovementMode}
                    onMovementSelect={handleMovementSelect}
                    onRotationAnimatedToggle={handleRotationAnimatedToggle}
                    onRotationSpeedChange={handleRotationSpeedChange}
                  />
                )}
              </Card>
            </aside>
          )}
          </div>
        </main>
      </div>
      <div className="app-frame app-frame--compact app-frame--footer">
        <footer className={`app-footer${isMobile ? " app-footer--mobile" : ""}`}>
          <div className="footer-brand">
            {!isMobile && <BitlabLogo className="footer-logo" />}
          </div>
          <span className="footer-text">
            © {new Date().getFullYear()} BitLab · Generative Playground · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} ·{" "}
            <a href="https://jamescutts.me/" target="_blank" rel="noreferrer">
              jamescutts.me
            </a>
          </span>
        </footer>
      </div>

      {showPresetManager && (
        <PresetManager
          currentState={spriteState}
          onLoadPreset={handleLoadPreset}
          onClose={() => setShowPresetManager(false)}
        />
      )}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          p5Instance={controllerRef.current?.getP5Instance() || null}
          currentCanvasSize={currentCanvasSize}
          controller={controllerRef.current}
        />
      )}
      {showCustomPaletteManager && (
        <CustomPaletteManager
          onClose={() => setShowCustomPaletteManager(false)}
          onPaletteCreated={handleCustomPaletteCreated}
        />
      )}

    </div>
    </>
  );
};

export default App;
