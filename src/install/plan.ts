import { basename, join } from "node:path";
import { hosts, type HostCapability } from "../hosts.js";
import { findBlock, upsertBlock } from "./block.js";
import { digestTree, readText, sha256, sha256File } from "./fsutil.js";
import { readManifest, type Manifest } from "./manifest.js";
import { resolveHost } from "./identity.js";
import { MCP_NAME, readRegistration, registrationFingerprint } from "./registration.js";
import { pickRuntime, probeRuntimes, type Runtime, type RuntimeProbe } from "./runtime.js";
import { run, which, type Env } from "./spawn.js";

export { MCP_NAME };
export const PLUGIN_NAME = "clear-writing-kit";
export const OUTPUT_STYLE = "clear-writing-kit";

export type PlanContext = {
  agent: string | undefined;
  env: Env;
  home: string;
  /** Directory that holds the payload to install: the committed `dist/`. */
  payloadDir: string;
  /** The generated instruction block, markers included. */
  blockText: string;
};

export type StepId = "payload" | "plugin" | "mcp" | "block" | "output-style";
export type PlanStep = { id: StepId; action: "create" | "update" | "none" | "blocked"; target: string; summary: string; diff: string[] };
/** A blocking conflict leaves the plan without an applicable hash. Other conflicts are reported and kept. */
export type Conflict = { kind: "output-style" | "mcp-ownership"; target: string; detail: string; blocking?: boolean };
export type HostPresence = { id: string; found: boolean };

/**
 * Ownership state of the same-name MCP registration on the selected host.
 * The install manifest entry for the same host, kind, and name is the only ownership proof.
 * absent: no live entry and no manifest entry. Create.
 * owned-missing: manifest entry, no live entry. Recreate.
 * owned-current: live fingerprint equals the manifest fingerprint and the planned registration. No change.
 * owned-stale: live fingerprint equals the manifest fingerprint, and the planned registration differs. Update.
 * unowned, unreadable, drifted: blocking conflicts. The installer does not remove, add, or adopt the entry.
 */
export type McpOwnershipStatus = "absent" | "owned-missing" | "owned-current" | "owned-stale" | "unowned" | "unreadable" | "drifted";

/** Ownership evidence that the plan was computed from. Apply compares it again right before the first MCP mutation. */
export type McpOwnershipEvidence = {
  status: McpOwnershipStatus;
  /** Fingerprint in the install manifest entry for this host, kind, and name, or null when no entry exists. */
  manifestFingerprint: string | null;
  /** Live registration: "absent", "unreadable", or the fingerprint of the complete command vector. */
  live: string;
};

/** Classifies ownership from the manifest entry, the live registration, and the planned registration fingerprint. */
export function classifyMcpOwnership(manifestFingerprint: string | null, live: string, plannedFingerprint: string): McpOwnershipStatus {
  if (live === "unreadable") return "unreadable";
  if (live === "absent") return manifestFingerprint === null ? "absent" : "owned-missing";
  if (manifestFingerprint === null) return "unowned";
  if (live !== manifestFingerprint) return "drifted";
  return live === plannedFingerprint ? "owned-current" : "owned-stale";
}

/** Reads the live registration as one evidence string: "absent", "unreadable", or the fingerprint. */
export async function readLiveMcpEvidence(host: HostCapability, env: Env, launcher: string): Promise<{ live: string; reason?: string }> {
  const result = await readRegistration(host, env, { launcher });
  if (result.status === "unreadable") return { live: "unreadable", reason: result.reason };
  if (result.status === "absent") return { live: "absent" };
  return { live: result.fingerprint };
}

