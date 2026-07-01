import { Logo } from "./Logo";
import { Badge } from "@/shared/components/ui";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { useNotifications } from "@/shared/api/notificationsApi";
import { useActiveEnrollmentWindow } from "@/shared/api/windowsApi";
import { useUiStore } from "@/shared/stores/uiStore";
import { useCountdown } from "@/shared/lib/countdown";

/**
 * Sticky frosted top bar: logo left, center status pills (active semester, an
 * optional live enrollment-window countdown, and unread alerts). The window
 * pill only appears while a window is genuinely open — no fake deadline.
 */
export function TopBar() {
  const semester = useActiveSemester();
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const window = useActiveEnrollmentWindow(semesterId);
  const { data: notifications } = useNotifications();
  const unread = notifications?.unread ?? 0;

  const now = Date.now();
  const windowOpen =
    window !== undefined &&
    Date.parse(window.startsAt) <= now &&
    now < Date.parse(window.endsAt);
  const countdown = useCountdown(windowOpen ? window?.endsAt : undefined);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-4 bg-fog/80 px-6 backdrop-blur-[24px]">
      <Logo />

      <div className="flex items-center gap-2">
        {semester ? (
          <Badge dotColor="#0358f7">
            {semester.code} · {titleCase(semester.status)}
          </Badge>
        ) : (
          <Badge tone="muted">No active semester</Badge>
        )}

        {windowOpen ? (
          <Badge dotColor="#fa3d1d">
            <span className="text-ash">Window closes in</span>
            <span className="font-medium tabular-nums text-ink-black">
              {countdown}
            </span>
          </Badge>
        ) : null}

        {unread > 0 ? (
          <Badge>
            <span className="text-slate">Alerts</span>
            <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-spectrum-gradient text-caption font-medium text-snow">
              {unread}
            </span>
          </Badge>
        ) : null}
      </div>
    </header>
  );
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
