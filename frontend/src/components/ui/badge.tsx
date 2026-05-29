import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive shadow-sm",
        outline: "text-foreground border-border hover:border-primary/30",
        success: "border-transparent bg-[var(--success)]/10 text-[var(--success)] shadow-sm",
        warning: "border-transparent bg-[var(--warning)]/10 text-[var(--warning)] shadow-sm",
        purple: "border-transparent bg-[var(--purple)]/10 text-[var(--purple)] shadow-sm",
        pink: "border-transparent bg-[var(--pink)]/10 text-[var(--pink)] shadow-sm",
        orange: "border-transparent bg-[var(--orange)]/10 text-[var(--orange)] shadow-sm",
        teal: "border-transparent bg-[var(--teal)]/10 text-[var(--teal)] shadow-sm",
        indigo: "border-transparent bg-[var(--indigo)]/10 text-[var(--indigo)] shadow-sm",
        rose: "border-transparent bg-[var(--rose)]/10 text-[var(--rose)] shadow-sm",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