/** Returns the manifest fingerprint for this host's MCP entry, or null when the manifest does not record one. */
export function manifestMcpFingerprint(manifest: Manifest, hostId: string): string | null {
  return manifest.cli.find(entry => entry.host === hostId && entry.kind === "mcp" && entry.name === MCP_NAME)?.fingerprint ?? null;
}
export type Plan = {
  host: { id: string; displayName: string };
  version: string;
  hostsFound: HostPresence[];
  runtimes: RuntimeProbe[];
  runtime: Runtime;
  steps: PlanStep[];
  conflicts: Conflict[];
  payloadDigest: string;
  /** Normalized state of each target, keyed by step id. Apply compares these to name a changed target. */
  targetStates: Record<StepId, string>;
  mcpOwnership: McpOwnershipEvidence;
  /** Null when a blocking conflict exists. Apply never accepts a blocked plan. */
  hash: string | null;
};
export type PlanError = { status: "error"; kind: "usage" | "mismatch" | "runtime" | "manifest" | "state" | "block"; message: string };
export type PlanOutcome =
  | { status: "ready"; plan: Plan & { hash: string } }
  | { status: "blocked"; plan: Plan & { hash: null } }
  | { status: "manual"; host: { id: string; displayName: string }; manualSteps: string[] }
  | PlanError;

const fail = (kind: PlanError["kind"], message: string): PlanError => ({ status: "error", kind, message });
const normalizePath = (text: string) => text.replace(/\\+/g, "/");
const hostBinary = (host: HostCapability) => host.mcpCommands.add.split(" ")[0];

/** Line diff by longest common subsequence. Lines carry a "- " or "+ " prefix, and unchanged lines are left out. */
export function lineDiff(before: readonly string[], after: readonly string[]): string[] {
  const table = Array.from({ length: before.length + 1 }, () => new Array<number>(after.length + 1).fill(0));
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const diff: string[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) { i++; j++; }
    else if (j < after.length && (i === before.length || table[i][j + 1] >= table[i + 1][j])) diff.push(`+ ${after[j++]}`);
    else diff.push(`- ${before[i++]}`);
  }
  return diff;
}

function blockVersion(blockText: string) {
  return /<!-- clear-writing-kit:begin v=([^ >]+) -->/.exec(blockText)?.[1];
}

