import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "./Icon";

export interface ChipsInputProps {
  /** Current list of chip values. */
  value: string[];
  /** Called with the next list whenever a chip is added or removed. */
  onChange: (value: string[]) => void;
  /** Visible field label, wired to the text input via htmlFor. */
  label?: string;
  /** Placeholder shown only while the list is empty. */
  placeholder?: string;
  id?: string;
}

/**
 * Tag/chip editor over a `string[]`. Type a value and commit it with Enter, a
 * comma, or by blurring the field; remove a chip with its × or with Backspace
 * on an empty input. Entries are trimmed and de-duplicated. Styling mirrors
 * {@link Input}'s frosted field so it sits naturally among the other controls.
 */
export function ChipsInput({
  value,
  onChange,
  label,
  placeholder,
  id,
}: ChipsInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [text, setText] = useState("");

  function addChip(raw: string) {
    const next = raw.trim();
    setText("");
    if (next === "" || value.includes(next)) return;
    onChange([...value, next]);
  }

  function removeChip(chip: string) {
    onChange(value.filter((c) => c !== chip));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(text);
    } else if (e.key === "Backspace" && text === "" && value.length > 0) {
      removeChip(value[value.length - 1]);
    }
  }

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
      <div
        className={cn(
          "flex min-h-12 w-full flex-wrap items-center gap-2 rounded-2xl bg-snow p-2 pl-3",
          "ring-1 ring-inset ring-ink-black/10 transition-shadow duration-200 ease-out",
          "focus-within:ring-2 focus-within:ring-ink-black/25",
        )}
      >
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-ink-black/[0.06] py-1 pl-3 pr-1.5 text-body-sm text-ink-black"
          >
            {chip}
            <button
              type="button"
              onClick={() => removeChip(chip)}
              aria-label={`Remove ${chip}`}
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full text-slate",
                "transition-colors duration-150 hover:bg-ink-black/[0.08] hover:text-ink-black",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-black/15",
              )}
            >
              <Icon name="close" size="sm" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addChip(text)}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-body text-ink-black placeholder:text-slate focus:outline-none"
        />
      </div>
    </div>
  );
}
