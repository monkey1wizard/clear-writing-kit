const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const esbuild = require('esbuild');

let cachedInstaller = null;

function loadInstaller() {
  if (cachedInstaller) return cachedInstaller;
  const res = esbuild.buildSync({
    stdin: {
      contents: `
        export * from "./src/install/registration.ts";
        export * from "./src/install/plan.ts";
        export * from "./src/install/apply.ts";
        export * from "./src/install/verify.ts";
        export * from "./src/install/uninstall.ts";
        export * from "./src/install/manifest.ts";
        export * from "./src/install/spawn.ts";
        export * from "./src/hosts.ts";
      `,
      resolveDir: repoRoot
    },
    bundle: true,
    format: 'cjs',
    write: false,
    platform: 'node'
  });
  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', res.outputFiles[0].text);
  fn(m, m.exports, require, repoRoot, 'installer.cjs');
  cachedInstaller = m.exports;
  return cachedInstaller;
}

function createMockMcpServer(scriptPath, behavior = {}) {
  const code = `
const readline = require('node:readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

const behavior = ${JSON.stringify(behavior)};

rl.on('line', line => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    if (behavior.hang) {
      // Do not respond; let caller time out
      return;
    }
    if (req.method === 'initialize') {
      if (behavior.invalidInitialize) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: { serverInfo: { name: 'mock' } } // missing protocolVersion
        }) + '\\n');
        return;
      }
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'mock-mcp-server', version: '1.0.0' }
        }
      }) + '\\n');
    } else if (req.method === 'notifications/initialized') {
      // No response needed
    } else if (req.method === 'tools/list') {
      if (behavior.missingTool) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { tools: [] } }) + '\\n');
        return;
      }
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: [{ name: 'lintText', description: 'Lint text tool' }]
        }
      }) + '\\n');
    } else if (req.method === 'tools/call') {
      if (behavior.toolError) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: { isError: true, content: [{ type: 'text', text: 'Simulated tool error' }] }
        }) + '\\n');
        return;
      }
      if (behavior.emptyFindings) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: { structuredContent: { findings: [] } }
        }) + '\\n');
        return;
      }
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: req.id,
        result: {
          structuredContent: {
            findings: [{ ruleId: 'mock-rule', line: 1, column: 1, message: 'Test finding for ' + (req.params?.arguments?.language || 'unknown') }]
          }
        }
      }) + '\\n');
    }
  } catch (err) {
    // Ignore parse errors on input
  }
});
`;
  fs.writeFileSync(scriptPath, code);
}

