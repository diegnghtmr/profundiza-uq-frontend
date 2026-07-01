import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible field label, wired via htmlFor. */
  label?: string;
  /** Error message; sets aria-invalid and describes the field. */
  error?: string;
}

/** Multi-line counterpart to {@link Input}: same label association, aria-invalid
 *  wiring, and described error message. Forwards its ref for react-hook-form. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-body-sm font-medium text-graphite"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full rounded-2xl bg-snow p-4 text-body text-ink-black",
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
Textarea.displayName = "Textarea";
