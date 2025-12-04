import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

export const Textarea = forwardRef(function Textarea(
  {
    className,
    resizable = true,
    ...props
  }: { className?: string; resizable?: boolean } & Omit<Headless.TextareaProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLTextAreaElement>
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        // Basic layout
        'relative block w-full',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-[var(--select-bg)] before:shadow-sm',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring removed
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent',
        // Disabled state
        'has-data-disabled:opacity-50 has-data-disabled:before:bg-[var(--select-bg)] has-data-disabled:before:shadow-none',
      ])}
    >
      <Headless.Textarea
        ref={ref}
        {...props}
        className={clsx([
          // Basic layout
          'relative block h-full w-full appearance-none rounded-lg px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
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
          'disabled:border-[var(--select-border)] disabled:bg-[var(--select-bg)]',
          // Resizable
          resizable ? 'resize-y' : 'resize-none',
        ])}
      />
    </span>
  )
})
