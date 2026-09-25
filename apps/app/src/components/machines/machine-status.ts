import type { Host, MachineLifecycle } from "@bb/domain";
import { formatRelativeTime } from "@/lib/relative-time";

export type MachineStatusTone = "online" | "attention" | "failed" | "offline";

const MACHINE_OFFLINE_DISPLAY_DELAY_MS = 30_000;

export function isMachineShownOnline(host: Host, now: number): boolean {
  return (
    host.status === "connected" ||
    (host.lastSeenAt !== null &&
      now - host.lastSeenAt < MACHINE_OFFLINE_DISPLAY_DELAY_MS)
  );
}

export function machinePhaseLabel(
  lifecycle: MachineLifecycle,
): "Paused" | "Pausing" | "Resuming" | "Removing" | "Cleanup failed" | null {
  if (
    lifecycle.phase === "removing" &&
    lifecycle.teardown?.status === "failed"
  ) {
    return "Cleanup failed";
  }
  if (lifecycle.phase === "suspending") return "Pausing";
  if (lifecycle.phase === "suspended") return "Paused";
  if (lifecycle.phase === "resuming") return "Resuming";
  if (lifecycle.phase === "removing") return "Removing";
  return null;
}

export function machineStatusTone(host: Host, now: number): MachineStatusTone {
  if (machinePhaseLabel(host.lifecycle) === "Cleanup failed") return "failed";
  if (
    host.lifecycle.phase === "removing" ||
    host.lifecycle.phase === "suspending" ||
    host.lifecycle.phase === "resuming"
  )
    return "attention";
  return isMachineShownOnline(host, now) ? "online" : "offline";
}

export function machineStatusLabel({
  host,
  now,
}: {
  host: Host;
  now: number;
}): string {
  const parts: string[] = [];
  const phase = machinePhaseLabel(host.lifecycle);
  const shownOnline = isMachineShownOnline(host, now);
  parts.push(phase ?? (shownOnline ? "Online" : "Offline"));
  if (host.lifecycle.message !== null) parts.push(host.lifecycle.message);
  else if (!shownOnline && host.lastSeenAt !== null) {
    parts.push(
      `last seen ${formatRelativeTime({ timestamp: host.lastSeenAt, now })}`,
    );
  }
  return parts.join(" · ");
}

export function canReconnectMachine(host: Host): boolean {
  return host.status !== "connected" && host.lifecycle.phase === "active";
}
