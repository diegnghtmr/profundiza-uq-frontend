import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible field label. Rendered above the control and wired via htmlFor. */
  label?: string;
  /** Error message; sets aria-invalid and describes the field. */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-body-sm font-medium text-graphite"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full rounded-2xl bg-snow px-5 text-body text-ink-black",
            "placeholder:text-slate ring-1 ring-inset ring-ink-black/10",
            "transition-shadow duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-ink-black/25",
            error && "ring-spectrum-gradient/50 focus:ring-spectrum-gradient/60",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-body-sm text-spectrum-gradient">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
