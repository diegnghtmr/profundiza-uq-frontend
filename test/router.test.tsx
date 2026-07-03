import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { router } from "@/app/router";
import { RequireRole } from "@/app/RequireRole";

/**
 * Route-wiring smoke test (no rendering/network): walks the static route
 * config to confirm student-only pages are defense-in-depth gated the same
 * way the six admin pages already are, per the Scope Rule for consistency
 * across `/app` children.
 */
describe("router /app children", () => {
  const appRoute = router.routes.find((r) => r.path === "/app");
  const children = appRoute?.children ?? [];

  function guardOf(path: string) {
    const route = children.find((c) => c.path === path);
    return route?.element as ReactElement<{ allowedRoles: readonly string[] }>;
  }

  it("gates offerings behind RequireRole for STUDENT only", () => {
    const element = guardOf("offerings");
    expect(element.type).toBe(RequireRole);
    expect(element.props.allowedRoles).toEqual(["STUDENT"]);
  });

  it("gates requests behind RequireRole for STUDENT only", () => {
    const element = guardOf("requests");
    expect(element.type).toBe(RequireRole);
    expect(element.props.allowedRoles).toEqual(["STUDENT"]);
  });

  it("leaves home and notifications ungated (shared across roles)", () => {
    expect(guardOf("home").type).not.toBe(RequireRole);
    expect(guardOf("notifications").type).not.toBe(RequireRole);
  });
});
