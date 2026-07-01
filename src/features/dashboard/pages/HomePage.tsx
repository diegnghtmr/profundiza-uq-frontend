import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, StatusBadge } from "@/shared/components/ui";
import { useUiStore } from "@/shared/stores/uiStore";
import { useCurrentUser } from "@/features/auth/api/authApi";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { useActiveEnrollmentWindow } from "@/shared/api/windowsApi";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import { useMyRequests } from "@/features/enrollment/api/requestsApi";
import {
  computeRequestStats,
  MAX_ACTIVE_REQUESTS,
} from "@/shared/lib/requestStats";
import { useCountdown } from "@/shared/lib/countdown";

const HOME_REQUEST_LIMIT = 3;

/** Container: composes the student's greeting, window hero, stats and requests. */
export function HomePage() {
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const { data: user } = useCurrentUser();
  const semester = useActiveSemester();
  const window = useActiveEnrollmentWindow(semesterId);
  const { data: requests } = useMyRequests(semesterId);
  const labels = useRequestLabels();

  const stats = useMemo(() => computeRequestStats(requests), [requests]);
  const recent = (requests ?? []).slice(0, HOME_REQUEST_LIMIT);

  const firstName = firstNameOf(user?.fullName);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <p className="text-body-sm text-slate">
          {formatToday()}
          {semester ? ` · ${semester.code}` : ""}
        </p>
        <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </header>

      <WindowHero
        windowName={window?.name}
        startsAt={window?.startsAt}
        endsAt={window?.endsAt}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active requests this semester"
          value={`${stats.active} / ${MAX_ACTIVE_REQUESTS}`}
          hint={`${Math.max(0, MAX_ACTIVE_REQUESTS - stats.active)} remaining`}
        />
        <StatCard
          label="Accepted"
          value={String(stats.accepted)}
          hint="Counts toward your academic max of 4"
        />
        <StatCard
          label="On waitlist"
          value={String(stats.waitlist)}
          hint="Same & opposite shift"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-heading-sm font-normal tracking-[-0.44px] text-ink-black">
            Your requests
          </h2>
          <Link
            to="/app/requests"
            className="text-body-sm text-ink-black underline decoration-ink-black/25 underline-offset-[3px] hover:decoration-ink-black"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="rounded-[20px] surface-frosted px-5 py-8 text-center text-body-sm text-slate">
            You have no requests yet. Browse the catalog to add up to 4.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recent.map((request) => {
              const label = labels.get(request.offeringGroupId);
              return (
                <li
                  key={request.id}
                  className="surface-frosted flex items-center gap-4 rounded-[20px] px-5 py-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body-sm font-medium text-ink-black">
                      {label?.elective ?? "Elective"}
                    </span>
                    <span className="truncate text-body-sm text-slate">
                      {label
                        ? `${label.group} · ${label.schedule}`
                        : request.offeringGroupId}
                    </span>
                  </div>
                  <StatusBadge status={request.status} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function WindowHero({
  windowName,
  startsAt,
  endsAt,
}: {
  windowName?: string;
  startsAt?: string;
  endsAt?: string;
}) {
  const now = Date.now();
  const isOpen =
    startsAt !== undefined &&
    endsAt !== undefined &&
    Date.parse(startsAt) <= now &&
    now < Date.parse(endsAt);
  const target = isOpen ? endsAt : startsAt;
  const countdown = useCountdown(target);
  const hasWindow = windowName !== undefined && target !== undefined;

  return (
    <Card className="ambient-glow relative overflow-hidden">
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-ink-black/[0.04] px-3 py-1.5 text-body-sm text-graphite">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-spectrum-gradient"
            />
            {hasWindow
              ? `${windowName} · ${isOpen ? "open now" : "opens soon"}`
              : "Enrollment window"}
          </span>

          {hasWindow ? (
            <>
              <span className="text-body-sm text-ash">
                {isOpen
                  ? "Time remaining to submit requests"
                  : "Opens in"}
              </span>
              <span className="text-[54px] font-light leading-none tracking-[-2.16px] tabular-nums text-ink-black">
                {countdown}
              </span>
              <span className="mt-1.5 text-body-sm text-slate">
                {isOpen ? "Closes" : "Opens"} {formatWindowMoment(target!)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[54px] font-light leading-none tracking-[-2.16px] text-ink-black">
                No open window
              </span>
              <span className="mt-1.5 text-body-sm text-slate">
                There's no enrollment window open right now. You can still browse
                the catalog — submissions reopen when the next window starts.
              </span>
            </>
          )}
        </div>

        <Link
          to="/app/offerings"
          className="inline-flex h-12 items-center justify-center rounded-[30px] bg-ink-black px-6 text-body-sm font-medium text-snow transition-opacity duration-200 ease-out hover:opacity-85"
        >
          Browse offerings →
        </Link>
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-frosted rounded-3xl px-6 py-5">
      <p className="mb-3 text-body-sm text-ash">{label}</p>
      <p className="text-[34px] font-light leading-none tracking-[-1px] text-ink-black">
        {value}
      </p>
      <p className="mt-2 text-body-sm text-slate">{hint}</p>
    </div>
  );
}

/** Maps offering group ids to human labels using the catalog query. */
function useRequestLabels() {
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const { data: offerings } = useOfferings(semesterId);

  return useMemo(() => {
    const map = new Map<
      string,
      { elective: string; group: string; schedule: string }
    >();
    for (const offering of offerings ?? []) {
      for (const group of offering.groups) {
        map.set(group.id, {
          elective: offering.elective.name,
          group: group.groupCode,
          schedule: group.scheduleText,
        });
      }
    }
    return map;
  }, [offerings]);
}

function firstNameOf(fullName: string | undefined): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatWindowMoment(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
