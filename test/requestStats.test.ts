import { describe, it, expect } from "vitest";
import {
  computeRequestStats,
  MAX_ACTIVE_REQUESTS,
} from "@/shared/lib/requestStats";
import type {
  EnrollmentRequest,
  EnrollmentRequestStatus,
} from "@/shared/api/types";

/** Minimal EnrollmentRequest factory — only `status` matters to the stats. */
function request(status: EnrollmentRequestStatus): EnrollmentRequest {
  return {
    id: `r-${status}-${Math.random()}`,
    semesterId: "sem-1",
    studentId: "stu-1",
    offeringId: "off-1",
    offeringGroupId: "grp-1",
    priorityGroup: "DIRECT_SAME_SHIFT",
    status,
    arrivalSequence: 1,
    submittedAt: "2026-06-27T10:00:00Z",
  };
}

describe("computeRequestStats", () => {
  it("returns zeros for empty or undefined input", () => {
    expect(computeRequestStats([])).toEqual({
      active: 0,
      accepted: 0,
      waitlist: 0,
    });
    expect(computeRequestStats(undefined)).toEqual({
      active: 0,
      accepted: 0,
      waitlist: 0,
    });
  });

  it("counts active, accepted and waitlist across statuses", () => {
    const requests = [
      request("SUBMITTED"),
      request("PENDING_REVIEW"),
      request("WAITLIST_SAME_SHIFT"),
      request("WAITLIST_OPPOSITE_SHIFT"),
      request("ACCEPTED"),
    ];

    expect(computeRequestStats(requests)).toEqual({
      active: 5,
      accepted: 1,
      waitlist: 2,
    });
  });

  it("excludes cancelled and rejected requests from the active slot count", () => {
    const requests = [
      request("ACCEPTED"),
      request("REJECTED"),
      request("CANCELLED_BY_STUDENT"),
      request("CANCELLED_BY_ADMIN"),
    ];

    const stats = computeRequestStats(requests);
    expect(stats.active).toBe(1);
    expect(stats.accepted).toBe(1);
    expect(stats.waitlist).toBe(0);
  });

  it("never reports more active requests than the slot maximum in normal use", () => {
    const requests = Array.from({ length: MAX_ACTIVE_REQUESTS }, () =>
      request("PENDING_REVIEW"),
    );
    expect(computeRequestStats(requests).active).toBe(MAX_ACTIVE_REQUESTS);
  });
});
