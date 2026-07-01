import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "./client";
import type { Semester } from "./types";

export const semestersKeys = {
  all: ["semesters"] as const,
};

/** GET /semesters returns a plain array (not a paged envelope). */
function fetchSemesters(): Promise<Semester[]> {
  return fetchClient<Semester[]>("/semesters");
}

export function useSemesters() {
  return useQuery({
    queryKey: semestersKeys.all,
    queryFn: fetchSemesters,
    staleTime: 5 * 60_000,
  });
}

/** The single ACTIVE semester, or undefined while loading / when none is open. */
export function useActiveSemester(): Semester | undefined {
  const { data } = useSemesters();
  return data?.find((s) => s.status === "ACTIVE");
}
