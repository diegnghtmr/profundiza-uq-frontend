import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "./client";
import { useNow } from "@/shared/lib/useNow";
import type { EnrollmentWindow, EnrollmentWindowsPage } from "./types";

export const windowsKeys = {
  all: ["enrollment-windows"] as const,
  list: (semesterId: string) =>
    ["enrollment-windows", "list", semesterId] as const,
};

/** GET /enrollment-windows returns `{ items: EnrollmentWindow[] }`. */
function fetchWindows(
  semesterId: string,
  signal?: AbortSignal,
): Promise<EnrollmentWindow[]> {
  return fetchClient<EnrollmentWindowsPage>("/enrollment-windows", {
    query: { semesterId },
    signal,
  }).then((r) => r.items);
}

export function useEnrollmentWindows(semesterId: string) {
  return useQuery({
    queryKey: windowsKeys.list(semesterId),
    queryFn: ({ signal }) => fetchWindows(semesterId, signal),
    enabled: semesterId !== "",
    staleTime: 60_000,
  });
}

/**
 * The enrollment window the student should act on right now: an ACTIVE window
 * whose [startsAt, endsAt] interval contains the current instant. Falls back to
 * the next ACTIVE window that has not closed yet, so the hero can still render a
 * sensible "opens soon" deadline. Returns `undefined` while loading or when no
 * relevant window exists (degrade gracefully — never fabricate a deadline).
 */
export function useActiveEnrollmentWindow(
  semesterId: string,
): EnrollmentWindow | undefined {
  const { data } = useEnrollmentWindows(semesterId);
  const now = useNow();
  if (!data) return undefined;

  const active = data.filter((w) => w.status === "ACTIVE");

  const open = active.find(
    (w) =>
      Date.parse(w.startsAt) <= now && now < Date.parse(w.endsAt),
  );
  if (open) return open;

  return active
    .filter((w) => Date.parse(w.endsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
}
