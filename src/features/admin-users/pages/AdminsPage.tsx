import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  SegmentedControl,
  Spinner,
} from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { AdminFormDialog } from "../components/AdminFormDialog";
import {
  useAdmins,
  type AdminFilters,
  type AdminRole,
  type AdminStatus,
  type AdminUser,
} from "../api/adminUsersApi";

const ROLE_FILTERS: ReadonlyArray<{ value: AdminRole | ""; label: string }> = [
  { value: "", label: "All roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

const STATUS_FILTERS: ReadonlyArray<{ value: AdminStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

type DialogState =
  | { mode: "create"; admin: null }
  | { mode: "edit"; admin: AdminUser }
  | null;

export function AdminsPage() {
  const [filters, setFilters] = useState<AdminFilters>({ role: "", status: "" });
  const { data: admins, isLoading, isError } = useAdmins(filters);
  const [dialog, setDialog] = useState<DialogState>(null);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
            Administrators
          </h1>
          <p className="max-w-2xl text-subheading text-graphite">
            Manage who can access the administrative console and the role they
            hold.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create", admin: null })}>
          Add administrator
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={ROLE_FILTERS}
          value={filters.role ?? ""}
          onChange={(role) => setFilters((f) => ({ ...f, role }))}
        />
        <SegmentedControl
          options={STATUS_FILTERS}
          value={filters.status ?? ""}
          onChange={(status) => setFilters((f) => ({ ...f, status }))}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="py-6 text-body-sm text-slate">
          Could not load administrators. Please try again.
        </Card>
      ) : !admins || admins.length === 0 ? (
        <Card className="py-6 text-body-sm text-slate">
          No administrators match the current filters.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-black/[0.06] text-caption uppercase tracking-wide text-slate">
                <Th>Administrator</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-ink-black/[0.04] last:border-0"
                >
                  <Td>
                    <div className="flex flex-col">
                      <span className="text-body-sm font-medium text-ink-black">
                        {admin.fullName}
                      </span>
                      <span className="text-caption text-slate">
                        {admin.institutionalEmail}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{ROLE_LABELS[admin.role]}</Badge>
                  </Td>
                  <Td>
                    {admin.status === "ACTIVE" ? (
                      <Badge tone="neutral" dotColor="#ffb005">
                        Active
                      </Badge>
                    ) : (
                      <Badge tone="muted">Inactive</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => setDialog({ mode: "edit", admin })}
                    >
                      Edit
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AdminFormDialog
        mode={dialog?.mode ?? "create"}
        admin={dialog?.mode === "edit" ? dialog.admin : null}
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </section>
  );
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
