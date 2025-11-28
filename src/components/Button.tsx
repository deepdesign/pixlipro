import { cn } from "@/lib/utils";
import React, { type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: "default" | "secondary" | "outline" | "link" | "background" | "naked" | "lock" | "circle";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

/**
 * Button component using pure Tailwind CSS
 * 
 * Variants:
 * - default → Primary theme color (for selected/active states, especially icon buttons)
 * - secondary → Slate solid button
 * - outline → Outlined button with border
 * - link → Text link style
 * - background → Icon button with subtle background
 * - naked → Icon button with no background (shows on hover)
 * - lock → Lock button variant (naked style, uses primary color when locked via data-locked attribute)
 * 
 * Sizes:
 * - sm → Small text and padding
 * - md → Default size
 * - lg → Large text and padding
 * - icon → 36px × 36px square button (h-9 w-9)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = "md",
      className = "",
      variant = "default",
      asChild = false,
      ...props
    },
    forwardedRef,
  ) => {
    // Base classes for all buttons
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    // Variant classes - all use theme-aware Tailwind colors
    const variantClasses = {
      default: size === "icon" 
        ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:bg-[var(--accent-primary)]/90 border-0"
        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
      secondary: "bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600",
      outline: "border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
      link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-100",
      background: "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700 border-0",
      naked: "bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 border-0",
      lock: "bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 border-0 data-[locked=true]:bg-red-600 data-[locked=true]:text-white data-[locked=true]:hover:bg-red-700 dark:data-[locked=true]:bg-red-600 dark:data-[locked=true]:hover:bg-red-700",
      circle: "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700 border-0 rounded-full icon-button h-6 w-6 p-0 flex items-center justify-center aspect-square",
    };

    // Size classes
    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-8 text-base",
      icon: "h-9 w-9 p-0 icon-button",
    };

    // Combine classes
    // For circle variant, don't apply size classes (it has its own dimensions)
    const classes = cn(
      baseClasses,
      variantClasses[variant],
      variant !== "circle" ? sizeClasses[size] : "",
      className
    );

    // If asChild, wrap with Slot
    if (asChild) {
      return (
        <Slot
          ref={forwardedRef}
          className={classes}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={forwardedRef}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";