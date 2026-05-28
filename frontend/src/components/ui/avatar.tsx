import * as React from "react";
import { cn } from "../../lib/utils";

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { src?: string; alt?: string; fallback?: string }>(
  ({ className, src, alt, fallback, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || ""} className="aspect-square h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1668dc] to-[#7c3aed] text-xs font-bold text-white select-none">
          {fallback || "U"}
        </div>
      )}
    </div>
  ),
);
Avatar.displayName = "Avatar";

export { Avatar };
