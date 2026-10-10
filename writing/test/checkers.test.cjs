const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const { createLinter, loadTextlintrc } = require("textlint");
const { readmeSections } = require("../lint-docs.cjs");
const cwd = path.resolve(__dirname, "..");
const config = (l, g) => path.join(cwd, "profiles", l + "." + g + ".json");
async function lint(l, g, text) {
  const descriptor = await loadTextlintrc({ configFilePath: config(l, g) });
  assert.ok(descriptor.toKernelOptions().rules.length >= 2, "rules must be loaded");
  return createLinter({ descriptor }).lintText(text, "sample.md");
}
for (const l of ["en-US", "zh-TW", "ja-JP"]) {
  for (const g of ["document", "conversation"]) {
    test(l + " " + g + " finds bad punctuation and protects code", async () => {
      assert.ok((await lint(l, g, "alpha; beta")).messages.some(m => m.ruleId === "prose-punctuation"));
      assert.ok((await lint(l, g, "a\u200Bb")).messages.some(m => m.ruleId.includes("zero-width")));
      const protectedText = "`tool --value ';' --count 5`\n\n```js\nconst value = 2;\n```\n\n> Quoted; literal.\n";
      assert.ok(!(await lint(l, g, protectedText)).messages.some(m => m.ruleId === "prose-punctuation"));
    });
  }
}
test("Japanese documents require plain body text, not polite text", async () => {
  for (const text of ["本ツールは3つの言語に対応する。", "対象は開発者である。", "テストはまだ実行していない。", "変更は完了した。", "処理が失敗した場合は、ログを確認する。", "設定ファイルを開く。\n\n- 対応言語\n- 利用条件\n"]) {
    assert.equal((await lint("ja-JP", "document", text)).messages.length, 0, text);
  }
  for (const text of ["本ツールは3つの言語に対応します。", "対象は開発者です。", "テストはまだ実行していません。", "変更は完了しました。", "設定ファイルを開いてください。", "結果を説明します。\n\n- テストを実行\n"]) {
    assert.ok((await lint("ja-JP", "document", text)).messages.some(m => m.ruleId.includes("no-mix") || m.ruleId === "ja-document-style"), text);
  }
});

test("Japanese conversations retain polite body text", async () => {
  const polite = "結果を説明します。\n\n- テストを実行します。\n";
  assert.equal((await lint("ja-JP", "conversation", polite)).messages.length, 0);
  assert.ok((await lint("ja-JP", "conversation", "対象は開発者である。")).messages.some(m => m.ruleId.includes("no-mix")));
});

test("Japanese document headings and lists use plain forms", async () => {
  assert.equal((await lint("ja-JP", "document", "# 設定方法\n\n## 設定を変更する\n\n- 設定ファイルを開く。\n- 保存する。\n")).messages.length, 0);
  assert.ok((await lint("ja-JP", "document", "# 設定を変更します\n")).messages.some(m => m.ruleId.includes("no-mix")));
  assert.ok((await lint("ja-JP", "document", "結果を説明する。\n\n- テストを実行します。\n")).messages.some(m => m.ruleId.includes("no-mix")));
});

test("Japanese document style preserves literal code and quotations", async () => {
  const text = "引用は変更しない。\n\n> 設定を変更してください。\n\n`設定を変更してください。`\n\n```text\n設定を変更してください。\n```\n\n原文は「テストは実行していません。」である。\n";
  assert.equal((await lint("ja-JP", "document", text)).messages.length, 0);
});

test("Japanese supplemental endings are limited to documents", async () => {
  for (const text of ["処理は完了していません。", "設定を保存しませんでした。", "変更は完了しました。", "変更は未検証でした。", "処理は失敗するでしょう。", "設定を確認しましょう。", "ログを確認してください。"]) {
    assert.ok((await lint("ja-JP", "document", text)).messages.some(m => m.ruleId === "ja-document-style"), text);
    assert.ok(!(await lint("ja-JP", "conversation", text)).messages.some(m => m.ruleId === "ja-document-style"), text);
  }
  assert.ok(!(await lint("zh-TW", "document", "引用原文：設定を確認してください。")).messages.some(m => m.ruleId === "ja-document-style"));
  assert.ok(!(await lint("en-US", "document", "設定を確認してください。")).messages.some(m => m.ruleId === "ja-document-style"));
});

