import { z } from "zod";

/**
 * Runtime schemas for the enrollment request payloads, colocated with the
 * enrollment api module. Mirror the TypeScript shapes in `@/shared/api/types`
 * (EnrollmentRequest and its read/write envelopes).
 */
export const academicShiftSchema = z.enum(["DAY", "NIGHT"]);

export const priorityGroupSchema = z.enum([
  "DIRECT_SAME_SHIFT",
  "WAITLIST_SAME_SHIFT",
  "WAITLIST_OPPOSITE_SHIFT",
]);

export const enrollmentRequestStatusSchema = z.enum([
  "SUBMITTED",
  "PENDING_REVIEW",
  "WAITLIST_SAME_SHIFT",
  "WAITLIST_OPPOSITE_SHIFT",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED_BY_STUDENT",
  "CANCELLED_BY_ADMIN",
]);

export const enrollmentRequestSchema = z.object({
  id: z.string(),
  semesterId: z.string(),
  studentId: z.string(),
  offeringId: z.string(),
  offeringGroupId: z.string(),
  // Nullable at the source: the DB column is ON DELETE SET NULL and the Go DTO
  // field is *string with no omitempty, so a deleted window serializes as
  // `null` (not absent). `.nullish()` accepts null/undefined; `.optional()`
  // alone would reject null and hard-fail the whole My Requests list.
  enrollmentWindowId: z.string().nullish(),
  studentShift: academicShiftSchema.optional(),
  offeringShift: academicShiftSchema.optional(),
  priorityGroup: priorityGroupSchema,
  status: enrollmentRequestStatusSchema,
  arrivalSequence: z.number(),
  submittedAt: z.string(),
  cancelledAt: z.string().nullish(),
  latestReason: z.string().nullish(),
});

/** Response of `GET /enrollment-requests`. */
export const myRequestsResponseSchema = z.object({
  items: z.array(enrollmentRequestSchema),
});

/** Response of `POST /enrollment-requests/batch`. */
export const enrollmentBatchResultSchema = z.object({
  items: z.array(enrollmentRequestSchema),
});
