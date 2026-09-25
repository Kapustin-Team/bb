import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { closePanesForThreadsAtom, splitLayoutAtom } from "./atoms";
import {
  canMaximizePane,
  findPane,
  listPanes,
  movePane,
  removePane,
  replacePaneContent,
  resizeSplit,
  setFocus,
  setPaneLocked,
  splitPane,
  swapPanes,
  serializeSplitLayout,
  deserializeSplitLayout,
  MAX_PANES,
} from "./index";
import {
  applyThreadPaneActionToLayout,
  reconcileLayoutForContent,
} from "@/views/thread-detail/splitThreadNavigation";
import type { PaneContent, SplitLayout } from "./types";

const tasks: PaneContent = {
  kind: "plugin-panel",
  pluginId: "tasks",
  panelPath: "list",
  subPath: "",
};
const thread = {
  kind: "thread",
  projectId: "project",
  threadId: "thread",
} as const;
function fixture(): SplitLayout {
  return setPaneLocked(
    splitPane(
      {
        root: { type: "pane", paneId: "pane-1", content: tasks },
        focusedPaneId: "pane-1",
      },
      "pane-1",
      "right",
      thread,
    ),
    "pane-1",
    true,
  );
}

describe("workspace pane locks", () => {
  it("keeps a resized pinned pane stable when neighbors open and close", () => {
    const before = resizeSplit(fixture(), [], 0, 0.6);
    const added = splitPane(before, "pane-2", "right", { kind: "new-thread" });
    expect(added.root).toMatchObject({ sizes: [0.6, 0.2, 0.2] });
    const restored = deserializeSplitLayout(serializeSplitLayout(added));
    expect(restored).toEqual(added);
    expect(removePane(added, "pane-2").root).toMatchObject({ sizes: [0.6, 0.4] });
    expect(removePane(added, "pane-3").root).toMatchObject({ sizes: [0.6, 0.4] });
    expect(splitPane(before, "pane-1", "left", { kind: "new-thread" }).root)
      .toMatchObject({ sizes: [0.2, 0.6, 0.2] });
  });

  it("preserves a branch containing a pinned pane when siblings change", () => {
    const before = splitPane(fixture(), "pane-1", "bottom", { kind: "new-thread" });
    const added = splitPane(before, "pane-2", "right", { kind: "new-thread" });
    expect(added.root).toMatchObject({ sizes: [0.5, 0.25, 0.25] });
    expect(removePane(added, "pane-2").root).toMatchObject({ sizes: [0.5, 0.5] });
  });

  it("preserves the pinned page when navigating from its focused pane", () => {
    const before = setFocus(fixture(), "pane-1");
    const next = reconcileLayoutForContent(before, { kind: "new-thread" });
    expect(findPane(next.root, "pane-1")).toEqual(
      findPane(before.root, "pane-1"),
    );
    expect(findPane(next.root, "pane-2")).toEqual(
      findPane(before.root, "pane-2"),
    );
    expect(listPanes(next.root).map((pane) => pane.content)).toEqual([
      tasks, { kind: "new-thread" }, thread,
    ]);
    expect(next.focusedPaneId).toBe("pane-3");
  });
  it("rejects direct closure, replacement, movement and swapping", () => {
    const layout = fixture();
    expect(removePane(layout, "pane-1")).toBe(layout);
    expect(replacePaneContent(layout, "pane-1", thread)).toBe(layout);
    expect(movePane(layout, "pane-1", "pane-2", "right")).toBe(layout);
    expect(movePane(layout, "pane-2", "pane-1", "left")).toBe(layout);
    expect(swapPanes(layout, "pane-1", "pane-2")).toBe(layout);

    expect(canMaximizePane(layout, "pane-2")).toBe(false);
  });
  it("resizes adjacent panes while preserving their locks and content", () => {
    const layout = setPaneLocked(fixture(), "pane-2", true);
    const next = resizeSplit(layout, [], 0, 0.7);
    expect(next.root.type).toBe("split");
    if (next.root.type !== "split") throw new Error("Expected split");
    expect(next.root.sizes).toEqual([0.7, 0.30000000000000004]);
    expect(findPane(next.root, "pane-1")).toEqual(
      findPane(layout.root, "pane-1"),
    );
    expect(findPane(next.root, "pane-2")).toEqual(
      findPane(layout.root, "pane-2"),
    );
  });
  it("allows internal page navigation without dropping the lock", () => {
    const next = reconcileLayoutForContent(fixture(), {
      ...tasks,
      subPath: "item/12",
    });
    expect(findPane(next.root, "pane-1")).toMatchObject({
      locked: true,
      content: { subPath: "item/12" },
    });
  });
  it("persists locks, accepts old layouts, and restores actions after unlocking", () => {
    const layout = fixture();
    expect(deserializeSplitLayout(serializeSplitLayout(layout))).toEqual(
      layout,
    );
    const unlocked = setPaneLocked(layout, "pane-1", false);
    expect(deserializeSplitLayout(serializeSplitLayout(unlocked))).toEqual(
      unlocked,
    );
    expect(removePane(unlocked, "pane-1")).not.toBe(unlocked);
    expect(replacePaneContent(unlocked, "pane-1", thread)).not.toBe(unlocked);
  });
  it("opens a neighbor if all panes are locked and preserves them at capacity", () => {
    let layout = setPaneLocked(fixture(), "pane-2", true);
    for (let i = 3; i <= MAX_PANES; i++) {
      layout = reconcileLayoutForContent(layout, {
        ...thread,
        threadId: `thread-${i}`,
      });
      layout = setPaneLocked(layout, layout.focusedPaneId, true);
    }
    expect(listPanes(layout.root)).toHaveLength(MAX_PANES);
    expect(reconcileLayoutForContent(layout, { kind: "new-thread" })).toBe(
      layout,
    );
  });
  it("protects locks from maximize signals and accepts explicit unlock signals", () => {
    const layout = fixture();
    const route = { projectId: "project", threadId: "thread" } as const;
    expect(
      applyThreadPaneActionToLayout(layout, null, route, "maximize")
        .maximizedPaneId,
    ).toBeNull();
    const locked = applyThreadPaneActionToLayout(
      layout,
      null,
      route,
      "lock",
    ).layout;
    expect(findPane(locked.root, "pane-2")?.locked).toBe(true);
    expect(
      findPane(
        applyThreadPaneActionToLayout(locked, null, route, "unlock").layout
          .root,
        "pane-2",
      )?.locked,
    ).toBeUndefined();
  });
  it("keeps pinned plugin pages when a neighboring thread is archived", () => {
    const store = createStore();
    store.set(splitLayoutAtom, fixture());
    store.set(closePanesForThreadsAtom, ["thread"]);
    expect(store.get(splitLayoutAtom)?.root).toMatchObject({
      paneId: "pane-1",
      locked: true,
      content: tasks,
    });
  });
});