test("Japanese documents reject da-form endings without fixes", async () => {
  const daForm = m => m.ruleId === "ja-document-style" && m.message.includes("である");
  for (const text of ["本ツールは開発者向けだ。", "結果は変わるだろう。", "原因は設定だった。", "これは仕様なのだ。", "状態はこのままだ。"]) {
    const original = Buffer.from(text, "utf8");
    const findings = (await lint("ja-JP", "document", text)).messages.filter(daForm);
    assert.ok(findings.length > 0, text);
    for (const finding of findings) assert.equal(finding.fix, undefined, text);
    assert.ok(Buffer.from(text, "utf8").equals(original), text);
  }
  const passing = [
    "本ツールは開発者向けである。", "結果は変わるであろう。", "原因は設定であった。", "設定を変更した。", "テストはまだ。", "ただ。",
    "> 本ツールは開発者向けだ。\n", "[本ツールは開発者向けだ。](https://example.com/)\n", "![本ツールは開発者向けだ。](image.png)\n",
    "`本ツールは開発者向けだ。`\n", "```text\n本ツールは開発者向けだ。\n```\n", "原文は「本ツールは開発者向けだ。」である。", "原文は『結果は変わるだろう。』である。"
  ];
  for (const text of passing) {
    assert.ok(!(await lint("ja-JP", "document", text)).messages.some(daForm), text);
  }
  for (const text of ["本ツールは開発者向けだ。", "結果は変わるだろう。", "原因は設定だった。"]) {
    assert.ok(!(await lint("ja-JP", "conversation", text)).messages.some(m => m.ruleId === "ja-document-style"), text);
    assert.ok(!(await lint("en-US", "document", text)).messages.some(m => m.ruleId === "ja-document-style"), text);
    assert.ok(!(await lint("zh-TW", "document", text)).messages.some(m => m.ruleId === "ja-document-style"), text);
  }
});

test("Japanese report-style documentation contract", () => {
  const root = path.dirname(cwd);
  const read = file => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
  const message = "Use the である form in Japanese documents instead of だ, だろう, or だった. Preserve uncertainty and tense.";
  const rule = read("writing/rules/ja-document-style/index.cjs");
  const guide = read("skills/coding-agent-writing/references/ja-JP.md");
  const checks = read("docs/writing-checks.md");
  assert.ok(rule.includes(message));
  for (const phrase of [
    "説明文書を報告書型の文書として扱い、本文を常体のである体で統一する。",
    "文末に「だ」「だろう」「だった」を使わない。",
    "日本語の文書全般に対する規則ではない。",
    "一般の利用者に向けた取扱説明書では、通常は敬体を使う。",
    "会話の本文と箇条書きには、敬体を使う。",
    "会話の中で文書を作成する場合は、その文書部分に説明文書の規則を適用する。",
    "利用者やプロジェクトが別の文体を指定した場合は、その指定に従う。",
    "コード、識別子、コマンド、パス、URL、引用、エラーメッセージ、製品名は、そのまま維持する。",
    "常体を「である」の形で書く規則は、`[Bunka2022]` のⅢ－１ ウ（建議 p.(7)、解説 p.30）に基づく。",
    "文末に「だ」「だろう」「だった」を使わないことと、この規則を本プロジェクトの文書に限ることは、このプロジェクトの判断である。"
  ]) assert.ok(guide.includes(phrase), phrase);
  for (const phrase of [
    message,
    "| ja-document-style | ja-JP documents only |",
    "The rule applies to documents that this project writes. This rule does not cover all Japanese text. Consumer-facing manuals generally use polite forms. Conversation prose uses polite forms. An explicit user or project style takes priority. Quotations, code, and product names stay unchanged.",
    "It skips a sentence that ends with the whole word `まだ` or `ただ`.",
    "Reporting every sentence-final だ form is a project choice.",
    "`[Bunka2022]`"
  ]) assert.ok(checks.includes(phrase), phrase);
  assert.match(read("docs/references.md"), /^- `\[Bunka2022\]` 文化審議会\. \(2022\)\. \*\[公用文作成の考え方（建議）\]\(https:\/\/www\.bunka\.go\.jp\/seisaku\/bunkashingikai\/kokugo\/hokoku\/pdf\/93651301_01\.pdf\)\*/m);
});

