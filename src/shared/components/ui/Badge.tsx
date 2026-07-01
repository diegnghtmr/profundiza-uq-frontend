import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import type {
  EnrollmentRequestStatus,
  PriorityGroup,
} from "@/shared/api/types";

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

// --- Status mapping -------------------------------------------------------

const SPECTRUM = {
  blue: "#0358f7",
  amber: "#ffb005",
  rose: "#c679c4",
  red: "#fa3d1d",
  slate: "#959595",
} as const;

interface StatusVisual {
  label: string;
  tone: BadgeTone;
  dotColor?: string;
}

const REQUEST_STATUS_VISUALS: Record<EnrollmentRequestStatus, StatusVisual> = {
  SUBMITTED: { label: "Submitted", tone: "neutral", dotColor: SPECTRUM.slate },
  PENDING_REVIEW: { label: "Pending review", tone: "neutral", dotColor: SPECTRUM.amber },
  WAITLIST_SAME_SHIFT: {
    label: "Waitlist · same shift",
    tone: "neutral",
    dotColor: SPECTRUM.blue,
  },
  WAITLIST_OPPOSITE_SHIFT: {
    label: "Waitlist · opposite shift",
    tone: "neutral",
    dotColor: SPECTRUM.rose,
  },
  ACCEPTED: { label: "Accepted", tone: "solid" },
  REJECTED: { label: "Rejected", tone: "muted", dotColor: SPECTRUM.red },
  CANCELLED_BY_STUDENT: { label: "Cancelled", tone: "muted" },
  CANCELLED_BY_ADMIN: { label: "Cancelled by admin", tone: "muted", dotColor: SPECTRUM.red },
};

export function statusBadgeProps(status: EnrollmentRequestStatus): {
  label: string;
  tone: BadgeTone;
  dotColor?: string;
} {
  return REQUEST_STATUS_VISUALS[status];
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

const PRIORITY_LABELS: Record<PriorityGroup, string> = {
  DIRECT_SAME_SHIFT: "Direct · same shift",
  WAITLIST_SAME_SHIFT: "Waitlist · same shift",
  WAITLIST_OPPOSITE_SHIFT: "Waitlist · opposite shift",
};

export function priorityLabel(group: PriorityGroup): string {
  return PRIORITY_LABELS[group];
}
