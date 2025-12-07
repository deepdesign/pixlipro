import { useRef } from "react";
import { Button } from "@/components/Button";
import { RefreshCw, Camera, Save } from "lucide-react";
import { animatePulse } from "@/lib/utils/animations";
import { DualMonitorIcon } from "@/components/Header/DualMonitorIcon";
import type { GeneratorState } from "@/types/generator";

interface StatusBarProps {
  spriteState: GeneratorState | null;
  frameRate: number;
  ready: boolean;
  isFullscreen: boolean;
  hudVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRandomiseAll: () => void;
  onSaveScene: () => void;
  onShowExport: () => void;
  onOpenProjector?: () => void;
  isProjectorMode?: boolean;
  statusBarRef?: React.RefObject<HTMLDivElement | null>;
}

export function StatusBar({
  frameRate,
  ready,
  isFullscreen,
  hudVisible,
  onMouseEnter,
  onMouseLeave,
  onRandomiseAll,
  onSaveScene,
  onShowExport,
  onOpenProjector,
  isProjectorMode = false,
  statusBarRef,
}: StatusBarProps) {
  const randomiseButtonRef = useRef<HTMLButtonElement>(null);

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
      {/* Left side: Randomise and Save Image */}
      <div className="status-bar-left flex items-center gap-2">
        <Button
          ref={randomiseButtonRef}
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => {
            if (randomiseButtonRef.current) {
              animatePulse(randomiseButtonRef.current);
            }
            onRandomiseAll();
          }}
          disabled={!ready}
          className="status-bar-randomise-button"
          aria-label="Randomise settings"
          title="Randomise settings"
        >
          <RefreshCw className="status-bar-icon" data-slot="icon" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={onShowExport}
          disabled={!ready}
          className="status-bar-export-button"
          aria-label="Save an image"
          title="Save an image"
        >
          <Camera className="status-bar-icon" data-slot="icon" />
        </Button>
        {/* FPS display */}
        <div className="bg-black rounded-md px-2 py-1 text-xs font-mono text-theme-muted/50 flex items-center justify-center h-9">
          {frameRate.toFixed(0)} FPS
        </div>
      </div>

      {/* Right side: Main tools - Save Scene and Project */}
      <div className="status-bar-right flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveScene}
          disabled={!ready}
          aria-label="Save scene"
          title="Save scene"
        >
          <Save className="h-4 w-4 mr-2" />
          Save scene
        </Button>
        {onOpenProjector && !isProjectorMode && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onOpenProjector}
            disabled={!ready}
            className="status-bar-projector-button"
            aria-label="Open projector window"
            title="Open projector window"
          >
            <DualMonitorIcon className="status-bar-icon" data-slot="icon" />
          </Button>
        )}
      </div>
    </div>
  );
}
