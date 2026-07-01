import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "./client";

/**
 * Shared TanStack Query client. Server data lives here exclusively; UI-only state
 * belongs in the Zustand store. Do not retry client errors (4xx) — they are
 * deterministic and a retry just delays the user-facing error.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
