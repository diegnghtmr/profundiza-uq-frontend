import { Toaster } from "sonner";

type ToastTone = "success" | "error" | "warning" | "info";

/**
 * Same accent-per-tone contract as the legacy Toast (Toast.tsx), so the
 * visual identity survives the PR3 migration. `info` uses neutral slate
 * instead of legacy's marigold — marigold now belongs solely to `warning`
 * (ADR-006: two distinct accents instead of an indistinct shared one).
 */
const ACCENT: Record<ToastTone, string> = {
  error: "var(--color-spectrum-gradient)",
  success: "var(--color-signal-blue)",
  warning: "var(--color-marigold)",
  info: "var(--color-slate)",
};

function Dot({ tone }: { tone: ToastTone }) {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: ACCENT[tone] }}
    />
  );
}

/**
 * Sonner-backed toaster (FR-002). Styled via `toastOptions.classNames`
 * mapped to the existing `.surface-frosted` surface + theme tokens, with a
 * custom accent `Dot` per tone via the `icons` prop — the ONLY chromatic
 * element. Deliberately NOT `unstyled` (fights Sonner's internal layout/
 * animation, ADR-002) and never a saturated fill (CC-VISUAL).
 */
export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-right"
      gap={12}
      offset={24}
      icons={{
        success: <Dot tone="success" />,
        error: <Dot tone="error" />,
        warning: <Dot tone="warning" />,
        info: <Dot tone="info" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "surface-frosted rounded-[20px] px-5 py-4 shadow-[var(--shadow-sm)] gap-3",
          title: "text-body-sm text-ink-black",
          description: "text-body-sm text-graphite",
          actionButton: "text-body-sm text-ink-black",
          closeButton: "text-slate hover:text-ink-black",
        },
      }}
    />
  );
}
