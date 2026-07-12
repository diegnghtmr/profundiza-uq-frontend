import { useId, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataState,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Icon,
  SegmentedControl,
  Select,
  StatusBadge,
  priorityLabel,
} from "@/shared/components/ui";
import type { SelectOption } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { useUiStore } from "@/shared/stores/uiStore";
import type {
  AdminReviewQueueItem,
  EnrollmentDecisionType,
  OfferingGroup,
  OfferingGroupSummary,
  PriorityGroup,
} from "@/shared/api/types";
import { CapacityDialog } from "@/features/admin-catalog/components/CapacityDialog";
import { useReviewQueue, useSubmitDecision, reviewKeys } from "../api/reviewApi";
import { DecisionDialog } from "../components/DecisionDialog";
import { ReviewQueueSkeleton } from "../components/ReviewQueueSkeleton";

/** Priority tiers, rendered in queue order within the selected group. */
const PRIORITY_TIERS: readonly PriorityGroup[] = [
  "DIRECT_SAME_SHIFT",
  "WAITLIST_SAME_SHIFT",
  "WAITLIST_OPPOSITE_SHIFT",
];

const TIER_HINT: Record<PriorityGroup, string> = {
  DIRECT_SAME_SHIFT: "Highest priority · same shift as the group.",
  WAITLIST_SAME_SHIFT: "Considered after direct requests are resolved.",
  WAITLIST_OPPOSITE_SHIFT: "Lowest priority · student shift differs.",
};

const ACTIONS: ReadonlyArray<{ type: EnrollmentDecisionType; label: string }> = [
  { type: "ACCEPT", label: "Accept" },
  { type: "CREATE_GROUP_ACCEPTANCE", label: "Accept into another group" },
  { type: "REJECT", label: "Reject" },
  { type: "ADMIN_CANCEL", label: "Cancel" },
  { type: "MOVE_TO_REVIEW", label: "Move" },
];

type StatusFilter = "ALL" | "PENDING" | "WAITLIST";

const STATUS_FILTERS = [
  { value: "ALL" as const, label: "All" },
  { value: "PENDING" as const, label: "Pending" },
  { value: "WAITLIST" as const, label: "Waitlist" },
];

interface PendingDecision {
  item: AdminReviewQueueItem;
  type: EnrollmentDecisionType;
}

/** One offering group's slice of the queue, keyed for the group selector. */
interface GroupBucket {
  id: string;
  label: string;
  group: OfferingGroup;
  items: AdminReviewQueueItem[];
}

