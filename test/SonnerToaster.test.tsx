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

  // Cascade-layer mitigation: Tailwind v4 utilities live in @layer, but Sonner
  // injects UNLAYERED base CSS that wins regardless of specificity. The frosted
  // surface therefore relies on (a) Sonner's parameterized CSS custom props for
  // background/border/text and (b) !important utilities for the layout props
  // Sonner hardcodes. jsdom can't assert the real cascade, so we assert the
  // mitigation is wired.
  it("overrides Sonner's unlayered base CSS so the frosted surface survives", async () => {
    render(<SonnerToaster />);
    toast.error("Boom");
    await screen.findByText("Boom");

    const toaster = document.querySelector<HTMLElement>("[data-sonner-toaster]");
    expect(toaster).not.toBeNull();
    expect(toaster?.style.getPropertyValue("--normal-bg").trim()).toBe(
      "rgba(255, 255, 255, 0.9)",
    );

    const toastEl = screen
      .getByText("Boom")
      .closest("[data-sonner-toast]") as HTMLElement | null;
    const cls = toastEl?.className ?? "";
    expect(cls).toContain("!rounded-[20px]");
    expect(cls).toContain("!shadow-[var(--shadow-sm)]");
    expect(cls).toContain("!px-5");
  });
});
