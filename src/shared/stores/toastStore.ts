import { create } from "zustand";

export type ToastTone = "error" | "success" | "info";

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

/** How long a toast stays on screen before it auto-dismisses (ms). */
const TOAST_TTL = 5000;

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

/**
 * Tiny transient-notification store. UI-only state, so it lives in Zustand
 * rather than the query cache. Toasts auto-expire; `dismiss` removes early.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    window.setTimeout(() => get().dismiss(id), TOAST_TTL);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helpers for use outside React (e.g. mutation `onError`). */
export const toast = {
  error: (message: string) => useToastStore.getState().push({ tone: "error", message }),
  success: (message: string) =>
    useToastStore.getState().push({ tone: "success", message }),
  info: (message: string) => useToastStore.getState().push({ tone: "info", message }),
};
