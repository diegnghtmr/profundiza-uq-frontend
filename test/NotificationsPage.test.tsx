import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the data layer so the page renders without a QueryClient/network.
vi.mock("@/shared/api/notificationsApi", () => ({
  useNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
}));

import {
  useNotifications,
  useMarkNotificationRead,
} from "@/shared/api/notificationsApi";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import type { Notification, NotificationsPage as Page } from "@/shared/api/types";

const mockUseNotifications = vi.mocked(useNotifications);
const mockUseMarkRead = vi.mocked(useMarkNotificationRead);

const mutate = vi.fn();

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: "n1",
    type: "REQUEST_ACCEPTED",
    title: "You were accepted",
    body: "Your request was accepted by the program office.",
    readAt: null,
    createdAt: "2026-06-27T08:00:00Z",
    ...overrides,
  };
}

function asQuery(page: Page | undefined, isLoading = false) {
  return { data: page, isLoading } as unknown as ReturnType<
    typeof useNotifications
  >;
}

beforeEach(() => {
  mutate.mockReset();
  mockUseMarkRead.mockReturnValue({ mutate } as unknown as ReturnType<
    typeof useMarkNotificationRead
  >);
});

describe("NotificationsPage", () => {
  it("renders the heading, notification rows and the mark-all-read action", () => {
    mockUseNotifications.mockReturnValue(
      asQuery({
        items: [
          notification({ id: "n1", title: "Accepted into ML", readAt: null }),
          notification({
            id: "n2",
            title: "Window now open",
            readAt: "2026-06-27T09:00:00Z",
          }),
        ],
        page: 1,
        pageSize: 20,
        total: 2,
        unread: 1,
      }),
    );

    render(<NotificationsPage />);

    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accepted into ML")).toBeInTheDocument();
    expect(screen.getByText("Window now open")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark all read" }),
    ).toBeInTheDocument();
  });

  it("marks an unread notification read on click but ignores already-read ones", async () => {
    const user = userEvent.setup();
    mockUseNotifications.mockReturnValue(
      asQuery({
        items: [
          notification({ id: "n1", title: "Unread one", readAt: null }),
          notification({
            id: "n2",
            title: "Read one",
            readAt: "2026-06-27T09:00:00Z",
          }),
        ],
        page: 1,
        pageSize: 20,
        total: 2,
        unread: 1,
      }),
    );

    render(<NotificationsPage />);

    await user.click(screen.getByText("Read one"));
    expect(mutate).not.toHaveBeenCalled();

    await user.click(screen.getByText("Unread one"));
    expect(mutate).toHaveBeenCalledWith("n1");
  });

  it("shows an empty state when there are no notifications", () => {
    mockUseNotifications.mockReturnValue(
      asQuery({ items: [], page: 1, pageSize: 20, total: 0, unread: 0 }),
    );

    render(<NotificationsPage />);

    expect(
      screen.getByText("You have no notifications yet."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark all read" }),
    ).not.toBeInTheDocument();
  });
});
