import { Badge, Button, Card, CardTitle } from "@/shared/components/ui";
import type {
  AcademicShift,
  ElectiveOfferingSummary,
  OfferingGroupSummary,
} from "@/shared/api/types";

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

/**
 * Admin view of one offering for the active semester: every group with shift,
 * schedule, teacher, a capacity meter and an "Adjust capacity" action.
 */
export function AdminOfferingCard({
  offering,
  onAdjustCapacity,
}: {
  offering: ElectiveOfferingSummary;
  onAdjustCapacity: (group: OfferingGroupSummary) => void;
}) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-caption text-slate">{offering.elective.area}</span>
          <CardTitle>{offering.elective.name}</CardTitle>
        </div>
        <Badge tone="muted">
          {offering.groups.length}{" "}
          {offering.groups.length === 1 ? "group" : "groups"}
        </Badge>
      </div>

      {offering.groups.length === 0 ? (
        <p className="text-body-sm text-slate">
          No groups configured for this offering yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {offering.groups.map((group) => {
            const capacity = Math.max(0, group.capacity);
            const accepted = Math.max(0, group.acceptedCount ?? 0);
            const seatsLeft = Math.max(0, capacity - accepted);
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
                  ) : (
                    <span className="text-body-sm text-steel">
                      No teacher assigned
                    </span>
                  )}
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
                    {accepted} / {capacity} · {seatsLeft} left
                  </span>
                </div>

                <Button
                  variant="soft"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onAdjustCapacity(group)}
                >
                  Adjust capacity
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
