# Plan Prompt: Cross-agent plugin installer for clear-writing-kit

<!--
Generated from .dev/plans/feat-cross-agent-plugin-installer.md.
Output path: C:/Code/clear-writing-kit/.dev/plans/feat-cross-agent-plugin-installer.prompt.md
This is the shared mutable execution work file consumed by control-plane chat, /gal status, /gal whats-next, /gal pipeline, and specialist write-back flows.
-->

## Goal

Install the complete clear-writing-kit through one agent-readable INSTALL.md and one TypeScript installer. Provide coding-agent-writing, a functional textlint MCP server, and a marked global instruction block. Claude Code also selects clear-writing-kit output style. Behavior is independent of ccync or other managers.

## Requirements

### Commands and safety

- [ ] R-01 `cwk install plan` is read-only. It reports the requesting host, all hosts found on the machine, available runtimes, the state of each target, a conflict list, and every file, block, MCP entry, and setting it would change, with diffs. It ends with a plan hash.
- [ ] R-02 Host identity comes from `--agent`. The installer cross-checks exact environment variable names, never prefixes. A mismatch stops the run with a message. Evidence: Claude Code sets `CLAUDECODE` and, on this machine, also `CODEX_COMPANION_SESSION_ID` from the Codex plugin.
- [ ] R-03 `cwk install apply` requires `--plan-hash` from a `plan` run. It recomputes the plan and stops without writing if the hash differs. The hash covers the installer version, the payload digest, and the normalized target state. It excludes timestamps and backup paths.
- [ ] R-04 If a step fails during `apply`, the installer stops and reports the failed step and its output. Completed steps stay recorded in the manifest. Because `plan` is computed from the current state, a rerun of `plan` and `apply` covers only the remaining steps. No separate resume state exists.
- [ ] R-05 Every file write goes to a temporary file in the same directory, then replaces the target by rename. The installer keeps the target's line endings, byte-order mark, and trailing newline. If the rename fails because the file is locked, it retries, then fails with the file path.
- [ ] R-06 The installer never prints or logs the contents of host configuration files. Diffs show only its own block and its own entries. It parses only the keys it needs.

### What is installed

- [ ] R-07 `apply` copies the payload to `~/.clear-writing-kit/<version>/`. The payload is the `dist/` directory chosen by the Step 1 spike. A launcher file `~/.clear-writing-kit/cwk.mjs` imports the active version. MCP entries and the instruction block point to the launcher, never to the repository clone or a host plugin cache. The launcher replaces a `current` symlink, because creating a directory symlink on Windows needs Developer Mode or administrator rights.
- [ ] R-08 The skill is installed through the host's plugin mechanism. If a verified host does not support plugin skills, the installer copies the skill into that host's skill directory instead. `web-skills/` is never installed.
- [ ] R-09 The textlint MCP server is named `clear-writing-kit-textlint`. It is registered once per host, through the host's own CLI, and plugins do not declare it. The runtime is chosen in this order: Node >= 20.18, Deno >= 2, Bun. At least one is always present, because the installer itself runs on one of them.
- [ ] R-10 The MCP server exposes one tool, `lintText`, with parameters `text`, `language` (`en-US`, `zh-TW`, `ja-JP`), `genre` (`document`, `conversation`), and an optional `filename` for parser selection. Each profile loads on first use and stays cached in the process. The server has no file-reading or auto-fix tools.
- [ ] R-11 The instruction block is wrapped in `<!-- clear-writing-kit:begin v=<version> -->` and `<!-- clear-writing-kit:end -->`. It stays under 2 KB and is identical across hosts. It names the skill, the `lintText` tool, and the fallback command `<runtime> <home>/.clear-writing-kit/cwk.mjs check` for hosts where the MCP tool is missing. The block tells the agent to resolve `<home>` to the user's home directory, because cmd.exe does not expand `~`. A rerun replaces only this block. Content outside the markers is never changed.
- [ ] R-12 In Claude Code, the plugin ships the `clear-writing-kit` output style, and the installer sets `outputStyle` in `~/.claude/settings.json`. It overwrites any previous value. The `plan` diff shows the old value. All other keys stay unchanged, and the file is backed up first.

### Hosts

- [ ] R-13 A host is supported only after it passes the Step 2 survey and a full fixture cycle: `apply`, rerun with no diff, `verify`, and `uninstall`. Each host record carries a verified flag. On an unverified host, `plan` lists the manual steps and `apply` refuses to run.

### Verification, conflicts, and removal

- [ ] R-14 `cwk install verify` starts the registered MCP command and calls `lintText` once for each language, with a fixture that must produce at least one finding. It re-reads `outputStyle` in Claude Code. It checks the block size. Any check that fails or does not run makes the result "incomplete", never "pass".
- [ ] R-15 `plan` and `verify` report legacy conflicts: an `accurate-answer` skill, instruction blocks that name `accurate-answer`, and an old `outputStyle`. The installer does not delete them. `verify` reports "incomplete" while a duplicate writing skill remains installed.
- [ ] R-16 The manifest `~/.clear-writing-kit/install-manifest.json` records each file write with a SHA-256 hash. It records each CLI-created item as host, kind, name, and command fingerprint.
- [ ] R-17 `cwk install uninstall` removes a file only when its hash matches the manifest. It removes a CLI-created item through the host's remove command only when the current entry matches the fingerprint. It removes an old payload version directory only when its hash matches. Items that do not match are reported and kept.
- [ ] R-18 An upgrade is a normal `plan` and `apply` with a newer version. It re-registers the MCP entry, replaces the block through its `v=` marker, and rewrites the launcher to import the new version.

### Agent prompt and docs

- [ ] R-19 `INSTALL.md` first tells the agent to check for `node`, `deno`, and `bun`. If none is found, the agent stops, tells the user to install one, and gives the official install page URLs. It does not install a runtime itself. Otherwise `INSTALL.md` tells the agent to run `plan`, show the result to the user, wait for confirmation, run `apply` with the plan hash, run `verify`, and report passed and failed steps separately. It forbids direct edits to host configuration files.
- [ ] R-20 The README and docs describe the installer and no longer say that the repository does not edit global agent settings.

## Approach

### Step 1: Feasibility spike for the payload

- **Files**: `src/check.ts`, `src/mcp.ts`, `dist/`, `.dev/research/payload-spike.md`
- **What**: Run textlint in-process with cached profiles and build the single-tool MCP server. Try payload layouts in this order: (1) one bundle plus a sibling `dict/` directory, (2) a bundle plus a pruned vendored `node_modules` with production dependencies only. If neither passes, stop and return the plan to deep-planning. Choose the first layout that reaches parity on Node, Deno, and Bun. If more than one passes, choose the smaller payload. Cold start must stay under 3 seconds.
- **Verify**: Findings equal the current checker for all six profiles on `writing/test` fixtures on all three runtimes. The report records the layout, payload size, and cold-start time per runtime.

