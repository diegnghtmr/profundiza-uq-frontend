import { cn } from "@/shared/lib/cn";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Minimal monochrome loading indicator. */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-ink-black/15 border-t-ink-black/70",
        className,
      )}
    />
  );
}
