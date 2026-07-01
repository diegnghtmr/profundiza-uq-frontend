import {
  useNotifications,
  useMarkNotificationRead,
} from "@/shared/api/notificationsApi";
import { Spinner } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeTime } from "../lib/relativeTime";
import type { Notification } from "@/shared/api/types";

/** Alert color used for the unread dot. */
const UNREAD_DOT = "#fa3d1d";

/** Container: lists the student's notifications and marks them read on click. */
export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const items = data?.items ?? [];
  const unread = items.filter((n) => n.readAt === null || n.readAt === undefined);

  function handleRead(notification: Notification) {
    if (notification.readAt) return;
    markRead.mutate(notification.id);
  }

  function handleReadAll() {
    for (const notification of unread) {
      markRead.mutate(notification.id);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
          Notifications
        </h1>
        {unread.length > 0 ? (
          <button
            type="button"
            onClick={handleReadAll}
            className="text-body-sm text-ink-black underline decoration-ink-black/25 underline-offset-[3px] hover:decoration-ink-black"
          >
            Mark all read
          </button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="surface-frosted rounded-[20px] px-5 py-10 text-center text-body-sm text-slate">
          You have no notifications yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={() => handleRead(notification)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const read = Boolean(notification.readAt);

  return (
    <li>
      <button
        type="button"
        onClick={onRead}
        aria-pressed={read}
        className={cn(
          "surface-frosted flex w-full items-start gap-3.5 rounded-[20px] px-5 py-4 text-left",
          "transition-opacity duration-200 ease-out",
          read ? "opacity-70" : "opacity-100",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            read ? "border-[1.5px] border-pebble" : "",
          )}
          style={read ? undefined : { backgroundColor: UNREAD_DOT }}
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body-sm font-medium tracking-[-0.1px] text-ink-black">
            {notification.title}
          </span>
          <span className="mt-0.5 text-body-sm leading-snug text-graphite">
            {notification.body}
          </span>
        </span>
        <span className="shrink-0 text-caption text-steel">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </button>
    </li>
  );
}
