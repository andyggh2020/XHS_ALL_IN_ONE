import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20 hover:-translate-y-0.5 active:scale-[0.98]",
        outline:
          "border border-input bg-background/50 shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30 hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:bg-primary/8 hover:text-foreground active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline underline-offset-4 decoration-primary/30",
        gradient:
          "text-white shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] relative overflow-hidden",
        "gradient-purple":
          "text-white shadow-lg shadow-[var(--purple)]/25 hover:-translate-y-0.5 active:scale-[0.98] relative overflow-hidden",
        "gradient-sunset":
          "text-white shadow-lg shadow-[var(--pink)]/25 hover:-translate-y-0.5 active:scale-[0.98] relative overflow-hidden",
        "gradient-ocean":
          "text-white shadow-lg shadow-[var(--teal)]/25 hover:-translate-y-0.5 active:scale-[0.98] relative overflow-hidden",
      },
      size: {
        default: "h-10 px-5 py-2 gap-2",
        sm: "h-9 rounded-lg px-3 text-xs gap-1.5",
        lg: "h-12 rounded-xl px-8 text-base gap-2.5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const gradientMap: Record<string, string> = {
  gradient: "from-[var(--primary)] via-[var(--purple)] to-[var(--pink)] bg-[length:200%_100%] hover:bg-right-top",
  "gradient-purple": "from-[var(--purple)] via-[var(--pink)] to-[var(--orange)] bg-[length:200%_100%] hover:bg-right-top",
  "gradient-sunset": "from-[var(--orange)] via-[var(--pink)] to-[var(--purple)] bg-[length:200%_100%] hover:bg-right-top",
  "gradient-ocean": "from-[var(--teal)] via-[var(--cyan)] to-[var(--primary)] bg-[length:200%_100%] hover:bg-right-top",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isGradient = variant && variant.startsWith("gradient");
    const gradientClass = isGradient ? gradientMap[variant!] : undefined;
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isGradient && gradientClass,
          loading && "relative !text-transparent",
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
        {children}
        {isGradient && (
          <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/10 via-transparent to-white/5 pointer-events-none" />
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
