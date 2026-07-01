import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the data layer so the page renders without a QueryClient/network.
// CatalogPage and its child dialogs consume every hook in this module.
vi.mock("@/features/admin-catalog/api/catalogAdminApi", () => ({
  useElectives: vi.fn(),
  useCreateElective: vi.fn(),
  useElectivePrerequisites: vi.fn(),
  useCreatePrerequisite: vi.fn(),
  useAdjustCapacity: vi.fn(),
}));

vi.mock("@/features/catalog/api/offeringsApi", () => ({
  useOfferings: vi.fn(),
}));

vi.mock("@/shared/api/semestersApi", () => ({
  useActiveSemester: vi.fn(),
}));

// useUiStore is a zustand selector hook; return a slice with a real semester id
// so the page renders its content rather than the "no active semester" state.
vi.mock("@/shared/stores/uiStore", () => ({
  useUiStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedSemesterId: "sem-1",
      setSelectedSemesterId: vi.fn(),
    }),
}));

import {
  useElectives,
  useCreateElective,
  useElectivePrerequisites,
  useCreatePrerequisite,
  useAdjustCapacity,
} from "@/features/admin-catalog/api/catalogAdminApi";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { CatalogPage } from "@/features/admin-catalog/pages/CatalogPage";
import type { Elective, Semester } from "@/shared/api/types";

const mockUseElectives = vi.mocked(useElectives);
const mockUseOfferings = vi.mocked(useOfferings);
const mockUseActiveSemester = vi.mocked(useActiveSemester);

function elective(overrides: Partial<Elective>): Elective {
  return {
    id: "e1",
    name: "Machine Learning",
    area: "Software",
    description: "Intro to ML.",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
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

function asQuery<T>(data: T | undefined, isLoading = false) {
  return { data, isLoading, isError: false } as unknown as ReturnType<
    typeof useElectives
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Child dialog hooks must return stable objects even while the dialogs are closed.
  vi.mocked(useCreateElective).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateElective>);
  vi.mocked(useElectivePrerequisites).mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useElectivePrerequisites>);
  vi.mocked(useCreatePrerequisite).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreatePrerequisite>);
  vi.mocked(useAdjustCapacity).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAdjustCapacity>);
  mockUseOfferings.mockReturnValue(
    asQuery([]) as unknown as ReturnType<typeof useOfferings>,
  );
  mockUseActiveSemester.mockReturnValue(semester());
});

describe("CatalogPage", () => {
  it("renders the heading, an elective name and the create action", () => {
    mockUseElectives.mockReturnValue(
      asQuery([
        elective({ id: "e1", name: "Machine Learning", area: "Software" }),
        elective({ id: "e2", name: "Cybersecurity", area: "Security" }),
      ]),
    );

    render(<CatalogPage />);

    expect(
      screen.getByRole("heading", { name: "Catalog", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
    expect(screen.getByText("Cybersecurity")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create elective" }),
    ).toBeInTheDocument();
  });

  it("filters the elective list as the user types in the search box", async () => {
    const user = userEvent.setup();
    mockUseElectives.mockReturnValue(
      asQuery([
        elective({ id: "e1", name: "Machine Learning", area: "Software" }),
        elective({ id: "e2", name: "Cybersecurity", area: "Security" }),
      ]),
    );

    render(<CatalogPage />);

    await user.type(
      screen.getByLabelText("Search electives or areas"),
      "machine",
    );

    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
    expect(screen.queryByText("Cybersecurity")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no electives", () => {
    mockUseElectives.mockReturnValue(asQuery([]));

    render(<CatalogPage />);

    expect(
      screen.getByText("No electives yet. Create the first one to get started."),
    ).toBeInTheDocument();
  });
});
