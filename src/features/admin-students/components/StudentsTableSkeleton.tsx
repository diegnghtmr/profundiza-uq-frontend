import { Skeleton } from "@/shared/components/ui";

export interface StudentsTableSkeletonProps {
  /** Number of placeholder rows rendered. */
  count?: number;
}

/**
 * Structure-aware loading placeholder for the students table (FR-003),
 * mirroring the table's name/document/shift/completed/status column shape.
 * Feature-local: this row shape is specific to the admin students table.
 */
export function StudentsTableSkeleton({ count = 6 }: StudentsTableSkeletonProps) {
  return (
    <div aria-hidden="true">
      <div
        aria-busy="true"
        className="surface-frosted flex flex-col divide-y divide-ink-black/[0.04] overflow-hidden rounded-[30px]"
      >
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-6 px-6 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" rounded="full" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-6 w-16" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}
