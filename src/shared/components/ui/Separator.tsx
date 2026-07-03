import * as RadixSeparator from "@radix-ui/react-separator";
import { cn } from "@/shared/lib/cn";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  /** Purely visual, no semantic meaning — hides the separator from assistive tech. */
  decorative?: boolean;
  className?: string;
}

/**
 * Accessible divider built on Radix. Non-decorative by default (exposes
 * `role="separator"`/`aria-orientation`) since a divider between real
 * content sections carries structural meaning; pass `decorative` for a
 * purely visual rule.
 */
export function Separator({
  orientation = "horizontal",
  decorative = false,
  className,
}: SeparatorProps) {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "bg-pebble",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}
