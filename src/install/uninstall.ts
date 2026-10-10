import { readdir, rm, rmdir } from "node:fs/promises";
import { dirname, isAbsolute, join, relative } from "node:path";
import { type HostCapability } from "../hosts.js";
import { removeBlock } from "./block.js";
import { pluginFingerprint } from "./apply.js";
import { backup, readText, sha256File, writeTextAtomic } from "./fsutil.js";
import { resolveHost } from "./identity.js";
import { withInstallerLock } from "./lock.js";
import { LEGACY_OWNER, manifestPath, readManifest, saveManifest, type Manifest, type ManifestFile } from "./manifest.js";
import { OUTPUT_STYLE, PLUGIN_NAME, type PlanContext, type PlanError } from "./plan.js";
import { MCP_NAME, readRegistration } from "./registration.js";
import { topLevelMembers } from "./settings.js";
import { run, which } from "./spawn.js";

export type UninstallItem = { target: string; detail: string };
export type UninstallOutcome =
  | { status: "done" | "incomplete"; removed: UninstallItem[]; kept: UninstallItem[]; failed: UninstallItem[]; backups: string[]; notes: string[] }
  | { status: "refused"; message: string; lockPath?: string }
  | PlanError;

/** Optional hooks for isolated tests. The CLI passes none. */
export type UninstallOptions = {
  /** Runs after the lock is acquired and before the manifest is read. */
  afterLock?: () => void | Promise<void>;
};

const OUTPUT_LIMIT = 2000;
const limit = (text: string) => (text.length > OUTPUT_LIMIT ? `${text.slice(0, OUTPUT_LIMIT)}... (truncated)` : text);
const hostBinary = (host: HostCapability) => host.mcpCommands.add.split(" ")[0];

const isInside = (parent: string, child: string) => {
  const path = relative(parent, child);
  return path !== "" && !path.startsWith("..") && !isAbsolute(path);
};

/** Removes empty directories from `directory` up to, but not including, `stop`. A directory that still holds anything stays. */
async function pruneEmpty(directory: string, stop: string) {
  for (let current = directory; isInside(stop, current); current = dirname(current)) {
    try {
      await rmdir(current);
    } catch {
      return;
    }
  }
}

/**
 * Removes `outputStyle` from a settings file when it still equals `value`.
 * Only that member goes. Key order, indentation, line endings, and the BOM of the other members stay.
 * A file that holds only the member `setOutputStyle` wrote into a new file is deleted. The old file goes to the backup directory first.
 */
