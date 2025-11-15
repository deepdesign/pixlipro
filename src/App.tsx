import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
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

import {
  createSpriteController,
  type BlendModeOption,
  type GeneratorState,
  type SpriteController,
  type SpriteMode,
  type MovementMode,
  type BackgroundMode,
} from "./generator";
import { PresetManager } from "./components/PresetManager";
import { ExportModal } from "./components/ExportModal";
import { MobileMenu } from "./components/MobileMenu";
import { Badge } from "./components/retroui/Badge";
import { Moon, Monitor, Sun, Maximize2, X, RefreshCw, Bookmark, Camera, HelpCircle, Info, Lock, Unlock } from "lucide-react";
import { palettes } from "./data/palettes";
// import { shouldSplitColumns, getAppMainPadding } from "./lib/responsiveLayout";
import { useIsMobile } from "./hooks/useIsMobile";
const BLEND_MODES: BlendModeOption[] = [
  "NONE",
  "MULTIPLY",
  "SCREEN",
  "HARD_LIGHT",
  "OVERLAY",
  "SOFT_LIGHT",
  "DARKEST",
  "LIGHTEST",
];
type ThemeMode = "system" | "light" | "dark";
type ThemeColor = "amber" | "mint" | "violet" | "ember" | "lagoon" | "rose";

const THEME_MODE_STORAGE_KEY = "retro-theme-mode";
const THEME_COLOR_STORAGE_KEY = "retro-theme-color";
const THEME_SHAPE_STORAGE_KEY = "retro-theme-shape";
const THEME_COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  { value: "amber", label: "Sunburst" },
  { value: "mint", label: "Neon Grid" },
  { value: "violet", label: "Nebula" },
  { value: "ember", label: "Ember Glow" },
  { value: "lagoon", label: "Lagoon Tide" },
  { value: "rose", label: "Rose Quartz" },
];

const THEME_COLOR_PREVIEW: Record<ThemeColor, string> = {
  amber: "#ffdb33",
  mint: "#58f5c2",
  violet: "#c99cff",
  ember: "#ff6b3d",
  lagoon: "#3ad7ff",
  rose: "#ff7cc8",
};

const SPRITE_MODES: Array<{
  value: SpriteMode;
  label: string;
  description: string;
}> = [
  {
    value: "rounded",
    label: "Rounded",
    description: "Soft-edged tiles that stack into cosy mosaics",
  },
  {
    value: "circle",
    label: "Circle",
    description: "Looping orbs with smooth silhouettes",
  },
  {
    value: "square",
    label: "Square",
    description: "Classic, chunky voxels ideal for bold patterns",
  },
  {
    value: "triangle",
    label: "Triangle",
    description: "Directional shards with angular energy",
  },
  {
    value: "hexagon",
    label: "Hexagon",
    description: "Honeycomb tessellations for tight grids",
  },
  {
    value: "ring",
    label: "Ring",
    description: "Hollow forms that layer like retro radar pulses",
  },
  {
    value: "diamond",
    label: "Diamond",
    description: "Sharp diamonds with dramatic negative space",
  },
  {
    value: "star",
    label: "Star",
    description: "Bursting motifs that radiate from the centre",
  },
  {
    value: "line",
    label: "Line",
    description: "Neon scanlines with motion-friendly poses",
  },
  {
    value: "pentagon",
    label: "Pentagon",
    description: "Balanced five-point tiles for structured bursts",
  },
  {
    value: "asterisk",
    label: "Asterisk",
    description: "Radiating sparks that pop with rotation",
  },
  {
    value: "cross",
    label: "Cross",
    description: "Bold plus signs that anchor grid compositions",
  },
];

const TILE_DENSITY_MIN = 50;
const TILE_DENSITY_MAX = 1000;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const densityToUi = (value: number) => {
  const bounded = clampValue(value, TILE_DENSITY_MIN, TILE_DENSITY_MAX);
  return Math.round(
    ((bounded - TILE_DENSITY_MIN) / (TILE_DENSITY_MAX - TILE_DENSITY_MIN)) *
      100,
  );
};

const uiToDensity = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    TILE_DENSITY_MIN + (bounded / 100) * (TILE_DENSITY_MAX - TILE_DENSITY_MIN),
  );
};

const PALETTE_VARIANCE_MIN = 0;
const PALETTE_VARIANCE_MAX = 150; // Increased from 100 to allow more variance

