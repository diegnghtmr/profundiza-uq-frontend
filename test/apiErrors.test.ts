import { describe, it, expect } from "vitest";
import { errorMessage } from "@/shared/lib/apiErrors";
import { ApiRequestError } from "@/shared/api/client";

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

  it("never leaks a 5xx backend body (stack trace) — returns the generic line", () => {
    const err = new ApiRequestError(500, {
      code: "INTERNAL_ERROR",
      message: "NullPointerException at com.acme.Service.foo(Service.java:42)",
      traceId: "t-3",
    });
    const result = errorMessage(err);
    expect(result).toMatch(/something went wrong/i);
    expect(result).not.toContain("NullPointerException");
  });

  it("never leaks a raw non-JSON error body (nginx HTML) — returns the generic line", () => {
    // client.ts synthesizes { code: "UNKNOWN", message: <raw text> } for
    // non-JSON error responses (e.g. a 502 nginx HTML page).
    const err = new ApiRequestError(502, {
      code: "UNKNOWN",
      message: "<html><head><title>502 Bad Gateway</title></head></html>",
      traceId: "",
    });
    const result = errorMessage(err);
    expect(result).toMatch(/something went wrong/i);
    expect(result).not.toContain("502 Bad Gateway");
  });

  it("keeps surfacing a 4xx business detail from a real envelope shape", () => {
    const err = new ApiRequestError(400, {
      code: "SOMETHING_NEW",
      message: "Specific backend detail",
      traceId: "t-4",
    });
    expect(errorMessage(err)).toBe("Specific backend detail");
  });
});
