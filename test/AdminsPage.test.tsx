import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so the page renders without a QueryClient/network.
// AdminsPage and its form dialog consume every hook in this module.
vi.mock("@/features/admin-users/api/adminUsersApi", () => ({
  useAdmins: vi.fn(),
  useCreateAdmin: vi.fn(),
  useUpdateAdmin: vi.fn(),
}));

import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  type AdminUser,
} from "@/features/admin-users/api/adminUsersApi";
import { AdminsPage } from "@/features/admin-users/pages/AdminsPage";

const mockUseAdmins = vi.mocked(useAdmins);

function admin(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "a1",
    institutionalEmail: "grace@uni.edu",
    fullName: "Grace Hopper",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function asAdminsQuery(data: AdminUser[] | undefined, isLoading = false) {
  return { data, isLoading, isError: false } as unknown as ReturnType<
    typeof useAdmins
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCreateAdmin).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateAdmin>);
  vi.mocked(useUpdateAdmin).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateAdmin>);
});

describe("AdminsPage", () => {
  it("renders the heading, administrator rows and the add action", () => {
    mockUseAdmins.mockReturnValue(
      asAdminsQuery([
        admin({ id: "a1", fullName: "Grace Hopper", role: "ADMIN" }),
        admin({
          id: "a2",
          fullName: "Margaret Hamilton",
          institutionalEmail: "margaret@uni.edu",
          role: "SUPER_ADMIN",
        }),
      ]),
    );

    render(<AdminsPage />);

    expect(
      screen.getByRole("heading", { name: "Administrators", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("Margaret Hamilton")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add administrator" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no administrators match the filters", () => {
    mockUseAdmins.mockReturnValue(asAdminsQuery([]));

    render(<AdminsPage />);

    expect(
      screen.getByText("No administrators match the current filters."),
    ).toBeInTheDocument();
  });
});
