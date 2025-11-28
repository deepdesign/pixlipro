import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing fullscreen state and HUD visibility
 * Handles fullscreen API, auto-hiding HUD, and interaction tracking
 */
export function useFullscreen(canvasWrapperRef: React.RefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudVisibleRef = useRef(hudVisible);
  
  // Keep ref in sync with state
  useEffect(() => {
    hudVisibleRef.current = hudVisible;
  }, [hudVisible]);

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      const newIsFullscreen = !!fullscreenElement;
      setIsFullscreen(newIsFullscreen);

      if (newIsFullscreen) {
        // Show HUD immediately when entering fullscreen
        setHudVisible(true);
        if (hudTimeoutRef.current) {
          clearTimeout(hudTimeoutRef.current);
          hudTimeoutRef.current = null;
        }
        // Start auto-hide timer (30 seconds)
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
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
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
        // Not in fullscreen, always show (but only update if not already visible)
        if (!hudVisibleRef.current) {
          setHudVisible(true);
        }
        return;
      }

      // In fullscreen, show HUD on interaction
      // Only update state if currently hidden
      if (!hudVisibleRef.current) {
        setHudVisible(true);
      }
      
      // Reset timeout (don't update state if already visible)
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

  const handleFullscreenToggle = useCallback(async () => {
    // Use the Card element instead of canvasWrapper for fullscreen
    const cardElement = document.querySelector('.canvas-card--fullscreen') || 
      canvasWrapperRef.current?.closest('.canvas-card') || 
      canvasWrapperRef.current;
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
  }, [canvasWrapperRef]);

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

  return {
    isFullscreen,
    hudVisible,
    setHudVisible,
    handleFullscreenToggle,
    handleFullscreenClose,
    handleHUDMouseEnter,
    handleHUDMouseLeave,
  };
}

