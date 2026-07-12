import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Dialog, Input, Select, Spinner } from "@/shared/components/ui";
import {
  useCreateAdmin,
  useUpdateAdmin,
  type AdminRole,
  type AdminStatus,
  type AdminUser,
} from "../api/adminUsersApi";

const ROLE_OPTIONS: ReadonlyArray<{ value: AdminRole; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

const STATUS_OPTIONS: ReadonlyArray<{ value: AdminStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

// Both schemas produce the same shape so a single useForm<AdminFormValues> can
// swap resolvers by mode without casts. In create mode the email is validated;
// in edit mode it is read-only and passes through unvalidated.
const createSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  institutionalEmail: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const editSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  institutionalEmail: z.string(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type AdminFormValues = z.infer<typeof createSchema>;

const EMPTY_FORM: AdminFormValues = {
  fullName: "",
  institutionalEmail: "",
  role: "ADMIN",
  status: "ACTIVE",
};

function fromAdmin(admin: AdminUser): AdminFormValues {
  return {
    fullName: admin.fullName,
    institutionalEmail: admin.institutionalEmail,
    role: admin.role,
    status: admin.status,
  };
}

/**
 * Create or edit an administrative user. Create captures email + role; edit
 * exposes name, role, and status (email is immutable, shown read-only).
 * Validation runs through zod (react-hook-form), so Enter submits the form.
 */
export function AdminFormDialog({
  mode,
  admin,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  admin: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const pending = createAdmin.isPending || updateAdmin.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminFormValues>({
    resolver: zodResolver(mode === "create" ? createSchema : editSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!open) return;
    reset(mode === "edit" && admin ? fromAdmin(admin) : EMPTY_FORM);
  }, [open, mode, admin, reset]);

  function onSubmit(values: AdminFormValues) {
    if (mode === "create") {
      createAdmin.mutate(
        {
          fullName: values.fullName,
          institutionalEmail: values.institutionalEmail,
          role: values.role,
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }
    if (!admin) return;
    updateAdmin.mutate(
      {
        id: admin.id,
        patch: {
          fullName: values.fullName,
          role: values.role,
          status: values.status,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add administrator" : "Edit administrator"}
      description={
        mode === "create"
          ? "Grant access to a new administrative user."
          : "Update the role or status of this administrator."
      }
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="admin-form" disabled={pending}>
            {pending ? (
              <Spinner />
            ) : mode === "create" ? (
              "Add administrator"
            ) : (
              "Save changes"
            )}
          </Button>
        </>
      }
    >
      <form
        id="admin-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label="Full name"
          placeholder="Jane Doe"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        {mode === "create" ? (
          <Input
            label="Institutional email"
            type="email"
            placeholder="name@uniquindio.edu.co"
            error={errors.institutionalEmail?.message}
            {...register("institutionalEmail")}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-graphite">
              Institutional email
            </span>
            <p className="text-body text-slate">{admin?.institutionalEmail}</p>
          </div>
        )}

        <Controller
          control={control}
          name="role"
          render={({ field, fieldState }) => (
            <Select
              label="Role"
              options={ROLE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              name={field.name}
              error={fieldState.error?.message}
            />
          )}
        />

        {mode === "edit" ? (
          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                error={fieldState.error?.message}
              />
            )}
          />
        ) : null}
      </form>
    </Dialog>
  );
}
