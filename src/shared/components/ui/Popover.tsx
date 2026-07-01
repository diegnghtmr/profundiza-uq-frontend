import * as RadixPopover from "@radix-ui/react-popover";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type PopoverProps = ComponentPropsWithoutRef<typeof RadixPopover.Root>;
export type PopoverTriggerProps = ComponentPropsWithoutRef<
  typeof RadixPopover.Trigger
>;

/** Root — holds open/close state. Owns no styling; delegates to Radix. */
export function Popover(props: PopoverProps) {
  return <RadixPopover.Root {...props} />;
}

/** Trigger — pass `asChild` to render your own trigger element. */
export function PopoverTrigger(props: PopoverTriggerProps) {
  return <RadixPopover.Trigger {...props} />;
}

export interface PopoverContentProps {
  title?: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
  children?: ReactNode;
  className?: string;
}

/**
 * Accessible popover content built on Radix (role="dialog" by default).
 * When `title`/`description` are given, they are wired to
 * `aria-labelledby`/`aria-describedby` (FR-005 scenario 3), mirroring
 * Dialog.tsx's title/description contract.
 */
export function PopoverContent({
  title,
  description,
  side = "bottom",
  children,
  className,
}: PopoverContentProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        side={side}
        sideOffset={8}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "surface-frosted z-50 w-[min(92vw,320px)] rounded-[20px] p-4 focus:outline-none",
          className,
        )}
      >
        {title ? (
          <p id={titleId} className="text-body font-medium text-ink-black">
            {title}
          </p>
        ) : null}
        {description ? (
          <p id={descriptionId} className="mt-1 text-body-sm text-graphite">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className={title || description ? "mt-3" : undefined}>
            {children}
          </div>
        ) : null}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}
