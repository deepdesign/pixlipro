import { forwardRef } from "react";
import type React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

export const Select = SelectPrimitive.Root;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  SelectPrimitive.SelectTriggerProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
      className={clsx(
        "grid w-full cursor-default grid-cols-1 rounded-md h-9 pr-2 pl-3 text-left",
        "bg-theme-select text-theme-primary outline-1 -outline-offset-1 outline-theme-panel",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-primary)]",
        "text-[0.65rem] uppercase tracking-[0.18em]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "[&>span[data-placeholder]]:text-theme-subtle", // Placeholder text styling
        "[&>span:not([data-placeholder])]:uppercase [&>span:not([data-placeholder])]:text-[0.65rem] [&>span:not([data-placeholder])]:tracking-[0.18em]", // Selected value styling
        "[&>span[data-radix-select-value]]:text-[0.65rem] [&>span[data-radix-select-value]]:uppercase [&>span[data-radix-select-value]]:tracking-[0.18em]", // Direct SelectValue styling
        className
      )}
    {...props}
  >
    <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
      {children}
    </span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="col-start-1 row-start-1 size-5 self-center justify-self-end text-theme-subtle sm:size-4" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectContentProps
>(
  (
    { className, children, position = "popper", sideOffset = 8, ...props },
    ref,
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={clsx(
          "relative z-50 max-h-56 w-[var(--radix-select-trigger-width)] overflow-auto rounded-md py-1 text-base",
          "bg-theme-select outline-1 -outline-offset-1 outline-theme-panel",
          "sm:text-sm",
          "data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0",
          className
        )}
        position={position}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center bg-theme-select text-theme-subtle">
          <ChevronUp className="h-3 w-3" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center bg-theme-select text-theme-subtle">
          <ChevronDown className="h-3 w-3" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectGroup = SelectPrimitive.Group;

export const SelectItem = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={clsx(
      "group relative cursor-default py-2 pr-9 pl-3 select-none outline-hidden",
      "text-theme-primary data-[highlighted]:bg-[var(--accent-primary)] data-[highlighted]:text-[var(--accent-primary-contrast)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.16em] whitespace-nowrap">
      {children}
    </SelectPrimitive.ItemText>
      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--accent-primary)] group-data-[highlighted]:text-[var(--accent-primary-contrast)]">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-5" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectLabel = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={clsx(
      "px-2 py-2 pt-3 text-[0.6rem] uppercase tracking-[0.2em] font-semibold",
      "text-theme-subtle",
      "pointer-events-none select-none",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = SelectPrimitive.Separator;

