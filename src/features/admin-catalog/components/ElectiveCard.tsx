import { Badge, Button, Card } from "@/shared/components/ui";
import type { Elective, ResourceStatus } from "@/shared/api/types";

const STATUS_LABEL: Record<ResourceStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  CLOSED: "Closed",
};

const STATUS_DOT: Record<ResourceStatus, string | undefined> = {
  ACTIVE: "#ffb005",
  INACTIVE: "#959595",
  CLOSED: "#fa3d1d",
};

/**
 * Catalog elective card: area, status, name and the count of groups offered in
 * the active semester. Exposes the prerequisites action.
 */
export function ElectiveCard({
  elective,
  groupCount,
  onViewPrerequisites,
}: {
  elective: Elective;
  groupCount: number;
  onViewPrerequisites: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="muted">{elective.area}</Badge>
        <Badge tone="neutral" dotColor={STATUS_DOT[elective.status]}>
          {STATUS_LABEL[elective.status]}
        </Badge>
      </div>

      <h3 className="text-heading-sm font-medium tracking-[-0.44px] text-ink-black">
        {elective.name}
      </h3>

      {elective.description ? (
        <p className="line-clamp-2 text-body-sm text-graphite">
          {elective.description}
        </p>
      ) : null}

      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-caption tabular-nums text-slate">
          {groupCount} {groupCount === 1 ? "group" : "groups"} this semester
        </span>
        <Button
          variant="soft"
          size="sm"
          onClick={onViewPrerequisites}
          aria-haspopup="dialog"
        >
          Prerequisites
        </Button>
      </div>
    </Card>
  );
}
