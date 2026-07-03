import { Button } from "@/shared/components/ui";

interface ErrorFallbackProps {
  /** Reload handler. Defaults to a full page reload — the most reliable escape. */
  onReload?: () => void;
}

/**
 * Branded, monochrome full-viewport fallback for unrecoverable render errors,
 * shared by the route-level `errorElement` and the provider-level
 * {@link AppErrorBoundary}. Mirrors the frosted-glass / ambient-glow system so a
 * crash still looks like the product, not a raw stack trace.
 */
export function ErrorFallback({ onReload }: ErrorFallbackProps) {
  const reload = onReload ?? (() => window.location.reload());
  return (
    <div className="ambient-backdrop flex min-h-screen items-center justify-center p-6">
      <div className="surface-frosted flex w-full max-w-md flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center">
        <p className="text-caption uppercase tracking-[0.2em] text-slate">Error</p>
        <h1 className="text-heading-sm text-ink-black">Something went wrong</h1>
        <p className="text-body-sm text-graphite">
          An unexpected error interrupted this page. Reloading usually fixes it.
        </p>
        <Button variant="neutral" onClick={reload}>
          Reload the page
        </Button>
      </div>
    </div>
  );
}
