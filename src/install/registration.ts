import { type HostCapability } from "../hosts.js";
import { sha256 } from "./fsutil.js";
import { run, which, type Env } from "./spawn.js";

export const MCP_NAME = "clear-writing-kit-textlint";

export type McpRegistration = {
  command: string;
  args: string[];
};

export type ReadRegistrationResult =
  | { status: "present"; registration: McpRegistration; fingerprint: string }
  | { status: "absent" }
  | { status: "unreadable"; reason: string };

export function registrationVector(reg: { command: string; args: readonly string[] }): string[] {
  return [reg.command, ...reg.args];
}

export function registrationFingerprint(reg: { command: string; args: readonly string[] }): string {
  return sha256(JSON.stringify(registrationVector(reg)));
}

export function isRecognizedAbsent(output: string, serverName: string): boolean {
  const text = output.trim();
  if (!text) return false;

  // Auth, permission, timeout, or mixed failures must never be classified as absent.
  if (
    /(?:auth|unauthorized|unauthenticated|forbidden|token|credential|permission|access\s+denied|eacces|eperm|timeout|timed\s*out|etimedout|connection\s+refused|econnrefused)/i.test(
      text
    )
  ) {
    return false;
  }

  const escaped = serverName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`no\\s+(?:mcp\\s+)?server\\s+(?:found\\s+)?(?:named\\s+|with\\s+name\\s+)?['"\`]?${escaped}['"\`]?(?![\\w-])`, "i").test(text)) {
    return true;
  }
  if (new RegExp(`(?:mcp\\s+)?server\\s+['"\`]?${escaped}['"\`]?\\s+(?:is\\s+)?(?:not\\s+found|does\\s+not\\s+exist)(?![\\w-])`, "i").test(text)) {
    return true;
  }
  if (new RegExp(`(?:^|[\\s"'\`])${escaped}['"\`]?\\s+(?:is\\s+not\\s+registered|does\\s+not\\s+exist|not\\s+found)(?![\\w-])`, "i").test(text)) {
    return true;
  }
  if (new RegExp(`(?:unknown|no\\s+such)\\s+(?:mcp\\s+)?server\\s*[:\\s]\\s*['"\`]?${escaped}['"\`]?(?![\\w-])`, "i").test(text)) {
    return true;
  }
  return false;
}

function parseSimpleTokens(text: string): string[] | undefined {
  // Reject non-anchor quote parsing rather than implement shell semantics.
  if (/["'`]/.test(text)) {
    return undefined;
  }
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/);
}

function findAnchorOccurrences(argsText: string, launcher: string): { start: number; end: number; token: string }[] {
  const normText = argsText.replace(/\\/g, "/").toLowerCase();
  const normAnchor = launcher.replace(/\\/g, "/").toLowerCase();
  const matches: { start: number; end: number; token: string }[] = [];
  let searchPos = 0;
  while (searchPos < normText.length) {
    const foundIdx = normText.indexOf(normAnchor, searchPos);
    if (foundIdx === -1) break;
    const foundEnd = foundIdx + normAnchor.length;

    let start = foundIdx;
    let end = foundEnd;
    let isQuoted = false;

    if (
      start > 0 &&
      (argsText[start - 1] === '"' || argsText[start - 1] === "'" || argsText[start - 1] === "`") &&
      end < argsText.length &&
      argsText[end] === argsText[start - 1]
    ) {
      start--;
      end++;
      isQuoted = true;
    }

    const beforeBoundary = start === 0 || /\s/.test(argsText[start - 1]);
    const afterBoundary = end === argsText.length || /\s/.test(argsText[end]);

    if (beforeBoundary && afterBoundary) {
      const token = isQuoted ? argsText.slice(start + 1, end - 1) : argsText.slice(start, end);
      matches.push({ start, end, token });
    }
    searchPos = Math.max(end, foundEnd);
  }
  return matches;
}

