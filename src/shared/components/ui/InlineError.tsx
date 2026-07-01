import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

export type InlineErrorTone = "error" | "warning" | "info";

export interface InlineErrorProps {
  message: string;
  tone?: InlineErrorTone;
  onRetry?: () => void;
  className?: string;
}

/**
 * Accent limited to a small dot (CC-VISUAL — never a saturated fill). Kept in
 * sync with SonnerToaster's tone accents.
 */
const ACCENT: Record<InlineErrorTone, string> = {
  error: "bg-spectrum-gradient",
  warning: "bg-marigold",
  info: "bg-slate",
};

/**
 * Inline error/warning/info banner (FR-004). `role="alert"` only for the
 * error tone (assertive, unsolicited announcement); non-error tones stay
 * silent for assistive tech since they are not urgent. The accent dot pairs
 * with the message text — no color-only meaning (CC-A11Y).
 */
export function InlineError({
  message,
  tone = "error",
  onRetry,
  className,
}: InlineErrorProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-pebble bg-snow px-4 py-3",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", ACCENT[tone])}
      />
      <p className="flex-1 text-body-sm text-ink-black">{message}</p>
      {onRetry ? (
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
