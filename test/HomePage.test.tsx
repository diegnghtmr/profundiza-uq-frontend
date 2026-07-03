import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/features/auth/api/authApi", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/shared/api/semestersApi", () => ({
  useActiveSemester: vi.fn(),
}));

vi.mock("@/shared/api/windowsApi", () => ({
  useActiveEnrollmentWindow: vi.fn(),
}));

vi.mock("@/features/catalog/api/offeringsApi", () => ({
  useOfferings: vi.fn(),
}));

vi.mock("@/features/enrollment/api/requestsApi", () => ({
  useMyRequests: vi.fn(),
}));

import { useCurrentUser } from "@/features/auth/api/authApi";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { useActiveEnrollmentWindow } from "@/shared/api/windowsApi";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import { useMyRequests } from "@/features/enrollment/api/requestsApi";
import { useUiStore } from "@/shared/stores/uiStore";
import { HomePage } from "@/features/dashboard/pages/HomePage";
import type { CurrentUser, EnrollmentRequest } from "@/shared/api/types";

const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseActiveSemester = vi.mocked(useActiveSemester);
const mockUseActiveEnrollmentWindow = vi.mocked(useActiveEnrollmentWindow);
const mockUseOfferings = vi.mocked(useOfferings);
const mockUseMyRequests = vi.mocked(useMyRequests);

function request(overrides: Partial<EnrollmentRequest> = {}): EnrollmentRequest {
  return {
    id: "r1",
    semesterId: "sem-1",
    studentId: "s1",
    offeringId: "off-1",
    offeringGroupId: "g1",
    priorityGroup: "GENERAL",
    status: "SUBMITTED",
    arrivalSequence: 1,
    submittedAt: "2026-06-01T00:00:00Z",
    ...overrides,
  } as EnrollmentRequest;
}

function asQuery<T>(
  data: T | undefined,
  { isLoading = false, isError = false, error = undefined as unknown } = {},
) {
  return { data, isLoading, isError, error } as unknown as ReturnType<
    typeof useMyRequests
  >;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({ selectedSemesterId: "sem-1" });
  mockUseCurrentUser.mockReturnValue(
    asQuery({
      fullName: "Ada Lovelace",
    } as CurrentUser) as unknown as ReturnType<typeof useCurrentUser>,
  );
  mockUseActiveSemester.mockReturnValue(undefined);
  mockUseActiveEnrollmentWindow.mockReturnValue(undefined);
  mockUseOfferings.mockReturnValue(
    asQuery([]) as unknown as ReturnType<typeof useOfferings>,
  );
});

describe("HomePage", () => {
  it("renders recent request rows when the requests query resolves with data", () => {
    mockUseMyRequests.mockReturnValue(asQuery([request({ id: "r1" })]));

    renderPage();

    expect(screen.getByText("Your requests")).toBeInTheDocument();
  });

  it("renders a structure-aware skeleton instead of blank stats while requests load", () => {
    mockUseMyRequests.mockReturnValue(asQuery(undefined, { isLoading: true }));

    const { container } = renderPage();

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("renders an empty state when the student has no requests yet", () => {
    mockUseMyRequests.mockReturnValue(asQuery([]));

    renderPage();

    expect(screen.getByText("No requests yet")).toBeInTheDocument();
  });

  it("renders an inline error when the requests query fails", () => {
    mockUseMyRequests.mockReturnValue(
      asQuery(undefined, { isError: true, error: new Error("network down") }),
    );

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("network down");
  });
});
