import clsx from 'clsx'
import { Link } from './link'

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(className, 'text-base/6 text-[var(--text-muted)] sm:text-sm/6')}
    />
  )
}

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        'text-[var(--text-primary)] underline decoration-[var(--text-primary)] data-hover:decoration-[var(--text-primary)]'
      )}
    />
  )
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
  return <strong {...props} className={clsx(className, 'font-medium text-[var(--text-primary)]')} />
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      className={clsx(
        className,
        'rounded-sm border border-[var(--select-border)] bg-[var(--select-bg)] px-0.5 text-sm font-medium text-[var(--text-primary)] sm:text-[0.8125rem]'
      )}
    />
  )
}
