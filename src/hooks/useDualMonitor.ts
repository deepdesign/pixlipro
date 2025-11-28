import { useState, useEffect, useCallback, useRef } from "react";
import { loadSettings, saveSettings } from "@/lib/storage/settingsStorage";

export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  isPrimary: boolean;
}

export interface DualMonitorState {
  isEnabled: boolean;
  isProjectorMode: boolean;
  projectorWindow: Window | null;
  screens: ScreenInfo[];
  hasMultipleScreens: boolean;
}

/**
 * Hook for dual monitor support
 * Detects available screens and manages projector mode window
 */
export function useDualMonitor() {
  const [state, setState] = useState<DualMonitorState>(() => {
    // Load preference from settings
    const settings = loadSettings();
    
    return {
      isEnabled: settings.dualMonitorEnabled || false,
      isProjectorMode: false,
      projectorWindow: null,
      screens: [],
      hasMultipleScreens: false,
    };
  });

  const projectorWindowRef = useRef<Window | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Detect available screens
  useEffect(() => {
    const detectScreens = () => {
      const screens: ScreenInfo[] = [];
      
      // Primary screen
      screens.push({
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        isPrimary: true,
      });

      // Check for multiple screens
      // Note: Browser security limits screen detection, but we can check if window can be positioned
      // For secondary screen, we'll use window.open with screenX/screenY positioning
      const hasMultipleScreens = window.screen.width < window.screen.availWidth || 
                                  window.screen.height < window.screen.availHeight;

      setState(prev => ({
        ...prev,
        screens,
        hasMultipleScreens,
      }));
    };

    detectScreens();
    window.addEventListener("resize", detectScreens);
    return () => window.removeEventListener("resize", detectScreens);
  }, []);

  // Setup BroadcastChannel for state synchronization
  // Note: This hook doesn't have access to spriteState, so we'll handle state requests
  // in App.tsx where spriteState is available
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      console.warn("BroadcastChannel API not available, using window.postMessage fallback");
      return;
    }

    const channel = new BroadcastChannel("pixli-projector-sync");
    broadcastChannelRef.current = channel;

    // State requests are handled in App.tsx where spriteState is available
    // This channel is just kept open for sending state updates

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  // Enable/disable dual monitor mode
  const setEnabled = useCallback((enabled: boolean) => {
    saveSettings({ dualMonitorEnabled: enabled });
    setState(prev => ({ ...prev, isEnabled: enabled }));
    
    // If disabling, close projector window
    if (!enabled && projectorWindowRef.current) {
      projectorWindowRef.current.close();
      projectorWindowRef.current = null;
      setState(prev => ({ ...prev, projectorWindow: null, isProjectorMode: false }));
    }
  }, []);

  // Open projector mode window
  const openProjectorWindow = useCallback(() => {
    // Close existing window if open
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      projectorWindowRef.current.close();
    }

    // Calculate position for secondary screen
    // Try to position window on secondary display (right side of primary)
    const primaryWidth = window.screen.width;
    const primaryHeight = window.screen.height;
    const left = primaryWidth + 100; // Position to the right of primary screen
    const top = 0;

    // Get current origin for relative URL
    const origin = window.location.origin;
    const projectorUrl = `${origin}/projector`;
    
    // Open new window with minimal chrome
    const projectorWindow = window.open(
      projectorUrl,
      "pixli-projector",
      `width=${primaryWidth},height=${primaryHeight},left=${left},top=${top},` +
      `menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
    );

    if (!projectorWindow) {
      console.error("Failed to open projector window. Please allow popups for this site.");
      return;
    }

    projectorWindowRef.current = projectorWindow;
    setState(prev => ({
      ...prev,
      projectorWindow,
      isProjectorMode: true,
    }));

    // Handle window close
    const checkClosed = setInterval(() => {
      if (projectorWindow.closed) {
        clearInterval(checkClosed);
        projectorWindowRef.current = null;
        setState(prev => ({
          ...prev,
          projectorWindow: null,
          isProjectorMode: false,
        }));
      }
    }, 500);

    // Cleanup interval on unmount
    return () => clearInterval(checkClosed);
  }, []);

  // Close projector window
  const closeProjectorWindow = useCallback(() => {
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      projectorWindowRef.current.close();
    }
    projectorWindowRef.current = null;
    setState(prev => ({
      ...prev,
      projectorWindow: null,
      isProjectorMode: false,
    }));
  }, []);

  // Send state update to projector window
  const sendStateToProjector = useCallback((state: any) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "state-update",
        state,
        timestamp: Date.now(),
      });
    }
  }, []);

  return {
    ...state,
    setEnabled,
    openProjectorWindow,
    closeProjectorWindow,
    sendStateToProjector,
  };
}

