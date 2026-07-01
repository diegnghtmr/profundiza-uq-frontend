import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Dialog, Input, Select, Spinner } from "@/shared/components/ui";
import { useCreateStudent } from "../api/studentsApi";

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  institutionalEmail: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  documentNumber: z.string().trim().min(1, "Document number is required"),
  academicShift: z.enum(["DAY", "NIGHT"]),
  completedProfessionalElectivesCount: z.coerce
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(4, "At most 4"),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  fullName: "",
  institutionalEmail: "",
  documentNumber: "",
  academicShift: "DAY",
  completedProfessionalElectivesCount: 0,
};

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps) {
  const createStudent = useCreateStudent();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  // Reset the form whenever the dialog is (re)opened so stale input never leaks
  // into the next creation.
  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  function onSubmit(values: FormValues) {
    createStudent.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add student"
      description="Create a student record manually. The institutional email must be unique."
    >
      <form
        id="add-student-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="off"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Institutional email"
          type="email"
          placeholder="name@uniquindio.edu.co"
          autoComplete="off"
          error={errors.institutionalEmail?.message}
          {...register("institutionalEmail")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Document number"
            inputMode="numeric"
            placeholder="1094..."
            autoComplete="off"
            error={errors.documentNumber?.message}
            {...register("documentNumber")}
          />
          <Select
            label="Shift"
            options={[
              { value: "DAY", label: "Day" },
              { value: "NIGHT", label: "Night" },
            ]}
            error={errors.academicShift?.message}
            {...register("academicShift")}
          />
        </div>
        <Input
          label="Completed professional electives"
          type="number"
          min={0}
          max={4}
          error={errors.completedProfessionalElectivesCount?.message}
          {...register("completedProfessionalElectivesCount")}
        />
      </form>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="soft" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="add-student-form"
          disabled={createStudent.isPending}
        >
          {createStudent.isPending ? <Spinner /> : "Add student"}
        </Button>
      </div>
    </Dialog>
  );
}
