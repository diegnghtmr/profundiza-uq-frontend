import { useState } from "react";
import { Button, Card, Spinner } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { SettingEditDialog } from "../components/SettingEditDialog";
import { useSettings, type GlobalSetting, type SettingValue } from "../api/settingsApi";

type DialogState =
  | { mode: "closed" }
  | { mode: "edit"; setting: GlobalSetting }
  | { mode: "create" };

export function SettingsPage() {
  const { data: settings, isLoading, isError } = useSettings();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });

  const existingKeys = (settings ?? []).map((s) => s.key);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-heading font-light tracking-[-2px] text-ink-black">
            Settings
          </h1>
          <p className="max-w-2xl text-subheading text-graphite">
            Global configuration values for the platform. Every change is
            recorded in the audit trail with a reason.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>New setting</Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="py-6 text-body-sm text-slate">
          Could not load global settings. Please try again.
        </Card>
      ) : !settings || settings.length === 0 ? (
        <Card className="flex flex-col items-start gap-4 py-6 text-body-sm text-slate">
          <span>No global settings are configured yet.</span>
          <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
            New setting
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-black/[0.06] text-caption uppercase tracking-wide text-slate">
                <Th>Setting</Th>
                <Th>Value</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr
                  key={setting.key}
                  className="border-b border-ink-black/[0.04] last:border-0"
                >
                  <Td>
                    <div className="flex flex-col gap-1">
                      <span className="text-body-sm font-medium text-ink-black">
                        {setting.key}
                      </span>
                      {setting.description ? (
                        <span className="text-caption text-slate">
                          {setting.description}
                        </span>
                      ) : null}
                    </div>
                  </Td>
                  <Td>
                    <code className="rounded-lg bg-ink-black/[0.04] px-2 py-1 font-mono text-body-sm text-ink-black/85">
                      {formatValue(setting.value)}
                    </code>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => setDialog({ mode: "edit", setting })}
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

      <SettingEditDialog
        mode={dialog.mode === "create" ? "create" : "edit"}
        setting={dialog.mode === "edit" ? dialog.setting : null}
        existingKeys={existingKeys}
        open={dialog.mode !== "closed"}
        onOpenChange={(open) => !open && setDialog({ mode: "closed" })}
      />
    </section>
  );
}

/** Render a JSON value as a compact, readable preview for the table cell. */
function formatValue(value: SettingValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value === null) return "null";
  return JSON.stringify(value);
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
