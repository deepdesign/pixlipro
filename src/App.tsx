import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/retroui/Select";
import { Slider } from "@/components/retroui/Slider";
import { Switch } from "@/components/retroui/Switch";
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
  BackgroundMode,
} from "./types/generator";
import { PresetManager } from "./components/PresetManager";
import { ExportModal } from "./components/ExportModal";
import { CustomPaletteManager } from "./components/CustomPaletteManager";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { BitlabLogo } from "./components/Header/BitlabLogo";
import { Lock, Unlock, ImagePlus, RefreshCw } from "lucide-react";
import { useIsMobile } from "./hooks/useIsMobile";
import { palettes, getAllPalettes, getPalette } from "./data/palettes";
import { useTheme } from "./hooks/useTheme";
import { useFullscreen } from "./hooks/useFullscreen";
import { useSpriteController } from "./hooks/useSpriteController";
import { BLEND_MODES } from "./constants/blend";
import { SPRITE_MODES } from "./constants/sprites";
import {
  densityToUi,
  uiToDensity,
  varianceToUi,
  uiToVariance,
  speedToUi,
  uiToSpeed,
} from "./lib/utils";


// Helper function to generate palette options (will be used in useMemo)
const generatePaletteOptions = () => {
  const categoryOrder = [
    "Neon/Cyber",
    "Warm/Fire",
    "Cool/Ocean",
    "Nature",
    "Soft/Pastel",
    "Dark/Mysterious",
    "Custom",
  ];
  
  // Get all palettes (built-in + custom)
  const allPalettes = getAllPalettes();
  
  // Group palettes by category
  const byCategory = new Map<string, typeof allPalettes>();
  for (const palette of allPalettes) {
    const category = palette.category || "Other";
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(palette);
  }
  
  // Sort within each category alphabetically by name
  for (const palettes of byCategory.values()) {
    palettes.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Create grouped structure with category labels
  const result: Array<{ 
    value: string; 
    label: string; 
    category?: string; 
    colors?: string[];
  }> = [];
  
  for (const category of categoryOrder) {
    const categoryPalettes = byCategory.get(category);
    if (categoryPalettes) {
      for (const palette of categoryPalettes) {
        result.push({ 
          value: palette.id, 
          label: palette.name,
          category: category,
          colors: palette.colors,
        });
      }
    }
  }
  
  // Add any uncategorized palettes at the end
  for (const [category, categoryPalettes] of byCategory.entries()) {
    if (!categoryOrder.includes(category)) {
      for (const palette of categoryPalettes) {
        result.push({ 
          value: palette.id, 
          label: palette.name,
          category: category,
          colors: palette.colors,
        });
      }
    }
  }
  
  return result;
};

// CANVAS_PALETTE_OPTIONS will be generated inside App component using useMemo

const MOVEMENT_MODES: Array<{ value: MovementMode; label: string }> = [
  { value: "pulse", label: "Pulse" },
  { value: "drift", label: "Drift" },
  { value: "ripple", label: "Ripple" },
  { value: "zigzag", label: "Zigzag" },
  { value: "cascade", label: "Cascade" },
  { value: "spiral", label: "Spiral Orbit" },
  { value: "comet", label: "Comet Trail" },
  { value: "linear", label: "Linear" },
  { value: "isometric", label: "Isometric" },
];

const formatBlendMode = (mode: BlendModeOption) =>
  mode
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatMovementMode = (mode: MovementMode) =>
  MOVEMENT_MODES.find((entry) => entry.value === mode)?.label ?? "None";

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

const TooltipIcon = ({
  id,
  text,
  label,
}: {
  id: string;
  text: string;
  label: string;
}) => (
  <span className="retro-tooltip">
    <button
      type="button"
      className="tooltip-trigger"
      aria-describedby={id}
      aria-label={`More about ${label}`}
    >
      ?
    </button>
    <span id={id} role="tooltip" className="tooltip-content">
      {text}
    </span>
  </span>
);

const ControlSlider = ({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  disabled,
  tooltip,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  tooltip?: string;
}) => {
  const tooltipId = tooltip ? `${id}-tip` : undefined;
  const sliderValue = Number.isFinite(value) ? value : min;

  const handleSliderChange = useCallback(
    (values: number[]) => {
      if (!values.length) {
        return;
      }
      const [next] = values;
      if (!Number.isFinite(next)) {
        return;
      }
      const clamped = Math.min(max, Math.max(min, next));
      onChange(clamped);
    },
    [max, min, onChange],
  );

  return (
    <div className="control-field">
      <div className="field-heading">
        <div className="field-heading-left">
          <span className="field-label" id={`${id}-label`}>
            {label}
          </span>
          {tooltipId && (
            <TooltipIcon id={tooltipId} text={tooltip!} label={label} />
          )}
        </div>
        <span className="field-value">{displayValue}</span>
      </div>
      <Slider
        className="control-slider"
        value={[sliderValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
      />
    </div>
  );
};

const ControlSelect = ({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  tooltip,
  currentLabel,
  onItemSelect,
  onItemPointerDown,
  locked,
  onLockToggle,
  prefixButton,
}: {
  id: string;
  label: string;
  options: Array<{ value: string; label: string; category?: string; colors?: string[] }>;
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  tooltip?: string;
  currentLabel?: string;
  onItemSelect?: (value: string) => void;
  onItemPointerDown?: (value: string) => void;
  locked?: boolean;
  onLockToggle?: () => void;
  prefixButton?: React.ReactNode;
}) => {
  const tooltipId = tooltip ? `${id}-tip` : undefined;
  const resolvedLabel =
    currentLabel ??
    options.find((option) => option.value === value)?.label ??
    placeholder ??
    "Select";

  // Separate options with and without categories
  const optionsWithCategories = options.filter(opt => opt.category);
  const optionsWithoutCategories = options.filter(opt => !opt.category);
  const hasCategories = optionsWithCategories.length > 0;
  
  const groupedOptions = hasCategories ? (() => {
    const categoryOrder = [
      "Neon/Cyber",
      "Warm/Fire",
      "Cool/Ocean",
      "Nature",
      "Soft/Pastel",
      "Dark/Mysterious",
    ];
    const groups = new Map<string, typeof options>();
    for (const option of optionsWithCategories) {
      const category = option.category || "Other";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(option);
    }
    // Return ordered array of [category, options] pairs
    const ordered: Array<[string, typeof options]> = [];
    for (const category of categoryOrder) {
      if (groups.has(category)) {
        ordered.push([category, groups.get(category)!]);
      }
    }
    // Add any uncategorized groups
    for (const [category, categoryOptions] of groups.entries()) {
      if (!categoryOrder.includes(category)) {
        ordered.push([category, categoryOptions]);
      }
    }
    return ordered;
  })() : null;

  return (
    <div className="control-field">
      <div className="field-heading">
        <div className="field-heading-left">
          <span className="field-label" id={`${id}-label`}>
            {label}
          </span>
          {tooltip && tooltipId && (
            <TooltipIcon id={tooltipId} text={tooltip} label={label} />
          )}
        </div>
        {currentLabel ? (
          <span className="field-value">{currentLabel}</span>
        ) : null}
      </div>
      <div className="control-select-with-lock">
      <Select
        value={value ?? undefined}
        onValueChange={onChange}
        disabled={disabled || locked}
      >
          <SelectTrigger aria-labelledby={`${id}-label`}>
            <SelectValue placeholder={placeholder ?? "Select"}>
              {resolvedLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {/* Render options without categories first (e.g., "auto" option) */}
              {optionsWithoutCategories.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  onSelect={
                    onItemSelect ? () => onItemSelect(option.value) : undefined
                  }
                  onPointerDown={
                    onItemPointerDown
                      ? (event) => {
                          if (event.pointerType === "mouse" && event.button !== 0) {
                            return;
                          }
                          onItemPointerDown(option.value);
                        }
                      : undefined
                  }
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
            {hasCategories && groupedOptions ? (
              // Render with category groups
              groupedOptions.map(([category, categoryOptions]) => (
                <SelectGroup key={category}>
                  <SelectLabel className="control-select-category-label">
                    {category}
                  </SelectLabel>
                  {categoryOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      onSelect={
                        onItemSelect ? () => onItemSelect(option.value) : undefined
                      }
                      onPointerDown={
                        onItemPointerDown
                          ? (event) => {
                              if (event.pointerType === "mouse" && event.button !== 0) {
                                return;
                              }
                              onItemPointerDown(option.value);
                            }
                          : undefined
                      }
                      className={option.colors ? "control-dropdown-item-with-preview" : undefined}
                    >
                      {option.colors && (
                        <span className="control-select-color-preview">
                          {option.colors.map((color, idx) => (
                            <span
                              key={idx}
                              className="control-select-color-square"
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            />
                          ))}
                        </span>
                      )}
                      <span className="control-select-item-label">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))
            ) : null}
            {/* Fallback: render without categories if no categories exist */}
            {!hasCategories && optionsWithoutCategories.length === 0 && (
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    onSelect={
                      onItemSelect ? () => onItemSelect(option.value) : undefined
                    }
                    onPointerDown={
                      onItemPointerDown
                        ? (event) => {
                            if (event.pointerType === "mouse" && event.button !== 0) {
                              return;
                            }
                            onItemPointerDown(option.value);
                          }
                        : undefined
                    }
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        {prefixButton}
        {onLockToggle && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onLockToggle}
            disabled={disabled}
            className={locked ? "control-lock-button control-lock-button-locked" : "control-lock-button"}
            aria-label={locked ? "Unlock" : "Lock"}
            title={locked ? "Unlock this value" : "Lock this value"}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Component to render vector shape icons
const ShapeIcon = ({ shape, size = 24 }: { shape: SpriteMode; size?: number }) => {
  const viewBox = "0 0 24 24";
  const center = 12;
  const radius = 8;
  
  const renderShape = () => {
    switch (shape) {
      case "circle":
        return <circle cx={center} cy={center} r={radius * 1.2} fill="currentColor" />;
      
      case "square":
        return <rect x={4} y={4} width={16} height={16} fill="currentColor" />;
      
      case "rounded":
        return <rect x={4} y={4} width={16} height={16} rx={3} ry={3} fill="currentColor" />;
      
      case "triangle":
        return (
          <polygon
        points={`${center},3 21,21 3,21`}
            fill="currentColor"
          />
        );
      
      case "hexagon": {
        const hexRadius = radius * 1.2; // Make hexagon bigger
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = center + hexRadius * Math.cos(angle);
          const y = center + hexRadius * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return <polygon points={points.join(" ")} fill="currentColor" />;
      }
      
      case "ring":
        return (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          />
        );
      
      case "diamond": {
        const diamondSize = 9; // Make diamond bigger
        return (
          <polygon
            points={`${center},${center - diamondSize} ${center + diamondSize},${center} ${center},${center + diamondSize} ${center - diamondSize},${center}`}
            fill="currentColor"
          />
        );
      }
      
      case "star": {
        const outerRadius = radius * 1.45; // Make star bigger
        const innerRadius = radius * 0.6; // Adjust inner radius proportionally
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return <polygon points={points.join(" ")} fill="currentColor" />;
      }
      
      case "line":
        return <rect x={2} y={10} width={20} height={4} fill="currentColor" />;

      case "pentagon": {
        const points = [];
        for (let i = 0; i < 5; i += 1) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const pentagonRadius = radius * 1.25;
          const x = center + pentagonRadius * Math.cos(angle);
          const y = center + pentagonRadius * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return <polygon points={points.join(" ")} fill="currentColor" />;
      }

      case "asterisk":
        return (
          <g stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1={center} y1={center - radius} x2={center} y2={center + radius} />
            <line x1={center - radius} y1={center} x2={center + radius} y2={center} />
            <line
              x1={center - radius * 0.8}
              y1={center - radius * 0.8}
              x2={center + radius * 0.8}
              y2={center + radius * 0.8}
            />
            <line
              x1={center - radius * 0.8}
              y1={center + radius * 0.8}
              x2={center + radius * 0.8}
              y2={center - radius * 0.8}
            />
          </g>
        );

      case "cross":
        return (
          <g fill="currentColor">
            <rect x={center - 3} y={center - 10} width={6} height={20} />
            <rect x={center - 10} y={center - 3} width={20} height={6} />
          </g>
        );

      case "pixels": {
        // 3x3 grid of squares with spacing
        const gridSize = 3;
        const squareSize = 4;
        const gap = 1;
        const totalSize = gridSize * squareSize + (gridSize - 1) * gap;
        const startX = center - totalSize / 2;
        const startY = center - totalSize / 2;
        
        return (
          <g fill="currentColor">
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              const x = startX + col * (squareSize + gap);
              const y = startY + row * (squareSize + gap);
              return <rect key={i} x={x} y={y} width={squareSize} height={squareSize} />;
            })}
          </g>
        );
      }
 
      default:
        return <circle cx={center} cy={center} r={radius} fill="currentColor" />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={{ display: "block" }}
      fill="currentColor"
    >
      {renderShape()}
    </svg>
  );
};



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
  const [showLoader, setShowLoader] = useState(true);
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
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let initialLoader: HTMLElement | null = null;
    let handleTransitionEnd: ((event: TransitionEvent) => void) | null = null;
    
    // Hide loader immediately when component mounts
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
    
    // Use requestAnimationFrame to ensure DOM is ready, but don't add extra delay
    const frameId = requestAnimationFrame(hideLoader);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      if (fallbackTimeout) {
        window.clearTimeout(fallbackTimeout);
      }
      if (initialLoader && handleTransitionEnd) {
        initialLoader.removeEventListener("transitionend", handleTransitionEnd);
      }
    };
  }, []);

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
      setShowLoader(true);
    }
  }, []);

  useEffect(() => {
    if (!spriteState || !showLoader) {
      return;
    }
    if (forceLoader) {
      return;
    }
    if (typeof window === "undefined") {
      setShowLoader(false);
      return;
    }
    const timeoutId = window.setTimeout(() => setShowLoader(false), 450);
    return () => window.clearTimeout(timeoutId);
  }, [spriteState, showLoader, forceLoader]);

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

  const renderSpriteControls = () => {
    if (!spriteState) {
      return null;
    }

    const densityValueUi = densityToUi(spriteState.scalePercent);

    return (
      <>
        <div className="section">
          <h3 className="section-title">Shape</h3>
          {/* Label, status, and tooltip for sprite selection */}
          <div className="control-field">
            <div className="field-heading">
              <div className="field-heading-left">
                <span className="field-label" id="render-mode-label">
                  Select Sprites
                </span>
                <TooltipIcon id="render-mode-tip" text="Choose the geometric shape used for sprites." label="Select Sprites" />
              </div>
              {currentModeLabel && (
                <span className="field-value">{currentModeLabel}</span>
              )}
            </div>
          </div>

          {/* Icon button row for sprite selection */}
          <div className="sprite-icon-buttons" style={{ marginTop: '0.25rem', marginBottom: '0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {SPRITE_MODES.map((mode) => {
                const isSelected = spriteState.spriteMode === mode.value;
                return (
                  <Button
                    key={mode.value}
                    type="button"
                    size="icon"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleModeChange(mode.value)}
                    disabled={!ready || lockedSpriteMode}
                    title={mode.label}
                    aria-label={mode.label}
                  >
                    <ShapeIcon shape={mode.value} size={24} />
                  </Button>
                );
              })}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setLockedSpriteMode(!lockedSpriteMode)}
                disabled={!ready}
                className={lockedSpriteMode ? "control-lock-button control-lock-button-locked" : "control-lock-button"}
                aria-label={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
                title={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
              >
                {lockedSpriteMode ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Random sprites switch */}
          <div className="control-field" style={{ marginTop: '1rem' }}>
            <div className="switch-row" style={{ gap: "0.75rem" }}>
              <Switch
                id="random-sprites"
                checked={spriteState.randomSprites ?? false}
                onCheckedChange={handleRandomSpritesToggle}
                disabled={!ready || lockedSpriteMode}
                aria-labelledby="random-sprites-label"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => controllerRef.current?.randomizeSpriteShapes()}
                disabled={!ready || !spriteState.randomSprites}
                aria-label="Randomise sprite shapes"
                title="Randomise sprite shapes"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="field-heading-left">
                <span className="field-label" id="random-sprites-label">Random sprites</span>
                <TooltipIcon 
                  id="random-sprites-tip" 
                  text="When enabled, each sprite on the canvas uses a random shape from the selection." 
                  label="Random sprites" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <hr className="section-divider" />
          <h3 className="section-title">Density &amp; Scale</h3>
          <ControlSlider
            id="density-range"
            label="Tile Density"
            min={0}
            max={100}
            value={densityValueUi}
            displayValue={`${densityValueUi}%`}
            onChange={(value) =>
              controllerRef.current?.setScalePercent(uiToDensity(value))
            }
            disabled={!ready}
            tooltip="Controls how many tiles spawn per layer; higher values create a busier canvas."
          />
          <ControlSlider
            id="scale-base"
            label="Scale Base"
            min={0}
            max={100}
            value={Math.round(spriteState.scaleBase)}
            displayValue={`${Math.round(spriteState.scaleBase)}%`}
            onChange={(value) => controllerRef.current?.setScaleBase(value)}
            disabled={!ready}
            tooltip="Sets the baseline sprite size before any random spread is applied."
          />
          <ControlSlider
            id="scale-range"
            label="Scale Range"
            min={0}
            max={100}
            value={Math.round(spriteState.scaleSpread)}
            displayValue={`${Math.round(spriteState.scaleSpread)}%`}
            onChange={(value) => controllerRef.current?.setScaleSpread(value)}
            disabled={!ready}
            tooltip="Expands or tightens the difference between the smallest and largest sprites."
          />
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <hr className="section-divider" />
          <h3 className="section-title">Rotation</h3>
          <div className="control-field control-field--rotation">
            <div className="switch-row" style={{ gap: "0.75rem" }}>
              <Switch
                id="rotation-toggle"
                checked={spriteState.rotationEnabled}
                onCheckedChange={handleRotationToggle}
                disabled={!ready}
                aria-labelledby="rotation-toggle-label"
              />
              <div className="field-heading-left">
                <span className="field-label" id="rotation-toggle-label">
                  Allow Rotation Offsets
                </span>
                <TooltipIcon
                  id="rotation-toggle-tip"
                  text="Allow sprites to inherit a static rotation offset based on the slider below."
                  label="Allow Rotation Offsets"
                />
              </div>
            </div>
          </div>
          {spriteState.rotationEnabled && (
            <div className="rotation-slider-wrapper" style={{ marginBottom: '1.5rem' }}>
              <ControlSlider
                id="rotation-amount"
                label="Rotation Amount"
                min={0}
                max={180}
                value={Math.round(spriteState.rotationAmount)}
                displayValue={`${Math.round(spriteState.rotationAmount)}°`}
                onChange={handleRotationAmountChange}
                disabled={!ready}
                tooltip="Set the maximum angle sprites can rotate (distributed randomly, no animation)."
              />
            </div>
          )}
        </div>
      </>
    );
  };

  const renderMotionControls = (showHeading: boolean) => {
    if (!spriteState) {
      return null;
    }

    return (
      <>
        <div className="section">
          {showHeading && <h3 className="section-title">Motion</h3>}
          <ControlSelect
            id="movement-mode"
            label="Movement"
            value={spriteState.movementMode}
            onChange={(value) => handleMovementSelect(value as MovementMode)}
            disabled={!ready}
            options={MOVEMENT_MODES.map((mode) => ({
              value: mode.value,
              label: mode.label,
            }))}
            tooltip="Select the animation path applied to each sprite layer."
            currentLabel={formatMovementMode(spriteState.movementMode)}
            locked={lockedMovementMode}
            onLockToggle={() => setLockedMovementMode(!lockedMovementMode)}
          />
          <ControlSlider
            id="motion-range"
            label="Motion Intensity"
            min={0}
            max={100}
            value={Math.round(spriteState.motionIntensity)}
            displayValue={`${Math.round(spriteState.motionIntensity)}%`}
            onChange={(value) =>
              controllerRef.current?.setMotionIntensity(value)
            }
            disabled={!ready}
            tooltip="Adjust how far sprites travel within their chosen movement path."
          />
          <ControlSlider
            id="motion-speed"
            label="Motion Speed"
            min={0}
            max={100}
            value={speedToUi(spriteState.motionSpeed)}
            displayValue={`${speedToUi(spriteState.motionSpeed)}%`}
            onChange={(value) => controllerRef.current?.setMotionSpeed(uiToSpeed(value))}
            disabled={!ready}
            tooltip="Slow every layer down or accelerate the motion-wide choreography."
          />
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <hr className="section-divider" />
          <h3 className="section-title">Rotation</h3>
          <div className="control-field control-field--rotation">
            <div className="switch-row" style={{ gap: "0.75rem" }}>
              <Switch
                id="rotation-animate"
                checked={spriteState.rotationAnimated}
                onCheckedChange={handleRotationAnimatedToggle}
                disabled={!ready}
                aria-labelledby="rotation-animate-label"
              />
              <div className="field-heading-left">
                <span className="field-label" id="rotation-animate-label">
                  Animate Rotation
                </span>
                <TooltipIcon
                  id="rotation-animate-tip"
                  text="Toggle continuous spinning when rotation offsets are enabled."
                  label="Animate Rotation"
                />
              </div>
            </div>
          </div>
          {spriteState.rotationAnimated && (
            <div className="rotation-slider-wrapper">
              <ControlSlider
                id="rotation-speed"
                label="Rotation Speed"
                min={0}
                max={100}
                value={Math.round(spriteState.rotationSpeed)}
                displayValue={`${Math.round(spriteState.rotationSpeed)}%`}
                onChange={handleRotationSpeedChange}
                disabled={!ready}
                tooltip="Control how quickly sprites spin when rotation is enabled."
              />
            </div>
          )}
        </div>
      </>
    );
  };


  const renderFxControls = () => {
    if (!spriteState) {
      return null;
    }
    const blendAutoLabelId = "blend-auto-label";
    const isCanvasGradient = spriteState.canvasFillMode === "gradient";
    const currentCanvasLabel =
      CANVAS_PALETTE_OPTIONS.find(
        (option) => option.value === spriteState.backgroundMode,
      )?.label ?? CANVAS_PALETTE_OPTIONS[0].label;

    const handleCanvasPaletteChange = (value: string) => {
      if (!controllerRef.current) {
        return;
      }
      if (isCanvasGradient) {
        controllerRef.current.setBackgroundMode(value as BackgroundMode);
        controllerRef.current.setCanvasGradientMode(value as BackgroundMode);
      } else {
        controllerRef.current.setBackgroundMode(value as BackgroundMode);
      }
    };

    return (
      <>
        <div className="section">
          <h3 className="section-title">Palette &amp; Variance</h3>
          <ControlSelect
            id="palette-presets"
            label="Sprite palette"
            value={currentPalette.id}
            onChange={(value) => handlePaletteSelection(value)}
            onItemSelect={handlePaletteOptionSelect}
            onItemPointerDown={handlePaletteOptionSelect}
            disabled={!ready}
            options={PALETTE_OPTIONS}
            tooltip="Select the core palette used for tinting sprites before variance is applied."
            currentLabel={currentPalette.name}
            locked={lockedSpritePalette}
            onLockToggle={() => setLockedSpritePalette(!lockedSpritePalette)}
            prefixButton={
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setShowCustomPaletteManager(true)}
                disabled={!ready}
                aria-label="Manage custom palettes"
                title="Manage custom palettes"
                style={{ flexShrink: 0 }}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            }
          />
          <div className="control-field">
            <div className="switch-row" style={{ gap: "0.75rem" }}>
              <Switch
                checked={spriteState.spriteFillMode === "gradient"}
                onCheckedChange={(checked) =>
                  controllerRef.current?.setSpriteFillMode(checked ? "gradient" : "solid")
                }
                disabled={!ready}
              />
              <div className="field-heading-left">
                <span className="field-label">Use gradients</span>
                <TooltipIcon
                  id="sprite-fill-mode-tip"
                  text="Enable gradient fills for sprites instead of solid colors."
                  label="Use gradients"
                />
              </div>
            </div>
          </div>
          <ControlSlider
            id="palette-range"
            label="Sprite palette variance"
            min={0}
            max={100}
            value={varianceToUi(spriteState.paletteVariance)}
            displayValue={`${varianceToUi(spriteState.paletteVariance)}%`}
            onChange={(value) =>
              controllerRef.current?.setPaletteVariance(uiToVariance(value))
            }
            disabled={!ready}
            tooltip="Controls how much each colour can drift away from the base palette swatches."
          />
          <ControlSlider
            id="hue-shift"
            label="Sprite hue shift"
            min={0}
            max={100}
            value={spriteState.hueShift ?? 0}
            displayValue={`${spriteState.hueShift ?? 0}%`}
            onChange={(value) =>
              controllerRef.current?.setHueShift(value)
            }
            disabled={!ready}
            tooltip="Shifts all palette colors around the color wheel (0-360°)."
          />
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <hr className="section-divider" />
          <h3 className="section-title">CANVAS</h3>
          <ControlSelect
            id={isCanvasGradient ? "canvas-gradient" : "background-mode"}
            label="Canvas"
            value={spriteState.backgroundMode}
            onChange={handleCanvasPaletteChange}
            disabled={!ready}
            options={CANVAS_PALETTE_OPTIONS}
            tooltip={
              isCanvasGradient
                ? "Choose the theme for the canvas gradient background."
                : "Choose the colour applied behind the canvas."
            }
            currentLabel={currentCanvasLabel}
            locked={lockedCanvasPalette}
            onLockToggle={() => setLockedCanvasPalette(!lockedCanvasPalette)}
          />
          <div className="control-field">
            <div className="switch-row" style={{ gap: "0.75rem" }}>
              <Switch
                checked={isCanvasGradient}
                onCheckedChange={(checked) =>
                  controllerRef.current?.setCanvasFillMode(
                    checked ? "gradient" : "solid",
                  )
                }
                disabled={!ready}
              />
              <div className="field-heading-left">
                <span className="field-label">Use gradients</span>
                <TooltipIcon
                  id="canvas-fill-mode-tip"
                  text="Enable gradient fills for canvas background instead of solid color."
                  label="Use gradients"
                />
              </div>
            </div>
          </div>
          <ControlSlider
            id="background-hue-shift"
            label="Canvas hue shift"
            min={0}
            max={100}
            value={Math.round(spriteState.backgroundHueShift ?? 0)}
            displayValue={`${Math.round(spriteState.backgroundHueShift ?? 0)}%`}
            onChange={(value) =>
              controllerRef.current?.setBackgroundHueShift(value)
            }
            disabled={!ready}
            tooltip="Shifts the canvas colors around the color wheel (0-360°)."
          />
          <ControlSlider
            id="background-brightness"
            label="Canvas brightness"
            min={0}
            max={100}
            value={Math.round(spriteState.backgroundBrightness ?? 50)}
            displayValue={`${Math.round(spriteState.backgroundBrightness ?? 50)}%`}
            onChange={(value) =>
              controllerRef.current?.setBackgroundBrightness(value)
            }
            disabled={!ready}
            tooltip="Adjusts the canvas brightness (0% = darkest, 100% = brightest)."
          />
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <hr className="section-divider" />
          <h3 className="section-title">Blend &amp; Opacity</h3>
          <ControlSlider
            id="opacity-range"
            label="Layer Opacity"
            min={15}
            max={100}
            value={Math.round(spriteState.layerOpacity)}
            displayValue={`${Math.round(spriteState.layerOpacity)}%`}
            onChange={(value) => controllerRef.current?.setLayerOpacity(value)}
            disabled={!ready}
            tooltip="Sets the base transparency for each rendered layer before blending."
          />
          <ControlSelect
            id="blend-mode"
            label="Blend Mode"
            value={spriteState.blendMode as string}
            onChange={(value) => handleBlendSelect(value as BlendModeOption)}
            disabled={!ready || spriteState.blendModeAuto}
            options={BLEND_MODES.map((mode) => ({
              value: mode,
              label: formatBlendMode(mode),
            }))}
            tooltip="Choose the compositing mode applied when layers draw over each other."
            currentLabel={formatBlendMode(
              spriteState.blendMode as BlendModeOption,
            )}
            locked={lockedBlendMode}
            onLockToggle={() => setLockedBlendMode(!lockedBlendMode)}
          />
          <div className="control-field control-field--spaced">
            <div className="switch-row" style={{ gap: "0.75rem" }}>
              <Switch
                id="blend-auto"
                checked={spriteState.blendModeAuto}
                onCheckedChange={handleBlendAutoToggle}
                aria-labelledby={blendAutoLabelId}
                disabled={!ready}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => controllerRef.current?.randomizeBlendMode()}
                disabled={!ready || !spriteState.blendModeAuto}
                aria-label="Randomise sprite blend modes"
                title="Randomise sprite blend modes"
                className="blend-random-button"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="field-heading-left">
                <span className="field-label" id={blendAutoLabelId}>
                  Random sprite blend
                </span>
                <TooltipIcon
                  id="blend-auto-tip"
                  text="Give every sprite an individual blend mode"
                  label="Random sprite blend"
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };


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
                  <TabsContent>{renderSpriteControls()}</TabsContent>
                  <TabsContent>{renderFxControls()}</TabsContent>
                  {!isWideLayout && (
                    <>
                      <TabsContent>{renderMotionControls(true)}</TabsContent>
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
              <Card className="panel">{renderMotionControls(true)}</Card>
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
