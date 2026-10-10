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

  // Each live vector is recorded as installer-owned, so the plan stays applicable and its hash must track the complete vector.
  const ownedPlan = async args => {
    const registration = { command: 'node', args };
    fixture.setState({ mcp: registration });
    await installer.saveManifest(fixture.home, {
      ...installer.emptyManifest(),
      cli: [{ host: 'claude', kind: 'mcp', name: installer.MCP_NAME, fingerprint: installer.registrationFingerprint(registration) }]
    });
    const outcome = await installer.computePlan(baseContext);
    assert.equal(outcome.status, 'ready');
    assert.equal(outcome.plan.mcpOwnership.status, 'owned-stale');
    return outcome.plan.hash;
  };

  // 1. Baseline with standard args [launcher, "mcp"]
  const hashStandard = await ownedPlan([launcher, 'mcp']);
  assert.notEqual(hashStandard, hash0);

  // 2. Argument added: [launcher, "mcp", "--extra"]
  assert.notEqual(await ownedPlan([launcher, 'mcp', '--extra']), hashStandard, 'Added argument must change plan hash');
  // 3. Argument removed: [launcher]
  assert.notEqual(await ownedPlan([launcher]), hashStandard, 'Removed argument must change plan hash');
  // 4. Argument reordered: ["mcp", launcher]
  assert.notEqual(await ownedPlan(['mcp', launcher]), hashStandard, 'Reordered argument must change plan hash');
  // 5. Argument changed: ["C:/other/cwk.mjs", "mcp"]
  assert.notEqual(await ownedPlan(['C:/other/cwk.mjs', 'mcp']), hashStandard, 'Changed argument must change plan hash');

  // Without a manifest entry the same live vector is unowned and the plan has no applicable hash.
  fs.rmSync(installer.manifestPath(fixture.home), { force: true });
  const unowned = await installer.computePlan(baseContext);
  assert.equal(unowned.status, 'blocked');
  assert.equal(unowned.plan.hash, null);

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

