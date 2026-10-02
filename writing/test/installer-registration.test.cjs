const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const cp = require('node:child_process');

const {
  repoRoot,
  loadInstaller,
  createMockMcpServer,
  createFixtureHome,
  runCli
} = require('./installer-fixtures.cjs');

const installer = loadInstaller();

// ---------------------------------------------------------------------------
// Registration parsing & error classification
// ---------------------------------------------------------------------------

test('Claude registration reader parses valid stdio shapes (JSON, backticks, simple tokens, bullets)', async () => {
  const host = installer.hosts.find(h => h.id === 'claude');
  const launcher = 'C:/Users/test/.clear-writing-kit/cwk.mjs';

  // 1. JSON array format
  const fixture1 = createFixtureHome({
    mcp: { command: 'node', args: [launcher, 'mcp'] },
    claudeFormat: 'json'
  });
  const res1 = await installer.readRegistration(host, fixture1.env, { launcher });
  assert.equal(res1.status, 'present');
  assert.equal(res1.registration.command, 'node');
  assert.deepEqual(res1.registration.args, [launcher, 'mcp']);
  assert.equal(typeof res1.fingerprint, 'string');
  assert.equal(res1.fingerprint.length, 64);
  fixture1.cleanup();

  // 2. Backtick-wrapped JSON
  const fixture2 = createFixtureHome({
    mcp: { command: 'node', args: [launcher, 'mcp'] },
    claudeFormat: 'backtick_json'
  });
  const res2 = await installer.readRegistration(host, fixture2.env, { launcher });
  assert.equal(res2.status, 'present');
  assert.deepEqual(res2.registration.args, [launcher, 'mcp']);
  fixture2.cleanup();

  // 3. Bullet-point format
  const fixture3 = createFixtureHome({
    mcp: { command: 'node', args: [launcher, 'mcp'] },
    claudeFormat: 'bullet_points'
  });
  const res3 = await installer.readRegistration(host, fixture3.env, { launcher });
  assert.equal(res3.status, 'present');
  assert.deepEqual(res3.registration.args, [launcher, 'mcp']);
  fixture3.cleanup();

  // 4. Simple tokens with launcher anchor
  const fixture4 = createFixtureHome({
    mcp: { command: 'node', args: [launcher, 'mcp'] },
    claudeFormat: 'simple_tokens'
  });
  const res4 = await installer.readRegistration(host, fixture4.env, { launcher });
  assert.equal(res4.status, 'present');
  assert.deepEqual(res4.registration.args, [launcher, 'mcp']);
  fixture4.cleanup();
});

test('Claude registration reader rejects malformed, duplicate, ambiguous, and unsupported outputs', async () => {
  const host = installer.hosts.find(h => h.id === 'claude');
  const launcher = 'C:/test/cwk.mjs';

  // 1. Unsupported transport (SSE)
  const fTransport = createFixtureHome({ mcpMode: 'unsupported_transport' });
  const rTransport = await installer.readRegistration(host, fTransport.env, { launcher });
  assert.equal(rTransport.status, 'unreadable');
  assert.match(rTransport.reason, /unsupported transport/i);
  fTransport.cleanup();

  // 2. Duplicate fields
  const fDup = createFixtureHome({ mcpMode: 'duplicate_fields' });
  const rDup = await installer.readRegistration(host, fDup.env, { launcher });
  assert.equal(rDup.status, 'unreadable');
  assert.match(rDup.reason, /duplicate fields/i);
  fDup.cleanup();

  // 3. Ambiguous quoting in command
  const fQuote = createFixtureHome({ mcpMode: 'ambiguous_quoting' });
  const rQuote = await installer.readRegistration(host, fQuote.env, { launcher });
  assert.equal(rQuote.status, 'unreadable');
  assert.match(rQuote.reason, /ambiguous quoting/i);
  fQuote.cleanup();

  // 4. Non-JSON args without launcher anchor
  const fNoAnchor = createFixtureHome({
    mcp: { command: 'node', args: ['C:/other/script.js', 'mcp'] },
    claudeFormat: 'simple_tokens'
  });
  const rNoAnchor = await installer.readRegistration(host, fNoAnchor.env, { launcher });
  assert.equal(rNoAnchor.status, 'unreadable');
  assert.match(rNoAnchor.reason, /launcher anchor not found/i);
  fNoAnchor.cleanup();
});

