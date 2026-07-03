import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import { offeringsKeys } from "@/features/catalog/api/offeringsApi";
import { notify } from "@/shared/lib/notify";
import type {
  Elective,
  OfferingGroup,
  OfferingPrerequisite,
} from "@/shared/api/types";

// ---------------------------------------------------------------------------
// New request/response shapes (co-located to avoid editing shared types.ts).
// They mirror the Go admin handler DTOs in
// backend/internal/catalog/adapter/http/admin_handler.go.
// ---------------------------------------------------------------------------

/** Body for POST /electives. */
export interface CreateElectiveInput {
  name: string;
  area: string;
  description: string;
}

/** Body for POST /electives/{id}/prerequisites. `planType` is optional. */
export interface CreatePrerequisiteInput {
  name: string;
  description: string;
  planType?: string;
}

/**
 * Body for POST /offering-groups/{id}/capacity-adjustments. Capacity is NOT
 * editable via PATCH /offering-groups/{id} (that endpoint only updates code,
 * teacher, schedule and status); seat counts must always carry an audit reason,
 * which is exactly what the dedicated capacity-adjustments endpoint enforces.
 */
export interface AdjustCapacityInput {
  groupId: string;
  newCapacity: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const catalogAdminKeys = {
  all: ["admin-catalog"] as const,
  electives: (q: string, area: string) =>
    ["admin-catalog", "electives", { q, area }] as const,
  electivePrerequisites: (electiveId: string) =>
    ["admin-catalog", "electives", electiveId, "prerequisites"] as const,
};

// ---------------------------------------------------------------------------
// Electives
// ---------------------------------------------------------------------------

/** All electives (admin catalog). The list envelope is unwrapped to items. */
export function useElectives(q = "", area = "") {
  return useQuery({
    queryKey: catalogAdminKeys.electives(q, area),
    queryFn: ({ signal }) =>
      fetchClient<{ items: Elective[] }>("/electives", {
        query: {
          q: q.trim() || undefined,
          area: area || undefined,
        },
        signal,
      }).then((r) => r.items),
  });
}

/** Create an elective, then refresh every elective list variant. */
export function useCreateElective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateElectiveInput) =>
      fetchClient<Elective>("/electives", { method: "POST", body: input }),
    onSuccess: (elective) => {
      qc.invalidateQueries({ queryKey: catalogAdminKeys.all });
      notify.success(`Elective “${elective.name}” created.`);
    },
    onError: (error) => notify.error(error),
  });
}

// ---------------------------------------------------------------------------
// Elective prerequisites
// ---------------------------------------------------------------------------

/** Default prerequisites declared on an elective. Loaded lazily (dialog open). */
export function useElectivePrerequisites(electiveId: string, enabled: boolean) {
  return useQuery({
    queryKey: catalogAdminKeys.electivePrerequisites(electiveId),
    queryFn: ({ signal }) =>
      fetchClient<{ items: OfferingPrerequisite[] }>(
        `/electives/${electiveId}/prerequisites`,
        { signal },
      ).then((r) => r.items),
    enabled: enabled && electiveId !== "",
  });
}

/** Add a default prerequisite to an elective and refresh its list. */
export function useCreatePrerequisite(electiveId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePrerequisiteInput) =>
      fetchClient<OfferingPrerequisite>(
        `/electives/${electiveId}/prerequisites`,
        { method: "POST", body: input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: catalogAdminKeys.electivePrerequisites(electiveId),
      });
      notify.success("Prerequisite added.");
    },
    onError: (error) => notify.error(error),
  });
}

// ---------------------------------------------------------------------------
// Offering groups — capacity
// ---------------------------------------------------------------------------

/**
 * Adjust a group's capacity through the audited capacity-adjustments endpoint.
 * `semesterId` is only used to invalidate the matching offerings list so the
 * new seat count is reflected immediately.
 */
export function useAdjustCapacity(semesterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, newCapacity, reason }: AdjustCapacityInput) =>
      fetchClient<OfferingGroup>(
        `/offering-groups/${groupId}/capacity-adjustments`,
        { method: "POST", body: { newCapacity, reason } },
      ),
    onSuccess: () => {
      if (semesterId !== "") {
        qc.invalidateQueries({ queryKey: offeringsKeys.list(semesterId) });
      }
      notify.success("Capacity updated.");
    },
    onError: (error) => notify.error(error),
  });
}
