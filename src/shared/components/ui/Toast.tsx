import { cn } from "@/shared/lib/cn";
import { useToastStore, type ToastTone } from "@/shared/stores/toastStore";

const TONE_ACCENT: Record<ToastTone, string> = {
  error: "#fa3d1d",
  success: "#0358f7",
  info: "#ffb005",
};

/**
 * Fixed-position stack of transient notifications. Monochrome frosted surface
 * with a single accent dot per the design system (no saturated fills).
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[min(92vw,380px)] flex-col gap-3"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="surface-frosted pointer-events-auto flex items-start gap-3 rounded-[20px] px-5 py-4 shadow-[var(--shadow-sm)]"
        >
          <span
            aria-hidden="true"
            className="mt-1.5 size-2 shrink-0 rounded-full"
            style={{ backgroundColor: TONE_ACCENT[t.tone] }}
          />
          <p className="flex-1 text-body-sm text-ink-black">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className={cn(
              "shrink-0 rounded-full px-2 text-body-sm text-slate transition-colors",
              "hover:text-ink-black",
            )}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
