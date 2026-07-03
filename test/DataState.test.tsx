import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataState } from "@/shared/components/ui/DataState";
import { ApiRequestError } from "@/shared/api/client";

describe("DataState", () => {
  it("renders the loading skeleton when isLoading is true, even if isError/isEmpty are also true", () => {
    const { container } = render(
      <DataState isLoading isError isEmpty>
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.queryByText("Real content")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("renders InlineError with the friendly API message when isError is true", () => {
    render(
      <DataState
        isLoading={false}
        isError
        isEmpty
        error={
          new ApiRequestError(409, {
            code: "CAPACITY_EXCEEDED",
            message: "raw backend message",
            traceId: "t-1",
          })
        }
      >
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This group has no seats available right now.",
    );
    expect(screen.queryByText("Real content")).not.toBeInTheDocument();
  });

  it("renders EmptyState when isEmpty is true and there is no loading/error", () => {
    render(
      <DataState isLoading={false} isError={false} isEmpty>
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.queryByText("Real content")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the children when loading/error/empty are all false", () => {
    render(
      <DataState isLoading={false} isError={false} isEmpty={false}>
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.getByText("Real content")).toBeInTheDocument();
  });
});
