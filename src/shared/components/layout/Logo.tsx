import { cn } from "@/shared/lib/cn";

/**
 * Brand mark + wordmark. The squircle uses the spectrum gradient — the one place
 * the brand color is allowed to live, "where a logo mark would in other systems".
 */
export function Logo({
  subtitle,
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="size-7 shrink-0 rounded-[10px]"
        style={{ background: "var(--gradient-spectrum)" }}
      />
      <span className="flex flex-col leading-tight">
        <span className="text-body font-medium text-ink-black">
          Profundizaciones
        </span>
        {subtitle ? (
          <span className="text-caption text-slate">{subtitle}</span>
        ) : null}
      </span>
    </div>
  );
}
