import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollArea } from "@/shared/components/ui/ScrollArea";

describe("ScrollArea", () => {
  it("renders its children inside a scrollable viewport with a scrollbar", () => {
    render(
      <ScrollArea>
        <p>Row one</p>
        <p>Row two</p>
      </ScrollArea>,
    );

    expect(screen.getByText("Row one")).toBeInTheDocument();
    expect(screen.getByText("Row two")).toBeInTheDocument();
    expect(
      document.querySelector("[data-radix-scroll-area-viewport]"),
    ).toBeInTheDocument();
  });
});
