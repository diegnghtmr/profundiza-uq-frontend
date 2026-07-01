import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Icon } from "@/shared/components/ui/Icon";

describe("Icon", () => {
  it("hides a decorative icon from assistive tech with no accessible name", () => {
    const { container } = render(<Icon name="check" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("aria-label");
    expect(svg).not.toHaveAttribute("role", "img");
  });

  it("exposes the icon's label as the button's accessible name when it is the only content", () => {
    render(
      <button type="button">
        <Icon name="close" label="Close" />
      </button>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