### Step 2: Host capability survey

- **Files**: `src/hosts.ts`, `.dev/research/host-capabilities.md`
- **What**: For Claude Code, Codex, Copilot CLI, opencode, and Antigravity CLI, record the installed version, plugin format, plugin skill support, plugin list command, MCP add, remove, and list or get commands, the configuration-directory variable for fixture isolation, global instruction file, and output-style support. Cite command output or an official document URL for each item.
- **Verify**: Every host record has a verified flag and an evidence source. Claude Code and Codex are surveyed on the owner's machine.

### Step 3: Generated artifacts

- **Depends on**: Step 1, for the fallback command form in the block.
- **Files**: `scripts/generate-output-style.py`, `scripts/artifacts.py`, `scripts/generate-agents-block.py`, `install/agents-block.md`, `output-styles/clear-writing-kit.md`, `tests/`
- **What**: Generate the instruction block from `skills/coding-agent-writing/` and commit it. Change the output-style generator's default target to `output-styles/`. Add `--check` coverage.
- **Verify**: The generator checks and Python tests pass. The block is under 2 KB and contains no machine-specific absolute paths.

### Step 4: Plugin manifests

- **Depends on**: Step 2.
- **Files**: `.claude-plugin/`, `.codex-plugin/`, manifests for other hosts that pass Step 2
- **What**: Point each manifest at `skills/coding-agent-writing/` only. Ship the output style in the Claude manifest. Declare no MCP server.
- **Verify**: Each host CLI installs the plugin from a local path on a fixture home and lists the skill.

### Step 5: Installer

- **Depends on**: Steps 1 to 4.
- **Files**: `src/cli.ts`, `src/install/*.ts`, `dist/`
- **What**: Implement `plan`, `apply`, `verify`, and `uninstall` from `src/hosts.ts`, following R-01 to R-18.
- **Verify**: All test cases pass on fixture homes under Node, Deno, and Bun.

### Step 6: Agent prompt and docs

- **Files**: `INSTALL.md`, `README.md`, `docs/verification.md`
- **What**: Write the agent procedure and update the docs.
- **Verify**: `npm --prefix writing run lint` passes on the changed docs.

### Step 7: Human review

- **Files**: none
- **What**: The owner reviews once, after every task and the goal-backward verification pass. The agent runs the commands, and the owner reads the results. The checklist:
  1. From Claude Code, follow `INSTALL.md` to `plan`. The diff changes only the kit block, the plugin, `clear-writing-kit-textlint`, and `outputStyle`.
  2. After `apply`, `verify` shows "pass", or "incomplete" only because of the old ccync `accurate-answer` block or skill.
  3. Repeat items 1 and 2 from Codex.
  4. A new Claude Code session uses the `clear-writing-kit` output style.
  5. A new Codex session answers this prompt by naming `coding-agent-writing` and calling `lintText`: the zh-TW acceptance prompt and sentence recorded in Step 7 of the source plan
- **Verify**: The owner marks each item yes or no.

Scope: TypeScript installer/checker; committed runtime payload; verified host plugins, global instruction block, Claude output style, CLI-only MCP registration. No web-skills, compiled binaries, manager-specific behavior, runtime auto-installation, legacy-item deletion, runtime generation of artifacts, or changes to SKILL.md/knowledge sources.

## Files to Create or Modify

- `INSTALL.md` — the agent-facing install prompt.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — Claude Code plugin with the skill and the output style. No MCP declaration.
- `.codex-plugin/plugin.json` and a local marketplace entry — Codex plugin with the skill.
- Manifests for other hosts — only for hosts that pass Step 2.
- `src/hosts.ts` — typed host table: paths, CLI commands, plugin support, verified flag, evidence source.
- `src/cli.ts`, `src/install/*.ts` — `plan`, `apply`, `verify`, `uninstall`, atomic writes, manifest, runtime selection, Windows command spawning.
- `src/check.ts`, `src/rules.ts`, `src/mcp.ts` — in-process textlint with cached profiles built from a static rule import map, and the single-tool MCP server on `@modelcontextprotocol/server`.
- `dist/` — the committed build output selected by Step 1.
- `install/agents-block.md` — the generated instruction block.
- `output-styles/clear-writing-kit.md` — the generated output style.
- `scripts/generate-output-style.py` — default output becomes the repository's `output-styles/`. It no longer writes to `~/.claude` unless `--output` says so.
- `scripts/artifacts.py`, `scripts/generate-agents-block.py` — generate and `--check` the instruction block.
- `writing/package.json` — pin `esbuild` and `@modelcontextprotocol/server` as direct dependencies, and add build and test scripts.
- `README.md`, `docs/verification.md` — installation and verification docs. `knowledge/` is generated from `SKILL.md`, which this plan does not change.
- `tests/` — Python tests for the new generated files.

## Test Cases

- `plan --agent claude` inside Claude Code → host `claude`, no mismatch, even though `CODEX_COMPANION_SESSION_ID` is set.
- `plan --agent codex` inside Claude Code → mismatch, exit non-zero, no plan hash.
- `plan` twice on an unchanged fixture home → identical plan hash.
- `apply` with a plan hash taken before a target file changed → stop, no writes, message names the changed target.
- Host CLI stub that fails on the MCP step → `apply` stops, the manifest lists the plugin step as done, and a rerun of `plan` shows only the remaining steps.
- `apply` twice on a fixture home → the second run reports no changes, and the instruction file has exactly one kit block.
- Fixture instruction file with a ccync block and a codebase-memory block → after `apply`, both blocks are byte-identical to before.
- CRLF `AGENTS.md` with a BOM → after `apply`, the file is still CRLF with a BOM, and only the kit block differs.
- Fixture home path that contains a space → `apply` and `verify` pass.
- Fallback command from the block, with `<home>` resolved, run from cmd.exe and from PowerShell → the check runs and prints findings.
- Upgrade fixture from version A to B → the launcher imports B, the MCP entry still works, and `uninstall` removes A only when its hash matches.
- Target file locked during rename on Windows → retries, then exit non-zero with the file path, and the original file is intact.
- Fixture with the kit block edited by hand → `uninstall` keeps the block and reports it as changed.
- Fixture where the user re-pointed `clear-writing-kit-textlint` to another command → `uninstall` keeps the entry and reports it as changed.
- Fixture `settings.json` with unrelated keys → after `apply`, only `outputStyle` differs, and the `plan` diff showed the old value.
- Runtime fixture with only Deno on PATH, installer run with `deno` → MCP command uses `deno`.
- Host CLI that is a `.cmd` shim, with an argument that contains a space and `&` → the argument arrives unchanged, on Node, Deno, and Bun.
- Bundled checker on Node, Deno, and Bun → findings equal the current `writing/check.cjs` for all six profiles on `writing/test` fixtures.
- `verify` with a payload whose kuromoji dictionary was removed → ja-JP call fails, result "incomplete".
- `verify` after `outputStyle` was reset by another writer → result "incomplete".
- Fixture with `~/.agents/skills/accurate-answer` → `verify` reports "incomplete" and names the legacy skill.
- Fixture configuration file containing a token → no output line contains the token.