test('Codex registration reader parses valid JSON and rejects malformed/unsupported transports', async () => {
  const host = installer.hosts.find(h => h.id === 'codex');
  const launcher = 'C:/test/cwk.mjs';

  // 1. Valid top-level command & args
  const f1 = createFixtureHome({
    mcp: { command: 'node', args: [launcher, 'mcp'] }
  });
  const r1 = await installer.readRegistration(host, f1.env);
  assert.equal(r1.status, 'present');
  assert.equal(r1.registration.command, 'node');
  assert.deepEqual(r1.registration.args, [launcher, 'mcp']);
  f1.cleanup();

  // 2. Valid transport wrapper
  const f2 = createFixtureHome({
    mcp: { command: 'node', args: [launcher, 'mcp'] }
  });
  f2.setState({ codexFormat: 'transport' });
  const r2 = await installer.readRegistration(host, f2.env);
  assert.equal(r2.status, 'present');
  assert.deepEqual(r2.registration.args, [launcher, 'mcp']);
  f2.cleanup();

  // 3. Malformed JSON
  const f3 = createFixtureHome({ mcpMode: 'malformed_json' });
  const r3 = await installer.readRegistration(host, f3.env);
  assert.equal(r3.status, 'unreadable');
  assert.match(r3.reason, /valid JSON/i);
  f3.cleanup();

  // 4. Unsupported transport (SSE)
  const f4 = createFixtureHome({ mcpMode: 'unsupported_transport' });
  const r4 = await installer.readRegistration(host, f4.env);
  assert.equal(r4.status, 'unreadable');
  assert.match(r4.reason, /unsupported transport/i);
  f4.cleanup();

  // 5. Ambiguous command quoting
  const f5 = createFixtureHome({ mcpMode: 'ambiguous_quoting' });
  const r5 = await installer.readRegistration(host, f5.env);
  assert.equal(r5.status, 'unreadable');
  assert.match(r5.reason, /ambiguous quoting/i);
  f5.cleanup();
});

test('Explicit absence is distinguished from auth, permission, and timeout failures', async () => {
  const claudeHost = installer.hosts.find(h => h.id === 'claude');
  const codexHost = installer.hosts.find(h => h.id === 'codex');

  // 1. Explicit absence (clean not found message bound to server name)
  const fAbsentClaude = createFixtureHome({ mcp: null });
  const rAbsentClaude = await installer.readRegistration(claudeHost, fAbsentClaude.env);
  assert.equal(rAbsentClaude.status, 'absent');
  fAbsentClaude.cleanup();

  const fAbsentCodex = createFixtureHome({ mcp: null });
  const rAbsentCodex = await installer.readRegistration(codexHost, fAbsentCodex.env);
  assert.equal(rAbsentCodex.status, 'absent');
  fAbsentCodex.cleanup();

  // Direct isRecognizedAbsent checks
  assert.equal(installer.isRecognizedAbsent('No MCP server named clear-writing-kit-textlint found', installer.MCP_NAME), true);
  assert.equal(installer.isRecognizedAbsent("Server 'clear-writing-kit-textlint' not found", installer.MCP_NAME), true);
  assert.equal(installer.isRecognizedAbsent('clear-writing-kit-textlint is not registered', installer.MCP_NAME), true);
  assert.equal(installer.isRecognizedAbsent('Unknown mcp server: clear-writing-kit-textlint', installer.MCP_NAME), true);

  // 2. Auth error (401 / unauthorized) must be unreadable, NOT absent
  const fAuth = createFixtureHome({ mcpMode: 'auth_error' });
  const rAuth = await installer.readRegistration(claudeHost, fAuth.env);
  assert.equal(rAuth.status, 'unreadable');
  assert.match(rAuth.reason, /exited with code 1/i);
  assert.equal(installer.isRecognizedAbsent('401 Unauthorized token expired clear-writing-kit-textlint', installer.MCP_NAME), false);
  fAuth.cleanup();

  // 3. Permission denied (EACCES / permission) must be unreadable, NOT absent
  const fPerm = createFixtureHome({ mcpMode: 'permission_denied' });
  const rPerm = await installer.readRegistration(claudeHost, fPerm.env);
  assert.equal(rPerm.status, 'unreadable');
  assert.equal(installer.isRecognizedAbsent('EACCES: permission denied for clear-writing-kit-textlint', installer.MCP_NAME), false);
  fPerm.cleanup();

  // 4. Timeout (ETIMEDOUT / timeout) must be unreadable, NOT absent
  const fTimeout = createFixtureHome({ mcpMode: 'timeout' });
  const rTimeout = await installer.readRegistration(claudeHost, fTimeout.env);
  assert.equal(rTimeout.status, 'unreadable');
  assert.equal(installer.isRecognizedAbsent('ETIMEDOUT: Connection timed out clear-writing-kit-textlint', installer.MCP_NAME), false);
  fTimeout.cleanup();

  // 5. Unrecognized error output must be unreadable, NOT absent
  const fCustom = createFixtureHome({ mcpMode: 'custom_error', customErrorText: 'Fatal host daemon crash' });
  const rCustom = await installer.readRegistration(claudeHost, fCustom.env);
  assert.equal(rCustom.status, 'unreadable');
  fCustom.cleanup();
});

