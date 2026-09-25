import { join } from "node:path";
import {
  resolvePluginBuildToolchain,
  type PluginBuildToolchain,
} from "@bb/plugin-build";
import type { PluginServiceDeps } from "./plugin-service-internal.js";

const byDataDir = new Map<string, Promise<PluginBuildToolchain>>();

export async function getPluginBuildToolchain(
  args: Pick<PluginServiceDeps, "dataDir" | "logger" | "prebuiltOnly">,
): Promise<PluginBuildToolchain> {
  if (args.prebuiltOnly) throw new Error("Plugin builds are disabled by BB_PLUGIN_PREBUILT_ONLY; build and verify a new snapshot outside this server.");
  const existing = byDataDir.get(args.dataDir);
  if (existing !== undefined) return existing;
  const pending = resolvePluginBuildToolchain(join(args.dataDir, "plugins"), {
    onFetchStart: () => {
      args.logger.info(
        "downloading the plugin build toolchain (first plugin build on this machine)",
      );
    },
    onFetchDone: (elapsedMs) => {
      args.logger.info(
        `plugin build toolchain ready in ${Math.round(elapsedMs / 100) / 10}s`,
      );
    },
  });
  byDataDir.set(args.dataDir, pending);
  try {
    return await pending;
  } catch (error) {
    byDataDir.delete(args.dataDir);
    throw error;
  }
}
