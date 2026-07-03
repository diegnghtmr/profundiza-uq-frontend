import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";

describe("DropdownMenu", () => {
  it("opens via keyboard, moves focus through items with arrow keys, and closes on Escape (FR-005 scenario 4)", async () => {
    const user = userEvent.setup();
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Actions</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onFirst}>First action</DropdownMenuItem>
          <DropdownMenuItem onSelect={onSecond}>Second action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    const firstItem = await screen.findByRole("menuitem", { name: "First action" });
    expect(firstItem).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("menuitem", { name: "Second action" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("menuitem", { name: "First action" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
