import type { ReactNode } from "react";
import { errorMessage } from "@/shared/lib/apiErrors";
import { PageSkeleton } from "./PageSkeleton";
import { EmptyState } from "./EmptyState";
import { InlineError } from "./InlineError";

export interface DataStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  error?: unknown;
  onRetry?: () => void;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  children: ReactNode;
}

/**
 * Orchestrates the loading/error/empty/content branches for a TanStack Query
 * result (FR-003/FR-004). Props-only — reads query flags passed by the
 * caller, does NOT fetch data itself (ADR-009).
 *
 * Branch order (first match wins): isLoading -> isError -> isEmpty -> children.
 */
export function DataState({
  isLoading,
  isError,
  isEmpty = false,
  error,
  onRetry,
  skeleton,
  emptyState,
  children,
}: DataStateProps) {
  if (isLoading) {
    return <>{skeleton ?? <PageSkeleton />}</>;
  }
  if (isError) {
    return <InlineError message={errorMessage(error)} onRetry={onRetry} />;
  }
  if (isEmpty) {
    return <>{emptyState ?? <EmptyState title="Nothing here yet." />}</>;
  }
  return <>{children}</>;
}
