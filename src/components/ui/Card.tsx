import clsx from 'clsx'
import type React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardRoot = ({ className, ...props }: CardProps) => (
  <div
    className={clsx(
      "rounded-lg border border-theme-card bg-theme-panel p-6 shadow-sm",
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
    className={clsx("text-lg font-semibold leading-none tracking-tight text-theme-primary", className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: CardProps) => (
  <p className={clsx("text-sm text-theme-muted", className)} {...props} />
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


