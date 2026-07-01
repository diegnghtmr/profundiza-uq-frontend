import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { SonnerToaster } from "@/shared/components/ui/SonnerToaster";

// Visual-identity guard (design Section 8 / CC-VISUAL): the toaster surface
// stays monochrome/frosted, the ONLY chromatic element is a small accent dot
// — never a saturated background fill.
describe("SonnerToaster", () => {
  it("renders a toast on a frosted monochrome surface, never a saturated fill", async () => {
    render(<SonnerToaster />);
    toast.error("Something went wrong");

    const messageEl = await screen.findByText("Something went wrong");
    const toastEl = messageEl.closest("[data-sonner-toast]");
    expect(toastEl).not.toBeNull();
    expect(toastEl).toHaveClass("surface-frosted");
    expect(toastEl?.className ?? "").not.toMatch(
      /bg-(red|rose|amber|orange|emerald|green|blue|sky|indigo|violet|fuchsia|pink|yellow)-/,
    );
  });

  it("uses an accent dot (aria-hidden), not a colored icon glyph, per tone", async () => {
    render(<SonnerToaster />);
    toast.success("Saved");

    const messageEl = await screen.findByText("Saved");
    const toastEl = messageEl.closest("[data-sonner-toast]");
    const dot = toastEl?.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveStyle({ backgroundColor: "var(--color-signal-blue)" });
  });
});
