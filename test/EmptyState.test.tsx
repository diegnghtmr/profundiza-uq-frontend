import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/shared/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders the title, description, and a decorative icon (FR-004)", () => {
    render(
      <EmptyState
        icon="search"
        title="No results"
        description="Try a different filter."
      />,
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try a different filter.")).toBeInTheDocument();
    const icon = document.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the provided action", () => {
    render(
      <EmptyState
        title="No requests yet"
        action={<button type="button">Create request</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Create request" }),
    ).toBeInTheDocument();
  });

  it("uses the frosted monochrome card surface (CC-VISUAL)", () => {
    const { container } = render(<EmptyState title="No results" />);
    expect(container.firstElementChild).toHaveClass("surface-frosted");
  });

  it("enters via the FadeIn motion primitive and keeps its action clickable immediately (FR-006 scenario 2)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <EmptyState
        title="No requests yet"
        action={
          <button type="button" onClick={onClick}>
            Create request
          </button>
        }
      />,
    );

    // motion.div writes an inline `opacity` style synchronously at mount —
    // its presence proves the card entrance runs through FadeIn.
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.opacity).not.toBe("");

    await user.click(screen.getByRole("button", { name: "Create request" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
