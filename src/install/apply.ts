import { basename, dirname, join } from "node:path";
import { hosts, type HostCapability } from "../hosts.js";
import { findBlock, upsertBlock } from "./block.js";
import { backup, readText, sha256, writeTextAtomic } from "./fsutil.js";
import { readManifest, saveManifest, type Manifest } from "./manifest.js";
import { copyPayload, writeLauncher } from "./payload.js";
import { computePlan, MCP_NAME, OUTPUT_STYLE, PLUGIN_NAME, type Plan, type PlanContext, type PlanError, type StepId } from "./plan.js";
import { setOutputStyle } from "./settings.js";
import { run, which } from "./spawn.js";

export type ApplyOutcome =
  | { status: "applied"; completed: StepId[]; unchanged: StepId[]; backups: string[] }
  | { status: "failed"; step: StepId; output: string; completed: StepId[] }
  | { status: "refused"; message: string }
  | PlanError;

const OUTPUT_LIMIT = 2000;
const limit = (text: string) => (text.length > OUTPUT_LIMIT ? `${text.slice(0, OUTPUT_LIMIT)}... (truncated)` : text);

/** Fingerprint of the MCP command that the installer registers. */
export const mcpFingerprint = (registration: readonly string[]) => sha256(JSON.stringify(registration));
/** Fingerprint of the plugin entry that the installer registers. */
export const pluginFingerprint = (hostId: string) => sha256(`${hostId}:plugin:${PLUGIN_NAME}`);

function upsertBy<T>(items: T[], entry: T, same: (item: T) => boolean) {
  const index = items.findIndex(same);
  if (index >= 0) items[index] = entry;
  else items.push(entry);
}

const hostBinary = (host: HostCapability) => host.mcpCommands.add.split(" ")[0];

/** Paths and text that apply writes. Plan already hashed the state they come from, so they are recomputed here and not stored in the plan. */
type Writes = {
  kitDirectory: string;
  versionDirectory: string;
  launcher: string;
  instructionsPath: string;
  instructionsText: string;
  instructionsBom: boolean;
  settingsPath: string | undefined;
  registration: string[];
};

async function prepareWrites(host: HostCapability, plan: Plan, ctx: PlanContext): Promise<Writes> {
  const kitDirectory = join(ctx.home, ".clear-writing-kit");
  const launcher = join(kitDirectory, "cwk.mjs");
  const configDirectory = (host.configDirectoryEnv && ctx.env[host.configDirectoryEnv]) || host.configDirectory(ctx.home);
  const instructionsPath = join(configDirectory, basename(host.globalInstructionsFile(ctx.home)));
  const instructions = await readText(instructionsPath);
  return {
    kitDirectory,
    versionDirectory: join(kitDirectory, plan.version),
    launcher,
    instructionsPath,
    instructionsText: upsertBlock(instructions?.text ?? "", ctx.blockText).text,
    instructionsBom: instructions?.bom ?? false,
    settingsPath: host.outputStyleSupport === "yes" ? join(configDirectory, "settings.json") : undefined,
    registration: [plan.runtime.command, ...plan.runtime.args, launcher, "mcp"]
  };
}

async function runHost(binary: string, args: string[], env: PlanContext["env"], tolerate?: RegExp | true) {
  const result = await run(binary, args, { env, timeoutMs: 120000 });
  if (result.code !== 0 && !(tolerate === true || tolerate?.test(result.stdout + result.stderr))) {
    throw new Error(limit(`"${args.slice(0, 2).join(" ")}" exited with code ${result.code}. ${(result.stdout + result.stderr).trim()}`));
  }
}

