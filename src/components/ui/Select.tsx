import * as Headless from '@headlessui/react'
import * as RadixSelect from '@radix-ui/react-select'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { ChevronDownIcon, CheckIcon } from 'lucide-react'

// Export Headless UI Select for backward compatibility (simple form select)
export const HeadlessSelect = forwardRef(function HeadlessSelect(
  { className, multiple, ...props }: { className?: string } & Omit<Headless.SelectProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLSelectElement>
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        // Basic layout
        'group relative block w-full',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-[var(--select-bg)] before:shadow-sm',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset has-data-focus:after:ring-2 has-data-focus:after:ring-blue-500',
        // Disabled state
        'has-data-disabled:opacity-50 has-data-disabled:before:bg-[var(--select-bg)] has-data-disabled:before:shadow-none',
      ])}
    >
      <Headless.Select
        ref={ref}
        multiple={multiple}
        {...props}
        className={clsx([
          // Basic layout
          'relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          // Horizontal padding
          multiple
            ? 'px-[calc(--spacing(3.5)-1px)] sm:px-[calc(--spacing(3)-1px)]'
            : 'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
          // Options (multi-select)
          '[&_optgroup]:font-semibold',
          // Typography
          'text-base/6 text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] sm:text-sm/6',
          // Border
          'border border-[var(--select-border)] data-hover:border-[var(--select-hover)]',
          // Background color
          'bg-[var(--select-bg)]',
          // Hide default focus styles
          'focus:outline-hidden',
          // Invalid state
          'data-invalid:border-[var(--status-error)] data-invalid:data-hover:border-[var(--status-error)]',
          // Disabled state
          'data-disabled:border-[var(--select-border)] data-disabled:bg-[var(--select-bg)] data-disabled:opacity-100',
        ])}
      />
      {!multiple && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="size-5 stroke-[var(--text-subtle)] group-has-data-disabled:stroke-[var(--text-muted)] sm:size-4 forced-colors:stroke-[CanvasText]"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path d="M5.75 10.75L8 13L10.25 10.75" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.25 5.25L8 3L5.75 5.25" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </span>
  )
})

// Radix UI Select components - main export used by components
export const Select = RadixSelect.Root
export const SelectRoot = RadixSelect.Root // Alias for clarity

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={clsx(
      'group relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
      'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
      // Text colors - use theme variables
      'text-base/6 sm:text-sm/6',
      'text-[var(--text-primary)]',
      'placeholder:text-[var(--text-subtle)]',
      // Border - use theme variables
      'border border-[var(--select-border)]',
      'data-hover:border-[var(--select-hover)]',
      // Background - use theme variables
      'bg-[var(--select-bg)]',
      'focus:outline-hidden',
      // Invalid state
      'data-[invalid]:border-[var(--status-error)] data-[invalid]:data-hover:border-[var(--status-error)]',
      // Disabled state
      'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      'flex items-center justify-between',
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
      <ChevronDownIcon className="size-5 stroke-[var(--text-muted)] group-data-[disabled]:stroke-[var(--text-subtle)] sm:size-4" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
))
SelectTrigger.displayName = RadixSelect.Trigger.displayName

export const SelectValue = RadixSelect.Value

export const SelectContent = forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={clsx(
        'control-dropdown-menu',
        'relative z-50',
        'min-w-[8rem] overflow-hidden',
        className
      )}
      position="popper"
      sideOffset={4}
      {...props}
    >
      <RadixSelect.Viewport className="control-select-viewport">
        {children}
      </RadixSelect.Viewport>
      <RadixSelect.ScrollUpButton className="control-select-scroll control-select-scroll-up">
        <ChevronDownIcon className="size-4 rotate-180" />
      </RadixSelect.ScrollUpButton>
      <RadixSelect.ScrollDownButton className="control-select-scroll control-select-scroll-down">
        <ChevronDownIcon className="size-4" />
      </RadixSelect.ScrollDownButton>
    </RadixSelect.Content>
  </RadixSelect.Portal>
))
SelectContent.displayName = RadixSelect.Content.displayName

export const SelectItem = forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={clsx(
      'control-dropdown-item',
      'relative flex w-full cursor-pointer select-none items-center rounded-sm',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    <RadixSelect.ItemIndicator className="control-select-indicator">
      <CheckIcon className="select-check-icon" />
    </RadixSelect.ItemIndicator>
  </RadixSelect.Item>
))
SelectItem.displayName = RadixSelect.Item.displayName

export const SelectGroup = RadixSelect.Group

export const SelectLabel = forwardRef<
  React.ElementRef<typeof RadixSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={clsx('control-select-category-label', className)}
    {...props}
  />
))
SelectLabel.displayName = RadixSelect.Label.displayName

export const SelectSeparator = forwardRef<
  React.ElementRef<typeof RadixSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={clsx('my-1 h-px bg-muted', className)}
    {...props}
  />
))
SelectSeparator.displayName = RadixSelect.Separator.displayName
