import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  Button,
  Card,
  Spinner,
  StatusBadge,
  Badge,
  DataState,
  EmptyState,
  priorityLabel,
} from "@/shared/components/ui";
import { useUiStore } from "@/shared/stores/uiStore";
import type { EnrollmentRequest } from "@/shared/api/types";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import { useMyRequests, useCancelRequest } from "../api/requestsApi";
import { MyRequestsSkeleton } from "../components/MyRequestsSkeleton";

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
  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyRequests(semesterId);
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

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={(requests?.length ?? 0) === 0}
        error={error}
        onRetry={() => void refetch()}
        skeleton={<MyRequestsSkeleton />}
        emptyState={
          <EmptyState
            icon="file-text"
            title="No requests yet"
            description="You have no requests yet. Browse the catalog to add up to 4."
            action={
              <Link
                to="/app/offerings"
                className="inline-flex h-11 items-center justify-center rounded-[30px] bg-ink-black px-6 text-body-sm font-medium text-snow transition-opacity duration-200 ease-out hover:opacity-85"
              >
                Browse offerings
              </Link>
            }
          />
        }
      >
        <div className="flex flex-col gap-4">
          {(requests ?? []).map((request) => {
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
      </DataState>

      <AlertDialog
        open={toCancel !== null}
        onOpenChange={(open) => !open && setToCancel(null)}
        title="Cancel this request?"
        description="If you cancel, you lose your position in the queue. Re-submitting later places you at the end."
        tone="danger"
        cancelLabel="Keep request"
        confirmLabel={cancelMutation.isPending ? <Spinner /> : "Cancel request"}
        confirmDisabled={cancelMutation.isPending}
        onConfirm={() => {
          if (!toCancel) return;
          cancelMutation.mutate(toCancel.id, {
            onSettled: () => setToCancel(null),
          });
        }}
      />
    </section>
  );
}
