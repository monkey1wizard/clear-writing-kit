import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { delimiter, extname, isAbsolute, join, resolve } from "node:path";

export type Env = Record<string, string | undefined>;
export type RunOptions = { env?: Env; cwd?: string; input?: string; timeoutMs?: number };
export type RunResult = { code: number; stdout: string; stderr: string };

const isWindows = () => process.platform === "win32";

function envValue(env: Env, name: string) {
  if (!isWindows()) return env[name];
  const key = Object.keys(env).find(candidate => candidate.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : env[key];
}

function isFile(path: string) {
  try {
    const stats = statSync(path);
    return stats.isFile() && (isWindows() || (stats.mode & 0o111) !== 0);
  } catch {
    return false;
  }
}

/** Finds an executable the way the shell does. On Windows it tries each PATHEXT extension. Returns an absolute path or undefined. */
export function which(name: string, env: Env = process.env): string | undefined {
  const extensions = isWindows()
    ? (envValue(env, "PATHEXT") ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean).map(extension => extension.toLowerCase())
    : [""];
  const hasExecutableExtension = isWindows() && extensions.includes(extname(name).toLowerCase());
  const names = hasExecutableExtension || !isWindows() ? [name] : extensions.map(extension => name + extension);
  const directories = /[\\/]/.test(name)
    ? [""]
    : (envValue(env, "PATH") ?? "").split(delimiter).map(directory => directory.replace(/^"|"$/g, "")).filter(Boolean);
  for (const directory of directories) {
    for (const candidate of names) {
      const path = directory ? join(directory, candidate) : candidate;
      if (isFile(path)) return isAbsolute(path) ? path : resolve(path);
    }
  }
  return undefined;
}

/** Quotes one argument for a cmd.exe command line. Returns undefined when cmd.exe cannot carry it unchanged. */
function quoteForCmd(argument: string) {
  if (/["%\r\n\0]/.test(argument)) return undefined;
  return `"${argument.replace(/(\\+)$/, "$1$1")}"`;
}

/** Runs a program and collects its output. A .cmd or .bat file goes through cmd.exe, every other file runs directly. */
export function run(command: string, args: readonly string[], options: RunOptions = {}): Promise<RunResult> {
  return new Promise(resolvePromise => {
    const viaCmd = isWindows() && /\.(cmd|bat)$/i.test(command);
    let file = command;
    let spawnArgs: string[] = [...args];
    if (viaCmd) {
      const quoted = [command, ...args].map(quoteForCmd);
      if (quoted.includes(undefined)) {
        resolvePromise({ code: -1, stdout: "", stderr: "An argument contains a character that cmd.exe cannot carry unchanged." });
        return;
      }
      file = envValue(options.env ?? process.env, "ComSpec") ?? "cmd.exe";
      spawnArgs = ["/d", "/s", "/c", `"${quoted.join(" ")}"`];
    }
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(result);
    };
    const child = spawn(file, spawnArgs, {
      cwd: options.cwd,
      env: options.env as NodeJS.ProcessEnv | undefined,
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: viaCmd
    });
    const timer = setTimeout(() => {
      child.kill();
      finish({ code: -1, stdout, stderr: `${stderr}Timed out after ${options.timeoutMs ?? 30000} ms.` });
    }, options.timeoutMs ?? 30000);
    child.stdout?.setEncoding("utf8").on("data", chunk => { stdout += chunk; });
    child.stderr?.setEncoding("utf8").on("data", chunk => { stderr += chunk; });
    child.on("error", error => finish({ code: -1, stdout, stderr: error.message }));
    child.on("close", code => finish({ code: code ?? -1, stdout, stderr }));
    if (options.input !== undefined) child.stdin?.on("error", () => {}).end(options.input);
  });
}
