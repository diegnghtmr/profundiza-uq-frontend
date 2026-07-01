import { Skeleton } from "@/shared/components/ui";

export interface OfferingsSkeletonProps {
  /** Number of placeholder cards rendered. */
  count?: number;
}

/**
 * Structure-aware loading placeholder for the offerings grid (FR-003),
 * mirroring OfferingCard's frosted-card + group-row shape so the layout
 * doesn't jump once real offerings arrive. Feature-local: this shape is
 * specific to the catalog grid, not reused elsewhere.
 */
export function OfferingsSkeleton({ count = 3 }: OfferingsSkeletonProps) {
  return (
    <div aria-hidden="true">
      <div aria-busy="true" className="grid grid-cols-1 gap-6">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="surface-frosted flex flex-col gap-5 rounded-[30px] p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-36" rounded="lg" />
            </div>
            <Skeleton className="h-6 w-1/2" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" rounded="lg" />
              <Skeleton className="h-16 w-full" rounded="lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
