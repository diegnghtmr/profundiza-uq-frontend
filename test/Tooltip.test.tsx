import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "@/shared/components/ui/Tooltip";

describe("Tooltip", () => {
  it("reveals its content on focus, alongside an always-visible trigger label (FR-005)", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Downloads the generated report as a PDF file">
        <button>Download</button>
      </Tooltip>,
    );

    // The trigger itself already carries a visible, accessible label — the
    // tooltip only adds supplementary detail, never the sole path to the
    // action (CC-A11Y: tooltip content is never the only path to complete a
    // workflow).
    const trigger = screen.getByRole("button", { name: "Download" });
    expect(
      screen.queryByText("Downloads the generated report as a PDF file"),
    ).not.toBeInTheDocument();

    await user.tab();
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Downloads the generated report as a PDF file",
    );
  });
});
