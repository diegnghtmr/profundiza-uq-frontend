import { useState } from "react";
import {
  Button,
  ChipsInput,
  Dialog,
  Input,
  Select,
  Spinner,
  Switch,
  Textarea,
} from "@/shared/components/ui";
import {
  MIN_REASON_LENGTH,
  useCreateSetting,
  useUpdateSetting,
  type GlobalSetting,
  type SettingValue,
} from "../api/settingsApi";

/** Editor mode derived from the current value's runtime type. */
type ValueKind = "boolean" | "number" | "string" | "stringList" | "json";

/** Options for the create-mode value-type selector (labels are user-facing). */
const VALUE_KIND_OPTIONS: ReadonlyArray<{ value: ValueKind; label: string }> = [
  { value: "string", label: "Text" },
  { value: "stringList", label: "Text list" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "json", label: "JSON" },
];

function kindOf(value: SettingValue): ValueKind {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return "stringList";
  }
  return "json";
}

type Mode = "edit" | "create";

export interface SettingEditDialogProps {
  mode: Mode;
  /** The setting being edited; ignored (pass `null`) in create mode. */
  setting: GlobalSetting | null;
  /** Existing keys, used in create mode to reject collisions. */
  existingKeys: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Creates or edits a single global setting. The value is JSONB, so the control
 * adapts to the value's type: a toggle for booleans, a typed field for
 * numbers/strings, and a raw-JSON textarea for objects/arrays. In edit mode the
 * kind is inferred from the current value; in create mode the user picks it and
 * also supplies the key. A reason (>= MIN_REASON_LENGTH) is always required.
 */
export function SettingEditDialog({
  mode,
  setting,
  existingKeys,
  open,
  onOpenChange,
}: SettingEditDialogProps) {
  const updateSetting = useUpdateSetting();
  const createSetting = useCreateSetting();
  const mutation = mode === "create" ? createSetting : updateSetting;

  const editKind: ValueKind = setting ? kindOf(setting.value) : "json";

  const [key, setKey] = useState("");
  const [selectedKind, setSelectedKind] = useState<ValueKind>("string");
  const [draft, setDraft] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [valueError, setValueError] = useState<string | null>(null);

  // In create mode the kind is user-selected; in edit mode it is inferred.
  const kind: ValueKind = mode === "create" ? selectedKind : editKind;

  // Reset the form whenever the dialog opens or the mode/setting changes. Done
  // during render (React's "adjust state on prop change" pattern) instead of an
  // effect, for both modes.
  const [sync, setSync] = useState<{
    open: boolean;
    mode: Mode;
    setting: GlobalSetting | null;
  }>({ open: false, mode, setting: null });
  if (sync.open !== open || sync.mode !== mode || sync.setting !== setting) {
    setSync({ open, mode, setting });
    if (open) {
      setKey("");
      setReason("");
      setValueError(null);
      if (mode === "create") {
        setSelectedKind("string");
        setDraft("");
        setChips([]);
      } else if (setting) {
        setSelectedKind(editKind);
        setDraft(initialDraft(setting.value, editKind));
        setChips(
          editKind === "stringList" ? (setting.value as string[]) : [],
        );
      }
    }
  }

  const trimmedKey = key.trim();
  const keyCollision = existingKeys.includes(trimmedKey);
  const keyValid = trimmedKey.length > 0 && !keyCollision;
  const reasonValid = reason.trim().length >= MIN_REASON_LENGTH;
  const formValid = reasonValid && (mode === "edit" || keyValid);

  // Switching the value type in create mode resets the draft to a sane default
  // for the new kind (handled here, not at render time).
  function handleKindChange(next: string) {
    const nextKind = next as ValueKind;
    setSelectedKind(nextKind);
    setDraft(nextKind === "boolean" ? "false" : "");
    setChips([]);
    setValueError(null);
  }

  function buildValue(): { ok: true; value: SettingValue } | { ok: false } {
    if (kind === "stringList") {
      return { ok: true, value: chips };
    }
    if (kind === "boolean") {
      return { ok: true, value: draft === "true" };
    }
    if (kind === "number") {
      const parsed = Number(draft);
      if (draft.trim() === "" || Number.isNaN(parsed)) {
        setValueError("Enter a valid number.");
        return { ok: false };
      }
      return { ok: true, value: parsed };
    }
    if (kind === "string") {
      return { ok: true, value: draft };
    }
    try {
      const parsed = JSON.parse(draft) as SettingValue;
      if (parsed === null) {
        setValueError("Value cannot be null.");
        return { ok: false };
      }
      return { ok: true, value: parsed };
    } catch {
      setValueError("Enter a valid JSON value.");
      return { ok: false };
    }
  }

  function handleSubmit() {
    if (!formValid) return;
    setValueError(null);
    const result = buildValue();
    if (!result.ok) return;
    const targetKey = mode === "create" ? trimmedKey : setting?.key;
    if (!targetKey) return;
    mutation.mutate(
      { key: targetKey, value: result.value, reason: reason.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const title =
    mode === "create" ? "New setting" : setting ? setting.key : "Edit setting";
  const description =
    mode === "create"
      ? "Create a new global configuration value. The change is recorded in the audit trail."
      : setting?.description ||
        "Update the value. The change is recorded in the audit trail.";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!formValid || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? (
              <Spinner />
            ) : mode === "create" ? (
              "Create setting"
            ) : (
              "Save changes"
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {mode === "create" ? (
          <>
            <Input
              label="Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. enrollment.max_electives"
              error={
                trimmedKey.length > 0 && keyCollision
                  ? "A setting with this key already exists."
                  : undefined
              }
            />
            <Select
              label="Value type"
              options={VALUE_KIND_OPTIONS}
              value={selectedKind}
              onChange={handleKindChange}
            />
          </>
        ) : null}

        {kind === "boolean" ? (
          <Switch
            checked={draft === "true"}
            onCheckedChange={(checked) => setDraft(checked ? "true" : "false")}
            label="Value"
          />
        ) : kind === "number" ? (
          <Input
            label="Value"
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            error={valueError ?? undefined}
          />
        ) : kind === "string" ? (
          <Input
            label="Value"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            error={valueError ?? undefined}
          />
        ) : kind === "stringList" ? (
          <ChipsInput
            label="Value"
            value={chips}
            onChange={setChips}
            placeholder="Add a value and press Enter"
          />
        ) : (
          <Textarea
            label="Value (JSON)"
            rows={5}
            spellCheck={false}
            className="font-mono text-body-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            error={valueError ?? undefined}
          />
        )}

        <Textarea
          label="Reason"
          rows={2}
          placeholder="Why is this value changing?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={
            reason.length > 0 && !reasonValid
              ? `Provide at least ${MIN_REASON_LENGTH} characters.`
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}

/** Serialize the current value into the textual draft for its editor kind. */
function initialDraft(value: SettingValue, kind: ValueKind): string {
  if (kind === "boolean") return value === true ? "true" : "false";
  if (kind === "number") return String(value);
  if (kind === "string") return value as string;
  return JSON.stringify(value, null, 2);
}
