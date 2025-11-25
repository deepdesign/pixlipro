import { Button as CatalystButton } from "@/components/catalyst/button";
import { cn } from "@/lib/utils";
import React, { type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: "default" | "secondary" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

/**
 * Button component using Catalyst Button directly
 * 
 * Maintains backward compatibility with existing API:
 * - variant="default" → Catalyst solid button with dark/zinc color
 * - variant="secondary" → Catalyst solid button with zinc color
 * - variant="outline" → Catalyst outline button
 * - variant="link" → Catalyst plain button
 * - size="icon" → Adds icon-specific sizing classes
 * - size="sm" → Adds small sizing classes
 * - size="lg" → Adds large sizing classes
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
    // Map variant to Catalyst props
    const catalystProps: {
      color?: Parameters<typeof CatalystButton>[0]["color"];
      outline?: boolean;
      plain?: boolean;
    } = (() => {
      switch (variant) {
        case "outline":
          return { outline: true };
        case "link":
          return { plain: true };
        case "secondary":
          return { color: "zinc" };
        case "default":
        default:
          return { color: "dark/zinc" };
      }
    })();

    // Size-based className additions
    const sizeClasses = (() => {
      switch (size) {
        case "icon":
          return "h-9 w-9 p-0 items-center justify-center";
        case "sm":
          return "text-xs px-3 py-1.5";
        case "lg":
          return "text-base px-8 py-3";
        case "md":
        default:
          return "";
      }
    })();

    // If asChild, wrap with Slot
    if (asChild) {
      return (
        <Slot
          ref={forwardedRef}
          className={cn(sizeClasses, className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <CatalystButton
        ref={forwardedRef}
        className={cn(sizeClasses, className)}
        {...catalystProps}
        {...props}
      >
        {children}
      </CatalystButton>
    );
  },
);

Button.displayName = "Button";
