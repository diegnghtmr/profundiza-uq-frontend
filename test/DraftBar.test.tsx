import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/enrollment/api/requestsApi", () => ({
  useSubmitEnrollmentBatch: vi.fn(),
}));

// FR-002 scenario 3: the inline `mutate` `onSuccess` callback must route
// through the `notify` facade, not the legacy `toast` store or sonner directly.
vi.mock("@/shared/lib/notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { useSubmitEnrollmentBatch } from "@/features/enrollment/api/requestsApi";
import { notify } from "@/shared/lib/notify";
import { useUiStore } from "@/shared/stores/uiStore";
import { DraftBar } from "@/features/catalog/components/DraftBar";
import type { EnrollmentRequestBatchResult } from "@/shared/api/types";

const mockUseSubmitEnrollmentBatch = vi.mocked(useSubmitEnrollmentBatch);
const mockNotify = vi.mocked(notify);

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({
    draftGroupIds: ["g1", "g2"],
    selectedSemesterId: "sem-1",
  });
});

describe("DraftBar", () => {
  it("calls notify.success and clears the draft when the submit mutation succeeds", async () => {
    const user = userEvent.setup();
    const result: EnrollmentRequestBatchResult = {
      items: [
        { id: "r1" } as EnrollmentRequestBatchResult["items"][number],
        { id: "r2" } as EnrollmentRequestBatchResult["items"][number],
      ],
    };
    mockUseSubmitEnrollmentBatch.mockReturnValue({
      mutate: (
        _vars: unknown,
        options?: { onSuccess?: (data: EnrollmentRequestBatchResult) => void },
      ) => {
        options?.onSuccess?.(result);
      },
      isPending: false,
    } as unknown as ReturnType<typeof useSubmitEnrollmentBatch>);

    render(<DraftBar limitWarning={false} />);

    await user.click(screen.getByRole("button", { name: "Submit plan" }));

    expect(mockNotify.success).toHaveBeenCalledWith("Submitted 2 requests.");
    expect(useUiStore.getState().draftGroupIds).toEqual([]);
  });
});
