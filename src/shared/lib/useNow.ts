import { useEffect, useState } from "react";

/**
 * Live wall-clock timestamp (ms) that advances on a fixed cadence. The clock is
 * read inside an effect rather than during render, so render stays pure while
 * time-dependent UI (window open/close state, countdowns) still ticks. Defaults
 * to a one-second cadence.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
