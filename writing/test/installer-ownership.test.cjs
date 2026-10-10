const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  repoRoot,
  loadInstaller,
  createFixtureHome
} = require('./installer-fixtures.cjs');

const installer = loadInstaller();
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

function makeDualFixture(options = {}) {
  return createFixtureHome({
    pluginInstalled: false,
    mcp: null,
    pluginByHost: { claude: false, codex: false },
    mcpByHost: { claude: null, codex: null },
    seedSettings: false,
    ...options
  });
}

function context(fixture, agent, env = fixture.env) {
  return {
    agent,
    env,
    home: fixture.home,
    payloadDir: path.join(repoRoot, 'dist'),
    blockText: fixture.blockText
  };
}

async function install(ctx) {
  const planned = await installer.computePlan(ctx);
  assert.equal(planned.status, 'ready');
  const applied = await installer.applyPlan(ctx, planned.plan.hash);
  assert.equal(applied.status, 'applied');
  return applied;
}

function readManifest(home) {
  return JSON.parse(fs.readFileSync(installer.manifestPath(home), 'utf8'));
}

function readIfPresent(file) {
  return fs.existsSync(file) ? fs.readFileSync(file) : undefined;
}

test('both install orders and first-uninstall choices preserve the surviving host', async () => {
  const cases = [
    [['claude', 'codex'], 'claude'],
    [['claude', 'codex'], 'codex'],
    [['codex', 'claude'], 'claude'],
    [['codex', 'claude'], 'codex']
  ];

  for (const [order, first] of cases) {
    const fixture = makeDualFixture();
    try {
      const settingsPath = path.join(fixture.home, '.claude', 'settings.json');
      fs.writeFileSync(settingsPath, '{\n  "theme": "dark"\n}\n');
      const contexts = {
        claude: context(fixture, 'claude'),
        codex: context(fixture, 'codex')
      };

      for (const host of order) await install(contexts[host]);

      const installed = readManifest(fixture.home);
      assert.equal(installed.schemaRevision, 2);
      assert.ok(installed.files.length > 0);
      assert.ok(installed.files.every(file => file.owners.includes('claude') && file.owners.includes('codex')));
      assert.deepEqual(Object.keys(installed.completedSteps).sort(), ['claude', 'codex']);
      assert.ok(installed.blocks.some(record => record.host === 'claude'));
      assert.ok(installed.blocks.some(record => record.host === 'codex'));
      assert.ok(installed.settings.some(record => record.host === 'claude' && record.target === settingsPath));

      const surviving = first === 'claude' ? 'codex' : 'claude';
      const survivingInstructions = path.join(
        fixture.home,
        surviving === 'claude' ? '.claude' : '.codex',
        surviving === 'claude' ? 'CLAUDE.md' : 'AGENTS.md'
      );
      const blockBefore = fs.readFileSync(survivingInstructions);
      const settingsBefore = surviving === 'claude' ? fs.readFileSync(settingsPath) : undefined;
      const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');
      assert.ok(fs.existsSync(launcher));

      fixture.setState(state => ({ ...state, mutationCalls: [] }));
      const firstRemoval = await installer.uninstall(contexts[first]);
      assert.equal(firstRemoval.status, 'done');
      const afterFirstState = fixture.getState();
      assert.ok(afterFirstState.mcpByHost[surviving]);
      assert.equal(afterFirstState.pluginByHost[surviving], true);
      assert.deepEqual(fs.readFileSync(survivingInstructions), blockBefore);
      if (settingsBefore) assert.deepEqual(fs.readFileSync(settingsPath), settingsBefore);
      assert.ok(fs.existsSync(launcher));

      const retained = readManifest(fixture.home);
      assert.ok(retained.files.every(file => file.owners.includes(surviving) && !file.owners.includes(first)));
      assert.ok(retained.cli.every(entry => entry.host === surviving));
      assert.ok(retained.blocks.every(record => record.host === surviving));

      const verified = await installer.verifyInstall({
        agent: surviving,
        env: fixture.env,
        home: fixture.home,
        callTimeoutMs: 10000
      });
      assert.equal(verified.status, 'pass');
      assert.ok(verified.checks.some(check => check.id === 'lint-en-US' && check.status === 'pass'));
      assert.ok(verified.checks.some(check => check.id === 'lint-zh-TW' && check.status === 'pass'));
      assert.ok(verified.checks.some(check => check.id === 'lint-ja-JP' && check.status === 'pass'));

      const finalRemoval = await installer.uninstall(contexts[surviving]);
      assert.equal(finalRemoval.status, 'done');
      assert.equal(fs.existsSync(installer.manifestPath(fixture.home)), false);
      assert.equal(fs.existsSync(launcher), false);

      const repeated = await installer.uninstall(contexts[surviving]);
      assert.equal(repeated.status, 'done');
    } finally {
      fixture.cleanup();
    }
  }
});

