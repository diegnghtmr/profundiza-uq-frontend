import { useEffect, useState } from "react";
import { Button, Dialog, Input, Spinner, Textarea } from "@/shared/components/ui";
import { useAdjustCapacity } from "../api/catalogAdminApi";
import type { OfferingGroupSummary } from "@/shared/api/types";

const MIN_REASON = 3;

/**
 * Capacity-adjustment dialog. Capacity changes always carry an audit reason, so
 * this posts to /offering-groups/{id}/capacity-adjustments rather than PATCH.
 * Disallows lowering capacity below the seats already accepted.
 */
export function CapacityDialog({
  group,
  semesterId,
  open,
  onOpenChange,
  onAdjusted,
}: {
  group: OfferingGroupSummary | null;
  semesterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful capacity change, so callers outside the catalog
   *  (e.g. the review queue) can refresh their own view of the group. */
  onAdjusted?: () => void;
}) {
  const adjustCapacity = useAdjustCapacity(semesterId);
  const [capacity, setCapacity] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && group) {
      setCapacity(String(group.capacity));
      setReason("");
    }
  }, [open, group]);

  const accepted = group?.acceptedCount ?? 0;
  const parsed = Number(capacity);
  const capacityValid =
    capacity !== "" && Number.isInteger(parsed) && parsed >= accepted;
  const reasonValid = reason.trim().length >= MIN_REASON;
  const valid = capacityValid && reasonValid;

  function onConfirm() {
    if (!group || !valid) return;
    adjustCapacity.mutate(
      { groupId: group.id, newCapacity: parsed, reason: reason.trim() },
      {
        onSuccess: () => {
          onAdjusted?.();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={group ? `Adjust capacity · ${group.groupCode}` : "Adjust capacity"}
      description="Capacity changes are recorded in the audit trail. A reason is required."
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || adjustCapacity.isPending} onClick={onConfirm}>
            {adjustCapacity.isPending ? <Spinner /> : "Save capacity"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Input
          label="New capacity"
          type="number"
          inputMode="numeric"
          min={accepted}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          error={
            capacity !== "" && !capacityValid
              ? `Capacity must be a whole number of at least ${accepted} (already accepted).`
              : undefined
          }
        />
        <Textarea
          label="Reason"
          rows={3}
          placeholder="Explain why capacity is changing…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={
            reason.length > 0 && !reasonValid
              ? `Provide at least ${MIN_REASON} characters.`
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}
