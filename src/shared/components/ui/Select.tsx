import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Visible field label, wired via htmlFor. */
  label?: string;
  /** Error message; sets aria-invalid and describes the field. */
  error?: string;
  options: ReadonlyArray<SelectOption>;
}

/** Native select styled to match {@link Input}: label association, aria-invalid,
 *  and a described error message. Forwards its ref for react-hook-form. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, options, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={selectId}
            className="text-body-sm font-medium text-graphite"
          >
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full rounded-2xl bg-snow px-5 text-body text-ink-black",
            "ring-1 ring-inset ring-ink-black/10",
            "transition-shadow duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-ink-black/25",
            error && "ring-spectrum-gradient/50 focus:ring-spectrum-gradient/60",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p id={errorId} className="text-body-sm text-spectrum-gradient">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";