test('exact current MCP registration without a manifest entry blocks adoption', async () => {
  const fixture = makeDualFixture();
  try {
    const claude = context(fixture, 'claude');
    const codex = context(fixture, 'codex');
    await install(claude);
    await install(codex);

    const manifestPath = installer.manifestPath(fixture.home);
    const stripped = readManifest(fixture.home);
    stripped.cli = stripped.cli.filter(entry => !(entry.host === 'codex' && entry.kind === 'mcp'));
    fs.writeFileSync(manifestPath, `${JSON.stringify(stripped, null, 2)}\n`);
    const manifestBefore = fs.readFileSync(manifestPath);
    const liveBefore = fixture.getState().mcpByHost.codex;
    fixture.setState(state => ({ ...state, mutationCalls: [] }));

    const planned = await installer.computePlan(codex);
    assert.equal(planned.status, 'blocked');
    assert.equal(planned.plan.hash, null);
    assert.equal(planned.plan.steps.find(step => step.id === 'mcp')?.action, 'blocked');
    const refused = await installer.applyPlan(codex, 'f'.repeat(64));
    assert.notEqual(refused.status, 'applied');
    assert.equal(fixture.getState().mutationCalls.length, 0);
    assert.deepEqual(fixture.getState().mcpByHost.codex, liveBefore);
    assert.deepEqual(fs.readFileSync(manifestPath), manifestBefore);
  } finally {
    fixture.cleanup();
  }
});

test('exact current artifacts adopt missing host metadata without rewriting bytes', async () => {
  const fixture = makeDualFixture();
  try {
    const claude = context(fixture, 'claude');
    const codex = context(fixture, 'codex');
    await install(claude);
    await install(codex);

    const manifestPath = installer.manifestPath(fixture.home);
    const stripped = readManifest(fixture.home);
    stripped.files = stripped.files.map(file => ({ ...file, owners: file.owners.filter(owner => owner !== 'codex') }));
    stripped.cli = stripped.cli.filter(entry => entry.host !== 'codex' || entry.kind === 'mcp');
    stripped.blocks = stripped.blocks.filter(record => record.host !== 'codex');
    delete stripped.completedSteps.codex;
    fs.writeFileSync(manifestPath, `${JSON.stringify(stripped, null, 2)}\n`);

    const watched = [
      path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs'),
      path.join(fixture.home, '.codex', 'AGENTS.md'),
      path.join(fixture.home, '.claude', 'settings.json')
    ];
    const before = new Map(watched.map(file => [file, readIfPresent(file)]));
    fixture.setState(state => ({ ...state, mutationCalls: [] }));

    const planned = await installer.computePlan(codex);
    assert.equal(planned.status, 'ready');
    assert.ok(planned.plan.steps.every(step => step.action === 'none'));
    const adopted = await installer.applyPlan(codex, planned.plan.hash);
    assert.equal(adopted.status, 'applied');
    assert.equal(adopted.completed.length, 0);
    assert.equal(fixture.getState().mutationCalls.length, 0);
    for (const file of watched) assert.deepEqual(readIfPresent(file), before.get(file));

    const adoptedManifest = readManifest(fixture.home);
    assert.ok(adoptedManifest.files.every(file => file.owners.includes('codex')));
    assert.ok(adoptedManifest.cli.some(entry => entry.host === 'codex' && entry.kind === 'mcp'));
    assert.ok(adoptedManifest.blocks.some(record => record.host === 'codex'));
    assert.ok(adoptedManifest.completedSteps.codex.includes('payload'));

    const firstManifestBytes = fs.readFileSync(manifestPath);
    const rerunPlan = await installer.computePlan(codex);
    const rerun = await installer.applyPlan(codex, rerunPlan.plan.hash);
    assert.equal(rerun.status, 'applied');
    assert.equal(rerun.completed.length, 0);
    assert.deepEqual(fs.readFileSync(manifestPath), firstManifestBytes);
    assert.equal(fixture.getState().mutationCalls.length, 0);
  } finally {
    fixture.cleanup();
  }
});

