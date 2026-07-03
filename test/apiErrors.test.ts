import { describe, it, expect } from "vitest";
import { errorMessage } from "@/shared/lib/apiErrors";
import { ApiRequestError, ApiSchemaError } from "@/shared/api/client";

describe("errorMessage", () => {
  it("maps known API error codes to friendly copy", () => {
    const err = new ApiRequestError(409, {
      code: "MAX_ELECTIVES_REACHED",
      message: "raw backend message",
      traceId: "t-1",
    });
    expect(errorMessage(err)).toContain("at most 4 electives");
  });

  it("falls back to the envelope message for unknown codes", () => {
    const err = new ApiRequestError(400, {
      code: "SOMETHING_NEW",
      message: "Specific backend detail",
      traceId: "t-2",
    });
    expect(errorMessage(err)).toBe("Specific backend detail");
  });

  it("handles plain errors and unknown values", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage(null)).toMatch(/try again/i);
  });

  it("never leaks an ApiSchemaError internal path into the toast", () => {
    // ApiSchemaError's message embeds the endpoint path ("Response validation
    // failed for /enrollment-requests/{id}/cancel"). That is an internal detail
    // and must never surface to the user — the generic line wins instead.
    const err = new ApiSchemaError("/enrollment-requests/abc-123/cancel", []);
    const result = errorMessage(err);
    expect(result).toMatch(/something went wrong/i);
    expect(result).not.toContain("/enrollment-requests");
    expect(result).not.toContain("validation failed");
  });
});
