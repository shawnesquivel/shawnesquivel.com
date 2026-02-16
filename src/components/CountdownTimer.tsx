"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "discount_start";
const DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft | null {
  if (typeof window === "undefined") return null;

  let start = localStorage.getItem(STORAGE_KEY);
  if (!start) {
    start = String(Date.now());
    localStorage.setItem(STORAGE_KEY, start);
  }

  const elapsed = Date.now() - Number(start);
  const remaining = DURATION_MS - elapsed;

  if (remaining <= 0) return null;

  return {
    hours: Math.floor(remaining / (1000 * 60 * 60)),
    minutes: Math.floor((remaining / (1000 * 60)) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render anything until mounted (avoid hydration mismatch)
  if (!mounted) return null;

  if (!timeLeft) {
    return (
      <p className="text-sm font-black uppercase text-accent">
        Discount expired
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-black">
        <span className="inline-block bg-foreground px-1.5 py-0.5 text-surface tabular-nums">
          {pad(timeLeft.hours)}
        </span>
        :
        <span className="inline-block bg-foreground px-1.5 py-0.5 text-surface tabular-nums">
          {pad(timeLeft.minutes)}
        </span>
        :
        <span className="inline-block bg-foreground px-1.5 py-0.5 text-surface tabular-nums">
          {pad(timeLeft.seconds)}
        </span>
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {[
        { value: timeLeft.hours, label: "HRS" },
        { value: timeLeft.minutes, label: "MIN" },
        { value: timeLeft.seconds, label: "SEC" },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="neo-shadow-sm bg-foreground px-3 py-2 text-2xl font-black text-surface tabular-nums sm:text-3xl">
            {pad(value)}
          </span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-widest">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
