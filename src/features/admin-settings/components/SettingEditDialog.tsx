import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  Input,
  Spinner,
  Switch,
  Textarea,
} from "@/shared/components/ui";
import {
  MIN_REASON_LENGTH,
  useUpdateSetting,
  type GlobalSetting,
  type SettingValue,
} from "../api/settingsApi";

/** Editor mode derived from the current value's runtime type. */
type ValueKind = "boolean" | "number" | "string" | "json";

function kindOf(value: SettingValue): ValueKind {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  return "json";
}

/**
 * Edits a single global setting. The value is JSONB, so the control adapts to
 * the value's type: a toggle for booleans, a typed field for numbers/strings,
 * and a raw-JSON textarea for objects/arrays. A reason (>= 3 chars) is required.
 */
export function SettingEditDialog({
  setting,
  open,
  onOpenChange,
}: {
  setting: GlobalSetting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateSetting = useUpdateSetting();
  const kind = useMemo<ValueKind>(
    () => (setting ? kindOf(setting.value) : "json"),
    [setting],
  );

  const [draft, setDraft] = useState("");
  const [reason, setReason] = useState("");
  const [valueError, setValueError] = useState<string | null>(null);

  // Reset the form whenever a different setting opens the dialog. Done during
  // render (React's "adjust state on prop change" pattern) instead of an effect.
  const [sync, setSync] = useState<{
    open: boolean;
    setting: GlobalSetting | null;
    kind: ValueKind;
  }>({ open: false, setting: null, kind: "json" });
  if (sync.open !== open || sync.setting !== setting || sync.kind !== kind) {
    setSync({ open, setting, kind });
    if (open && setting) {
      setReason("");
      setValueError(null);
      setDraft(initialDraft(setting.value, kind));
    }
  }

  const reasonValid = reason.trim().length >= MIN_REASON_LENGTH;

  function buildValue(): { ok: true; value: SettingValue } | { ok: false } {
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

  function handleSave() {
    if (!setting || !reasonValid) return;
    setValueError(null);
    const result = buildValue();
    if (!result.ok) return;
    updateSetting.mutate(
      { key: setting.key, value: result.value, reason: reason.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={setting ? setting.key : "Edit setting"}
      description={
        setting?.description ||
        "Update the value. The change is recorded in the audit trail."
      }
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!reasonValid || updateSetting.isPending}
            onClick={handleSave}
          >
            {updateSetting.isPending ? <Spinner /> : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
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
