import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for managing header overflow menu visibility
 * Handles responsive overflow menu based on viewport width and header content size
 */
export function useHeaderOverflow(
  headerToolbarRef: React.RefObject<HTMLDivElement | null>,
  headerActionsRef: React.RefObject<HTMLDivElement | null>,
) {
  const [showHeaderOverflow, setShowHeaderOverflow] = useState(() => {
    if (typeof window === "undefined") return false;
    // Check if viewport is below threshold where overflow would be needed
    return window.innerWidth < 640;
  });
  const [isHeaderOverflowOpen, setIsHeaderOverflowOpen] = useState(false);
  const headerOverflowTriggerRef = useRef<HTMLButtonElement | null>(null);
  const showHeaderOverflowRef = useRef(showHeaderOverflow);

  // Update ref when state changes
  useEffect(() => {
    showHeaderOverflowRef.current = showHeaderOverflow;
  }, [showHeaderOverflow]);

  // Check if header actions fit and show overflow menu if they don't
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastCheckTime = 0;
    let pendingStateUpdate: boolean | null = null;
    const DEBOUNCE_DELAY = 250;
    const MIN_TIME_BETWEEN_CHECKS = 150;

    const checkHeaderFit = () => {
      // Throttle checks to prevent too many rapid updates
      const now = Date.now();
      if (now - lastCheckTime < MIN_TIME_BETWEEN_CHECKS) {
        debounceTimer = setTimeout(
          checkHeaderFit,
          MIN_TIME_BETWEEN_CHECKS - (now - lastCheckTime),
        );
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
      const minGapForActions = 20;

      // Available width for actions (or hamburger button)
      const availableWidth =
        headerRect.width - logoWidth - headerPadding - gap - minGapForActions;

      // Try to measure actual actions width if they're rendered
      let actionsWidth = 0;
      if (headerActions) {
        const actionsRect = headerActions.getBoundingClientRect();
        actionsWidth = actionsRect.width;
      }

      // If we couldn't measure (actions not rendered because overflow is shown),
      // use estimated width: Theme selector (~120px) + Shape button (44px) + Mode button (44px) + gaps (~12px) = ~220px
      const estimatedActionsWidth = 220;
      const actionsWidthToUse =
        actionsWidth > 0 ? actionsWidth : estimatedActionsWidth;

      // Increased hysteresis buffer to prevent flickering at threshold
      const HYSTERESIS_BUFFER = 40;
      const viewportWidth = window.innerWidth;

      // Use ref to get current state to avoid dependency issues
      const currentNeedsOverflow = showHeaderOverflowRef.current;

      let needsOverflow: boolean;
      if (currentNeedsOverflow) {
        // Currently showing overflow - need significantly more space to hide it (with buffer)
        needsOverflow =
          viewportWidth < 640 ||
          actionsWidthToUse > availableWidth - HYSTERESIS_BUFFER;
      } else {
        // Currently showing actions - need significantly less space to show overflow (with buffer)
        needsOverflow =
          viewportWidth < 640 ||
          actionsWidthToUse > availableWidth + HYSTERESIS_BUFFER;
      }

      // Only update state if it actually changed and we don't have a pending update
      if (
        needsOverflow !== currentNeedsOverflow &&
        pendingStateUpdate !== needsOverflow
      ) {
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
    checkHeaderFit();
    const timeoutId = setTimeout(checkHeaderFit, 100);

    // Set up ResizeObserver to watch for size changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
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
      const headerActions = headerActionsRef.current;
      if (headerActions) {
        resizeObserver.observe(headerActions);
      }
    }

    // Also listen to window resize
    const handleWindowResize = () => {
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
      if (trigger.contains(target) || popover.contains(target)) {
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

  return {
    showHeaderOverflow,
    isHeaderOverflowOpen,
    setIsHeaderOverflowOpen,
    headerOverflowTriggerRef,
  };
}

