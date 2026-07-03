import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import type {
  ElectiveOfferingSummary,
  OfferingPrerequisite,
} from "@/shared/api/types";

export const offeringsKeys = {
  all: ["offerings"] as const,
  list: (semesterId: string) => ["offerings", "list", semesterId] as const,
  prerequisites: (offeringId: string) =>
    ["offerings", "prerequisites", offeringId] as const,
};

/**
 * Catalog of offerings for a semester. The list endpoint returns lightweight
 * summaries (`{ items: ElectiveOfferingSummary[] }`); prerequisites are loaded
 * on demand from the dedicated endpoint (see {@link useOfferingPrerequisites}).
 */
function fetchOfferings(
  semesterId: string,
  signal?: AbortSignal,
): Promise<ElectiveOfferingSummary[]> {
  return fetchClient<{ items: ElectiveOfferingSummary[] }>("/offerings", {
    query: { semesterId },
    signal,
  }).then((r) => r.items);
}

export function useOfferings(semesterId: string) {
  return useQuery({
    queryKey: offeringsKeys.list(semesterId),
    queryFn: ({ signal }) => fetchOfferings(semesterId, signal),
    enabled: semesterId !== "",
  });
}

/** Effective prerequisites for one offering. Enabled lazily (e.g. on dialog open). */
export function useOfferingPrerequisites(offeringId: string, enabled: boolean) {
  return useQuery({
    queryKey: offeringsKeys.prerequisites(offeringId),
    queryFn: ({ signal }) =>
      fetchClient<{ items: OfferingPrerequisite[] }>(
        `/offerings/${offeringId}/prerequisites`,
        { signal },
      ).then((r) => r.items),
    enabled: enabled && offeringId !== "",
  });
}

/** Distinct elective areas, derived for the area filter chips. */
export function deriveAreas(offerings: ElectiveOfferingSummary[]): string[] {
  return Array.from(new Set(offerings.map((o) => o.elective.area))).sort();
}
