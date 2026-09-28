const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const okf = require("../okf.cjs");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "clear-writing-kit-okf-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const entry of okf.entries) {
    const target = path.join(root, entry.source);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(okf.ROOT, entry.source), target);
  }
  return root;
}

test("published bundle is fresh, conformant, and deterministic", () => {
  assert.deepEqual(okf.check(), []);
  assert.deepEqual(okf.render(), okf.render());
  assert.equal(okf.render().size, 14);
  for (const entry of okf.entries) {
    const { data } = okf.frontmatter(okf.render().get(entry.file));
    assert.equal(data.source_path, entry.source);
    assert.match(data.source_sha256, /^[a-f0-9]{64}$/);
    assert.ok(data.type && data.title && data.description);
    assert.equal(data.language, entry.language);
    assert.deepEqual(data.audience, entry.audience);
    assert.equal(data.verified, undefined);
    assert.equal(data.generated.at, undefined);
    assert.equal(data.generated.by, "process:clear-writing-kit-okf");
  }
});

test("all canonical rule bodies survive, with only local links rewritten", () => {
  const normalize = text => text.replace(/\]\([^)]+\)/g, "](<target>)").trim();
  for (const entry of okf.entries.filter(entry => /^(rules|checks)\//.test(entry.file))) {
    const actual = okf.frontmatter(okf.render().get(entry.file)).body;
    assert.equal(normalize(actual), normalize(okf.read(path.join(okf.ROOT, entry.source))));
  }
  const web = okf.frontmatter(okf.render().get("usage/web-answer-writing.md")).body;
  assert.match(web, /\.\.\/rules\/ja-JP\.md/);
  assert.doesNotMatch(web, /\.\.\/checks\//);
  const coding = okf.frontmatter(okf.render().get("usage/coding-agent-writing.md")).body;
  assert.match(coding, /\.\.\/checks\/zhtw-checks\.md/);
});

test("platform copy blocks remain byte-identical", () => {
  for (const platform of ["chatgpt", "gemini"]) {
    const source = okf.read(path.join(okf.ROOT, `web-instructions/${platform}.md`));
    const output = okf.render().get(`usage/${platform}.md`);
    assert.equal(output.match(/```text\n([\s\S]*?)```/)[1], source.match(/```text\n([\s\S]*?)```/)[1]);
  }
});

test("missing and stale outputs fail without modifying files", t => {
  const root = fixture(t);
  assert.ok(okf.check(root).some(error => error.includes("Missing")));
  okf.generate(root);
  assert.deepEqual(okf.check(root), []);
  const file = path.join(root, "knowledge/rules/en-US.md");
  fs.appendFileSync(file, "\nStale\n");
  const before = fs.readFileSync(file);
  assert.ok(okf.check(root).some(error => error.includes("Stale")));
  assert.deepEqual(fs.readFileSync(file), before);
});

test("source changes invalidate output and regenerate without loss", t => {
  const root = fixture(t);
  okf.generate(root);
  fs.appendFileSync(path.join(root, "skills/coding-agent-writing/references/en-US.md"), "\nKeep this condition.\n");
  assert.ok(okf.check(root).some(error => error.includes("rules/en-US.md")));
  okf.generate(root);
  assert.deepEqual(okf.check(root), []);
  assert.match(okf.read(path.join(root, "knowledge/rules/en-US.md")), /Keep this condition/);
});

test("CRLF checkout does not create false freshness failures", t => {
  const root = fixture(t);
  okf.generate(root);
  for (const entry of okf.entries) {
    const file = path.join(root, entry.source);
    fs.writeFileSync(file, okf.read(file).replace(/\n/g, "\r\n"));
  }
  for (const file of okf.render(root).keys()) {
    const target = path.join(root, "knowledge", file);
    fs.writeFileSync(target, okf.read(target).replace(/\n/g, "\r\n"));
  }
  assert.deepEqual(okf.check(root), []);
});

test("unexpected files stop generation before overwriting or deleting", t => {
  const root = fixture(t);
  okf.generate(root);
  const extra = path.join(root, "knowledge/owner-notes.md");
  fs.writeFileSync(extra, "Owner notes\n");
  const index = path.join(root, "knowledge/index.md");
  fs.writeFileSync(index, "Keep this change\n");
  assert.throws(() => okf.generate(root), /Unexpected files/);
  assert.equal(fs.readFileSync(index, "utf8"), "Keep this change\n");
  assert.equal(fs.readFileSync(extra, "utf8"), "Owner notes\n");
  assert.ok(okf.check(root).some(error => error.includes("Unexpected")));
});

