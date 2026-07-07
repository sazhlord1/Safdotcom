import { useState, useEffect } from "react";

interface CountdownTimerProps {
  startedAt: string | null;
  totalSeconds: number;
}

export function CountdownTimer({ startedAt, totalSeconds }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!startedAt) {
      setRemaining(totalSeconds);
      return;
    }

    const startTime = new Date(startedAt).getTime();

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rem = Math.max(0, totalSeconds - elapsed);
      setRemaining(rem);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, totalSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular progress */}
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--tg-theme-secondary-bg-color)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--tg-theme-button-color)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${progress}%`,
            backgroundColor: remaining <= 30 ? "var(--tg-theme-destructive-text-color)" : "var(--tg-theme-button-color)",
          }}
        />
      </div>

      <span className="text-sm" style={{ color: "var(--tg-theme-hint-color)" }}>
        زمان باقی‌مانده
      </span>
    </div>
  );
}