export async function readRegistration(
  host: HostCapability,
  env: Env,
  options?: { launcher?: string; timeoutMs?: number; serverName?: string }
): Promise<ReadRegistrationResult> {
  const serverName = options?.serverName ?? MCP_NAME;
  const timeoutMs = options?.timeoutMs ?? 120000;
  const binaryName = host.mcpCommands.add.split(" ")[0];
  const binary = which(binaryName, env);
  if (!binary) {
    return { status: "unreadable", reason: `Host command "${binaryName}" is not on PATH.` };
  }

  const queryArgs = host.id === "codex" ? ["mcp", "get", serverName, "--json"] : ["mcp", "get", serverName];
  const res = await run(binary, queryArgs, { env, timeoutMs });

  if (res.code === -1) {
    return { status: "unreadable", reason: "Host mcp get timed out or failed to start." };
  }

  if (res.code !== 0) {
    if (isRecognizedAbsent(res.stdout + "\n" + res.stderr, serverName)) {
      return { status: "absent" };
    }
    return { status: "unreadable", reason: `Host command exited with code ${res.code}.` };
  }

  if (host.id === "codex") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(res.stdout);
    } catch {
      return { status: "unreadable", reason: "Host output is not valid JSON." };
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { status: "unreadable", reason: "Host JSON output must be an object." };
    }

    const obj = parsed as Record<string, unknown>;
    let command: unknown;
    let args: unknown;

    if (obj.transport !== undefined) {
      if (typeof obj.transport !== "object" || obj.transport === null || Array.isArray(obj.transport)) {
        return { status: "unreadable", reason: "Malformed transport in host JSON." };
      }
      const transport = obj.transport as Record<string, unknown>;
      if (transport.type !== "stdio") {
        return { status: "unreadable", reason: "Unsupported transport type." };
      }
      command = transport.command;
      args = transport.args;
    } else {
      if (obj.type !== undefined && obj.type !== "stdio") {
        return { status: "unreadable", reason: "Unsupported transport type." };
      }
      command = obj.command;
      args = obj.args;
    }

    if (typeof command !== "string" || command.trim() === "") {
      return { status: "unreadable", reason: "Missing stdio command in host registration." };
    }
    if (!Array.isArray(args) || !args.every(a => typeof a === "string")) {
      return { status: "unreadable", reason: "Args must be an array of strings." };
    }

    let cleanCommand = command.trim();
    if (
      (cleanCommand.startsWith('"') && cleanCommand.endsWith('"') && cleanCommand.length >= 2 && cleanCommand.indexOf('"', 1) === cleanCommand.length - 1) ||
      (cleanCommand.startsWith("'") && cleanCommand.endsWith("'") && cleanCommand.length >= 2 && cleanCommand.indexOf("'", 1) === cleanCommand.length - 1) ||
      (cleanCommand.startsWith("`") && cleanCommand.endsWith("`") && cleanCommand.length >= 2 && cleanCommand.indexOf("`", 1) === cleanCommand.length - 1)
    ) {
      cleanCommand = cleanCommand.slice(1, -1).trim();
    }
    if (!cleanCommand) {
      return { status: "unreadable", reason: "Missing stdio command in host registration." };
    }
    if (/["'`]/.test(cleanCommand)) {
      return { status: "unreadable", reason: "Ambiguous quoting in host command." };
    }

    const registration: McpRegistration = { command: cleanCommand, args: [...args] };
    return {
      status: "present",
      registration,
      fingerprint: registrationFingerprint(registration)
    };
  }

  // Claude and text-format hosts
  const cleanStdout = res.stdout.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
  const lines = cleanStdout.split(/\r?\n/);
  let typeCount = 0;
  let typeVal: string | undefined;
  let commandCount = 0;
  let commandVal: string | undefined;
  let argsCount = 0;
  let argsVal: string | undefined;

  for (const line of lines) {
    const matchType = /^\s*(?:[-*•]\s+)?type\s*:\s*(.*?)\s*$/i.exec(line);
    if (matchType) {
      typeCount++;
      typeVal = matchType[1];
    }
    const matchCommand = /^\s*(?:[-*•]\s+)?command\s*:\s*(.*?)\s*$/i.exec(line);
    if (matchCommand) {
      commandCount++;
      commandVal = matchCommand[1];
    }
    const matchArgs = /^\s*(?:[-*•]\s+)?args\s*:\s*(.*?)\s*$/i.exec(line);
    if (matchArgs) {
      argsCount++;
      argsVal = matchArgs[1];
    }
  }

  if (typeCount > 1 || commandCount > 1 || argsCount > 1) {
    return { status: "unreadable", reason: "Duplicate fields detected in host output." };
  }
  if (commandCount === 0 || argsCount === 0 || !commandVal) {
    return { status: "unreadable", reason: "Missing Command or Args field in host output." };
  }
  if (typeVal !== undefined && typeVal.toLowerCase() !== "stdio") {
    return { status: "unreadable", reason: "Unsupported transport type." };
  }

  let command = commandVal.trim();
  if (
    (command.startsWith('"') && command.endsWith('"') && command.length >= 2 && command.indexOf('"', 1) === command.length - 1) ||
    (command.startsWith("'") && command.endsWith("'") && command.length >= 2 && command.indexOf("'", 1) === command.length - 1) ||
    (command.startsWith("`") && command.endsWith("`") && command.length >= 2 && command.indexOf("`", 1) === command.length - 1)
  ) {
    command = command.slice(1, -1).trim();
  }
  if (!command) {
    return { status: "unreadable", reason: "Empty Command field." };
  }
  if (/["'`]/.test(command)) {
    return { status: "unreadable", reason: "Ambiguous quoting in Command field." };
  }

  let argsText = argsVal.trim();
  if (
    (argsText.startsWith("`") && argsText.endsWith("`") && argsText.length >= 2 && argsText.indexOf("`", 1) === argsText.length - 1) ||
    (argsText.startsWith('"') && argsText.endsWith('"') && argsText.length >= 2 && argsText.startsWith('"['))
  ) {
    argsText = argsText.slice(1, -1).trim();
  }
  let args: string[];

  if (argsText.startsWith("[")) {
    try {
      const parsed = JSON.parse(argsText);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === "string")) {
        return { status: "unreadable", reason: "Args JSON must be an array of strings." };
      }
      args = parsed;
    } catch {
      return { status: "unreadable", reason: "Malformed JSON in Args field." };
    }
  } else if (options?.launcher) {
    const matches = findAnchorOccurrences(argsText, options.launcher);
    if (matches.length === 0) {
      return { status: "unreadable", reason: "Launcher anchor not found in non-JSON Args." };
    }
    if (matches.length > 1) {
      return { status: "unreadable", reason: "Repeated launcher anchor in Args." };
    }
    const match = matches[0];
    const beforeStr = argsText.slice(0, match.start);
    const afterStr = argsText.slice(match.end);
    const tokensBefore = parseSimpleTokens(beforeStr);
    if (tokensBefore === undefined) {
      return { status: "unreadable", reason: "Ambiguous quoting or tokens before launcher anchor." };
    }
    const tokensAfter = parseSimpleTokens(afterStr);
    if (tokensAfter === undefined) {
      return { status: "unreadable", reason: "Ambiguous quoting or tokens after launcher anchor." };
    }
    args = [...tokensBefore, match.token, ...tokensAfter];
  } else {
    const tokens = parseSimpleTokens(argsText);
    if (tokens === undefined) {
      return { status: "unreadable", reason: "Ambiguous quoting or tokens in Args." };
    }
    args = tokens;
  }

  const registration: McpRegistration = { command, args };
  return {
    status: "present",
    registration,
    fingerprint: registrationFingerprint(registration)
  };
}