test("minimal and unknown concepts, extension fields, and broken links are legal OKF", t => {
  const root = fixture(t);
  const bundle = path.join(root, "minimal");
  fs.mkdirSync(bundle);
  fs.writeFileSync(path.join(bundle, "minimal.md"), "---\ntype: Future Concept\ncustom_key: true\n---\n# Title\n\n[Future](missing.md)\n");
  assert.deepEqual(okf.validateFormat(bundle), []);
  fs.writeFileSync(path.join(bundle, "minimal.md"), "---\ntype: Reference\nverified: { by: 'human:example', at: '2026-09-29T00:00:00Z' }\n---\n# Title\n");
  assert.deepEqual(okf.validateFormat(bundle), []);
});

test("missing, empty, malformed, and non-string concept types fail", t => {
  const root = fixture(t);
  const bundle = path.join(root, "invalid");
  fs.mkdirSync(bundle);
  for (const text of ["# No metadata\n", "---\ntitle: No type\n---\n", "---\ntype: ''\n---\n", "---\ntype: 4\n---\n", "---\ntype: [broken\n---\n", "---\n- Reference\n---\n"]) {
    fs.writeFileSync(path.join(bundle, "bad.md"), text);
    assert.equal(okf.validateFormat(bundle).length, 1, text);
  }
  fs.writeFileSync(path.join(bundle, "bad.md"), Buffer.from([0xff]));
  assert.equal(okf.validateFormat(bundle).length, 1);
});

test("reserved indexes and logs follow their distinct structures", t => {
  const root = fixture(t);
  const bundle = path.join(root, "reserved");
  fs.mkdirSync(path.join(bundle, "child"), { recursive: true });
  fs.writeFileSync(path.join(bundle, "index.md"), '---\nokf_version: "0.2"\n---\n# Index\n');
  fs.writeFileSync(path.join(bundle, "child/index.md"), "# Child\n");
  fs.writeFileSync(path.join(bundle, "log.md"), "# Log\n\n## 2026-09-29\n\n- Created.\n\n## 2026-09-28\n\n- Started.\n");
  assert.deepEqual(okf.validateFormat(bundle), []);
  fs.writeFileSync(path.join(bundle, "child/index.md"), '---\nokf_version: "0.2"\n---\n# Child\n');
  assert.equal(okf.validateFormat(bundle).length, 1);
  fs.writeFileSync(path.join(bundle, "index.md"), "---\ntype: Reference\n---\n# Index\n");
  assert.equal(okf.validateFormat(bundle).length, 2);
  fs.writeFileSync(path.join(bundle, "log.md"), "# Log\n\n## 2026-02-30\n");
  assert.equal(okf.validateFormat(bundle).length, 3);
});

test("unmapped source links fail before publishing a broken projection", t => {
  const root = fixture(t);
  fs.appendFileSync(path.join(root, "skills/coding-agent-writing/references/en-US.md"), "\n[Missing](unmapped.md)\n");
  assert.throws(() => okf.render(root), /Unmapped link/);
});

test("protected link examples are not rewritten or treated as graph edges", t => {
  const root = fixture(t);
  const examples = '\n`[Example](missing.md)`\n\n````markdown\n```text\n[Example](missing.md)\n```\n````\n\n~~~markdown\n[Example](missing.md)\n~~~\n';
  fs.appendFileSync(path.join(root, "skills/coding-agent-writing/references/en-US.md"), examples);
  const result = okf.render(root).get("rules/en-US.md");
  assert.ok(result.endsWith(examples));
  assert.deepEqual(okf.links(examples), []);
});

test("bundle is portable and its index reaches every concept without repository files", t => {
  const root = fixture(t);
  const standalone = path.join(root, "export");
  fs.cpSync(path.join(okf.ROOT, "knowledge"), standalone, { recursive: true });
  assert.deepEqual(okf.validateFormat(standalone), []);
  const indexTargets = new Set(okf.links(okf.read(path.join(standalone, "index.md"))));
  for (const entry of okf.entries) {
    assert.ok(indexTargets.has(entry.file), entry.file);
    const body = okf.frontmatter(okf.read(path.join(standalone, entry.file))).body;
    for (const href of okf.links(body)) {
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      assert.ok(fs.existsSync(path.resolve(standalone, path.dirname(entry.file), href)), href);
    }
  }
});

test("CLI validates by default only with an explicit operation", () => {
  const cli = path.join(okf.ROOT, "writing/okf.cjs");
  assert.equal(spawnSync(process.execPath, [cli, "--check"], { cwd: os.tmpdir() }).status, 0);
  assert.equal(spawnSync(process.execPath, [cli]).status, 1);
  assert.equal(spawnSync(process.execPath, [cli, "--generate", "--check"]).status, 1);
});
