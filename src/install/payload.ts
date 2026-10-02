import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { listFiles, renameWithRetry, sha256File, writeTextAtomic } from "./fsutil.js";

export type InstalledFile = { path: string; sha256: string };

/** Copies the payload directory to the version directory and returns every installed file with its hash. An older version directory stays untouched. */
export async function copyPayload(payloadDir: string, versionDirectory: string): Promise<InstalledFile[]> {
  const staging = `${versionDirectory}.${process.pid}.${Date.now()}.tmp`;
  try {
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true });
    for (const file of await listFiles(payloadDir)) {
      const destination = join(staging, file);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(join(payloadDir, file), destination);
    }
    await rm(versionDirectory, { recursive: true, force: true });
    await renameWithRetry(staging, versionDirectory);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  const installed: InstalledFile[] = [];
  for (const file of (await listFiles(versionDirectory)).sort()) {
    installed.push({ path: join(versionDirectory, file), sha256: (await sha256File(join(versionDirectory, file))) as string });
  }
  return installed;
}

/** Writes the launcher. It holds one dynamic import of the active version. */
export async function writeLauncher(launcher: string, version: string): Promise<InstalledFile> {
  if (!/^[\w.+-]+$/.test(version)) throw new Error(`The version "${version}" cannot name a directory.`);
  await writeTextAtomic(launcher, `await import("./${version}/cwk.mjs");\n`, { bom: false });
  return { path: launcher, sha256: (await sha256File(launcher)) as string };
}
