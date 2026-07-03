import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type DropdownMenuProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Root
>;
export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Trigger
>;

/** Root — holds open/close state. Owns no styling; delegates to Radix. */
export function DropdownMenu(props: DropdownMenuProps) {
  return <RadixDropdownMenu.Root {...props} />;
}

/** Trigger — pass `asChild` to render your own trigger element. */
export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
  return <RadixDropdownMenu.Trigger {...props} />;
}

export interface DropdownMenuContentProps {
  children?: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Accessible menu content built on Radix (FR-005 scenario 4: keyboard open,
 * arrow-key roving focus through items, Escape closes — all delegated to
 * Radix's built-in behavior).
 */
export function DropdownMenuContent({
  children,
  className,
  align = "end",
  side = "bottom",
}: DropdownMenuContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        align={align}
        side={side}
        sideOffset={6}
        className={cn(
          "surface-frosted z-50 min-w-[180px] rounded-[16px] p-1.5 focus:outline-none",
          className,
        )}
      >
        {children}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  );
}

export type DropdownMenuItemProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Item
>;

export function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-body-sm text-ink-black/85 outline-none transition-colors duration-150 ease-out",
        "data-[highlighted]:bg-ink-black/[0.05]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <RadixDropdownMenu.Separator className={cn("my-1 h-px bg-pebble", className)} />
  );
}

export type DropdownMenuLabelProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Label
>;

export function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return (
    <RadixDropdownMenu.Label
      className={cn(
        "px-3 py-1.5 text-caption font-medium uppercase tracking-wide text-slate",
        className,
      )}
      {...props}
    />
  );
}
