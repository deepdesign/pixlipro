import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import type React from 'react'

export function SwitchGroup({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="control"
      {...props}
      className={clsx(
        className,
        // Basic groups
        'space-y-3 **:data-[slot=label]:font-normal',
        // With descriptions
        'has-data-[slot=description]:space-y-6 has-data-[slot=description]:**:data-[slot=label]:font-medium'
      )}
    />
  )
}

export function SwitchField({
  className,
  ...props
}: { className?: string } & Omit<Headless.FieldProps, 'as' | 'className'>) {
  return (
    <Headless.Field
      data-slot="field"
      {...props}
      className={clsx(
        className,
        // Base layout
        'grid grid-cols-[1fr_auto] gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto]',
        // Control layout
        '*:data-[slot=control]:col-start-2 *:data-[slot=control]:self-start sm:*:data-[slot=control]:mt-0.5',
        // Label layout
        '*:data-[slot=label]:col-start-1 *:data-[slot=label]:row-start-1',
        // Description layout
        '*:data-[slot=description]:col-start-1 *:data-[slot=description]:row-start-2',
        // With description
        'has-data-[slot=description]:**:data-[slot=label]:font-medium'
      )}
    />
  )
}

const colors = {
  'dark/zinc': [
    // This color uses the primary theme color variable directly in the component
    // No additional styles needed
  ],
  'dark/white': [
    '[--switch-bg-ring:var(--color-slate-950)]/90 [--switch-bg:var(--color-slate-900)] [data-theme="dark"]:[--switch-bg-ring:transparent] [data-theme="dark"]:[--switch-bg:var(--color-white)]',
    '[--switch-ring:var(--color-slate-950)]/90 [--switch-shadow:var(--color-black)]/10 [--switch:white] [data-theme="dark"]:[--switch-ring:transparent] [data-theme="dark"]:[--switch:var(--color-slate-900)]',
  ],
  dark: [
    '[--switch-bg-ring:var(--color-slate-950)]/90 [--switch-bg:var(--color-slate-900)] [data-theme="dark"]:[--switch-bg-ring:var(--color-white)]/15',
    '[--switch-ring:var(--color-slate-950)]/90 [--switch-shadow:var(--color-black)]/10 [--switch:white]',
  ],
  zinc: [
    '[--switch-bg-ring:var(--color-slate-700)]/90 [--switch-bg:var(--color-slate-600)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch-shadow:var(--color-black)]/10 [--switch:white] [--switch-ring:var(--color-slate-700)]/90',
  ],
  white: [
    '[--switch-bg-ring:var(--color-black)]/15 [--switch-bg:white] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch-shadow:var(--color-black)]/10 [--switch-ring:transparent] [--switch:var(--color-slate-950)]',
  ],
  red: [
    '[--switch-bg-ring:var(--color-red-700)]/90 [--switch-bg:var(--color-red-600)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-red-700)]/90 [--switch-shadow:var(--color-red-900)]/20',
  ],
  orange: [
    '[--switch-bg-ring:var(--color-orange-600)]/90 [--switch-bg:var(--color-orange-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-orange-600)]/90 [--switch-shadow:var(--color-orange-900)]/20',
  ],
  amber: [
    '[--switch-bg-ring:var(--color-amber-500)]/80 [--switch-bg:var(--color-amber-400)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-amber-950)]',
  ],
  yellow: [
    '[--switch-bg-ring:var(--color-yellow-400)]/80 [--switch-bg:var(--color-yellow-300)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-yellow-950)]',
  ],
  lime: [
    '[--switch-bg-ring:var(--color-lime-400)]/80 [--switch-bg:var(--color-lime-300)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-lime-950)]',
  ],
  green: [
    '[--switch-bg-ring:var(--color-green-700)]/90 [--switch-bg:var(--color-green-600)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-green-700)]/90 [--switch-shadow:var(--color-green-900)]/20',
  ],
  emerald: [
    '[--switch-bg-ring:var(--color-emerald-600)]/90 [--switch-bg:var(--color-emerald-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-emerald-600)]/90 [--switch-shadow:var(--color-emerald-900)]/20',
  ],
  teal: [
    '[--switch-bg-ring:var(--color-teal-700)]/90 [--switch-bg:var(--color-teal-600)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-teal-700)]/90 [--switch-shadow:var(--color-teal-900)]/20',
  ],
  cyan: [
    '[--switch-bg-ring:var(--color-cyan-400)]/80 [--switch-bg:var(--color-cyan-300)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-cyan-950)]',
  ],
  sky: [
    '[--switch-bg-ring:var(--color-sky-600)]/80 [--switch-bg:var(--color-sky-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-sky-600)]/80 [--switch-shadow:var(--color-sky-900)]/20',
  ],
  blue: [
    '[--switch-bg-ring:var(--color-blue-700)]/90 [--switch-bg:var(--color-blue-600)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-blue-700)]/90 [--switch-shadow:var(--color-blue-900)]/20',
  ],
  indigo: [
    '[--switch-bg-ring:var(--color-indigo-600)]/90 [--switch-bg:var(--color-indigo-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-indigo-600)]/90 [--switch-shadow:var(--color-indigo-900)]/20',
  ],
  violet: [
    '[--switch-bg-ring:var(--color-violet-600)]/90 [--switch-bg:var(--color-violet-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-violet-600)]/90 [--switch-shadow:var(--color-violet-900)]/20',
  ],
  purple: [
    '[--switch-bg-ring:var(--color-purple-600)]/90 [--switch-bg:var(--color-purple-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-purple-600)]/90 [--switch-shadow:var(--color-purple-900)]/20',
  ],
  fuchsia: [
    '[--switch-bg-ring:var(--color-fuchsia-600)]/90 [--switch-bg:var(--color-fuchsia-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-fuchsia-600)]/90 [--switch-shadow:var(--color-fuchsia-900)]/20',
  ],
  pink: [
    '[--switch-bg-ring:var(--color-pink-600)]/90 [--switch-bg:var(--color-pink-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-pink-600)]/90 [--switch-shadow:var(--color-pink-900)]/20',
  ],
  rose: [
    '[--switch-bg-ring:var(--color-rose-600)]/90 [--switch-bg:var(--color-rose-500)] [data-theme="dark"]:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-rose-600)]/90 [--switch-shadow:var(--color-rose-900)]/20',
  ],
}

type Color = keyof typeof colors

export function Switch({
  color = 'dark/zinc',
  className,
  ...props
}: {
  color?: Color
  className?: string
} & Omit<Headless.SwitchProps, 'as' | 'className' | 'children'>) {
  return (
    <Headless.Switch
      data-slot="control"
      {...props}
      className={clsx(
        className,
        // Base styles - standard Tailwind switch
        'group relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none',
        // Unchecked state - use icon-bg for consistency with slider and buttons
        'bg-[var(--icon-bg)]',
        // Checked state - use primary UI theme color variable
        'data-checked:bg-[var(--accent-primary)]',
        // Disabled state
        'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
        // Color specific styles
        colors[color]
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          // Thumb - use theme slider thumb color for consistency
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--slider-thumb-bg)] shadow ring-0 transition duration-200 ease-in-out',
          // Unchecked position
          'translate-x-0',
          // Checked position
          'group-data-checked:translate-x-5',
          // Disabled
          'group-data-disabled:opacity-50'
        )}
      />
    </Headless.Switch>
  )
}
