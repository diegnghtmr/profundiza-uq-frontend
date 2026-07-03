import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";

describe("Tabs", () => {
  it("swaps the active panel when a different trigger is activated", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Academic records</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="records">Records panel</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Overview panel")).toBeInTheDocument();
    expect(screen.queryByText("Records panel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Academic records" }));

    expect(await screen.findByText("Records panel")).toBeInTheDocument();
    expect(screen.queryByText("Overview panel")).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Academic records" }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
