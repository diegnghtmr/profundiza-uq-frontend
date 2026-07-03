import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface TooltipProps {
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
  className?: string;
}

/**
 * Accessible tooltip built on Radix. Supplementary detail only — the trigger
 * MUST already carry its own visible/accessible label (CC-A11Y: tooltip
 * content is never the only path to complete a workflow). `delayDuration={0}`
 * so keyboard focus reveals content immediately, matching hover behavior.
 */
export function Tooltip({ content, side = "top", children, className }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={0}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className={cn(
              "surface-frosted z-50 rounded-[16px] px-3 py-1.5 text-body-sm text-ink-black focus:outline-none",
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-snow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
