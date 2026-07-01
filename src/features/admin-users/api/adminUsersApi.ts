import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import { notify } from "@/shared/lib/notify";

// ---------------------------------------------------------------------------
// Types co-located with this feature (the shared types module is not edited).
// Shapes mirror the Go DTOs in internal/adminuser/adapter/http/handler.go.
// ---------------------------------------------------------------------------

/** Administrative role (OpenAPI AdminRole enum). */
export type AdminRole = "ADMIN" | "SUPER_ADMIN";

/** Account status (OpenAPI AdminStatus enum). */
export type AdminStatus = "ACTIVE" | "INACTIVE";

/** A single administrative user (AdminUser schema). */
export interface AdminUser {
  id: string;
  institutionalEmail: string;
  fullName: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt: string;
  updatedAt: string;
}

/** Response of GET /admin/users (paged envelope). */
interface AdminUsersPage {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
}

/** Server-side filters for GET /admin/users. Empty values are omitted. */
export interface AdminFilters {
  role?: AdminRole | "";
  status?: AdminStatus | "";
}

/** Body of POST /admin/users (CreateAdminUserRequest). */
export interface CreateAdminInput {
  institutionalEmail: string;
  fullName: string;
  role: AdminRole;
}

/**
 * Body of PATCH /admin/users/{id}. The backend rejects unknown fields, so only
 * the fields being changed are sent.
 */
export interface UpdateAdminInput {
  fullName?: string;
  role?: AdminRole;
  status?: AdminStatus;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (filters: AdminFilters) => ["admin-users", "list", filters] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** A generous page size: the admin list is browsed, not paginated, for the MVP. */
const LIST_PAGE_SIZE = 100;

function fetchAdmins(filters: AdminFilters): Promise<AdminUser[]> {
  return fetchClient<AdminUsersPage>("/admin/users", {
    query: {
      pageSize: LIST_PAGE_SIZE,
      role: filters.role || undefined,
      status: filters.status || undefined,
    },
  }).then((page) => page.items);
}

export function useAdmins(filters: AdminFilters) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: () => fetchAdmins(filters),
    placeholderData: (previous) => previous,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminInput) =>
      fetchClient<AdminUser>("/admin/users", { method: "POST", body: input }),
    onSuccess: (admin) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      notify.success(`${admin.fullName} was added.`);
    },
    onError: (error) => notify.error(error),
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateAdminInput }) =>
      fetchClient<AdminUser>(`/admin/users/${id}`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (admin) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      notify.success(`${admin.fullName} was updated.`);
    },
    onError: (error) => notify.error(error),
  });
}
