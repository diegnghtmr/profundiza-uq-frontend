import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";

// Mock the auth hook — the network layer is not under test here.
vi.mock("@/features/auth/api/authApi", () => ({
  useCurrentUser: vi.fn(),
}));

import { useCurrentUser } from "@/features/auth/api/authApi";
import { RequireAuth } from "@/app/RequireAuth";
import { useUiStore } from "@/shared/stores/uiStore";

const mockUseCurrentUser = vi.mocked(useCurrentUser);

function renderWithRouter(client: QueryClient) {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

  return render(
    <Wrapper>
      <MemoryRouter initialEntries={["/app/home"]}>
        <Routes>
          <Route
            path="/app/home"
            element={
              <RequireAuth>
                <div>App content</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset();
    useUiStore.getState().resetSession();
  });

  it("renders the guarded content when a user session resolves", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { id: "u1", email: "a@uq.edu.co", fullName: "Ana", role: "STUDENT" },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCurrentUser>);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderWithRouter(client);

    expect(screen.getByText("App content")).toBeInTheDocument();
  });

  it("wipes stale query cache and uiStore draft on implicit session loss before redirecting to /login", async () => {
    mockUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useCurrentUser>);

    // Simulate leftover state from a previous user on this shared device.
    useUiStore.getState().toggleDraftGroup("prev-user-group");
    useUiStore.getState().setSelectedSemesterId("sem-prev-user");

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(["requests", "mine", "sem-prev-user"], [{ id: "r1" }]);

    renderWithRouter(client);

    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());

    expect(client.getQueryData(["requests", "mine", "sem-prev-user"])).toBeUndefined();
    expect(useUiStore.getState().draftGroupIds).toEqual([]);
    expect(useUiStore.getState().selectedSemesterId).toBe("");
  });
});
