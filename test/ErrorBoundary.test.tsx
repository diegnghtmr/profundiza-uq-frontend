import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { ErrorFallback } from "@/app/ErrorFallback";
import { RouteErrorElement } from "@/app/RouteErrorElement";
import { AppErrorBoundary } from "@/app/AppErrorBoundary";

function Boom(): never {
  throw new Error("kaboom");
}

describe("ErrorFallback", () => {
  it("renders the branded copy and a reload affordance", async () => {
    const onReload = vi.fn();
    render(<ErrorFallback onReload={onReload} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /reload/i });
    await userEvent.click(button);
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});

describe("RouteErrorElement as a route errorElement", () => {
  it("renders the branded fallback for a route render error (not RR's default page)", () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <Boom />,
        errorElement: <RouteErrorElement />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reload/i }),
    ).toBeInTheDocument();
  });
});

describe("AppErrorBoundary (provider-level errors)", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs the caught error; silence it to keep the test output clean.
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("catches a throw from its subtree and shows the branded fallback", () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders children normally when nothing throws", () => {
    render(
      <AppErrorBoundary>
        <div>healthy tree</div>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("healthy tree")).toBeInTheDocument();
  });
});
