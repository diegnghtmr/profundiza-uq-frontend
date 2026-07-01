import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Dialog, Input, Spinner, Textarea } from "@/shared/components/ui";
import { useCreateElective } from "../api/catalogAdminApi";

const electiveSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  area: z.string().min(2, "Area is required"),
  description: z.string().max(500, "Keep the description under 500 characters"),
});
type ElectiveForm = z.infer<typeof electiveSchema>;

/**
 * Create-elective form in a modal. Validated with zod; the dialog closes on a
 * successful POST and the parent list refreshes via query invalidation.
 */
export function CreateElectiveDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createElective = useCreateElective();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ElectiveForm>({
    resolver: zodResolver(electiveSchema),
    defaultValues: { name: "", area: "", description: "" },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  function onSubmit(values: ElectiveForm) {
    createElective.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create elective"
      description="Reusable across semesters. Offerings and groups are configured per semester later."
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-elective-form"
            disabled={createElective.isPending}
          >
            {createElective.isPending ? <Spinner /> : "Create elective"}
          </Button>
        </>
      }
    >
      <form
        id="create-elective-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label="Name"
          placeholder="e.g. Distributed Systems"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Area"
          placeholder="e.g. Software Engineering"
          error={errors.area?.message}
          {...register("area")}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="Short summary shown to students…"
          error={errors.description?.message}
          {...register("description")}
        />
      </form>
    </Dialog>
  );
}
