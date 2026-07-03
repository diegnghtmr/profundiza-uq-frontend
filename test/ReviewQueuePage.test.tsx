import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the data layer so the page renders without a QueryClient/network.
vi.mock("@/features/admin-review/api/reviewApi", () => ({
  useReviewQueue: vi.fn(),
  useSubmitDecision: vi.fn(),
  reviewKeys: {
    all: ["review-queue"],
    list: (semesterId: string) => ["review-queue", semesterId],
  },
}));

// The group's capacity-adjust action opens CapacityDialog, which pulls in a
// real react-query mutation hook — stub it so no QueryClient is required.
vi.mock("@/features/admin-catalog/api/catalogAdminApi", () => ({
  useAdjustCapacity: vi.fn(),
}));

import {
  useReviewQueue,
  useSubmitDecision,
} from "@/features/admin-review/api/reviewApi";
import { useAdjustCapacity } from "@/features/admin-catalog/api/catalogAdminApi";
import { useUiStore } from "@/shared/stores/uiStore";
import { ReviewQueuePage } from "@/features/admin-review/pages/ReviewQueuePage";
import type {
  AdminReviewQueueItem,
  ElectiveOfferingSummary,
  OfferingGroup,
} from "@/shared/api/types";

const mockUseReviewQueue = vi.mocked(useReviewQueue);
const mutateSpy = vi.fn();

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ReviewQueuePage />
    </QueryClientProvider>,
  );
}

function group(overrides: Partial<OfferingGroup> = {}): OfferingGroup {
  return {
    id: "g1",
    offeringId: "off-1",
    groupCode: "G1",
    shift: "DAY",
    scheduleText: "Mon/Wed 08:00",
    capacity: 30,
    acceptedCount: 10,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function reviewItem(overrides: Partial<AdminReviewQueueItem> = {}): AdminReviewQueueItem {
  return {
    request: {
      id: "r1",
      semesterId: "sem-1",
      studentId: "s1",
      offeringId: "off-1",
      offeringGroupId: "g1",
      priorityGroup: "DIRECT_SAME_SHIFT",
      status: "PENDING_REVIEW",
      arrivalSequence: 1,
      submittedAt: "2026-06-01T00:00:00Z",
    } as AdminReviewQueueItem["request"],
    student: {
      id: "s1",
      institutionalEmail: "ada@uni.edu",
      documentNumber: "1000000001",
      fullName: "Ada Lovelace",
      academicShift: "DAY",
      status: "ACTIVE",
      completedProfessionalElectivesCount: 2,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    offering: {
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
      groups: [group()] as unknown as ElectiveOfferingSummary["groups"],
    },
    group: group(),
    ...overrides,
  };
}

function asQuery<T>(
  data: T | undefined,
  { isLoading = false, isError = false, error = undefined as unknown } = {},
) {
  return { data, isLoading, isError, error } as unknown as ReturnType<
    typeof useReviewQueue
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({ selectedSemesterId: "sem-1" });
  mutateSpy.mockReset();
  vi.mocked(useSubmitDecision).mockReturnValue({
    mutate: mutateSpy,
    isPending: false,
  } as unknown as ReturnType<typeof useSubmitDecision>);
  vi.mocked(useAdjustCapacity).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAdjustCapacity>);
});

describe("ReviewQueuePage", () => {
  it("renders queue rows when the query resolves with data", () => {
    mockUseReviewQueue.mockReturnValue(asQuery([reviewItem()]));

    renderPage();

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders a structure-aware skeleton instead of the spinner while the queue loads", () => {
    mockUseReviewQueue.mockReturnValue(asQuery(undefined, { isLoading: true }));

    const { container } = renderPage();

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });

  it("renders an empty state when no requests are waiting for review", () => {
    mockUseReviewQueue.mockReturnValue(asQuery([]));

    renderPage();

    expect(screen.getByText("No requests to review")).toBeInTheDocument();
  });

  it("renders an inline error when the review queue query fails", () => {
    mockUseReviewQueue.mockReturnValue(
      asQuery(undefined, { isError: true, error: new Error("network down") }),
    );

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("network down");
  });

  it("opens the row's decision menu and starts the Accept flow (FR-005 scenario 4)", async () => {
    const user = userEvent.setup();
    mockUseReviewQueue.mockReturnValue(asQuery([reviewItem()]));

    renderPage();

    await user.click(screen.getByRole("button", { name: "Decide" }));
    await user.click(await screen.findByRole("menuitem", { name: "Accept" }));

    expect(
      screen.getByRole("heading", { name: "Accept request" }),
    ).toBeInTheDocument();
  });
});

/** Offering carrying three sibling groups; g1 is the request's current group. */
function multiGroupItem(): AdminReviewQueueItem {
  const summaries = [
    { id: "g1", groupCode: "G1", shift: "DAY", scheduleText: "Mon/Wed 08:00", capacity: 30, acceptedCount: 10, status: "ACTIVE" },
    { id: "g2", groupCode: "G2", shift: "DAY", scheduleText: "Tue/Thu 10:00", capacity: 30, acceptedCount: 5, status: "ACTIVE" },
    { id: "g3", groupCode: "G3", shift: "NIGHT", scheduleText: "Mon/Wed 18:00", capacity: 30, acceptedCount: 8, status: "ACTIVE" },
  ] as unknown as ElectiveOfferingSummary["groups"];
  return reviewItem({
    offering: { ...reviewItem().offering, groups: summaries },
    group: group({ id: "g1", groupCode: "G1" }),
  });
}

async function openCreateGroupDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Decide" }));
  await user.click(
    await screen.findByRole("menuitem", { name: "Accept into another group" }),
  );
}