test('Complete argument add/remove/reorder/change invalidates plan approval', async () => {
  const fixture = createFixtureHome({ seedBlock: true });
  const payloadDir = path.join(repoRoot, 'dist');
  const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');

  const baseContext = {
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    payloadDir,
    blockText: fixture.blockText
  };

  // Compute baseline plan with absent MCP entry
  const plan0 = await installer.computePlan(baseContext);
  assert.equal(plan0.status, 'ready');
  const hash0 = plan0.plan.hash;

  // 1. Baseline with standard args [launcher, "mcp"]
  fixture.setState({ mcp: { command: 'node', args: [launcher, 'mcp'] } });
  const planStandard = await installer.computePlan(baseContext);
  assert.equal(planStandard.status, 'ready');
  const hashStandard = planStandard.plan.hash;
  assert.notEqual(hashStandard, hash0);

  // 2. Argument added: [launcher, "mcp", "--extra"]
  fixture.setState({ mcp: { command: 'node', args: [launcher, 'mcp', '--extra'] } });
  const planAdded = await installer.computePlan(baseContext);
  assert.equal(planAdded.status, 'ready');
  assert.notEqual(planAdded.plan.hash, hashStandard, 'Added argument must change plan hash');

  // 3. Argument removed: [launcher]
  fixture.setState({ mcp: { command: 'node', args: [launcher] } });
  const planRemoved = await installer.computePlan(baseContext);
  assert.equal(planRemoved.status, 'ready');
  assert.notEqual(planRemoved.plan.hash, hashStandard, 'Removed argument must change plan hash');

  // 4. Argument reordered: ["mcp", launcher]
  fixture.setState({ mcp: { command: 'node', args: ['mcp', launcher] } });
  const planReordered = await installer.computePlan(baseContext);
  assert.equal(planReordered.status, 'ready');
  assert.notEqual(planReordered.plan.hash, hashStandard, 'Reordered argument must change plan hash');

  // 5. Argument changed: ["C:/other/cwk.mjs", "mcp"]
  fixture.setState({ mcp: { command: 'node', args: ['C:/other/cwk.mjs', 'mcp'] } });
  const planChanged = await installer.computePlan(baseContext);
  assert.equal(planChanged.status, 'ready');
  assert.notEqual(planChanged.plan.hash, hashStandard, 'Changed argument must change plan hash');

  fixture.cleanup();
});

