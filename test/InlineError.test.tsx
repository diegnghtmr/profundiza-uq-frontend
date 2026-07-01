import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineError } from "@/shared/components/ui/InlineError";

describe("InlineError", () => {
  it("exposes an alert role and renders the message for the error tone (FR-004)", () => {
    render(<InlineError message="Something went wrong. Please try again." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong. Please try again.");
  });

  it("does not expose an alert role for non-error tones", () => {
    render(<InlineError message="Capacity is limited" tone="warning" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Capacity is limited")).toBeInTheDocument();
  });

  it("calls onRetry exactly once when the Retry action is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<InlineError message="Failed to load" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render a Retry action when onRetry is not provided", () => {
    render(<InlineError message="Failed to load" />);
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  });
});