## Success Criteria

- On the owner's machine, a new Codex session can name the `coding-agent-writing` skill, list `clear-writing-kit-textlint`, and call `lintText` on a zh-TW draft.
- On the owner's machine, a new Claude Code session uses the `clear-writing-kit` output style.
- Every host marked verified has passed `apply`, rerun with no diff, `verify`, and `uninstall` on a fixture home. Other hosts are listed as unverified, and `apply` refuses them.
- The same `dist/cwk.mjs` runs `install`, `check`, and `mcp` on Node, Deno, and Bun.

## Risks

- Host plugin formats and CLIs differ and change between versions. Copilot CLI, opencode, and Antigravity support is not verified.
- The Japanese preset loads kuromoji dictionary files from a directory at runtime. The dictionary on disk is 17 MB, so the payload cannot be a single file.
- `writing/check.cjs` currently spawns the textlint CLI from `node_modules`. The new entry must run textlint in-process. The parity test guards against behavior drift.
- Environment-variable host detection is verified only for Claude Code.
- Users without Node, Deno, or Bun must install one manually before installation.
- Append-only blocks make instruction files grow. The 2 KB limit and single-block replacement bound the growth.
- During transition on the owner's machine, the ccync block and the kit block both exist and name different skills until ccync's source is updated.
- An agent may run `apply` without real user confirmation. `--plan-hash` proves only that the applied plan matches a shown plan, not that a person read it.
- Claude Code can rewrite `~/.claude/settings.json` during the running session and drop the `outputStyle` change. `verify` detects this but cannot prevent it.
- On Windows, host CLIs are often `.cmd` shims. Since Node 20.12.2, spawning a `.cmd` file without a shell fails, and spawning through `cmd.exe` exposes arguments to cmd.exe parsing. Deno and Bun spawn behavior differs from Node.

### Trust boundaries

| Boundary | Crossing | Control |
| --- | --- | --- |
| Agent → installer | The agent chooses `--agent` and runs `apply` | Environment cross-check, plan hash, `INSTALL.md` confirmation step |
| Installer → host configuration | Writes instruction files and settings, and registers plugins and MCP entries | Host CLI first, marker-bounded atomic edits, backups, manifest hashes and fingerprints |
| Installer → files that may hold secrets | Reads `config.toml` and `settings.json` | Parse only needed keys, never print values |
| Agent → MCP server | Sends draft text | One `lintText` tool, no file access, no fixes |

## Open Questions

None

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

---

## Status

Workflow: IMPLEMENT
Step: 0 of 7
Last activity: 2026-10-02 — T-01 converged; T-02 task-quality check passed against its single-tool MCP contract.
Next step: Implement T-02 single-tool stdio MCP server.
Current Task: T-02
Task Base Commit: 1028e0356c4d9f398c000346d53fa4d053ec3e96
Task Final Commit: —
Test Retry Count: 0
Review Retry Count: 0

### Deviations

| Date | Task | Deviation | Reason |
| --- | --- | --- | --- |

| 2026-10-02 | T-01 | Owner authorized ignoring generated .dev/pipeline records. Administrative commit 5d5a476 precedes implementation dfe8fa1; task base advanced to it without discarding output. Owner replaced the shared ignore rule in b4700fa, so generated records now use local .git/info/exclude. Tested HEAD is b4700fa, with implementation unchanged. | Generated receipts and loop-log were outside the implementation allowlist. Owner .gitignore is authoritative. Already tracked evidence remains tracked. |

### Handoff Notes

New prompt. Source approval and planning reviews are carried forward. T-03 is the payload gate. If it returns stop, T-05 onward cannot start. Human review occurs once after all automated tasks and goal-backward verification. T-01 implementation dispatch completed and was committed. Working tree was clean at b4700fa before this test cursor update. Boundary verification passed. Independent testing and audit have not run. Generated bundle whitespace warnings come from embedded dependency strings and remain unchanged to preserve build reproducibility.

Dispatch: phase=implement task=T-01 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f873-64f3-78d2-82e3-dcf2f87828f2 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-01/1790874706-710513300-000000-T-01-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

#### Human Handback — boundary-scope-decision

Status: RESOLVED
Reason: boundary-scope-decision
Task: T-01
Phase: BOUNDARY
Producer: BOUNDARY
Producer state: fail. Generated evidence is outside the task allowlist: .dev/pipeline/20261001/loop-log.ndjson, .dev/pipeline/feat-cross-agent-plugin-installer/T-01/T-01-implement.receipt.md, .dev/pipeline/feat-cross-agent-plugin-installer/preflight.receipt.md. Implementation changes remain uncommitted. No test or audit dispatch has run.
Git HEAD: cc8bae0aec01707f5b83722349e0be9341f61098
Next human step: Resolved by owner authorization "allow". The owner's .gitignore version is committed as b4700fa. Generated .dev/pipeline records are locally ignored via .git/info/exclude. Implementation and evidence are retained.

#### Retry Handoff — T-01 / TEST

- Status: RESOLVED
- Problem: TP-01 failed: Japanese preset rule IDs omit ja-technical-writing/; attached -c<file> is treated as a path instead of rejected.
- Evidence:
  - Test Results: T-01 2026-10-02, FAIL, 3 passed and 1 failed. TP-02, TP-05, and TP-31 passed.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Independent test after implementation dfe8fa1, tested HEAD b4700fa.
     - Result: TP-01 rule ID parity and attached override rejection failed.
     - Validation: T-01-test.receipt.md; completed agy test dispatch b77d1191-051a-409d-bd14-9387b2afd3a4.
     - Commit: b4700fa692cf97e3da6b7fd96de45c48ae9ebfe7
- Next human step: Resolved by fix dd7f4ff and independent retest. TP-01, TP-02, TP-05, and TP-31 passed; TP-01 had 76/76 passing probes.

Dispatch: phase=implement task=T-01 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f889-d1dc-75e3-8b7a-48879d05b90a log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-01/1790876176-377301200-000000-T-01-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Fix commit dd7f4ff updates Japanese preset rule prefixes and attached -c rejection, with rebuilt dist. Pre-commit and committed-range boundaries pass; worktree was clean before the retest cursor update.

