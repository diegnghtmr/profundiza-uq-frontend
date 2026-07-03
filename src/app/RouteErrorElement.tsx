import { useRouteError } from "react-router-dom";
import { ErrorFallback } from "./ErrorFallback";

/**
 * Route-level `errorElement`. React Router catches render/loader errors thrown
 * inside a route and renders this instead of its default (developer-oriented)
 * page, so users see the branded fallback.
 */
export function RouteErrorElement() {
  const error = useRouteError();
  // Log for diagnosis; the user only sees the branded fallback.
  console.error("Route error:", error);
  return <ErrorFallback />;
}
