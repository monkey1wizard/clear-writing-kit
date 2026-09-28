const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");
const CORE = "skills/coding-agent-writing";
const entries = [
  ["rules/accuracy.md", `${CORE}/references/accuracy.md`, "Writing Rule", "Accuracy and clarity", "Preserve meaning, uncertainty, and scope while making answers clear.", "en-US", ["coding-agent", "web"], ["accuracy", "plain-language"]],
  ["rules/en-US.md", `${CORE}/references/en-US.md`, "Language Guide", "United States English", "Apply English writing guidance without losing conditions or uncertainty.", "en-US", ["coding-agent", "web"], ["en-US", "English"]],
  ["rules/zh-TW.md", `${CORE}/references/zh-TW.md`, "Language Guide", "臺灣繁體中文", "使用臺灣繁體中文撰寫清楚且保留完整意思的文字。", "zh-TW", ["coding-agent", "web"], ["zh-TW", "繁體中文", "臺灣"]],
  ["rules/ja-JP.md", `${CORE}/references/ja-JP.md`, "Language Guide", "日本語の文章規則", "文書には常体、会話には敬体を使い、意味を正確に伝える。", "ja-JP", ["coding-agent", "web"], ["ja-JP", "日本語", "常体", "敬体"]],
  ["checks/local-checks.md", `${CORE}/references/local-checks.md`, "Procedure", "Local writing checks", "Discover and run language and genre checks in a coding-agent workspace.", "en-US", ["coding-agent"], ["textlint", "checks"]],
  ["checks/zhtw-checks.md", `${CORE}/references/zhtw-checks.md`, "Procedure", "繁體中文工具檢查", "使用 zhtw-mcp 檢查臺灣用詞與翻譯腔，並如實處理工具限制。", "zh-TW", ["coding-agent"], ["zh-TW", "zhtw-mcp", "checks"]],
  ["usage/coding-agent-writing.md", `${CORE}/SKILL.md`, "Playbook", "Writing in coding agents", "Use local writing rules and available tools for coding-agent output.", "en-US", ["coding-agent"], ["skills", "coding-agent"]],
  ["usage/web-answer-writing.md", "scripts/templates/web-skill.md", "Playbook", "Writing in Web assistants", "Use bundled writing guidance in ChatGPT Web and Gemini Web sessions.", "en-US", ["web"], ["skills", "ChatGPT", "Gemini"]],
  ["usage/chatgpt.md", "web-instructions/chatgpt.md", "Account Instructions", "ChatGPT Custom Instructions", "Copy the generated instruction block into ChatGPT account preferences.", "en-US", ["web"], ["ChatGPT", "account-instructions"]],
  ["usage/gemini.md", "web-instructions/gemini.md", "Account Instructions", "Instructions for Gemini", "Copy the generated instruction block into Gemini account preferences.", "en-US", ["web"], ["Gemini", "account-instructions"]]
].map(([file, source, type, title, description, language, audience, tags]) => ({ file, source, type, title, description, language, audience, tags }));

function read(file) {
  return new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(file)).replace(/\r\n/g, "\n");
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error("Missing or unterminated YAML frontmatter");
  const data = yaml.load(match[1]);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Frontmatter must be a mapping");
  return { data, body: text.slice(match[0].length).trimStart() };
}

function markdownFiles(root, folder = "") {
  if (!fs.existsSync(path.join(root, folder))) return [];
  if (fs.lstatSync(path.join(root, folder)).isSymbolicLink()) throw new Error(`Symlinks are not supported: ${folder || root}`);
  return fs.readdirSync(path.join(root, folder), { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${relative}`);
    return entry.isDirectory() ? markdownFiles(root, relative) : entry.name.endsWith(".md") ? [relative] : [];
  }).sort();
}

function mapLinks(body, transform) {
  // The maintained sources use inline links. Leave code literals unchanged.
  let fence = null;
  return body.split("\n").map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return line;
    }
    if (marker) { fence = marker[1]; return line; }
    return line.replace(/(`+)[\s\S]*?\1|\[([^\]\n]+)\]\(([^)\s]+)\)/g, (original, code, label, href) => code ? original : transform(original, label, href));
  }).join("\n");
}

function links(body) {
  const found = [];
  mapLinks(body, (original, label, href) => { found.push(href); return original; });
  return found;
}

