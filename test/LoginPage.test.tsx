import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";

// Mock the network seam only; keep authKeys (the real query key) so the test
// can assert against the exact cache entry the app reads on route guards.
vi.mock("@/features/auth/api/authApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/api/authApi")>();
  return { ...actual, startLogin: vi.fn(), verifyLogin: vi.fn() };
});

import { authKeys, startLogin, verifyLogin } from "@/features/auth/api/authApi";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { useUiStore } from "@/shared/stores/uiStore";
import type { CurrentUser } from "@/shared/api/types";

const mockStartLogin = vi.mocked(startLogin);
const mockVerifyLogin = vi.mocked(verifyLogin);

function renderLoginPage(client: QueryClient) {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

  return render(
    <Wrapper>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/home" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

const nextUser: CurrentUser = {
  id: "u-next",
  email: "next@uq.edu.co",
  fullName: "Next User",
  role: "STUDENT",
};

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.getState().resetSession();
});

describe("LoginPage enter()", () => {
  it("clears stale query cache and uiStore draft from a previous session before seeding the new identity", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // Leftover state from a previous user who never explicitly logged out
    // (e.g. cookie expired, or someone else re-logs in on the same device).
    client.setQueryData(["requests", "mine", "sem-prev"], [{ id: "stale" }]);
    useUiStore.getState().toggleDraftGroup("prev-user-group");
    useUiStore.getState().setSelectedSemesterId("sem-prev-user");

    mockStartLogin.mockResolvedValueOnce({
      delivery: "email",
      expiresInSeconds: 300,
    });
    mockVerifyLogin.mockResolvedValueOnce({
      user: nextUser,
      csrfToken: "csrf-token",
    });

    renderLoginPage(client);

    await user.type(
      screen.getByLabelText("Institutional email"),
      "next@uq.edu.co",
    );
    await user.click(screen.getByRole("button", { name: "Send code" }));

    await waitFor(() => expect(mockStartLogin).toHaveBeenCalledWith("next@uq.edu.co"));

    await user.type(screen.getByLabelText(/One-time code sent to/), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(screen.getByText("Home page")).toBeInTheDocument());

    expect(client.getQueryData(["requests", "mine", "sem-prev"])).toBeUndefined();
    expect(client.getQueryData(authKeys.me)).toEqual(nextUser);
    expect(useUiStore.getState().draftGroupIds).toEqual([]);
    expect(useUiStore.getState().selectedSemesterId).toBe("");
  });
});
