import { useState } from "react";
import { Button, Dialog, Select, Spinner, Textarea } from "@/shared/components/ui";
import type { SelectOption } from "@/shared/components/ui";
import type { EnrollmentDecisionType } from "@/shared/api/types";

const DECISION_TITLES: Record<EnrollmentDecisionType, string> = {
  ACCEPT: "Accept request",
  REJECT: "Reject request",
  ADMIN_CANCEL: "Cancel request",
  MOVE_TO_REVIEW: "Move to review",
  CREATE_GROUP_ACCEPTANCE: "Accept into new group",
  CAPACITY_ADJUSTMENT_ACCEPTANCE: "Accept with capacity adjustment",
};

/** Decision types confirmed with a positive (neutral) action instead of danger. */
const POSITIVE_DECISIONS: ReadonlySet<EnrollmentDecisionType> = new Set([
  "ACCEPT",
  "CREATE_GROUP_ACCEPTANCE",
]);

const MIN_REASON = 3;
const TARGET_GROUP_PLACEHOLDER = "";

/**
 * Mandatory-reason dialog for admin decisions. The reason is required by the API
 * (minLength 3) for every decision type, so submit stays disabled until valid.
 * For CREATE_GROUP_ACCEPTANCE a target group (a sibling group of the SAME
 * offering) is also required, and submit stays disabled until both are set.
 */
export function DecisionDialog({
  open,
  onOpenChange,
  decisionType,
  studentName,
  targetGroups = [],
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionType: EnrollmentDecisionType | null;
  studentName: string;
  /** Sibling groups of the request's offering, minus its current group. */
  targetGroups?: ReadonlyArray<SelectOption>;
  pending: boolean;
  onConfirm: (reason: string, targetGroupId?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [targetGroupId, setTargetGroupId] = useState(TARGET_GROUP_PLACEHOLDER);

  // Clear the reason and target group whenever the dialog opens or switches
  // decision type. Done during render (React's "adjust state on prop change"
  // pattern), not an effect.
  const [sync, setSync] = useState<{
    open: boolean;
    decisionType: EnrollmentDecisionType | null;
  }>({ open: false, decisionType: null });
  if (sync.open !== open || sync.decisionType !== decisionType) {
    setSync({ open, decisionType });
    if (open) {
      setReason("");
      setTargetGroupId(TARGET_GROUP_PLACEHOLDER);
    }
  }

  const needsTargetGroup = decisionType === "CREATE_GROUP_ACCEPTANCE";
  const reasonValid = reason.trim().length >= MIN_REASON;
  const targetGroupValid =
    !needsTargetGroup || targetGroupId !== TARGET_GROUP_PLACEHOLDER;
  const valid = reasonValid && targetGroupValid;
  const title = decisionType ? DECISION_TITLES[decisionType] : "Decision";

  const targetGroupOptions: SelectOption[] = [
    { value: TARGET_GROUP_PLACEHOLDER, label: "Select a group…" },
    ...targetGroups,
  ];

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
            variant={
              decisionType && POSITIVE_DECISIONS.has(decisionType)
                ? "neutral"
                : "danger"
            }
            disabled={!valid || pending}
            onClick={() =>
              onConfirm(
                reason.trim(),
                needsTargetGroup ? targetGroupId : undefined,
              )
            }
          >
            {pending ? <Spinner /> : "Confirm decision"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {needsTargetGroup ? (
          <Select
            label="Target group"
            options={targetGroupOptions}
            value={targetGroupId}
            onChange={(e) => setTargetGroupId(e.target.value)}
          />
        ) : null}
        <Textarea
          label="Reason"
          rows={3}
          placeholder="Explain the rationale for this decision…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={
            !reasonValid && reason.length > 0
              ? `Provide at least ${MIN_REASON} characters.`
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}
