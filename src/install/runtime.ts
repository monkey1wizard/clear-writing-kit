import { err, ok, type Result } from "./fsutil.js";
import { run, which, type Env } from "./spawn.js";

export type RuntimeKind = "node" | "deno" | "bun";
export type Runtime = { kind: RuntimeKind; command: string; args: string[]; version: string };
export type RuntimeProbe = { kind: RuntimeKind; path?: string; version?: string; qualifies: boolean; reason?: string };

const order: readonly RuntimeKind[] = ["node", "deno", "bun"];

function parseVersion(output: string) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(output);
  return match ? { text: match[0], major: Number(match[1]), minor: Number(match[2]) } : undefined;
}

async function probe(kind: RuntimeKind, env: Env): Promise<RuntimeProbe> {
  const path = which(kind, env);
  if (!path) return { kind, qualifies: false, reason: "not on PATH" };
  const result = await run(path, ["--version"], { env });
  const version = result.code === 0 ? parseVersion(result.stdout) : undefined;
  if (!version) return { kind, path, qualifies: false, reason: "version could not be read" };
  const qualifies = kind === "node" ? version.major > 20 || (version.major === 20 && version.minor >= 18)
    : kind === "deno" ? version.major >= 2
      : true;
  const required = kind === "node" ? "needs >= 20.18" : "needs >= 2";
  return { kind, path, version: version.text, qualifies, reason: qualifies ? undefined : `version ${version.text} ${required}` };
}

/** Probes Node, Deno, and Bun on PATH in preference order. With stopAtFirst, probing ends at the first qualifying runtime. */
export async function probeRuntimes(env: Env, stopAtFirst = false) {
  const probes: RuntimeProbe[] = [];
  for (const kind of order) {
    const result = await probe(kind, env);
    probes.push(result);
    if (stopAtFirst && result.qualifies) break;
  }
  return probes;
}

export function pickRuntime(probes: readonly RuntimeProbe[]): Result<Runtime> {
  const chosen = probes.find(candidate => candidate.qualifies && candidate.path && candidate.version);
  if (chosen?.path && chosen.version) {
    return ok({ kind: chosen.kind, command: chosen.path, args: chosen.kind === "deno" ? ["run", "-A"] : [], version: chosen.version });
  }
  const detail = probes.map(candidate => `${candidate.kind}: ${candidate.reason ?? "not usable"}`).join("; ");
  return err(`No qualifying runtime on PATH. Install Node >= 20.18, Deno >= 2, or Bun. Found: ${detail}.`);
}

/** Picks Node >= 20.18, then Deno >= 2 with `run -A`, then Bun. Returns an error value when none qualifies. */
export async function selectRuntime(env: Env): Promise<Result<Runtime>> {
  return pickRuntime(await probeRuntimes(env, true));
}
