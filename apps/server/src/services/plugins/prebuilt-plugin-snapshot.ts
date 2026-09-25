import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { z } from "zod";

const snapshotSchema = z.object({
  version: z.literal(1),
  files: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
}).strict();

export async function assertPrebuiltPluginSnapshot(rootDir: string): Promise<void> {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile(join(rootDir, "dist", "deployment-snapshot.json"), "utf8")));
  const entries = Object.entries(snapshot.files);
  if (entries.length === 0 || entries.length > 5000 || !("package.json" in snapshot.files)) {
    throw new Error("Invalid prebuilt plugin snapshot inventory");
  }
  for (const [name, expected] of entries) {
    const path = resolve(rootDir, name);
    const inside = relative(resolve(rootDir), path);
    if (!inside || isAbsolute(name) || inside === ".." || inside.startsWith("../") || isAbsolute(inside)) {
      throw new Error("Invalid prebuilt plugin snapshot path");
    }
    const actual = createHash("sha256").update(await readFile(path)).digest("hex");
    if (actual !== expected) throw new Error(`Prebuilt plugin snapshot changed: ${name}; rebuild and verify outside this server.`);
  }
}