Dispatch: phase=test task=T-01 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=b77d1191-051a-409d-bd14-9387b2afd3a4 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-01/1790875719-841095900-000000-T-01-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=test task=T-01 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=967ab925-9cd6-4625-8f10-83a1cf7c92e1 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-01/1790876289-206536800-000000-T-01-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=audit task=T-01 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=1dea1239-e64d-4f8c-9fb6-d99be6bd3b8c log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-01/1790876586-925505000-000000-T-01-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

## Tasks

Each task is one deliverable behavior that the owner can review as one commit. Tasks are not split by file or by language, and no task only runs checks. This follows the owner's refining rules, which take precedence over GAL's single-file preference. Blast radius per task is listed in Targets.

Shared conventions for every task:

- TypeScript sources live in `src/` at the repository root. Dependencies live in `writing/package.json`. The build uses esbuild with `writing/node_modules` as the module path and writes `dist/`. Development tests may use Node's built-in type stripping (Node >= 23.6). The shipped `dist/` must run on Node >= 20.18, Deno >= 2, and Bun.
- Every installer module takes the home directory and environment as parameters. Only `src/cli.ts` reads the real home and environment.
- Host CLIs are called by name through `src/install/spawn.ts`, so tests can put stubs first on PATH.
- No module prints the contents of a host configuration file.
- A task that changes `src/` rebuilds and commits `dist/` in the same commit.
- Every `install` subcommand exits non-zero on a host mismatch, a refused unverified host, a failed step, or an "incomplete" result, and exits 0 otherwise.
- `src/install/` modules use only `node:fs` and `node:path` APIs that Deno and Bun support.
- The tester writes test code later from the Test Plan. Refining writes no test code.

Evidence E: each task's tester receipt starts with the task title and records every TP ID listed in the task, the exact commands, observed output or file paths, the result, the commit hash, and any NotRun limits. Headless dispatch also needs an executor log in the `completed` state plus a verified write-back. Exit code 0 alone is not a pass.

Steps map to tasks as follows: Step 1 → T-01 to T-03, Step 2 → T-04, Step 3 → T-05 and T-06, Step 4 → T-07, Step 5 → T-08 to T-11, Step 6 → T-12, Step 7 → the human review checklist. T-03 is a gate: if it ends in "stop", T-05 onward do not start.

- [x] T-01 — Ship the bundled `cwk check` command *(dd7f4ff)*
  - Commit: dd7f4ff37c9c9f6786cbb6116564045473ad4ad9
  - Targets: `writing/package.json`, `writing/package-lock.json`, `src/rules.ts`, `src/check.ts`, `src/cli.ts`, `dist/`
  - Depends on: None
  - Change: Add `esbuild` and `@modelcontextprotocol/server` as exact-version devDependencies, using the server version textlint 15.8.0 already resolves. Add a `build` script that bundles `../src/cli.ts` to `../dist/cwk.mjs` (ESM, platform node, `nodePaths` set to `writing/node_modules`, a `createRequire` banner for CommonJS dependencies). In `src/rules.ts`, statically import every rule and preset referenced by `writing/profiles/*.json` and map each name to its module. In `src/check.ts`, export `lintText({ text, language, genre, filename })`: validate `language` (`en-US`, `zh-TW`, `ja-JP`) and `genre` (`document`, `conversation`) and throw otherwise; build the kernel descriptor from the profile JSON imported at build time and the rule map, never through `loadTextlintrc`, because that resolves packages by name at runtime; call `createLinter` once per profile per process and cache it; throw on an unmapped rule or zero rules; export a load counter. In `src/cli.ts`, add a subcommand router and `check --language --genre` reading `--stdin` with optional `--stdin-filename`, or file paths, printing textlint's default format, exiting 0, 1, or 2, and rejecting `--config`, `--rule`, `--rulesdir`, `--no-textlintrc`, and `-c`. Keep `writing/check.cjs` unchanged as the parity reference. Build and commit `dist/`.
  - Acceptance: `dist/cwk.mjs check` matches `writing/check.cjs` on Node for the existing test cases, and each profile loads once.
  - Evidence: E + TP-01, TP-02, TP-05, TP-31.

