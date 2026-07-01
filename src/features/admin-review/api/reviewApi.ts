import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import type {
  AdminReviewQueueItem,
  AdminReviewQueuePage,
  CreateEnrollmentDecisionRequest,
  EnrollmentDecisionResult,
} from "@/shared/api/types";
import { errorMessage } from "@/shared/lib/apiErrors";
import { toast } from "@/shared/stores/toastStore";

export const reviewKeys = {
  all: ["review-queue"] as const,
  list: (semesterId: string) => ["review-queue", semesterId] as const,
};

/** Admin review queue for a semester. The page envelope is unwrapped to items. */
function fetchReviewQueue(semesterId: string): Promise<AdminReviewQueueItem[]> {
  return fetchClient<AdminReviewQueuePage>("/admin/review-queues", {
    query: { semesterId },
  }).then((p) => p.items);
}

export function useReviewQueue(semesterId: string) {
  return useQuery({
    queryKey: reviewKeys.list(semesterId),
    queryFn: () => fetchReviewQueue(semesterId),
    enabled: semesterId !== "",
  });
}

export interface DecisionInput extends CreateEnrollmentDecisionRequest {
  requestId: string;
  semesterId: string;
}

/**
 * Apply an admin decision (accept/reject/cancel/move). A reason is mandatory.
 * Invalidates the queue for the affected semester so the resolved row drops.
 */
export function useSubmitDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, decisionType, reason }: DecisionInput) =>
      fetchClient<EnrollmentDecisionResult>(
        `/admin/enrollment-requests/${requestId}/decisions`,
        { method: "POST", body: { decisionType, reason } },
      ),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: reviewKeys.list(variables.semesterId) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
