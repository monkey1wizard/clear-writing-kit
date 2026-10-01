#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { lintText } from "./check.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();
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