function manifestDigest(manifest: Manifest) {
  const files = [...manifest.files]
    .map(f => ({ path: normalizePath(f.path), sha256: f.sha256, owners: [...f.owners].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const cli = [...manifest.cli]
    .map(c => ({ host: c.host, kind: c.kind, name: c.name, fingerprint: c.fingerprint }))
    .sort((a, b) => `${a.host}:${a.kind}:${a.name}`.localeCompare(`${b.host}:${b.kind}:${b.name}`));
  const blocks = [...(manifest.blocks || [])]
    .map(b => ({ host: b.host, target: normalizePath(b.target), sha256: b.sha256 }))
    .sort((a, b) => `${a.host}:${a.target}`.localeCompare(`${b.host}:${b.target}`));
  const settings = [...(manifest.settings || [])]
    .map(s => ({ host: s.host, target: normalizePath(s.target), setting: s.setting, value: s.value }))
    .sort((a, b) => `${a.host}:${a.target}:${a.setting}`.localeCompare(`${b.host}:${b.target}:${b.setting}`));
  const completedEntries = Object.entries(manifest.completedSteps || {})
    .map(([h, steps]) => [h, [...steps].sort()] as [string, string[]])
    .sort(([a], [b]) => a.localeCompare(b));
  const completedSteps = Object.fromEntries(completedEntries);
  return sha256(JSON.stringify({
    schemaRevision: manifest.schemaRevision,
    version: manifest.version,
    files,
    cli,
    blocks,
    settings,
    completedSteps
  }));
}

function manualSteps(host: HostCapability, home: string, env: Env) {
  const configDirectory = (host.configDirectoryEnv && env[host.configDirectoryEnv]) || host.configDirectory(home);
  return [
    `Plugin: ${host.pluginCommands.install}, with the clear-writing-kit plugin from this repository.`,
    `MCP: ${host.mcpCommands.add}, registering ${MCP_NAME} with the launcher command from INSTALL.md.`,
    `Instruction block: add the contents of install/agents-block.md to ${join(configDirectory, basename(host.globalInstructionsFile(home)))}.`,
    `${host.displayName} is not verified, so \`install apply\` refuses to run for it.`
  ];
}

type HostState = { plugin: "absent" | "installed"; mcp: McpOwnershipEvidence; unreadableReason?: string };

async function readHostState(host: HostCapability, env: Env, launcher: string, runtime: Runtime, manifest: Manifest): Promise<PlanError | HostState> {
  const binary = which(hostBinary(host), env);
  if (!binary) return fail("state", `The ${host.displayName} command "${hostBinary(host)}" is not on PATH, so its plugin and MCP state cannot be read.`);
  const plugins = await run(binary, ["plugin", "list"], { env });
  if (plugins.code !== 0) return fail("state", `"${hostBinary(host)} plugin list" failed with exit code ${plugins.code}.`);
  const plugin = new RegExp(`(^|[^\\w-])${PLUGIN_NAME}(?![\\w-])`, "m").test(plugins.stdout) ? "installed" : "absent";
  const { live, reason } = await readLiveMcpEvidence(host, env, launcher);
  const manifestFingerprint = manifestMcpFingerprint(manifest, host.id);
  const plannedFingerprint = registrationFingerprint({ command: runtime.command, args: [...runtime.args, launcher, "mcp"] });
  const status = classifyMcpOwnership(manifestFingerprint, live, plannedFingerprint);
  return { plugin, mcp: { status, manifestFingerprint, live }, unreadableReason: reason };
}

function ownershipConflictDetail(state: HostState) {
  switch (state.mcp.status) {
    case "unowned":
      return `A registration named ${MCP_NAME} exists, and the install manifest does not record it. Another tool or the user owns it.`;
    case "unreadable":
      return `The registration named ${MCP_NAME} could not be read safely: ${state.unreadableReason ?? "unknown reason"}`;
    case "drifted":
      return `The registration named ${MCP_NAME} no longer matches the fingerprint in the install manifest. It was changed after install.`;
    default:
      return undefined;
  }
}

export async function computePlan(ctx: PlanContext): Promise<PlanOutcome> {
  const resolved = resolveHost(ctx.agent, ctx.env);
  if (!resolved.ok) return fail(resolved.error.startsWith("Host mismatch") ? "mismatch" : "usage", resolved.error);
  const host = resolved.value;
  const hostSummary = { id: host.id, displayName: host.displayName };
  if (!host.verified) return { status: "manual", host: hostSummary, manualSteps: manualSteps(host, ctx.home, ctx.env) };

  const probes = await probeRuntimes(ctx.env);
  const runtime = pickRuntime(probes);
  if (!runtime.ok) return fail("runtime", runtime.error);

  const manifest = await readManifest(ctx.home);
  if (!manifest.ok) return fail("manifest", manifest.error);

  const version = blockVersion(ctx.blockText);
  if (!version) return fail("block", "The instruction block has no begin marker with a version.");
  const payloadDigest = await digestTree(ctx.payloadDir);
  if (!payloadDigest) return fail("state", "The payload directory is missing.");

  const home = ctx.home;
  const kitDirectory = join(home, ".clear-writing-kit");
  const versionDirectory = join(kitDirectory, version);
  const launcher = join(kitDirectory, "cwk.mjs");
  const configDirectory = (host.configDirectoryEnv && ctx.env[host.configDirectoryEnv]) || host.configDirectory(home);
  const instructionsPath = join(configDirectory, basename(host.globalInstructionsFile(home)));

  const state = await readHostState(host, ctx.env, launcher, runtime.value, manifest.value);
  if ("status" in state) return state;

  const steps: PlanStep[] = [];
  const targetStates = {} as Record<StepId, string>;

  const installedDigest = await digestTree(versionDirectory);
  const launcherDigest = await sha256File(launcher);
  const payloadState = installedDigest === undefined ? "absent" : installedDigest === payloadDigest ? (launcherDigest ? "current" : "launcher-missing") : "different";
  targetStates.payload = `${payloadState}:${installedDigest ?? ""}:${launcherDigest ?? ""}`;
  steps.push({
    id: "payload",
    action: payloadState === "current" ? "none" : payloadState === "absent" ? "create" : "update",
    target: versionDirectory,
    summary: `Copy the payload to ${versionDirectory} and point ${launcher} at it.`,
    diff: payloadState === "current" ? [] : [`+ payload ${payloadDigest.slice(0, 12)} in ${versionDirectory}`, `+ launcher ${launcher}`]
  });

  targetStates.plugin = state.plugin;
  steps.push({
    id: "plugin",
    action: state.plugin === "installed" ? "none" : "create",
    target: `${host.id} plugin ${PLUGIN_NAME}`,
    summary: `Install the ${PLUGIN_NAME} plugin through "${hostBinary(host)} plugin".`,
    diff: state.plugin === "installed" ? [] : [`+ plugin ${PLUGIN_NAME}`]
  });

  const registration = [runtime.value.command, ...runtime.value.args, launcher, "mcp"];
  const mcpStatus = state.mcp.status;
  const mcpAction: PlanStep["action"] = mcpStatus === "absent" || mcpStatus === "owned-missing" ? "create"
    : mcpStatus === "owned-current" ? "none"
      : mcpStatus === "owned-stale" ? "update"
        : "blocked";
  const mcpConflict = ownershipConflictDetail(state);
  targetStates.mcp = `${mcpStatus}:${state.mcp.live}:${state.mcp.manifestFingerprint ?? "unrecorded"}`;
  steps.push({
    id: "mcp",
    action: mcpAction,
    target: `${host.id} mcp ${MCP_NAME}`,
    summary: mcpAction === "blocked"
      ? `Leave ${MCP_NAME} unchanged. The installer does not own the current registration.`
      : mcpStatus === "owned-missing"
        ? `Register ${MCP_NAME} again through "${hostBinary(host)} mcp". The install manifest records it, and the host no longer has it.`
        : `Register ${MCP_NAME} through "${hostBinary(host)} mcp".`,
    diff: mcpAction === "none" || mcpAction === "blocked" ? [] : [
      ...(mcpAction === "update" ? [`- mcp ${MCP_NAME} (installer-owned entry from an earlier install)`] : []),
      `+ mcp ${MCP_NAME}: ${registration.join(" ")}`
    ]
  });

  const instructions = await readText(instructionsPath);
  const instructionText = instructions?.text ?? "";
  let upserted: { text: string; changed: boolean };
  try {
    upserted = upsertBlock(instructionText, ctx.blockText);
  } catch (error) {
    return fail("block", `${instructionsPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const oldBlock = findBlock(instructionText);
  const newBlock = findBlock(upserted.text);
  targetStates.block = instructions ? sha256(instructionText) : "absent";
  steps.push({
    id: "block",
    action: !upserted.changed ? "none" : oldBlock ? "update" : "create",
    target: instructionsPath,
    summary: `${oldBlock ? "Replace" : "Add"} the clear-writing-kit block in ${instructionsPath}${instructions ? ` (${instructions.eol === "\r\n" ? "CRLF" : "LF"}${instructions.bom ? ", BOM kept" : ""})` : " (new file)"}.`,
    diff: lineDiff(oldBlock ? oldBlock.text.split(/\r?\n/) : [], newBlock ? newBlock.text.split(/\r?\n/) : [])
  });

  const conflicts: Conflict[] = [];
  if (mcpConflict) conflicts.push({ kind: "mcp-ownership", target: `${host.id} mcp ${MCP_NAME}`, detail: mcpConflict, blocking: true });
  if (host.outputStyleSupport === "yes") {
    const settingsPath = join(configDirectory, "settings.json");
    const settings = await readText(settingsPath);
    let current: unknown;
    if (settings) {
      try {
        const parsed: unknown = JSON.parse(settings.text);
        current = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>).outputStyle : undefined;
      } catch {
        return fail("state", `${settingsPath} is not valid JSON.`);
      }
    }
    const shown = (value: unknown) => JSON.stringify(typeof value === "string" ? value.slice(0, 64) : typeof value);
    targetStates["output-style"] = current === undefined ? "unset" : shown(current);
    steps.push({
      id: "output-style",
      action: current === OUTPUT_STYLE ? "none" : current === undefined ? "create" : "update",
      target: `${settingsPath} outputStyle`,
      summary: `Set outputStyle to "${OUTPUT_STYLE}" in ${settingsPath}.`,
      diff: current === OUTPUT_STYLE ? [] : [...(current === undefined ? [] : [`- "outputStyle": ${shown(current)}`]), `+ "outputStyle": ${JSON.stringify(OUTPUT_STYLE)}`]
    });
    if (current !== undefined && current !== OUTPUT_STYLE) {
      conflicts.push({ kind: "output-style", target: settingsPath, detail: `outputStyle is ${shown(current)}, not "${OUTPUT_STYLE}".` });
    }
  }

  const hostsFound = hosts.map(candidate => ({ id: candidate.id, found: which(hostBinary(candidate), ctx.env) !== undefined }));
  const base = { host: hostSummary, version, hostsFound, runtimes: probes, runtime: runtime.value, steps, conflicts, payloadDigest, targetStates, mcpOwnership: state.mcp };
  if (conflicts.some(conflict => conflict.blocking)) return { status: "blocked", plan: { ...base, hash: null } };

  const hash = sha256(JSON.stringify({
    installerVersion: version,
    payloadDigest,
    host: host.id,
    runtime: { command: runtime.value.command, args: runtime.value.args },
    manifest: manifestDigest(manifest.value),
    targets: steps.map(step => ({ id: step.id, action: step.action, target: step.target, state: targetStates[step.id] })),
    conflicts: conflicts.map(conflict => ({ kind: conflict.kind, target: conflict.target }))
  }));
  return { status: "ready", plan: { ...base, hash } };
}

/** Renders a plan outcome as text. It prints only the kit's own block and entries, never host file contents. */
export function formatPlan(outcome: PlanOutcome): string {
  if (outcome.status === "error") return `Error: ${outcome.message}\nNo plan hash.\n`;
  if (outcome.status === "manual") {
    return [`Host: ${outcome.host.id} (${outcome.host.displayName}), unverified`, "Manual steps:", ...outcome.manualSteps.map((step, index) => `${index + 1}. ${step}`), "No plan hash.", ""].join("\n");
  }
  const { plan } = outcome;
  const lines = [
    `Clear Writing Kit install plan, version ${plan.version}`,
    `Requesting host: ${plan.host.id} (${plan.host.displayName})`,
    `Hosts found: ${plan.hostsFound.filter(host => host.found).map(host => host.id).join(", ") || "none"}`,
    "Runtimes:",
    ...plan.runtimes.map(probe => `  ${probe.kind}: ${probe.qualifies ? `${probe.version} at ${probe.path}` : probe.reason}${probe.kind === plan.runtime.kind ? " (selected)" : ""}`),
    "Conflicts:",
    ...(plan.conflicts.length ? plan.conflicts.map(conflict => `  [${conflict.kind}] ${conflict.target}: ${conflict.detail} ${conflict.blocking ? "Blocking. The installer does not remove, replace, or adopt it." : "The installer keeps it."}`) : ["  none"]),
    "Steps:"
  ];
  plan.steps.forEach((step, index) => {
    lines.push(step.action === "none" ? `${index + 1}. ${step.id}: none. Already current.` : `${index + 1}. ${step.id}: ${step.action}. ${step.summary}`);
    for (const line of step.diff) lines.push(`     ${line}`);
  });
  if (outcome.status === "blocked") lines.push("No plan hash. Resolve the blocking conflicts, then run plan again.", "");
  else lines.push(`Plan hash: ${plan.hash}`, "");
  return lines.join("\n");
}
