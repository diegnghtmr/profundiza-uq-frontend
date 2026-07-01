import type {
  EnrollmentRequest,
  EnrollmentRequestStatus,
} from "@/shared/api/types";

/** Maximum active enrollment requests a student may hold per semester. */
export const MAX_ACTIVE_REQUESTS = 4;

/**
 * Statuses that still occupy one of the student's four request slots. Mirrors
 * the prototype's `activeReqGroupIds` set: anything not cancelled or rejected.
 */
export const ACTIVE_REQUEST_STATUSES: ReadonlySet<EnrollmentRequestStatus> =
  new Set([
    "SUBMITTED",
    "PENDING_REVIEW",
    "WAITLIST_SAME_SHIFT",
    "WAITLIST_OPPOSITE_SHIFT",
    "ACCEPTED",
  ]);

const WAITLIST_STATUSES: ReadonlySet<EnrollmentRequestStatus> = new Set([
  "WAITLIST_SAME_SHIFT",
  "WAITLIST_OPPOSITE_SHIFT",
]);

export interface RequestStats {
  /** Requests still holding a slot (active set), capped conceptually at 4. */
  active: number;
  /** Accepted requests. */
  accepted: number;
  /** Requests on either waitlist (same or opposite shift). */
  waitlist: number;
}

/** Derive the home dashboard / sidebar counts from a student's requests. */
export function computeRequestStats(
  requests: readonly EnrollmentRequest[] | undefined,
): RequestStats {
  let active = 0;
  let accepted = 0;
  let waitlist = 0;

  for (const request of requests ?? []) {
    if (ACTIVE_REQUEST_STATUSES.has(request.status)) active += 1;
    if (request.status === "ACCEPTED") accepted += 1;
    if (WAITLIST_STATUSES.has(request.status)) waitlist += 1;
  }

  return { active, accepted, waitlist };
}
