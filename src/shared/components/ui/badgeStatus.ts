import type {
  EnrollmentRequestStatus,
  PriorityGroup,
} from "@/shared/api/types";
import type { BadgeTone } from "./Badge";

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

const PRIORITY_LABELS: Record<PriorityGroup, string> = {
  DIRECT_SAME_SHIFT: "Direct · same shift",
  WAITLIST_SAME_SHIFT: "Waitlist · same shift",
  WAITLIST_OPPOSITE_SHIFT: "Waitlist · opposite shift",
};

export function priorityLabel(group: PriorityGroup): string {
  return PRIORITY_LABELS[group];
}
