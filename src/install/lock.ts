import { randomUUID } from "node:crypto";
import { open, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

/** File name of the exclusive lock that `install apply` and `install uninstall` share. It sits directly in the home directory. */
export const INSTALLER_LOCK_NAME = ".clear-writing-kit.lock";

export const installerLockPath = (home: string) => join(home, INSTALLER_LOCK_NAME);

export type InstallerLockCommand = "apply" | "uninstall";

export type InstallerLock = {
  path: string;
  /** Removes the lock file when it still holds this run's token. Never throws. */
  release: () => Promise<void>;
};

export type LockRefusal = { status: "refused"; message: string; lockPath: string };

export type AcquireLockResult = { ok: true; lock: InstallerLock } | { ok: false; refusal: LockRefusal };

/** Message for a run that cannot take the lock. It names the lock path and the recovery check, never file contents. */
export function lockRefusalMessage(path: string, reason: "held" | "unavailable") {
  const cause = reason === "held"
    ? `The installer lock ${path} exists. Another "cwk install apply" or "cwk install uninstall" run holds it, or an earlier run stopped without removing it.`
    : `The installer lock ${path} could not be created.`;
  return `${cause} Nothing was changed. Remove ${path} only after you confirm that no "cwk install apply" or "cwk install uninstall" process is active, then run the command again.`;
}

/**
 * Creates the lock file with an exclusive create. An existing file refuses the run, whether a live run holds it or a stopped run left it.
 * The installer never removes a lock that it did not create.
 */
export async function acquireInstallerLock(home: string, command: InstallerLockCommand): Promise<AcquireLockResult> {
  const path = installerLockPath(home);
  const token = randomUUID();
  let handle;
  try {
    handle = await open(path, "wx");
  } catch (error) {
    const held = (error as NodeJS.ErrnoException)?.code === "EEXIST";
    return { ok: false, refusal: { status: "refused", message: lockRefusalMessage(path, held ? "held" : "unavailable"), lockPath: path } };
  }
  try {
    await handle.writeFile(`${JSON.stringify({ token, command, pid: process.pid, started: new Date().toISOString() })}\n`, "utf8");
    await handle.close();
  } catch {
    // This run created the file, so it removes the file before it refuses.
    await handle.close().catch(() => undefined);
    await rm(path, { force: true }).catch(() => undefined);
    return { ok: false, refusal: { status: "refused", message: lockRefusalMessage(path, "unavailable"), lockPath: path } };
  }
  const release = async () => {
    try {
      const text = await readFile(path, "utf8");
      if (text.includes(token)) await rm(path, { force: true });
    } catch {
      // The lock is already gone or cannot be read. A lock that this run cannot confirm as its own stays.
    }
  };
  return { ok: true, lock: { path, release } };
}

/** Runs `work` while holding the installer lock and releases the lock in `finally`, on success or error. */
export async function withInstallerLock<T>(home: string, command: InstallerLockCommand, work: () => Promise<T>): Promise<T | LockRefusal> {
  const acquired = await acquireInstallerLock(home, command);
  if (!acquired.ok) return acquired.refusal;
  try {
    return await work();
  } finally {
    await acquired.lock.release();
  }
}
