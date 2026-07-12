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

// The real Select is a Radix listbox that opens a portal and recurses under
// jsdom. Swap in a native <select> honoring the same contract (accessible label,
// options, string-value onChange, placeholder) so the dialog's behavior — target
// option scoping, value selection, submit payload — stays under test without the
// portal. Every other UI primitive stays real.
vi.mock("@/shared/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/components/ui")>();
  return {
    ...actual,
    Select: ({
      label,
      options,
      value,
      onChange,
      placeholder,
    }: {
      label?: string;
      options: ReadonlyArray<{ value: string; label: string }>;
      value: string;
      onChange: (value: string) => void;
      placeholder?: string;
    }) => (
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder !== undefined ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

import {
  useReviewQueue,
  useSubmitDecision,
} from "@/features/admin-review/api/reviewApi";
import { useAdjustCapacity } from "@/features/admin-catalog/api/catalogAdminApi";
import { useUiStore } from "@/shared/stores/uiStore";
import { ReviewQueuePage } from "@/features/admin-review/pages/ReviewQueuePage";
import type {
  AdminReviewQueueItem,
  OfferingGroup,
  OfferingGroupSummary,
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

/**
 * A summary as the backend actually returns it inside `offering.groups`: the
 * offering-scoped OfferingGroupSummary shape (no offeringId/timestamps), NOT the
 * fuller OfferingGroup used for `item.group`.
 */
function groupSummary(
  overrides: Partial<OfferingGroupSummary> = {},
): OfferingGroupSummary {
  return {
    id: "g1",
    groupCode: "G1",
    shift: "DAY",
    scheduleText: "Mon/Wed 08:00",
    capacity: 30,
    acceptedCount: 10,
    status: "ACTIVE",
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
      // Real single-group payload: offering.groups carries only the request's
      // own group. The CREATE_GROUP_ACCEPTANCE selector must then offer nothing.
      groups: [groupSummary()],
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

/**
 * A multi-group offering as the backend now returns it: offering.groups is the
 * offering's FULL active group list — the request's own group (g1) plus its
 * siblings (g2, g3). The target selector filters g1 out, leaving g2 and g3.
 */
function multiGroupItem(): AdminReviewQueueItem {
  const summaries: OfferingGroupSummary[] = [
    groupSummary({ id: "g1", groupCode: "G1", shift: "DAY", scheduleText: "Mon/Wed 08:00", capacity: 30, acceptedCount: 10 }),
    groupSummary({ id: "g2", groupCode: "G2", shift: "DAY", scheduleText: "Tue/Thu 10:00", capacity: 30, acceptedCount: 5 }),
    groupSummary({ id: "g3", groupCode: "G3", shift: "NIGHT", scheduleText: "Mon/Wed 18:00", capacity: 30, acceptedCount: 8 }),
  ];
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

  it("communicates the empty state and blocks the action when the offering has no other groups", async () => {
    const user = userEvent.setup();
    // A single-group offering: offering.groups carries only the request's own
    // group, so there is no sibling to target. This is the REAL payload for a
    // single-group offering now that the backend returns the full active list.
    mockUseReviewQueue.mockReturnValue(asQuery([reviewItem()]));
    renderPage();

    await openCreateGroupDialog(user);

    // No selectable target-group control is offered when there is nothing to pick.
    expect(screen.queryByLabelText("Target group")).not.toBeInTheDocument();
    // The dialog explains why instead of leaving a dead, unexplained form.
    expect(
      screen.getByText(/no other groups in this offering/i),
    ).toBeInTheDocument();
    // Confirm stays unavailable — the action cannot proceed with no target.
    expect(
      screen.getByRole("button", { name: "Confirm decision" }),
    ).toBeDisabled();
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
