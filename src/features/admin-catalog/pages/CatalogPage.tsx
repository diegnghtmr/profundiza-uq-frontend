import { useMemo, useState } from "react";
import {
  Button,
  Card,
  FilterPill,
  SearchField,
  SegmentedControl,
  Spinner,
} from "@/shared/components/ui";
import { useUiStore } from "@/shared/stores/uiStore";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { useOfferings } from "@/features/catalog/api/offeringsApi";
import type {
  Elective,
  OfferingGroupSummary,
} from "@/shared/api/types";
import { useElectives } from "../api/catalogAdminApi";
import { ElectiveCard } from "../components/ElectiveCard";
import { AdminOfferingCard } from "../components/AdminOfferingCard";
import { CreateElectiveDialog } from "../components/CreateElectiveDialog";
import { ElectivePrerequisitesDialog } from "../components/ElectivePrerequisitesDialog";
import { CapacityDialog } from "../components/CapacityDialog";

type Tab = "electives" | "offerings";

const TABS = [
  { value: "electives" as const, label: "Electives" },
  { value: "offerings" as const, label: "Active offerings" },
];

/**
 * Admin catalog management. Two views: the reusable elective catalog (create,
 * prerequisites) and the active semester's offerings (groups + capacity edits).
 */
export function CatalogPage() {
  const selectedSemesterId = useUiStore((s) => s.selectedSemesterId);
  const activeSemester = useActiveSemester();

  const [tab, setTab] = useState<Tab>("electives");
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [prereqElective, setPrereqElective] = useState<Elective | null>(null);
  const [capacityGroup, setCapacityGroup] = useState<OfferingGroupSummary | null>(
    null,
  );

  const { data: electives, isLoading: electivesLoading, isError: electivesError } =
    useElectives();
  const { data: offerings, isLoading: offeringsLoading } =
    useOfferings(selectedSemesterId);

  const areas = useMemo(
    () => Array.from(new Set((electives ?? []).map((e) => e.area))).sort(),
    [electives],
  );

  // Groups offered per elective in the active semester, for the card counts.
  const groupCountByElective = useMemo(() => {
    const map = new Map<string, number>();
    for (const offering of offerings ?? []) {
      map.set(offering.elective.id, offering.groups.length);
    }
    return map;
  }, [offerings]);

  const visibleElectives = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (electives ?? [])
      .filter((e) => area === "ALL" || e.area === area)
      .filter(
        (e) =>
          term === "" ||
          e.name.toLowerCase().includes(term) ||
          e.area.toLowerCase().includes(term),
      );
  }, [electives, search, area]);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
            Catalog
          </h1>
          <p className="max-w-2xl text-subheading text-graphite">
            Manage electives and configure offering groups. Electives are
            reusable; offerings and capacity are set per semester.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create elective</Button>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        {tab === "electives" ? (
          <SearchField
            label="Search electives or areas"
            placeholder="Search electives or areas…"
            value={search}
            onChange={setSearch}
            className="w-full sm:w-72"
          />
        ) : null}
      </div>

      {tab === "electives" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
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

          {electivesLoading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : electivesError ? (
            <Card className="py-6 text-body-sm text-slate">
              Could not load electives. Please try again.
            </Card>
          ) : visibleElectives.length === 0 ? (
            <p className="py-16 text-center text-body text-slate">
              {electives && electives.length === 0
                ? "No electives yet. Create the first one to get started."
                : "No electives match your filters."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleElectives.map((elective) => (
                <ElectiveCard
                  key={elective.id}
                  elective={elective}
                  groupCount={groupCountByElective.get(elective.id) ?? 0}
                  onViewPrerequisites={() => setPrereqElective(elective)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-body-sm text-slate">
            {activeSemester
              ? `Showing offerings for ${activeSemester.name}.`
              : "No active semester."}
          </p>

          {selectedSemesterId === "" ? (
            <p className="py-16 text-center text-body text-slate">
              Select an active semester to manage its offerings.
            </p>
          ) : offeringsLoading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : !offerings || offerings.length === 0 ? (
            <p className="py-16 text-center text-body text-slate">
              No offerings configured for this semester yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {offerings.map((offering) => (
                <AdminOfferingCard
                  key={offering.id}
                  offering={offering}
                  onAdjustCapacity={setCapacityGroup}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateElectiveDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ElectivePrerequisitesDialog
        electiveId={prereqElective?.id ?? ""}
        electiveName={prereqElective?.name ?? ""}
        open={prereqElective !== null}
        onOpenChange={(open) => !open && setPrereqElective(null)}
      />

      <CapacityDialog
        group={capacityGroup}
        semesterId={selectedSemesterId}
        open={capacityGroup !== null}
        onOpenChange={(open) => !open && setCapacityGroup(null)}
      />
    </section>
  );
}
