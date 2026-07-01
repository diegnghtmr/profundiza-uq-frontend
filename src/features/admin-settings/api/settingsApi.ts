import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import { errorMessage } from "@/shared/lib/apiErrors";
import { toast } from "@/shared/stores/toastStore";

// ---------------------------------------------------------------------------
// Types co-located with this feature (the shared types module is not edited).
// Shapes mirror the Go DTOs in internal/settings/adapter/http/handler.go.
// ---------------------------------------------------------------------------

/** Any JSON value a setting can hold (the column is JSONB). */
export type SettingValue =
  | string
  | number
  | boolean
  | null
  | SettingValue[]
  | { [key: string]: SettingValue };

/** A single global setting (GlobalSetting schema). */
export interface GlobalSetting {
  key: string;
  value: SettingValue;
  description: string;
  updatedByAdminUserId: string | null;
  updatedAt: string;
}

/** Response of GET /admin/global-settings (paged envelope). */
interface GlobalSettingsPage {
  items: GlobalSetting[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Body of PATCH/PUT /admin/global-settings/{settingKey}. The backend rejects
 * unknown fields, a null/empty value, and a reason shorter than 3 characters.
 */
export interface UpdateSettingInput {
  key: string;
  value: SettingValue;
  reason: string;
}

/** Minimum reason length enforced by the settings domain (MinReasonLength). */
export const MIN_REASON_LENGTH = 3;

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const settingsKeys = {
  all: ["global-settings"] as const,
  list: () => ["global-settings", "list"] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** A generous page size: settings are browsed as one list for the MVP. */
const LIST_PAGE_SIZE = 100;

function fetchSettings(): Promise<GlobalSetting[]> {
  return fetchClient<GlobalSettingsPage>("/admin/global-settings", {
    query: { pageSize: LIST_PAGE_SIZE },
  }).then((page) => page.items);
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: fetchSettings,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, reason }: UpdateSettingInput) =>
      fetchClient<GlobalSetting>(`/admin/global-settings/${key}`, {
        method: "PATCH",
        body: { value, reason },
      }),
    onSuccess: (setting) => {
      qc.invalidateQueries({ queryKey: settingsKeys.all });
      toast.success(`Setting "${setting.key}" updated.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
