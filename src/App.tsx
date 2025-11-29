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
import { PresetsPage } from "./pages/PresetsPage";
import { PalettesPage } from "./pages/PalettesPage";
import { useDualMonitor } from "./hooks/useDualMonitor";
import { useWebSocket } from "./hooks/useWebSocket";
import { useOSC } from "./hooks/useOSC";
import { useMIDI } from "./hooks/useMIDI";
import { useDMX } from "./hooks/useDMX";
import { getAllPresets, loadPresetState } from "./lib/storage/presetStorage";
import { loadSettings } from "./lib/storage/settingsStorage";

// Lazy load modals for better initial load performance
const PresetManager = lazy(() => import("./components/PresetManager").then(module => ({ default: module.PresetManager })));
const ExportModal = lazy(() => import("./components/ExportModal").then(module => ({ default: module.ExportModal })));
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
  
  // Check if we're in projector or mobile remote mode
  const isProjectorMode = window.location.pathname === "/projector";
  const isMobileRemote = window.location.pathname === "/remote";
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState<"create" | "palettes" | "presets" | "sequences" | "settings" | null>(null);
  
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
  
  // Stream canvas frames to projector window
  useEffect(() => {
    if (isProjectorMode) {
      return; // Don't stream if we're in projector mode
    }

    if (!controller || !dualMonitor.isProjectorMode) {
      return;
    }

    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel("pixli-projector-sync");
    let animationFrameId: number | null = null;
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const streamCanvas = () => {
      const p5Instance = controller?.getP5Instance();
      if (!p5Instance || !p5Instance.canvas) {
        animationFrameId = requestAnimationFrame(streamCanvas);
        return;
      }

      const canvas = p5Instance.canvas as HTMLCanvasElement;
      const currentTime = performance.now();

      // Throttle to target FPS
      if (currentTime - lastFrameTime >= frameInterval) {
        try {
          // Capture canvas directly as data URL (faster than toBlob + FileReader)
          const imageData = canvas.toDataURL("image/png");
          
          // Calculate aspect ratio percentage for projector window
          let aspectRatioPercent = 56.25; // Default to 16:9
          if (spriteState) {
            switch (spriteState.aspectRatio) {
              case "16:9":
                aspectRatioPercent = 56.25; // 9/16 * 100
                break;
              case "21:9":
                aspectRatioPercent = 42.857; // 9/21 * 100
                break;
              case "16:10":
                aspectRatioPercent = 62.5; // 10/16 * 100
                break;
              case "custom":
                const custom = spriteState.customAspectRatio;
                aspectRatioPercent = (custom.height / custom.width) * 100;
                break;
              default:
                aspectRatioPercent = 56.25;
            }
          }
          
          channel.postMessage({
            type: "canvas-frame",
            imageData,
            aspectRatio: aspectRatioPercent,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("Error capturing canvas frame:", error);
        }
        lastFrameTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(streamCanvas);
    };

    // Start streaming
    streamCanvas();

    // Handle state requests
    channel.onmessage = (event) => {
      if (event.data.type === "request-state" && spriteState) {
        channel.postMessage({
          type: "state-update",
          state: spriteState,
          timestamp: Date.now(),
        });
      }
    };

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      channel.close();
    };
  }, [isProjectorMode, controller, dualMonitor.isProjectorMode, spriteState]);
  
  const [activePanel, setActivePanel] = useState<"sprites" | "colours" | "motion">("sprites");
  const [showPresetManager, setShowPresetManager] = useState(false);
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

  // Handle loading preset by ID (for WebSocket/mobile remote)
  const handleLoadPresetById = useCallback(
    (presetId: string) => {
      const presets = getAllPresets();
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        const state = loadPresetState(preset);
        if (state) {
          handleLoadPreset(state);
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
                // Load preset by number
                const presetIndex = parseInt(action.replace("loadPreset", "")) - 1;
                const presets = getAllPresets();
                if (presets[presetIndex]) {
                  const state = loadPresetState(presets[presetIndex]);
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
                setShowPresetManager(true);
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
  const getPresets = useCallback(() => getAllPresets(), []);
  
  const webSocket = useWebSocket(
    remoteControlPort,
    remoteControlEnabled,
    handleLoadPresetById,
    handleRandomiseAll,
    getCurrentState,
    getPresets
  );

  // Send state updates when state changes (for WebSocket)
  useEffect(() => {
    if (webSocket.connected && spriteState) {
      webSocket.sendStateUpdate();
    }
  }, [spriteState, webSocket.connected]); // Removed webSocket.sendStateUpdate - it's stable now

  // OSC Integration
  const osc = useOSC({
    onPresetLoad: handleLoadPresetById,
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
    onStateUpdate: (state) => {
      // State updates sent via OSC (handled by backend)
    },
  });

  // MIDI Integration
  const midi = useMIDI({
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
    onStateUpdate: (state) => {
      // State updates sent via MIDI (if needed)
    },
  });

  // DMX Integration
  const dmx = useDMX({
    onStateUpdate: (state) => {
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
    // Show pages based on current navigation
    if (currentPage === "palettes") {
      return (
        <PalettesPage />
      );
    }
    
    if (currentPage === "presets") {
      return (
        <PresetsPage
          currentState={spriteState}
          onLoadPreset={handleLoadPreset}
        />
      );
    }
    
    if (currentPage === "sequences") {
      return (
        <SequencesPage
          currentState={spriteState}
          onLoadPreset={handleLoadPreset}
        />
      );
    }
    
    // Show Settings page if open
    if (showSettingsPage || currentPage === "settings") {
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
            connected: webSocket.isConnected,
            connecting: webSocket.isConnecting,
            error: webSocket.error,
            clients: webSocket.clients,
          }}
        />
      );
    }
    
    // Default: show canvas
    // MINIMAL APPROACH: Match ProjectorPage structure - it works there!
    return (
    <div className="canvas-card-shell" ref={canvasCardShellRef}>
      {/* MINIMAL: Simple container - let CSS handle aspect ratio via padding-top trick */}
      <div className="w-full relative" style={{ paddingTop: '56.25%' }}>
        <div
          className="sketch-container absolute inset-0"
          ref={sketchContainerRef}
          aria-live="polite"
        />
      </div>
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
          onShowPresets={() => setShowPresetManager(true)}
          onShowExport={() => setShowExportModal(true)}
          onFullscreenToggle={handleFullscreenToggle}
          onFullscreenClose={handleFullscreenClose}
          onOpenProjector={() => {
            dualMonitor.openProjectorWindow();
          }}
          isProjectorMode={isProjectorMode}
          formatBlendMode={formatBlendMode}
          formatMovementMode={formatMovementMode}
          currentModeLabel={currentModeLabel}
          currentPaletteName={currentPalette.name}
          statusBarRef={statusBarRef}
        />
      )}
    </div>
  );
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

  // Handle navigation
  const handleNavigate = (page: "create" | "palettes" | "presets" | "sequences" | "settings") => {
    setCurrentPage(page);
    if (page === "settings") {
      setShowSettingsPage(true);
    } else {
      setShowSettingsPage(false);
    }
    // Update URL without reload
    if (page === "create") {
      window.history.pushState({}, "", "/");
    } else {
      window.history.pushState({}, "", `/${page}`);
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
    if (path === "/palettes") {
      setCurrentPage("palettes");
    } else if (path === "/presets") {
      setCurrentPage("presets");
    } else if (path === "/sequences") {
      setCurrentPage("sequences");
    } else if (path === "/settings") {
      setCurrentPage("settings");
      setShowSettingsPage(true);
    } else if (path === "/" || path === "") {
      setCurrentPage("create");
    }
  }, []);

  // Render sequences page if on /sequences route (legacy support - redirect to new navigation)
  const isSequencesPage = window.location.pathname === "/sequences";
  if (isSequencesPage && !currentPage) {
    setCurrentPage("sequences");
  }

  return (
    <>
    {/* Header - Full width, outside AppLayout */}
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

    <AppLayout sidebarProps={sidebarProps} hideSidebar={showSettingsPage || currentPage === "palettes" || currentPage === "presets" || currentPage === "sequences"}>
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

    </>
  );
};

export default App;