test('Stale apply writes nothing to filesystem and executes zero CLI mutations', async () => {
  const fixture = createFixtureHome({ seedBlock: false });
  const payloadDir = path.join(repoRoot, 'dist');
  const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');

  const context = {
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    payloadDir,
    blockText: fixture.blockText
  };

  // Plan when entry is absent
  const planAbsent = await installer.computePlan(context);
  assert.equal(planAbsent.status, 'ready');
  const staleHash = planAbsent.plan.hash;

  // State shifts: an external actor registered an entry
  fixture.setState({
    mcp: { command: 'node', args: [launcher, 'mcp', '--drifted'] },
    mutationCalls: []
  });

  // Snapshot before stale apply
  const kitDir = path.join(fixture.home, '.clear-writing-kit');
  const claudeInstructions = path.join(fixture.home, '.claude', 'CLAUDE.md');
  const beforeText = fs.readFileSync(claudeInstructions, 'utf8');

  // Run apply with stale hash
  const applyResult = await installer.applyPlan(context, staleHash);
  assert.equal(applyResult.status, 'error');
  assert.equal(applyResult.kind, 'mismatch');
  assert.match(applyResult.message, /plan hash does not match/i);

  // Assert zero filesystem writes
  assert.equal(fs.existsSync(kitDir), false, 'Kit directory must not be created on stale apply');
  const afterText = fs.readFileSync(claudeInstructions, 'utf8');
  assert.equal(afterText, beforeText, 'Instructions file must remain untouched');

  // Assert zero CLI mutation calls (no plugin add, no mcp add)
  const state = fixture.getState();
  assert.deepEqual(state.mutationCalls, [], 'Zero host CLI mutation calls on stale apply');

  fixture.cleanup();
});

test('Uninstall removes exact matches and preserves changed or unreadable entries', async () => {
  const fixture = createFixtureHome({ seedBlock: true });
  const payloadDir = path.join(repoRoot, 'dist');
  const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');

  const context = {
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    payloadDir,
    blockText: fixture.blockText
  };

  // Step 1: Run valid plan and apply to establish manifest
  const plan = await installer.computePlan(context);
  assert.equal(plan.status, 'ready');
  const applied = await installer.applyPlan(context, plan.plan.hash);
  assert.equal(applied.status, 'applied');

  // Save the exact MCP registration recorded during apply
  const originalRegisteredMcp = fixture.getState().mcp;
  assert.ok(originalRegisteredMcp);

  // Capture registered fingerprint from manifest
  const manifest = (await installer.readManifest(fixture.home)).value;
  const mcpEntry = manifest.cli.find(e => e.kind === 'mcp');
  assert.ok(mcpEntry);

  // Case A: Changed arguments -> entry must be KEPT, not removed
  fixture.setState({
    mcp: { command: originalRegisteredMcp.command, args: [...originalRegisteredMcp.args, '--user-modified'] },
    mutationCalls: []
  });
  const uninstChanged = await installer.uninstall(context);
  assert.ok(uninstChanged.kept.some(k => k.target.includes('mcp') && k.detail.includes('does not match')));
  assert.ok(!uninstChanged.removed.some(r => r.target.includes('mcp')));
  let curState = fixture.getState();
  assert.ok(!curState.mutationCalls.some(c => c.verb === 'remove' && c.family === 'mcp'), 'No mcp remove on changed entry');

  // Case B: Unreadable state -> entry must be KEPT, not removed
  fixture.setState({
    mcpMode: 'unsupported_transport',
    mutationCalls: []
  });
  const uninstUnreadable = await installer.uninstall(context);
  assert.ok(uninstUnreadable.kept.some(k => k.target.includes('mcp') && k.detail.includes('could not be read safely')));
  curState = fixture.getState();
  assert.ok(!curState.mutationCalls.some(c => c.verb === 'remove' && c.family === 'mcp'), 'No mcp remove on unreadable entry');

  // Case C: Exact match -> entry is removed through host remove command
  fixture.setState({
    mcpMode: null,
    mcp: originalRegisteredMcp,
    mutationCalls: []
  });
  const uninstExact = await installer.uninstall(context);
  assert.ok(uninstExact.removed.some(r => r.target.includes('mcp') && r.detail.includes('Removed through')));
  curState = fixture.getState();
  assert.ok(curState.mutationCalls.some(c => c.verb === 'remove' && c.family === 'mcp'), 'mcp remove executed on exact match');

  fixture.cleanup();
});

