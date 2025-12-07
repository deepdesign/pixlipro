import { cn } from "@/lib/utils";
import React, { type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import "./Button.css";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: "default" | "secondary" | "outline" | "link" | "circle";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

/**
 * Button component using custom CSS
 * 
 * Variants:
 * - default → Primary theme color (for selected/active states, especially icon buttons)
 * - secondary → Slate solid button
 * - outline → Outlined button with border
 * - link → Text link style
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
    // Base class for all buttons
    const baseClass = "btn";

    // Variant classes - using custom CSS
    const variantClass = `btn-${variant}`;

    // Size classes - using custom CSS
    const sizeClass = size === "icon" ? "btn-icon" : `btn-${size}`;

    // Combine classes
    // For circle variant, don't apply size classes (it has its own dimensions)
    const classes = cn(
      baseClass,
      variantClass,
      variant !== "circle" ? sizeClass : "",
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