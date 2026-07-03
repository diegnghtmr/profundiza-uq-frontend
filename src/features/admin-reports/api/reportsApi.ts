import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import { notify } from "@/shared/lib/notify";

// ---------------------------------------------------------------------------
// Types co-located with this feature (the shared types module is not edited).
// Shapes mirror the Go DTOs in internal/reporting/adapter/http/handler.go.
// ---------------------------------------------------------------------------

/** Kind of report to generate (OpenAPI ReportType enum). */
export type ReportType =
  | "GENERAL_SEMESTER"
  | "BY_ELECTIVE"
  | "BY_GROUP"
  | "BY_STUDENT"
  | "WAITLIST"
  | "ACCEPTED_REQUESTS"
  | "REJECTED_REQUESTS"
  | "CANCELLED_REQUESTS"
  | "AUDIT"
  | "CAPACITY"
  | "ADMIN_REVIEW";

/** Output file format (OpenAPI ReportFormat enum). */
export type ReportFormat = "XLSX" | "PDF";

/**
 * Lifecycle of an export (OpenAPI ReportExportStatus enum). Note the terminal
 * "ready" state is COMPLETED, not READY; only COMPLETED exports are downloadable.
 */
export type ReportExportStatus =
  | "REQUESTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

/** A single report export row (ReportExport schema). */
export interface ReportExport {
  id: string;
  semesterId: string | null;
  requestedByAdminUserId: string;
  reportType: ReportType;
  format: ReportFormat;
  status: ReportExportStatus;
  filters: Record<string, unknown> | null;
  filePath: string | null;
  /** Absolute API path (`/api/v1/reports/{id}/download`), present only when COMPLETED. */
  downloadUrl: string | null;
  failureReason: string | null;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** Response of GET /reports. */
interface ReportExportsPage {
  items: ReportExport[];
}

/** Body of POST /reports (CreateReportExportRequest). */
export interface CreateReportInput {
  semesterId: string;
  reportType: ReportType;
  format: ReportFormat;
  /** Optional per-type parameters; omitted (empty) for the MVP. */
  filters?: Record<string, unknown>;
}

/** Statuses that are still being worked on by the async worker. */
const PENDING_STATUSES: ReadonlySet<ReportExportStatus> = new Set([
  "REQUESTED",
  "PROCESSING",
]);

export function isReportPending(status: ReportExportStatus): boolean {
  return PENDING_STATUSES.has(status);
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const reportKeys = {
  all: ["reports"] as const,
  list: (semesterId: string) => ["reports", "list", semesterId] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

function fetchReports(
  semesterId: string,
  signal?: AbortSignal,
): Promise<ReportExport[]> {
  return fetchClient<ReportExportsPage>("/reports", {
    query: { semesterId },
    signal,
  }).then((page) => page.items);
}

/**
 * Report exports for a semester. While any row is still REQUESTED/PROCESSING the
 * query polls so a transition to COMPLETED/FAILED surfaces without a manual reload.
 */
export function useReports(semesterId: string) {
  return useQuery({
    queryKey: reportKeys.list(semesterId),
    queryFn: ({ signal }) => fetchReports(semesterId, signal),
    enabled: semesterId !== "",
    refetchInterval: (query) => {
      const rows = query.state.data;
      const anyPending = rows?.some((r) => isReportPending(r.status));
      return anyPending ? 4000 : false;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Request a new report export. The backend returns 202 Accepted and the worker
 * generates the file later, so we invalidate the list to start polling.
 */
export function useCreateReport(semesterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) =>
      fetchClient<ReportExport>("/reports", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.list(semesterId) });
      notify.success("Report requested. It will be ready shortly.");
    },
    onError: (error) => notify.error(error),
  });
}