function createFixtureHome(options = {}) {
  const prefix = options.spacePath ? 'cwk test space home ' : 'cwk-fixture-';
  const home = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const stubBinDir = path.join(home, 'stub-bin');
  fs.mkdirSync(stubBinDir, { recursive: true });

  const statePath = path.join(home, 'stub-state.json');
  const initialState = {
    plugin: options.pluginInstalled ?? true,
    mcp: options.mcp ?? null,
    ...(options.pluginByHost ? { pluginByHost: { ...options.pluginByHost } } : {}),
    ...(options.mcpByHost ? { mcpByHost: { ...options.mcpByHost } } : {}),
    mcpMode: options.mcpMode ?? null,
    claudeFormat: options.claudeFormat ?? 'json',
    mutationCalls: []
  };
  fs.writeFileSync(statePath, JSON.stringify(initialState));

  // Create stub script
  const stubScriptPath = path.join(stubBinDir, 'host-stub.cjs');
  const stubScript = `
const fs = require('node:fs');
const [host, family, verb, ...args] = process.argv.slice(2);
const stateFile = process.env.CWK_STUB_STATE_FILE;
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
if (!state.mutationCalls) state.mutationCalls = [];
const hostPlugin = () => state.pluginByHost ? Boolean(state.pluginByHost[host]) : Boolean(state.plugin);
const setHostPlugin = value => {
  if (state.pluginByHost) state.pluginByHost[host] = value;
  else state.plugin = value;
};
const hostMcp = () => state.mcpByHost ? state.mcpByHost[host] : state.mcp;
const setHostMcp = value => {
  if (state.mcpByHost) state.mcpByHost[host] = value;
  else if (value === undefined) delete state.mcp;
  else state.mcp = value;
};

if (family === 'plugin') {
  if (verb === 'list') {
    if (state.pluginListError) {
      process.stderr.write(state.pluginListError + '\\n');
      process.exit(1);
    }
    console.log(hostPlugin() ? 'clear-writing-kit' : '');
  } else if (verb === 'add' || verb === 'install') {
    state.mutationCalls.push({ host, family, verb, args });
    setHostPlugin(true);
  } else if (verb === 'remove' || verb === 'uninstall') {
    state.mutationCalls.push({ host, family, verb, args });
    setHostPlugin(false);
  }
} else if (family === 'mcp') {
  if (verb === 'get') {
    if (state.mcpMode === 'auth_error') {
      process.stderr.write('Error: 401 Unauthorized: token expired\\n');
      process.exit(1);
    }
    if (state.mcpMode === 'permission_denied') {
      process.stderr.write('Error: EACCES: permission denied\\n');
      process.exit(1);
    }
    if (state.mcpMode === 'timeout') {
      process.stderr.write('Error: ETIMEDOUT: connection timed out\\n');
      process.exit(1);
    }
    if (state.mcpMode === 'custom_error') {
      process.stderr.write((state.customErrorText || 'Host query failed') + '\\n');
      process.exit(1);
    }
    if (state.mcpMode === 'malformed_json') {
      console.log('{ invalid json output');
      process.exit(0);
    }
    if (state.mcpMode === 'unsupported_transport') {
      if (host === 'codex') {
        console.log(JSON.stringify({ name: 'clear-writing-kit-textlint', transport: { type: 'sse', url: 'http://localhost' } }));
      } else {
        console.log('Type: sse\\nCommand: node\\nArgs: []');
      }
      process.exit(0);
    }
    if (state.mcpMode === 'duplicate_fields') {
      console.log('Command: node\\nCommand: deno\\nArgs: []');
      process.exit(0);
    }
    if (state.mcpMode === 'ambiguous_quoting') {
      if (host === 'codex') {
        console.log(JSON.stringify({ command: '"no"de', args: [] }));
      } else {
        console.log('Command: "no"de\\nArgs: []');
      }
      process.exit(0);
    }
    const currentMcp = hostMcp();
    if (!currentMcp) {
      if (host === 'codex') {
        process.stderr.write('clear-writing-kit-textlint not found\\n');
      } else {
        process.stderr.write('No MCP server named clear-writing-kit-textlint found.\\n');
      }
      process.exit(1);
    }
    if (host === 'codex') {
      if (state.codexFormat === 'transport') {
        console.log(JSON.stringify({
          name: 'clear-writing-kit-textlint',
          transport: { type: 'stdio', command: currentMcp.command, args: currentMcp.args }
        }));
      } else {
        console.log(JSON.stringify({
          name: 'clear-writing-kit-textlint',
          command: currentMcp.command,
          args: currentMcp.args
        }));
      }
    } else {
      if (state.claudeFormat === 'simple_tokens') {
        console.log('Type: stdio\\nCommand: ' + currentMcp.command + '\\nArgs: ' + currentMcp.args.join(' '));
      } else if (state.claudeFormat === 'backtick_json') {
        console.log('Type: stdio\\nCommand: ' + currentMcp.command + '\\nArgs: \`' + JSON.stringify(currentMcp.args) + '\`');
      } else if (state.claudeFormat === 'bullet_points') {
        console.log('- Type: stdio\\n- Command: ' + currentMcp.command + '\\n- Args: ' + JSON.stringify(currentMcp.args));
      } else {
        console.log('Type: stdio\\nCommand: ' + currentMcp.command + '\\nArgs: ' + JSON.stringify(currentMcp.args));
      }
    }
  } else if (verb === 'add') {
    state.mutationCalls.push({ host, family, verb, args });
    const dashDash = args.indexOf('--');
    const cmdArgs = dashDash >= 0 ? args.slice(dashDash + 1) : args;
    setHostMcp({ command: cmdArgs[0], args: cmdArgs.slice(1) });
  } else if (verb === 'remove') {
    state.mutationCalls.push({ host, family, verb, args });
    if (Array.isArray(state.mcpRemoveErrorHosts) && state.mcpRemoveErrorHosts.includes(host)) {
      process.stderr.write('Simulated mcp remove failure\\n');
      fs.writeFileSync(stateFile, JSON.stringify(state));
      process.exit(1);
    }
    setHostMcp(undefined);
  }
}
fs.writeFileSync(stateFile, JSON.stringify(state));
`;
  fs.writeFileSync(stubScriptPath, stubScript);

  // Wrapper scripts
  fs.writeFileSync(path.join(stubBinDir, 'claude.cmd'), `@echo off\r\nnode "${stubScriptPath}" claude %*\r\n`);
  fs.writeFileSync(path.join(stubBinDir, 'codex.cmd'), `@echo off\r\nnode "${stubScriptPath}" codex %*\r\n`);
  // Shell scripts for bash/posix
  fs.writeFileSync(path.join(stubBinDir, 'claude'), `#!/bin/sh\nnode "${stubScriptPath}" claude "$@"\n`);
  fs.writeFileSync(path.join(stubBinDir, 'codex'), `#!/bin/sh\nnode "${stubScriptPath}" codex "$@"\n`);
  try {
    fs.chmodSync(path.join(stubBinDir, 'claude'), 0o755);
    fs.chmodSync(path.join(stubBinDir, 'codex'), 0o755);
  } catch {
    // Ignore on Windows
  }

  // Pre-seed instruction files and settings if requested
  const claudeConfigDir = path.join(home, '.claude');
  const codexConfigDir = path.join(home, '.codex');
  fs.mkdirSync(claudeConfigDir, { recursive: true });
  fs.mkdirSync(codexConfigDir, { recursive: true });

  const blockText = fs.readFileSync(path.join(repoRoot, 'install/agents-block.md'), 'utf8');
  if (options.seedBlock) {
    fs.writeFileSync(path.join(claudeConfigDir, 'CLAUDE.md'), blockText);
    fs.writeFileSync(path.join(codexConfigDir, 'AGENTS.md'), blockText);
  } else {
    fs.writeFileSync(path.join(claudeConfigDir, 'CLAUDE.md'), '# Claude Instructions\n');
    fs.writeFileSync(path.join(codexConfigDir, 'AGENTS.md'), '# Codex Instructions\n');
  }

  if (options.seedSettings !== false) {
    fs.writeFileSync(path.join(claudeConfigDir, 'settings.json'), JSON.stringify({ outputStyle: 'clear-writing-kit' }));
  }

  const env = { ...process.env };
  const inheritedPathKey = Object.keys(env).find(key => key.toLowerCase() === 'path');
  const inheritedPath = inheritedPathKey ? env[inheritedPathKey] : '';
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === 'path') delete env[key];
  }
  Object.assign(env, {
    PATH: `${stubBinDir}${path.delimiter}${inheritedPath}`,
    CWK_STUB_STATE_FILE: statePath,
    CLAUDECODE: '1',
    CODEX_SESSION_ID: 'test-session-123',
    CODEX_THREAD_ID: 'test-thread-456',
    USERPROFILE: home,
    HOME: home
  });

  const getState = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const setState = (updater) => {
    const cur = getState();
    const next = typeof updater === 'function' ? updater(cur) : { ...cur, ...updater };
    fs.writeFileSync(statePath, JSON.stringify(next));
  };
  const cleanup = () => {
    try {
      fs.rmSync(home, { recursive: true, force: true });
    } catch {
      // Best effort on Windows
    }
  };

  return { home, stubBinDir, statePath, env, blockText, getState, setState, cleanup };
}

function runCli(args, env = process.env, cwd = repoRoot) {
  const distEntry = path.join(repoRoot, 'dist/cwk.mjs');
  return cp.spawnSync(process.execPath, [distEntry, ...args], {
    env,
    cwd,
    encoding: 'utf8'
  });
}

module.exports = {
  repoRoot,
  loadInstaller,
  createMockMcpServer,
  createFixtureHome,
  runCli
};
