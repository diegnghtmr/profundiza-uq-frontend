import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  DataState,
  EmptyState,
  SegmentedControl,
  Select,
  Spinner,
} from "@/shared/components/ui";
import type { BadgeTone } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { useUiStore } from "@/shared/stores/uiStore";
import { useActiveSemester } from "@/shared/api/semestersApi";
import {
  useCreateReport,
  useReports,
  type ReportExport,
  type ReportExportStatus,
  type ReportFormat,
  type ReportType,
} from "../api/reportsApi";
import { ReportsSkeleton } from "../components/ReportsSkeleton";

const REPORT_TYPE_OPTIONS: ReadonlyArray<{ value: ReportType; label: string }> = [
  { value: "GENERAL_SEMESTER", label: "General semester" },
  { value: "BY_ELECTIVE", label: "By elective" },
  { value: "BY_GROUP", label: "By group" },
  { value: "BY_STUDENT", label: "By student" },
  { value: "WAITLIST", label: "Waitlist" },
  { value: "ACCEPTED_REQUESTS", label: "Accepted requests" },
  { value: "REJECTED_REQUESTS", label: "Rejected requests" },
  { value: "CANCELLED_REQUESTS", label: "Cancelled requests" },
  { value: "AUDIT", label: "Audit" },
  { value: "CAPACITY", label: "Capacity" },
  { value: "ADMIN_REVIEW", label: "Admin review" },
];

const FORMAT_OPTIONS: ReadonlyArray<{ value: ReportFormat; label: string }> = [
  { value: "XLSX", label: "Excel" },
  { value: "PDF", label: "PDF" },
];

const REPORT_TYPE_LABELS: Record<ReportType, string> = Object.fromEntries(
  REPORT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ReportType, string>;

interface StatusVisual {
  label: string;
  tone: BadgeTone;
  dotColor?: string;
}

const STATUS_VISUALS: Record<ReportExportStatus, StatusVisual> = {
  REQUESTED: { label: "Requested", tone: "neutral", dotColor: "#ffb005" },
  PROCESSING: { label: "Processing", tone: "neutral", dotColor: "#0358f7" },
  COMPLETED: { label: "Completed", tone: "solid" },
  FAILED: { label: "Failed", tone: "muted", dotColor: "#fa3d1d" },
  EXPIRED: { label: "Expired", tone: "muted" },
};

export function ReportsPage() {
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const activeSemester = useActiveSemester();
  const {
    data: reports,
    isLoading,
    isError,
    error,
    refetch,
  } = useReports(semesterId);
  const createReport = useCreateReport(semesterId);

  const [reportType, setReportType] = useState<ReportType>("GENERAL_SEMESTER");
  const [format, setFormat] = useState<ReportFormat>("XLSX");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (semesterId === "") return;
    createReport.mutate({ semesterId, reportType, format });
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
          Reports
        </h1>
        <p className="max-w-2xl text-subheading text-graphite">
          Request data exports for the active semester. Generation runs in the
          background; the file becomes downloadable once it is ready.
        </p>
      </header>

      <Card className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-heading-sm font-medium tracking-[-0.44px] text-ink-black">
            New report
          </h2>
          <p className="text-body-sm text-slate">
            {activeSemester
              ? `Export scoped to ${activeSemester.name}.`
              : "Scoped to the active semester."}
          </p>
        </div>

        {semesterId === "" ? (
          <p className="text-body-sm text-slate">
            No active semester is open. Reports require an active semester.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Select
                label="Report type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                options={REPORT_TYPE_OPTIONS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-medium text-graphite">
                Format
              </span>
              <SegmentedControl
                options={FORMAT_OPTIONS}
                value={format}
                onChange={setFormat}
              />
            </div>
            <Button type="submit" disabled={createReport.isPending}>
              {createReport.isPending ? <Spinner /> : "Request report"}
            </Button>
          </form>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-heading-sm font-medium tracking-[-0.44px] text-ink-black">
          Recent exports
        </h2>

        {semesterId === "" ? null : (
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={(reports?.length ?? 0) === 0}
            error={error}
            onRetry={() => void refetch()}
            skeleton={<ReportsSkeleton />}
            emptyState={
              <EmptyState
                icon="file-text"
                title="No reports yet"
                description="No reports requested yet for this semester."
              />
            }
          >
            <Card className="overflow-hidden p-0">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-black/[0.06] text-caption uppercase tracking-wide text-slate">
                    <Th>Type</Th>
                    <Th>Format</Th>
                    <Th>Status</Th>
                    <Th>Requested</Th>
                    <Th className="text-right">File</Th>
                  </tr>
                </thead>
                <tbody>
                  {(reports ?? []).map((report) => (
                    <ReportRow key={report.id} report={report} />
                  ))}
                </tbody>
              </table>
            </Card>
          </DataState>
        )}
      </div>
    </section>
  );
}

function ReportRow({ report }: { report: ReportExport }) {
  const visual = STATUS_VISUALS[report.status];
  return (
    <tr className="border-b border-ink-black/[0.04] last:border-0">
      <Td className="text-body-sm font-medium text-ink-black">
        {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
      </Td>
      <Td className="text-body-sm text-graphite">{report.format}</Td>
      <Td>
        <div className="flex flex-col gap-1">
          <Badge tone={visual.tone} dotColor={visual.dotColor}>
            {visual.label}
          </Badge>
          {report.status === "FAILED" && report.failureReason ? (
            <span className="text-caption text-slate">
              {report.failureReason}
            </span>
          ) : null}
        </div>
      </Td>
      <Td className="text-body-sm text-slate">
        {formatTimestamp(report.requestedAt)}
      </Td>
      <Td className="text-right">
        {report.status === "COMPLETED" && report.downloadUrl ? (
          <a
            href={report.downloadUrl}
            download
            className={cn(
              "inline-flex h-9 items-center rounded-2xl bg-ink-black/[0.04] px-4",
              "text-body-sm font-medium text-ink-black/85",
              "transition-colors duration-200 ease-out hover:bg-ink-black/[0.08]",
            )}
          >
            Download
          </a>
        ) : (
          <span className="text-body-sm text-steel">—</span>
        )}
      </Td>
    </tr>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-6 py-3 text-caption font-medium", className)}>
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-6 py-4 align-middle", className)}>{children}</td>;
}
