import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { X, Download, RefreshCw } from "lucide-react";

interface FullscreenHUDProps {
  onRandomise: () => void;
  onClose: () => void;
  onScreenshot: () => void;
  visible: boolean;
}

const HUD_AUTO_HIDE_DELAY = 3000; // 3 seconds

export const FullscreenHUD = ({
  onRandomise,
  onClose,
  onScreenshot,
  visible,
}: FullscreenHUDProps) => {
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = useCallback(() => {
    setHudVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setHudVisible(false);
    }, HUD_AUTO_HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (!visible) {
      setHudVisible(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      return;
    }

    // Show HUD immediately when entering fullscreen
    setHudVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Start auto-hide timer
    hideTimeoutRef.current = setTimeout(() => {
      setHudVisible(false);
    }, HUD_AUTO_HIDE_DELAY);

    // Track mouse/touch movement
    const handleMouseMove = () => {
      setHudVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setHudVisible(false);
      }, HUD_AUTO_HIDE_DELAY);
    };
    const handleTouchStart = () => {
      setHudVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setHudVisible(false);
      }, HUD_AUTO_HIDE_DELAY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [visible]);

  // Always render when visible, but control opacity
  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fullscreen-hud ${!hudVisible ? "fullscreen-hud--hidden" : ""}`}
      ref={hudRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: visible ? "block" : "none" }}
    >
      <div className="fullscreen-hud-content">
        <Button
          type="button"
          size="md"
          variant="secondary"
          onClick={onRandomise}
          className="fullscreen-hud-button"
        >
          <RefreshCw className="fullscreen-hud-icon" />
          Randomise all
        </Button>
        <Button
          type="button"
          size="md"
          variant="secondary"
          onClick={onScreenshot}
          className="fullscreen-hud-button"
        >
          <Download className="fullscreen-hud-icon" />
          Screenshot
        </Button>
        <Button
          type="button"
          size="md"
          variant="default"
          onClick={onClose}
          className="fullscreen-hud-button"
        >
          <X className="fullscreen-hud-icon" />
          Close
        </Button>
      </div>
    </div>
  );
};

