import { spawn, type ChildProcess } from "node:child_process";
import { stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type { HostCapability } from "../hosts.js";
import { findBlock } from "./block.js";
import { readText } from "./fsutil.js";
import { resolveHost } from "./identity.js";
import { MCP_NAME, OUTPUT_STYLE, type Conflict, type PlanContext, type PlanError } from "./plan.js";
import { run, which, type Env } from "./spawn.js";

export type VerifyContext = PlanContext & {
  /** Time limit for each MCP call. The default is 30 s. */
  callTimeoutMs?: number;
};
export type CheckStatus = "pass" | "fail" | "skipped";
export type Check = { id: string; status: CheckStatus; detail: string };
export type VerifyOutcome =
  | { status: "pass" | "incomplete"; host: { id: string; displayName: string }; checks: Check[]; conflicts: Conflict[]; notes: string[] }
  | { status: "refused"; message: string }
  | PlanError;

const CALL_TIMEOUT_MS = 30000;
const BLOCK_LIMIT_BYTES = 2048;
const DETAIL_LIMIT = 300;
const PROTOCOL_VERSION = "2025-06-18";
/** Each sentence must produce at least one finding in its language, with the document profile. */
const FIXTURES: { language: string; text: string }[] = [
  { language: "en-US", text: "alpha; beta" },
  { language: "zh-TW", text: "alpha; beta" },
  { language: "ja-JP", text: "結果を説明します。\n\n- テストを実行します。\n\n処理は完了していません。\n" }
];

const limit = (text: string) => (text.length > DETAIL_LIMIT ? `${text.slice(0, DETAIL_LIMIT)}... (truncated)` : text);
const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const slashes = (text: string) => text.replace(/\\/g, "/");
const hostBinary = (host: HostCapability) => host.mcpCommands.add.split(" ")[0];

const LEGACY_SKILL = "accurate-answer";
const CMD_LIMIT_MESSAGE = "An argument contains a character that cmd.exe cannot carry unchanged.";
const isWindows = () => process.platform === "win32";

function envValue(env: Env, name: string) {
  if (!isWindows()) return env[name];
  const key = Object.keys(env).find(candidate => candidate.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : env[key];
}

/** Quotes one argument for a cmd.exe command line. Returns undefined when cmd.exe cannot carry it unchanged. */
function quoteForCmd(argument: string) {
  if (/["%\r\n\0]/.test(argument)) return undefined;
  return `"${argument.replace(/(\\+)$/, "$1$1")}"`;
}

/** Starts a program with piped stdin, stdout, and stderr, because the MCP session talks to it over time. A .cmd or .bat file goes through cmd.exe. The caller owns the child and must kill it. */
function startInteractive(command: string, args: readonly string[], env: Env): { ok: true; child: ChildProcess } | { ok: false; error: string } {
  const viaCmd = isWindows() && /\.(cmd|bat)$/i.test(command);
  let file = command;
  let spawnArgs: string[] = [...args];
  if (viaCmd) {
    const quoted = [command, ...args].map(quoteForCmd);
    if (quoted.includes(undefined)) return { ok: false, error: CMD_LIMIT_MESSAGE };
    file = envValue(env, "ComSpec") ?? "cmd.exe";
    spawnArgs = ["/d", "/s", "/c", `"${quoted.join(" ")}"`];
  }
  try {
    const child = spawn(file, spawnArgs, {
      env: env as NodeJS.ProcessEnv,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: viaCmd
    });
    return { ok: true, child };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function isDirectory(path: string) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

function foreignBlocksNaming(text: string) {
  const names: string[] = [];
  for (const match of text.matchAll(/<!--\s*([\w.-]+):begin\b[^>]*-->([\s\S]*?)<!--\s*\1:end\s*-->/g)) {
    if (match[1] !== "clear-writing-kit" && match[2].includes(LEGACY_SKILL)) names.push(match[1]);
  }
  return names;
}

/** Reports the legacy writing skill directories and the foreign instruction blocks that name it. Nothing is deleted. */
async function findLegacyConflicts(home: string, configDirectory: string, instructionsPath: string, instructionText: string): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];
  for (const directory of new Set([join(home, ".agents", "skills", LEGACY_SKILL), join(configDirectory, "skills", LEGACY_SKILL)])) {
    if (await isDirectory(directory)) conflicts.push({ kind: "skill", target: directory, detail: `The ${LEGACY_SKILL} skill directory exists.` });
  }
  for (const name of foreignBlocksNaming(instructionText)) {
    conflicts.push({ kind: "instruction-block", target: instructionsPath, detail: `The "${name}" block names ${LEGACY_SKILL}.` });
  }
  return conflicts;
}

type Registration = { command: string; args: string[] };

/**
 * Reads the registered command from the text of `mcp get`.
 * The arguments line is plain text, so the launcher path is matched as one argument. This keeps a path with spaces whole.
 */
function parseRegistration(text: string, launcher: string): Registration | string {
  const command = /^\s*command:\s*(.+?)\s*$/im.exec(text)?.[1];
  const argsText = /^\s*args:\s*(.*?)\s*$/im.exec(text)?.[1];
  if (!command || argsText === undefined) return "The host output has no command and arguments lines.";
  if (argsText.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(argsText);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) return { command, args: parsed };
    } catch {
      // Fall through to the plain text form.
    }
  }
  const index = slashes(argsText).indexOf(slashes(launcher));
  if (index < 0) return "The registered arguments do not name the installed launcher.";
  const before = argsText.slice(0, index).trim().split(/\s+/).filter(Boolean);
  const after = argsText.slice(index + launcher.length).trim().split(/\s+/).filter(Boolean);
  if (after.length !== 1 || after[0] !== "mcp") return "The registered arguments do not end with the launcher and mcp.";
  return { command, args: [...before, argsText.slice(index, index + launcher.length), "mcp"] };
}

/** One MCP stdio session: newline-delimited JSON-RPC 2.0 messages, with no client library. */
class McpSession {
  private buffer = "";
  private nextId = 1;
  private closed: Error | undefined;
  private readonly pending = new Map<number, { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();

  constructor(private readonly child: ChildProcess, private readonly timeoutMs: number) {
    child.stdout?.setEncoding("utf8").on("data", chunk => this.read(chunk as string));
    child.stderr?.resume();
    child.stdin?.on("error", () => {});
    child.on("error", error => this.fail(new Error(`The server could not start: ${error.message}`)));
    child.on("close", code => this.fail(new Error(`The server exited with code ${code ?? "none"}.`)));
  }

  private read(chunk: string) {
    this.buffer += chunk;
    for (let newline = this.buffer.indexOf("\n"); newline >= 0; newline = this.buffer.indexOf("\n")) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }
      const waiting = typeof parsed.id === "number" ? this.pending.get(parsed.id) : undefined;
      if (!waiting || ("method" in parsed)) continue;
      this.pending.delete(parsed.id as number);
      clearTimeout(waiting.timer);
      waiting.resolve(parsed);
    }
  }

  private fail(error: Error) {
    this.closed ??= error;
    for (const [id, waiting] of this.pending) {
      clearTimeout(waiting.timer);
      waiting.reject(error);
      this.pending.delete(id);
    }
  }

  /** Sends one request. The promise rejects on a timeout or when the server exits. A JSON-RPC error reply resolves with its `error` member. */
  request(method: string, params: unknown): Promise<Record<string, unknown>> {
    if (this.closed) return Promise.reject(this.closed);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`No answer to ${method} within ${this.timeoutMs} ms.`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin?.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  }

  notify(method: string) {
    this.child.stdin?.write(`${JSON.stringify({ jsonrpc: "2.0", method })}\n`);
  }

  close() {
    this.fail(new Error("The session is closed."));
    this.child.stdin?.end();
    this.child.kill();
  }
}

const record = (value: unknown): Record<string, unknown> | undefined => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined);

