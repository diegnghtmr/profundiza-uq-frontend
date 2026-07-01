import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/features/enrollment/api/requestsApi", () => ({
  useMyRequests: vi.fn(),
  useCancelRequest: vi.fn(),
}));

vi.mock("@/features/catalog/api/offeringsApi", () => ({
  useOfferings: vi.fn(),
}));

import {
  useMyRequests,
  useCancelRequest,
} from "@/features/enrollment/api/requestsApi";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import { useUiStore } from "@/shared/stores/uiStore";
import { RequestsPage } from "@/features/enrollment/pages/RequestsPage";
import type { EnrollmentRequest } from "@/shared/api/types";

const mockUseMyRequests = vi.mocked(useMyRequests);
const mockUseCancelRequest = vi.mocked(useCancelRequest);
const mockUseOfferings = vi.mocked(useOfferings);

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
      <RequestsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({ selectedSemesterId: "sem-1" });
  mockUseOfferings.mockReturnValue(
    asQuery([]) as unknown as ReturnType<typeof useOfferings>,
  );
  mockUseCancelRequest.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCancelRequest>);
});

describe("RequestsPage", () => {
  it("renders each request card when the query resolves with data", () => {
    mockUseMyRequests.mockReturnValue(asQuery([request({ id: "r1" })]));

    renderPage();

    expect(screen.getByText("Arrival position #1")).toBeInTheDocument();
  });

  it("renders a structure-aware skeleton instead of the spinner while requests load", () => {
    mockUseMyRequests.mockReturnValue(asQuery(undefined, { isLoading: true }));

    const { container } = renderPage();

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });

  it("renders an actionable empty state when the student has no requests", () => {
    mockUseMyRequests.mockReturnValue(asQuery([]));

    renderPage();

    expect(screen.getByText("No requests yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse offerings" }),
    ).toHaveAttribute("href", "/app/offerings");
  });

  it("renders an inline error when the requests query fails", () => {
    mockUseMyRequests.mockReturnValue(
      asQuery(undefined, { isError: true, error: new Error("network down") }),
    );

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("network down");
  });
});
