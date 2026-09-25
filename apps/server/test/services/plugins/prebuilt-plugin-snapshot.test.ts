import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertPrebuiltPluginSnapshot } from "../../../src/services/plugins/prebuilt-plugin-snapshot.js";
import { getPluginBuildToolchain } from "../../../src/services/plugins/build-toolchain.js";
import { testLogger } from "../../helpers/test-app.js";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

describe("prebuilt plugin deployment", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "bb-prebuilt-test-"));
    await mkdir(join(root, "dist"));
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(root, "server.ts"), "export default () => {};");
    await writeFile(join(root, "dist/deployment-snapshot.json"), JSON.stringify({
      version: 1,
      files: { "package.json": digest("{}"), "server.ts": digest("export default () => {};") },
    }));
  });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });

  it("accepts an intact snapshot and rejects a later source edit", async () => {
    await expect(assertPrebuiltPluginSnapshot(root)).resolves.toBeUndefined();
    await writeFile(join(root, "server.ts"), "throw new Error('changed');");
    await expect(assertPrebuiltPluginSnapshot(root)).rejects.toThrow("snapshot changed");
  });

  it("rejects missing inventory and paths outside the plugin", async () => {
    await rm(join(root, "dist/deployment-snapshot.json"));
    await expect(assertPrebuiltPluginSnapshot(root)).rejects.toThrow();
    await writeFile(join(root, "dist/deployment-snapshot.json"), JSON.stringify({
      version: 1, files: { "package.json": digest("{}"), "../outside": digest("") },
    }));
    await expect(assertPrebuiltPluginSnapshot(root)).rejects.toThrow("snapshot path");
  });

  it("refuses to fetch a build toolchain in prebuilt mode", async () => {
    await expect(getPluginBuildToolchain({ dataDir: root, logger: testLogger, prebuiltOnly: true })).rejects.toThrow("builds are disabled");
  });
});