async function clearOutputStyle(path: string, value: string, backupDir: string): Promise<{ result: "cleared" | "file-removed" | "absent" | "different"; backup?: string }> {
  const file = await readText(path);
  if (!file) return { result: "absent" };
  let data: unknown;
  try {
    data = JSON.parse(file.text);
  } catch {
    throw new Error(`${path} is not valid JSON.`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error(`${path} does not hold a JSON object.`);
  const current = (data as Record<string, unknown>).outputStyle;
  if (current === undefined) return { result: "absent" };
  if (current !== value) return { result: "different" };
  const { members, open, close } = topLevelMembers(file.text);
  const index = members.map(member => member.key).lastIndexOf("outputStyle");
  let next: string;
  if (members.length === 1) {
    if (file.text.replace(/\r\n/g, "\n") === `{\n  "outputStyle": ${JSON.stringify(value)}\n}\n`) {
      const copy = await backup(path, backupDir);
      await rm(path, { force: true });
      return { result: "file-removed", backup: copy };
    }
    next = file.text.slice(0, open + 1) + file.text.slice(close);
  } else if (index < members.length - 1) {
    next = file.text.slice(0, members[index].keyStart) + file.text.slice(members[index + 1].keyStart);
  } else {
    next = file.text.slice(0, members[index - 1].valueEnd) + file.text.slice(members[index].valueEnd);
  }
  JSON.parse(next);
  const copy = await backup(path, backupDir);
  await writeTextAtomic(path, next, { bom: file.bom });
  return { result: "cleared", backup: copy };
}

/**
 * Removes what the manifest says the installer wrote, and only when it is still as the installer left it.
 * Files and the instruction block are compared by hash. CLI entries are compared by fingerprint against the current host entry.
 * Everything else is kept and reported with the reason. Backups stay.
 */
export async function uninstall(ctx: PlanContext, options: UninstallOptions = {}): Promise<UninstallOutcome> {
  const resolved = resolveHost(ctx.agent, ctx.env);
  if (!resolved.ok) return { status: "error", kind: resolved.error.startsWith("Host mismatch") ? "mismatch" : "usage", message: resolved.error };
  const host = resolved.value;
  if (!host.verified) return { status: "refused", message: `${host.displayName} is not verified, so the installer never installed for it and uninstall does not run.` };

  // The shared installer lock is taken before the manifest is read and held through the final manifest save or removal.
  return withInstallerLock(ctx.home, "uninstall", async () => {
    await options.afterLock?.();
    return uninstallLocked(ctx, host);
  });
}

async function uninstallLocked(ctx: PlanContext, host: HostCapability): Promise<UninstallOutcome> {
  const manifestResult = await readManifest(ctx.home);
  if (!manifestResult.ok) return { status: "error", kind: "manifest", message: manifestResult.error };
  const manifest: Manifest = manifestResult.value;

  const kitDirectory = join(ctx.home, ".clear-writing-kit");
  const backupDir = join(kitDirectory, "backups", new Date().toISOString().replace(/[:.]/g, "-"));
  const removed: UninstallItem[] = [];
  const kept: UninstallItem[] = [];
  const failed: UninstallItem[] = [];
  const backups: string[] = [];
  const notes: string[] = [];
  const remaining: Manifest = {
    schemaRevision: manifest.schemaRevision,
    version: manifest.version,
    files: [],
    cli: [],
    blocks: [],
    settings: [],
    completedSteps: { ...manifest.completedSteps }
  };
  delete remaining.completedSteps[host.id];
  const binary = which(hostBinary(host), ctx.env);

  // CLI entries first, so the host stops using the payload before the payload goes.
  for (const entry of manifest.cli) {
    const target = `${entry.host} ${entry.kind} ${entry.name}`;
    const keep = (detail: string) => { kept.push({ target, detail }); remaining.cli.push(entry); };
    const fail = (detail: string) => { failed.push({ target, detail }); remaining.cli.push(entry); };
    if (entry.host !== host.id) {
      keep(`It belongs to host ${entry.host}. Run uninstall with --agent ${entry.host}.`);
      continue;
    }
    if (entry.kind !== "mcp" && entry.kind !== "plugin") {
      keep(`The entry kind "${entry.kind}" is not known to this installer.`);
      continue;
    }
    if (!binary) {
      keep(`The host command "${hostBinary(host)}" is not on PATH, so the entry cannot be read or removed.`);
      continue;
    }
    try {
      if (entry.kind === "mcp") {
        if (entry.name !== MCP_NAME) {
          keep(`The MCP name is not ${MCP_NAME}.`);
          continue;
        }
        const launcher = join(kitDirectory, "cwk.mjs");
        const readResult = await readRegistration(host, ctx.env, { launcher });
        if (readResult.status === "unreadable") {
          keep("The current MCP entry could not be read safely. It was kept.");
          continue;
        }
        if (readResult.status === "absent") {
          removed.push({ target, detail: "The host has no such entry. Nothing to remove." });
          continue;
        }
        if (readResult.fingerprint !== entry.fingerprint) {
          keep("The current MCP entry does not match what the installer registered. It was changed after install.");
          continue;
        }
        const scope = host.id === "claude" ? ["--scope", "user"] : [];
        const result = await run(binary, ["mcp", "remove", MCP_NAME, ...scope], { env: ctx.env, timeoutMs: 120000 });
        if (result.code !== 0) fail(`"mcp remove" exited with code ${result.code}.`);
        else removed.push({ target, detail: "Removed through the host remove command." });
      } else {
        if (entry.name !== PLUGIN_NAME || entry.fingerprint !== pluginFingerprint(host.id)) {
          keep("The fingerprint does not match the plugin the installer registered.");
          continue;
        }
        const listed = await run(binary, ["plugin", "list"], { env: ctx.env });
        if (listed.code !== 0) {
          fail(`"${hostBinary(host)} plugin list" failed with exit code ${listed.code}.`);
          continue;
        }
        if (!new RegExp(`(^|[^\\w-])${PLUGIN_NAME}(?![\\w-])`, "m").test(listed.stdout)) {
          removed.push({ target, detail: "The host has no such plugin. Nothing to remove." });
          continue;
        }
        const pluginTarget = host.id === "codex" ? `${PLUGIN_NAME}@${PLUGIN_NAME}` : PLUGIN_NAME;
        const result = await run(binary, ["plugin", host.id === "codex" ? "remove" : "uninstall", pluginTarget], { env: ctx.env, timeoutMs: 120000 });
        if (result.code !== 0) fail(`"plugin remove" exited with code ${result.code}.`);
        else removed.push({ target, detail: "Removed through the host remove command." });
      }
    } catch (error) {
      fail(limit(error instanceof Error ? error.message : String(error)));
    }
  }
  if (manifest.cli.some(entry => entry.host === host.id && entry.kind === "plugin")) {
    notes.push(`The plugin marketplace entry for ${PLUGIN_NAME} was not recorded by the installer. Remove it by hand with "${hostBinary(host)} plugin marketplace remove ${PLUGIN_NAME}" if it is no longer wanted.`);
  }

  // The instruction block records at persisted target paths.
  for (const record of manifest.blocks) {
    if (record.host !== host.id) {
      remaining.blocks.push(record);
      continue;
    }
    const path = record.target;
    const keep = (detail: string) => { kept.push({ target: `${path} (block)`, detail }); remaining.blocks.push(record); };
    try {
      const file = await readText(path);
      if (!file) {
        removed.push({ target: `${path} (block)`, detail: "The file is already gone." });
        continue;
      }
      const result = removeBlock(file.text, record.sha256);
      if (result.status === "absent") {
        removed.push({ target: `${path} (block)`, detail: "The block is already gone." });
        continue;
      }
      if (result.status === "changed") {
        keep("The block was edited after install. Its hash no longer matches.");
        continue;
      }
      const copy = await backup(path, backupDir);
      if (copy) backups.push(copy);
      if (result.text === "") await rm(path, { force: true });
      else await writeTextAtomic(path, result.text, { bom: file.bom });
      removed.push({ target: `${path} (block)`, detail: result.text === "" ? "Removed. The file held nothing else, so it was deleted." : "Removed. Text outside the block is unchanged." });
    } catch (error) {
      kept.push({ target: `${path} (block)`, detail: limit(error instanceof Error ? error.message : String(error)) });
      remaining.blocks.push(record);
    }
  }

  // Settings records at persisted target paths.
  for (const record of manifest.settings) {
    if (record.host !== host.id) {
      remaining.settings.push(record);
      continue;
    }
    const settingsPath = record.target;
    try {
      const { result, backup: copy } = await clearOutputStyle(settingsPath, record.value, backupDir);
      if (copy) backups.push(copy);
      if (result === "different") {
        kept.push({ target: `${settingsPath} ${record.setting}`, detail: `${record.setting} is not "${record.value}" now. It was changed after install.` });
        remaining.settings.push(record);
      } else if (result !== "absent") {
        removed.push({ target: `${settingsPath} ${record.setting}`, detail: result === "file-removed" ? "Removed. The file held nothing else, so it was deleted." : "Removed. Other settings are unchanged." });
      }
    } catch (error) {
      kept.push({ target: `${settingsPath} ${record.setting}`, detail: limit(error instanceof Error ? error.message : String(error)) });
      remaining.settings.push(record);
    }
  }

  // Fallback for settings when no explicit settings record exists for host.
  const configDirectory = (host.configDirectoryEnv && ctx.env[host.configDirectoryEnv]) || host.configDirectory(ctx.home);
  if (
    !manifest.settings.some(s => s.host === host.id) &&
    host.outputStyleSupport === "yes" &&
    (manifest.completedSteps[host.id]?.includes("output-style") ||
      (Array.isArray((manifest as unknown as { completedSteps: unknown }).completedSteps) &&
        ((manifest as unknown as { completedSteps: string[] }).completedSteps).includes("output-style")))
  ) {
    const settingsPath = join(configDirectory, "settings.json");
    try {
      const { result, backup: copy } = await clearOutputStyle(settingsPath, OUTPUT_STYLE, backupDir);
      if (copy) backups.push(copy);
      if (result === "different") kept.push({ target: `${settingsPath} outputStyle`, detail: `outputStyle is not "${OUTPUT_STYLE}" now. It was changed after install.` });
      else if (result !== "absent") removed.push({ target: `${settingsPath} outputStyle`, detail: result === "file-removed" ? "Removed. The file held nothing else, so it was deleted." : "Removed. Other settings are unchanged." });
    } catch (error) {
      kept.push({ target: `${settingsPath} outputStyle`, detail: limit(error instanceof Error ? error.message : String(error)) });
    }
  }

  // Shared payload files and the launcher, retained while other consumers/records remain.
  const hasAnotherOwner = manifest.files.some(f => f.owners.some(o => o !== host.id && o !== LEGACY_OWNER));
  const otherHostInCli = remaining.cli.some(c => c.host !== host.id);
  const otherHostInBlocks = remaining.blocks.some(b => b.host !== host.id && b.host !== LEGACY_OWNER);
  const otherHostInSettings = remaining.settings.some(s => s.host !== host.id && s.host !== LEGACY_OWNER);
  const otherConsumerRemains = hasAnotherOwner || otherHostInCli || otherHostInBlocks || otherHostInSettings;

  const hasLegacyOwnership = manifest.files.some(f => f.owners.includes(LEGACY_OWNER)) ||
    remaining.blocks.some(b => b.host === LEGACY_OWNER) ||
    remaining.settings.some(s => s.host === LEGACY_OWNER);

  const hasKeptOrFailedCli = remaining.cli.length > 0;
  const hasRetainedBlock = remaining.blocks.length > 0;
  const hasRetainedSettings = remaining.settings.length > 0;

  const shouldRetainShared = otherConsumerRemains || hasLegacyOwnership || hasKeptOrFailedCli || hasRetainedBlock || hasRetainedSettings;

  if (shouldRetainShared) {
    const hostFailedOrKept = remaining.cli.some(c => c.host === host.id) ||
      remaining.blocks.some(b => b.host === host.id) ||
      remaining.settings.some(s => s.host === host.id);

    if (hostFailedOrKept && manifest.completedSteps[host.id]) {
      remaining.completedSteps[host.id] = [...manifest.completedSteps[host.id]];
    }

    for (const entry of manifest.files) {
      let nextOwners = entry.owners;
      if (!hostFailedOrKept) {
        nextOwners = entry.owners.filter(o => o !== host.id);
      }
      if (nextOwners.length === 0) {
        nextOwners = [LEGACY_OWNER];
      }
      const updatedEntry: ManifestFile = {
        path: entry.path,
        sha256: entry.sha256,
        owners: [...new Set(nextOwners)].sort()
      };
      remaining.files.push(updatedEntry);

      let detail = "Shared runtime file is retained.";
      if (otherConsumerRemains) {
        detail = "Shared runtime file is retained because another installed host uses it.";
      } else if (hasLegacyOwnership) {
        detail = "Shared runtime file is retained because unresolved legacy ownership remains.";
      } else if (hasKeptOrFailedCli) {
        detail = "Shared runtime file is retained because a CLI entry was kept or failed removal.";
      } else if (hasRetainedBlock) {
        detail = "Shared runtime file is retained because an instruction block was kept.";
      } else if (hasRetainedSettings) {
        detail = "Shared runtime file is retained because a settings record was kept.";
      }
      kept.push({ target: entry.path, detail });
    }
  } else {
    const removedFiles: string[] = [];
    for (const entry of manifest.files) {
      const keep = (detail: string) => { kept.push({ target: entry.path, detail }); remaining.files.push(entry); };
      if (!isInside(kitDirectory, entry.path)) {
        keep("The path is outside the kit directory. The installer never removes it.");
        continue;
      }
      try {
        const hash = await sha256File(entry.path);
        if (hash === undefined) {
          removed.push({ target: entry.path, detail: "The file is already gone." });
          continue;
        }
        if (hash !== entry.sha256) {
          keep("The file was changed after install. Its hash no longer matches.");
          continue;
        }
        await rm(entry.path, { force: true });
        removedFiles.push(entry.path);
        removed.push({ target: entry.path, detail: "Removed. Its hash matched the manifest." });
      } catch (error) {
        keep(limit(error instanceof Error ? error.message : String(error)));
      }
    }
    for (const path of removedFiles) await pruneEmpty(dirname(path), kitDirectory);
  }

  // The manifest keeps only what is still installed. With nothing left, it goes too.
  const anyLeft = remaining.files.length > 0 || remaining.cli.length > 0 || remaining.blocks.length > 0 || remaining.settings.length > 0;
  if (anyLeft) {
    await saveManifest(ctx.home, remaining);
  } else {
    await rm(manifestPath(ctx.home), { force: true });
    try {
      if ((await readdir(kitDirectory)).length === 0) await rmdir(kitDirectory);
    } catch {
      // The kit directory may be missing or hold backups. Either way it stays as it is.
    }
  }
  return { status: failed.length ? "incomplete" : "done", removed, kept, failed, backups, notes };
}

/** Renders an uninstall outcome as text. It names targets and reasons, never host file contents. */
export function formatUninstall(outcome: UninstallOutcome): string {
  if (outcome.status === "error") return `Error: ${outcome.message}\n`;
  if (outcome.status === "refused") return `Refused: ${outcome.message}\n`;
  const list = (title: string, items: UninstallItem[]) => [`${title}:`, ...(items.length ? items.map(item => `  ${item.target}: ${item.detail}`) : ["  none"])];
  return [
    outcome.status === "done" ? "Uninstall finished." : "Uninstall is incomplete. Run it again after you fix the failed items.",
    ...list("Removed", outcome.removed),
    ...list("Kept", outcome.kept),
    ...(outcome.failed.length ? list("Failed", outcome.failed) : []),
    ...outcome.backups.map(path => `Backup: ${path}`),
    ...outcome.notes.map(note => `Note: ${note}`),
    ""
  ].join("\n");
}