test("Japanese document headings omit final periods", async () => {
  assert.ok((await lint("ja-JP", "document", "# 設定方法。\n")).messages.some(m => m.ruleId === "ja-document-style"));
  assert.equal((await lint("ja-JP", "document", "# 設定方法\n")).messages.length, 0);
});

test("Japanese README and both packaged guides use document style", async () => {
  const root = path.dirname(cwd);
  const readme = readmeSections(fs.readFileSync(path.join(root, "README.md"), "utf8")).find(s => s.language === "ja-JP").text;
  const files = ["skills/coding-agent-writing/references/ja-JP.md", "web-skills/web-answer-writing/references/ja-JP.md"];
  for (const text of [readme, ...files.map(file => fs.readFileSync(path.join(root, file), "utf8"))]) {
    assert.equal((await lint("ja-JP", "document", text)).messages.length, 0);
  }
});
test("Chinese is not checked as Japanese", async () => {
  const text = "這是一份臺灣繁體中文的說明文件。";
  assert.equal((await lint("zh-TW", "document", text)).messages.length, 0);
  assert.ok((await lint("ja-JP", "document", text)).messages.length > 0);
});
test("English preserves uncertainty and warns about wordiness", async () => {
  assert.equal((await lint("en-US", "document", "If the token expires, the request may fail.")).messages.length, 0);
  assert.ok((await lint("en-US", "document", "Run the test in order to check the result.")).messages.some(m => m.ruleId === "write-good"));
});
test("README language selection rejects missing sections", () => {
  assert.throws(() => readmeSections("# README\nEnglish"), /three/);
  assert.throws(() => readmeSections("## English\n## English\n## 日本語\n"), /distinct/);
  const s = readmeSections("## English\nHello.\n## 繁體中文\n說明。\n## 日本語\n説明する。\n");
  assert.deepEqual(s.map(x => x.language), ["en-US", "zh-TW", "ja-JP"]);
  assert.ok(!s[0].text.includes("說明"));
});
test("unknown profiles fail instead of returning a clean report", () => {
  const result = spawnSync(process.execPath, ["check.cjs", "--language", "unknown", "--genre", "document", "--stdin", "--stdin-filename", "x.md"], { cwd, encoding: "utf8", input: "OK." });
  assert.notEqual(result.status, 0);
});
test("generated profile files match their source", () => {
  assert.equal(spawnSync(process.execPath, ["generate-profiles.cjs", "--check"], { cwd }).status, 0);
});

test("CLI file paths remain relative to the caller", () => {
  const result = spawnSync(process.execPath, ["writing/check.cjs", "--language", "en-US", "--genre", "document", "skills/coding-agent-writing/SKILL.md", "--format", "json"], { cwd: path.dirname(cwd), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout)[0].filePath.endsWith("SKILL.md"));
});

test("CLI cannot silently override the selected profile", () => {
  for (const flag of ["--config=absent.json", "--config", "-cabsent.json", "--rulesdir=unknown"]) {
    const result = spawnSync(process.execPath, ["check.cjs", "--language", "en-US", "--genre", "document", flag], { cwd, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /overrides/);
  }
});

function mcp(language, genre) {
  return mcpClient(["node_modules/textlint/bin/textlint.js", "--config", config(language, genre), "--mcp"]);
}
function mcpClient(args) {
  const child = spawn(process.execPath, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
  let buffer = "", next = 0, stderr = "";
  const pending = new Map();
  child.stderr.on("data", b => { stderr += b; });
  child.stdout.on("data", b => {
    buffer += b;
    while (buffer.includes("\n")) {
      const i = buffer.indexOf("\n"), line = buffer.slice(0, i); buffer = buffer.slice(i + 1);
      let message; try { message = JSON.parse(line); } catch { continue; }
      const p = pending.get(message.id);
      if (p) { clearTimeout(p.timer); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); }
    }
  });
  child.on("exit", () => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error("MCP exited: " + stderr)); } pending.clear(); });
  function request(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error("MCP timeout: " + stderr)); }, 20000);
      pending.set(id, { resolve, reject, timer });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }
  return { child, request };
}
async function initializeMcp(server) {
  await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "writing-check-test", version: "1" } });
  server.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
}
for (const language of ["en-US", "zh-TW", "ja-JP"]) {
  for (const genre of ["document", "conversation"]) {
    test(language + " " + genre + " CLI and official MCP agree", { timeout: 30000 }, async () => {
      const text = language === "ja-JP" ? "結果を説明します。\n\n- テストを実行します。\n\n処理は完了していません。\n" : "alpha; beta";
      const cli = spawnSync(process.execPath, ["check.cjs", "--language", language, "--genre", genre, "--stdin", "--stdin-filename", "sample.md", "--format", "json"], { cwd, encoding: "utf8", input: text });
      const expected = JSON.parse(cli.stdout)[0].messages;
      const server = mcp(language, genre);
      try {
        await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "writing-check-test", version: "1" } });
        server.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
        const response = await server.request("tools/call", { name: "lintText", arguments: { text, stdinFilename: "sample.md" } });
        assert.ok(!response.isError);
        const actual = response.structuredContent ?? JSON.parse(response.content[0].text);
        assert.deepEqual(actual.messages, expected);
        const missing = await server.request("tools/call", { name: "lintFile", arguments: { filePaths: [path.join(cwd, "absent-file.md")] } });
        assert.equal(missing.isError, true);
      } finally { server.child.kill(); }
    });
  }
}

