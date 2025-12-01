import { useEffect, useRef, useState } from "react";

interface FlowbiteTooltipProps {
  id: string;
  content: string;
  placement?: "top" | "right" | "bottom" | "left";
  style?: "dark" | "light";
  children: React.ReactNode;
  className?: string;
}

/**
 * FlowbiteTooltip Component
 * 
 * A tooltip component styled like Flowbite tooltips using Tailwind CSS.
 * Based on Flowbite's tooltip design: https://flowbite.com/docs/components/tooltips/
 */
export function FlowbiteTooltip({
  id,
  content,
  placement = "top",
  style = "dark",
  children,
  className = "",
}: FlowbiteTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    trigger.addEventListener("mouseenter", handleMouseEnter);
    trigger.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      trigger.removeEventListener("mouseenter", handleMouseEnter);
      trigger.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const spacing = 8;

      let top = 0;
      let left = 0;

      switch (placement) {
        case "top":
          top = triggerRect.top - tooltipRect.height - spacing;
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case "bottom":
          top = triggerRect.bottom + spacing;
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case "left":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.left - tooltipRect.width - spacing;
          break;
        case "right":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.right + spacing;
          break;
      }

      setPosition({
        top: Math.max(8, top),
        left: Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8)),
      });
    };

    const timeoutId = setTimeout(updatePosition, 0);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, placement]);

  const tooltipBgColor =
    style === "dark"
      ? "bg-gray-900 dark:bg-gray-700 text-white"
      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-600";

  const arrowPosition =
    placement === "top"
      ? "bottom-[-8px] left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-x-transparent border-b-transparent"
      : placement === "bottom"
      ? "top-[-8px] left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-x-transparent border-t-transparent"
      : placement === "left"
      ? "right-[-8px] top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-y-transparent border-r-transparent"
      : "left-[-8px] top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-y-transparent border-l-transparent";

  const arrowBgColor =
    style === "dark"
      ? arrowPosition
      : arrowPosition.replace(/border-[trbl]-(gray-900|gray-700)/g, "border-t-white border-r-white border-b-white border-l-white dark:border-t-gray-800 dark:border-r-gray-800 dark:border-b-gray-800 dark:border-l-gray-800");

  return (
    <>
      <span ref={triggerRef} className={`inline-block ${className}`}>
        {children}
      </span>
      <div
        ref={tooltipRef}
        id={id}
        role="tooltip"
        className={`absolute z-10 inline-block px-3 py-2 text-sm font-medium rounded-lg shadow-sm transition-opacity duration-300 ${tooltipBgColor} ${
          isVisible ? "opacity-100 !visible" : "opacity-0 invisible"
        }`}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform:
            placement === "top" || placement === "bottom"
              ? "translateX(-50%)"
              : placement === "left" || placement === "right"
              ? "translateY(-50%)"
              : "none",
          zIndex: 1000,
        }}
      >
        {content}
        <div className={`absolute w-2 h-2 border-4 ${arrowBgColor}`} />
      </div>
    </>
  );
}