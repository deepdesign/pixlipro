import clsx from 'clsx'
import type React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardRoot = ({ className, ...props }: CardProps) => (
  <div
    className={clsx(
      "rounded-lg border border-slate-950/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900",
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: CardProps) => (
  <div
    className={clsx("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
);

const CardTitle = ({ className, ...props }: CardProps) => (
  <h3
    className={clsx("text-lg font-semibold leading-none tracking-tight text-slate-950 dark:text-white", className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: CardProps) => (
  <p className={clsx("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
);

const CardContent = ({ className, ...props }: CardProps) => (
  <div className={clsx("", className)} {...props} />
);

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
});


