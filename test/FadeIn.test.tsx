import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FadeIn } from "@/shared/components/ui/FadeIn";

function mockPrefersReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("FadeIn", () => {
  it("applies the fadeIn variant (opacity + upward drift) and settles at opacity 1 (FR-006)", async () => {
    mockPrefersReducedMotion(false);
    render(
      <FadeIn>
        <p>Content</p>
      </FadeIn>,
    );
    const wrapper = screen.getByText("Content").parentElement as HTMLElement;

    // The `initial` keyframe applies synchronously at mount (motion writes
    // it before the first paint to avoid a flash of unstyled content) — this
    // is the deterministic starting state, not an interpolated animation
    // frame, so asserting on it here is not a mid-animation assertion.
    // fadeIn tracks a `y` transform value, so a transform is present from
    // the start; the reduced-motion variant never tracks one.
    expect(wrapper.style.transform).not.toBe("none");

    await waitFor(() => {
      expect(wrapper.style.opacity).toBe("1");
    });
  });

  it("strips the transform and applies opacity-only motion when reduced motion is preferred (FR-006 scenario 1)", async () => {
    mockPrefersReducedMotion(true);
    render(
      <FadeIn>
        <p>Content</p>
      </FadeIn>,
    );
    const wrapper = screen.getByText("Content").parentElement as HTMLElement;

    await waitFor(() => {
      expect(wrapper.style.opacity).toBe("1");
    });
    // No `y`/scale value is tracked for the reduced-motion variant, so
    // motion never produces an actual transform.
    expect(wrapper.style.transform).toBe("none");
  });

  it("keeps children operable immediately, before the entrance transition settles (FR-006 scenario 2)", async () => {
    mockPrefersReducedMotion(false);
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <FadeIn>
        <button type="button" onClick={onClick}>
          Click me
        </button>
      </FadeIn>,
    );

    await user.click(screen.getByRole("button", { name: "Click me" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
