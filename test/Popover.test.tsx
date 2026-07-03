import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/Popover";

describe("Popover", () => {
  it("opens its content when the trigger is activated", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Filters</button>
        </PopoverTrigger>
        <PopoverContent title="Filter results">
          <p>Choose a status to narrow the list.</p>
        </PopoverContent>
      </Popover>,
    );

    expect(
      screen.queryByText("Choose a status to narrow the list."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(
      await screen.findByText("Choose a status to narrow the list."),
    ).toBeInTheDocument();
  });

  it("associates title and description via aria-labelledby/aria-describedby (FR-005 scenario 3)", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button>Filters</button>
        </PopoverTrigger>
        <PopoverContent
          title="Filter results"
          description="Choose a status to narrow the list."
        >
          <p>Body content</p>
        </PopoverContent>
      </Popover>,
    );

    const content = await screen.findByRole("dialog", {
      name: "Filter results",
    });
    const describedById = content.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById ?? "")).toHaveTextContent(
      "Choose a status to narrow the list.",
    );
  });

  it("enters via the FadeIn motion primitive and keeps its content operable immediately (FR-006 scenario 2)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button>Filters</button>
        </PopoverTrigger>
        <PopoverContent title="Filter results">
          <button type="button" onClick={onClick}>
            Apply
          </button>
        </PopoverContent>
      </Popover>,
    );

    const content = await screen.findByRole("dialog", {
      name: "Filter results",
    });
    // motion.div writes an inline `opacity` style synchronously at mount —
    // its presence proves the popover card entrance runs through FadeIn.
    const card = content.firstElementChild as HTMLElement;
    expect(card.style.opacity).not.toBe("");

    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
