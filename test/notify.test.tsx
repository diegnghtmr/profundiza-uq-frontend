import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiRequestError } from "@/shared/api/client";

// FR-002 scenario 2: notify.error funnels an unknown/ApiRequestError value
// through the existing errorMessage() helper (same friendly copy as legacy
// Toast), instead of surfacing raw backend detail. Mocking "sonner" here
// (hoisted by vitest) lets this describe block spy on the real notify.ts
// implementation without ever loading the real Sonner runtime.
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { notify } from "@/shared/lib/notify";
import { toast } from "sonner";

// FR-002 scenario 1: a consumer can mock the notify facade module directly
// and never has to touch sonner. This describe block proves the seam is the
// notify MODULE (mirrors the existing `vi.mock("@/shared/api/...")`
// convention) — it never references "sonner".
describe("notify facade — consumer mockability (FR-002 scenario 1)", () => {
  afterEach(() => {
    vi.doUnmock("@/shared/lib/notify");
    vi.resetModules();
  });

  it("lets a consumer mock @/shared/lib/notify and call notify.* without importing sonner", async () => {
    vi.resetModules();
    vi.doMock("@/shared/lib/notify", () => ({
      notify: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
        promise: vi.fn(),
        dismiss: vi.fn(),
      },
    }));

    const { notify: mockedNotify } = await import("@/shared/lib/notify");
    mockedNotify.success("Saved");
    mockedNotify.error("Something broke");

    expect(mockedNotify.success).toHaveBeenCalledWith("Saved");
    expect(mockedNotify.error).toHaveBeenCalledWith("Something broke");
  });
});

describe("notify facade — real behavior (FR-002 scenario 2)", () => {
  it("notify.error funnels an ApiRequestError through errorMessage()", () => {
    const err = new ApiRequestError(409, {
      code: "CAPACITY_EXCEEDED",
      message: "raw backend detail",
      traceId: "t-1",
    });

    notify.error(err);

    expect(toast.error).toHaveBeenCalledWith(
      "This group has no seats available right now.",
      undefined,
    );
  });

  it("notify.error passes a plain string through unchanged", () => {
    notify.error("Custom message");
    expect(toast.error).toHaveBeenCalledWith("Custom message", undefined);
  });

  it("notify.success/info/warning/dismiss delegate to sonner's toast", () => {
    notify.success("Saved");
    notify.info("Heads up");
    notify.warning("Careful");
    notify.dismiss("id-1");

    expect(toast.success).toHaveBeenCalledWith("Saved", undefined);
    expect(toast.info).toHaveBeenCalledWith("Heads up", undefined);
    expect(toast.warning).toHaveBeenCalledWith("Careful", undefined);
    expect(toast.dismiss).toHaveBeenCalledWith("id-1");
  });
});
