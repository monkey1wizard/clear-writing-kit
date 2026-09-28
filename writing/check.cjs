const path = require("node:path");
const { spawn } = require("node:child_process");
const { loadTextlintrc } = require("textlint");
async function main() {
  const args = process.argv.slice(2);
  function take(flag) {
    const i = args.indexOf(flag);
    if (i < 0 || !args[i + 1]) throw new Error("Required: " + flag);
    return args.splice(i, 2)[1];
  }
  const language = take("--language"), genre = take("--genre");
  if (!["en-US", "zh-TW", "ja-JP"].includes(language) || !["document", "conversation"].includes(genre)) throw new Error("Unknown language or genre");
  const config = path.join(__dirname, "profiles", language + "." + genre + ".json");
  const descriptor = await loadTextlintrc({ configFilePath: config });
  if (!descriptor.toKernelOptions().rules.length) throw new Error("Profile did not load any rules");
  if (args.some(a => /^(?:--config|--rule|--rulesdir|--no-textlintrc)(?:=|$)/.test(a) || /^-c/.test(a))) throw new Error("Profile overrides are not supported by this launcher");
  const child = spawn(process.execPath, [path.join(__dirname, "node_modules/textlint/bin/textlint.js"), "--config", config, ...args], { stdio: "inherit", cwd: process.cwd() });
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("error", e => { console.error(e); process.exitCode = 1; });
  child.on("exit", code => { process.exitCode = code ?? 1; });
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
