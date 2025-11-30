import { useEffect, useRef, useState, useCallback } from "react";

interface TextWithTooltipProps {
  id: string;
  text: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * TextWithTooltip Component
 * 
 * Wraps text content with tooltip functionality that appears on hover.
 * The tooltip is shown when hovering over the text itself, not a separate icon.
 * Uses fixed positioning to escape container clipping.
 */
export function TextWithTooltip({ id, text, children, className = "" }: TextWithTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip || !isVisible) return;
    
    const rect = trigger.getBoundingClientRect();
    const spacing = 8; // 0.55rem spacing
    
    // Get tooltip dimensions once rendered
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipHeight = tooltipRect.height || 60; // Fallback estimate
    
    // Position tooltip above the trigger, centered horizontally
    const top = rect.top - tooltipHeight - spacing;
    const left = rect.left + rect.width / 2;
    
    setStyle({
      position: "fixed",
      top: `${Math.max(8, top)}px`, // Ensure tooltip doesn't go above viewport
      left: `${left}px`,
      transform: "translateX(-50%)",
      zIndex: 2147483646,
      opacity: 1,
      visibility: "visible",
    });
  }, [isVisible]);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    trigger.addEventListener("mouseenter", handleMouseEnter);
    trigger.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      trigger.removeEventListener("mouseenter", handleMouseEnter);
      trigger.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Update position after tooltip renders
    const timeoutId = setTimeout(updatePosition, 0);
    
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, updatePosition]);

  return (
    <>
      <span 
        ref={triggerRef}
        className={`retro-tooltip cursor-help ${className}`}
      >
        {children}
      </span>
      {isVisible && (
        <span
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="tooltip-content"
          style={style}
          onLoad={updatePosition}
        >
          {text}
        </span>
      )}
    </>
  );
}
