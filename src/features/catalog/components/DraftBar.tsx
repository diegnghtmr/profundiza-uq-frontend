import { Button, Spinner } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { MAX_DRAFT_SELECTION, useUiStore } from "@/shared/stores/uiStore";
import { toast } from "@/shared/stores/toastStore";
import { useSubmitEnrollmentBatch } from "@/features/enrollment/api/requestsApi";

/**
 * Sticky summary of the enrollment plan draft. Shows the count against the max,
 * warns when the limit is reached, and submits the plan via
 * `POST /enrollment-requests/batch` (clearing the draft on success).
 */
export function DraftBar({ limitWarning }: { limitWarning: boolean }) {
  const draftGroupIds = useUiStore((s) => s.draftGroupIds);
  const clearDraft = useUiStore((s) => s.clearDraft);
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const submitBatch = useSubmitEnrollmentBatch();

  if (draftGroupIds.length === 0) return null;

  function handleSubmit() {
    if (semesterId === "") return;
    submitBatch.mutate(
      { semesterId, offeringGroupIds: draftGroupIds },
      {
        onSuccess: (result) => {
          clearDraft();
          toast.success(
            `Submitted ${result.items.length} request${result.items.length === 1 ? "" : "s"}.`,
          );
        },
      },
    );
  }

  return (
    <div className="sticky bottom-6 z-20 mt-8">
      <div className="surface-frosted flex flex-wrap items-center justify-between gap-4 rounded-[30px] px-6 py-4">
        <div className="flex flex-col">
          <span className="text-body font-medium text-ink-black">
            {draftGroupIds.length} of {MAX_DRAFT_SELECTION} electives selected
          </span>
          <span
            className={cn(
              "text-body-sm",
              limitWarning ? "text-spectrum-gradient" : "text-graphite",
            )}
          >
            {limitWarning
              ? `You can request at most ${MAX_DRAFT_SELECTION} electives per semester.`
              : "Add up to 4, then submit your plan before the window closes."}
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="soft"
            onClick={clearDraft}
            disabled={submitBatch.isPending}
          >
            Clear
          </Button>
          <Button onClick={handleSubmit} disabled={submitBatch.isPending}>
            {submitBatch.isPending ? <Spinner /> : "Submit plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
