import { cn } from "@/shared/lib/cn";

export type SkeletonRounded = "sm" | "lg" | "full";

export interface SkeletonProps {
  className?: string;
  rounded?: SkeletonRounded;
}

const ROUNDED: Record<SkeletonRounded, string> = {
  sm: "rounded-lg",
  lg: "rounded-2xl",
  full: "rounded-full",
};

/**
 * Decorative loading placeholder (FR-003). Non-interactive and hidden from
 * assistive tech — the pulse animation is a purely visual loading signal.
 */
export function Skeleton({ className, rounded = "sm" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse bg-fog", ROUNDED[rounded], className)}
    />
  );
}
