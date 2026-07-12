import { useEffect, useState } from "react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Format a remaining duration (ms) as a compact countdown, always `HH:MM:SS`
 * (a day or more prepends `Nd`). Every field is zero-padded so the string keeps
 * a constant character count — paired with `tabular-nums`, the rendered width
 * never shifts as the timer ticks. Clamps to 0.
 */
export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining));
  const days = Math.floor(total / DAY);
  const hours = Math.floor((total % DAY) / HOUR);
  const minutes = Math.floor((total % HOUR) / MINUTE);
  const seconds = Math.floor((total % MINUTE) / SECOND);

  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

/**
 * Live countdown to an ISO target. Re-renders once per second. Returns a stable
 * "0:00:00" while no target is provided so callers can render unconditionally.
 */
export function useCountdown(targetIso: string | undefined): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return;
    const id = window.setInterval(() => setNow(Date.now()), SECOND);
    return () => window.clearInterval(id);
  }, [targetIso]);

  if (!targetIso) return formatCountdown(0);
  return formatCountdown(Date.parse(targetIso) - now);
}
