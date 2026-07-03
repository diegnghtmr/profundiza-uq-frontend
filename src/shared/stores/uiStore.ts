import { create } from "zustand";

/** Maximum offering groups a student can include in a single enrollment plan. */
export const MAX_DRAFT_SELECTION = 4;

export type AddToDraftResult = "added" | "removed" | "limit-reached";

interface UiState {
  selectedSemesterId: string;
  /** Offering group ids staged for submission (max {@link MAX_DRAFT_SELECTION}). */
  draftGroupIds: string[];

  setSelectedSemesterId: (id: string) => void;

  /** Toggle a group in the draft. Returns the outcome so the UI can warn on limit. */
  toggleDraftGroup: (groupId: string) => AddToDraftResult;
  removeDraftGroup: (groupId: string) => void;
  clearDraft: () => void;
  isInDraft: (groupId: string) => boolean;

  /**
   * Wipe all per-session UI state (draft selection + selected semester). Must
   * run on logout AND on implicit session loss (401 on /me) so a previous
   * user's in-progress enrollment draft never leaks to the next person on a
   * shared device.
   */
  resetSession: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  // Empty until the active semester resolves from GET /semesters; data queries
  // stay disabled while it is "" so they never fire with a stale id.
  selectedSemesterId: "",
  draftGroupIds: [],

  setSelectedSemesterId: (selectedSemesterId) => set({ selectedSemesterId }),

  toggleDraftGroup: (groupId) => {
    const { draftGroupIds } = get();
    if (draftGroupIds.includes(groupId)) {
      set({ draftGroupIds: draftGroupIds.filter((id) => id !== groupId) });
      return "removed";
    }
    if (draftGroupIds.length >= MAX_DRAFT_SELECTION) {
      return "limit-reached";
    }
    set({ draftGroupIds: [...draftGroupIds, groupId] });
    return "added";
  },

  removeDraftGroup: (groupId) =>
    set((s) => ({ draftGroupIds: s.draftGroupIds.filter((id) => id !== groupId) })),

  clearDraft: () => set({ draftGroupIds: [] }),

  isInDraft: (groupId) => get().draftGroupIds.includes(groupId),

  resetSession: () => set({ draftGroupIds: [], selectedSemesterId: "" }),
}));