/** Counts the findings in a `tools/call` result, or returns the reason the call does not hold any. */
function countFindings(reply: Record<string, unknown>): number | string {
  const error = record(reply.error);
  if (error) return `The server answered with an error: ${limit(String(error.message ?? "unknown"))}`;
  const result = record(reply.result);
  if (!result) return "The reply has no result.";
  const content = Array.isArray(result.content) ? record(result.content[0]) : undefined;
  if (result.isError === true) return `The tool reported an error: ${limit(String(content?.text ?? "unknown"))}`;
  const structured = record(result.structuredContent)?.findings;
  if (Array.isArray(structured)) return structured.length;
  try {
    const parsed: unknown = JSON.parse(String(content?.text ?? ""));
    if (Array.isArray(parsed)) return parsed.length;
  } catch {
    // The reply is not a findings list.
  }
  return "The result has no findings list.";
}

const pass = (id: string, detail: string): Check => ({ id, status: "pass", detail });
const fail = (id: string, detail: string): Check => ({ id, status: "fail", detail });
const skipped = (id: string, detail: string): Check => ({ id, status: "skipped", detail });

/** Starts the registered command and checks `initialize`, `tools/list`, and one `tools/call` per language. A broken session skips the checks that remain. */
async function checkServer(registration: Registration, env: Env, timeoutMs: number): Promise<Check[]> {
  const ids = ["mcp-initialize", "mcp-tools", ...FIXTURES.map(fixture => `lint-${fixture.language}`)];
  const checks: Check[] = [];
  const skipRest = (reason: string) => {
    for (const id of ids.slice(checks.length)) checks.push(skipped(id, reason));
  };
  const resolved = which(registration.command, env);
  if (!resolved) {
    checks.push(fail(ids[0], `The registered command "${registration.command}" is not on PATH.`));
    skipRest("The server did not start.");
    return checks;
  }
  const started = startInteractive(resolved, registration.args, env);
  if (!started.ok) {
    checks.push(fail(ids[0], `The server could not start: ${limit(started.error)}`));
    skipRest("The server did not start.");
    return checks;
  }
  const session = new McpSession(started.child, timeoutMs);
  try {
    const initialized = await session.request("initialize", { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "cwk-install-verify", version: "1.0.0" } });
    const initializeResult = record(initialized.result);
    if (!initializeResult || typeof initializeResult.protocolVersion !== "string") {
      checks.push(fail(ids[0], `The initialize reply has no protocol version.${record(initialized.error) ? ` Error: ${limit(String(record(initialized.error)?.message))}` : ""}`));
      skipRest("The server did not initialize.");
      return checks;
    }
    checks.push(pass(ids[0], `Protocol version ${initializeResult.protocolVersion}.`));
    session.notify("notifications/initialized");

    const listing = await session.request("tools/list", {});
    const tools = record(listing.result)?.tools;
    const names = Array.isArray(tools) ? tools.map(tool => record(tool)?.name) : [];
    checks.push(names.includes("lintText") ? pass(ids[1], "The server lists lintText.") : fail(ids[1], "The server does not list lintText."));

    for (const fixture of FIXTURES) {
      const id = `lint-${fixture.language}`;
      const reply = await session.request("tools/call", { name: "lintText", arguments: { text: fixture.text, language: fixture.language, genre: "document" } });
      const found = countFindings(reply);
      checks.push(typeof found === "string" ? fail(id, found) : found > 0 ? pass(id, `${found} finding${found === 1 ? "" : "s"}.`) : fail(id, "The fixture sentence produced no finding."));
    }
  } catch (error) {
    checks.push(fail(ids[checks.length], limit(message(error))));
    skipRest("An earlier MCP call failed or timed out.");
    session.close();
    return checks;
  }
  session.close();
  return checks;
}