test('Verify returns incomplete on missing dictionary, reset outputStyle, and timeout', async () => {
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
  assert.ok(resStyle.conflicts.some(c => c.kind === 'output-style'));
  assert.ok(!resStyle.checks.some(c => c.id === 'legacy-conflicts'));

  // Restore outputStyle
  fs.writeFileSync(settingsPath, JSON.stringify({ outputStyle: 'clear-writing-kit' }));

  // 2. MCP server hang / timeout
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

// ---------------------------------------------------------------------------
// One-owner MCP mutation safety
// ---------------------------------------------------------------------------

const MCP = installer.MCP_NAME;
const FOREIGN_VECTOR = { command: 'node', args: ['C:/foreign/owner/server.js', 'mcp'] };
const CCYNC_VECTOR = { command: 'node', args: ['C:/Users/fixture/.ccync/cache/clear-writing-kit/0123abcd/dist/cwk.mjs', 'mcp'] };

function ownershipContext(fixture, agent = 'claude', extra = {}) {
  return { agent, env: fixture.env, home: fixture.home, payloadDir: path.join(repoRoot, 'dist'), blockText: fixture.blockText, ...extra };
}

function mcpCounts(fixture) {
  const calls = fixture.getState().mutationCalls.filter(call => call.family === 'mcp');
  return { remove: calls.filter(call => call.verb === 'remove').length, add: calls.filter(call => call.verb === 'add').length };
}

function resetCalls(fixture) {
  fixture.setState(state => ({ ...state, mutationCalls: [] }));
}

function liveMcp(fixture, host) {
  const state = fixture.getState();
  return state.mcpByHost ? state.mcpByHost[host] : state.mcp;
}

function setLiveMcp(fixture, host, value) {
  fixture.setState(state => (state.mcpByHost ? { ...state, mcpByHost: { ...state.mcpByHost, [host]: value } } : { ...state, mcp: value }));
}

function registrationVector(registration) {
  return [registration.command, ...registration.args];
}

function manifestBytes(home) {
  const file = installer.manifestPath(home);
  return fs.existsSync(file) ? fs.readFileSync(file) : undefined;
}

function manifestMcpEntry(home, host) {
  const file = installer.manifestPath(home);
  if (!fs.existsSync(file)) return undefined;
  return JSON.parse(fs.readFileSync(file, 'utf8')).cli.find(entry => entry.host === host && entry.kind === 'mcp' && entry.name === MCP);
}

async function recordOwnedEntry(home, host, registration) {
  const current = await installer.readManifest(home);
  assert.equal(current.ok, true);
  const manifest = current.value;
  manifest.cli = manifest.cli.filter(entry => !(entry.host === host && entry.kind === 'mcp' && entry.name === MCP));
  manifest.cli.push({ host, kind: 'mcp', name: MCP, fingerprint: installer.registrationFingerprint(registration) });
  await installer.saveManifest(home, manifest);
}

function plannedVector(plan, home) {
  return [plan.runtime.command, ...plan.runtime.args, path.join(home, '.clear-writing-kit', 'cwk.mjs'), 'mcp'];
}

async function planAndApply(ctx, options) {
  const planned = await installer.computePlan(ctx);
  assert.equal(planned.status, 'ready');
  const applied = await installer.applyPlan(ctx, planned.plan.hash, options);
  return { planned, applied };
}

/** Sets up an owned-stale registration: live and manifest agree on an older vector, and the planned vector differs. */
async function seedOwnedStale(fixture, host = 'claude') {
  const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');
  const previous = { command: 'node', args: [launcher, 'mcp', '--previous-release'] };
  setLiveMcp(fixture, host, previous);
  await recordOwnedEntry(fixture.home, host, previous);
  resetCalls(fixture);
  return previous;
}

test('installer MCP safe transitions: absent, owned-missing, owned-current, owned-stale', async t => {
  const fixture = createFixtureHome({ seedBlock: true });
  try {
    const ctx = ownershipContext(fixture);
    const observed = [];
    const step = async (expectedStatus, expectedAction, expectedCounts) => {
      resetCalls(fixture);
      const planned = await installer.computePlan(ctx);
      assert.equal(planned.status, 'ready', `${expectedStatus} must be applicable`);
      assert.equal(typeof planned.plan.hash, 'string');
      assert.equal(planned.plan.mcpOwnership.status, expectedStatus);
      assert.equal(planned.plan.steps.find(item => item.id === 'mcp').action, expectedAction);
      assert.ok(!planned.plan.conflicts.some(conflict => conflict.blocking));
      const rereads = [];
      const applied = await installer.applyPlan(ctx, planned.plan.hash, { onOwnershipReread: evidence => rereads.push(evidence) });
      assert.equal(applied.status, 'applied');
      const counts = mcpCounts(fixture);
      assert.deepEqual(counts, expectedCounts, `${expectedStatus} remove/add counts`);
      assert.deepEqual(registrationVector(liveMcp(fixture, 'claude')), plannedVector(planned.plan, fixture.home));
      assert.equal(manifestMcpEntry(fixture.home, 'claude').fingerprint, installer.registrationFingerprint(liveMcp(fixture, 'claude')));
      // A mutation runs only after one unchanged ownership reread. A no-op step has nothing to reread for.
      assert.equal(rereads.length, expectedAction === 'none' ? 0 : 1);
      for (const evidence of rereads) assert.equal(evidence.manifestUnchanged, true);
      observed.push({ state: expectedStatus, action: expectedAction, ...counts });
    };

    await step('absent', 'create', { remove: 0, add: 1 });
    setLiveMcp(fixture, 'claude', null);
    await step('owned-missing', 'create', { remove: 0, add: 1 });
    await step('owned-current', 'none', { remove: 0, add: 0 });
    await seedOwnedStale(fixture);
    await step('owned-stale', 'update', { remove: 1, add: 1 });
    t.diagnostic(`transitions ${JSON.stringify(observed)}`);
  } finally {
    fixture.cleanup();
  }
});

test('installer MCP ownership conflicts: unowned, unreadable, drifted, ccync-first', async t => {
  const cases = [
    {
      name: 'unowned',
      agent: 'claude',
      status: 'unowned',
      setup: async fixture => {
        const before = await installer.computePlan(ownershipContext(fixture));
        setLiveMcp(fixture, 'claude', FOREIGN_VECTOR);
        return before.plan.hash;
      }
    },
    {
      name: 'unreadable',
      agent: 'claude',
      status: 'unreadable',
      setup: async fixture => {
        const { planned, applied } = await planAndApply(ownershipContext(fixture));
        assert.equal(applied.status, 'applied');
        fixture.setState({ mcpMode: 'unsupported_transport' });
        return planned.plan.hash;
      }
    },
    {
      name: 'drifted',
      agent: 'claude',
      status: 'drifted',
      setup: async fixture => {
        const { planned, applied } = await planAndApply(ownershipContext(fixture));
        assert.equal(applied.status, 'applied');
        const live = liveMcp(fixture, 'claude');
        setLiveMcp(fixture, 'claude', { command: live.command, args: [...live.args, '--edited-by-user'] });
        return planned.plan.hash;
      }
    },
    {
      name: 'ccync-first',
      agent: 'codex',
      status: 'unowned',
      setup: async fixture => {
        const before = await installer.computePlan(ownershipContext(fixture, 'codex'));
        // ccync registered the same name first. The direct installer has no manifest entry for it.
        setLiveMcp(fixture, 'codex', CCYNC_VECTOR);
        return before.plan.hash;
      }
    }
  ];

  for (const testCase of cases) {
    const fixture = createFixtureHome({ seedBlock: true, pluginByHost: { claude: true, codex: true }, mcpByHost: { claude: null, codex: null } });
    try {
      const ctx = ownershipContext(fixture, testCase.agent);
      const earlierHash = await testCase.setup(fixture);
      assert.equal(typeof earlierHash, 'string');
      const liveBefore = JSON.stringify(liveMcp(fixture, testCase.agent));
      const manifestBefore = manifestBytes(fixture.home);
      resetCalls(fixture);

      const planned = await installer.computePlan(ctx);
      assert.equal(planned.status, 'blocked', `${testCase.name} must block`);
      assert.equal(planned.plan.hash, null, `${testCase.name} must have no applicable hash`);
      assert.equal(planned.plan.mcpOwnership.status, testCase.status);
      assert.equal(planned.plan.steps.find(item => item.id === 'mcp').action, 'blocked');
      const conflict = planned.plan.conflicts.find(item => item.kind === 'mcp-ownership');
      assert.ok(conflict && conflict.blocking === true);
      const text = installer.formatPlan(planned);
      assert.match(text, /No plan hash/);
      assert.doesNotMatch(text, /Plan hash:/);

      // Neither an earlier hash nor a guessed hash can apply a blocked state.
      for (const hash of [earlierHash, 'f'.repeat(64)]) {
        const applied = await installer.applyPlan(ctx, hash);
        assert.equal(applied.status, 'error');
        assert.equal(applied.kind, 'mismatch');
        assert.match(applied.message, /blocking conflicts/);
      }
      assert.deepEqual(mcpCounts(fixture), { remove: 0, add: 0 }, `${testCase.name} remove/add counts`);
      assert.deepEqual(fixture.getState().mutationCalls, []);
      assert.equal(JSON.stringify(liveMcp(fixture, testCase.agent)), liveBefore, `${testCase.name} live registration preserved`);
      assert.deepEqual(manifestBytes(fixture.home), manifestBefore, `${testCase.name} manifest preserved`);
      assert.equal(fs.existsSync(installer.installerLockPath(fixture.home)), false);
      t.diagnostic(`${testCase.name}: status=${planned.status} hash=${planned.plan.hash} ownership=${planned.plan.mcpOwnership.status} remove/add=0/0`);
    } finally {
      fixture.cleanup();
    }
  }
});

test('installer apply rejects ownership evidence drift after computePlan', async t => {
  const injections = [
    {
      name: 'manifest change',
      inject: fixture => {
        const file = installer.manifestPath(fixture.home);
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        manifest.cli = manifest.cli.map(entry => (entry.kind === 'mcp' ? { ...entry, fingerprint: 'e'.repeat(64) } : entry));
        fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
      },
      expect: /install manifest changed/,
      check: (evidence, planned) => {
        assert.equal(evidence.manifestPresent, true);
        assert.equal(evidence.manifestUnchanged, false);
        assert.equal(evidence.manifestFingerprint, 'e'.repeat(64));
        assert.notEqual(evidence.manifestFingerprint, planned.plan.mcpOwnership.manifestFingerprint);
      }
    },
    {
      name: 'manifest removal',
      inject: fixture => fs.rmSync(installer.manifestPath(fixture.home)),
      expect: /install manifest was removed/,
      check: evidence => {
        assert.equal(evidence.manifestPresent, false);
        assert.equal(evidence.manifestFingerprint, null);
      }
    },
    {
      name: 'live registration change',
      inject: fixture => setLiveMcp(fixture, 'claude', FOREIGN_VECTOR),
      expect: /live clear-writing-kit-textlint registration changed/,
      check: (evidence, planned) => {
        assert.equal(evidence.manifestUnchanged, true);
        assert.equal(evidence.live, installer.registrationFingerprint(FOREIGN_VECTOR));
        assert.notEqual(evidence.live, planned.plan.mcpOwnership.live);
      }
    }
  ];

  for (const injection of injections) {
    const fixture = createFixtureHome({ seedBlock: true });
    try {
      const ctx = ownershipContext(fixture);
      await seedOwnedStale(fixture);
      const planned = await installer.computePlan(ctx);
      assert.equal(planned.status, 'ready');
      assert.equal(planned.plan.mcpOwnership.status, 'owned-stale');

      let injected = false;
      let bytesAtReread;
      let liveAtReread;
      const rereads = [];
      const outcome = await installer.applyPlan(ctx, planned.plan.hash, {
        beforeOwnershipReread: () => {
          injection.inject(fixture);
          injected = true;
          bytesAtReread = manifestBytes(fixture.home);
          liveAtReread = JSON.stringify(liveMcp(fixture, 'claude'));
        },
        onOwnershipReread: evidence => rereads.push(evidence)
      });

      assert.equal(injected, true, `${injection.name}: injection ran after computePlan`);
      assert.equal(rereads.length, 1, `${injection.name}: the second read occurred`);
      injection.check(rereads[0], planned);
      assert.equal(outcome.status, 'failed');
      assert.equal(outcome.step, 'mcp');
      assert.match(outcome.output, injection.expect);
      assert.deepEqual(mcpCounts(fixture), { remove: 0, add: 0 }, `${injection.name} remove/add counts`);
      assert.deepEqual(manifestBytes(fixture.home), bytesAtReread, `${injection.name}: manifest bytes visible at the reread are preserved`);
      assert.equal(JSON.stringify(liveMcp(fixture, 'claude')), liveAtReread);
      assert.equal(fs.existsSync(installer.installerLockPath(fixture.home)), false);
      t.diagnostic(`${injection.name}: ${outcome.status} at ${outcome.step}; remove/add=0/0`);
    } finally {
      fixture.cleanup();
    }
  }
});

test('installer mutations share one ownership lock', async t => {
  const fixture = createFixtureHome({ seedBlock: true });
  try {
    const ctx = ownershipContext(fixture);
    const lockPath = installer.installerLockPath(fixture.home);
    assert.equal(lockPath, path.join(fixture.home, '.clear-writing-kit.lock'));
    t.diagnostic(`lock path: ${lockPath}`);

    const first = await planAndApply(ctx);
    assert.equal(first.applied.status, 'applied');
    assert.equal(fs.existsSync(lockPath), false);
    const assertRefused = (result, label) => {
      assert.equal(result.status, 'refused', label);
      assert.equal(result.lockPath, lockPath, label);
      assert.ok(result.message.includes(lockPath), label);
      assert.match(result.message, /Nothing was changed/);
      assert.match(result.message, /no "cwk install apply" or "cwk install uninstall" process is active/);
      t.diagnostic(`${label}: ${JSON.stringify(result)}`);
    };
    const snapshot = () => ({
      manifest: manifestBytes(fixture.home),
      launcher: fs.readFileSync(path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs')),
      live: JSON.stringify(liveMcp(fixture, 'claude')),
      calls: fixture.getState().mutationCalls.length
    });

    // 1. Apply holds the lock: a competing apply and a competing uninstall refuse before any write.
    setLiveMcp(fixture, 'claude', null);
    resetCalls(fixture);
    const missing = await installer.computePlan(ctx);
    assert.equal(missing.plan.mcpOwnership.status, 'owned-missing');
    let competing;
    const holder = await installer.applyPlan(ctx, missing.plan.hash, {
      afterLock: async () => {
        assert.equal(fs.existsSync(lockPath), true);
        const before = snapshot();
        const apply = await installer.applyPlan(ctx, missing.plan.hash);
        const remove = await installer.uninstall(ctx);
        competing = { apply, remove, before, after: snapshot() };
      }
    });
    assertRefused(competing.apply, 'apply while apply holds the lock');
    assertRefused(competing.remove, 'uninstall while apply holds the lock');
    assert.deepEqual(competing.after, competing.before);
    assert.equal(competing.after.calls, 0, 'refused runs make zero host mutations');
    assert.equal(holder.status, 'applied');
    assert.deepEqual(mcpCounts(fixture), { remove: 0, add: 1 });
    assert.equal(fs.existsSync(lockPath), false);

    // 2. Uninstall holds the lock: a competing apply refuses before any write.
    const current = await installer.computePlan(ctx);
    assert.equal(current.status, 'ready');
    resetCalls(fixture);
    let competingApply;
    const remover = await installer.uninstall(ctx, {
      afterLock: async () => {
        const before = snapshot();
        const apply = await installer.applyPlan(ctx, current.plan.hash);
        competingApply = { apply, before, after: snapshot() };
      }
    });
    assertRefused(competingApply.apply, 'apply while uninstall holds the lock');
    assert.deepEqual(competingApply.after, competingApply.before);
    assert.equal(competingApply.after.calls, 0);
    assert.equal(remover.status, 'done');
    assert.equal(fs.existsSync(lockPath), false);

    // 3. A stale lock blocks both commands and stays until it is removed by hand.
    const reinstall = await planAndApply(ctx);
    assert.equal(reinstall.applied.status, 'applied');
    fs.writeFileSync(lockPath, 'left by a stopped run\n');
    const staleBytes = fs.readFileSync(lockPath);
    resetCalls(fixture);
    const before = snapshot();
    const fresh = await installer.computePlan(ctx);
    assert.equal(fresh.status, 'ready', 'plan stays read-only and does not take the lock');
    assertRefused(await installer.applyPlan(ctx, fresh.plan.hash), 'apply with a stale lock');
    assertRefused(await installer.uninstall(ctx), 'uninstall with a stale lock');
    assert.deepEqual(snapshot(), before, 'stale-lock refusals write nothing');
    assert.equal(fixture.getState().mutationCalls.length, 0);
    assert.deepEqual(fs.readFileSync(lockPath), staleBytes, 'the stale lock is not removed automatically');

    fs.rmSync(lockPath);
    const recovered = await installer.uninstall(ctx);
    assert.equal(recovered.status, 'done');
    assert.equal(fs.existsSync(lockPath), false);
  } finally {
    fixture.cleanup();
  }
});

test('installer ownership lock releases after failure', async t => {
  // Apply: an error after lock acquisition and the payload step, before the first MCP mutation.
  const applyFixture = createFixtureHome({ seedBlock: true });
  try {
    const ctx = ownershipContext(applyFixture);
    const lockPath = installer.installerLockPath(applyFixture.home);
    const planned = await installer.computePlan(ctx);
    resetCalls(applyFixture);
    let lockHeld;
    const failed = await installer.applyPlan(ctx, planned.plan.hash, {
      beforeOwnershipReread: () => {
        lockHeld = fs.existsSync(lockPath);
        throw new Error('injected apply failure');
      }
    });
    assert.equal(lockHeld, true);
    assert.equal(failed.status, 'failed');
    assert.equal(failed.step, 'mcp');
    assert.match(failed.output, /injected apply failure/);
    assert.deepEqual(failed.completed, ['payload']);
    assert.equal(manifestMcpEntry(applyFixture.home, 'claude'), undefined, 'no MCP ownership recorded before the error');
    assert.equal(liveMcp(applyFixture, 'claude'), null);
    assert.deepEqual(mcpCounts(applyFixture), { remove: 0, add: 0 });
    assert.equal(fs.existsSync(lockPath), false, 'apply released the lock after the error');

    // An error thrown directly after acquisition propagates and also releases the lock.
    await assert.rejects(
      installer.applyPlan(ctx, planned.plan.hash, { afterLock: () => { throw new Error('injected apply failure after lock'); } }),
      /injected apply failure after lock/
    );
    assert.equal(fs.existsSync(lockPath), false);
    t.diagnostic(`apply: ${JSON.stringify(failed)}`);
  } finally {
    applyFixture.cleanup();
  }

  // Uninstall: an error after lock acquisition, before the manifest is read.
  const uninstallFixture = createFixtureHome({ seedBlock: true });
  try {
    const ctx = ownershipContext(uninstallFixture);
    const lockPath = installer.installerLockPath(uninstallFixture.home);
    const { applied } = await planAndApply(ctx);
    assert.equal(applied.status, 'applied');
    const manifestBefore = manifestBytes(uninstallFixture.home);
    const liveBefore = JSON.stringify(liveMcp(uninstallFixture, 'claude'));
    resetCalls(uninstallFixture);
    let lockHeld;
    await assert.rejects(installer.uninstall(ctx, {
      afterLock: () => {
        lockHeld = fs.existsSync(lockPath);
        throw new Error('injected uninstall failure');
      }
    }), /injected uninstall failure/);
    assert.equal(lockHeld, true);
    assert.deepEqual(manifestBytes(uninstallFixture.home), manifestBefore);
    assert.equal(JSON.stringify(liveMcp(uninstallFixture, 'claude')), liveBefore);
    assert.deepEqual(uninstallFixture.getState().mutationCalls, []);
    assert.equal(fs.existsSync(lockPath), false, 'uninstall released the lock after the error');

    const retry = await installer.uninstall(ctx);
    assert.equal(retry.status, 'done');
    assert.equal(fs.existsSync(lockPath), false);
    t.diagnostic('uninstall: rejected with the injected error; lock released; retry done');
  } finally {
    uninstallFixture.cleanup();
  }
});

test('direct installer owned lifecycle for Claude and Codex', async t => {
  for (const agent of ['claude', 'codex']) {
    const fixture = createFixtureHome({
      pluginInstalled: false,
      pluginByHost: { claude: false, codex: false },
      mcpByHost: { claude: null, codex: null },
      seedSettings: false
    });
    try {
      const ctx = ownershipContext(fixture, agent);
      const expectExactFingerprint = plan => {
        const desired = plannedVector(plan, fixture.home);
        const entry = manifestMcpEntry(fixture.home, agent);
        assert.ok(entry, `${agent}: manifest records the MCP entry`);
        assert.equal(entry.fingerprint, installer.registrationFingerprint({ command: desired[0], args: desired.slice(1) }));
        assert.equal(entry.fingerprint, installer.registrationFingerprint(liveMcp(fixture, agent)));
        return entry.fingerprint;
      };
      const verify = async label => {
        const outcome = await installer.verifyInstall({ ...ctx, callTimeoutMs: 60000 });
        const failedChecks = outcome.checks.filter(check => check.status !== 'pass').map(check => `${check.id}: ${check.detail}`);
        assert.equal(outcome.status, 'pass', `${agent} ${label} verify: ${failedChecks.join('; ')}`);
      };

      // Install
      resetCalls(fixture);
      const installed = await planAndApply(ctx);
      assert.equal(installed.applied.status, 'applied');
      assert.equal(installed.planned.plan.mcpOwnership.status, 'absent');
      assert.deepEqual(mcpCounts(fixture), { remove: 0, add: 1 });
      const installFingerprint = expectExactFingerprint(installed.planned.plan);
      await verify('install');

      // Upgrade to a new block version: the payload moves, and the owned registration stays current.
      const upgradedBlock = fixture.blockText.replace(/clear-writing-kit:begin v=[^ ]+/, 'clear-writing-kit:begin v=99.0.0-lifecycle');
      const upgradeCtx = { ...ctx, blockText: upgradedBlock };
      resetCalls(fixture);
      const upgraded = await planAndApply(upgradeCtx);
      assert.equal(upgraded.applied.status, 'applied');
      assert.equal(upgraded.planned.plan.version, '99.0.0-lifecycle');
      assert.equal(upgraded.planned.plan.mcpOwnership.status, 'owned-current');
      assert.ok(upgraded.applied.completed.includes('payload'));
      assert.deepEqual(mcpCounts(fixture), { remove: 0, add: 0 });
      assert.equal(expectExactFingerprint(upgraded.planned.plan), installFingerprint);
      await verify('upgrade');

      // Uninstall removes the exact owned entry and the manifest.
      resetCalls(fixture);
      const removed = await installer.uninstall(upgradeCtx);
      assert.equal(removed.status, 'done');
      assert.deepEqual(mcpCounts(fixture), { remove: 1, add: 0 });
      assert.ok(!liveMcp(fixture, agent), `${agent}: live registration removed`);
      assert.equal(fs.existsSync(installer.manifestPath(fixture.home)), false);
      assert.equal(fs.existsSync(installer.installerLockPath(fixture.home)), false);
      t.diagnostic(`${agent}: install, verify, upgrade, verify, uninstall passed; fingerprint ${installFingerprint}`);
    } finally {
      fixture.cleanup();
    }
  }
});
