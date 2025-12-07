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
import { SettingsPage } from "./pages/SettingsPage";
import { ProjectorPage } from "./pages/ProjectorPage";
import { MobileRemote } from "./pages/MobileRemote";
import { SequencesPage } from "./pages/SequencesPage";
import { ScenesPage } from "./pages/ScenesPage";
import { PalettesPage } from "./pages/PalettesPage";
import { SpritesPage } from "./pages/SpritesPage";
import { AnimationPage } from "./pages/AnimationPage";
import { ButtonTestPage } from "./pages/ButtonTestPage";
import { useDualMonitor } from "./hooks/useDualMonitor";
import { useWebSocket } from "./hooks/useWebSocket";
import { useOSC } from "./hooks/useOSC";
import { useMIDI } from "./hooks/useMIDI";
import { useDMX } from "./hooks/useDMX";
import { getAllScenes, loadSceneState } from "./lib/storage/sceneStorage";
import { loadSettings } from "./lib/storage/settingsStorage";
import { getActiveTheme } from "./lib/storage/themeStorage";
import { applyTheme } from "./lib/theme/themeApplier";

// Lazy load modals for better initial load performance
const SceneManager = lazy(() => import("./components/SceneManager").then(module => ({ default: module.SceneManager })));
const ExportModal = lazy(() => import("./components/ExportModal").then(module => ({ default: module.ExportModal })));
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { getPalette } from "./data/palettes";
import { Maximize2 } from "lucide-react";
import { Button } from "./components/Button";
import { useIsMobile } from "./hooks/useIsMobile";
import { useTheme } from "./hooks/useTheme";
import { useFullscreen } from "./hooks/useFullscreen";
import { useSpriteController } from "./hooks/useSpriteController";
import { SPRITE_MODES } from "./constants/sprites";
import { getCollection, getSpriteInCollection } from "./constants/spriteCollections";
import {
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

// Canvas hover wrapper component
const CanvasHoverWrapper = ({
  isFullscreen,
  ready,
  onFullscreenToggle,
  children,
}: {
  isFullscreen: boolean;
  ready: boolean;
  onFullscreenToggle: () => void;
  children: React.ReactNode;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={(e) => {
        // Only hide if we're not moving to the overlay
        if (overlayRef.current) {
          // If relatedTarget is null or not a Node, hide the overlay
          if (!e.relatedTarget || !(e.relatedTarget instanceof Node)) {
            setIsHovered(false);
          } else if (!overlayRef.current.contains(e.relatedTarget)) {
            // If relatedTarget is a Node but not contained in overlay, hide
            setIsHovered(false);
          }
        }
      }}
    >
      <div
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        {children}
      </div>
      {/* Fullscreen overlay - top right */}
      <div 
        ref={overlayRef}
        className={`absolute transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ top: '12px', right: '12px', zIndex: 30 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={onFullscreenToggle}
          disabled={!ready}
          className="bg-theme-panel/90 backdrop-blur-sm border border-theme-card"
          aria-label="Enter fullscreen"
          title="Enter fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Shared control components are now imported from ControlPanel/shared



const App = () => {
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  
  // Check if we're in projector or mobile remote mode
  const isProjectorMode = window.location.pathname === "/projector";
  const isMobileRemote = window.location.pathname === "/remote";
  const isButtonTestPage = window.location.pathname === "/buttons";
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState<"create" | "sprites" | "palettes" | "scenes" | "sequences" | "settings" | "animation" | null>(null);
  
  // Settings state (kept for backward compatibility)
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  
  // Dual monitor support
  const dualMonitor = useDualMonitor();
  
  // Use extracted hooks
  const { themeMode, setThemeMode } = useTheme();
  const {
    isFullscreen,
    hudVisible,
    handleFullscreenToggle,
    handleHUDMouseEnter,
    handleHUDMouseLeave,
  } = useFullscreen(canvasWrapperRef);
  const { controller, spriteState, frameRate, ready } = useSpriteController(sketchContainerRef);
  const controllerRef = useRef(controller);
  
  // Update controller ref when controller changes
  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  // Apply active theme on app initialization
  useEffect(() => {
    const activeTheme = getActiveTheme();
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  }, []);
  
  // Sync state to projector window (no longer streaming frames - projector creates its own controller)
  // Set up BroadcastChannel once and keep it open
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const spriteStateRef = useRef(spriteState);
  const projectorWindowsRef = useRef<Set<Window>>(new Set());
  
  // Keep spriteStateRef in sync with spriteState
  useEffect(() => {
    spriteStateRef.current = spriteState;
  }, [spriteState]);
  
  // Set up BroadcastChannel immediately on mount (before spriteState is ready)
  useEffect(() => {
    if (isProjectorMode) {
      return; // Don't sync if we're in projector mode
    }

    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    // Create channel once and keep it open
    if (!broadcastChannelRef.current) {
      const channel = new BroadcastChannel("pixli-projector-sync");
      broadcastChannelRef.current = channel;

      // Handle state requests - respond immediately even if spriteState isn't ready yet
      channel.onmessage = (event) => {
        if (event.data.type === "request-state") {
          const currentState = spriteStateRef.current;
          if (currentState) {
            try {
              channel.postMessage({
                type: "state-update",
                state: currentState,
                timestamp: Date.now(),
              });
            } catch (error) {
              console.error("[App] Error sending state update:", error);
            }
          }
        }
      };
      
      // Also listen for window.postMessage as fallback
      const handleWindowMessage = (event: MessageEvent) => {
        // Only accept messages from same origin
        if (event.origin !== window.location.origin) {
          return;
        }
        
        // Track the source window if it's a projector window
        if (event.source && event.source !== window) {
          projectorWindowsRef.current.add(event.source as Window);
        }
        
        if (event.data?.type === "pixli-request-state") {
          const currentState = spriteStateRef.current;
          if (currentState && event.source) {
            try {
              (event.source as Window).postMessage({
                type: "pixli-state-update",
                state: currentState,
                timestamp: Date.now(),
              }, window.location.origin);
            } catch (error) {
              console.error("[App] Error sending state via window.postMessage:", error);
            }
          }
        }
      };
      
      window.addEventListener("message", handleWindowMessage);
      
      // Store handler for cleanup
      (channel as any)._windowMessageHandler = handleWindowMessage;
      
      // Send initial state if available
      if (spriteStateRef.current) {
        try {
          channel.postMessage({
            type: "state-update",
            state: spriteStateRef.current,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("[App] Error sending initial state:", error);
        }
      }
    }

    return () => {
      // Don't close the channel here - keep it open for the lifetime of the component
    };
  }, [isProjectorMode]);

  // Send state updates whenever spriteState changes (if available)
  useEffect(() => {
    if (isProjectorMode || !broadcastChannelRef.current || !spriteState) {
      return;
    }

    console.log("[App] Sending state update (spriteState changed)", spriteState);
    broadcastChannelRef.current.postMessage({
      type: "state-update",
      state: spriteState,
      timestamp: Date.now(),
    });
  }, [isProjectorMode, spriteState]);

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (broadcastChannelRef.current) {
        console.log("[App] Closing BroadcastChannel");
        // Remove window message listener if it exists
        const handler = (broadcastChannelRef.current as any)?._windowMessageHandler;
        if (handler) {
          window.removeEventListener("message", handler);
        }
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, []);
  
  const [activePanel, setActivePanel] = useState<"sprites" | "colours" | "motion" | "fx">("sprites");
  const [showSceneManager, setShowSceneManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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
      fallbackTimeout = setTimeout(() => {
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

  // @ts-expect-error - intentionally unused, kept for future use
  const _handleCustomPaletteCreated = useCallback(() => {
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
  

  const currentPalette = useMemo(() => {
    if (!spriteState?.paletteId) {
      return getPalette("neon"); // Fallback to default palette
    }
    return getPalette(spriteState.paletteId);
  }, [spriteState?.paletteId]);

  const currentModeLabel = useMemo(() => {
    if (!spriteState) return SPRITE_MODES[0].label;
    
    // Check if it's a shape-based mode (default)
    const shapeMode = SPRITE_MODES.find((mode) => mode.value === spriteState.spriteMode);
    if (shapeMode) {
      return shapeMode.label;
    }
    
    // Otherwise, it might be an SVG sprite from a collection
    const collection = getCollection(spriteState.spriteCollectionId || "default");
    if (collection && !collection.isShapeBased) {
      const sprite = getSpriteInCollection(spriteState.spriteCollectionId || "default", spriteState.spriteMode);
      if (sprite) {
        return sprite.name;
      }
    }
    
    return SPRITE_MODES[0].label;
  }, [spriteState]);



  // Controller initialization is now handled by useSpriteController hook

  const handlePaletteSelection = useCallback((paletteId: string) => {
    if (!controllerRef.current) {
      return;
    }
    const currentState = controllerRef.current.getState();
    if (currentState.paletteId === paletteId) {
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

  const handleOutlineToggle = useCallback((checked: boolean) => {
    controllerRef.current?.setOutlineEnabled(checked);
  }, []);

  const handleOutlineStrokeWidthChange = useCallback((value: number) => {
    controllerRef.current?.setOutlineStrokeWidth(value);
  }, []);

  const handleOutlineMixedToggle = useCallback((checked: boolean) => {
    controllerRef.current?.setOutlineMixed(checked);
  }, []);

  const handleOutlineBalanceChange = useCallback((value: number) => {
    controllerRef.current?.setOutlineBalance(value);
  }, []);

  const handleRandomizeOutlineDistribution = useCallback(() => {
    controllerRef.current?.randomizeOutlineDistribution();
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

  // Fullscreen management is now handled by useFullscreen hook

  // Theme management is now handled by useTheme hook

  // SpriteControls rendering is now handled by SpriteControls component

  // MotionControls rendering is now handled by MotionControls component


  // FxControls rendering is now handled by FxControls component



  const handleLoadPreset = useCallback(
    (state: GeneratorState, transition?: "instant" | "fade" | "smooth") => {
      controllerRef.current?.applyState(state, transition);
    },
    [],
  );

  // Handle loading scene by ID (for WebSocket/mobile remote)
  const handleLoadSceneById = useCallback(
    (sceneId: string) => {
      const scenes = getAllScenes();
      const scene = scenes.find((s) => s.id === sceneId);
      if (scene) {
        const state = loadSceneState(scene);
        if (state) {
          handleLoadPreset(state); // Keep function name for backward compatibility
        }
      }
    },
    [handleLoadPreset]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Import shortcuts dynamically to avoid circular dependencies
      import("@/lib/storage/shortcutsStorage").then(({ loadShortcuts, matchesShortcut }) => {
        const shortcuts = loadShortcuts();
        const bindings = shortcuts.bindings;

        // Check each shortcut binding
        for (const [action, binding] of Object.entries(bindings)) {
          if (matchesShortcut(event, binding)) {
            event.preventDefault();
            event.stopPropagation();

            switch (action) {
              case "playPauseSequence":
                // Sequence play/pause would be handled by SequencePlayer
                break;
              case "nextPreset":
                // Next preset navigation
                break;
              case "previousPreset":
                // Previous preset navigation
                break;
              case "loadPreset1":
              case "loadPreset2":
              case "loadPreset3":
              case "loadPreset4":
              case "loadPreset5":
                // Load scene by number (backward compatibility - action name unchanged)
                const sceneIndex = parseInt(action.replace("loadPreset", "")) - 1;
                const scenes = getAllScenes();
                if (scenes[sceneIndex]) {
                  const state = loadSceneState(scenes[sceneIndex]);
                  if (state) {
                    handleLoadPreset(state);
                  }
                }
                break;
              case "toggleFullscreen":
                handleFullscreenToggle();
                break;
              case "randomizeAll":
                handleRandomiseAll();
                break;
              case "showPresets":
              case "showScenes":
                setShowSceneManager(true);
                break;
              case "showExport":
                setShowExportModal(true);
                break;
            }
            break;
          }
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleLoadPreset, handleRandomiseAll, handleFullscreenToggle]);

  // WebSocket integration for mobile remote
  const [remoteControlEnabled, setRemoteControlEnabled] = useState(false);
  const [remoteControlPort, setRemoteControlPort] = useState(8080);
  
  useEffect(() => {
    const settings = loadSettings();
    setRemoteControlEnabled(settings.remoteControlEnabled || false);
    setRemoteControlPort(settings.remoteControlPort || 8080);
  }, [showSettingsPage]); // Reload when settings page opens/closes
  
  // Memoize callbacks to prevent recreating on every render
  const getCurrentState = useCallback(() => spriteState, [spriteState]);
  const getScenes = useCallback(() => getAllScenes(), []);
  
  const webSocket = useWebSocket(
    remoteControlPort,
    remoteControlEnabled,
    handleLoadSceneById,
    handleLoadSceneById, // onPresetLoad - backward compatibility
    handleRandomiseAll,
    getCurrentState,
    getScenes
  );

  // Send state updates when state changes (for WebSocket)
  useEffect(() => {
    if (webSocket.connected && spriteState) {
      webSocket.sendStateUpdate();
    }
  }, [spriteState, webSocket.connected]); // Removed webSocket.sendStateUpdate - it's stable now

  // OSC Integration
  // @ts-expect-error - hook must run for side effects, return value unused
  const _osc = useOSC({
    onPresetLoad: handleLoadSceneById, // Backward compatibility - WebSocket action name unchanged
    onMotionIntensityChange: (intensity) => {
      controllerRef.current?.setMotionIntensity(intensity);
    },
    onPaletteCycleToggle: (enabled) => {
      controllerRef.current?.setPaletteCycleEnabled(enabled);
    },
    onSequenceNext: () => {
      // Sequence next would be handled by SequencePlayer
    },
    onSequencePrevious: () => {
      // Sequence previous would be handled by SequencePlayer
    },
    onStateUpdate: (_state) => {
      // State updates sent via OSC (handled by backend)
    },
  });

  // MIDI Integration
  // @ts-expect-error - hook must run for side effects, return value unused
  const _midi = useMIDI({
    onMotionIntensityChange: (intensity) => {
      controllerRef.current?.setMotionIntensity(intensity);
    },
    onMotionSpeedChange: (speed) => {
      controllerRef.current?.setMotionSpeed(speed);
    },
    onHueRotationSpeedChange: (speed) => {
      controllerRef.current?.setHueRotationSpeed(speed);
    },
    onRandomizeAll: handleRandomiseAll,
    onStateUpdate: (_state) => {
      // State updates sent via MIDI (if needed)
    },
  });

  // DMX Integration
  const dmx = useDMX({
    onStateUpdate: (_state) => {
      // State updates sent to DMX channels
    },
  });

  // Send state updates to DMX when state changes
  useEffect(() => {
    if (spriteState) {
      dmx.sendStateUpdate(spriteState);
    }
  }, [spriteState, dmx]);



  // StatusBar rendering is now handled by StatusBar component

  // If in projector mode, render projector page
  if (isProjectorMode) {
    return <ProjectorPage />;
  }

  // If in mobile remote mode, render mobile remote page
  if (isMobileRemote) {
    return <MobileRemote />;
  }

  const renderDisplayContent = () => {
    const isCanvasPage = !currentPage || currentPage === "create";
    
      return (
      <>
        {/* Canvas - always mounted but hidden when on other pages */}
        <div 
          className={`canvas-card-shell ${isCanvasPage ? '' : 'hidden'}`}
          ref={canvasCardShellRef}
        >
          {/* MINIMAL: Simple container - let CSS handle aspect ratio via padding-top trick */}
          <CanvasHoverWrapper
            isFullscreen={isFullscreen}
            ready={ready}
            onFullscreenToggle={handleFullscreenToggle}
          >
            <div 
              className="w-full relative" 
              style={{ paddingTop: '56.25%' }}
            >
              <div
                className="sketch-container absolute inset-0"
                ref={sketchContainerRef}
                aria-live="polite"
              />
            </div>
          </CanvasHoverWrapper>
          {/* StatusBar below canvas */}
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
              onSaveScene={() => setShowSceneManager(true)}
              onShowExport={() => setShowExportModal(true)}
              onOpenProjector={() => {
                dualMonitor.openProjectorWindow();
              }}
              isProjectorMode={isProjectorMode}
              statusBarRef={statusBarRef}
            />
          )}
        </div>

        {/* Pages - shown when not on canvas */}
        {currentPage === "palettes" && (
        <PalettesPage />
        )}
    
        {currentPage === "sprites" && (
          <SpritesPage />
        )}
        
        {currentPage === "scenes" && (
        <ScenesPage
          currentState={spriteState}
          onLoadScene={handleLoadPreset}
        />
        )}
    
        {currentPage === "sequences" && (
        <SequencesPage
          onNavigateToCanvas={() => {
            setCurrentPage("create");
            handleNavigate("create");
          }}
          onNavigateToPerform={(sequenceId) => {
            setShowSettingsPage(true);
            setCurrentPage("settings");
            handleNavigate("settings", "perform");
            // Store sequence ID in sessionStorage for PerformPage to pick up
            sessionStorage.setItem("performSequenceId", sequenceId);
          }}
          currentState={spriteState}
          onLoadPreset={handleLoadPreset}
        />
        )}
    
        {currentPage === "animation" && (
        <AnimationPage />
        )}
    
        {(showSettingsPage || currentPage === "settings") && (() => {
          // Extract section from URL
          const path = window.location.pathname;
          const settingsMatch = path.match(/^\/settings(?:\/([^/]+))?/);
          const initialSection = settingsMatch?.[1] || "display";
          
          return (
            <SettingsPage 
              onClose={() => {
                setShowSettingsPage(false);
                setCurrentPage("create");
                handleNavigate("create");
              }}
              onAspectRatioChange={(aspectRatio, custom) => {
                if (controller) {
                  if (aspectRatio === "custom" && custom) {
                    controller.setCustomAspectRatio(custom.width, custom.height);
                  } else {
                    controller.setAspectRatio(aspectRatio);
                  }
                }
              }}
              onLoadPreset={handleLoadPreset}
              currentState={spriteState}
              frameRate={frameRate}
              ready={ready}
              webSocketState={{
                connected: webSocket.connected,
                connecting: webSocket.connecting,
                error: webSocket.error,
                clients: webSocket.clients,
              }}
              initialSection={initialSection}
            />
          );
        })()}
      </>
  );
  };


  // Calculate header height and set CSS variable
  const headerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let rafId: number | null = null;
    const updateHeaderHeight = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        if (headerRef.current) {
          const height = headerRef.current.offsetHeight;
          document.documentElement.style.setProperty('--header-height', `${height}px`);
        } else {
          // When header is hidden (canvas screen), set height to 0
          document.documentElement.style.setProperty('--header-height', '0px');
        }
        rafId = null;
      });
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [currentPage]); // Re-run when currentPage changes

  useEffect(() => {
    // Footer is now only in settings pages, so set height to 0 for canvas screen
    document.documentElement.style.setProperty('--footer-height', '0px');
  }, []);

  // Handle navigation
  const handleNavigate = (page: "create" | "sprites" | "palettes" | "scenes" | "sequences" | "settings" | "animation", section?: string) => {
    setCurrentPage(page);
    if (page === "settings") {
      setShowSettingsPage(true);
      // Update URL with section if provided
      if (section) {
        window.history.pushState({}, "", `/settings/${section}`);
      } else {
        window.history.pushState({}, "", `/settings`);
      }
    } else {
      setShowSettingsPage(false);
      // Update URL without reload
      if (page === "create") {
        window.history.pushState({}, "", "/");
      } else {
        window.history.pushState({}, "", `/${page}`);
      }
    }
  };

  // Prepare sidebar props (must be after handleNavigate is defined)
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
    onOutlineToggle: handleOutlineToggle,
    onOutlineStrokeWidthChange: handleOutlineStrokeWidthChange,
    onOutlineMixedToggle: handleOutlineMixedToggle,
    onOutlineBalanceChange: handleOutlineBalanceChange,
    onRandomizeOutlineDistribution: handleRandomizeOutlineDistribution,
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
    isWideLayout,
    themeMode,
    onThemeModeChange: setThemeMode,
    onNavigate: handleNavigate,
    currentPage,
  };

  // Initialize page from URL
  useEffect(() => {
    const path = window.location.pathname;
    
    // Check for settings page with section
    const settingsMatch = path.match(/^\/settings(?:\/([^/]+))?/);
    if (settingsMatch) {
      setCurrentPage("settings");
      setShowSettingsPage(true);
      return;
    }
    
    if (path === "/palettes") {
      setCurrentPage("palettes");
    } else if (path === "/sprites") {
      setCurrentPage("sprites");
    } else if (path === "/presets" || path === "/scenes") {
      setCurrentPage("scenes");
    } else if (path === "/sequences") {
      setCurrentPage("sequences");
    } else if (path === "/animation") {
      setCurrentPage("animation");
    } else if (path === "/buttons") {
      // Button test page - standalone, no navigation needed
    } else if (path === "/" || path === "") {
      setCurrentPage("create");
    }
  }, []);

  // Render sequences page if on /sequences route (legacy support - redirect to new navigation)
  const isSequencesPage = window.location.pathname === "/sequences";
  if (isSequencesPage && !currentPage) {
    setCurrentPage("sequences");
  }

  // Show header only when not on canvas screen
  const showHeader = currentPage !== "create" && currentPage !== "settings" && currentPage !== null;

  // Render standalone button test page (no app UI)
  if (isButtonTestPage) {
    return (
      <ErrorBoundary>
        <ButtonTestPage />
      </ErrorBoundary>
    );
  }

  return (
    <>
    {/* Header - Full width, outside AppLayout - Only show when not on canvas */}
    {showHeader && (
      <div ref={headerRef} className="app-frame app-frame--compact app-frame--header w-full">
        <Header
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onOpenSettings={() => {
            handleNavigate("settings");
          }}
        />
      </div>
    )}

    <AppLayout sidebarProps={sidebarProps} hideSidebar={currentPage === "palettes" || currentPage === "scenes" || currentPage === "sequences" || currentPage === "sprites" || currentPage === "animation"}>
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
      </div>
    </AppLayout>

      {showSceneManager && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
        <SceneManager
          currentState={spriteState}
          onLoadScene={handleLoadPreset}
          onClose={() => setShowSceneManager(false)}
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

    </>
  );
};

export default App;
