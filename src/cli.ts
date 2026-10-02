#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lintText } from "./check.js";
import { computePlan, formatPlan } from "./install/plan.js";
import { runMcpServer } from "./mcp.js";

const installUsage = [
  "Usage: cwk install <plan|apply|verify|uninstall> --agent <claude|codex|copilot|opencode|antigravity>",
  "",
  "  plan       Show what the installer would change and print a plan hash. Writes nothing.",
  "  apply      Apply a plan. Requires --plan-hash from a plan run.",
  "  verify     Check an installation.",
  "  uninstall  Remove what the installer installed.",
  ""
].join("\n");

async function runInstall(args: string[]): Promise<number> {
  const subcommand = args.shift();
  if (subcommand === "--help" || subcommand === "-h" || (subcommand !== undefined && args.includes("--help"))) {
    process.stdout.write(installUsage);
    return 0;
  }
  if (subcommand === "apply" || subcommand === "verify" || subcommand === "uninstall") {
    process.stderr.write(`"cwk install ${subcommand}" is not available in this build.\n`);
    return 2;
  }
  if (subcommand !== "plan") {
    process.stderr.write(installUsage);
    return 2;
  }
  const flag = args.indexOf("--agent");
  const agent = flag >= 0 ? args[flag + 1] : undefined;
  const extra = args.filter((_, index) => index !== flag && index !== flag + 1);
  if (extra.length) {
    process.stderr.write(`Unknown argument: ${extra[0]}\n${installUsage}`);
    return 2;
  }
  const payloadDir = dirname(fileURLToPath(import.meta.url));
  let blockText: string;
  try {
    blockText = await readFile(join(payloadDir, "..", "install", "agents-block.md"), "utf8");
  } catch {
    process.stderr.write("Cannot read install/agents-block.md next to the payload. Run the installer from the repository checkout.\n");
    return 1;
  }
  const outcome = await computePlan({ agent, env: process.env, home: homedir(), payloadDir, blockText });
  process.stdout.write(formatPlan(outcome));
  return outcome.status === "ready" ? 0 : 1;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (command === "mcp") {
    if (args.length) throw new Error("Usage: cwk mcp");
    await runMcpServer();
    return;
  }
  if (command === "install") {
    process.exitCode = await runInstall(args);
    return;
  }
  if (command !== "check") throw new Error("Usage: cwk check --language <language> --genre <genre> [--stdin [--stdin-filename <name>] | files...]");
  if (args.some(a => ["--config", "--rule", "--rulesdir", "--no-textlintrc", "-c"].includes(a) || a.startsWith("-c") || a.startsWith("--config=") || a.startsWith("--rule=") || a.startsWith("--rulesdir="))) throw new Error("Profile overrides are not supported by this launcher");
  function take(flag: string) { const i = args.indexOf(flag); if (i < 0 || !args[i + 1]) throw new Error(`Required: ${flag}`); return args.splice(i, 2)[1]; }
  const language = take("--language"), genre = take("--genre");
  const stdin = args.includes("--stdin");
  if (stdin) args.splice(args.indexOf("--stdin"), 1);
  let stdinFilename = "input.md";
  if (args.includes("--stdin-filename")) stdinFilename = take("--stdin-filename");
  if (stdin && args.length) throw new Error("Use either --stdin or file paths");
  if (stdin) {
    const text = await new Promise<string>((resolve, reject) => { let data = ""; process.stdin.setEncoding("utf8").on("data", chunk => data += chunk).on("end", () => resolve(data)).on("error", reject); });
    const { result, output } = await lintText({ text, language, genre, filename: stdinFilename });
    if (output) process.stdout.write(output);
    process.exitCode = result.messages.some(message => message.severity === 2) ? 1 : 0;
    return;
  }
  if (!args.length) throw new Error("Provide --stdin or at least one file path");
  const texts = await Promise.all(args.map(async filename => ({ filename, text: await readFile(filename, "utf8") })));
  let failed = false;
  for (const item of texts) {
    const { result, output } = await lintText({ ...item, language, genre });
    if (output) process.stdout.write(output);
    if (result.messages.some(message => message.severity === 2)) failed = true;
  }
  process.exitCode = failed ? 1 : 0;
}
main().catch(error => { console.error(error.message); process.exitCode = 2; });
