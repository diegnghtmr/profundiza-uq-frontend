import { useState } from "react";
import { Badge, Button, Card, CardDescription, CardTitle } from "@/shared/components/ui";
import type { AcademicShift, ElectiveOfferingSummary } from "@/shared/api/types";
import { useUiStore } from "@/shared/stores/uiStore";
import { PrerequisitesDialog } from "./PrerequisitesDialog";

const SHIFT_LABEL: Record<AcademicShift, string> = {
  DAY: "Day",
  NIGHT: "Night",
};

/** Capacity-bar fill color: black with room, marigold when scarce, red when full. */
function capacityColor(fillPct: number): string {
  if (fillPct >= 100) return "#fa3d1d";
  if (fillPct >= 88) return "#ffb005";
  return "#000000";
}

function seatsLabel(seatsLeft: number, capacity: number): string {
  if (seatsLeft <= 0) return "Full · waitlist open";
  if (seatsLeft <= 3) return `${seatsLeft} of ${capacity} seats left`;
  return `Open · ${seatsLeft} of ${capacity}`;
}

/**
 * Presentational offering card. Each group exposes shift, schedule, seats and an
 * "Add to plan" toggle driven by the draft store (max 4 enforced at store level).
 * Renders from the list summary; prerequisites load on demand in the dialog.
 */
export function OfferingCard({
  offering,
  requestedGroupIds,
  onLimitReached,
}: {
  offering: ElectiveOfferingSummary;
  /** Group ids the student already holds an active request for; shown as
   *  "Requested" (disabled) so the same elective can't be submitted twice. */
  requestedGroupIds: ReadonlySet<string>;
  onLimitReached: () => void;
}) {
  const [prereqOpen, setPrereqOpen] = useState(false);
  const draftGroupIds = useUiStore((s) => s.draftGroupIds);
  const toggleDraftGroup = useUiStore((s) => s.toggleDraftGroup);

  return (
    <Card className="relative flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <Badge tone="muted">{offering.elective.area}</Badge>
        <Button
          variant="soft"
          size="sm"
          onClick={() => setPrereqOpen(true)}
          aria-haspopup="dialog"
        >
          View prerequisites
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <CardTitle>{offering.elective.name}</CardTitle>
        {offering.elective.description ? (
          <CardDescription>{offering.elective.description}</CardDescription>
        ) : null}
      </div>

      <ul className="flex flex-col gap-3">
        {offering.groups.map((group) => {
          const capacity = Math.max(0, group.capacity);
          const accepted = Math.max(0, group.acceptedCount ?? 0);
          const seatsLeft = Math.max(0, capacity - accepted);
          const full = seatsLeft === 0;
          const alreadyRequested = requestedGroupIds.has(group.id);
          const inDraft = draftGroupIds.includes(group.id);
          const fillPct = Math.min(
            100,
            Math.round((accepted / Math.max(1, capacity)) * 100),
          );

          return (
            <li
              key={group.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-ink-black/[0.02] px-4 py-3"
            >
              <div className="flex w-[74px] shrink-0 flex-col gap-1">
                <span className="text-body-sm font-medium tabular-nums text-ink-black">
                  {group.groupCode}
                </span>
                <Badge
                  tone="neutral"
                  dotColor={group.shift === "DAY" ? "#ffb005" : "#0358f7"}
                >
                  {SHIFT_LABEL[group.shift]}
                </Badge>
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm text-ink-black">
                  {group.scheduleText}
                </span>
                {group.teacherName ? (
                  <span className="text-body-sm text-slate">
                    {group.teacherName}
                  </span>
                ) : null}
              </div>

              <div className="w-[150px] shrink-0">
                <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-ink-black/[0.07]">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 ease-out"
                    style={{
                      width: `${fillPct}%`,
                      backgroundColor: capacityColor(fillPct),
                    }}
                  />
                </div>
                <span className="text-caption tabular-nums text-ash">
                  {seatsLabel(seatsLeft, capacity)}
                </span>
              </div>

              {alreadyRequested ? (
                <Button
                  variant="soft"
                  size="sm"
                  disabled
                  className="shrink-0"
                >
                  Requested
                </Button>
              ) : (
                <Button
                  variant={inDraft ? "soft" : "neutral"}
                  size="sm"
                  aria-pressed={inDraft}
                  className="shrink-0"
                  onClick={() => {
                    const result = toggleDraftGroup(group.id);
                    if (result === "limit-reached") onLimitReached();
                  }}
                >
                  {inDraft ? "In plan" : full ? "Join waitlist" : "Add to plan"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <PrerequisitesDialog
        offeringId={offering.id}
        electiveName={offering.elective.name}
        open={prereqOpen}
        onOpenChange={setPrereqOpen}
      />
    </Card>
  );
}
