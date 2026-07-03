import { useMemo, useState } from "react";
import {
  Input,
  SegmentedControl,
  FilterPill,
  DataState,
  EmptyState,
} from "@/shared/components/ui";
import { useUiStore } from "@/shared/stores/uiStore";
import type { AcademicShift, ElectiveOfferingSummary } from "@/shared/api/types";
import { useMyRequests } from "@/features/enrollment/api/requestsApi";
import { ACTIVE_REQUEST_STATUSES } from "@/shared/lib/requestStats";
import { useOfferings, deriveAreas } from "../api/offeringsApi";
import { OfferingCard } from "../components/OfferingCard";
import { OfferingsSkeleton } from "../components/OfferingsSkeleton";
import { DraftBar } from "../components/DraftBar";

type ShiftFilter = "ALL" | AcademicShift;

const SHIFT_OPTIONS = [
  { value: "ALL" as const, label: "All" },
  { value: "DAY" as const, label: "Day" },
  { value: "NIGHT" as const, label: "Night" },
];

/** Container: owns filter state and derives the visible offering list. */
export function OfferingsPage() {
  const selectedSemesterId = useUiStore((s) => s.selectedSemesterId);
  const {
    data: offerings,
    isLoading,
    isError,
    error,
    refetch,
  } = useOfferings(selectedSemesterId);
  const { data: myRequests } = useMyRequests(selectedSemesterId);

  // Groups the student already holds an active request for — rendered as
  // "Requested" (disabled) so a duplicate submission is impossible from the UI.
  const requestedGroupIds = useMemo(
    () =>
      new Set(
        (myRequests ?? [])
          .filter((r) => ACTIVE_REQUEST_STATUSES.has(r.status))
          .map((r) => r.offeringGroupId),
      ),
    [myRequests],
  );

  const [search, setSearch] = useState("");
  const [shift, setShift] = useState<ShiftFilter>("ALL");
  const [openSeatsOnly, setOpenSeatsOnly] = useState(false);
  const [area, setArea] = useState<string>("ALL");
  const [limitWarning, setLimitWarning] = useState(false);

  const areas = useMemo(() => deriveAreas(offerings ?? []), [offerings]);
  const visible = useMemo(
    () => filterOfferings(offerings ?? [], { search, shift, openSeatsOnly, area }),
    [offerings, search, shift, openSeatsOnly, area],
  );

  return (
    <section className="relative z-[1] flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
          Available offerings
        </h1>
        <p className="max-w-2xl text-subheading text-graphite">
          Review schedules, shift, capacity and prerequisites before adding to
          your plan. You can request up to 4 per semester.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search electives or areas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 max-w-sm flex-1"
            aria-label="Search electives or areas"
          />
          <SegmentedControl options={SHIFT_OPTIONS} value={shift} onChange={setShift} />
          <FilterPill
            active={openSeatsOnly}
            onClick={() => setOpenSeatsOnly((v) => !v)}
          >
            Open seats only
          </FilterPill>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill active={area === "ALL"} onClick={() => setArea("ALL")}>
            All areas
          </FilterPill>
          {areas.map((a) => (
            <FilterPill key={a} active={area === a} onClick={() => setArea(a)}>
              {a}
            </FilterPill>
          ))}
        </div>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={(offerings?.length ?? 0) === 0}
        error={error}
        onRetry={() => void refetch()}
        skeleton={<OfferingsSkeleton />}
        emptyState={
          <EmptyState
            icon="search"
            title="No offerings published yet"
            description="Offerings for this semester haven't been published. Check back soon."
          />
        }
      >
        {visible.length === 0 ? (
          <p className="py-16 text-center text-body text-slate">
            No offerings match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {visible.map((offering) => (
              <OfferingCard
                key={offering.id}
                offering={offering}
                requestedGroupIds={requestedGroupIds}
                onLimitReached={() => {
                  setLimitWarning(true);
                  window.setTimeout(() => setLimitWarning(false), 4000);
                }}
              />
            ))}
          </div>
        )}
      </DataState>

      <DraftBar limitWarning={limitWarning} />
    </section>
  );
}

interface Filters {
  search: string;
  shift: ShiftFilter;
  openSeatsOnly: boolean;
  area: string;
}

function filterOfferings(
  offerings: ElectiveOfferingSummary[],
  { search, shift, openSeatsOnly, area }: Filters,
): ElectiveOfferingSummary[] {
  const term = search.trim().toLowerCase();

  return offerings
    .filter((o) => area === "ALL" || o.elective.area === area)
    .filter(
      (o) =>
        term === "" ||
        o.elective.name.toLowerCase().includes(term) ||
        o.elective.area.toLowerCase().includes(term),
    )
    .map((o) => ({
      ...o,
      groups: o.groups.filter((g) => {
        const matchesShift = shift === "ALL" || g.shift === shift;
        const seatsLeft = g.capacity - (g.acceptedCount ?? 0);
        const matchesSeats = !openSeatsOnly || seatsLeft > 0;
        return matchesShift && matchesSeats;
      }),
    }))
    .filter((o) => o.groups.length > 0);
}
