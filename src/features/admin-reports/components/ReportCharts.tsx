import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/shared/components/ui";
import type { ReportExport, ReportExportStatus } from "../api/reportsApi";

export interface ReportChartsProps {
  reports: ReportExport[];
}

const STATUS_ORDER: readonly ReportExportStatus[] = [
  "REQUESTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
];

const STATUS_LABELS: Record<ReportExportStatus, string> = {
  REQUESTED: "Requested",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  EXPIRED: "Expired",
};

interface StatusCount {
  status: ReportExportStatus;
  label: string;
  count: number;
}

function countByStatus(reports: ReportExport[]): StatusCount[] {
  const counts = new Map<ReportExportStatus, number>();
  for (const report of reports) {
    counts.set(report.status, (counts.get(report.status) ?? 0) + 1);
  }
  return STATUS_ORDER.filter((status) => (counts.get(status) ?? 0) > 0).map(
    (status) => ({
      status,
      label: STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    }),
  );
}

/**
 * Status distribution for the semester's report exports (FR-007, adopted here
 * because a bar-per-status breakdown surfaces the export pipeline's health —
 * how many completed vs. failed vs. still processing — faster than scanning
 * individual table rows; a genuine win over the existing textual table, not
 * decoration for its own sake).
 *
 * The SVG is decorative (`aria-hidden`, Recharts output is not reliably
 * announced by assistive tech): the same counts are ALSO rendered as a plain
 * `<dl>` outside the chart, so the figures reach screen readers and
 * no-JS/no-SVG contexts without depending on chart internals. When there is
 * no data to summarize, an `EmptyState` fallback renders instead of a
 * blank/broken chart (FR-007 scenario 1). Feature-local per the Scope Rule
 * (single consumer: ReportsPage), lazy-loaded by its caller so Recharts stays
 * off the entry chunk.
 */
export function ReportCharts({ reports }: ReportChartsProps) {
  const data = useMemo(() => countByStatus(reports), [reports]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon="file-text"
        title="No export data to chart yet"
        description="Once reports are requested, their status distribution appears here."
      />
    );
  }

  return (
    <div className="surface-frosted flex flex-col gap-4 rounded-[30px] p-6">
      <h3 className="text-body-sm font-medium text-graphite">
        Exports by status
      </h3>
      {/*
        Recharts applies fill/stroke as SVG *presentation attributes*, where CSS
        `var()` does NOT resolve — so the token values on the props below would
        silently fall back to Recharts defaults (invisible grid, grey-black ticks)
        in a real browser. The `.report-chart` class re-applies the same tokens as
        CSS *declarations* in global.css, which resolve `var()` and override the
        presentation attributes. The props are kept as intent documentation.
      */}
      <div aria-hidden="true" className="report-chart h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-pebble)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-slate)", fontSize: 12 }}
              axisLine={{ stroke: "var(--color-pebble)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--color-slate)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-fog)" }}
              contentStyle={{
                borderRadius: 16,
                border: "none",
                boxShadow: "var(--shadow-sm)",
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-ink-black)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-body-sm text-graphite sm:grid-cols-3">
        {data.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between gap-2"
          >
            <dt>{item.label}</dt>
            <dd className="font-medium text-ink-black">{item.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
