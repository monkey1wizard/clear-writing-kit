const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const SERVER_NAME = "clear-writing-kit-textlint";
const HOSTS = [
  { name: "claude", file: ".claude.json", property: "mcpServers" },
  { name: "codex", file: ".codex/config.toml", property: "mcp_servers" },
  { name: "copilot", file: ".copilot/mcp-config.json", property: "mcpServers" },
  { name: "agy", file: ".gemini/config/mcp_config.json", property: "mcpServers" },
  { name: "opencode", file: "AppData/Roaming/opencode/opencode.json", property: "mcp" },
];

function executable() {
  const value = process.env.CCYNC_BIN;
  assert.ok(value, "CCYNC_BIN must name an installed ccync executable");
  assert.ok(path.isAbsolute(value), "CCYNC_BIN must be an absolute path");
  assert.ok(fs.existsSync(value), `CCYNC_BIN does not exist: ${value}`);
  return value;
}

function isolatedEnv(home) {
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    APPDATA: path.join(home, "AppData", "Roaming"),
    LOCALAPPDATA: path.join(home, "AppData", "Local"),
    XDG_CONFIG_HOME: path.join(home, ".config"),
  };
}

function run(ccync, args, env) {
  const result = spawnSync(ccync, args, { cwd: ROOT, env, encoding: "utf8", timeout: 120000 });
  assert.equal(result.error, undefined, `${args.join(" ")} failed to start: ${result.error}`);
  return { status: result.status, output: result.stdout + result.stderr };
}

function snapshot(destination) {
  fs.cpSync(ROOT, destination, {
    recursive: true,
    filter(source) {
      const relative = path.relative(ROOT, source).split(path.sep).join("/");
      return !/(^|\/)(\.git|\.dev|node_modules|build|__pycache__|\.pytest_cache)(\/|$)/.test(relative);
    },
  });
  assert.ok(fs.existsSync(path.join(destination, "mcp.json")), "snapshot must contain the bare MCP manifest");
}

function parseHostVector(home, host) {
  const file = path.join(home, host.file);
  assert.ok(fs.existsSync(file), `${host.name} native MCP file was not created: ${file}`);
  const source = fs.readFileSync(file, "utf8");
  if (host.name === "codex") {
    const lines = source.split(/\r?\n/);
    const start = lines.indexOf(`[mcp_servers.${SERVER_NAME}]`);
    assert.notEqual(start, -1, "Codex config must contain the named MCP server table");
    const section = [];
    for (const line of lines.slice(start + 1)) {
      if (line.startsWith("[")) break;
      section.push(line);
    }
    const body = section.join("\n");
    const command = body.match(/^command\s*=\s*"([^"]+)"/m)?.[1];
    const argsLine = body.match(/^args\s*=\s*(\[[^\]]*\])/m)?.[1];
    const args = argsLine ? JSON.parse(argsLine) : [];
    return { command, args };
  }
  const document = JSON.parse(source);
  const vector = document[host.property]?.[SERVER_NAME];
  assert.ok(vector, `${host.name} config must select ${SERVER_NAME}`);
  return vector;
}

function assertResolvedVector(vector, home, hostName) {
  const rendered = JSON.stringify(vector).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  assert.match(rendered, /node(?:\.exe)?/i, `${hostName} must render the Node runtime`);
  assert.match(rendered, /mcp/, `${hostName} must render the MCP entry point`);
  assert.doesNotMatch(rendered, /\$\{PLUGIN_ROOT\}/i, `${hostName} must expand PLUGIN_ROOT`);
  const payloads = [...rendered.matchAll(/[^"\s]*\.ccync\/cache\/clear-writing-kit@[^"\s]*\/dist\/cwk\.mjs/gi)].map(match => match[0].replace(/^['"]|['"]$/g, ""));
  assert.equal(payloads.length, 1, `${hostName} must render exactly one cache payload path: ${rendered}`);
  const normalizedHome = home.replace(/\\/g, "/").replace(/\/{2,}/g, "/").toLowerCase();
  assert.ok(payloads[0].toLowerCase().startsWith(normalizedHome), `${hostName} payload must resolve under ${normalizedHome}: ${payloads[0]}`);
  assert.ok(fs.existsSync(payloads[0].replace(/\//g, path.sep)), `${hostName} resolved payload must exist`);
  return payloads[0].replace(/\//g, path.sep);
}

function createSnapshot(base) {
  const source = path.join(base, "clear-writing-kit");
  snapshot(source);
  return source;
}

function setup(ccync, home) {
  fs.mkdirSync(home, { recursive: true });
  const env = isolatedEnv(home);
  const initialized = run(ccync, ["init", "codex"], env);
  assert.equal(initialized.status, 0, initialized.output);
  const source = createSnapshot(path.dirname(home));
  return { env, source };
}

function seedForeign(home, host) {
  const file = path.join(home, host.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (host.name === "codex") {
    const bytes = `[mcp_servers.${SERVER_NAME}]\ncommand = "foreign-node"\nargs = ["keep", "these", "bytes"]\n`;
    fs.writeFileSync(file, bytes);
    return { file, bytes };
  }
  const document = host.name === "opencode" ? { mcp: {} } : { mcpServers: {} };
  document[host.property][SERVER_NAME] = { command: "foreign-node", args: ["keep", "these", "bytes"] };
  const bytes = JSON.stringify(document, null, 2) + "\n";
  fs.writeFileSync(file, bytes);
  return { file, bytes };
}

test("ccync projects local clear-writing-kit MCP", { timeout: 900000 }, () => {
  const ccync = executable();
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "cwk-ccync-success-"));
  try {
    const home = path.join(base, "home");
    const { env, source } = setup(ccync, home);
    const added = run(ccync, ["add", source, "--yes"], env);
    assert.equal(added.status, 0, added.output);
    const synced = run(ccync, ["sync", "--yes"], env);
    assert.equal(synced.status, 0, synced.output);
    const output = added.output + synced.output;
    assert.doesNotMatch(output, /unresolved|unreadable|collision/i);
    const payloads = HOSTS.map(host => assertResolvedVector(parseHostVector(home, host), home, host.name));
    assert.equal(new Set(payloads).size, 1, "all five hosts must use the same cache payload");
    const cacheRoot = path.dirname(path.dirname(payloads[0]));
    const selectedManifest = JSON.parse(fs.readFileSync(path.join(cacheRoot, "mcp.json"), "utf8"));
    assert.deepEqual(selectedManifest, {
      servers: {
        [SERVER_NAME]: { command: "node", args: ["${PLUGIN_ROOT}/dist/cwk.mjs", "mcp"] },
      },
    }, "ccync cache must contain the selected bare MCP manifest");
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }

  for (const host of HOSTS) {
    const collisionBase = fs.mkdtempSync(path.join(os.tmpdir(), `cwk-ccync-${host.name}-collision-`));
    try {
      const home = path.join(collisionBase, "home");
      const { env, source } = setup(ccync, home);
      const foreign = seedForeign(home, host);
      const before = fs.readFileSync(foreign.file);
      const added = run(ccync, ["add", source, "--no-sync", "--yes"], env);
      assert.equal(added.status, 0, added.output);
      const synced = run(ccync, ["sync", "--yes"], env);
      const output = added.output + synced.output;
      assert.match(output, /collision|conflict|foreign|unowned/i, `${host.name} renderer must report the collision: ${output}`);
      assert.deepEqual(fs.readFileSync(foreign.file), before, `${host.name} foreign registration bytes must remain unchanged`);
    } finally {
      fs.rmSync(collisionBase, { recursive: true, force: true });
    }
  }
});
