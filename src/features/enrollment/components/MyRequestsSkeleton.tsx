import { Skeleton } from "@/shared/components/ui";

export interface MyRequestsSkeletonProps {
  /** Number of placeholder request cards rendered. */
  count?: number;
}

/**
 * Structure-aware loading placeholder for the requests list (FR-003),
 * mirroring each request Card's title/status/action row shape. Feature-local:
 * this shape is specific to the enrollment requests list.
 */
export function MyRequestsSkeleton({ count = 3 }: MyRequestsSkeletonProps) {
  return (
    <div aria-hidden="true">
      <div aria-busy="true" className="flex flex-col gap-4">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="surface-frosted flex items-center justify-between gap-4 rounded-[30px] p-8"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-9 w-24" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
