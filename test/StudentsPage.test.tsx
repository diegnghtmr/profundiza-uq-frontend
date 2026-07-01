import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so the page renders without a QueryClient/network.
// StudentsPage and its child dialogs consume every hook in this module.
vi.mock("@/features/admin-students/api/studentsApi", () => ({
  useStudents: vi.fn(),
  useStudentRecords: vi.fn(),
  useCreateStudent: vi.fn(),
  useCreateRecord: vi.fn(),
  useImportStudents: vi.fn(),
}));

// StudentDetailDialog reads the semester list to label academic records.
vi.mock("@/shared/api/semestersApi", () => ({
  useSemesters: vi.fn(),
}));

import {
  useStudents,
  useStudentRecords,
  useCreateStudent,
  useCreateRecord,
  useImportStudents,
} from "@/features/admin-students/api/studentsApi";
import { useSemesters } from "@/shared/api/semestersApi";
import { StudentsPage } from "@/features/admin-students/pages/StudentsPage";
import type { Student } from "@/shared/api/types";
import type { StudentsPage as StudentsPageData } from "@/features/admin-students/api/studentsApi";

const mockUseStudents = vi.mocked(useStudents);

function student(overrides: Partial<Student>): Student {
  return {
    id: "s1",
    institutionalEmail: "ada@uni.edu",
    documentNumber: "1000000001",
    fullName: "Ada Lovelace",
    academicShift: "DAY",
    status: "ACTIVE",
    completedProfessionalElectivesCount: 2,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function asStudentsQuery(items: Student[] | undefined, isLoading = false) {
  const data: StudentsPageData | undefined =
    items === undefined
      ? undefined
      : { items, page: 1, pageSize: 100, total: items.length };
  return { data, isLoading, isError: false } as unknown as ReturnType<
    typeof useStudents
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useStudentRecords).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useStudentRecords>);
  vi.mocked(useCreateStudent).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateStudent>);
  vi.mocked(useCreateRecord).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateRecord>);
  vi.mocked(useImportStudents).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useImportStudents>);
  vi.mocked(useSemesters).mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useSemesters>);
});

describe("StudentsPage", () => {
  it("renders the heading, student rows and the add action", () => {
    mockUseStudents.mockReturnValue(
      asStudentsQuery([
        student({ id: "s1", fullName: "Ada Lovelace", institutionalEmail: "ada@uni.edu" }),
        student({ id: "s2", fullName: "Alan Turing", institutionalEmail: "alan@uni.edu" }),
      ]),
    );

    render(<StudentsPage />);

    expect(
      screen.getByRole("heading", { name: "Students", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@uni.edu")).toBeInTheDocument();
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add student" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no students match the filters", () => {
    mockUseStudents.mockReturnValue(asStudentsQuery([]));

    render(<StudentsPage />);

    expect(
      screen.getByText("No students match the current filters."),
    ).toBeInTheDocument();
  });
});