function render(root = ROOT) {
  const outputs = new Map();
  const mapping = new Map(entries.map(entry => [entry.source, entry.file]));
  const refs = entries.filter(entry => entry.source.startsWith(`${CORE}/references/`));
  for (const entry of refs) mapping.set(`scripts/templates/references/${path.posix.basename(entry.source)}`, entry.file);
  for (const entry of entries) {
    const sourceText = read(path.join(root, entry.source));
    let body = sourceText.startsWith("---\n") ? frontmatter(sourceText).body : sourceText;
    body = body.replace(/^<!-- (?:Generated by|Source SHA-256:)[^\n]*-->\n\n?/gm, "");
    body = mapLinks(body, (original, label, href) => {
      if (/^(?:[a-z]+:|#|\/)/i.test(href)) return original;
      const [target, anchor] = href.split("#");
      const sourceTarget = path.posix.normalize(path.posix.join(path.posix.dirname(entry.source), target));
      const mapped = mapping.get(sourceTarget);
      if (!mapped) throw new Error(`Unmapped link in ${entry.source}: ${href}`);
      const relative = path.posix.relative(path.posix.dirname(entry.file), mapped);
      return `[${label}](${relative}${anchor === undefined ? "" : "#" + anchor})`;
    });
    const metadata = {
      type: entry.type, title: entry.title, description: entry.description,
      tags: entry.tags, language: entry.language, audience: entry.audience,
      sources: [{ resource: `Clear Writing Kit repository file: ${entry.source}` }],
      generated: { by: "process:clear-writing-kit-okf" },
      source_path: entry.source,
      source_sha256: crypto.createHash("sha256").update(sourceText).digest("hex")
    };
    outputs.set(entry.file, `---\n${yaml.dump(metadata, { lineWidth: -1, noRefs: true })}---\n\n${body.trim()}\n`);
  }
  const groups = { rules: "Writing rules and languages", checks: "Coding-agent checks", usage: "Platform usage" };
  let index = '---\nokf_version: "0.2"\n---\n\n# Clear Writing Kit knowledge\n\n';
  index += "Read the usage guide for the current environment, then accuracy and the relevant language guide. Local check procedures apply to coding agents. These retrieval documents are not installable skill packages.\n";
  for (const [folder, title] of Object.entries(groups)) {
    let section = `# ${title}\n\n`;
    index += `\n## ${title}\n\n`;
    for (const entry of entries.filter(item => item.file.startsWith(folder + "/"))) {
      index += `- [${entry.title}](${entry.file}) - ${entry.description}\n`;
      section += `- [${entry.title}](${path.posix.basename(entry.file)}) - ${entry.description}\n`;
    }
    outputs.set(`${folder}/index.md`, section);
  }
  outputs.set("index.md", index);
  return outputs;
}

function validateFormat(root) {
  const errors = [];
  for (const file of markdownFiles(root)) {
    try {
      const text = read(path.join(root, file));
      const basename = path.posix.basename(file);
      if (basename === "index.md") {
        let body = text;
        if (text.startsWith("---\n")) {
          if (file !== "index.md") throw new Error("Only the bundle-root index may have frontmatter");
          const parsed = frontmatter(text);
          if (Object.keys(parsed.data).some(key => key !== "okf_version")) throw new Error("Index frontmatter may only declare okf_version");
          body = parsed.body;
        }
        if (!/^#+ /m.test(body)) throw new Error("Index needs a heading");
      } else if (basename === "log.md") {
        if (text.startsWith("---\n")) throw new Error("Log must not be a concept");
        const headings = [...text.matchAll(/^## (.+)$/gm)].map(match => match[1]);
        if (!headings.length || headings.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new Error("Log needs valid YYYY-MM-DD date headings");
        if (headings.some((date, i) => i > 0 && date > headings[i - 1])) throw new Error("Log must use newest-first date groups");
      } else {
        const { data } = frontmatter(text);
        if (typeof data.type !== "string" || !data.type.trim()) throw new Error("Concept needs a non-empty string type");
      }
    } catch (error) { errors.push(`${file}: ${error.message}`); }
  }
  return errors;
}

function check(root = ROOT) {
  const bundle = path.join(root, "knowledge");
  const outputs = render(root);
  const errors = validateFormat(bundle);
  const actual = markdownFiles(bundle);
  for (const file of actual) if (!outputs.has(file)) errors.push(`Unexpected generated file: ${file}`);
  for (const [file, expected] of outputs) {
    const target = path.join(bundle, file);
    if (!fs.existsSync(target)) errors.push(`Missing generated file: ${file}`);
    else if (read(target) !== expected) errors.push(`Stale generated file: ${file}`);
    for (const href of links(expected)) {
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      const destination = href.split("#")[0];
      const resolved = destination.startsWith("/") ? destination.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(file), destination));
      if (!outputs.has(resolved)) errors.push(`Broken publication link: ${file} -> ${href}`);
    }
  }
  return errors;
}

function generate(root = ROOT) {
  const outputs = render(root);
  const bundle = path.join(root, "knowledge");
  const extras = markdownFiles(bundle).filter(file => !outputs.has(file));
  if (extras.length) throw new Error(`Unexpected files, no files written: ${extras.join(", ")}`);
  for (const [file, text] of outputs) {
    const target = path.join(bundle, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text, "utf8");
  }
  return outputs.size;
}

module.exports = { ROOT, entries, render, read, frontmatter, links, validateFormat, check, generate };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !["--check", "--generate"].includes(args[0])) throw new Error("Usage: node okf.cjs --check | --generate");
    if (args[0] === "--generate") console.log(`Generated ${generate()} OKF files`);
    else {
      const errors = check();
      if (errors.length) throw new Error(errors.join("\n"));
      console.log("OKF format, source freshness, and publication links passed");
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
