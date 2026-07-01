import { toast as sonnerToast, type ExternalToast } from "sonner";
import { errorMessage } from "@/shared/lib/apiErrors";

/**
 * Options a caller may pass through to Sonner. Kept small and vendor-agnostic
 * on purpose — this is the public seam features are allowed to depend on.
 */
export interface NotifyOptions {
  id?: string | number;
  duration?: number;
  description?: string;
  action?: { label: string; onClick: () => void };
}

type Id = string | number;

function toExternalToast(options?: NotifyOptions): ExternalToast | undefined {
  if (!options) return undefined;
  return {
    id: options.id,
    duration: options.duration,
    description: options.description,
    action: options.action,
  };
}

/**
 * Feedback facade over Sonner (FR-002). Features MUST import `notify` here,
 * never `sonner` directly — this keeps the vendor swappable/mockable and
 * routes error copy through the shared `errorMessage()` helper so the 9
 * friendly API codes stay consistent everywhere.
 */
export const notify = {
  success: (message: string, options?: NotifyOptions): Id =>
    sonnerToast.success(message, toExternalToast(options)),

  /** Accepts `unknown`: a raw thrown value routes through `errorMessage()`; a pre-built string passes through untouched. */
  error: (input: unknown, options?: NotifyOptions): Id =>
    sonnerToast.error(
      typeof input === "string" ? input : errorMessage(input),
      toExternalToast(options),
    ),

  info: (message: string, options?: NotifyOptions): Id =>
    sonnerToast.info(message, toExternalToast(options)),

  warning: (message: string, options?: NotifyOptions): Id =>
    sonnerToast.warning(message, toExternalToast(options)),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) =>
    sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error: unknown) =>
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error,
    }),

  dismiss: (id?: Id): void => {
    sonnerToast.dismiss(id);
  },
};
