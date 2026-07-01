import * as RadixSwitch from "@radix-ui/react-switch";
import { useId } from "react";
import { cn } from "@/shared/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Accessible toggle built on Radix. Monochrome track (`bg-pebble` ->
 * `data-[state=checked]:bg-ink-black`) and a plain `snow` thumb — no
 * saturated fill for the checked state (CC-VISUAL). The optional `label`
 * associates via a real `<label htmlFor>` pointing at the switch's id.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: SwitchProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full bg-pebble outline-none",
          "transition-colors duration-200 ease-out",
          "data-[state=checked]:bg-ink-black",
          "focus-visible:ring-2 focus-visible:ring-ink-black/15 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "block size-[18px] rounded-full bg-snow",
            "translate-x-[3px] transition-transform duration-200 ease-out",
            "data-[state=checked]:translate-x-[19px]",
          )}
        />
      </RadixSwitch.Root>
      {label ? (
        <label htmlFor={id} className="text-body-sm text-ink-black/85">
          {label}
        </label>
      ) : null}
    </div>
  );
}