const varianceToUi = (value: number) => {
  const bounded = clampValue(value, PALETTE_VARIANCE_MIN, PALETTE_VARIANCE_MAX);
  return Math.round(
    ((bounded - PALETTE_VARIANCE_MIN) / (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN)) *
      100,
  );
};

const uiToVariance = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round(
    PALETTE_VARIANCE_MIN + (bounded / 100) * (PALETTE_VARIANCE_MAX - PALETTE_VARIANCE_MIN),
  );
};

const MOTION_SPEED_MAX = 12.5;

const speedToUi = (value: number) => {
  const bounded = clampValue(value, 0, MOTION_SPEED_MAX);
  return Math.round((bounded / MOTION_SPEED_MAX) * 100);
};

const uiToSpeed = (value: number) => {
  const bounded = clampValue(value, 0, 100);
  return Math.round((bounded / 100) * MOTION_SPEED_MAX);
};

const PALETTE_OPTIONS = palettes.map((palette) => ({
  value: palette.id,
  label: palette.name,
}));

const CANVAS_PALETTE_OPTIONS = [
  { value: "auto", label: "Palette (auto)" },
  ...PALETTE_OPTIONS,
];

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
}: {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
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
}) => {
  const tooltipId = tooltip ? `${id}-tip` : undefined;
  const resolvedLabel =
    currentLabel ??
    options.find((option) => option.value === value)?.label ??
    placeholder ??
    "Select";

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
          </SelectContent>
        </Select>
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


const BitlabLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 330 45"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M52.5 7.5h-7.5V0h7.5v7.5h7.5v30h-7.5v7.5H0v-7.5h45v-7.5h7.5v-7.5h-7.5v-7.5h7.5v-7.5zm-30 7.5V7.5h7.5V15h-7.5zm0 15v-7.5h7.5V30h-7.5zM90 45h-30v-7.5h22.5V0H90v45zM90 7.5h15v7.5H90V7.5zm45 22.5h-7.5V7.5h15V0h7.5v15h-15v15h7.5v15h-45v-7.5h37.5v-7.5zM210 45h-60v-7.5h52.5v-7.5H210V45zm-37.5-15V0h7.5v30h-7.5zM262.5 7.5h-7.5V0h7.5v7.5h7.5v37.5h-60v-7.5h22.5v-7.5h7.5v7.5h22.5V7.5zm-30 15V7.5h7.5v15h-7.5zM322.5 7.5h-7.5V0h7.5v7.5h7.5v30h-7.5v7.5h-52.5v-7.5h45v-7.5h7.5v-7.5h-7.5v-7.5h7.5v-7.5zm-30 7.5V7.5h7.5V15h-7.5zm0 15v-7.5h7.5V30h-7.5z"
    />
  </svg>
);

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
};

const getStoredThemeColor = (): ThemeColor => {
  if (typeof window === "undefined") {
    return "amber";
  }
  const stored = window.localStorage.getItem(THEME_COLOR_STORAGE_KEY);
  return stored === "mint" ||
    stored === "violet" ||
    stored === "ember" ||
    stored === "lagoon" ||
    stored === "rose"
    ? (stored as ThemeColor)
    : "amber";
};

const getStoredThemeShape = (): "box" | "rounded" => {
  if (typeof window === "undefined") {
    return "box";
  }
  const stored = window.localStorage.getItem(THEME_SHAPE_STORAGE_KEY);
  return stored === "rounded" ? "rounded" : "box";
};

