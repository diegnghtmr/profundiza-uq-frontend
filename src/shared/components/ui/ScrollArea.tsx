import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}

/**
 * Scrollable container built on Radix ScrollArea. Renders children inside a
 * Viewport with a styled (monochrome, no saturated fill) Scrollbar/Thumb.
 */
export function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <RadixScrollArea.Root
      type="auto"
      className={cn("relative overflow-hidden", className)}
    >
      <RadixScrollArea.Viewport className={cn("h-full w-full", viewportClassName)}>
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        className="flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:w-2"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-pebble" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}
