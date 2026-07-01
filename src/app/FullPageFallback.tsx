import { Spinner } from "@/shared/components/ui";

/** Full-viewport loading state for route-level Suspense boundaries. */
export function FullPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
