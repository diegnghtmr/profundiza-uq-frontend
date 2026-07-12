import * as RadixSelect from "@radix-ui/react-select";
import { useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  /** Visible field label, wired to the trigger via htmlFor. */
  label?: string;
  /** Error message; sets aria-invalid and describes the field. */
  error?: string;
  options: ReadonlyArray<SelectOption>;
  value: string;
  /** Called with the selected value (not the change event). */
  onChange: (value: string) => void;
  /** Shown when `value` is empty; styled in `text-slate`. */
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  /** Applied to the trigger. */
  className?: string;
}

/**
 * Accessible dropdown built on `@radix-ui/react-select`. Unlike a native
 * `<select>`, the open listbox is fully styled to match the app's frosted
 * design (mirroring DropdownMenu's content/item conventions). Full keyboard
 * support, roving focus, type-ahead, and Escape-to-close are delegated to
 * Radix.
 *
 * Matches {@link Input}'s closed-state look and keeps the label + error
 * contract: label wired via `htmlFor`, `aria-invalid`, and a described error
 * message. Emits the raw string value (mirroring SearchField), so it drops
 * straight onto a react-hook-form `field.onChange`.
 *
 * Radix reserves the empty string for the placeholder state, so options MUST
 * NOT use `value=""` (such an item can never render as selected). Pass
 * `placeholder` and leave `value` empty instead.
 */
export function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  id,
  name,
  className,
}: SelectProps) {
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

      <RadixSelect.Root
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        name={name}
      >
        <RadixSelect.Trigger
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "group flex h-12 w-full items-center justify-between gap-2 rounded-2xl bg-snow px-5 text-body text-ink-black",
            "ring-1 ring-inset ring-ink-black/10",
            "transition-shadow duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-ink-black/25",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[placeholder]:text-slate",
            error && "ring-spectrum-gradient/50 focus:ring-spectrum-gradient/60",
            className,
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <Icon
              name="chevron-down"
              size="md"
              className="shrink-0 text-slate transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className={cn(
              "surface-frosted z-50 overflow-hidden rounded-[16px] p-1.5",
              "w-[var(--radix-select-trigger-width)]",
              "data-[state=open]:animate-in focus:outline-none",
            )}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-slate">
              <Icon name="chevron-down" size="sm" className="rotate-180" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="max-h-[var(--radix-select-content-available-height)]">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "flex cursor-pointer select-none items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-body text-ink-black/85 outline-none transition-colors duration-150 ease-out",
                    "data-[highlighted]:bg-ink-black/[0.05]",
                    "data-[state=checked]:text-ink-black",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                  )}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="shrink-0">
                    <Icon name="check" size="sm" className="text-ink-black" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-slate">
              <Icon name="chevron-down" size="sm" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error ? (
        <p id={errorId} className="text-body-sm text-spectrum-gradient">
          {error}
        </p>
      ) : null}
    </div>
  );
}
