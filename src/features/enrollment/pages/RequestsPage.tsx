import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  Spinner,
  StatusBadge,
  Badge,
  priorityLabel,
} from "@/shared/components/ui";
import { useUiStore } from "@/shared/stores/uiStore";
import type { EnrollmentRequest } from "@/shared/api/types";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import { useMyRequests, useCancelRequest } from "../api/requestsApi";

/** Maps offering/group ids to human labels using the catalog query. */
function useRequestLabels() {
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const { data: offerings } = useOfferings(semesterId);

  return useMemo(() => {
    const map = new Map<string, { elective: string; group: string }>();
    for (const o of offerings ?? []) {
      for (const g of o.groups) {
        map.set(g.id, { elective: o.elective.name, group: g.groupCode });
      }
    }
    return map;
  }, [offerings]);
}

const CANCELLABLE: ReadonlySet<EnrollmentRequest["status"]> = new Set([
  "SUBMITTED",
  "PENDING_REVIEW",
  "WAITLIST_SAME_SHIFT",
  "WAITLIST_OPPOSITE_SHIFT",
]);

export function RequestsPage() {
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const { data: requests, isLoading } = useMyRequests(semesterId);
  const labels = useRequestLabels();
  const cancelMutation = useCancelRequest();
  const [toCancel, setToCancel] = useState<EnrollmentRequest | null>(null);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
          My Requests
        </h1>
        <p className="max-w-2xl text-subheading text-graphite">
          Track the status of each elective request. Cancelling a request frees
          your seat and forfeits your queue position.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (requests?.length ?? 0) === 0 ? (
        <p className="py-16 text-center text-body text-slate">
          You have no requests yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests!.map((request) => {
            const label = labels.get(request.offeringGroupId);
            const cancellable = CANCELLABLE.has(request.status);
            return (
              <Card
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-4 py-6"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-subheading font-medium text-ink-black">
                      {label?.elective ?? "Elective"}
                    </span>
                    <Badge tone="muted">{label?.group ?? request.offeringGroupId}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-graphite">
                    <span>{priorityLabel(request.priorityGroup)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Arrival position #{request.arrivalSequence}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={request.status} />
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!cancellable}
                    onClick={() => setToCancel(request)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={toCancel !== null}
        onOpenChange={(open) => !open && setToCancel(null)}
        title="Cancel this request?"
        description="If you cancel, you lose your position in the queue. Re-submitting later places you at the end."
        footer={
          <>
            <Button variant="soft" onClick={() => setToCancel(null)}>
              Keep request
            </Button>
            <Button
              variant="danger"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (!toCancel) return;
                cancelMutation.mutate(toCancel.id, {
                  onSettled: () => setToCancel(null),
                });
              }}
            >
              {cancelMutation.isPending ? <Spinner /> : "Cancel request"}
            </Button>
          </>
        }
      />
    </section>
  );
}