export function ReviewQueuePage() {
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const qc = useQueryClient();
  const {
    data: items,
    isLoading,
    isError,
    error,
    refetch,
  } = useReviewQueue(semesterId);
  const submitDecision = useSubmitDecision();

  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [capacityOpen, setCapacityOpen] = useState(false);

  const buckets = useMemo(() => buildBuckets(items ?? []), [items]);
  const selected = useMemo(
    () =>
      buckets.find((b) => b.id === selectedGroupId) ?? buckets[0] ?? null,
    [buckets, selectedGroupId],
  );

  const visibleItems = useMemo(
    () => (selected ? selected.items.filter(matchesStatus(statusFilter)) : []),
    [selected, statusFilter],
  );

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
          Review Queue
        </h1>
        <p className="max-w-2xl text-subheading text-graphite">
          Resolve one group at a time, in priority order. Every decision requires
          a reason and is written to the audit trail.
        </p>
      </header>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={(items?.length ?? 0) === 0}
        error={error}
        onRetry={() => void refetch()}
        skeleton={<ReviewQueueSkeleton />}
        emptyState={
          <EmptyState
            icon="check"
            title="No requests to review"
            description="No requests are waiting for review in this semester."
          />
        }
      >
        {selected ? (
        <>
          <GroupPanel
            buckets={buckets}
            selected={selected}
            onSelect={setSelectedGroupId}
            onAdjustCapacity={() => setCapacityOpen(true)}
          />

          <div className="flex items-center justify-between gap-4">
            <SegmentedControl
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <span className="text-body-sm text-slate">
              {visibleItems.length}{" "}
              {visibleItems.length === 1 ? "request" : "requests"}
            </span>
          </div>

          {visibleItems.length === 0 ? (
            <Card className="py-8 text-center text-body-sm text-slate">
              No requests match this filter.
            </Card>
          ) : (
            PRIORITY_TIERS.map((tier) => {
              const rows = visibleItems
                .filter((it) => it.request.priorityGroup === tier)
                .sort(
                  (a, b) =>
                    a.request.arrivalSequence - b.request.arrivalSequence,
                );
              if (rows.length === 0) return null;
              return (
                <div key={tier} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-heading-sm font-medium tracking-[-0.44px] text-ink-black">
                      {priorityLabel(tier)}
                    </h2>
                    <Badge tone="muted">{rows.length}</Badge>
                    <span className="text-body-sm text-slate">
                      {TIER_HINT[tier]}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {rows.map((item) => (
                      <RequestRow
                        key={item.request.id}
                        item={item}
                        onDecision={(type) => setPending({ item, type })}
                      />
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </>
        ) : null}
      </DataState>

      <DecisionDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        decisionType={pending?.type ?? null}
        studentName={pending?.item.student.fullName ?? ""}
        targetGroups={pending ? targetGroupOptions(pending.item) : []}
        pending={submitDecision.isPending}
        onConfirm={(reason, targetGroupId) => {
          if (!pending) return;
          submitDecision.mutate(
            {
              requestId: pending.item.request.id,
              semesterId,
              decisionType: pending.type,
              reason,
              // Only carried for CREATE_GROUP_ACCEPTANCE; omitted otherwise.
              ...(targetGroupId ? { targetGroupId } : {}),
            },
            { onSettled: () => setPending(null) },
          );
        }}
      />

      <CapacityDialog
        group={selected ? toGroupSummary(selected.group) : null}
        semesterId={semesterId}
        open={capacityOpen}
        onOpenChange={setCapacityOpen}
        onAdjusted={() =>
          qc.invalidateQueries({ queryKey: reviewKeys.list(semesterId) })
        }
      />
    </section>
  );
}

/** Group selector + live capacity context for the group under review. */
function GroupPanel({
  buckets,
  selected,
  onSelect,
  onAdjustCapacity,
}: {
  buckets: GroupBucket[];
  selected: GroupBucket;
  onSelect: (id: string) => void;
  onAdjustCapacity: () => void;
}) {
  const groupSelectId = useId();
  const g = selected.group;
  const accepted = Math.max(0, g.acceptedCount ?? 0);
  const capacity = Math.max(0, g.capacity);
  const seatsLeft = Math.max(0, capacity - accepted);
  const onWaitlist =
    (g.waitlistSameShiftCount ?? 0) + (g.waitlistOppositeShiftCount ?? 0);
  const fillPct = Math.min(100, Math.round((accepted / Math.max(1, capacity)) * 100));

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={groupSelectId}
            className="text-caption font-medium uppercase tracking-wide text-slate"
          >
            Reviewing group
          </label>
          <Select
            id={groupSelectId}
            options={buckets.map((b) => ({ value: b.id, label: b.label }))}
            value={selected.id}
            onChange={onSelect}
            className="min-w-[280px]"
          />
        </div>
        <Button variant="soft" size="sm" onClick={onAdjustCapacity}>
          Adjust capacity
        </Button>
      </div>

      <p className="text-body-sm text-slate">
        {g.scheduleText}
        {g.teacherName ? ` · ${g.teacherName}` : ""}
      </p>

      <div className="h-1.5 overflow-hidden rounded-full bg-ink-black/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${fillPct}%`, backgroundColor: capacityColor(fillPct) }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Capacity" value={capacity} />
        <Stat label="Accepted" value={accepted} />
        <Stat label="Seats left" value={seatsLeft} />
        <Stat label="On waitlist" value={onWaitlist} accent={onWaitlist > 0} />
      </dl>
    </Card>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-body-sm text-ash">{label}</dt>
      <dd
        className={cn(
          "text-[28px] font-light leading-none tracking-[-0.5px] tabular-nums",
          accent ? "text-marigold" : "text-ink-black",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** A single request awaiting a decision, styled as a standalone row card. */
function RequestRow({
  item,
  onDecision,
}: {
  item: AdminReviewQueueItem;
  onDecision: (type: EnrollmentDecisionType) => void;
}) {
  return (
    <li className="surface-frosted flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[20px] px-5 py-4">
      <span className="w-10 shrink-0 text-body-sm tabular-nums text-slate">
        #{item.request.arrivalSequence}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body-sm font-medium text-ink-black">
          {item.student.fullName}
        </span>
        <span className="truncate text-caption text-slate">
          Doc {item.student.documentNumber} · {item.student.institutionalEmail}
        </span>
        {item.warnings && item.warnings.length > 0 ? (
          <span className="mt-1 flex flex-wrap gap-x-3 text-caption text-marigold">
            {item.warnings.map((w) => (
              <span key={w}>• {w}</span>
            ))}
          </span>
        ) : null}
      </div>

      <StatusBadge status={item.request.status} />

      <div className="flex shrink-0 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="soft" size="sm">
              Decide
              <Icon name="chevron-down" size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {ACTIONS.map((action) => (
              <DropdownMenuItem
                key={action.type}
                onSelect={() => onDecision(action.type)}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

/** Capacity-bar fill color: black with room, marigold when scarce, red when full. */
function capacityColor(fillPct: number): string {
  if (fillPct >= 100) return "#fa3d1d";
  if (fillPct >= 88) return "#ffb005";
  return "#000000";
}

const SHIFT_LABEL: Record<OfferingGroup["shift"], string> = {
  DAY: "Day",
  NIGHT: "Night",
};

/** Bucket the flat queue by offering group, preserving a stable, labelled order. */
function buildBuckets(items: AdminReviewQueueItem[]): GroupBucket[] {
  const map = new Map<string, GroupBucket>();
  for (const item of items) {
    const id = item.group.id;
    let bucket = map.get(id);
    if (!bucket) {
      bucket = {
        id,
        label: `${item.offering.elective.name} · ${item.group.groupCode} · ${SHIFT_LABEL[item.group.shift]}`,
        group: item.group,
        items: [],
      };
      map.set(id, bucket);
    }
    bucket.items.push(item);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Sibling groups of the request's offering, excluding its current group, as
 * options for the CREATE_GROUP_ACCEPTANCE target selector. The offering summary
 * already carries the full, offering-scoped group list, so no extra query is
 * needed.
 */
function targetGroupOptions(item: AdminReviewQueueItem): SelectOption[] {
  return item.offering.groups
    .filter((g) => g.id !== item.group.id)
    .map((g) => ({
      value: g.id,
      label: `${g.groupCode} · ${SHIFT_LABEL[g.shift]} · ${g.scheduleText}`,
    }));
}

/** Adapt a review-queue group to the shape CapacityDialog expects. */
function toGroupSummary(g: OfferingGroup): OfferingGroupSummary {
  return {
    id: g.id,
    groupCode: g.groupCode,
    shift: g.shift,
    scheduleText: g.scheduleText,
    capacity: g.capacity,
    acceptedCount: g.acceptedCount ?? 0,
    status: g.status,
  };
}

function matchesStatus(
  filter: StatusFilter,
): (item: AdminReviewQueueItem) => boolean {
  return (item) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return item.request.status === "PENDING_REVIEW";
    return item.request.status.startsWith("WAITLIST");
  };
}
