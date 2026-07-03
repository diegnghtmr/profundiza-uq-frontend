import { ApiRequestError, ApiSchemaError } from "@/shared/api/client";

/** Shown whenever we cannot safely surface a specific, catalogued detail. */
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/**
 * Friendly, user-facing copy for the API error `code`s the UI can surface.
 * Falls back to the envelope `message`, then a generic line, so the user never
 * sees a raw code. Keep keys aligned with the backend error catalog.
 */
const FRIENDLY_MESSAGES: Record<string, string> = {
  MAX_ELECTIVES_REACHED: "You can request at most 4 electives per semester.",
  ENROLLMENT_WINDOW_CLOSED:
    "The enrollment window is closed. You can no longer submit or change requests.",
  CAPACITY_EXCEEDED: "This group has no seats available right now.",
  REASON_REQUIRED: "A reason is required for this decision.",
  DUPLICATE_REQUEST: "You already have a request for this group.",
  VALIDATION_ERROR: "Some of the submitted data is invalid.",
  UNAUTHENTICATED: "Your session expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
};

/**
 * Resolve any thrown value into a single human-readable line for a toast.
 *
 * We only surface a backend `message` when it is safe: a catalogued business
 * error always wins, and an un-catalogued detail is shown only for a genuine
 * client-error envelope (status < 500 with a real backend `code`). For 5xx,
 * the synthesized `UNKNOWN` code (which client.ts builds from raw `text()` for
 * non-JSON bodies), or anything else, we return the generic line — so a 502
 * nginx HTML page or a 500 stack trace never renders raw in a toast.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const friendly = FRIENDLY_MESSAGES[error.code];
    if (friendly) return friendly;
    const isSafeClientDetail =
      error.status < 500 && error.code !== "UNKNOWN" && Boolean(error.message);
    return isSafeClientDetail ? error.message : GENERIC_MESSAGE;
  }
  // A schema-drift failure carries an internal endpoint path in its message
  // ("Response validation failed for /..."). Never surface that to the user.
  if (error instanceof ApiSchemaError) {
    return GENERIC_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return GENERIC_MESSAGE;
}
