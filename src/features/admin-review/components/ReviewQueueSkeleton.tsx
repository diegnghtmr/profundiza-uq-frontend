import { Skeleton } from "@/shared/components/ui";

export interface ReviewQueueSkeletonProps {
  /** Number of placeholder request rows rendered below the group panel. */
  count?: number;
}

/**
 * Structure-aware loading placeholder for the review queue (FR-003),
 * mirroring the group panel (selector + capacity bar + stat grid) and the
 * request-row list shape. Feature-local: this shape is specific to the
 * admin review queue.
 */
export function ReviewQueueSkeleton({ count = 4 }: ReviewQueueSkeletonProps) {
  return (
    <div aria-hidden="true">
      <div aria-busy="true" className="flex flex-col gap-8">
        <div className="surface-frosted flex flex-col gap-5 rounded-[30px] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Skeleton className="h-11 w-72" rounded="lg" />
            <Skeleton className="h-9 w-40" rounded="lg" />
          </div>
          <Skeleton className="h-1.5 w-full" rounded="full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {Array.from({ length: count }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
