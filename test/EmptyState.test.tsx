import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