describe("ReviewQueuePage · CREATE_GROUP_ACCEPTANCE", () => {
  it("renders the target-group selector only for CREATE_GROUP_ACCEPTANCE", async () => {
    const user = userEvent.setup();
    mockUseReviewQueue.mockReturnValue(asQuery([multiGroupItem()]));
    renderPage();

    // Plain Accept: no target-group selector.
    await user.click(screen.getByRole("button", { name: "Decide" }));
    await user.click(await screen.findByRole("menuitem", { name: "Accept" }));
    expect(screen.queryByLabelText("Target group")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    // Accept into another group: selector is present.
    await openCreateGroupDialog(user);
    expect(screen.getByLabelText("Target group")).toBeInTheDocument();
  });

  it("keeps Confirm disabled until both a reason and a target group are set", async () => {
    const user = userEvent.setup();
    mockUseReviewQueue.mockReturnValue(asQuery([multiGroupItem()]));
    renderPage();

    await openCreateGroupDialog(user);
    const confirm = screen.getByRole("button", { name: "Confirm decision" });
    expect(confirm).toBeDisabled();

    await user.type(
      screen.getByLabelText("Reason"),
      "Moving to the day group with open seats",
    );
    expect(confirm).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Target group"), "g2");
    expect(confirm).toBeEnabled();
  });

  it("scopes target options to the offering and excludes the current group", async () => {
    const user = userEvent.setup();
    mockUseReviewQueue.mockReturnValue(asQuery([multiGroupItem()]));
    renderPage();

    await openCreateGroupDialog(user);
    const select = screen.getByLabelText("Target group") as HTMLSelectElement;
    const values = [...select.options]
      .map((o) => o.value)
      .filter((v) => v !== "");

    expect(values).toEqual(["g2", "g3"]);
  });

  it("submits CREATE_GROUP_ACCEPTANCE with the chosen targetGroupId", async () => {
    const user = userEvent.setup();
    mockUseReviewQueue.mockReturnValue(asQuery([multiGroupItem()]));
    renderPage();

    await openCreateGroupDialog(user);
    await user.type(screen.getByLabelText("Reason"), "Seat opened in G2");
    await user.selectOptions(screen.getByLabelText("Target group"), "g2");
    await user.click(screen.getByRole("button", { name: "Confirm decision" }));

    expect(mutateSpy).toHaveBeenCalledTimes(1);
    expect(mutateSpy.mock.calls[0][0]).toMatchObject({
      requestId: "r1",
      decisionType: "CREATE_GROUP_ACCEPTANCE",
      reason: "Seat opened in G2",
      targetGroupId: "g2",
    });
  });

  it("does not include targetGroupId when submitting a plain ACCEPT", async () => {
    const user = userEvent.setup();
    mockUseReviewQueue.mockReturnValue(asQuery([multiGroupItem()]));
    renderPage();

    await user.click(screen.getByRole("button", { name: "Decide" }));
    await user.click(await screen.findByRole("menuitem", { name: "Accept" }));
    await user.type(screen.getByLabelText("Reason"), "Capacity available");
    await user.click(screen.getByRole("button", { name: "Confirm decision" }));

    expect(mutateSpy).toHaveBeenCalledTimes(1);
    expect(mutateSpy.mock.calls[0][0]).not.toHaveProperty("targetGroupId");
  });
});
