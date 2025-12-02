import * as Headless from '@headlessui/react'
import clsx from 'clsx'

export function Label({
  className,
  ...props
}: { className?: string } & Omit<Headless.LabelProps, 'as' | 'className'>) {
  return (
    <Headless.Label
      data-slot="label"
      {...props}
      className={clsx(
        className,
        'block text-base/6 font-semibold text-theme-primary data-disabled:opacity-50 sm:text-sm/6'
      )}
    />
  )
}


