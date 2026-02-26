"use client";

import { useState, useEffect } from "react";

export default function StudentCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Base date: Feb 26, 2026
    const baseDate = new Date("2026-02-26T00:00:00Z");
    const now = new Date();
    
    // Calculate days passed since base date
    const diffTime = Math.max(0, now.getTime() - baseDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate added students deterministically so it doesn't drop on refresh
    let added = 0;
    for (let i = 0; i < diffDays; i++) {
       // Simple hash of the day to get a stable 1, 2, or 3
       const dayString = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
       let hash = 0;
       for (let j = 0; j < dayString.length; j++) {
           hash = (hash << 5) - hash + dayString.charCodeAt(j);
           hash |= 0;
       }
       const val = (Math.abs(hash) % 3) + 1; // 1, 2, or 3
       added += val;
    }
    
    setCount(800 + added);
  }, []);

  if (count === null) return <span>800</span>;

  return <span>{count}</span>;
}
