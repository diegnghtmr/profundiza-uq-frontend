import { useEffect, useState } from "react";
import { Button, Dialog, Spinner, Textarea } from "@/shared/components/ui";
import type { AcademicShift } from "@/shared/api/types";
import { useImportStudents, type CreateStudentInput } from "../api/studentsApi";

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParseResult {
  rows: CreateStudentInput[];
  errors: string[];
}

/**
 * Parse pasted CSV lines into create payloads. Expected columns, comma-separated:
 *   fullName, institutionalEmail, documentNumber, shift(DAY|NIGHT), completed(0-4)
 * The last column is optional and defaults to 0. Blank lines are ignored.
 */
function parseRows(text: string): ParseResult {
  const rows: CreateStudentInput[] = [];
  const errors: string[] = [];

  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line, index) => {
      const cells = line.split(",").map((cell) => cell.trim());
      const [fullName, institutionalEmail, documentNumber, shiftRaw, completedRaw] =
        cells;

      if (!fullName || !institutionalEmail || !documentNumber || !shiftRaw) {
        errors.push(`Line ${index + 1}: needs name, email, document and shift.`);
        return;
      }
      const shift = shiftRaw.toUpperCase();
      if (shift !== "DAY" && shift !== "NIGHT") {
        errors.push(`Line ${index + 1}: shift must be DAY or NIGHT.`);
        return;
      }
      const completed = completedRaw ? Number.parseInt(completedRaw, 10) : 0;
      if (Number.isNaN(completed) || completed < 0 || completed > 4) {
        errors.push(`Line ${index + 1}: completed must be a number 0-4.`);
        return;
      }

      rows.push({
        fullName,
        institutionalEmail,
        documentNumber,
        academicShift: shift as AcademicShift,
        completedProfessionalElectivesCount: completed,
      });
    });

  return { rows, errors };
}

export function ImportStudentsDialog({
  open,
  onOpenChange,
}: ImportStudentsDialogProps) {
  const importStudents = useImportStudents();
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const { rows, errors } = parseRows(text);
  const canSubmit = rows.length > 0 && errors.length === 0;

  function onSubmit() {
    importStudents.mutate(rows, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import students"
      description="Paste one student per line. Columns: name, email, document, shift, completed."
    >
      <div className="flex flex-col gap-3">
        <Textarea
          rows={6}
          className="px-5 text-body-sm"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            "Jane Doe, jane@uniquindio.edu.co, 1094123456, DAY, 2\nJohn Roe, john@uniquindio.edu.co, 1094998877, NIGHT, 0"
          }
        />

        {errors.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {errors.map((error) => (
              <li key={error} className="text-body-sm text-spectrum-gradient">
                {error}
              </li>
            ))}
          </ul>
        ) : rows.length > 0 ? (
          <p className="text-body-sm text-slate">
            {rows.length} row{rows.length === 1 ? "" : "s"} ready to import.
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="soft" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit || importStudents.isPending}>
          {importStudents.isPending ? <Spinner /> : "Import"}
        </Button>
      </div>
    </Dialog>
  );
}