/** Re-reads `outputStyle` from the settings file. Only a match or the reason for a mismatch is printed, never other settings. */
async function checkOutputStyle(settingsPath: string): Promise<{ check: Check; conflict?: Conflict }> {
  const id = "output-style";
  let file;
  try {
    file = await readText(settingsPath);
  } catch (error) {
    return { check: fail(id, `${settingsPath} cannot be read: ${limit(message(error))}`) };
  }
  if (!file) return { check: fail(id, `${settingsPath} does not exist, so outputStyle is not set.`) };
  let value: unknown;
  try {
    value = record(JSON.parse(file.text))?.outputStyle;
  } catch {
    return { check: fail(id, `${settingsPath} is not valid JSON.`) };
  }
  if (value === OUTPUT_STYLE) return { check: pass(id, `outputStyle is "${OUTPUT_STYLE}".`) };
  if (value === undefined) return { check: fail(id, `outputStyle is not set in ${settingsPath}. Another writer may have reset it.`) };
  const shown = JSON.stringify(typeof value === "string" ? value.slice(0, 64) : typeof value);
  const detail = `outputStyle is ${shown}, not "${OUTPUT_STYLE}".`;
  return { check: fail(id, detail), conflict: { kind: "output-style", target: settingsPath, detail } };
}

async function checkBlock(instructionsPath: string, text: string | undefined): Promise<Check> {
  const id = "instruction-block";
  if (text === undefined) return fail(id, `${instructionsPath} does not exist, so it holds no block.`);
  let block;
  try {
    block = findBlock(text);
  } catch (error) {
    return fail(id, limit(message(error)));
  }
  if (!block) return fail(id, `${instructionsPath} holds 0 clear-writing-kit blocks. Expected 1.`);
  const bytes = Buffer.byteLength(block.text, "utf8");
  if (bytes >= BLOCK_LIMIT_BYTES) return fail(id, `The block is ${bytes} bytes. The limit is under ${BLOCK_LIMIT_BYTES}.`);
  return pass(id, `1 block, ${bytes} bytes.`);
}

