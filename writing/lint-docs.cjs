const fs = require("node:fs");
const path = require("node:path");
const { createLinter, loadTextlintrc } = require("textlint");
const root = path.resolve(__dirname, "..");

function readmeSections(text) {
  const starts = [...text.matchAll(/^## (English|繁體中文|日本語)$/gm)];
  if (starts.length !== 3 || new Set(starts.map(m => m[1])).size !== 3) throw new Error("README must have exactly three distinct language sections");
  const languages = { English: "en-US", 繁體中文: "zh-TW", 日本語: "ja-JP" };
  return starts.map((m, i) => ({
    language: languages[m[1]], text: text.slice(m.index, starts[i + 1]?.index ?? text.length),
    lineOffset: text.slice(0, m.index).split("\n").length - 1
  }));
}
function filesUnder(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(e => {
    const file = path.join(folder, e.name);
    return e.isDirectory() ? filesUnder(file) : /\.(md|txt)$/.test(file) ? [file] : [];
  });
}
async function main() {
  const targets = [];
  const readme = path.join(root, "README.md");
  for (const section of readmeSections(fs.readFileSync(readme, "utf8"))) targets.push({ file: readme, ...section });
  for (const folder of ["skills", "web-skills", "web-instructions", "knowledge", "docs", "scripts/templates", "writing/rules"]) {
    const base = path.join(root, folder);
    if (!fs.existsSync(base)) continue;
    for (const file of filesUnder(base)) {
      const language = /(?:zh-TW|zhtw-checks)\.md$/.test(file) ? "zh-TW" : /ja-JP\.md$/.test(file) ? "ja-JP" : "en-US";
      const text = fs.readFileSync(file, "utf8");
      const block = /(?:web-instructions|knowledge[\\/]usage)/.test(file) ? text.match(/```text\n([\s\S]*?)\n```/) : null;
      // Generated indexes mix locales. Check each non-English entry with its own profile.
      if (folder === "knowledge" && path.basename(file) === "index.md") {
        text.split("\n").forEach((line, lineOffset) => {
          const locale = /\]\([^)]*ja-JP\.md\)/.test(line) ? "ja-JP" : /\]\([^)]*(?:zh-TW|zhtw-checks)\.md\)/.test(line) ? "zh-TW" : null;
          if (locale) targets.push({ file, language: locale, text: line, lineOffset });
        });
      }
      targets.push({ file, language, text, lineOffset: 0 });
      if (block) targets.push({ file, language, text: block[1], lineOffset: text.slice(0, block.index + "```text\n".length).split("\n").length - 1 });
    }
  }
  let errors = 0, warnings = 0;
  const linters = {};
  for (const target of targets) {
    if (!linters[target.language]) {
      const descriptor = await loadTextlintrc({ configFilePath: path.join(__dirname, "profiles", target.language + ".document.json") });
      if (!descriptor.toKernelOptions().rules.length) throw new Error("No rules loaded for " + target.language);
      linters[target.language] = createLinter({ descriptor });
    }
    const result = await linters[target.language].lintText(target.text, target.file + ".md");
    for (const msg of result.messages) {
      if (msg.severity === 2) errors++; else warnings++;
      console.log(path.relative(root, target.file) + ":" + (msg.line + target.lineOffset) + ":" + msg.column + " " + msg.ruleId + " " + msg.message);
    }
  }
  console.log("Checked " + targets.length + " text sections: " + errors + " errors, " + warnings + " warnings");
  process.exitCode = errors ? 1 : 0;
}
module.exports = { readmeSections };
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
