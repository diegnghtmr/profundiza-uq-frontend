import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";

describe("PageSkeleton", () => {
  it("hides the wrapper from assistive tech and marks the content container busy (FR-003)", () => {
    const { container } = render(<PageSkeleton />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    const busyContainer = wrapper?.querySelector('[aria-busy="true"]');
    expect(busyContainer).not.toBeNull();
  });

  it("composes the requested number of skeleton lines plus a header skeleton", () => {
    const { container } = render(<PageSkeleton lines={5} />);
    const busyContainer = container.querySelector('[aria-busy="true"]');
    const skeletons = busyContainer?.querySelectorAll('[aria-hidden="true"]');
    // 1 header-line skeleton + 5 body-line skeletons
    expect(skeletons).toHaveLength(6);
  });
});
