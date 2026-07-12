import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Footer actions (buttons). Rendered right-aligned. */
  footer?: ReactNode;
}

/**
 * Accessible modal dialog built on Radix. Used for cancellation confirmations
 * and the mandatory-reason admin decision flow. Surface follows the frosted card.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink-black/20 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "surface-frosted rounded-[30px] p-8 focus:outline-none",
          )}
        >
          <RadixDialog.Title className="shrink-0 text-heading-sm font-medium tracking-[-0.44px] text-ink-black">
            {title}
          </RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="mt-2 shrink-0 text-body text-graphite">
              {description}
            </RadixDialog.Description>
          ) : null}
          {/* Body scrolls; title and footer stay pinned so long content (e.g. a
              large prerequisites list) never pushes the dialog past the viewport.
              min-h-0 lets this flex child shrink below its content to enable scroll. */}
          {children ? (
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto">{children}</div>
          ) : null}
          {footer ? (
            <div className="mt-8 flex shrink-0 justify-end gap-3">{footer}</div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