test('Runtime preference changes do not authorize removal of unmatched entry', async () => {
  const fixture = createFixtureHome({ seedBlock: true });
  const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');

  const context = {
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    payloadDir: path.join(repoRoot, 'dist'),
    blockText: fixture.blockText
  };

  // Apply plan
  const plan = await installer.computePlan(context);
  const applied = await installer.applyPlan(context, plan.plan.hash);
  assert.equal(applied.status, 'applied');

  // User manually re-pointed host MCP entry to deno
  fixture.setState({
    mcp: { command: 'deno', args: ['run', '-A', launcher, 'mcp'] },
    mutationCalls: []
  });

  const uninst = await installer.uninstall(context);
  // Must be kept because actual host registration differs from manifest registration
  assert.ok(uninst.kept.some(k => k.target.includes('mcp') && k.detail.includes('does not match')));
  const state = fixture.getState();
  assert.ok(!state.mutationCalls.some(c => c.verb === 'remove' && c.family === 'mcp'));

  fixture.cleanup();
});

test('Formatted outputs omit secret sentinels', async () => {
  const sentinel = 'SECRET_TOKEN_SENTINEL_ABCD_999888';
  const fixture = createFixtureHome({ seedBlock: true });
  const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');

  // Plant sentinel in custom error text and settings
  fixture.setState({
    mcpMode: 'custom_error',
    customErrorText: `Host lookup failed with token ${sentinel}`
  });
  const settingsFile = path.join(fixture.home, '.claude', 'settings.json');
  fs.writeFileSync(settingsFile, JSON.stringify({
    outputStyle: 'clear-writing-kit',
    apiKey: sentinel
  }));

  const context = {
    agent: 'claude',
    env: { ...fixture.env, USER_SECRET: sentinel },
    home: fixture.home,
    payloadDir: path.join(repoRoot, 'dist'),
    blockText: fixture.blockText
  };

  const planOutcome = await installer.computePlan(context);
  const planText = installer.formatPlan(planOutcome);
  assert.equal(planText.includes(sentinel), false, 'formatPlan must never print secret sentinel');

  const verifyOutcome = await installer.verifyInstall({ ...context, callTimeoutMs: 2000 });
  const verifyText = installer.formatVerify(verifyOutcome);
  assert.equal(verifyText.includes(sentinel), false, 'formatVerify must never print secret sentinel');

  const uninstOutcome = await installer.uninstall(context);
  const uninstText = installer.formatUninstall(uninstOutcome);
  assert.equal(uninstText.includes(sentinel), false, 'formatUninstall must never print secret sentinel');

  fixture.cleanup();
});

// ---------------------------------------------------------------------------
// Shared verify reader & multi-language execution
// ---------------------------------------------------------------------------

test('Shared verify reader starts registered command and checks en-US, zh-TW, ja-JP', async () => {
  const fixture = createFixtureHome({ seedBlock: true });
  const mockServerScript = path.join(fixture.home, 'mock-server.cjs');
  createMockMcpServer(mockServerScript);

  // Set mock server as the registered MCP command
  fixture.setState({
    mcp: { command: process.execPath, args: [mockServerScript] }
  });

  const verifyOutcome = await installer.verifyInstall({
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    callTimeoutMs: 5000
  });

  assert.equal(verifyOutcome.status, 'pass');
  assert.ok(verifyOutcome.checks.some(c => c.id === 'mcp-initialize' && c.status === 'pass'));
  assert.ok(verifyOutcome.checks.some(c => c.id === 'mcp-tools' && c.status === 'pass'));
  assert.ok(verifyOutcome.checks.some(c => c.id === 'lint-en-US' && c.status === 'pass'));
  assert.ok(verifyOutcome.checks.some(c => c.id === 'lint-zh-TW' && c.status === 'pass'));
  assert.ok(verifyOutcome.checks.some(c => c.id === 'lint-ja-JP' && c.status === 'pass'));

  fixture.cleanup();
});

