import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "./Icon";

export interface SearchFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value: string;
  /** Called with the raw string value (not the change event). */
  onChange: (value: string) => void;
  /** Accessible name; also used as the placeholder when none is given. */
  label?: string;
}

/**
 * Search input with a leading magnifier and an inline clear affordance. A
 * local composition over the app's snow/ink-black field styling (matching
 * Input), sized with more presence so it holds its own next to the catalog
 * filter controls (SegmentedControl, FilterPill).
 */
export function SearchField({
  value,
  onChange,
  label = "Search",
  placeholder,
  className,
  id,
  ...props
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      className={cn(
        "group relative flex h-12 items-center rounded-2xl bg-snow",
        "ring-1 ring-inset ring-ink-black/10 transition-shadow duration-200 ease-out",
        "focus-within:ring-2 focus-within:ring-ink-black/25",
        className,
      )}
    >
      <Icon
        name="search"
        size="md"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate transition-colors duration-200 group-focus-within:text-ink-black/70"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        aria-label={label}
        className={cn(
          "h-full w-full rounded-2xl bg-transparent pl-11 pr-11 text-body text-ink-black",
          "placeholder:text-slate focus:outline-none",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full",
            "text-slate transition-colors duration-200 hover:bg-ink-black/[0.05] hover:text-ink-black",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-black/15",
          )}
        >
          <Icon name="close" size="sm" />
        </button>
      ) : null}
    </div>
  );
}
