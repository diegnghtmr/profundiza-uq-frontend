import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

export type AlertDialogTone = "default" | "danger";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm: () => void;
  /** Disable the confirm action (e.g. while a mutation is pending). */
  confirmDisabled?: boolean;
  tone?: AlertDialogTone;
}

/**
 * Accessible destructive-confirm dialog built on Radix, mirroring Dialog.tsx's
 * title/description aria contract (Radix wires aria-labelledby/aria-describedby
 * to Title/Description automatically). `danger` tone renders the confirm
 * action via Button's `danger` variant — a bordered accent, never a saturated
 * fill (CC-VISUAL).
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  confirmDisabled = false,
  tone = "default",
}: AlertDialogProps) {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className="fixed inset-0 z-40 bg-ink-black/20 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <RadixAlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2",
            "surface-frosted rounded-[30px] p-8 focus:outline-none",
          )}
        >
          <RadixAlertDialog.Title className="text-heading-sm font-medium tracking-[-0.44px] text-ink-black">
            {title}
          </RadixAlertDialog.Title>
          {description ? (
            <RadixAlertDialog.Description className="mt-2 text-body text-graphite">
              {description}
            </RadixAlertDialog.Description>
          ) : null}
          <div className="mt-8 flex justify-end gap-3">
            <RadixAlertDialog.Cancel asChild>
              <Button variant="soft">{cancelLabel}</Button>
            </RadixAlertDialog.Cancel>
            <RadixAlertDialog.Action asChild>
              <Button
                variant={tone === "danger" ? "danger" : "neutral"}
                disabled={confirmDisabled}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}
