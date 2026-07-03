import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";
import { FadeIn } from "./FadeIn";

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
 *
 * Close is fully controlled by the parent via `open`/`onOpenChange` (like
 * Dialog.tsx): the confirm Action calls `preventDefault()` to suppress Radix's
 * built-in auto-close, so an async `onConfirm` can keep the dialog open (e.g.
 * show a spinner via `confirmLabel` + `confirmDisabled`) and close it only once
 * the work settles. Cancel and Escape still close immediately.
 *
 * The card enters via `FadeIn` (FR-006): a subtle opacity+drift transition,
 * reduced-motion aware, that never blocks the confirm/cancel actions from
 * being clicked immediately.
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
            "focus:outline-none",
          )}
        >
          <FadeIn className="surface-frosted rounded-[30px] p-8">
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
                  onClick={(event) => {
                    // Suppress Radix's default auto-close; the parent owns close
                    // via `open` so async confirms can show pending state.
                    event.preventDefault();
                    onConfirm();
                  }}
                >
                  {confirmLabel}
                </Button>
              </RadixAlertDialog.Action>
            </div>
          </FadeIn>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}
