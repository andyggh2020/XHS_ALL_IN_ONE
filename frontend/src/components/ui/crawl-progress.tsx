import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";

interface CrawlProgressProps {
  successCount: number;
  failedCount: number;
  isRunning: boolean;
  progressMsg: string | null;
  className?: string;
}

interface Elapsed {
  seconds: number;
  display: string;
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export function CrawlProgress({
  successCount,
  failedCount,
  isRunning,
  progressMsg,
  className,
}: CrawlProgressProps) {
  const [elapsed, setElapsed] = useState<Elapsed>({ seconds: 0, display: "0秒" });
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSuccessRef = useRef(0);
  const [speed, setSpeed] = useState<string>("—");

  // Timer for elapsed time and speed estimation
  useEffect(() => {
    if (isRunning) {
      if (!startRef.current) startRef.current = Date.now();
      prevSuccessRef.current = 0;

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const totalSec = (now - (startRef.current ?? now)) / 1000;
        setElapsed({ seconds: totalSec, display: formatElapsed(totalSec) });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      startRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSpeed("—");
    }
  }, [isRunning]);

  // Speed calculation (items/sec)
  useEffect(() => {
    if (isRunning && elapsed.seconds > 0) {
      const total = successCount + failedCount;
      const itemsPerSec = total / elapsed.seconds;
      setSpeed(itemsPerSec > 0 ? `${itemsPerSec.toFixed(1)}/秒` : "—");
    }
  }, [successCount, failedCount, elapsed.seconds, isRunning]);

  // Estimate progress: use a weighted score (success counts most, then failed)
  const total = successCount + failedCount;
  const estimatedMax = Math.max(total, 1) * 2; // conservative multiplier
  const progressPct = isRunning
    ? Math.min((total / estimatedMax) * 100, 95)
    : total > 0
      ? 100
      : 0;

  // Color based on ratio
  const failedRatio = total > 0 ? failedCount / total : 0;
  const barColor =
    failedRatio > 0.5
      ? "bg-red-500"
      : failedRatio > 0.2
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Animated bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isRunning ? barColor : total > 0 ? "bg-emerald-500" : "bg-muted-foreground/20",
          )}
          style={{ width: `${Math.max(progressPct, isRunning ? 2 : 0)}%` }}
        >
          {isRunning && progressPct < 100 && (
            <div className="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-shimmer" />
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          成功 <strong className="text-foreground">{successCount}</strong>
        </span>

        {failedCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            失败 <strong className="text-foreground">{failedCount}</strong>
          </span>
        )}

        {isRunning && (
          <>
            <span className="text-muted-foreground/60">|</span>
            <span>
              <span className="inline-block w-3 h-3 align-middle">&#9201;</span>{" "}
              {elapsed.display}
            </span>
            <span className="text-muted-foreground/60">|</span>
            <span>
              <span className="inline-block w-3 h-3 align-middle">&#9889;</span>{" "}
              {speed}
            </span>
          </>
        )}

        {progressMsg && (
          <>
            <span className="text-muted-foreground/60">|</span>
            <span className="italic">{progressMsg}</span>
          </>
        )}

        {isRunning && (
          <span className="inline-flex items-center gap-1 text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            抓取中
          </span>
        )}

        {!isRunning && total > 0 && (
          <span className="text-emerald-500">&#10003; 完成</span>
        )}
      </div>
    </div>
  );
}
