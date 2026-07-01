import { ApiRequestError } from "@/shared/api/client";

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

/** Resolve any thrown value into a single human-readable line for a toast. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return FRIENDLY_MESSAGES[error.code] ?? error.message ?? "Something went wrong.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
