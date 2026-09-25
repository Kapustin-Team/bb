import { makeHost } from "@bb/test-helpers/domain-fixtures";
import { describe, expect, it } from "vitest";
import {
  isMachineShownOnline,
  nextMachineOfflineDisplayAt,
  machinePhaseLabel,
  machineStatusLabel,
  machineStatusTone,
} from "./machine-status";

describe("resuming machine status", () => {
  const host = makeHost({
    status: "connected",
    lifecycle: {
      phase: "resuming",
      suspendedAt: 1,
      message: "Restoring compute",
      pendingLog: "",
      teardown: null,
    },
  });

  it("keeps lifecycle status ahead of the transport connection", () => {
    expect(machinePhaseLabel(host.lifecycle)).toBe("Resuming");
    expect(machineStatusLabel({ host, now: 2 })).toBe(
      "Resuming · Restoring compute",
    );
    expect(machineStatusTone(host, 2)).toBe("attention");
  });
});

describe("disconnected machine display", () => {
  it("shows a machine offline only once it has been out of contact for 30 seconds", () => {
    const now = 100_000;
    const dropped = (lastSeenAt: number | null) =>
      makeHost({ status: "disconnected", lastSeenAt });

    expect(isMachineShownOnline(dropped(now - 10_000), now)).toBe(true);
    expect(machineStatusLabel({ host: dropped(now - 10_000), now })).toBe(
      "Online",
    );
    expect(isMachineShownOnline(dropped(now - 31_000), now)).toBe(false);
    expect(machineStatusTone(dropped(now - 31_000), now)).toBe("offline");
    expect(isMachineShownOnline(dropped(null), now)).toBe(false);
  });
});

describe("next machine offline display time", () => {
  it("returns when the earliest recently dropped machine should show offline", () => {
    const now = 100_000;
    expect(
      nextMachineOfflineDisplayAt(
        [
          makeHost({ id: "connected", status: "connected", lastSeenAt: now }),
          makeHost({
            id: "later",
            status: "disconnected",
            lastSeenAt: now - 5_000,
          }),
          makeHost({
            id: "sooner",
            status: "disconnected",
            lastSeenAt: now - 20_000,
          }),
          makeHost({
            id: "long-gone",
            status: "disconnected",
            lastSeenAt: now - 60_000,
          }),
        ],
        now,
      ),
    ).toBe(now - 20_000 + 30_000);
    expect(
      nextMachineOfflineDisplayAt(
        [makeHost({ status: "disconnected", lastSeenAt: now - 60_000 })],
        now,
      ),
    ).toBeNull();
  });
});
