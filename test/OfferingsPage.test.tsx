import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so the page renders without a QueryClient/network.
// `deriveAreas` is a pure helper the page also imports from this module, so
// keep the real implementation and only stub the query hooks.
vi.mock("@/features/catalog/api/offeringsApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/catalog/api/offeringsApi")>();
  return {
    ...actual,
    useOfferings: vi.fn(),
    useOfferingPrerequisites: vi.fn(),
  };
});

vi.mock("@/features/enrollment/api/requestsApi", () => ({
  useMyRequests: vi.fn(),
  useSubmitEnrollmentBatch: vi.fn(),
}));

import {
  useOfferings,
  useOfferingPrerequisites,
} from "@/features/catalog/api/offeringsApi";
import {
  useMyRequests,
  useSubmitEnrollmentBatch,
} from "@/features/enrollment/api/requestsApi";
import { useUiStore } from "@/shared/stores/uiStore";
import { OfferingsPage } from "@/features/catalog/pages/OfferingsPage";
import type { ElectiveOfferingSummary } from "@/shared/api/types";

const mockUseOfferings = vi.mocked(useOfferings);
const mockUseOfferingPrerequisites = vi.mocked(useOfferingPrerequisites);
const mockUseMyRequests = vi.mocked(useMyRequests);
const mockUseSubmitEnrollmentBatch = vi.mocked(useSubmitEnrollmentBatch);

function offering(overrides: Partial<ElectiveOfferingSummary> = {}): ElectiveOfferingSummary {
  return {
    id: "off-1",
    semesterId: "sem-1",
    elective: {
      id: "e1",
      name: "Machine Learning",
      area: "Software",
      description: "Intro to ML.",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    groups: [
      {
        id: "g1",
        offeringId: "off-1",
        groupCode: "G1",
        shift: "DAY",
        capacity: 30,
        acceptedCount: 10,
        scheduleText: "Mon/Wed 08:00",
        status: "ACTIVE",
      } as ElectiveOfferingSummary["groups"][number],
    ],
    ...overrides,
  };
}

function asQuery<T>(
  data: T | undefined,
  { isLoading = false, isError = false, error = undefined as unknown } = {},
) {
  return { data, isLoading, isError, error } as unknown as ReturnType<
    typeof useOfferings
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({ selectedSemesterId: "sem-1", draftGroupIds: [] });
  mockUseMyRequests.mockReturnValue(
    asQuery([]) as unknown as ReturnType<typeof useMyRequests>,
  );
  mockUseOfferingPrerequisites.mockReturnValue(
    asQuery([]) as unknown as ReturnType<typeof useOfferingPrerequisites>,
  );
  mockUseSubmitEnrollmentBatch.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useSubmitEnrollmentBatch>);
});

describe("OfferingsPage", () => {
  it("renders offering cards when the query resolves with data", () => {
    mockUseOfferings.mockReturnValue(asQuery([offering()]));

    render(<OfferingsPage />);

    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
  });

  it("renders a structure-aware skeleton instead of the spinner while offerings load", () => {
    mockUseOfferings.mockReturnValue(asQuery(undefined, { isLoading: true }));

    const { container } = render(<OfferingsPage />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
    expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();
  });

  it("renders an empty state when the semester has no offerings yet", () => {
    mockUseOfferings.mockReturnValue(asQuery([]));

    render(<OfferingsPage />);

    expect(screen.getByText("No offerings published yet")).toBeInTheDocument();
  });

  it("renders an inline error when the offerings query fails", () => {
    mockUseOfferings.mockReturnValue(
      asQuery(undefined, { isError: true, error: new Error("network down") }),
    );

    render(<OfferingsPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("network down");
  });
});
