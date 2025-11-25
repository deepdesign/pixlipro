import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Badge } from "@/components/catalyst/badge";
import { Maximize2, X, RefreshCw, Bookmark, Camera, HelpCircle, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { animatePulse } from "@/lib/utils/animations";
import type { GeneratorState, MovementMode } from "@/types/generator";
import type { BlendModeOption } from "@/types/generator";

interface StatusBarProps {
  spriteState: GeneratorState | null;
  frameRate: number;
  ready: boolean;
  isFullscreen: boolean;
  hudVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRandomiseAll: () => void;
  onShowPresets: () => void;
  onShowExport: () => void;
  onFullscreenToggle: () => void;
  onFullscreenClose: () => void;
  formatBlendMode: (mode: BlendModeOption) => string;
  formatMovementMode: (mode: MovementMode) => string;
  currentModeLabel: string;
  currentPaletteName: string;
  statusBarRef?: React.RefObject<HTMLDivElement | null>;
}

export function StatusBar({
  spriteState,
  frameRate,
  ready,
  isFullscreen,
  hudVisible,
  onMouseEnter,
  onMouseLeave,
  onRandomiseAll,
  onShowPresets,
  onShowExport,
  onFullscreenToggle,
  onFullscreenClose,
  formatBlendMode,
  formatMovementMode,
  currentModeLabel,
  currentPaletteName,
  statusBarRef,
}: StatusBarProps) {
  const isMobile = useIsMobile();
  const randomiseButtonRef = useRef<HTMLButtonElement>(null);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [isBadgeCompact, setIsBadgeCompact] = useState(false);
  const [isBadgePopoverOpen, setIsBadgePopoverOpen] = useState(false);
  const statusBarLeftRef = useRef<HTMLDivElement | null>(null);
  const statusBarRightRef = useRef<HTMLDivElement | null>(null);
  const badgeMeasureRef = useRef<HTMLDivElement | null>(null);
  const badgeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const badgePopoverRef = useRef<HTMLDivElement | null>(null);

  const statusPalette = currentPaletteName;
  const statusMode = currentModeLabel;
  const statusBlend = spriteState
    ? formatBlendMode(spriteState.blendMode as BlendModeOption)
    : "None";
  const statusMotion = spriteState
    ? formatMovementMode(spriteState.movementMode)
    : "None";

  // Handle click-away for badge popover
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

  // Measure badge width and determine if compact mode is needed
  useEffect(() => {
    if (!statusBarLeftRef.current || !badgeMeasureRef.current) {
      return;
    }

      const checkCompact = () => {
      const rightWidth = statusBarRightRef.current?.offsetWidth || 0;
      const measureWidth = badgeMeasureRef.current?.offsetWidth || 0;
      const availableWidth = (statusBarRef?.current?.offsetWidth || 0) - rightWidth - 64; // 64px for padding/gaps (increased for share button)
      
      setIsBadgeCompact(measureWidth > availableWidth);
    };

    checkCompact();
    const resizeObserver = new ResizeObserver(checkCompact);
    
    if (statusBarLeftRef.current) {
      resizeObserver.observe(statusBarLeftRef.current);
    }
    if (statusBarRightRef.current) {
      resizeObserver.observe(statusBarRightRef.current);
    }
    if (badgeMeasureRef.current) {
      resizeObserver.observe(badgeMeasureRef.current);
    }
    if (statusBarRef?.current) {
      resizeObserver.observe(statusBarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [statusBarRef, statusMode, statusPalette, statusBlend, statusMotion, frameRate]);

  const hudClassName = isFullscreen 
    ? `status-bar status-bar--fullscreen-hud${!hudVisible ? ' status-bar--hidden' : ''}`
    : 'status-bar';
  
  return (
    <div
      className={isFullscreen ? `${hudClassName} gap-3 p-3` : hudClassName}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
              className="icon-button status-bar-info-toggle"
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
                  className="icon-button"
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
          ref={randomiseButtonRef}
          type="button"
          size="icon"
          variant="outline"
          onClick={() => {
            if (randomiseButtonRef.current) {
              animatePulse(randomiseButtonRef.current);
            }
            onRandomiseAll();
          }}
          disabled={!ready}
          className="icon-button status-bar-randomise-button"
          aria-label="Randomise all sprites"
          title="Randomise all sprites"
        >
          <RefreshCw className="status-bar-icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onShowPresets}
          disabled={!ready}
          className="icon-button status-bar-presets-button"
          aria-label="Manage presets"
          title="Manage presets"
        >
          <Bookmark className="status-bar-icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onShowExport}
          disabled={!ready}
          className="icon-button status-bar-export-button"
          aria-label="Share & Export"
          title="Share & Export"
        >
          <Camera className="status-bar-icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={isFullscreen ? onFullscreenClose : onFullscreenToggle}
          disabled={!ready}
          className="icon-button status-bar-fullscreen-button"
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
}

