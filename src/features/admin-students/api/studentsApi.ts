import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/shared/api/client";
import type { AcademicShift, Student, UserStatus } from "@/shared/api/types";
import { errorMessage } from "@/shared/lib/apiErrors";
import { toast } from "@/shared/stores/toastStore";

// ---------------------------------------------------------------------------
// Types co-located with this feature (the shared types module is not edited).
// Shapes mirror the Go DTOs in internal/student/adapter/http/handler.go.
// ---------------------------------------------------------------------------

/** Response of GET /students (paged envelope). */
export interface StudentsPage {
  items: Student[];
  page: number;
  pageSize: number;
  total: number;
}

/** Server-side filters for GET /students. Empty values are omitted. */
export interface StudentFilters {
  q?: string;
  shift?: AcademicShift | "";
  status?: UserStatus | "";
}

/** Body of POST /students (CreateStudentRequest). */
export interface CreateStudentInput {
  institutionalEmail: string;
  documentNumber: string;
  fullName: string;
  academicShift: AcademicShift;
  completedProfessionalElectivesCount: number;
}

/** A manual administrative note attached to a student. */
export interface AcademicRecord {
  id: string;
  studentId: string;
  semesterId: string;
  notes: string;
  source: string;
  createdAt: string;
}

/** Body of POST /students/{id}/academic-records. */
export interface CreateAcademicRecordInput {
  semesterId: string;
  notes: string;
  source: string;
}

/** Response of POST /students/import. */
export interface ImportResult {
  acceptedRows: number;
  rejectedRows: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const studentKeys = {
  all: ["students"] as const,
  list: (filters: StudentFilters) => ["students", "list", filters] as const,
  records: (studentId: string) => ["students", studentId, "records"] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** A generous page size: the admin list is browsed, not paginated, for the MVP. */
const LIST_PAGE_SIZE = 100;

function fetchStudents(filters: StudentFilters): Promise<StudentsPage> {
  return fetchClient<StudentsPage>("/students", {
    query: {
      pageSize: LIST_PAGE_SIZE,
      q: filters.q || undefined,
      shift: filters.shift || undefined,
      status: filters.status || undefined,
    },
  });
}

export function useStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => fetchStudents(filters),
    // Keep the previous page visible while a new filter request is in flight so
    // the table does not flash empty on every keystroke.
    placeholderData: (previous) => previous,
  });
}

function fetchRecords(studentId: string): Promise<AcademicRecord[]> {
  return fetchClient<{ items: AcademicRecord[] }>(
    `/students/${studentId}/academic-records`,
  ).then((res) => res.items);
}

export function useStudentRecords(studentId: string | null) {
  return useQuery({
    queryKey: studentKeys.records(studentId ?? ""),
    queryFn: () => fetchRecords(studentId as string),
    enabled: studentId !== null,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) =>
      fetchClient<Student>("/students", { method: "POST", body: input }),
    onSuccess: (student) => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(`${student.fullName} was added.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useCreateRecord(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAcademicRecordInput) =>
      fetchClient<AcademicRecord>(`/students/${studentId}/academic-records`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.records(studentId) });
      toast.success("Academic record added.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useImportStudents() {
  const qc = useQueryClient();
  return useMutation({
    // The backend accepts {"students":[...]} (and a bare array); we send the
    // wrapped form, which is the documented shape.
    mutationFn: (rows: CreateStudentInput[]) =>
      fetchClient<ImportResult>("/students/import", {
        method: "POST",
        body: { students: rows },
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      if (result.rejectedRows > 0) {
        toast.info(
          `Imported ${result.acceptedRows}, rejected ${result.rejectedRows}.`,
        );
      } else {
        toast.success(`Imported ${result.acceptedRows} students.`);
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