/** Recomputes the plan, and when its hash matches, applies each step that is not current. */
export async function applyPlan(ctx: PlanContext, planHash: string): Promise<ApplyOutcome> {
  const outcome = await computePlan(ctx);
  if (outcome.status === "error") return outcome;
  if (outcome.status === "manual") return { status: "refused", message: `${outcome.host.displayName} is not verified, so apply does not run for it. Follow the manual steps from plan.` };
  const plan: Plan = outcome.plan;
  if (plan.hash !== planHash) {
    const targets = plan.steps.map(step => step.target).join(", ");
    return { status: "error", kind: "mismatch", message: `The plan hash does not match the current state. Nothing was written. A target changed since the plan was made. Targets checked: ${targets}. Run plan again and use the new hash.` };
  }

  const host = hosts.find(candidate => candidate.id === plan.host.id);
  const binary = host ? which(hostBinary(host), ctx.env) : undefined;
  if (!host || !binary) return { status: "refused", message: "The host command is not on PATH." };

  const manifestResult = await readManifest(ctx.home);
  if (!manifestResult.ok) return { status: "error", kind: "manifest", message: manifestResult.error };
  const manifest: Manifest = manifestResult.value;
  let writes: Writes;
  try {
    writes = await prepareWrites(host, plan, ctx);
  } catch (error) {
    return { status: "error", kind: "block", message: error instanceof Error ? error.message : String(error) };
  }
  const backupDir = join(writes.kitDirectory, "backups", new Date().toISOString().replace(/[:.]/g, "-"));
  const backups: string[] = [];
  const completed: StepId[] = [];
  const unchanged: StepId[] = [];
  const kept = async (path: string) => {
    const copy = await backup(path, backupDir);
    if (copy) backups.push(copy);
  };

  for (const step of plan.steps) {
    if (step.action === "none") {
      unchanged.push(step.id);
      continue;
    }
    try {
      if (step.id === "payload") {
        const copied = await copyPayload(ctx.payloadDir, writes.versionDirectory);
        const launcher = await writeLauncher(writes.launcher, plan.version);
        for (const file of [...copied, launcher]) upsertBy(manifest.files, file, item => item.path === file.path);
        manifest.version = plan.version;
      } else if (step.id === "plugin") {
        await runHost(binary, ["plugin", "marketplace", "add", dirname(ctx.payloadDir)], ctx.env, /already/i);
        await runHost(binary, ["plugin", host.id === "codex" ? "add" : "install", `${PLUGIN_NAME}@${PLUGIN_NAME}`], ctx.env);
        const entry = { host: host.id, kind: "plugin", name: PLUGIN_NAME, fingerprint: pluginFingerprint(host.id) };
        upsertBy(manifest.cli, entry, item => item.host === entry.host && item.kind === entry.kind && item.name === entry.name);
      } else if (step.id === "mcp") {
        const scope = host.id === "claude" ? ["--scope", "user"] : [];
        if (step.action === "update") await runHost(binary, ["mcp", "remove", MCP_NAME, ...scope], ctx.env, true);
        await runHost(binary, ["mcp", "add", ...scope, MCP_NAME, "--", ...writes.registration], ctx.env);
        const entry = { host: host.id, kind: "mcp", name: MCP_NAME, fingerprint: mcpFingerprint(writes.registration) };
        upsertBy(manifest.cli, entry, item => item.host === entry.host && item.kind === entry.kind && item.name === entry.name);
      } else if (step.id === "block") {
        await kept(writes.instructionsPath);
        await writeTextAtomic(writes.instructionsPath, writes.instructionsText, { bom: writes.instructionsBom });
        const block = findBlock(writes.instructionsText);
        if (block) upsertBy(manifest.files, { path: `${writes.instructionsPath}#block`, sha256: sha256(block.text) }, item => item.path === `${writes.instructionsPath}#block`);
      } else if (writes.settingsPath) {
        await setOutputStyle(writes.settingsPath, OUTPUT_STYLE, backupDir);
      }
      if (!manifest.completedSteps.includes(step.id)) manifest.completedSteps.push(step.id);
      await saveManifest(ctx.home, manifest);
      completed.push(step.id);
    } catch (error) {
      return { status: "failed", step: step.id, output: limit(error instanceof Error ? error.message : String(error)), completed };
    }
  }
  return { status: "applied", completed, unchanged, backups };
}

/** Renders an apply outcome as text. It prints the failed command output but never host file contents. */
export function formatApply(outcome: ApplyOutcome): string {
  if (outcome.status === "error") return `Error: ${outcome.message}\n`;
  if (outcome.status === "refused") return `Refused: ${outcome.message}\n`;
  if (outcome.status === "failed") {
    return [`Failed at step ${outcome.step}.`, `Output: ${outcome.output}`, `Completed steps: ${outcome.completed.join(", ") || "none"}`, "Run plan again to see the remaining steps.", ""].join("\n");
  }
  return [
    outcome.completed.length ? `Applied steps: ${outcome.completed.join(", ")}` : "Nothing to change. Every step is already current.",
    ...(outcome.unchanged.length ? [`Already current: ${outcome.unchanged.join(", ")}`] : []),
    ...outcome.backups.map(path => `Backup: ${path}`),
    ""
  ].join("\n");
}
