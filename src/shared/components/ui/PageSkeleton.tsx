import { cn } from "@/shared/lib/cn";
import { Skeleton } from "./Skeleton";

export interface PageSkeletonProps {
  /** Number of body-line/card skeletons rendered below the header skeleton. */
  lines?: number;
  className?: string;
}

/**
 * Structure-aware page-level loading placeholder (FR-003), used in place of a
 * central spinner while primary page data loads. The outer wrapper is
 * `aria-hidden` (purely decorative); the inner container is `aria-busy` so
 * assistive tech announces the pending region without reading placeholder
 * shapes.
 */
export function PageSkeleton({ lines = 3, className }: PageSkeletonProps) {
  return (
    <div aria-hidden="true">
      <div aria-busy="true" className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-1/3" rounded="lg" />
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" rounded="lg" />
        ))}
      </div>
    </div>
  );
}
