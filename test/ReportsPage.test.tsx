import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so the page renders without a QueryClient/network.
vi.mock("@/features/admin-reports/api/reportsApi", () => ({
  useReports: vi.fn(),
  useCreateReport: vi.fn(),
}));

vi.mock("@/shared/api/semestersApi", () => ({
  useActiveSemester: vi.fn(),
}));

// A non-empty selectedSemesterId is required for the form and table to render.
vi.mock("@/shared/stores/uiStore", () => ({
  useUiStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedSemesterId: "sem-1",
      setSelectedSemesterId: vi.fn(),
    }),
}));

import {
  useReports,
  useCreateReport,
  type ReportExport,
} from "@/features/admin-reports/api/reportsApi";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { ReportsPage } from "@/features/admin-reports/pages/ReportsPage";
import type { Semester } from "@/shared/api/types";

const mockUseReports = vi.mocked(useReports);
const mockUseActiveSemester = vi.mocked(useActiveSemester);

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

function semester(): Semester {
  return {
    id: "sem-1",
    code: "2026-1",
    name: "2026-1",
    startsAt: "2026-01-01T00:00:00Z",
    endsAt: "2026-06-01T00:00:00Z",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function asReportsQuery(
  data: ReportExport[] | undefined,
  {
    isLoading = false,
    isError = false,
    error = undefined as unknown,
  } = {},
) {
  return { data, isLoading, isError, error, refetch: vi.fn() } as unknown as ReturnType<
    typeof useReports
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCreateReport).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateReport>);
  mockUseActiveSemester.mockReturnValue(semester());
});

describe("ReportsPage", () => {
  it("renders the heading, the request form and a recent export row", () => {
    mockUseReports.mockReturnValue(
      asReportsQuery([
        reportExport({ id: "r1", reportType: "WAITLIST", status: "COMPLETED" }),
      ]),
    );

    render(<ReportsPage />);

    expect(
      screen.getByRole("heading", { name: "Reports", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request report" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Recent exports")).toBeInTheDocument();
    // "Waitlist" appears both as a report-type <option> and as the row's type cell.
    expect(screen.getAllByText("Waitlist").length).toBeGreaterThanOrEqual(2);
    // "Completed" is the row's status badge and is unique on the page.
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows an empty state when no reports have been requested", () => {
    mockUseReports.mockReturnValue(asReportsQuery([]));

    render(<ReportsPage />);

    expect(
      screen.getByText("No reports requested yet for this semester."),
    ).toBeInTheDocument();
  });

  it("renders a structure-aware skeleton instead of the spinner while reports load", () => {
    mockUseReports.mockReturnValue(asReportsQuery(undefined, { isLoading: true }));

    const { container } = render(<ReportsPage />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });

  it("renders an inline error when the reports query fails", () => {
    mockUseReports.mockReturnValue(
      asReportsQuery(undefined, { isError: true, error: new Error("network down") }),
    );

    render(<ReportsPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("network down");
  });
});