const App = () => {
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpriteController | null>(null);
  const [spriteState, setSpriteState] = useState<GeneratorState | null>(null);
  const [frameRate, setFrameRate] = useState<number>(60);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getStoredThemeMode(),
  );
  const [themeColor, setThemeColor] = useState<ThemeColor>(() =>
    getStoredThemeColor(),
  );
  const [themeShape, setThemeShape] = useState<"box" | "rounded">(() =>
    getStoredThemeShape(),
  );
  const [controlTabIndex, setControlTabIndex] = useState(0);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [isBadgeCompact, setIsBadgeCompact] = useState(false);
  const [isBadgePopoverOpen, setIsBadgePopoverOpen] = useState(false);
  const [lockedMovementMode, setLockedMovementMode] = useState(false);
  const [lockedSpritePalette, setLockedSpritePalette] = useState(false);
  const [lockedCanvasPalette, setLockedCanvasPalette] = useState(false);
  const [lockedBlendMode, setLockedBlendMode] = useState(false);
  const [lockedSpriteMode, setLockedSpriteMode] = useState(false);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [forceLoader, setForceLoader] = useState(false);
  
  const isStudioLayout = useMediaQuery("(min-width: 1760px)");
  // NOTE: 03/02/2025 – Responsive split/merge logic is currently disabled to
  // simplify the layout while we concentrate on other features. The previous
  // implementation relied on viewport measurements and observers to decide
  // when to split the columns. Should we need that behaviour again, the old
  // state and effects can be restored from version control.
  const isWideLayout = false;
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasCardShellRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [isSmallCanvas, setIsSmallCanvas] = useState(false);
  const statusBarRef = useRef<HTMLDivElement | null>(null);
  const statusBarLeftRef = useRef<HTMLDivElement | null>(null);
  const statusBarRightRef = useRef<HTMLDivElement | null>(null);
  const badgeMeasureRef = useRef<HTMLDivElement | null>(null);
  const badgeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const badgePopoverRef = useRef<HTMLDivElement | null>(null);
  const headerActionsRef = useRef<HTMLDivElement | null>(null);
  const headerToolbarRef = useRef<HTMLDivElement | null>(null);
  const headerOverflowTriggerRef = useRef<HTMLButtonElement | null>(null);
  // Initialize overflow state based on viewport width immediately (synchronously)
  // This prevents the brief stacking flash before the overflow menu appears
  const [showHeaderOverflow, setShowHeaderOverflow] = useState(() => {
    if (typeof window === "undefined") return false;
    // Check if viewport is below threshold where overflow would be needed
    // This is a conservative estimate - the actual check will refine it
    return window.innerWidth < 640;
  });
  const [isHeaderOverflowOpen, setIsHeaderOverflowOpen] = useState(false);
  
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

  // Check if header actions fit and show overflow menu if they don't
  // Use refs to track state to prevent effect re-runs from causing loops
  const showHeaderOverflowRef = useRef(showHeaderOverflow);
  useEffect(() => {
    showHeaderOverflowRef.current = showHeaderOverflow;
  }, [showHeaderOverflow]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    let lastCheckTime = 0;
    let pendingStateUpdate: boolean | null = null;
    const DEBOUNCE_DELAY = 250; // Increased delay to prevent rapid toggling
    const MIN_TIME_BETWEEN_CHECKS = 150; // Increased minimum time between checks

    const checkHeaderFit = () => {
      // Throttle checks to prevent too many rapid updates
      const now = Date.now();
      if (now - lastCheckTime < MIN_TIME_BETWEEN_CHECKS) {
        debounceTimer = setTimeout(checkHeaderFit, MIN_TIME_BETWEEN_CHECKS - (now - lastCheckTime));
        return;
      }
      lastCheckTime = now;

      const headerToolbar = headerToolbarRef.current;
      const headerActions = headerActionsRef.current;
      if (!headerToolbar) {
        return;
      }

      // Get the header container to check available space
      const header = headerToolbar.closest(".app-header");
      if (!header) {
        return;
      }

      const headerRect = header.getBoundingClientRect();
      const logoButton = header.querySelector(".app-logo-button");
      const logoRect = logoButton?.getBoundingClientRect();
      
      // Get computed styles to check actual padding
      const headerStyles = window.getComputedStyle(header);
      const paddingLeft = parseFloat(headerStyles.paddingLeft) || 0;
      const paddingRight = parseFloat(headerStyles.paddingRight) || 0;
      const headerPadding = paddingLeft + paddingRight;
      
      // Get gap from toolbar
      const toolbarStyles = window.getComputedStyle(headerToolbar);
      const gap = parseFloat(toolbarStyles.gap) || 12;
      
      // Calculate available space: header width minus logo width minus gaps
      const logoWidth = logoRect?.width ?? 0;
      const minGapForActions = 20; // Minimum space needed for actions
      
      // Available width for actions (or hamburger button)
      const availableWidth = headerRect.width - logoWidth - headerPadding - gap - minGapForActions;
      
      // Try to measure actual actions width if they're rendered
      let actionsWidth = 0;
      if (headerActions) {
        const actionsRect = headerActions.getBoundingClientRect();
        actionsWidth = actionsRect.width;
      }
      
      // If we couldn't measure (actions not rendered because overflow is shown),
      // use estimated width: Theme selector (~120px) + Shape button (44px) + Mode button (44px) + gaps (~12px) = ~220px
      const estimatedActionsWidth = 220;
      const actionsWidthToUse = actionsWidth > 0 ? actionsWidth : estimatedActionsWidth;
      
      // Increased hysteresis buffer to prevent flickering at threshold
      // When showing overflow: need at least 40px extra space before switching back
      // When hiding overflow: need at least 40px less space before switching back
      const HYSTERESIS_BUFFER = 40;
      const viewportWidth = window.innerWidth;
      
      // Use ref to get current state to avoid dependency issues
      const currentNeedsOverflow = showHeaderOverflowRef.current;
      
      let needsOverflow: boolean;
      if (currentNeedsOverflow) {
        // Currently showing overflow - need significantly more space to hide it (with buffer)
        needsOverflow = viewportWidth < 640 || actionsWidthToUse > (availableWidth - HYSTERESIS_BUFFER);
      } else {
        // Currently showing actions - need significantly less space to show overflow (with buffer)
        needsOverflow = viewportWidth < 640 || actionsWidthToUse > (availableWidth + HYSTERESIS_BUFFER);
      }
      
      // Only update state if it actually changed and we don't have a pending update
      if (needsOverflow !== currentNeedsOverflow && pendingStateUpdate !== needsOverflow) {
        // Clear any existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        // Store pending state
        pendingStateUpdate = needsOverflow;
        
        // Debounce the state update to prevent rapid toggling
        debounceTimer = setTimeout(() => {
          // Double-check that state hasn't changed since we queued this update
          if (showHeaderOverflowRef.current === currentNeedsOverflow) {
            setShowHeaderOverflow(needsOverflow);
          }
          pendingStateUpdate = null;
          debounceTimer = null;
        }, DEBOUNCE_DELAY);
      }
    };

    // Check immediately and also after a short delay to ensure DOM is ready
    // Immediate check prevents stacking flash on initial render
    checkHeaderFit();
    const timeoutId = setTimeout(checkHeaderFit, 100);

    // Set up ResizeObserver to watch for size changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        // Use requestAnimationFrame to batch updates and ensure DOM has updated
        requestAnimationFrame(() => {
          checkHeaderFit();
        });
      });
      
      const headerToolbar = headerToolbarRef.current;
      const header = headerToolbar?.closest(".app-header");
      const logoButton = header?.querySelector(".app-logo-button");
      
      // Observe header and toolbar - these will change when viewport resizes
      if (headerToolbar) {
        resizeObserver.observe(headerToolbar);
      }
      if (header) {
        resizeObserver.observe(header);
      }
      if (logoButton) {
        resizeObserver.observe(logoButton);
      }
      
      // Also observe headerActions if it exists (when overflow is not shown)
      // This helps catch size changes when actions are visible
      const headerActions = headerActionsRef.current;
      if (headerActions) {
        resizeObserver.observe(headerActions);
      }
    }

    // Also listen to window resize - this ensures we catch viewport changes
    // even if observed elements don't change size (e.g., when header width stays same but viewport expands)
    const handleWindowResize = () => {
      // Throttle to avoid too many checks
      requestAnimationFrame(checkHeaderFit);
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      clearTimeout(timeoutId);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []); // Empty deps - use ref to track state to prevent re-run loops

  // Handle click-away for header overflow menu
  useEffect(() => {
    if (!isHeaderOverflowOpen) {
      return;
    }
    const handleClickAway = (event: MouseEvent) => {
      const trigger = headerOverflowTriggerRef.current;
      const popover = document.querySelector(".header-overflow-popover");
      if (!trigger || !popover) {
        return;
      }
      const target = event.target as Node;
      if (
        trigger.contains(target) ||
        popover.contains(target)
      ) {
        return;
      }
      setIsHeaderOverflowOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsHeaderOverflowOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHeaderOverflowOpen]);

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
  //   const viewportWidth = window.innerWidth;
  //   const appMainPadding = getAppMainPadding();
  //   const shouldSplit = shouldSplitColumns(viewportWidth, appMainPadding);
  //   setIsWideLayout(shouldSplit);
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

  const cycleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  }, []);

  const cycleThemeShape = useCallback(() => {
    setThemeShape((prev) => (prev === "box" ? "rounded" : "box"));
  }, []);

  const themeModeText = useMemo(() => {
    switch (themeMode) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  }, [themeMode]);

  const ThemeModeIcon = useMemo(() => {
    switch (themeMode) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      default:
        return Monitor;
    }
  }, [themeMode]);

  const ThemeModeIconComponent = ThemeModeIcon;

  const ready = spriteState !== null && controllerRef.current !== null;

  useLayoutEffect(() => {
    if (!statusBarRef.current) {
      return;
    }

    const computeCompact = () => {
      const bar = statusBarRef.current;
      const right = statusBarRightRef.current;
      const measure = badgeMeasureRef.current;
      if (!bar || !right || !measure) {
        return;
      }
      const available =
        bar.clientWidth -
        right.offsetWidth -
        parseFloat(
          getComputedStyle(bar).columnGap || getComputedStyle(bar).gap || "0",
        ) -
        8; // small buffer
      const required = measure.offsetWidth;
      setIsBadgeCompact(required > available);
    };

    const observers: ResizeObserver[] = [];

    const elements = [
      statusBarRef.current,
      statusBarRightRef.current,
      badgeMeasureRef.current,
    ].filter(Boolean) as Element[];

    elements.forEach((element) => {
      const observer = new ResizeObserver(() => computeCompact());
      observer.observe(element);
      observers.push(observer);
    });

    computeCompact();

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  useEffect(() => {
    if (!isBadgeCompact) {
      setIsBadgePopoverOpen(false);
    }
  }, [isBadgeCompact]);

  useEffect(() => {
    if (!isBadgePopoverOpen) {
      return;
    }
    const handleClickAway = (event: MouseEvent) => {
      const trigger = badgeTriggerRef.current;
      const popover = badgePopoverRef.current;
      if (!trigger || !popover) {
        return;
      }
      const target = event.target as Node;
      if (
        trigger.contains(target) ||
        popover.contains(target)
      ) {
        return;
      }
      setIsBadgePopoverOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBadgePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBadgePopoverOpen]);

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
    return (
      palettes.find((item) => item.id === spriteState?.paletteId) ?? palettes[0]
    );
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


  useEffect(() => {
    const container = sketchContainerRef.current;
    if (!container) {
      return;
    }

    const controller = createSpriteController(container, {
      onStateChange: (state) => {
        setSpriteState(state);
      },
      onFrameRate: setFrameRate,
    });

    controllerRef.current = controller;
    controller.randomizeAll();
    setSpriteState(controller.getState());

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

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

  const handleRotationAnimatedToggle = useCallback(
    (checked: boolean) => {
      controllerRef.current?.setRotationAnimated(checked);
    },
    [],
  );


  const handleThemeSelect = useCallback((value: string) => {
    if (
      value === "amber" ||
      value === "mint" ||
      value === "violet" ||
      value === "ember" ||
      value === "lagoon" ||
      value === "rose"
    ) {
      setThemeColor(value);
    }
  }, []);

  const handleShapeSelect = useCallback((value: string) => {
    setThemeShape(value === "rounded" ? "rounded" : "box");
  }, []);

  const handleRandomiseAll = useCallback(() => {
    controllerRef.current?.randomizeAll();
  }, []);

  const handleFullscreenToggle = useCallback(async () => {
    // Use the Card element instead of canvasWrapper for fullscreen
    const cardElement = document.querySelector('.canvas-card--fullscreen') || canvasWrapperRef.current?.closest('.canvas-card') || canvasWrapperRef.current;
    if (!cardElement) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        // Try standard API first, then vendor prefixes
        const requestFullscreen =
          (cardElement as any).requestFullscreen ||
          (cardElement as any).webkitRequestFullscreen ||
          (cardElement as any).mozRequestFullScreen ||
          (cardElement as any).msRequestFullscreen;
        
        if (requestFullscreen) {
          await requestFullscreen.call(cardElement);
          setIsFullscreen(true);
        }
      } else {
        // Try standard API first, then vendor prefixes
        const exitFullscreen =
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen;
        
        if (exitFullscreen) {
          await exitFullscreen.call(document);
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  const handleFullscreenClose = useCallback(async () => {
    const fullscreenElement =
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement;
    
    if (fullscreenElement) {
      try {
        const exitFullscreen =
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen;
        
        if (exitFullscreen) {
          await exitFullscreen.call(document);
          setIsFullscreen(false);
        }
      } catch (error) {
        console.error("Exit fullscreen error:", error);
      }
    }
  }, []);

  const handleHUDMouseEnter = useCallback(() => {
    if (!isFullscreen) return;
    setHudVisible(true);
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
    }
  }, [isFullscreen]);

  const handleHUDMouseLeave = useCallback(() => {
    if (!isFullscreen) return;
    hudTimeoutRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 3000);
  }, [isFullscreen]);

  // Listen for fullscreen changes (ESC key, etc.) and manage HUD visibility
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      const newIsFullscreen = !!fullscreenElement;
      console.log('Fullscreen change detected:', { newIsFullscreen, fullscreenElement });
      setIsFullscreen(newIsFullscreen);
      
      if (newIsFullscreen) {
        // Show HUD immediately when entering fullscreen
        setHudVisible(true);
        if (hudTimeoutRef.current) {
          clearTimeout(hudTimeoutRef.current);
          hudTimeoutRef.current = null;
        }
        // Start auto-hide timer (disabled for debugging - set to 30 seconds)
        hudTimeoutRef.current = setTimeout(() => {
          setHudVisible(false);
        }, 30000);
      } else {
        // Always show when not in fullscreen
        setHudVisible(true);
        if (hudTimeoutRef.current) {
          clearTimeout(hudTimeoutRef.current);
          hudTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Track mouse/touch movement in fullscreen
  useEffect(() => {
    // Show HUD on any interaction when in fullscreen
    const handleInteraction = () => {
      // Check fullscreen state directly
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      
      if (!fullscreenElement) {
        // Not in fullscreen, always show
        setHudVisible(true);
        return;
      }

      // In fullscreen, show HUD on interaction
      setHudVisible(true);
      if (hudTimeoutRef.current) {
        clearTimeout(hudTimeoutRef.current);
      }
      hudTimeoutRef.current = setTimeout(() => {
        setHudVisible(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("mousedown", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      if (hudTimeoutRef.current) {
        clearTimeout(hudTimeoutRef.current);
      }
    };
  }, []);

  const statusPalette = currentPalette.name;
  const statusMode = currentModeLabel;
  const statusBlend = spriteState
    ? formatBlendMode(spriteState.blendMode as BlendModeOption)
    : "None";
  const statusMotion = spriteState
    ? formatMovementMode(spriteState.movementMode)
    : "None";

  const applyDocumentTheme = useCallback(
    (mode: ThemeMode, color: ThemeColor, shape: "box" | "rounded") => {
      if (typeof document === "undefined") {
        return;
    }
      const root = document.documentElement;
    const prefersDark =
        mode === "system" &&
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : false;
      const resolved: Exclude<ThemeMode, "system"> =
        mode === "system" ? (prefersDark ? "dark" : "light") : mode;
      root.setAttribute("data-theme-mode", mode);
      root.setAttribute("data-theme", resolved);
      root.setAttribute("data-theme-color", color);
      root.setAttribute("data-theme-shape", shape);
      root.style.setProperty("color-scheme", resolved);
    },
    [],
  );

  useLayoutEffect(() => {
    applyDocumentTheme(themeMode, themeColor, themeShape);
  }, [applyDocumentTheme, themeMode, themeColor, themeShape]);

  useEffect(() => {
    if (
      themeMode !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyDocumentTheme("system", themeColor, themeShape);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, [applyDocumentTheme, themeColor, themeMode, themeShape]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_COLOR_STORAGE_KEY, themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_SHAPE_STORAGE_KEY, themeShape);
  }, [themeShape]);

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



  const renderStatusBar = () => {
    const hudClassName = isFullscreen 
      ? `status-bar status-bar--fullscreen-hud${!hudVisible ? ' status-bar--hidden' : ''}`
      : 'status-bar';
    
    return (
      <div
        className={hudClassName}
        onMouseEnter={handleHUDMouseEnter}
        onMouseLeave={handleHUDMouseLeave}
        data-fullscreen={isFullscreen}
        data-hud-visible={hudVisible}
        ref={statusBarRef}
        style={isFullscreen ? { 
          position: 'relative',
          pointerEvents: 'auto',
          opacity: 1,
          visibility: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px',
          minWidth: '300px',
          maxWidth: '90vw',
          width: 'auto',
          backgroundColor: 'rgba(19, 20, 45, 0.95)',
          border: '2px solid rgba(255, 212, 71, 0.5)',
          borderRadius: '8px',
          boxShadow: '6px 6px 0 rgba(26, 13, 44, 0.85)',
          backdropFilter: 'blur(8px)',
        } : undefined}
      >
      <div className="status-bar-left" ref={statusBarLeftRef}>
        <div
          ref={badgeMeasureRef}
          aria-hidden="true"
          className="status-bar-badges-measure"
        >
          <Badge variant="surface" size="sm">
            Sprite · {statusMode}
          </Badge>
          <Badge variant="surface" size="sm">
            Palette · {statusPalette}
          </Badge>
          <Badge variant="surface" size="sm">
            Blend · {statusBlend}
          </Badge>
          <Badge variant="surface" size="sm">
            Motion · {statusMotion}
          </Badge>
          <Badge variant="surface" size="sm">
            {frameRate.toFixed(0)} FPS
          </Badge>
        </div>
        {isMobile ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowStatusInfo(!showStatusInfo)}
              className="status-bar-info-toggle"
              aria-label="Toggle status information"
              title="Status information"
            >
              <HelpCircle className="status-bar-icon" />
            </Button>
            {showStatusInfo && (
              <div className="status-bar-info-mobile">
                <Badge variant="surface" size="sm">
                  Sprite · {statusMode}
                </Badge>
                <Badge variant="surface" size="sm">
                  Palette · {statusPalette}
                </Badge>
                <Badge variant="surface" size="sm">
                  Blend · {statusBlend}
                </Badge>
                <Badge variant="surface" size="sm">
                  Motion · {statusMotion}
                </Badge>
                <Badge variant="surface" size="sm">
                  {frameRate.toFixed(0)} FPS
                </Badge>
              </div>
            )}
          </>
        ) : (
          <>
            {isBadgeCompact ? (
              <div className="status-bar-summary-wrapper">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Show status summary"
                  title="Show status summary"
                  onClick={() =>
                    setIsBadgePopoverOpen((previous) => !previous)
                  }
                  ref={badgeTriggerRef}
                >
                  <Info className="status-bar-icon" />
                </Button>
                {isBadgePopoverOpen && (
                  <div
                    className="status-bar-summary-popover"
                    role="dialog"
                    ref={badgePopoverRef}
                  >
                    <Badge variant="surface" size="sm">
                      Sprite · {statusMode}
                    </Badge>
                    <Badge variant="surface" size="sm">
                      Palette · {statusPalette}
                    </Badge>
                    <Badge variant="surface" size="sm">
                      Blend · {statusBlend}
                    </Badge>
                    <Badge variant="surface" size="sm">
                      Motion · {statusMotion}
                    </Badge>
                    <Badge variant="surface" size="sm">
                      {frameRate.toFixed(0)} FPS
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Badge variant="surface" size="sm">
                  Sprite · {statusMode}
                </Badge>
                <Badge variant="surface" size="sm">
                  Palette · {statusPalette}
                </Badge>
                <Badge variant="surface" size="sm">
                  Blend · {statusBlend}
                </Badge>
                <Badge variant="surface" size="sm">
                  Motion · {statusMotion}
                </Badge>
                <Badge variant="surface" size="sm">
                  {frameRate.toFixed(0)} FPS
                </Badge>
              </>
            )}
          </>
        )}
        </div>
      <div className="status-bar-right" ref={statusBarRightRef}>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleRandomiseAll}
          disabled={!ready}
          className="status-bar-randomise-button"
          aria-label="Randomise all"
          title="Randomise all"
        >
          <RefreshCw className="status-bar-icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setShowPresetManager(true)}
          disabled={!ready}
          className="status-bar-presets-button"
          aria-label="Presets"
          title="Presets"
        >
          <Bookmark className="status-bar-icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setShowExportModal(true)}
          disabled={!ready}
          className="status-bar-export-button"
          aria-label="Export canvas"
          title="Export canvas"
        >
          <Camera className="status-bar-icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={isFullscreen ? handleFullscreenClose : handleFullscreenToggle}
          disabled={!ready}
          className="status-bar-fullscreen-button"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <X className="status-bar-icon" />
          ) : (
            <Maximize2 className="status-bar-icon" />
          )}
        </Button>
      </div>
    </div>
    );
  };

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
                {renderStatusBar()}
              </div>
            )}
          </div>
          {!isFullscreen && renderStatusBar()}
        </Card.Content>
      </Card>
    </div>
  );

  return (
    <>
    <div className="app-shell">
      <div className="app-frame app-frame--compact app-frame--header">
        <header className={`app-header${isMobile ? " app-header--mobile" : ""}`}>
          {isMobile ? (
          <div className="app-header-mobile-row">
            <button type="button" className="app-logo-button app-logo-button--mobile" aria-label="BitLab">
              <BitlabLogo className="app-logo-svg" />
            </button>
            <MobileMenu
              themeColor={themeColor}
              themeShape={themeShape}
              themeModeText={themeModeText}
              ThemeModeIcon={ThemeModeIconComponent}
              onThemeColorChange={handleThemeSelect}
              onThemeShapeChange={handleShapeSelect}
              onThemeModeCycle={cycleThemeMode}
              themeColorOptions={THEME_COLOR_OPTIONS}
              themeColorPreview={THEME_COLOR_PREVIEW}
            />
          </div>
        ) : (
          <>
            <button type="button" className="app-logo-button" aria-label="BitLab">
              <BitlabLogo className="app-logo-svg" />
            </button>
            <div className="header-toolbar" ref={headerToolbarRef}>
              <div className="header-spacer"></div>
              {showHeaderOverflow ? (
                <div className="header-actions header-actions--overflow">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="header-icon-button header-overflow-trigger"
                    onClick={() => setIsHeaderOverflowOpen((prev) => !prev)}
                    aria-label="Theme options"
                    aria-expanded={isHeaderOverflowOpen}
                    ref={headerOverflowTriggerRef}
                  >
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ display: "block" }}
                      aria-hidden="true"
                    >
                      <line x1={3} y1={6} x2={21} y2={6} />
                      <line x1={3} y1={12} x2={21} y2={12} />
                      <line x1={3} y1={18} x2={21} y2={18} />
                    </svg>
                  </Button>
                  {isHeaderOverflowOpen && (
                    <div
                      className="header-overflow-popover"
                      role="dialog"
                      aria-label="Theme options"
                    >
                      <div className="header-overflow-content">
                        <Select value={themeColor} onValueChange={handleThemeSelect}>
                          <SelectTrigger
                            className="header-theme-trigger"
                            aria-label="Theme colour"
                          >
                            <SelectValue placeholder="Theme">
                              {THEME_COLOR_OPTIONS.find(
                                (option) => option.value === themeColor,
                              )?.label ?? "Theme"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="header-theme-menu">
                            <SelectGroup>
                              {THEME_COLOR_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="header-theme-item"
                                  style={
                                    {
                                      "--theme-preview": THEME_COLOR_PREVIEW[option.value],
                                    } as CSSProperties
                                  }
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="header-icon-button"
                          onClick={cycleThemeShape}
                          aria-label={`Switch theme shape (current ${themeShape === "rounded" ? "rounded" : "box"})`}
                          title={`Shape: ${themeShape === "rounded" ? "Rounded" : "Box"}`}
                        >
                          {themeShape === "rounded" ? (
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ display: "block" }} aria-hidden="true">
                              <rect x={4} y={4} width={16} height={16} rx={3} ry={3} />
                            </svg>
                          ) : (
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ display: "block" }} aria-hidden="true">
                              <rect x={4} y={4} width={16} height={16} />
                            </svg>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="header-icon-button"
                          onClick={cycleThemeMode}
                          aria-label={`Switch theme mode (current ${themeModeText})`}
                          title={`Theme: ${themeModeText}`}
                        >
                          <ThemeModeIconComponent className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="header-actions" ref={headerActionsRef}>
                  <Select value={themeColor} onValueChange={handleThemeSelect}>
                    <SelectTrigger
                      className="header-theme-trigger"
                      aria-label="Theme colour"
                    >
                      <SelectValue placeholder="Theme">
                        {THEME_COLOR_OPTIONS.find(
                          (option) => option.value === themeColor,
                        )?.label ?? "Theme"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="header-theme-menu">
                      <SelectGroup>
                        {THEME_COLOR_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="header-theme-item"
                            style={
                              {
                                "--theme-preview": THEME_COLOR_PREVIEW[option.value],
                              } as CSSProperties
                            }
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="header-icon-button"
                    onClick={cycleThemeShape}
                    aria-label={`Switch theme shape (current ${themeShape === "rounded" ? "rounded" : "box"})`}
                    title={`Shape: ${themeShape === "rounded" ? "Rounded" : "Box"}`}
                  >
                    {themeShape === "rounded" ? (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ display: "block" }} aria-hidden="true">
                        <rect x={4} y={4} width={16} height={16} rx={3} ry={3} />
                      </svg>
                    ) : (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ display: "block" }} aria-hidden="true">
                        <rect x={4} y={4} width={16} height={16} />
                      </svg>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="header-icon-button"
                    onClick={cycleThemeMode}
                    aria-label={`Switch theme mode (current ${themeModeText})`}
                    title={`Theme: ${themeModeText}`}
                  >
                    <ThemeModeIconComponent className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </>
          )}
        </header>
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
            © {new Date().getFullYear()} BitLab · Generative Playground ·{" "}
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

    </div>
    </>
  );
};

export default App;
