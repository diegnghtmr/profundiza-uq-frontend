import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore, MAX_DRAFT_SELECTION } from "@/shared/stores/uiStore";

function reset() {
  useUiStore.getState().clearDraft();
}

describe("uiStore draft selection", () => {
  beforeEach(reset);

  it("adds a group and reports it as in-draft", () => {
    const result = useUiStore.getState().toggleDraftGroup("g1");
    expect(result).toBe("added");
    expect(useUiStore.getState().isInDraft("g1")).toBe(true);
  });

  it("toggles an existing group back out", () => {
    const store = useUiStore.getState();
    store.toggleDraftGroup("g1");
    const result = useUiStore.getState().toggleDraftGroup("g1");
    expect(result).toBe("removed");
    expect(useUiStore.getState().isInDraft("g1")).toBe(false);
  });

  it(`enforces the max of ${MAX_DRAFT_SELECTION} selections`, () => {
    const store = useUiStore.getState();
    for (let i = 0; i < MAX_DRAFT_SELECTION; i++) {
      expect(store.toggleDraftGroup(`g${i}`)).toBe("added");
    }
    expect(useUiStore.getState().draftGroupIds).toHaveLength(MAX_DRAFT_SELECTION);

    // The 5th distinct group is rejected without mutating the draft.
    const result = useUiStore.getState().toggleDraftGroup("overflow");
    expect(result).toBe("limit-reached");
    expect(useUiStore.getState().draftGroupIds).toHaveLength(MAX_DRAFT_SELECTION);
    expect(useUiStore.getState().isInDraft("overflow")).toBe(false);
  });

  it("still allows removing a selected group when at the limit", () => {
    const store = useUiStore.getState();
    for (let i = 0; i < MAX_DRAFT_SELECTION; i++) store.toggleDraftGroup(`g${i}`);
    expect(useUiStore.getState().toggleDraftGroup("g0")).toBe("removed");
    expect(useUiStore.getState().draftGroupIds).toHaveLength(
      MAX_DRAFT_SELECTION - 1,
    );
  });
});
