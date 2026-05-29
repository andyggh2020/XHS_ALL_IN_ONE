"use client";

import { cn } from "../../lib/utils";

/** Loading spinner */
export function Spinner({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeMap = { sm: "h-4 w-4 border-2", default: "h-8 w-8 border-[2.5px]", lg: "h-12 w-12 border-[3px]" };
  return (
    <div
      className={cn("animate-spin rounded-full border-primary/20 border-t-primary", sizeMap[size], className)}
      style={{ animationDuration: "0.6s" }}
    />
  );
}

/** Full-page loading overlay */
export function PageLoading({ tip = "加载中..." }: { tip?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{tip}</p>
      </div>
    </div>
  );
}

/** Card skeleton */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-6 rounded-2xl border bg-card/80 backdrop-blur-lg">
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 rounded-full bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Stat card skeleton */
export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border bg-card/80 backdrop-blur-lg space-y-4 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-muted" />
      <div className="h-6 w-24 rounded-full bg-muted" />
      <div className="h-3 w-32 rounded-full bg-muted" />
    </div>
  );
}

/** List skeleton */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full bg-muted w-3/4" />
            <div className="h-2 rounded-full bg-muted w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table skeleton */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-lg overflow-hidden animate-pulse">
      <div className="flex gap-4 p-4 bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-3 rounded-full bg-muted" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-t border-border">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="flex-1 h-3 rounded-full bg-muted/50" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border bg-card/80 backdrop-blur-lg space-y-3">
            <div className="h-3 rounded-full bg-muted w-1/2" />
            <div className="h-8 rounded-full bg-muted w-1/3" />
          </div>
        ))}
      </div>
      <div className="p-6 rounded-2xl border bg-card/80 backdrop-blur-lg h-[300px]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-full bg-muted" style={{ width: `${50 + Math.random() * 50}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
