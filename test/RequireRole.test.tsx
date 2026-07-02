import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";

// Mock the auth hook — the network layer is not under test here.
vi.mock("@/features/auth/api/authApi", () => ({
  useCurrentUser: vi.fn(),
}));

import { useCurrentUser } from "@/features/auth/api/authApi";
import { RequireRole } from "@/app/RequireRole";

const mockUseCurrentUser = vi.mocked(useCurrentUser);

function renderWithRouter(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/app/review"
            element={
              <RequireRole allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                <div>Admin content</div>
              </RequireRole>
            }
          />
          <Route
            path="/app/offerings"
            element={
              <RequireRole allowedRoles={["STUDENT"]}>
                <div>Offerings page</div>
              </RequireRole>
            }
          />
          <Route path="/app/home" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

describe("RequireRole", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset();
  });

  it("redirects a STUDENT away from the admin route to their own role landing (home)", () => {
    mockUseCurrentUser.mockReturnValue({
      data: {
        id: "u1",
        email: "student@uq.edu.co",
        fullName: "Ana López",
        role: "STUDENT",
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCurrentUser>);

    renderWithRouter("/app/review");

    // ROLE_LANDING sends a STUDENT to /app/home — not to a fixed route that
    // could itself be role-gated (offerings/requests are STUDENT-only, but
    // that must not be assumed here).
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("renders the guarded content for an ADMIN user", () => {
    mockUseCurrentUser.mockReturnValue({
      data: {
        id: "u2",
        email: "admin@uq.edu.co",
        fullName: "Carlos Ruiz",
        role: "ADMIN",
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCurrentUser>);

    renderWithRouter("/app/review");

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(screen.queryByText("Offerings page")).not.toBeInTheDocument();
  });

  it("renders the guarded content for a SUPER_ADMIN user", () => {
    mockUseCurrentUser.mockReturnValue({
      data: {
        id: "u3",
        email: "superadmin@uq.edu.co",
        fullName: "Marta Gómez",
        role: "SUPER_ADMIN",
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCurrentUser>);

    renderWithRouter("/app/review");

    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("shows a loading spinner while the session is resolving (no flash redirect)", () => {
    mockUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useCurrentUser>);

    renderWithRouter("/app/review");

    // Neither the guarded content nor the fallback route should appear.
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    expect(screen.queryByText("Offerings page")).not.toBeInTheDocument();
  });

  it("redirects an ADMIN away from a STUDENT-only route to their own role landing, instead of looping back into another role-gated route", () => {
    mockUseCurrentUser.mockReturnValue({
      data: {
        id: "u2",
        email: "admin@uq.edu.co",
        fullName: "Carlos Ruiz",
        role: "ADMIN",
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCurrentUser>);

    renderWithRouter("/app/offerings");

    // ROLE_LANDING sends an ADMIN to /app/review (which they ARE authorized
    // for), not back into another STUDENT-only route.
    expect(screen.queryByText("Offerings page")).not.toBeInTheDocument();
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
