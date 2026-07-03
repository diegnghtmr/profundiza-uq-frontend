import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Dialog,
  Input,
  Select,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui";
import { useSemesters } from "@/shared/api/semestersApi";
import type { Student } from "@/shared/api/types";
import { ShiftBadge, StudentStatusBadge } from "./studentBadges";
import { useCreateRecord, useStudentRecords } from "../api/studentsApi";

const recordSchema = z.object({
  semesterId: z.string().min(1, "Select a semester"),
  notes: z.string().trim().min(1, "Notes are required"),
  source: z.string().trim().min(1, "Source is required"),
});

type RecordForm = z.infer<typeof recordSchema>;

const RECORD_DEFAULTS: RecordForm = {
  semesterId: "",
  notes: "",
  source: "MANUAL",
};

interface StudentDetailDialogProps {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailDialog({
  student,
  onOpenChange,
}: StudentDetailDialogProps) {
  const open = student !== null;
  const studentId = student?.id ?? null;

  const { data: records, isLoading, isError } = useStudentRecords(studentId);
  const { data: semesters } = useSemesters();
  const createRecord = useCreateRecord(studentId ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: RECORD_DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(RECORD_DEFAULTS);
  }, [open, studentId, reset]);

  function onSubmit(values: RecordForm) {
    createRecord.mutate(values, {
      onSuccess: () => reset(RECORD_DEFAULTS),
    });
  }

  const semesterOptions = [
    { value: "", label: "Select a semester…" },
    ...(semesters ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={student?.fullName ?? "Student"}
      description={student?.institutionalEmail}
    >
      {student ? (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Academic records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Document">
                <span className="tabular-nums text-ink-black">
                  {student.documentNumber}
                </span>
              </Field>
              <Field label="Completed electives">
                <span className="tabular-nums text-ink-black">
                  {student.completedProfessionalElectivesCount ?? 0} / 4
                </span>
              </Field>
              <Field label="Shift">
                <ShiftBadge shift={student.academicShift} />
              </Field>
              <Field label="Status">
                <StudentStatusBadge status={student.status} />
              </Field>
            </dl>
          </TabsContent>

          <TabsContent value="records" className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : isError ? (
                <p className="text-body-sm text-slate">
                  Could not load academic records.
                </p>
              ) : records && records.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {records.map((record) => (
                    <li
                      key={record.id}
                      className="rounded-2xl bg-ink-black/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-body-sm text-ink-black">
                          {record.notes}
                        </span>
                        <span className="text-caption uppercase tracking-wide text-slate">
                          {record.source}
                        </span>
                      </div>
                      <span className="text-caption text-slate">
                        {formatDate(record.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-slate">No records yet.</p>
              )}
            </section>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4 border-t border-ink-black/[0.06] pt-5"
              noValidate
            >
              <h3 className="text-body-sm font-medium text-graphite">
                Add a record
              </h3>
              <Select
                label="Semester"
                options={semesterOptions}
                error={errors.semesterId?.message}
                {...register("semesterId")}
              />
              <Input
                label="Notes"
                placeholder="e.g. Prerequisite validated manually"
                error={errors.notes?.message}
                {...register("notes")}
              />
              <Input
                label="Source"
                placeholder="MANUAL"
                error={errors.source?.message}
                {...register("source")}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={createRecord.isPending}>
                  {createRecord.isPending ? <Spinner /> : "Add record"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      ) : null}
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption uppercase tracking-wide text-slate">
        {label}
      </dt>
      <dd className="text-body-sm">{children}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
