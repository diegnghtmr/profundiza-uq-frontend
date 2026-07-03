import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDialog } from "@/shared/components/ui/AlertDialog";

describe("AlertDialog", () => {
  it("fires the bound confirm action exactly once when confirmed (FR-005 scenario 1)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AlertDialog
        open
        onOpenChange={onOpenChange}
        title="Cancel this request?"
        description="You lose your position in the queue."
        onConfirm={onConfirm}
        tone="danger"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not fire the confirm action on cancel or Escape, and closes the dialog (FR-005 scenario 2)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AlertDialog
        open
        onOpenChange={onOpenChange}
        title="Cancel this request?"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.keyboard("{Escape}");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not auto-close on confirm — the parent controls close so a pending action can show progress", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AlertDialog
        open
        onOpenChange={onOpenChange}
        title="Cancel this request?"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Radix AlertDialogAction auto-closes by default; the wrapper prevents that
    // so the caller can keep the dialog open (e.g. show a spinner) until the
    // async confirm settles, then close via `open`/`onOpenChange`.
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("disables the confirm action while a pending flag is set (double-submit guard)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Cancel this request?"
        onConfirm={onConfirm}
        confirmLabel="Cancel request"
        confirmDisabled
      />,
    );

    const confirm = screen.getByRole("button", { name: "Cancel request" });
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("exposes title and description via aria-labelledby/aria-describedby (FR-005 scenario 3)", () => {
    render(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Cancel this request?"
        description="You lose your position in the queue."
        onConfirm={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("alertdialog", {
      name: "Cancel this request?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "You lose your position in the queue.",
    );
  });

  it("keeps the danger-tone confirm button on the neutral bg-snow surface, never a saturated fill", () => {
    render(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Cancel this request?"
        onConfirm={vi.fn()}
        tone="danger"
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass(
      "bg-snow",
    );
  });
});
