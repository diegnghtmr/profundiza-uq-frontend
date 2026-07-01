import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "./client";
import type { NotificationsPage } from "./types";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (page: number, pageSize: number) =>
    ["notifications", page, pageSize] as const,
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

function fetchNotifications(
  page: number,
  pageSize: number,
): Promise<NotificationsPage> {
  return fetchClient<NotificationsPage>("/notifications", {
    query: { page, pageSize },
  });
}

export function useNotifications(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  return useQuery({
    queryKey: notificationsKeys.list(page, pageSize),
    queryFn: () => fetchNotifications(page, pageSize),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchClient<void>(`/notifications/${notificationId}/read`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
