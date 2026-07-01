import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportCharts } from "@/features/admin-reports/components/ReportCharts";
import type { ReportExport } from "@/features/admin-reports/api/reportsApi";

function reportExport(overrides: Partial<ReportExport>): ReportExport {
  return {
    id: "r1",
    semesterId: "sem-1",
    requestedByAdminUserId: "a1",
    reportType: "GENERAL_SEMESTER",
    format: "XLSX",
    status: "COMPLETED",
    filters: null,
    filePath: null,
    downloadUrl: "/api/v1/reports/r1/download",
    failureReason: null,
    requestedAt: "2026-06-27T08:00:00Z",
    startedAt: null,
    completedAt: "2026-06-27T08:05:00Z",
    ...overrides,
  };
}

describe("ReportCharts", () => {
  it("renders an empty-state fallback when there is no report data (FR-007 scenario 1)", () => {
    render(<ReportCharts reports={[]} />);

    expect(
      screen.getByText("No export data to chart yet"),
    ).toBeInTheDocument();
    // No chart section (and no broken/blank chart) is attempted.
    expect(screen.queryByText("Exports by status")).not.toBeInTheDocument();
    expect(document.querySelector(".recharts-wrapper")).toBeNull();
  });

  it("exposes an accessible textual summary of the status counts outside the chart (FR-007 scenario 2)", () => {
    render(
      <ReportCharts
        reports={[
          reportExport({ id: "r1", status: "COMPLETED" }),
          reportExport({ id: "r2", status: "COMPLETED" }),
          reportExport({ id: "r3", status: "FAILED", failureReason: "boom" }),
        ]}
      />,
    );

    expect(screen.getByText("Exports by status")).toBeInTheDocument();

    const completedLabel = screen.getByText("Completed");
    const completedCount = screen.getByText("2");
    const failedLabel = screen.getByText("Failed");
    const failedCount = screen.getByText("1");

    // The summary must be reachable outside the (decorative, aria-hidden) chart
    // region so assistive tech and no-JS/no-SVG contexts still get the figures.
    expect(completedLabel.closest('[aria-hidden="true"]')).toBeNull();
    expect(completedCount.closest('[aria-hidden="true"]')).toBeNull();
    expect(failedLabel.closest('[aria-hidden="true"]')).toBeNull();
    expect(failedCount.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("wires the monochrome CSS override hook so Recharts' var()-in-SVG-attribute colors resolve", () => {
    const { container } = render(
      <ReportCharts
        reports={[reportExport({ id: "r1", status: "COMPLETED" })]}
      />,
    );

    // jsdom can't compute the SVG cascade, so we assert the mitigation is wired:
    // the chart container carries `.report-chart`, which global.css targets to
    // re-apply the monochrome tokens as author declarations (see ReportCharts).
    const chart = container.querySelector(".report-chart");
    expect(chart).not.toBeNull();
    expect(chart).toHaveAttribute("aria-hidden", "true");
  });
});
