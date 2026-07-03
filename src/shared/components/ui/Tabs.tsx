import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

export type TabsProps = ComponentPropsWithoutRef<typeof RadixTabs.Root>;

/** Root — holds the active tab value. Owns no styling; delegates to Radix. */
export function Tabs(props: TabsProps) {
  return <RadixTabs.Root {...props} />;
}

export type TabsListProps = ComponentPropsWithoutRef<typeof RadixTabs.List>;

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        "flex items-center gap-1 border-b border-ink-black/[0.06]",
        className,
      )}
      {...props}
    />
  );
}

export type TabsTriggerProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger>;

/** Data-state active gets an ink-black underline — no color-coded meaning. */
export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "relative px-4 py-2.5 text-body-sm text-graphite outline-none",
        "transition-colors duration-200 ease-out",
        "after:absolute after:inset-x-4 after:-bottom-px after:h-px after:bg-transparent",
        "data-[state=active]:font-medium data-[state=active]:text-ink-black",
        "data-[state=active]:after:bg-ink-black",
        className,
      )}
      {...props}
    />
  );
}

export type TabsContentProps = ComponentPropsWithoutRef<typeof RadixTabs.Content>;

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <RadixTabs.Content
      className={cn("pt-5 focus:outline-none", className)}
      {...props}
    />
  );
}
