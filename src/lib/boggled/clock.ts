let offset = 0;

export function serverNow(): number {
  return Date.now() + offset;
}

// NTP-style: keep the sample with the smallest round trip.
export async function syncClock(samples = 5): Promise<void> {
  let best: { rtt: number; offset: number } | null = null;
  for (let i = 0; i < samples; i++) {
    try {
      const t0 = Date.now();
      const res = await fetch("/api/boggled/time", { cache: "no-store" });
      const { now } = (await res.json()) as { now: number };
      const t1 = Date.now();
      const rtt = t1 - t0;
      if (!best || rtt < best.rtt) best = { rtt, offset: now + rtt / 2 - t1 };
    } catch {
      // Offline or blocked: fall back to the device clock.
    }
  }
  if (best) offset = best.offset;
}
