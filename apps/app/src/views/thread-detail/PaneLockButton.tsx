import { useAtomValue, useStore } from "jotai";
import { Button } from "@bb/shared-ui/button";
import { Icon } from "@bb/shared-ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bb/shared-ui/tooltip";
import { HEADER_PANE_ACTION_ICON_BUTTON_CLASS } from "@/components/layout/AppPageHeader";
import { findPane, setPaneLocked } from "@/lib/split-layout";
import { splitLayoutAtom, maximizedPaneIdAtom } from "@/lib/split-layout/atoms";
import { useSplitWorkspaceActive } from "@/hooks/useSplitWorkspaceActive";
import { CHROME_SUBTLE_ICON_BUTTON_FOREGROUND_CLASS } from "@bb/shared-ui/chrome-style-tokens";
import { cn } from "@bb/shared-ui/lib/utils";
import { MACOS_WINDOW_NO_DRAG_CLASS } from "@/lib/bb-desktop";
import { usePaneContext } from "./PaneContext";

export function PaneLockButton() {
  const { paneId } = usePaneContext();
  const store = useStore();
  const layout = useAtomValue(splitLayoutAtom);
  const active = useSplitWorkspaceActive();
  const pane = layout === null ? null : findPane(layout.root, paneId);
  if (!active || pane === null) return null;
  const locked = Boolean(pane.locked);
  const label = locked ? "Unlock pane" : "Lock pane";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            HEADER_PANE_ACTION_ICON_BUTTON_CLASS,
            MACOS_WINDOW_NO_DRAG_CLASS,
            "shrink-0",
            CHROME_SUBTLE_ICON_BUTTON_FOREGROUND_CLASS,
          )}
          data-pane-lock-id={paneId}
          aria-label={label}
          aria-pressed={locked}
          onClick={() => {
            const current = store.get(splitLayoutAtom);
            if (current === null) return;
            const target = findPane(current.root, paneId);
            if (target === null) return;
            store.set(
              splitLayoutAtom,
              setPaneLocked(current, paneId, !target.locked),
            );
            store.set(maximizedPaneIdAtom, null);
          }}
        >
          <Icon name={locked ? "SquareLock02" : "SquareUnlock02"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {locked ? "Unlock this pane" : "Lock this pane"}
      </TooltipContent>
    </Tooltip>
  );
}