- [ ] T-02 — Ship the `cwk mcp` server with one `lintText` tool
  - Targets: `src/mcp.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-01
  - Change: Build an stdio MCP server on `@modelcontextprotocol/server` with one tool, `lintText`. Its input schema has `text`, the `language` and `genre` enums, and optional `filename`. It calls `lintText` from `src/check.ts` and returns findings as structured content. Validation errors become MCP errors. Add the `mcp` subcommand. Expose no file-reading or fix tools. Rebuild `dist/`.
  - Acceptance: An MCP client lists one tool and gets zh-TW findings from it.
  - Evidence: E + TP-03, TP-05.

- [ ] T-03 — Make the payload run on Node, Deno, and Bun
  - Targets: `writing/package.json`, `dist/`, `.dev/research/payload-spike.md`
  - Depends on: T-02
  - Change: Extend the build to the first layout that passes, in this order: (1) bundle plus a sibling `dist/dict/` copied from the kuromoji dictionary, after finding and recording how the installed kuromojin version lets the rules point their dictionary path there through an option or environment variable; layout (1) fails if no such mechanism exists; (2) bundle plus a pruned production-only `dist/node_modules`. A layout passes when TP-01 parity holds on Node, Deno, and Bun and cold start is under 3 s on each. If both pass, take the smaller. Commit `dist/` and write the report with layout, size, cold-start times, and runtime versions. If neither passes, commit no layout change, write the report, and stop.
  - Acceptance: The committed payload passes parity on all three runtimes, and the report records the numbers.
  - Evidence: E + TP-04, TP-05.

- [ ] T-04 — Record host capabilities as a verified host table
  - Targets: `.dev/research/host-capabilities.md`, `src/hosts.ts`
  - Depends on: None
  - Change: Survey Claude Code, Codex, Copilot CLI, opencode, and Antigravity CLI. For each, record the installed version, plugin format, plugin skill support, plugin install, remove, and list commands, MCP add, remove, and list or get commands, the environment variable that relocates the configuration directory for fixture isolation, the global instruction file path, output-style support, and identity environment variables by exact name. Capture command output for installed hosts and cite official URLs otherwise. Mark an item verified only with captured output or an official source for the installed version. Encode the same data in `src/hosts.ts` as a typed constant, with paths as functions of an injected home directory and an evidence string per record.
  - Acceptance: The table and the survey agree row by row, and every verified record has evidence.
  - Evidence: E + TP-06.

- [ ] T-05 — Ship the output style from the repository
  - Targets: `scripts/generate-output-style.py`, `output-styles/clear-writing-kit.md`, `tests/test_artifacts.py`
  - Depends on: T-03 (gate only, no technical dependency)
  - Change: Change `DEFAULT_OUTPUT` to `ROOT / "output-styles" / (PROJECT_NAME + ".md")`, using the repository root from `artifacts.py`. Generate and commit the file. Update `test_default_style_name_changes_without_deleting_existing_style` to the new default, and add a check that the committed file matches `render_claude()`.
  - Acceptance: The generator writes only the repository file, and Python tests pass.
  - Evidence: E + TP-07, TP-10.

- [ ] T-06 — Ship the generated instruction block
  - Targets: `scripts/artifacts.py`, `scripts/generate-agents-block.py`, `install/agents-block.md`, `tests/test_artifacts.py`
  - Depends on: T-03
  - Change: Add `render_agents_block()` to `artifacts.py`. It reads the skill version from `skills/coding-agent-writing/SKILL.md` metadata and emits the begin and end markers, the core rules from `persistent_core()`, the skill name, the `lintText` tool, and the fallback command `<runtime command> <home>/.clear-writing-kit/cwk.mjs check`, listing the forms `node`, `deno run -A`, and `bun`, with an instruction to resolve `<home>`. Add `generate-agents-block.py` following the `generate-output-style.py` pattern, with default output `install/agents-block.md` and `--check`. Raise an error at 2,048 bytes or more. Add tests.
  - Acceptance: `--check` passes on the committed block, and the size, marker, and content rules hold.
  - Evidence: E + TP-08, TP-09.

- [ ] T-07 — Ship plugin manifests for every verified host
  - Targets: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, the Codex marketplace file, and one manifest per other verified host with plugin skills, at the paths in the survey
  - Depends on: T-04, T-05
  - Change: Declare `clear-writing-kit` for each verified host with plugin skill support, using the field names recorded in the survey. Every manifest ships only `skills/coding-agent-writing/`. The Claude manifest also ships `output-styles/`. Add the marketplace entries that point at the repository root. Declare no MCP server and never reference `web-skills/`. A verified host without plugin skills gets no manifest, because `skillCopyDir` in `src/hosts.ts` covers it.
  - Acceptance: Each manifest installs on an isolated fixture home and lists the skill.
  - Evidence: E + TP-10.

- [ ] T-08 — Ship `cwk install plan`
  - Targets: `src/install/spawn.ts`, `src/install/runtime.ts`, `src/install/identity.ts`, `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/block.ts`, `src/install/plan.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-03, T-04, T-06, T-07
  - Change: `spawn.ts`: export `which(name, env)` honoring PATHEXT, and `run(command, args, options)` that runs a `.cmd` or `.bat` through `cmd.exe /d /s /c` with every argument quoted for cmd.exe and other files directly, returning exit code, stdout, and stderr. `runtime.ts`: `selectRuntime(env)` picks Node >= 20.18, then Deno >= 2 (with `run -A`), then Bun, through `which()`, and returns an error value when none qualifies; `plan` reports that error and gives no hash. `identity.ts`: `resolveHost(agentArg, env)` requires `--agent` and checks identity variables by exact name, never prefix. A mismatch is a missing required variable of the requested host, or an exact-name variable of another host present without the requested host's variable. `fsutil.ts`: `readText(path)` returns text plus EOL, BOM, and trailing-newline state. `manifest.ts`: schema with version, file entries (path, SHA-256), CLI entries (host, kind, name, command fingerprint), and completed steps; a missing file is empty and an unparsable file is an error. `block.ts`: the pure function `upsertBlock(text, block)` replaces the one existing kit block or appends one after a single blank line in the file's EOL style, throws on two blocks, never changes bytes outside the markers, and returns the new text and whether anything changed. `plan.ts`: `computePlan(ctx)` resolves the host, selects the runtime, reads current plugin and MCP state through the host list or get commands, and returns ordered steps (payload, plugin, MCP, block, output style), line diffs of the kit's own block or entries only, computed from `upsertBlock` and without a diff dependency, so a rerun shows no diff, the legacy conflict list as defined in R-15 (an `accurate-answer` skill directory, a block naming `accurate-answer`, an `outputStyle` other than `clear-writing-kit`), and a SHA-256 plan hash over installer version, payload digest, and normalized target state, excluding timestamps and backup paths. An unverified host gets manual steps and no hash. Nothing is written. Add `install plan --agent` to `src/cli.ts` and rebuild `dist/`.
  - Acceptance: `plan` is read-only, deterministic, reports conflicts, and refuses unverified hosts.
  - Evidence: E + TP-05, TP-11, TP-12, TP-13, TP-14, TP-15, TP-16, TP-17, TP-22, TP-28, TP-32, TP-34, TP-36.

- [ ] T-09 — Ship `cwk install apply`
  - Targets: `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/payload.ts`, `src/install/settings.ts`, `src/install/apply.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-08
  - Change: `fsutil.ts`: add `writeTextAtomic(path, text, format)` writing a sibling temporary file and renaming it over the target, retrying a locked rename 5 times 100 ms apart before an error that names the path, and `backup(path, backupDir)`. `manifest.ts`: add `saveManifest` through `writeTextAtomic`. `payload.ts`: copy `dist/` to `<home>/.clear-writing-kit/<version>/` and write the launcher `<home>/.clear-writing-kit/cwk.mjs` with one dynamic import of the active version, keeping older versions. `settings.ts`: `setOutputStyle(path, value)` changes only `outputStyle`, keeps key order and indentation, backs up first, returns the old value, creates a missing file containing only `outputStyle`, and throws on invalid JSON before writing. `apply.ts`: `applyPlan(ctx, planHash)` recomputes the plan and writes nothing on a mismatch, backs up targets, writes the block text computed by `plan`, runs the other steps, registers `clear-writing-kit-textlint` with the launcher and the planned runtime, records each completed step in the manifest immediately, and on a failed step stops and returns the step, its output, and the completed steps. Add `install apply --agent --plan-hash` and rebuild `dist/`.
  - Acceptance: `apply` installs everything once, is idempotent, preserves file format and foreign blocks, and resumes after a failure through `plan`.
  - Evidence: E + TP-09, TP-14, TP-15, TP-17, TP-18, TP-19, TP-20, TP-21, TP-22, TP-23, TP-28, TP-29, TP-30, TP-32, TP-33, TP-35, TP-36, TP-37.

- [ ] T-10 — Ship `cwk install verify`
  - Targets: `src/install/verify.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-09
  - Change: `verify(ctx)` reads the registered MCP command through the host list or get command, starts it, and speaks MCP JSON-RPC over stdio directly (`initialize`, `tools/list`, `tools/call`) with no client library. It calls `lintText` once per language with a fixture sentence that must produce a finding, with a 30 s timeout per call. It re-reads `outputStyle` in Claude Code, checks block count and size, and lists legacy conflicts. It returns "pass" only when every check ran and passed, and "incomplete" with each failed or skipped check otherwise. Add `install verify` and rebuild `dist/`.
  - Acceptance: `verify` proves the server works per language and never reports pass with a missing or failed check.
  - Evidence: E + TP-16, TP-17, TP-24, TP-28, TP-36.