/** Verifies an installation. The result is "pass" only when every check ran and passed. */
export async function verifyInstall(ctx: VerifyContext): Promise<VerifyOutcome> {
  const resolved = resolveHost(ctx.agent, ctx.env);
  if (!resolved.ok) return { status: "error", kind: resolved.error.startsWith("Host mismatch") ? "mismatch" : "usage", message: resolved.error };
  const host = resolved.value;
  if (!host.verified) return { status: "refused", message: `${host.displayName} is not verified, so verify does not run for it.` };

  const timeoutMs = ctx.callTimeoutMs ?? CALL_TIMEOUT_MS;
  const launcher = join(ctx.home, ".clear-writing-kit", "cwk.mjs");
  const configDirectory = (host.configDirectoryEnv && ctx.env[host.configDirectoryEnv]) || host.configDirectory(ctx.home);
  const instructionsPath = join(configDirectory, basename(host.globalInstructionsFile(ctx.home)));
  const notes: string[] = [];
  const checks: Check[] = [];
  const conflicts: Conflict[] = [];
  const serverIds = ["mcp-initialize", "mcp-tools", ...FIXTURES.map(fixture => `lint-${fixture.language}`)];

  const binary = which(hostBinary(host), ctx.env);
  let registration: Registration | undefined;
  if (!binary) {
    checks.push(fail("mcp-registration", `The ${host.displayName} command "${hostBinary(host)}" is not on PATH, so the registered command cannot be read.`));
  } else {
    const entry = await run(binary, ["mcp", "get", MCP_NAME], { env: ctx.env });
    if (entry.code === -1) checks.push(fail("mcp-registration", `"${hostBinary(host)} mcp get" could not run.`));
    else if (entry.code !== 0) checks.push(fail("mcp-registration", `${MCP_NAME} is not registered in ${host.displayName}.`));
    else {
      const parsed = parseRegistration(entry.stdout + entry.stderr, launcher);
      if (typeof parsed === "string") checks.push(fail("mcp-registration", parsed));
      else {
        registration = parsed;
        checks.push(pass("mcp-registration", `Registered command: ${[parsed.command, ...parsed.args].join(" ")}`));
      }
    }
  }
  if (registration) checks.push(...await checkServer(registration, ctx.env, timeoutMs));
  else for (const id of serverIds) checks.push(skipped(id, "The registered command was not read."));

  if (host.outputStyleSupport === "yes") {
    const style = await checkOutputStyle(join(configDirectory, "settings.json"));
    checks.push(style.check);
    if (style.conflict) conflicts.push(style.conflict);
  } else {
    notes.push(`output-style: not applicable. ${host.displayName} has no verified outputStyle setting.`);
  }

  let instructionText: string | undefined;
  try {
    instructionText = (await readText(instructionsPath))?.text;
    checks.push(await checkBlock(instructionsPath, instructionText));
  } catch (error) {
    checks.push(fail("instruction-block", `${instructionsPath} cannot be read: ${limit(message(error))}`));
  }

  try {
    conflicts.push(...await findLegacyConflicts(ctx.home, configDirectory, instructionsPath, instructionText ?? ""));
    const own = conflicts.length;
    checks.push(own ? fail("legacy-conflicts", `${own} legacy conflict${own === 1 ? "" : "s"} found. The installer keeps them.`) : pass("legacy-conflicts", "No legacy conflicts."));
  } catch (error) {
    checks.push(fail("legacy-conflicts", `The legacy check failed: ${limit(message(error))}`));
  }

  const complete = checks.every(check => check.status === "pass");
  return { status: complete ? "pass" : "incomplete", host: { id: host.id, displayName: host.displayName }, checks, conflicts, notes };
}

/** Renders a verify outcome as text. Each failed or skipped check is named, and no host file content is printed. */
export function formatVerify(outcome: VerifyOutcome): string {
  if (outcome.status === "error") return `Error: ${outcome.message}\n`;
  if (outcome.status === "refused") return `Refused: ${outcome.message}\n`;
  const lines = [
    `Clear Writing Kit install verify, host: ${outcome.host.id} (${outcome.host.displayName})`,
    ...outcome.checks.map(check => `[${check.status}] ${check.id}: ${check.detail}`),
    ...outcome.notes,
    "Legacy conflicts:",
    ...(outcome.conflicts.length ? outcome.conflicts.map(conflict => `  [${conflict.kind}] ${conflict.target}: ${conflict.detail} The installer keeps it.`) : ["  none"])
  ];
  const open = outcome.checks.filter(check => check.status !== "pass");
  lines.push(outcome.status === "pass" ? "Result: pass. Every check ran and passed." : `Result: incomplete. Not passed: ${open.map(check => `${check.id} (${check.status})`).join(", ")}.`, "");
  return lines.join("\n");
}
