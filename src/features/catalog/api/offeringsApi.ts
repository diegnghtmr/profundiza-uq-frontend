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
function fetchOfferings(semesterId: string): Promise<ElectiveOfferingSummary[]> {
  return fetchClient<{ items: ElectiveOfferingSummary[] }>("/offerings", {
    query: { semesterId },
  }).then((r) => r.items);
}

export function useOfferings(semesterId: string) {
  return useQuery({
    queryKey: offeringsKeys.list(semesterId),
    queryFn: () => fetchOfferings(semesterId),
    enabled: semesterId !== "",
  });
}

/** Effective prerequisites for one offering. Enabled lazily (e.g. on dialog open). */
export function useOfferingPrerequisites(offeringId: string, enabled: boolean) {
  return useQuery({
    queryKey: offeringsKeys.prerequisites(offeringId),
    queryFn: () =>
      fetchClient<{ items: OfferingPrerequisite[] }>(
        `/offerings/${offeringId}/prerequisites`,
      ).then((r) => r.items),
    enabled: enabled && offeringId !== "",
  });
}

/** Distinct elective areas, derived for the area filter chips. */
export function deriveAreas(offerings: ElectiveOfferingSummary[]): string[] {
  return Array.from(new Set(offerings.map((o) => o.elective.area))).sort();
}
