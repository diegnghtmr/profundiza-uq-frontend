import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/shared/components/ui/Button";

describe("Button", () => {
  it("renders the neutral pebble variant by default", () => {
    render(<Button>Send code</Button>);
    const btn = screen.getByRole("button", { name: "Send code" });
    expect(btn).toHaveClass("bg-pebble");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("applies the ghost variant as a transparent pill", () => {
    render(<Button variant="ghost">Tab</Button>);
    const btn = screen.getByRole("button", { name: "Tab" });
    expect(btn).toHaveClass("bg-transparent");
    expect(btn).toHaveClass("rounded-full");
  });

  it("uses a subtle red border for the danger variant (never a saturated fill)", () => {
    render(<Button variant="danger">Cancel request</Button>);
    const btn = screen.getByRole("button", { name: "Cancel request" });
    // Surface stays neutral/white; only the border borrows a gradient stop.
    expect(btn).toHaveClass("bg-snow");
    expect(btn.className).toContain("border-spectrum-gradient");
  });

  it("disables interaction when disabled", () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
