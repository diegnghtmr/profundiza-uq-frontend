import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import type { EnrollmentRequestStatus } from "@/shared/api/types";
import { statusBadgeProps } from "./badgeStatus";

/**
 * Status pill. The fill stays monochrome (the system forbids saturated button/
 * badge fills); the only color is a small leading accent dot that borrows a
 * spectrum-gradient stop. `tone` selects the neutral surface intensity.
 */
export type BadgeTone = "neutral" | "muted" | "solid";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Optional accent dot color (a gradient stop). Omit for no dot. */
  dotColor?: string;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-ink-black/[0.04] text-ink-black/85",
  muted: "bg-transparent text-slate ring-1 ring-inset ring-ink-black/10",
  solid: "bg-ink-black text-snow",
};

export function Badge({
  tone = "neutral",
  dotColor,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body-sm font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dotColor ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}

/** Convenience component rendering the canonical badge for a request status. */
export function StatusBadge({ status }: { status: EnrollmentRequestStatus }) {
  const { label, tone, dotColor } = statusBadgeProps(status);
  return (
    <Badge tone={tone} dotColor={dotColor}>
      {label}
    </Badge>
  );
}