test('legacy manifests migrate conservatively without inventing host ownership', () => {
  const hash = 'a'.repeat(64);
  const ambiguous = installer.parseManifest(JSON.stringify({
    version: '1.0.0',
    files: [{ path: 'C:/kit/cwk.mjs', sha256: hash }],
    cli: [],
    completedSteps: ['payload']
  }));
  assert.equal(ambiguous.ok, true);
  assert.deepEqual(ambiguous.value.files[0].owners, ['legacy']);
  assert.deepEqual(ambiguous.value.completedSteps, { legacy: ['payload'] });

  const concrete = installer.parseManifest(JSON.stringify({
    version: '1.0.0',
    files: [
      { path: 'C:/kit/cwk.mjs', sha256: hash },
      { path: 'C:/home/.codex/AGENTS.md#block', sha256: hash }
    ],
    cli: [{ host: 'codex', kind: 'mcp', name: installer.MCP_NAME, fingerprint: hash }],
    completedSteps: ['payload', 'block']
  }));
  assert.equal(concrete.ok, true);
  assert.deepEqual(concrete.value.files[0].owners, ['codex']);
  assert.equal(concrete.value.blocks[0].host, 'codex');
  assert.deepEqual(concrete.value.completedSteps.codex, ['payload', 'block']);

  const current = {
    schemaRevision: 2,
    version: '1.0.0',
    files: [{ path: 'C:/kit/cwk.mjs', sha256: hash, owners: ['codex'] }],
    cli: [],
    blocks: [],
    settings: [],
    completedSteps: { codex: ['payload'] }
  };
  assert.equal(installer.parseManifest(JSON.stringify({ ...current, schemaRevision: 3 })).ok, false);
  assert.equal(installer.parseManifest(JSON.stringify({ ...current, schemaRevision: 2.5 })).ok, false);
  assert.equal(installer.parseManifest(JSON.stringify({
    ...current,
    files: [{ path: 'C:/kit/cwk.mjs', sha256: hash, owners: [] }]
  })).ok, false);
  assert.equal(installer.parseManifest(JSON.stringify({
    ...current,
    settings: [{ host: 'claude', target: 'C:/home/settings.json', setting: 'theme', value: 'dark' }]
  })).ok, false);
});

