import { Skeleton } from "@/shared/components/ui";

export interface NotificationsSkeletonProps {
  /** Number of placeholder rows rendered. */
  count?: number;
}

/**
 * Structure-aware loading placeholder for the notifications list (FR-003),
 * mirroring each row's unread dot + title/body shape. Feature-local: this
 * shape is specific to the notifications list.
 */
export function NotificationsSkeleton({ count = 4 }: NotificationsSkeletonProps) {
  return (
    <div aria-hidden="true">
      <ul aria-busy="true" className="flex flex-col gap-2.5">
        {Array.from({ length: count }, (_, index) => (
          <li
            key={index}
            className="surface-frosted flex items-start gap-3.5 rounded-[20px] px-5 py-4"
          >
            <Skeleton className="mt-1.5 size-2 shrink-0" rounded="full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
