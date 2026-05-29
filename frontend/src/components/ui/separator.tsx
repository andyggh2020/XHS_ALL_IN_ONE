import * as React from "react";
import { cn } from "../../lib/utils";

const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  gradient?: boolean;
}>(({ className, orientation = "horizontal", gradient, ...props }, ref) => {
  if (gradient) {
    return (
      <div
        ref={ref}
        className={cn("shrink-0", orientation === "horizontal" ? "w-full h-[1px]" : "h-full w-[1px]", className)}
        style={{
          background: orientation === "horizontal"
            ? "linear-gradient(90deg, transparent, var(--primary), var(--purple), var(--pink), transparent)"
            : "linear-gradient(180deg, transparent, var(--primary), var(--purple), var(--pink), transparent)",
        }}
        {...props}
      />
    );
  }
  return (
    <div
      ref={ref}
      className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)}
      {...props}
    />
  );
});
Separator.displayName = "Separator";

export { Separator };
