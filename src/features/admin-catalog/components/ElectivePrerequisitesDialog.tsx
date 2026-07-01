import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  Input,
  Spinner,
  Textarea,
} from "@/shared/components/ui";
import {
  useCreatePrerequisite,
  useElectivePrerequisites,
} from "../api/catalogAdminApi";

/**
 * View and add default prerequisites for an elective. Prerequisites are fetched
 * lazily while the dialog is open. Adding is inline: the "Add prerequisite"
 * action reveals a small form that posts to the elective and refreshes the list.
 */
export function ElectivePrerequisitesDialog({
  electiveId,
  electiveName,
  open,
  onOpenChange,
}: {
  electiveId: string;
  electiveName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: prerequisites, isLoading } = useElectivePrerequisites(
    electiveId,
    open,
  );
  const createPrerequisite = useCreatePrerequisite(electiveId);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setAdding(false);
      setName("");
      setDescription("");
    }
  }, [open]);

  const valid = name.trim().length >= 2 && description.trim().length >= 2;

  function onAdd() {
    if (!valid) return;
    createPrerequisite.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setAdding(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${electiveName} — prerequisites`}
      description="Default prerequisites apply to every offering of this elective."
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!adding ? (
            <Button onClick={() => setAdding(true)}>Add prerequisite</Button>
          ) : null}
        </>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner label="Loading prerequisites" />
        </div>
      ) : !prerequisites || prerequisites.length === 0 ? (
        <p className="text-body text-graphite">
          No default prerequisites are registered yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {prerequisites.map((pr) => (
            <li key={pr.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-body font-medium text-ink-black">
                  {pr.name}
                </span>
                <Badge tone="muted">
                  {pr.source === "ELECTIVE_DEFAULT"
                    ? "Default"
                    : "Offering-specific"}
                </Badge>
              </div>
              <p className="text-body-sm text-graphite">{pr.description}</p>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="mt-6 flex flex-col gap-4 border-t border-ink-black/[0.06] pt-6">
          <Input
            label="Prerequisite name"
            placeholder="e.g. Data Structures"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label="Description"
            rows={2}
            placeholder="What the student must have completed…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="soft" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!valid || createPrerequisite.isPending}
              onClick={onAdd}
            >
              {createPrerequisite.isPending ? <Spinner /> : "Save prerequisite"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