test('Verify fails and skips probe checks on unreadable or absent registration', async () => {
  const fixture = createFixtureHome({ seedBlock: true, mcpMode: 'unsupported_transport' });

  // 1. Unreadable registration
  const rUnreadable = await installer.verifyInstall({
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    callTimeoutMs: 2000
  });

  assert.equal(rUnreadable.status, 'incomplete');
  const regCheck = rUnreadable.checks.find(c => c.id === 'mcp-registration');
  assert.ok(regCheck && regCheck.status === 'fail');
  assert.match(regCheck.detail, /could not be read/i);
  // Ensure no guessed command was executed; all server checks were skipped rather than run
  const serverIds = ['mcp-initialize', 'mcp-tools', 'lint-en-US', 'lint-zh-TW', 'lint-ja-JP'];
  assert.ok(serverIds.every(id => rUnreadable.checks.some(c => c.id === id && c.status === 'skipped')));
  assert.ok(!serverIds.some(id => rUnreadable.checks.some(c => c.id === id && c.status === 'pass')));

  // 2. Absent registration
  fixture.setState({ mcpMode: null, mcp: null });
  const rAbsent = await installer.verifyInstall({
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    callTimeoutMs: 2000
  });
  assert.equal(rAbsent.status, 'incomplete');
  const regCheckAbsent = rAbsent.checks.find(c => c.id === 'mcp-registration');
  assert.ok(regCheckAbsent && regCheckAbsent.status === 'fail');
  assert.match(regCheckAbsent.detail, /not registered/i);

  fixture.cleanup();
});

test('Space-containing homes and launcher paths are correctly parsed and verified', async () => {
  const fixture = createFixtureHome({ spacePath: true, seedBlock: true });
  assert.ok(fixture.home.includes(' '), 'Fixture home must contain a space');

  const mockServerScript = path.join(fixture.home, 'mock server with space.cjs');
  createMockMcpServer(mockServerScript);

  fixture.setState({
    mcp: { command: process.execPath, args: [mockServerScript] }
  });

  const verifyOutcome = await installer.verifyInstall({
    agent: 'claude',
    env: fixture.env,
    home: fixture.home,
    callTimeoutMs: 5000
  });

  assert.equal(verifyOutcome.status, 'pass');
  assert.ok(verifyOutcome.checks.every(c => c.status === 'pass'));

  fixture.cleanup();
});

// ---------------------------------------------------------------------------
// Failure states for verify
// ---------------------------------------------------------------------------

test('Verify returns incomplete on missing dictionary, reset outputStyle, legacy conflict, and timeout', async () => {
  const fixture = createFixtureHome({ seedBlock: true });
  const mockServerScript = path.join(fixture.home, 'mock-server.cjs');
  createMockMcpServer(mockServerScript);
  fixture.setState({ mcp: { command: process.execPath, args: [mockServerScript] } });

  // 1. Output style reset
  const settingsPath = path.join(fixture.home, '.claude', 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify({ outputStyle: 'custom-style' }));
  const resStyle = await installer.verifyInstall({ agent: 'claude', env: fixture.env, home: fixture.home, callTimeoutMs: 2000 });
  assert.equal(resStyle.status, 'incomplete');
  assert.ok(resStyle.checks.some(c => c.id === 'output-style' && c.status === 'fail'));

  // Restore outputStyle
  fs.writeFileSync(settingsPath, JSON.stringify({ outputStyle: 'clear-writing-kit' }));

  // 2. Legacy writing skill exists
  const legacyDir = path.join(fixture.home, '.agents', 'skills', 'accurate-answer');
  fs.mkdirSync(legacyDir, { recursive: true });
  const resLegacy = await installer.verifyInstall({ agent: 'claude', env: fixture.env, home: fixture.home, callTimeoutMs: 2000 });
  assert.equal(resLegacy.status, 'incomplete');
  assert.ok(resLegacy.conflicts.some(c => c.kind === 'skill'));
  fs.rmSync(legacyDir, { recursive: true, force: true });

  // 3. MCP server hang / timeout
  const hangScript = path.join(fixture.home, 'hang-server.cjs');
  createMockMcpServer(hangScript, { hang: true });
  fixture.setState({ mcp: { command: process.execPath, args: [hangScript] } });
  const resHang = await installer.verifyInstall({ agent: 'claude', env: fixture.env, home: fixture.home, callTimeoutMs: 1000 });
  assert.equal(resHang.status, 'incomplete');
  assert.ok(resHang.checks.some(c => c.id === 'mcp-initialize' && c.status === 'fail'));

  fixture.cleanup();
});

