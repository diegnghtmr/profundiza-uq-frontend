import { Skeleton } from "@/shared/components/ui";

export interface ReportsSkeletonProps {
  /** Number of placeholder export rows rendered. */
  count?: number;
}

/**
 * Structure-aware loading placeholder for the recent-exports table (FR-003),
 * mirroring the type/format/status/requested/download row shape. Feature-local:
 * this row shape is specific to the admin reports export list.
 */
export function ReportsSkeleton({ count = 4 }: ReportsSkeletonProps) {
  return (
    <div aria-hidden="true">
      <div
        aria-busy="true"
        className="surface-frosted flex flex-col divide-y divide-ink-black/[0.04] overflow-hidden rounded-[30px]"
      >
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-6 w-20" rounded="full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-9 w-24" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
