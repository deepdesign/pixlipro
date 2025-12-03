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
 * Wraps text content with tooltip functionality styled like Flowbite tooltips.
 * The tooltip appears on hover with Flowbite's Tailwind CSS styling.
 * Based on Flowbite's tooltip design: https://flowbite.com/docs/components/tooltips/
 */
export function TextWithTooltip({ id, text, children, className = "" }: TextWithTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip || !isVisible) return;
    
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 8; // 8px spacing
    
    // Position tooltip above the trigger, centered horizontally
    const top = triggerRect.top - tooltipRect.height - spacing;
    const left = triggerRect.left + triggerRect.width / 2;
    
    setPosition({
      top: Math.max(8, top),
      left: Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8)),
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
        className={`inline-block cursor-help ${className}`}
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="absolute z-10 inline-block px-3 py-2 text-xs font-medium text-theme-primary rounded-lg shadow-sm transition-opacity duration-300 opacity-100"
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translateX(-50%)",
            zIndex: 1000,
            backgroundColor: "var(--theme-primary-tint700)",
          }}
        >
          {text}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--theme-primary-tint700)]" />
        </div>
      )}
    </>
  );
}