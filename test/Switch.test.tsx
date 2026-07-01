import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "@/shared/components/ui/Switch";

describe("Switch", () => {
  it("calls onCheckedChange(true) when toggled and associates its accessible label", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Enabled" />);

    const toggle = screen.getByRole("switch", { name: "Enabled" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("reflects the checked state without a saturated fill (monochrome track)", () => {
    render(<Switch checked={true} onCheckedChange={vi.fn()} label="Enabled" />);

    const toggle = screen.getByRole("switch", { name: "Enabled" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle.className).not.toMatch(/bg-(red|green|blue|marigold|signal-blue|spectrum-gradient)/);
  });
});