test('relocated configuration and an edited block retain shared runtime until retry', async () => {
  const fixture = makeDualFixture();
  try {
    const customDir = path.join(fixture.home, 'relocated claude config');
    fs.mkdirSync(customDir, { recursive: true });
    const instructionsPath = path.join(customDir, 'CLAUDE.md');
    const settingsPath = path.join(customDir, 'settings.json');
    fs.writeFileSync(instructionsPath, '# Relocated instructions\n');
    fs.writeFileSync(settingsPath, '{\n  "theme": "dark"\n}\n');
    const env = { ...fixture.env, CLAUDE_CONFIG_DIR: customDir };
    const claude = context(fixture, 'claude', env);

    await install(claude);
    const installedText = fs.readFileSync(instructionsPath, 'utf8');
    const manifest = readManifest(fixture.home);
    assert.ok(manifest.blocks.some(record => record.host === 'claude' && record.target === instructionsPath));
    assert.ok(manifest.settings.some(record => record.host === 'claude' && record.target === settingsPath));

    fs.writeFileSync(
      instructionsPath,
      installedText.replace('<!-- clear-writing-kit:end -->', 'User edit inside block.\n<!-- clear-writing-kit:end -->')
    );
    const firstRemoval = await installer.uninstall(claude);
    assert.equal(firstRemoval.status, 'done');
    assert.ok(firstRemoval.kept.some(item => item.target.includes('(block)') && item.detail.includes('edited')));
    assert.ok(firstRemoval.kept.some(item => item.detail.includes('instruction block')));
    assert.ok(fs.existsSync(path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs')));

    const retained = readManifest(fixture.home);
    assert.ok(retained.blocks.some(record => record.target === instructionsPath));
    assert.ok(retained.files.every(file => file.owners.includes('claude')));

    fs.writeFileSync(instructionsPath, installedText);
    const retry = await installer.uninstall(claude);
    assert.equal(retry.status, 'done');
    assert.equal(fs.existsSync(installer.manifestPath(fixture.home)), false);
    assert.equal(fs.readFileSync(path.join(fixture.home, '.claude', 'CLAUDE.md'), 'utf8'), '# Claude Instructions\n');
  } finally {
    fixture.cleanup();
  }
});

test('changed shared files are retained by hash and removed after restoration', async () => {
  const fixture = makeDualFixture();
  try {
    const codex = context(fixture, 'codex');
    await install(codex);
    const launcher = path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs');
    const original = fs.readFileSync(launcher);
    fs.appendFileSync(launcher, '\n// user change\n');

    const firstRemoval = await installer.uninstall(codex);
    assert.equal(firstRemoval.status, 'done');
    assert.ok(firstRemoval.kept.some(item => item.target === launcher && item.detail.includes('hash no longer matches')));
    const retained = readManifest(fixture.home);
    assert.equal(retained.files.length, 1);
    assert.equal(retained.files[0].path, launcher);
    assert.equal(retained.files[0].sha256, digest(original));

    fs.writeFileSync(launcher, original);
    const retry = await installer.uninstall(codex);
    assert.equal(retry.status, 'done');
    assert.equal(fs.existsSync(launcher), false);
    assert.equal(fs.existsSync(installer.manifestPath(fixture.home)), false);
  } finally {
    fixture.cleanup();
  }
});

test('a cross-host upgrade transfers current payload ownership and cleans after the final consumer', async () => {
  const fixture = makeDualFixture();
  try {
    const payloadA = path.join(fixture.home, 'payload-a');
    const payloadB = path.join(fixture.home, 'payload-b');
    fs.mkdirSync(payloadA, { recursive: true });
    fs.mkdirSync(payloadB, { recursive: true });
    fs.writeFileSync(path.join(payloadA, 'cwk.mjs'), 'export const version = "2.0.0";\n');
    fs.writeFileSync(path.join(payloadB, 'cwk.mjs'), 'export const version = "2.0.1";\n');

    const blockA = fixture.blockText.replace(/clear-writing-kit:begin v=[^ ]+/, 'clear-writing-kit:begin v=2.0.0');
    const blockB = fixture.blockText.replace(/clear-writing-kit:begin v=[^ ]+/, 'clear-writing-kit:begin v=2.0.1');
    const claude = { ...context(fixture, 'claude'), payloadDir: payloadA, blockText: blockA };
    const codexA = { ...context(fixture, 'codex'), payloadDir: payloadA, blockText: blockA };
    const codexB = { ...context(fixture, 'codex'), payloadDir: payloadB, blockText: blockB };

    await install(claude);
    await install(codexA);
    await install(codexB);

    const upgraded = readManifest(fixture.home);
    const currentFiles = upgraded.files.filter(file => file.path.includes(`${path.sep}2.0.1${path.sep}`));
    assert.ok(currentFiles.length > 0);
    assert.ok(currentFiles.every(file => file.owners.includes('claude') && file.owners.includes('codex')));

    const firstRemoval = await installer.uninstall(codexB);
    assert.equal(firstRemoval.status, 'done');
    const retained = readManifest(fixture.home);
    assert.ok(retained.files.every(file => file.owners.includes('claude')));
    assert.ok(retained.files.every(file => !file.owners.includes('legacy')));

    const finalRemoval = await installer.uninstall(claude);
    assert.equal(finalRemoval.status, 'done');
    assert.equal(fs.existsSync(installer.manifestPath(fixture.home)), false);
    assert.equal(fs.existsSync(path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs')), false);
    assert.equal(fs.existsSync(path.join(fixture.home, '.clear-writing-kit', '2.0.0')), false);
    assert.equal(fs.existsSync(path.join(fixture.home, '.clear-writing-kit', '2.0.1')), false);
  } finally {
    fixture.cleanup();
  }
});

test('failed CLI removal retains shared runtime and a later retry cleans it', async () => {
  const fixture = makeDualFixture();
  try {
    const codex = context(fixture, 'codex');
    await install(codex);
    fixture.setState(state => ({ ...state, mcpRemoveErrorHosts: ['codex'], mutationCalls: [] }));

    const failed = await installer.uninstall(codex);
    assert.equal(failed.status, 'incomplete');
    assert.ok(failed.failed.some(item => item.target.includes('mcp') && item.detail.includes('exited with code 1')));
    assert.ok(failed.kept.some(item => item.detail.includes('CLI entry was kept or failed removal')));
    assert.ok(fs.existsSync(path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs')));
    assert.ok(readManifest(fixture.home).cli.some(entry => entry.host === 'codex' && entry.kind === 'mcp'));

    fixture.setState(state => ({ ...state, mcpRemoveErrorHosts: [], mutationCalls: [] }));
    const retry = await installer.uninstall(codex);
    assert.equal(retry.status, 'done');
    assert.equal(fs.existsSync(installer.manifestPath(fixture.home)), false);
    assert.equal(fs.existsSync(path.join(fixture.home, '.clear-writing-kit', 'cwk.mjs')), false);
  } finally {
    fixture.cleanup();
  }
});