- [ ] T-11 — Ship `cwk install uninstall`
  - Targets: `src/install/block.ts`, `src/install/uninstall.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-09
  - Change: Add `removeBlock(text, expectedHash)` to `block.ts`, where `expectedHash` is the SHA-256 of the block bytes as written. `uninstall(ctx)` removes manifest file entries whose hash matches, removes CLI entries through the host remove command when the current command matches the fingerprint, removes the kit block when its hash matches, and removes payload versions whose hashes match. It reports every kept item with the reason and keeps backups. Add `install uninstall` and rebuild `dist/`.
  - Acceptance: `uninstall` restores a clean fixture home and keeps every changed item.
  - Evidence: E + TP-17, TP-25, TP-28, TP-36.

- [ ] T-12 — Document installation for agents and people
  - Targets: `INSTALL.md`, `README.md`, `docs/verification.md`
  - Depends on: T-10, T-11
  - Change: Write `INSTALL.md` with the R-19 procedure. The agent works from a repository clone, and `dist/` is committed, so no `npm install` is needed. It checks for `node`, `deno`, and `bun` and stops with official install URLs when none exists, without installing a runtime. It runs `install plan --agent <self>`, shows the result, waits for explicit confirmation, runs `install apply` with the plan hash, runs `install verify`, reports passed and failed steps separately, never edits host configuration files directly, and asks for a new session for the behavior check. In all three README language sections, add the same installer commands, replace the statement that the repository does not edit global agent settings with what the installer changes and how to uninstall, and update the output-style generator description. Document `verify` in `docs/verification.md`. Do not hand-edit `knowledge/`.
  - Acceptance: `INSTALL.md` covers every R-19 item, and the README and docs checks pass.
  - Evidence: E + TP-26, TP-27.

## Deferred Follow-up

None.

## Analyze

Pending execution analysis. Use the approved task dependencies and T-03 gate.

## Test Plan

Each row checks one behavior and may cover several tasks. An agent runs every row. Checks that need a person are in the human review checklist under Step 7, not here. The tester writes the test code during the pipeline from these rows and the public interfaces. Evidence E is defined under Tasks.

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | integration | `dist/cwk.mjs check --language <l> --genre <g> --stdin` and `writing/check.cjs` report the same rule IDs, lines, and columns for every case in `writing/test/checkers.test.cjs`, on Node. Exit codes match for clean and finding cases. Launcher errors such as an unknown language exit 2 from `dist/cwk.mjs` (the reference exits 1). E. | T-01 |
| TP-02 | unit | After repeated `lintText` calls on all six profiles, the exported load counter shows exactly one load per profile. E. | T-01 |
| TP-03 | integration | An MCP client started against `dist/cwk.mjs mcp` lists exactly one tool, `lintText`, with `text`, `language`, `genre`, and optional `filename`. A zh-TW call returns findings. An invalid enum returns an MCP error. No tool reads files or applies fixes. E. | T-02 |
| TP-04 | integration | With the committed `dist/` layout, TP-01 parity holds on Node, Deno (`deno run -A`), and Bun, and cold start is under 3 s on each. `.dev/research/payload-spike.md` records the layouts tried in order, payload size, cold-start times, and runtime versions. If no layout passes, the result is "stop: return to deep-planning", not pass. E. | T-03 |
| TP-05 | integration | The committed `dist/` equals a fresh `npm --prefix writing run build`. E. | T-01, T-02, T-03, T-08, T-09, T-10, T-11 |
| TP-06 | unit | Every record in `src/hosts.ts` matches a row of `.dev/research/host-capabilities.md`, field by field. Every `verified: true` record cites captured output or an official URL in that row. No path in `src/hosts.ts` uses `os.homedir()`. E. | T-04 |
| TP-07 | unit | `python scripts/generate-output-style.py` with no arguments writes only `output-styles/clear-writing-kit.md` in the repository, never under `~/.claude`. `--check` fails on a stale file. `python -m unittest discover -s tests -v` passes. E. | T-05 |
| TP-08 | unit | `python scripts/generate-agents-block.py --check` passes on the committed `install/agents-block.md`. The block starts with `<!-- clear-writing-kit:begin v=2.0.0 -->`, ends with `<!-- clear-writing-kit:end -->`, is under 2,048 bytes, names `coding-agent-writing`, `lintText`, and the fallback command with `<runtime command>` and `<home>`, and has no drive letter or user path. A changed skill version makes `--check` fail. E. | T-06 |
| TP-09 | integration | The fallback command from `install/agents-block.md`, with `<home>` resolved and each runtime command form (`node`, `deno run -A`, `bun`), prints findings when run from cmd.exe and from PowerShell after `apply` on a fixture home. E. | T-06, T-09 |
| TP-10 | integration | For each host marked verified, its plugin installs from the local repository path on a fixture home isolated through the configuration-directory variable recorded in the survey, and the installed plugin lists `coding-agent-writing`. The Claude plugin also lists the `clear-writing-kit` output style. No manifest declares an MCP server or references `web-skills/`. E. | T-05, T-07 |
| TP-11 | unit | `--agent claude` with `CLAUDECODE` and `CODEX_COMPANION_SESSION_ID` set resolves to `claude`. `--agent codex` with only `CLAUDECODE` set is a mismatch error with no plan hash. A missing `--agent` is an error. E. | T-08 |
| TP-12 | unit | With PATH fixtures, runtime selection picks Node >= 20.18 first, then Deno >= 2, then Bun, skips Node 18, and returns the absolute path. On Windows, `which()` honors PATHEXT. E. | T-08 |
| TP-13 | integration | `plan` on a fixture home leaves every file hash unchanged, and its diffs show only the kit's own block and entries. E. | T-08 |
| TP-14 | integration | Two `plan` runs on unchanged state give the same hash. `apply` with a hash taken before a target changed writes nothing and names the changed target. E. | T-08, T-09 |
| TP-15 | integration | On a host marked unverified, `plan` lists manual steps without a hash, and `apply` refuses to run. E. | T-08, T-09 |
| TP-16 | integration | `plan` and `verify` report each legacy conflict planted in a fixture home: an `accurate-answer` skill directory, a block that names `accurate-answer`, and an `outputStyle` other than `clear-writing-kit`. None of them is deleted. E. | T-08, T-10 |
| TP-17 | integration | No output line of `plan`, `apply`, `verify`, or `uninstall` contains a token planted in a fixture host configuration file. E. | T-08, T-09, T-10, T-11 |
| TP-18 | integration | `apply` on a fixture home with host CLI stubs installs the plugin, registers `clear-writing-kit-textlint` with the launcher path and the planned runtime, writes one kit block, sets `outputStyle` for Claude, and records each step in the manifest. A second `apply` changes nothing. E. | T-09 |
| TP-19 | integration | `apply` on a CRLF `AGENTS.md` with a BOM keeps CRLF and the BOM. A home path with a space works. E. | T-09 |
| TP-20 | integration | A host CLI stub that fails at the MCP step stops `apply`, the manifest lists the completed steps, and the next `plan` shows only the remaining steps. E. | T-09 |
| TP-21 | integration | `apply` on a fixture `settings.json` with unrelated keys changes only `outputStyle`, keeps key order and indentation, backs up the file, and the `plan` diff showed the old value. E. | T-09 |
| TP-37 | integration | `apply` for Claude Code with an invalid `settings.json` stops before writing any file. E. | T-09 |
| TP-22 | integration | A `.cmd` host CLI stub receives an argument containing a space and `&` unchanged when the installer runs on Node, Deno, and Bun on Windows. E. | T-08, T-09 |
| TP-23 | integration | `apply` copies `dist/` to `<home>/.clear-writing-kit/<version>/` and writes the launcher. Upgrading from version A to B rewrites the launcher to B, keeps A, and the MCP entry still answers through the launcher. E. | T-09 |
| TP-24 | integration | After `apply`, `verify` reads the registered MCP command, starts it, and gets at least one finding per language. It returns "incomplete" when the payload dictionary is removed, when `outputStyle` is reset, when a legacy writing skill exists, and when an MCP stub never answers within the 30 s per-call timeout. The cases pass with a home path that contains a space. E. | T-10 |
| TP-25 | integration | `uninstall` after `apply` returns the fixture home to its pre-install bytes, except the backup folder. A hand-edited block, a re-pointed `clear-writing-kit-textlint` entry, and a changed payload file are each kept and reported. After an upgrade from A to B, it removes A only when its hash matches. E. | T-11 |
| TP-26 | integration | An agent checks `INSTALL.md` against R-19 item by item and quotes the anchoring `INSTALL.md` line for each item: runtime preflight with official install URLs and no automatic install, work from a repository clone with committed `dist/`, `plan` → show → wait → `apply --plan-hash` → `verify`, separate pass and fail reporting, a ban on direct configuration edits, and a new session for the behavior check. An item without a quotable line fails. E. | T-12 |
| TP-27 | integration | README sections in all three languages show the same installer commands, `test_readme_languages_have_equal_commands_and_local_links` passes, and the statement that the repository does not edit global agent settings is gone. `npm --prefix writing run lint` and `npm --prefix writing run okf:check` pass. E. | T-12 |
| TP-28 | integration | `install --help` on Node, Deno, and Bun lists `plan`, `apply`, `verify`, and `uninstall`. E. | T-08, T-09, T-10, T-11 |
| TP-29 | integration | A target locked during rename on Windows makes `apply` retry 5 times 100 ms apart, then fail with the path, and the original bytes are unchanged. E. | T-09 |
| TP-30 | integration | After `apply` on a fixture file that holds a ccync block and a codebase-memory block, both blocks are byte-identical to before. E. | T-09 |
| TP-31 | unit | `lintText` with an unknown language or genre throws and never returns an empty report. E. | T-01 |
| TP-32 | integration | A corrupted manifest makes `plan` and `apply` fail with an error, never treat it as empty. E. | T-08, T-09 |
| TP-33 | integration | A target file that already holds two kit blocks makes `apply` fail without writing any file. E. | T-09 |
| TP-34 | integration | With no qualifying runtime on PATH, `plan` reports an error and gives no plan hash. E. | T-08 |
| TP-35 | integration | `apply` for Claude Code with no `settings.json` creates the file containing only `outputStyle`. E. | T-09 |
| TP-36 | integration | Each `install` subcommand exits non-zero on a host mismatch, a refused unverified host, a failed step, or an "incomplete" result, and exits 0 otherwise. E. | T-08, T-09, T-10, T-11 |

## Test Results

Not run. No execution tests have been performed.

### [T-01] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 4 | Passed: 3 | Failed: 1 | Skipped: 0
Verdict: FAIL
Evidence: node scratch probes testing TP-01, TP-02, TP-05, TP-31: TP-01 failed on preset rule ID prefix divergence and unhandled -c<file> override flag.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-01: `dist/cwk.mjs check` matches `writing/check.cjs` on Node for test cases and exit codes | Yes | FAIL | Preset rules omit `ja-technical-writing/` prefix in ruleId; `-c<file>` (e.g. `-cabsent.json`) is parsed as file path instead of rejected override |
| TP-02: Profile caching loads each profile once per process | Yes | PASS | `loadCounter` initialized to 0, rose to 6 after loading all 6 profiles, remained at 6 across repeated calls |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build; `git status --porcelain dist/` produced 0 diff |
| TP-31: `lintText` throws on unknown language or genre | Yes | PASS | Throws on unknown language, unknown genre, or empty fields; loadCounter remains 0 |

#### Failed Tests

- `TP-01: preset ruleId prefix parity` — When checking Japanese text triggering rules in `preset-ja-technical-writing` (e.g. `no-mix-dearu-desumasu` or `max-kanji-continuous-len`), `writing/check.cjs` outputs `ja-technical-writing/no-mix-dearu-desumasu` and `ja-technical-writing/max-kanji-continuous-len`, whereas `dist/cwk.mjs check` outputs `no-mix-dearu-desumasu` and `max-kanji-continuous-len`. TP-01 requires reporting the exact same rule IDs.
- `TP-01: -c<file> override flag rejection` — `node dist/cwk.mjs check --language en-US --genre document -cabsent.json` treats `-cabsent.json` as a file argument (`ENOENT: no such file or directory, open '.../-cabsent'`) instead of rejecting it as an unsupported override flag (`Profile overrides are not supported by this launcher`).

#### Not Tested

- None. All covering test plan rows for T-01 (TP-01, TP-02, TP-05, TP-31) were directly tested.

### [T-01] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 4 | Passed: 4 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff), node probes verify TP-01 parity (76/76 checks passed matching writing/check.cjs, ja-technical-writing/ prefix, and -c override rejection), profile caching (TP-02: exactly 1 load per profile across all 6 profiles), and input validation (TP-31: throws on unknown language or genre).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-01: `dist/cwk.mjs check` matches `writing/check.cjs` on Node for test cases and exit codes | Yes | PASS | 76/76 checks passed: rule IDs (including `ja-technical-writing/` preset rules), lines, columns, clean exit 0, finding exit 1, launcher error exit 2, and override flag rejection including attached `-c<file>` |
| TP-02: Profile caching loads each profile once per process | Yes | PASS | `loadCounter` initialized to 0, rose to 6 after loading all 6 profiles, remained at 6 across repeated calls |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build; `git status --porcelain dist/` produced 0 diff |
| TP-31: `lintText` throws on unknown language or genre | Yes | PASS | Throws descriptive error on unknown language, unknown genre, or empty fields; loadCounter remains 0 |

#### Failed Tests

- None. All 4 covering tests passed.

#### Not Tested

- None. All covering test plan rows for T-01 (TP-01, TP-02, TP-05, TP-31) were directly tested.
## Review Results

### Architecture Review

Verdict: APPROVE (golem-architect, 2026-10-02, second pass). First pass returned REVISE with four blocking findings, all resolved in this revision:

- B1 presence-only verification → R-14 functional `lintText` calls per language and `outputStyle` re-read.
- B2 undefined payload location and upgrade path → R-07 versioned payload with launcher, R-18 upgrade.
- B3 CLI-created entries cannot be hashed → R-16 and R-17 command fingerprints, namespaced server name.
- B4 non-atomic, format-changing writes → R-05 and the CRLF, BOM, lock, and space-in-path tests.

Non-blocking items folded in: Windows `.cmd` spawning (risk and test), block fallback for hosts without MCP (R-11), deterministic plan hash (R-03), output-style generator default target (Step 3), launcher instead of a symlink (R-07), and home-directory resolution in the fallback command (R-11).

Accepted deviation: the MCP server is registered only through host CLIs, not through plugin manifests. The runtime is chosen per machine during `apply`, which a static plugin manifest cannot express, and one registration path rules out duplicates. Installing the plugin alone therefore gives no MCP server, and `verify` reports that gap.

Minimalism: two bundles merged into `dist/cwk.mjs`; host JSON replaced by `src/hosts.ts`; MCP reduced to `lintText`; `.claude.json` reading removed; resume reduced to an idempotent `plan`; skill copying limited to verified hosts without plugin skills; no compiled binaries in version 1.

Open question closures (class A):

- OQ-01 closed. A host is supported only after the Step 2 survey and a full fixture cycle (R-13). `apply` refuses unverified hosts. Trade-off: fewer hosts in v1, but no unproven support claim.
- OQ-02 closed. Step 1 is a gated spike with a fixed fallback order and a parity, size, and 3-second cold-start criterion. kuromoji loads its 17 MB dictionary from a directory, so the payload is a directory (R-07).
- OQ-04 closed. One MCP server with one `lintText` tool and per-process profile caching (R-10). textlint's own server fixes one configuration at startup. About 80 lines on `@modelcontextprotocol/server`, which textlint 15.8.0 already depends on, replace six registrations.
- OQ-06 closed. Generators stay in Python because their outputs are committed and the installer never generates at runtime. Python stays a development-only dependency, and `--check` blocks drift.

Owner closures (class H, 2026-10-02):

- OQ-03 closed by the owner: version 1 ships no compiled binary. The payload is the committed JavaScript bundle and dictionary, which needs Node, Deno, or Bun but no package install and no network. `INSTALL.md` checks for a runtime first. This corrects an earlier rationale: R-09 never reaches a "no runtime" state, because the installer itself needs a runtime.
- OQ-05 closed by the owner: the installer overwrites any previous `outputStyle` after a backup, and the `plan` diff shows the old value (R-12).

<!-- ARCH_REVIEW: CLEAR -->

### Business Review

Not requested. The plan has no business rules, pricing, permissions, notifications, onboarding, or eligibility.

### Design Review

Not requested. The plan has no customer-facing interface.

**Documentation Structure Review (steward)**

Result: no issues. The plan is at `.dev/plans/feat-cross-agent-plugin-installer.md` with a `feat-` slug and an EN semantic draft beside it. It is the only plan in `.dev/plans/`. All template sections are present. Both diagrams match R-01 to R-18 and the Files list, including the launcher and the CLI-only MCP registration. The name `accurate-answer` appears only as the legacy item that the installer detects. It is not residue.

### Engineering Review

Verdict: CLEAR (STAGE 3.5, golem-architect, 2026-10-02).

- Owner rules applied: one task per deliverable behavior, reviewable as one commit; no split by file or language; no verification-only tasks; one behavior per TP, all agent-run; one human review as a checklist after all automated tasks and goal-backward verification (Step 7). These rules take precedence over GAL's single-file preference. The largest tasks are T-08 (8 source files plus `dist/`) and T-09 (6 source files plus `dist/`), each one behavior.
- Lens 1, structural atomicity: APPROVE. 12 tasks in a valid dependency order. Earlier rounds fixed bundle-safe rule loading (`src/rules.ts`), queries of current CLI-managed state, removal of `--all`, a shared `which()`, explicit retry and hash definitions, and specs lost during the regrouping (`saveManifest`, identity mismatch rule, runtime error value, R-15 conflict list, missing `settings.json`, exit-code rule). The last blocking item was a dependency-order defect: `plan` needs `upsertBlock` before T-09 exists. The orchestrator moved the pure `upsertBlock` into T-08 exactly as the architect specified and checked the result. No further architect pass ran on that single move.
- Lens 2, minimum observable probe: APPROVE. 37 TPs, each one behavior with evidence beyond exit 0. `INSTALL.md` conformance requires quoted anchor lines (TP-26). No human check appears in the Test Plan.
- Diagram and file list: in sync.
- Gate: T-03 decides the payload layout. If it ends in "stop", T-05 onward do not start, and the plan returns to deep-planning.

<!-- ENG_REVIEW: CLEAR -->

### [T-01] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit reviewed T-01 changes covering bundled `cwk check` implementation across `src/rules.ts`, `src/check.ts`, `src/cli.ts`, `writing/package.json`, and `dist/cwk.mjs`. Profile compilation and caching are bounded to 6 static profiles in process memory with no dynamic module resolution or code evaluation. CLI input handling rejects all configuration and rule overrides to prevent profile tampering. The rejected flags include `--config`, `--rule`, `--rulesdir`, and `-c`. File reading and stdin handling execute asynchronously with proper exit codes of 0, 1, and 2. The execution path contains no privileged operations and leaks no credentials. The review identified no deep performance bottlenecks and no OWASP Top 10 or STRIDE security vulnerabilities.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->
## Debug Log

None.
