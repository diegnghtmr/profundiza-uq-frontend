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

// Mock the CSRF seam so we can assert it is wiped on session loss too, same
// as an explicit logout.
vi.mock("@/shared/api/client", () => ({
  setCsrfToken: vi.fn(),
}));

import { useCurrentUser } from "@/features/auth/api/authApi";
import { setCsrfToken } from "@/shared/api/client";
import { RequireAuth } from "@/app/RequireAuth";
import { useUiStore } from "@/shared/stores/uiStore";

const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockSetCsrfToken = vi.mocked(setCsrfToken);

function Wrapper({ client, children }: { client: QueryClient; children: ReactNode }) {
  return createElement(QueryClientProvider, { client }, children);
}

function buildUi(client: QueryClient) {
  return (
    <Wrapper client={client}>
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
    </Wrapper>
  );
}

function renderWithRouter(client: QueryClient) {
  return render(buildUi(client));
}

describe("RequireAuth", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset();
    mockSetCsrfToken.mockReset();
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
    expect(mockSetCsrfToken).toHaveBeenCalledWith(null);
  });

  it("runs the session-loss cleanup exactly once even if sessionLost toggles before the redirect completes", async () => {
    // Simulates the real race: qc.clear() removes the /me query, the
    // useCurrentUser observer in this same component rebuilds it on the next
    // render (briefly isLoading), and if the rebuilt fetch fails again we're
    // back to isError — sessionLost flips true -> false -> true before
    // <Navigate> finally unmounts this component.
    mockUseCurrentUser
      .mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof useCurrentUser>)
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof useCurrentUser>)
      .mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof useCurrentUser>);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const clearSpy = vi.spyOn(client, "clear");
    const resetSessionSpy = vi.spyOn(useUiStore.getState(), "resetSession");

    const { rerender } = renderWithRouter(client);
    // Force two more renders of the SAME component tree (same root type at
    // every position, so React reconciles in place and RequireAuth's
    // handledRef survives) so useCurrentUser() is invoked again, walking
    // through the queued isLoading/isError sequence above.
    rerender(buildUi(client));
    rerender(buildUi(client));

    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(resetSessionSpy).toHaveBeenCalledTimes(1);
    expect(mockSetCsrfToken).toHaveBeenCalledTimes(1);

    resetSessionSpy.mockRestore();
  });
});
