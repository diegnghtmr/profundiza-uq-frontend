import { Dialog, Badge, Button, Spinner } from "@/shared/components/ui";
import { useOfferingPrerequisites } from "../api/offeringsApi";

/**
 * Read-only list of effective prerequisites for an offering, shown before
 * enrolling. Prerequisites are fetched lazily (only while the dialog is open)
 * from `GET /offerings/{offeringId}/prerequisites`.
 */
export function PrerequisitesDialog({
  offeringId,
  electiveName,
  open,
  onOpenChange,
}: {
  offeringId: string;
  electiveName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: prerequisites, isLoading } = useOfferingPrerequisites(
    offeringId,
    open,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${electiveName} — prerequisites`}
      description="Review these before adding the elective to your plan."
      footer={
        <Button variant="soft" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner label="Loading prerequisites" />
        </div>
      ) : !prerequisites || prerequisites.length === 0 ? (
        <p className="text-body text-graphite">
          No prerequisites are registered for this offering.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {prerequisites.map((pr) => (
            <li key={pr.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-body font-medium text-ink-black">
                  {pr.name}
                </span>
                <Badge tone="muted">
                  {pr.source === "ELECTIVE_DEFAULT" ? "Default" : "Offering-specific"}
                </Badge>
              </div>
              <p className="text-body-sm text-graphite">{pr.description}</p>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
