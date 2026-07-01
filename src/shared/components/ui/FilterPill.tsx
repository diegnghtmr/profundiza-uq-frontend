import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Pill toggle used by the catalog filters (Day/Night/All, area chips). Active
 * state inverts to ink-black, matching the prototype's "All areas" selection.
 */
export function FilterPill({
  active = false,
  className,
  type = "button",
  ...props
}: FilterPillProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center rounded-full px-5 text-body-sm font-medium",
        "transition-colors duration-200 ease-out focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-ink-black/15",
        active
          ? "bg-ink-black text-snow"
          : "bg-snow text-ink-black/85 ring-1 ring-inset ring-ink-black/10 hover:bg-ink-black/[0.03]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Segmented control (e.g. All / Day / Night) rendered as a single soft track.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ink-black/[0.04] p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 rounded-full px-4 text-body-sm font-medium transition-colors duration-200 ease-out",
              active
                ? "bg-snow text-ink-black shadow-[var(--shadow-sm)]"
                : "text-slate hover:text-ink-black/80",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
