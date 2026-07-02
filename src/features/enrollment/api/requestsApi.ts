import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import type {
  EnrollmentRequest,
  EnrollmentRequestBatchResult,
} from "@/shared/api/types";
import { notify } from "@/shared/lib/notify";

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
 * Submit up to four requests in one shot. The `Idempotency-Key` is stable
 * across retries of the *same* logical submit (e.g. the user retries after a
 * lost/timed-out response) so the backend's dedup actually catches the exact
 * retry case, instead of minting a new key every `.mutate()` call and
 * defeating double-submit protection. The key only rotates after a confirmed
 * success, so the next distinct submit gets a fresh one. Invalidates the
 * student's request list so "My Requests" reflects the new submissions.
 */
export function useSubmitEnrollmentBatch() {
  const qc = useQueryClient();
  // Lazily create the key on first render only, guarded so crypto.randomUUID()
  // is not re-invoked on every re-render (same idiom as useNow's useState
  // lazy initializer, adapted for a ref since this value doesn't need to
  // trigger a re-render when it changes).
  const idempotencyKeyRef = useRef<string>(undefined);
  if (idempotencyKeyRef.current === undefined) {
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  return useMutation({
    mutationFn: ({ semesterId, offeringGroupIds }: SubmitBatchInput) =>
      fetchClient<EnrollmentRequestBatchResult>("/enrollment-requests/batch", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKeyRef.current! },
        body: {
          semesterId,
          items: offeringGroupIds.map((offeringGroupId) => ({ offeringGroupId })),
        },
      }),
    onSuccess: () => {
      // The submit is confirmed; rotate the key so the next distinct submit
      // does not accidentally collide with (or get deduped against) this one.
      idempotencyKeyRef.current = crypto.randomUUID();
      qc.invalidateQueries({ queryKey: requestsKeys.all });
    },
    onError: (error) => notify.error(error),
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
    onError: (error) => notify.error(error),
  });
}
