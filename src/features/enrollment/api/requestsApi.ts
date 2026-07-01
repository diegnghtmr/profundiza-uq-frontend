import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import type {
  EnrollmentRequest,
  EnrollmentRequestBatchResult,
} from "@/shared/api/types";
import { errorMessage } from "@/shared/lib/apiErrors";
import { toast } from "@/shared/stores/toastStore";

export const requestsKeys = {
  all: ["requests"] as const,
  mine: (semesterId: string) => ["requests", "mine", semesterId] as const,
};

/** The signed-in student's enrollment requests for a semester. */
function fetchMyRequests(semesterId: string): Promise<EnrollmentRequest[]> {
  return fetchClient<{ items: EnrollmentRequest[] }>("/enrollment-requests", {
    query: { semesterId },
  }).then((r) => r.items);
}

/**
 * The student's own requests. `/enrollment-requests` is a student-only endpoint,
 * so callers in a non-student context (e.g. the shared Sidebar while an admin is
 * signed in) must pass `enabled: false` to avoid a spurious 403.
 */
export function useMyRequests(semesterId: string, enabled = true) {
  return useQuery({
    queryKey: requestsKeys.mine(semesterId),
    queryFn: () => fetchMyRequests(semesterId),
    enabled: enabled && semesterId !== "",
  });
}

export interface SubmitBatchInput {
  semesterId: string;
  offeringGroupIds: string[];
}

/**
 * Submit up to four requests in one shot. An `Idempotency-Key` (a fresh UUID per
 * submit) makes a retried request a no-op on the backend. Invalidates the
 * student's request list so "My Requests" reflects the new submissions.
 */
export function useSubmitEnrollmentBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ semesterId, offeringGroupIds }: SubmitBatchInput) =>
      fetchClient<EnrollmentRequestBatchResult>("/enrollment-requests/batch", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: {
          semesterId,
          items: offeringGroupIds.map((offeringGroupId) => ({ offeringGroupId })),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

/** Cancel a request. The student loses their queue position. */
export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchClient<EnrollmentRequest>(`/enrollment-requests/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
