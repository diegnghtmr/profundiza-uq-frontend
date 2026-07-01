import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { statusBadgeProps, StatusBadge } from "@/shared/components/ui/Badge";
import type { EnrollmentRequestStatus } from "@/shared/api/types";

describe("status badge mapping", () => {
  it("maps every request status to a label and tone", () => {
    const statuses: EnrollmentRequestStatus[] = [
      "SUBMITTED",
      "PENDING_REVIEW",
      "WAITLIST_SAME_SHIFT",
      "WAITLIST_OPPOSITE_SHIFT",
      "ACCEPTED",
      "REJECTED",
      "CANCELLED_BY_STUDENT",
      "CANCELLED_BY_ADMIN",
    ];
    for (const status of statuses) {
      const props = statusBadgeProps(status);
      expect(props.label.length).toBeGreaterThan(0);
      expect(["neutral", "muted", "solid"]).toContain(props.tone);
    }
  });

  it("renders ACCEPTED as the solid (ink) tone without an accent dot", () => {
    const props = statusBadgeProps("ACCEPTED");
    expect(props.tone).toBe("solid");
    expect(props.dotColor).toBeUndefined();
  });

  it("renders the human label for a pending request", () => {
    render(<StatusBadge status="PENDING_REVIEW" />);
    expect(screen.getByText("Pending review")).toBeInTheDocument();
  });
});