// ---------------------------------------------------------------------------
// install --help across runtimes
// ---------------------------------------------------------------------------

test('install --help lists subcommands across runtimes', () => {
  const distEntry = path.join(repoRoot, 'dist/cwk.mjs');

  // Node execution
  const nodeRes = cp.spawnSync(process.execPath, [distEntry, 'install', '--help'], { encoding: 'utf8' });
  assert.equal(nodeRes.status, 0);
  assert.match(nodeRes.stdout, /\bplan\b/);
  assert.match(nodeRes.stdout, /\bapply\b/);
  assert.match(nodeRes.stdout, /\bverify\b/);
  assert.match(nodeRes.stdout, /\buninstall\b/);

  // Deno execution
  const denoWhich = cp.spawnSync('where.exe', ['deno'], { encoding: 'utf8' });
  if (denoWhich.status === 0 && denoWhich.stdout.trim()) {
    const denoRes = cp.spawnSync('deno', ['run', '-A', distEntry, 'install', '--help'], { encoding: 'utf8' });
    assert.equal(denoRes.status, 0);
    assert.match(denoRes.stdout, /\bplan\b/);
    assert.match(denoRes.stdout, /\bapply\b/);
    assert.match(denoRes.stdout, /\bverify\b/);
    assert.match(denoRes.stdout, /\buninstall\b/);
  }

  // Bun execution
  const bunWhich = cp.spawnSync('where.exe', ['bun'], { encoding: 'utf8' });
  if (bunWhich.status === 0 && bunWhich.stdout.trim()) {
    const bunRes = cp.spawnSync('bun', [distEntry, 'install', '--help'], { encoding: 'utf8' });
    assert.equal(bunRes.status, 0);
    assert.match(bunRes.stdout, /\bplan\b/);
    assert.match(bunRes.stdout, /\bapply\b/);
    assert.match(bunRes.stdout, /\bverify\b/);
    assert.match(bunRes.stdout, /\buninstall\b/);
  }
});

// ---------------------------------------------------------------------------
// Exit code contracts across subcommands
// ---------------------------------------------------------------------------

test('Subcommand exit codes for plan, apply, verify, and uninstall', () => {
  const fixture = createFixtureHome({ seedBlock: true });

  // Missing --agent flag exits non-zero (1)
  const noAgentRes = runCli(['install', 'plan'], fixture.env);
  assert.equal(noAgentRes.status, 1);

  // Unknown subcommand exits 2
  const unknownSub = runCli(['install', 'invalid-subcommand'], fixture.env);
  assert.equal(unknownSub.status, 2);

  // Unknown flag exits 2
  const unknownFlag = runCli(['install', 'plan', '--agent', 'claude', '--bogus-flag'], fixture.env);
  assert.equal(unknownFlag.status, 2);

  // Apply without --plan-hash exits 2
  const applyNoHash = runCli(['install', 'apply', '--agent', 'claude'], fixture.env);
  assert.equal(applyNoHash.status, 2);

  // Host mismatch exits 1
  const mismatchEnv = { ...fixture.env, CLAUDECODE: undefined, CODEX_SESSION_ID: undefined };
  const mismatchRes = runCli(['install', 'plan', '--agent', 'claude'], mismatchEnv);
  assert.equal(mismatchRes.status, 1);

  fixture.cleanup();
});

// ---------------------------------------------------------------------------
// Build parity
// ---------------------------------------------------------------------------

test('Fresh build produces zero diff against committed dist/', async () => {
  const npmBin = installer.which('npm', process.env);
  assert.ok(npmBin, 'npm must be found on PATH');
  const buildRes = await installer.run(npmBin, ['--prefix', 'writing', 'run', 'build'], {
    cwd: repoRoot
  });
  assert.equal(buildRes.code, 0, `Build failed: ${buildRes.stderr}`);

  const gitBin = installer.which('git', process.env) || 'git';
  const diffRes = await installer.run(gitBin, ['status', '--porcelain', 'dist/'], {
    cwd: repoRoot
  });
  assert.equal(diffRes.code, 0);
  assert.equal(diffRes.stdout.trim(), '', 'Fresh build must produce 0 diff in dist/');
});
