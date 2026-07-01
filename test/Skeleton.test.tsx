import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "@/shared/components/ui/Skeleton";

describe("Skeleton", () => {
  it("renders a decorative pulse placeholder hidden from assistive tech (FR-003)", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("animate-pulse");
  });

  it("applies the requested rounded variant", () => {
    const { container } = render(<Skeleton rounded="full" />);
    expect(container.firstElementChild).toHaveClass("rounded-full");
  });
});
