import { useEffect, useState } from "react";
import { Button, Dialog, Spinner, Textarea } from "@/shared/components/ui";
import type { EnrollmentDecisionType } from "@/shared/api/types";

const DECISION_TITLES: Record<EnrollmentDecisionType, string> = {
  ACCEPT: "Accept request",
  REJECT: "Reject request",
  ADMIN_CANCEL: "Cancel request",
  MOVE_TO_REVIEW: "Move to review",
  CREATE_GROUP_ACCEPTANCE: "Accept into new group",
  CAPACITY_ADJUSTMENT_ACCEPTANCE: "Accept with capacity adjustment",
};

const MIN_REASON = 3;

/**
 * Mandatory-reason dialog for admin decisions. The reason is required by the API
 * (minLength 3) for every decision type, so submit stays disabled until valid.
 */
export function DecisionDialog({
  open,
  onOpenChange,
  decisionType,
  studentName,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionType: EnrollmentDecisionType | null;
  studentName: string;
  pending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open, decisionType]);

  const valid = reason.trim().length >= MIN_REASON;
  const title = decisionType ? DECISION_TITLES[decisionType] : "Decision";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={`This decision for ${studentName} is recorded in the audit trail. A reason is required.`}
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={decisionType === "ACCEPT" ? "neutral" : "danger"}
            disabled={!valid || pending}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? <Spinner /> : "Confirm decision"}
          </Button>
        </>
      }
    >
      <Textarea
        label="Reason"
        rows={3}
        placeholder="Explain the rationale for this decision…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={
          !valid && reason.length > 0
            ? `Provide at least ${MIN_REASON} characters.`
            : undefined
        }
      />
    </Dialog>
  );
}
