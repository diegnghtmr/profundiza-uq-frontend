import { useEffect, useState } from "react";
import {
  Button,
  Card,
  DataState,
  EmptyState,
  Input,
  SegmentedControl,
} from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import type { AcademicShift, Student, UserStatus } from "@/shared/api/types";
import { useStudents, type StudentFilters } from "../api/studentsApi";
import { AddStudentDialog } from "../components/AddStudentDialog";
import { ImportStudentsDialog } from "../components/ImportStudentsDialog";
import { StudentDetailDialog } from "../components/StudentDetailDialog";
import { ShiftBadge, StudentStatusBadge } from "../components/studentBadges";
import { StudentsTableSkeleton } from "../components/StudentsTableSkeleton";

type ShiftFilter = AcademicShift | "ALL";
type StatusFilter = UserStatus | "ALL";

const SHIFT_OPTIONS: ReadonlyArray<{ value: ShiftFilter; label: string }> = [
  { value: "ALL", label: "All shifts" },
  { value: "DAY", label: "Day" },
  { value: "NIGHT", label: "Night" },
];

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState<ShiftFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);

  // The server supports a `q` search param; debounce so we filter on the
  // backend without firing a request on every keystroke.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const filters: StudentFilters = {
    q: debouncedSearch,
    shift: shift === "ALL" ? "" : shift,
    status: status === "ALL" ? "" : status,
  };

  const { data, isLoading, isError, error, refetch } = useStudents(filters);
  const students = data?.items ?? [];
  const filtersActive = search.trim() !== "" || shift !== "ALL" || status !== "ALL";

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
            Students
          </h1>
          <div className="flex gap-3">
            <Button variant="soft" onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button onClick={() => setAddOpen(true)}>+ Add student</Button>
          </div>
        </div>
        <p className="max-w-2xl text-subheading text-graphite">
          Create manually, import in bulk, and review academic context for manual
          prerequisite validation.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Input
          type="search"
          placeholder="Search by name, document or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            options={SHIFT_OPTIONS}
            value={shift}
            onChange={setShift}
          />
          <SegmentedControl
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        </div>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!filtersActive && students.length === 0}
        error={error}
        onRetry={() => void refetch()}
        skeleton={<StudentsTableSkeleton />}
        emptyState={
          <EmptyState
            icon="user"
            title="No students yet"
            description="Add students manually or import them in bulk to get started."
            action={<Button onClick={() => setAddOpen(true)}>+ Add student</Button>}
          />
        }
      >
        {students.length === 0 ? (
          <Card className="py-10 text-center text-body-sm text-slate">
            No students match the current filters.
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-black/[0.06] text-caption uppercase tracking-wide text-slate">
                  <Th>Student</Th>
                  <Th className="w-40">Document</Th>
                  <Th className="w-28">Shift</Th>
                  <Th className="w-28">Completed</Th>
                  <Th className="w-28">Status</Th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelected(student)}
                    className="cursor-pointer border-b border-ink-black/[0.04] transition-colors last:border-0 hover:bg-ink-black/[0.02]"
                  >
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-body-sm font-medium text-ink-black">
                          {student.fullName}
                        </span>
                        <span className="text-caption text-slate">
                          {student.institutionalEmail}
                        </span>
                      </div>
                    </Td>
                    <Td className="tabular-nums text-graphite">
                      {student.documentNumber}
                    </Td>
                    <Td>
                      <ShiftBadge shift={student.academicShift} />
                    </Td>
                    <Td className="tabular-nums text-graphite">
                      {student.completedProfessionalElectivesCount ?? 0} / 4
                    </Td>
                    <Td>
                      <StudentStatusBadge status={student.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </DataState>

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportStudentsDialog open={importOpen} onOpenChange={setImportOpen} />
      <StudentDetailDialog
        student={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </section>
  );
}

/** Debounce a value by `delay` ms. Used to throttle the server search query. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
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
