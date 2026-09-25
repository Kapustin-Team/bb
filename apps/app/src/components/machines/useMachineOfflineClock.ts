import { useEffect, useState } from "react";
import type { Host } from "@bb/domain";
import { nextMachineOfflineDisplayAt } from "./machine-status";

export function useMachineOfflineClock(hosts: readonly Host[]): number {
  const [now, setNow] = useState(() => Date.now());
  const offlineAt = nextMachineOfflineDisplayAt(hosts, now);
  useEffect(() => {
    if (offlineAt === null) return;
    const timeout = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, offlineAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [offlineAt]);
  return now;
}