test("bundled Japanese report style CLI and MCP agree", { timeout: 60000 }, async () => {
  const bundle = path.join(path.dirname(cwd), "dist", "cwk.mjs");
  const text = "本ツールは開発者向けだ。\n";
  const server = mcpClient([bundle, "mcp"]);
  try {
    await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "writing-check-test", version: "1" } });
    server.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    for (const genre of ["document", "conversation"]) {
      const cli = spawnSync(process.execPath, [bundle, "check", "--language", "ja-JP", "--genre", genre, "--stdin", "--stdin-filename", "sample.md"], { cwd, encoding: "utf8", input: text });
      const response = await server.request("tools/call", { name: "lintText", arguments: { text, language: "ja-JP", genre, filename: "sample.md" } });
      assert.ok(!response.isError, genre);
      const findings = (response.structuredContent ?? { findings: JSON.parse(response.content[0].text) }).findings;
      if (genre === "document") {
        assert.notEqual(cli.status, 0, cli.stderr);
        assert.match(cli.stdout, /ja-document-style/);
        assert.ok(findings.length > 0);
        assert.ok(findings.some(f => f.ruleId === "ja-document-style"));
      } else {
        assert.equal(cli.status, 0, cli.stderr + cli.stdout);
        assert.doesNotMatch(cli.stdout, /ja-document-style/);
        assert.deepEqual(findings, []);
      }
    }
  } finally { server.child.kill(); }
});

test("bundled MCP contract", { timeout: 60000 }, async () => {
  const bundle = path.join(path.dirname(cwd), "dist", "cwk.mjs");
  const server = mcpClient([bundle, "mcp"]);
  try {
    await initializeMcp(server);
    const result = await server.request("tools/list", {});
    assert.deepEqual(result.tools.map(tool => tool.name), ["lintText"]);
  } finally { server.child.kill(); }
});

test("bundled MCP language probes", { timeout: 60000 }, async () => {
  const bundle = path.join(path.dirname(cwd), "dist", "cwk.mjs");
  const server = mcpClient([bundle, "mcp"]);
  try {
    await initializeMcp(server);
    const probes = [
      { language: "en-US", text: "alpha; beta", ruleId: "prose-punctuation" },
      { language: "zh-TW", text: "alpha; beta", ruleId: "prose-punctuation" },
      { language: "ja-JP", text: "処理は完了していません。", ruleId: "ja-document-style" },
    ];
    for (const probe of probes) {
      const response = await server.request("tools/call", {
        name: "lintText",
        arguments: { text: probe.text, language: probe.language, genre: "document", filename: "sample.md" },
      });
      assert.ok(!response.isError, probe.language);
      assert.ok(Array.isArray(response.structuredContent?.findings), probe.language);
      assert.ok(response.structuredContent.findings.length > 0, probe.language);
      assert.ok(response.structuredContent.findings.some(finding => finding.ruleId === probe.ruleId), probe.language);
    }
  } finally { server.child.kill(); }
});
