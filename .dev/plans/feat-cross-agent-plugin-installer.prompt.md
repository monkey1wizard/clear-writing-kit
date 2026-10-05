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

- [ ] R01 — `cwk install plan` is read-only. It reports the requesting host, all hosts found on the machine, available runtimes, the state of each target, a conflict list, and every file, block, MCP entry, and setting it would change, with diffs. It ends with a plan hash.
- [ ] R02 — Host identity comes from `--agent`. The installer cross-checks exact environment variable names, never prefixes. A mismatch stops the run with a message. Evidence: Claude Code sets `CLAUDECODE` and, on this machine, also `CODEX_COMPANION_SESSION_ID` from the Codex plugin.
- [ ] R03 — `cwk install apply` requires `--plan-hash` from a `plan` run. It recomputes the plan and stops without writing if the hash differs. The hash covers the installer version, the payload digest, and the normalized target state. It excludes timestamps and backup paths.
- [ ] R04 — If a step fails during `apply`, the installer stops and reports the failed step and its output. Completed steps stay recorded in the manifest. Because `plan` is computed from the current state, a rerun of `plan` and `apply` covers only the remaining steps. No separate resume state exists.
- [ ] R05 — Every file write goes to a temporary file in the same directory, then replaces the target by rename. The installer keeps the target's line endings, byte-order mark, and trailing newline. If the rename fails because the file is locked, it retries, then fails with the file path.
- [ ] R06 — The installer never prints or logs the contents of host configuration files. Diffs show only its own block and its own entries. It parses only the keys it needs.

### What is installed

- [ ] R07 — `apply` copies the payload to `~/.clear-writing-kit/<version>/`. The payload is the `dist/` directory chosen by the Step 1 spike. A launcher file `~/.clear-writing-kit/cwk.mjs` imports the active version. MCP entries and the instruction block point to the launcher, never to the repository clone or a host plugin cache. The launcher replaces a `current` symlink, because creating a directory symlink on Windows needs Developer Mode or administrator rights.
- [ ] R08 — The skill is installed through the host's plugin mechanism. If a verified host does not support plugin skills, the installer copies the skill into that host's skill directory instead. `web-skills/` is never installed.
- [ ] R09 — The textlint MCP server is named `clear-writing-kit-textlint`. It is registered once per host, through the host's own CLI, and plugins do not declare it. The runtime is chosen in this order: Node >= 20.18, Deno >= 2, Bun. At least one is always present, because the installer itself runs on one of them.
- [ ] R10 — The MCP server exposes one tool, `lintText`, with parameters `text`, `language` (`en-US`, `zh-TW`, `ja-JP`), `genre` (`document`, `conversation`), and an optional `filename` for parser selection. Each profile loads on first use and stays cached in the process. The server has no file-reading or auto-fix tools.
- [ ] R11 — The instruction block is wrapped in `<!-- clear-writing-kit:begin v=<version> -->` and `<!-- clear-writing-kit:end -->`. It stays under 2 KB and is identical across hosts. It names the skill, the `lintText` tool, and the fallback command `<runtime> <home>/.clear-writing-kit/cwk.mjs check` for hosts where the MCP tool is missing. The block tells the agent to resolve `<home>` to the user's home directory, because cmd.exe does not expand `~`. A rerun replaces only this block. Content outside the markers is never changed.
- [ ] R12 — In Claude Code, the plugin ships the `clear-writing-kit` output style, and the installer sets `outputStyle` in `~/.claude/settings.json`. It overwrites any previous value. The `plan` diff shows the old value. All other keys stay unchanged, and the file is backed up first.

### Hosts

- [ ] R13 — A host is supported only after it passes the Step 2 survey and a full fixture cycle: `apply`, rerun with no diff, `verify`, and `uninstall`. Each host record carries a verified flag. On an unverified host, `plan` lists the manual steps and `apply` refuses to run.

### Verification, conflicts, and removal

- [ ] R14 — `cwk install verify` starts the registered MCP command and calls `lintText` once for each language, with a fixture that must produce at least one finding. It re-reads `outputStyle` in Claude Code. It checks the block size. Any check that fails or does not run makes the result "incomplete", never "pass".
- [ ] R15 — `plan` and `verify` report legacy conflicts: an `accurate-answer` skill, instruction blocks that name `accurate-answer`, and an old `outputStyle`. The installer does not delete them. `verify` reports "incomplete" while a duplicate writing skill remains installed.
- [ ] R16 — The manifest `~/.clear-writing-kit/install-manifest.json` records each file write with a SHA-256 hash. It records each CLI-created item as host, kind, name, and command fingerprint.
- [ ] R17 — `cwk install uninstall` removes a file only when its hash matches the manifest. It removes a CLI-created item through the host's remove command only when the current entry matches the fingerprint. It removes an old payload version directory only when its hash matches. Items that do not match are reported and kept.
- [ ] R18 — An upgrade is a normal `plan` and `apply` with a newer version. It re-registers the MCP entry, replaces the block through its `v=` marker, and rewrites the launcher to import the new version.

### Agent prompt and docs

- [ ] R19 — `INSTALL.md` first tells the agent to check for `node`, `deno`, and `bun`. If none is found, the agent stops, tells the user to install one, and gives the official install page URLs. It does not install a runtime itself. Otherwise `INSTALL.md` tells the agent to run `plan`, show the result to the user, wait for confirmation, run `apply` with the plan hash, run `verify`, and report passed and failed steps separately. It forbids direct edits to host configuration files.
- [ ] R20 — The README and docs describe the installer and no longer say that the repository does not edit global agent settings.

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

### Approved Goal Gap Remediation

Owner request 2026-10-02 "complete work before item 5" authorizes repository repairs, permanent independent regressions, and whole-goal revalidation only. Preserve T-01 through T-12 and their evidence. No Step 7 real-home installation, new-session activation, or finalize. Exact registration observation and schema-versioned host ownership follow the concrete isolated repair_review APPROVE design. Ambiguous Claude text or legacy ownership is retained/reported, never guessed. No new dependency or host support.

```text
MCP get -> present / absent / unreadable
present -> actual full command/args digest -> plan approval and exact removal
unreadable -> fail plan / incomplete verify / keep registration
apply -> persist selected-host owners and actual settings targets
uninstall selected host -> selected items -> retained consumer?
yes -> retain shared runtime and records
no -> remove exact hash matches only
legacy unknown -> keep and report
```



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

Workflow: DONE
Step: 5 of 7
Last activity: 2026-10-02 — T-14 completed at 95df464 after ORCHESTRATOR-direct TEST passed 79/79 and direct AUDIT cleared two remediated findings.
Next step: Run ORCHESTRATOR-owned goal-backward verification. Do not dispatch another executor, run real-home installation or new-session acceptance, or finalize.
Current Task:
Interrupted Phase:
Task Base Commit:
Task Final Commit:
Test Retry Count: 3
Review Retry Count: 0
Verification Independence: DEGRADED_BUNDLED

### Deviations

| Date | Task | Deviation | Reason |
| --- | --- | --- | --- |

| 2026-10-02 | T-14 | Owner explicitly authorized ORCHESTRATOR to perform direct TEST and AUDIT after three Codex TESTER sessions could not launch PowerShell. Record `Verification Independence: DEGRADED_BUNDLED`; no further executor dispatch is permitted for these phases. | Codex Windows sandbox/helper repeatedly failed with `helper_unknown_error: setup refresh had errors`; owner requires the pipeline to finish without another model. |

| 2026-10-02 | T-13 | Owner approved administrative boundary repair. Commit e1b4e30 stops tracking three ignored local pipeline receipts while preserving their files on disk. The first completed implement attempt at 07a1ca6 remains historical evidence; a fresh fix dispatch from e1b4e30 supersedes it for task convergence. | Early planning accidentally tracked local `.dev/pipeline` receipts. The repository hook prohibits committing ignored local workflow state, so untracking the receipts is the policy-compliant reconciliation. Product output is retained. |

| 2026-10-02 | T-11 | Visibility-only boundary widening for src/install/settings.ts: export the unchanged topLevelMembers parser landed in T-09 commit 6d53fe2. | Reuse the existing format-preserving JSON parser from uninstall.ts. The sole out-of-allowlist code change is the export keyword, with no behavior or import changes. |

| 2026-10-02 | T-01 | Owner authorized ignoring generated .dev/pipeline records. Administrative commit 5d5a476 precedes implementation dfe8fa1; task base advanced to it without discarding output. Owner replaced the shared ignore rule in b4700fa, so generated records now use local .git/info/exclude. Tested HEAD is b4700fa, with implementation unchanged. | Generated receipts and loop-log were outside the implementation allowlist. Owner .gitignore is authoritative. Already tracked evidence remains tracked. |

### Handoff Notes

#### Retry Handoff — T-14 / TEST

- Status: RESOLVED
- Problem: The first Codex TESTER dispatch could not inspect or execute the repository because every internal `exec_command` failed before PowerShell started with `helper_unknown_error: setup refresh had errors`.
- Evidence:
- Test Results: T-14 receipt reports `Total: 0`, `Verdict: BLOCKED`, and no tests authored or run.
- Review Results: not-applicable; audit has not run.
- Security Review: not-applicable; no security finding triggered the retry.
- Attempts:
1. 2026-10-02 — Codex TESTER dispatch completed, but its command runner failed three times during process setup.
- Result: No product or test file changed. HEAD remains `afa620a39b1716bd0161fe7b363b8649293705e2`.
- Validation: `.dev/pipeline/feat-cross-agent-plugin-installer/T-14/T-14-test.receipt.md`; attempt log `1790953582-162613400-000000-T-14-test-codex.log`.
- Commit: none
2. 2026-10-02 — Second Codex TESTER dispatch reached the same process-setup failure on both internal command attempts.
- Result: Receipt remains `Total: 0`, `Verdict: BLOCKED`; no product or test file changed.
- Validation: Attempt log `1790953680-517747100-000000-T-14-test-codex.log`.
- Commit: none
3. 2026-10-02 — Final Codex TESTER retry failed before launching PowerShell on three internal commands, including `pwd`.
- Result: Receipt remains `Total: 0`, `Verdict: BLOCKED`; no product or test file changed.
- Validation: Attempt log `1790953809-435868400-000000-T-14-test-codex.log`.
- Commit: none
- Next human step: Owner explicitly authorized ORCHESTRATOR to perform direct TEST and AUDIT with degraded bundled independence. Author and commit the permanent T-14 tests, rerun the committed HEAD, then complete direct audit and convergence without another executor dispatch.

#### Retry Handoff — T-14 / IMPLEMENT

- Status: RESOLVED
- Problem: The completed T-14 implementation regresses the committed T-13 registration-reader contract. `node --test writing/test/installer-registration.test.cjs` reports 12 functional failures: Claude and Codex registrations are read as `absent`, argument-only drift no longer changes the plan hash, stale apply proceeds, exact-match uninstall/retention assertions fail, and verify becomes incomplete. The thirteenth failure is the expected pre-commit `dist/` cleanliness assertion and is not the product defect.
- Evidence:
- Test Results: Full `npm --prefix writing test` result is 43 passed / 13 failed. Focused `node --test writing/test/installer-registration.test.cjs` result is 3 passed / 13 failed. The failures reproduce before any task commit; HEAD remains `2016449e06be30ac0822ac15dc226f88780c42b5`.
- Review Results: not-applicable; product commit and AUDITOR dispatch have not run.
- Security Review: not-applicable; no security finding triggered this retry.
- Attempts:
1. 2026-10-02 — Initial T-14 implementation completed, but coordinator regression tests exposed the T-13 behavior break before commit.
- Result: Current uncommitted output is retained for an in-place fix.
- Validation: `npm --prefix writing test`; `node --test writing/test/installer-registration.test.cjs`.
- Commit: none
- Resolution: The apparent product regression was a fixture-environment false positive. The RTK-launched Node process contains both `Path` and `PATH`; `createFixtureHome` adds the stub directory only to the later `PATH` key, while the product's case-insensitive Windows lookup reads the earlier `Path` key and invokes the real global host CLI. Re-running with one normalized `PATH` key gives 15/16 passing: every functional case passes and only the expected pre-commit `dist/` cleanliness assertion fails.
- Required repair: Preserve all T-14 ownership and migration behavior while restoring every committed T-13 registration/plan/apply/verify/uninstall behavior. Do not modify permanent tests. Rebuild `dist/cwk.mjs`, then run the focused registration suite and distinguish the pre-commit dist-cleanliness assertion from functional failures.
- Allowed files: Existing T-14 targets only. Keep current output in place and repair it in fix mode.
- Pass rule: All 12 functional registration tests pass; only the committed-dist cleanliness test may remain false before the orchestrator creates the product commit. Existing lint, Python, and non-registration Node regressions must remain green.
- Next human step: Run one T-14 IMPLEMENT fix dispatch against the retained working tree, then repeat the focused registration suite and working-tree boundary check before any commit.

#### Resolved Handback Record — convergence-human-repair (AGY quota)

Status: RESOLVED
Reason: convergence-human-repair
Task: T-14
Phase: CONVERGE
Producer: CONVERGE
Producer state: Two consecutive IMPLEMENT dispatches ended disconnected-partial at provider response with AGY 429 RESOURCE_EXHAUSTED; both processes exited and neither changed a product file.
Git HEAD: 2016449e06be30ac0822ac15dc226f88780c42b5
Next human step: Owner explicitly authorized a fresh T-14 retry on 2026-10-02 after changing TESTER and AUDITOR to codex. Resume from the retained T-14 cursor with CODER temporarily routed to agy for the no-sandbox implementation dispatch. Do not discard T-13 commits or workflow evidence.
What to check: T-14 attempt logs 1790942246-094720100-000000-T-14-implement-agy.log and 1790942650-825384900-000000-T-14-implement-agy.log. Both must show terminal_state disconnected-partial, error 429 RESOURCE_EXHAUSTED, and unchanged HEAD 2016449.
Expected result: A later owner-authorized T-14 implement dispatch reaches terminal_state completed with a nonempty receipt and native session database, then normal boundary/test/audit resumes.
Pass/fail rule: Continue only after provider availability is restored and the owner explicitly requests retry. A third automatic dispatch in this invocation is forbidden.

#### Resolved Handback Record — convergence-human-repair (accepted T-14 output)

Status: RESOLVED
Reason: convergence-human-repair
Task: T-14
Phase: CONVERGE
Producer: CONVERGE
Producer state: The owner-authorized implementation attempt completed with a fresh receipt and native AGY session record. A coordinator-triggered fix dispatch then ended terminal_state no-writeback because the retained implementation already satisfied the product contract. Independent diagnosis proved the reported registration failures were caused by the committed fixture's duplicate Windows Path/PATH keys under RTK, not by T-14 product code.
Git HEAD: 2016449e06be30ac0822ac15dc226f88780c42b5
Next human step: Owner explicitly authorized retaining the original completed T-14 implementation output and proceeding to the product commit plus Codex TESTER and Codex AUDITOR. TESTER may repair the allowed `writing/test/installer-fixtures.cjs` Windows Path/PATH instability while adding T-14 ownership tests. Do not dispatch AGY or any other model.
What to check: Attempt log `1790948339-077842000-000000-T-14-implement-agy.log` is completed. Fix log `1790949321-549528500-000000-T-14-implement-agy.log` is no-writeback. `node --test writing/test/installer-registration.test.cjs` under duplicate Path/PATH gives 3/16, while the same command with a single normalized PATH key gives 15/16 and only the pre-commit dist cleanliness assertion fails.
Expected result: With owner authorization, the orchestrator records the accepted implementation boundary, commits the six allowed T-14 product/doc files, then dispatches the codex TESTER to author permanent T-14 tests and make the allowed fixture environment-key repair before committed-HEAD retest and audit.
Pass/fail rule: Do not advance from IMPLEMENT while the latest attempt is no-writeback unless the owner explicitly authorizes the retained completed output path. Do not discard or revert any current output.

#### Human Handback — convergence-human-repair

Status: RESOLVED
Reason: convergence-human-repair
Task: T-14
Phase: CONVERGE
Producer: CONVERGE
Producer state: Three consecutive Codex TESTER dispatches completed with BLOCKED receipts and zero tests because the Codex Windows sandbox/helper failed before launching every PowerShell command with helper_unknown_error setup refresh had errors. No test or product file changed.
Git HEAD: afa620a39b1716bd0161fe7b363b8649293705e2
Next human step: Owner explicitly authorized ORCHESTRATOR to perform direct TEST and AUDIT with degraded bundled independence. Resume T-14 from product commit `afa620a` without another executor dispatch.
What to check: Codex TEST attempt logs `1790953582-162613400-000000-T-14-test-codex.log`, `1790953680-517747100-000000-T-14-test-codex.log`, and `1790953809-435868400-000000-T-14-test-codex.log`; each receipt reports zero tests and BLOCKED.
Expected result: A later owner-authorized Codex TESTER dispatch can read the workspace, author the two allowed permanent test files, run the T-14 suites, and return a non-BLOCKED receipt before audit.
Pass/fail rule: Continue only after the Codex command runner can launch PowerShell and the owner explicitly requests resume. Preserve product commit `afa620a` and all workflow evidence.

#### Retry Handoff — T-13 / TEST

- Status: RESOLVED
- Problem: Independent tests pass, but the repository naming gate rejects 23 plan-task ID references such as `TP-38` in `writing/test/installer-registration.test.cjs`. Plan-task IDs may appear only under `.dev/**`, so the permanent tests cannot be committed yet.
- Evidence:
  - Test Results: completed TESTER receipt 4440cad4-1101-44d0-95a5-2ce9f4b6af68 reports 16 focused tests, 56 total Node tests, 16 Python tests, lint, and build parity passing.
  - Review Results: not-applicable; audit has not run.
  - Security Review: not-applicable; no product change is requested.
- Attempts:
  1. 2026-10-02 — TESTER authored the two allowed permanent test files and all tests passed, but pre-commit naming-gate reported 23 violations in the registration test file.
     - Result: Test commit blocked; files retained uncommitted and unstaged.
     - Validation: `git commit` pre-commit hook, naming-gate 23 violations.
     - Commit: none
- Next human step: Completed TESTER dispatch c8d97b2e-ee97-401f-95a2-26cbc7b4be6d removed all 23 naming violations, retained behavior coverage, modified no production file, and passed focused/full suites plus naming-gate. Commit the permanent tests, update Task Final Commit, then run a fresh TESTER against committed HEAD.

#### Retry Handoff — T-13 / IMPLEMENT

- Status: RESOLVED
- Problem: Replacement implementation receipt says pass, but direct ORCHESTRATOR inspection finds two contract violations in `src/install/registration.ts`. Plain Claude Args with a configured launcher still fall back to whitespace tokenization when the launcher anchor is absent. Generic missing-server regexes still classify output as absent without binding the requested MCP name. Non-anchor quote parsing also acts as a general shell-like parser instead of accepting only reversible simple tokens.
- Evidence:
  - Test Results: not-applicable; independent TESTER has not run and permanent T-13 tests do not exist yet.
  - Review Results: ORCHESTRATOR source inspection after completed replacement dispatch c1c6a143-8253-4af1-92c9-45441382c711.
  - Security Review: Fixed transport diagnostics no longer echo raw type values, but absent misclassification can authorize unsafe update/removal behavior and guessed plain args can be executed by verify.
- Attempts:
  1. 2026-10-02 — Replacement implement from base e1b4e30 sanitized transport diagnostics but retained zero-anchor fallback and generic absence patterns.
     - Result: Contract not satisfied; no task commit created.
     - Validation: Direct inspection of `isRecognizedAbsent`, `parseSimpleTokens`, and the zero-anchor branch in `readRegistration`.
     - Commit: none
- Next human step: Completed dispatch 1c1e6927-978a-4818-82b3-f479cb333dff and direct source inspection confirm exactly-one launcher anchoring, rejection of non-anchor quotes, name-bound absence patterns, failure precedence, and fixed diagnostic redaction. Proceed through boundary and independent TESTER coverage.

#### Human Handback — boundary-scope-decision

Status: RESOLVED
Reason: boundary-scope-decision
Task: T-13
Phase: BOUNDARY
Producer: BOUNDARY
Producer state: fail: two root-generated planning receipts outside T-13 allowlist
Git HEAD: e1b4e308309695fa32ec15f56f3d33bc694098f5
Next human step: Owner approved the reconciliation. Commit e1b4e30 stopped tracking all three ignored local pipeline receipts without deleting their disk copies. Re-run T-13 scope/preflight and dispatch a real fix from the new base.
What to check: .dev/pipeline/feat-cross-agent-plugin-installer/T-13/T-13-boundary-check.receipt.md and the two planning receipt diffs. Both receipt changes were created by ORCHESTRATOR planning gates before the T-13 dispatch, not by CODER.
Expected result: T-13 production output remains intact, the replacement fix dispatch corrects the identified reader defects, and fresh working-tree plus committed-range boundary checks pass before independent TESTER dispatch.
Pass/fail rule: Continue only after the replacement fix dispatch completes and both boundary checks pass. Do not widen the product task allowlist or discard binary-managed evidence.

Dispatch: phase=implement task=T-13 role=CODER executor=agy model=gemini-3.8-flash state=completed session_id=e8531131-c78e-40c9-8d86-f4b3ede8a2d2 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-13/1790933430-849618200-000000-T-13-implement-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-13 implementation receipt, completed attempt log, nonempty native session database, unchanged HEAD, and pinned executable verified. Working-tree boundary failed only for the two pre-dispatch ORCHESTRATOR planning receipts omitted from the planning commit. No task commit, independent TESTER, AUDITOR, T-14, or goal verification is claimed. Preserve all output. No real-home installation, new-session acceptance, or finalize.

#### Human Handback — goal-gaps-blocked

Status: RESOLVED
Reason: goal-gaps-blocked
Task: T-12
Phase: VERIFY
Producer: VERIFY
Producer state: GAPS_FOUND. Isolated actual apply/uninstall probes reproduce two wiring gaps at e47fd38. Changing only registered MCP arguments leaves the plan hash unchanged and uninstall deletes the changed registration. Uninstalling Codex from a home with both Claude and Codex installed retains Claude CLI entries but deletes its block and shared launcher/payload. Existing task PASS/CLEAR receipts do not cover these cases.
Git HEAD: e47fd38722458d8c67359d4b5a365d4d72581ebe
Next human step: Owner authorization "complete work before item 5" resolves the repair scope decision. Gaps are not yet claimed fixed. They are now explicit blocking T-13/T-14 tasks with TP-38 through TP-41 and isolated architecture/readiness APPROVE. Run the normal task pipeline and fresh whole-goal verification. Preserve all previous evidence. No real-home installation, new-session activation, or finalize.
What to check: .dev/pipeline/feat-cross-agent-plugin-installer/goal-probes.ts and goal-probes.json. Run the bundled goal-probes.mjs against isolated fixtures. Inspect src/install/plan.ts readHostState and uninstall.ts command matching and manifest file cleanup.
Expected result: A changed MCP command or argument list changes the plan hash and is preserved by uninstall. Uninstall of one host keeps all blocks, runtime files, and registrations still owned by another installed host.
Pass/fail rule: Both conditions must hold in regression tests using the actual installer implementation. Either reproduced removal or unchanged plan hash is a failed goal check, regardless of existing task PASS receipts.

Compatibility note: Human handback fields are unprefixed because this pinned GAL parse_human_blocks implementation matches exact field names and does not strip Markdown bullet prefixes. Required headings and fields are preserved. This is orchestration evidence, not a change to GAL code.

Dispatch: phase=implement task=T-12 role=CODER executor=agy model=gemini-3.8-flash state=completed session_id=a05b9db0-e107-47b5-a88e-5eae82d91851 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790930027-978094000-000000-T-12-implement-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-12 generator repair completed with unchanged HEAD, current receipt and native record present, and boundary pass. Diff is limited to the authorized generated Gemini source hash and wording copied from its maintained source. Preliminary full lint/OKF, 40 Node and 16 Python tests pass. This is not yet independent TESTER certification. One remaining in-scope documentation reconciliation is required before test: docs/verification.md still says the installer plan does not change knowledge and presents prior failures without resolution. Update that historical section to record owner-approved generator repair and its current checks while preserving dated historical facts. Confirm current runtime versions rather than carrying the stale Bun 1.3.10 claim into the new record. Also replace the bare cwk uninstall invocation in Chinese/Japanese README prose with the runnable node dist/cwk.mjs install uninstall --agent <agent> form already used in English. No source rules, knowledge hand edits, test code, unrelated docs, commit, stash, or real-home install. Only minimal factual corrections within the existing README.md/docs/verification.md targets. Final TESTER must rerun full TP-26/27 and regression checks against the new commit.

2026-10-02 retry authorization: Owner says "try again" and reports AGY usage restored in another pipeline. Pin this invocation to C:/Users/leetz/.cargo/bin/gal.exe SHA256 3054AF9BCC6A2ABF4DF255425935DD3E1D50F3F700B6DD7F1EF624E8C1B0DFAD, gal 0.2.4 (ed2ed73b-dirty). Preflight receipt passes and rehash matches. No Preconditions table exists. No earlier dispatch is still running. Keep prior failures as evidence and perform a fresh agy implement attempt. Existing owner permission authorizes generator refresh of knowledge/usage/gemini.md only, with no hand edits, source-rule changes, unrelated generated edits, commits, stash, or real-home installs by CODER. No test contract is weakened. Restore original CODER codex route on terminal handback.

Latest resume runtime cutoff: Before any new executor dispatch, the executable changed from invocation pin A7B78D0DE956C0A59289C8738DBBA7306999DA2242B55800899FDAA34629541C, gal 0.2.4 (df3463df), to 3054AF9BCC6A2ABF4DF255425935DD3E1D50F3F700B6DD7F1EF624E8C1B0DFAD, gal 0.2.4 (ed2ed73b-dirty), during preflight. Do not trust the final preflight receipt from this invocation. No new phase was dispatched, no quota availability was verified, no product file changed, and no process is running for this attempted resume. The attempted combined config/prompt patch failed verification and left the machine CODER route codex. That route was read back explicitly. Earlier owner authorization to generate knowledge/usage/gemini.md remains valid. Stop GAL replacement or select an owner-approved stable executable binding before the next invocation. Do not silently repin within an invocation. No handback checker result, goal verification, or completion is claimed.

2026-10-02 resume: Owner says "limit is back try again" and authorizes a fresh implement attempt. Earlier two 429 attempts remain recorded. Provider availability is not asserted until actual dispatch succeeds. New invocation pin is C:/Users/leetz/.cargo/bin/gal.exe SHA256 A7B78D0DE956C0A59289C8738DBBA7306999DA2242B55800899FDAA34629541C, gal 0.2.4 (df3463df). The execution prompt has no Preconditions table. Fresh preflight passes. Existing processes from earlier attempts already exited. Current task remains T-12, test retry 1, review retry 0. CODER must use the existing OKF generator for the authorized knowledge/usage/gemini.md refresh, not hand edits or source-rule changes. Keep all unrelated content and existing output. No commits, stash, tests authored, or real-home installs. If generation changes another tracked file, report that scope and retain it for the owner. Temporarily route CODER to agy, preserving separate test/audit sessions and the no-sandbox constraint. Restore original codex route on handback. Clear interruption markers only after their normal gates succeed.

#### Human Handback — convergence-human-repair

- Status: RESOLVED
- Reason: convergence-human-repair
- Task: T-12
- Phase: CONVERGE
- Producer: CONVERGE
- Producer state: blocked. The owner-authorized generated-file repair implement dispatch and its single recovery both ended disconnected-partial with session-evidence-invalid-field and provider RESOURCE_EXHAUSTED HTTP 429. Neither delivered a completed receipt or valid session binding. Both original processes exited. No product files changed. The pipeline's two-incomplete-dispatch rule requires human handback.
- Git HEAD: 02a3c59cf3bf66b57d5b70e7fdd19f0b84cea3ab
- Next human step: Restore available executor quota/authentication or explicitly select another usable no-sandbox executor. Then resume gal-pipeline on this prompt at T-12 IMPLEMENT with the retained owner authorization for generating knowledge/usage/gemini.md. Run the existing generator, inspect exact scope, commit, and rerun independent TP-26/TP-27 test and audit. Do not weaken checks, edit leases, discard output, or hand-edit knowledge/. No wake-up or quota-reset time is scheduled or inferred.

Dispatch: phase=implement task=T-12 role=CODER executor=agy model=gemini-3.8-flash state=disconnected-partial session_id=none log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790924088-458018000-000000-T-12-implement-agy.log reason=session-evidence-invalid-field effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-12 repair recovery result: Provider returned RESOURCE_EXHAUSTED HTTP 429 again. The dispatcher recorded disconnected-partial and no session ID. This is not a completed implementation, not a failed test round, and not a retry-ceiling verdict. Test Retry Count remains 1. Existing output is retained. Machine CODER route is restored to its original codex setting before handback, but that restoration does not permit dispatching Codex with workspace-write under the owner's no-sandbox constraint.

Dispatch: phase=implement task=T-12 role=CODER executor=agy model=gemini-3.8-flash state=disconnected-partial session_id=none log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790923873-433788100-000000-T-12-implement-agy.log reason=session-evidence-invalid-field effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-12 generated-file repair runtime recovery: Original agy process exited code 3 with provider RESOURCE_EXHAUSTED HTTP 429 and no code changes. The binary terminal reason is session-evidence-invalid-field. No completed receipt or valid native-session binding exists. Keep the output and re-dispatch once with the unchanged owner-approved file scope, without changing leases/guards. This is runtime recovery, not another failed semantic test round.

#### Interrupted Phase — T-12 / IMPLEMENT

- Status: RESOLVED
- Cause: tool-unavailable
- Workflow at interruption: IMPLEMENT
- Durable state present:
  - Task Base Commit: 4ead407f6147e301fe96a10e683cecdf111ca961
  - Task Final Commit: 02a3c59cf3bf66b57d5b70e7fdd19f0b84cea3ab
  - Worktree: dirty, prompt/state only
  - Test Results: T-12 TP-27 FAIL, existing full checks stale
  - Review Results: no
- Resume action: Resolved by completed generator repair and documentation reconciliation at 53602d3, passing boundary checks, independent TESTER PASS, and AUDITOR CLEAR.

Owner scope authorization 2026-10-02: "allow to modify them" permits generated knowledge/usage/gemini.md repair plus the previously listed documentation and execution/state surfaces. The original T-12 task and TP-26/TP-27 remain unchanged in meaning. Only its execution allowlist gains the named generated file, as an explicit human amendment. Local fix self-check: one deterministic generated metadata refresh, no architecture or runtime behavior change, no manual knowledge editing. Existing generator and full lint/OKF/tests form the acceptance probe. No source-plan semantic rewrite or regeneration of the execution prompt is needed. Pin this fresh invocation to SHA256 EE23053DF544D50F85CC54FA8F34B1C1C40E8CAFBF823FA9CC6DDB40FCA9E872, version gal 0.2.4 (d4b5db8d-dirty). Fresh preflight passed. CODER fix owns only the named generated file and any minimal factual documentation corrections already allowed. Run the existing generator and return the diff. Do not write tests, edit prompt/state, stash, commit, install into real home, or modify unrelated generated files. If the generator changes any other tracked content, stop and report that output without discarding it. Fresh independent T-12 test/audit evidence is required after commit. Temporarily use agy CODER, restore original codex route on handback.

#### Human Handback — boundary-scope-decision

- Status: RESOLVED
- Reason: boundary-scope-decision
- Task: T-12
- Phase: BOUNDARY
- Producer: BOUNDARY
- Producer state: blocked. TP-27 requires full lint and okf:check to pass, but both exit 1 with Stale generated file: usage/gemini.md. Refreshing generated knowledge/usage/gemini.md is outside T-12's INSTALL.md/README.md/docs/verification.md allowlist. The visibility-only widening exception does not apply. No out-of-scope write was attempted.
- Git HEAD: 02a3c59cf3bf66b57d5b70e7fdd19f0b84cea3ab
- Next human step: Resolved by direct owner authorization "allow to modify them" after the exact stale generated file and existing documentation/state files were listed. This is an owner scope amendment, not automatic visibility-only widening. Preserve TP-27 unchanged and use the generator, not hand edits.

#### Retry Handoff — T-12 / TEST

- Status: RESOLVED
- Problem: The original stale OKF failure is repaired at 46ec937, with preliminary full lint/OKF and regressions passing. Remaining in-scope T-12 document accuracy issues: docs/verification.md still claims this plan does not change knowledge, lacks the authorized repair resolution, and names Bun 1.3.10 while current runtime is 1.3.12. Chinese/Japanese README prose tells users to run a bare cwk command without installing an alias. These statements must be reconciled before fresh independent TP-26/27 certification.
- Evidence:
  - Test Results: TESTER receipt delivered at 02a3c59, native session 8b1e3cbd-8740-4f67-a84f-35ae8b0951f2. Supplemental ORCHESTRATOR commands npm --prefix writing run lint and npm --prefix writing run okf:check both exited 1 with Stale generated file: usage/gemini.md.
  - Review Results: not-applicable, not dispatched
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Recovered T-12 TEST under owner-approved pin 12068C5D3CDCF499696C7F400F416E6EDD02F0D27501A8D069AA9E9D7E571F24.
     - Result: Focused documentation tests passed. Required TP-27 full checks failed. No production edits by TESTER.
     - Validation: Current receipt, completed attempt log, and nonempty native session record present. Supplemental full lint/okf commands fail. Semantic task verdict is FAIL.
     - Commit: 02a3c59cf3bf66b57d5b70e7fdd19f0b84cea3ab
- Next human step: Resolved by authorized generated repair at 46ec937 and factual documentation reconciliation at 53602d3. Independent TESTER session e1dab52e-c12d-4bd4-bd50-4e454881c618 passed TP-26/27 including full lint/OKF and regressions. Independent AUDITOR session 313fb68c-6b40-47fa-a97b-6f66d00166b9 returned CLEAR. No retry ceiling is claimed.

Dispatch: phase=test task=T-12 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=8b1e3cbd-8740-4f67-a84f-35ae8b0951f2 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790922125-014860600-000000-T-12-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

### [T-12] Orchestrator Test Reconciliation

Verdict: FAIL. TP-26 and focused document checks pass. TP-27 remains FAIL because its required npm --prefix writing run lint and npm --prefix writing run okf:check commands both return exit 1, Stale generated file: usage/gemini.md. The dispatcher-placed TESTER PASS is retained below for evidence, but does not certify TP-27 or authorize audit/convergence. No full-suite PASS is claimed. Scope remediation requires the owner decision above.

2026-10-02 owner authorization: "aloow" approves rebinding and continuation. Invocation pin is now C:/Users/leetz/.cargo/bin/gal.exe SHA256 12068C5D3CDCF499696C7F400F416E6EDD02F0D27501A8D069AA9E9D7E571F24, version gal 0.2.4 (791af7b9-dirty). Fresh pipeline-preflight passes. Original interrupted T-12 TEST process exited. Run one permitted test recovery dispatch after rechecking committed scope. Keep the interruption marker OPEN until its normal gate succeeds. Do not use the old mismatched boundary receipt as pass evidence.

Latest runtime cutoff: After the completed T-12 TEST receipt/native record were validated with matching pin 12068C5D3CDCF499696C7F400F416E6EDD02F0D27501A8D069AA9E9D7E571F24, and after independent supplemental npm checks failed, the pre-handback executable recheck found SHA256 03501F42466B4B3EBC27D24900E99E7A7FE6E7443638B178567EE40760650B06, version gal 0.2.4 (effe0569-dirty). Do not run or trust pipeline-handback-check on this changed executable without a new approved binding. The Human Handback block above is drafted evidence, not a fresh checker-authorized terminal decision. The original TEST process exited. No process remains running for this phase. No audit, convergence, goal record, finalize, or completion is claimed. Resume requires a stable approved GAL binding and the scope decision for generated OKF remediation. Machine CODER route is codex and was not changed in this resumed invocation.

#### Interrupted Phase — T-12 / TEST

- Status: RESOLVED
- Cause: tool-unavailable
- Workflow at interruption: TEST
- Durable state present:
  - Task Base Commit: 4ead407f6147e301fe96a10e683cecdf111ca961
  - Task Final Commit: 02a3c59cf3bf66b57d5b70e7fdd19f0b84cea3ab
  - Worktree: dirty, recovery notes only
  - Test Results: no completed T-12 evidence
  - Review Results: no
- Resume action: Resolved by current independent TP-26/27 PASS at 53602d3 with nonempty receipt/native record, completed log, unchanged HEAD, and no production edits. Invocation pin remains 3054AF9BCC6A2ABF4DF255425935DD3E1D50F3F700B6DD7F1EF624E8C1B0DFAD.

Binary drift: Invocation pin was SHA256 9554F129DC1C2115E0995E4CE3D8BE0ED7674283D0B3C98EB6B1C84994DEC566, version gal 0.2.4 (ef70f97c-dirty). Before trusting the T-12 committed-range boundary receipt, rehash returned 12068C5D3CDCF499696C7F400F416E6EDD02F0D27501A8D069AA9E9D7E571F24, version gal 0.2.4 (791af7b9-dirty). The orchestrator's batched tool cell had already queued the TEST dispatch after the hash call, without inspecting the mismatch first. That was an orchestration error. Do not trust this boundary receipt or the started test as passing evidence. On detection, the orchestrator terminated only the owned agy child tree PID 56100 under GAL PID 65008. The original dispatch exited disconnected-partial with session-evidence-missing-terminal and no session ID. No product changes occurred. This stop enforces the binary-binding rule, not a caller-side timeout. No further gate commands are trusted or run with the changed executable. No terminal decision or plan completion is claimed.

Dispatch: phase=test task=T-12 role=TESTER executor=agy model=gemini-3.8-flash state=disconnected-partial session_id=none log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790921848-775618600-000000-T-12-test-agy.log reason=session-evidence-missing-terminal effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=implement task=T-12 role=CODER executor=agy model=gemini-3.8-flash state=completed session_id=a10f2bf4-8cc8-4990-9bbd-37f0abef9176 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790921212-827595900-000000-T-12-implement-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-12 test focus: Independently validate all R-19 steps, runnable documented command forms without assuming a globally installed cwk alias, three-language command/link parity, accurate runtime-version evidence, and scope-limited documentation checks. Distinguish full npm lint/test baseline failures from direct changed-document checks. Use accurate-answer and zh-TW lint for Chinese edits. No production edits by TESTER. Verify original generator checks, artifact tests, and changed-doc Markdown/language checks. Do not claim new-session activation or full npm suites passed without fresh evidence.

T-12 task-quality check: The change owns only agent-facing installation procedure, three-language README command parity, generator description, and accurate verification documentation. Follow R-19 exactly, using committed dist from a clone with no npm install for installation. Choose a supported runtime without installing it. If none exists, stop with official runtime install URLs. Show plan before explicit user confirmation. Bind apply to its plan hash, then run verify and report passed/failed/skipped separately. Do not edit host configuration directly or remove legacy conflicts. Request new sessions for behavior acceptance without claiming them tested. Preserve current document structure and local links. Document uninstall marketplace retention, old outputStyle restoration from backups, and exact trailing-newline restoration limits. Keep 2026-09-29 historical test results distinct from current two pre-existing full npm OKF failures. Add no runtime/code abstractions and no changes to SKILL.md or knowledge/. Use existing docs terminology and avoid duplicate procedures. Native host verification is limited to Claude/Codex fixtures, other hosts remain unverified. No real-home install, independent test authoring, commits, or stash in CODER phase.

Dispatch: phase=implement task=T-12 role=CODER executor=codex model=gpt-6-luna state=no-receipt session_id=01a0fb37-4f90-7792-820b-9b41af189b57 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790921100-806765500-000000-T-12-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-12 recovery: Shared CODER configuration reverted to codex between T-11 and T-12 dispatches. The original process used workspace-write, contrary to the owner no-sandbox constraint. It exited on its own before the targeted taskkill call, which found no process. Terminal state is no-receipt. Logged exec failures report helper_unknown_error: setup refresh had errors. No product files changed. No cause is inferred from those errors. Set CODER to agy again, verify the fresh route and pin immediately before one permitted recovery dispatch. Do not delete leases or outputs. The unsupported --executor option produced no dispatch.

#### Human Handback — convergence-human-repair

Status: RESOLVED
Reason: convergence-human-repair
Task: T-07
Phase: CONVERGE
Producer: CONVERGE
Producer state: On the owner-authorized resumed invocation, Codex implement fix ended no-receipt with session 01a0f908-fc39-7d42-bd1c-e2a08ae867b8. Native sandbox log identifies deny ACE update failure on C:/Code/clear-writing-kit/.agents, owned by CodexSandboxOffline. Owner then explicitly prohibited sandbox. The one recovery dispatch used GAL's normal Claude Code permission-bypass adapter and existing configured claude-sonnet-5-5 model. It ended disconnected-partial, session 9d2987fd-fd55-4a91-aad3-d171cdfac966, terminal_reason api_error, result Failed to authenticate: OAuth session expired and could not be refreshed. Neither attempt produced a successful implementation receipt. GAL replay protection is not a defect. Retained Codex corrections remain uncommitted and TP-10 is provisional.
Git HEAD: f67094293918b8812bdb531d86964354db54a7d5
Next human step: Resolved on 2026-10-02 by owner request "try again" and claude auth status reporting loggedIn true. Resume through the authenticated Claude executor without sandbox. Preserve retained output and dispatcher leases. The original CODER route must be restored when this invocation ends. TP-10 remains provisional until tested against the corrected commit.

#### Retry Handoff — T-07 / TEST

- Status: RESOLVED
- Problem: The previous CODER reconciliation attempt produced no receipt because its command runner returned helper_unknown_error: setup refresh had errors. Owner has explicitly resumed this task. Production corrections from TP-10 remain uncommitted and must be reconciled before any test PASS is accepted.
- Evidence:
  - Test Results: TP-10 provisional PASS on modified working tree, not on f670942.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Tested f670942 with unexpected production edits.
     - Result: Retest required after CODER reconciliation and commit.
     - Validation: Completed session d4e1856e-155c-4e76-a6be-564428067e86.
     - Commit: f67094293918b8812bdb531d86964354db54a7d5
- Next human step: Resolved by completed Claude implementation and independent TP-10 PASS at f7c5bbfd8021f5ba96ce81e9a6b8d37a354cd18e. The test made no production edits and the independent audit is CLEAR. Restore the original CODER route when this invocation ends.

The tester reported TP-10 PASS but modified production manifests during spec testing. Its receipt does not certify Task Final Commit f670942. Retain both changes: Codex marketplace source path changed from ../.. to .; Codex skills changed to ./skills/coding-agent-writing. CODER must reconcile these corrections against native CLI schemas, ensure Claude explicitly declares only the requested skill and output style paths rather than relying on default whole-directory discovery, and return a task-scoped diff. No commits or real-home installs. After the orchestrator commits, TESTER must rerun TP-10 without editing any production manifest. Prior PASS is provisional, not a passing gate for the committed task.

Dispatch: phase=implement task=T-07 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=dff5453f-8e45-4af9-8e07-a6be365b7691 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-07/1790911242-199540200-000000-T-07-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-07 recovery: Claude authentication is restored. The completed implementation reconciled retained Codex paths and explicitly declared the Claude skill and output style. Boundary check passed. The fixture installs passed preliminary checks, but Claude skill-name readback and TP-10 certification remain TESTER-owned after commit.

Dispatch: phase=test task=T-07 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=319d247b-2fd3-4d10-9145-095fec0a0ed2 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-07/1790911563-246147000-000000-T-07-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-07 independent retest: TP-10 PASS at f7c5bbfd8021f5ba96ce81e9a6b8d37a354cd18e, with unchanged HEAD and no production edits. Claude details lists coding-agent-writing and zero MCP servers. Codex plugin is installed and enabled with the declared skill in its cache. Python artifacts 12/12 and checker regressions 26/26 passed. TP-09 remains deferred until T-09 delivers apply.

Dispatch: phase=audit task=T-07 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=a6701ea4-278f-41fc-b051-67c06b8c9547 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-07/1790912102-409811200-000000-T-07-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

T-08 task-quality check: The task specifies the read-only plan behavior, module ownership, injected home/environment boundary, exact host identity checks, runtime version thresholds, duplicate-marker and invalid-manifest failures, sanitized diffs, deterministic plan hash, unverified-host refusal, and rebuilt payload. Reuse the typed host table and generated instruction block. No real-home installs, apply behavior, or independent test code belongs to the implementation. Test rows requiring later apply/verify/uninstall commands must stay explicitly NotRun until those prerequisites land.

Dispatch: phase=implement task=T-08 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=6cc22352-d293-40d6-8ac0-eba2a111ea6f log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-08/1790912349-828652900-000000-T-08-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-08 implementation probes are preliminary evidence only. Independent tests must cover runtime preference fixtures, unverified-host manual steps, exact identity mismatch scenarios including inherited CODEX_SESSION_ID/CODEX_THREAD_ID inside Claude Code, sanitized diffs, target-state hash binding, and config token redaction. The implementer noted inherited Codex variables can pass --agent codex inside Claude Code. Resolve any confirmed failure within the T-08 identity module scope. Never alter the completed host table merely to bypass a boundary gate.

Dispatch: phase=test task=T-08 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=4ea1867d-c727-4690-a32b-9e3de96535cd log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-08/1790912788-281023800-000000-T-08-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-08 independent test: PASS at 79c4d6050993ed02dac6d621cdd108c5fd19ea1e with unchanged HEAD and no production edits. Covered TP-05, TP-11, TP-12, TP-13, TP-14 plan branch, TP-15 plan branch, TP-16 plan branch, TP-17 plan branch, TP-22, TP-28, TP-32 plan branch, TP-34, and TP-36 plan branch. Later apply/verify/uninstall branches remain NotRun at their owning tasks. Audit focus: TP-11 tested only CLAUDECODE and CODEX_COMPANION_SESSION_ID, not inherited CODEX_SESSION_ID/CODEX_THREAD_ID. Resolve whether a request for codex from an active Claude Code session violates the mismatch requirement when both sets of exact identity variables exist. Also assess whether normalized target-state hashing binds all relevant changes while preserving token redaction.

Dispatch: phase=audit task=T-08 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=fd7407c0-7408-4e2e-9c44-16da5fd0a907 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-08/1790913384-621332800-000000-T-08-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

T-08 audit resolution: CLEAR at unchanged HEAD 79c4d60. Exact-variable matching follows the task's mismatch definition and permits nested execution environments when the requested host's own variable exists. The plan hash binds normalized target state, manifest digest, runtime arguments, payload, and conflicts. Later T-09 target-change refusal and secrecy probes remain mandatory.

T-09 task-quality check: The task owns atomic file replacement, backups, manifest persistence after each completed step, versioned payload and launcher installation, outputStyle-only JSON editing, CLI-only plugin/MCP registration, plan-hash refusal before any writes, and resumable step failure reporting. Use the T-08 context and read-only plan contract. Preserve BOM, EOL, trailing newline, unrelated instruction blocks, and unrelated settings keys. Report locked-path failures after five 100 ms retries. No real-home installs or independently authored test code in this phase. Tests deferred from T-06/T-08 that require apply are now mandatory; verify/uninstall-dependent lifecycle checks remain deferred to T-10/T-11.

Dispatch: phase=implement task=T-09 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=4af04d09-6852-432a-bb76-c23e3a23b09e log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-09/1790913646-131593400-000000-T-09-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

#### Retry Handoff — T-09 / IMPLEMENT

- Status: RESOLVED
- Problem: Boundary check failed because src/install/plan.ts has behavior and return-shape changes outside the T-09 allowlist. No commit, test, or audit may advance until scope is corrected.
- Evidence:
  - Test Results: not-applicable
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Completed initial implementation at base 9f43372.
     - Result: Apply smoke tests completed, but PlanWrites, Plan.writes, computePlan return changes, and hostBinary export in src/install/plan.ts exceed task scope.
     - Validation: boundary-check overall fail, out-of-allowlist src/install/plan.ts.
     - Commit: none
  2. 2026-10-02 — Completed scope correction at unchanged base 9f43372.
     - Result: Write preparation moved into apply.ts. The T-08 Plan contract is preserved and src/install/plan.ts has no net diff. Payload rebuilt.
     - Validation: completed Claude session 58d63a06-2200-4037-af5f-3cc8db87ffba and boundary-check overall pass.
     - Commit: none
- Next human step: Resolved by the permitted scope correction. No allowlist widening or owner decision was needed. Orchestrator must commit the allowlisted implementation and run independent tests and audit.

Dispatch: phase=implement task=T-09 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=58d63a06-2200-4037-af5f-3cc8db87ffba log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-09/1790913995-820823100-000000-T-09-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=test task=T-09 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=efb2fec4-0c3e-4b93-aade-6987683c797b log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-09/1790914144-507306800-000000-T-09-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-09 independent test: PASS at 6d53fe2cf9f87dbe9d101b6207d2a922b22ee7b3 with unchanged HEAD and no production edits. TP-05, TP-09, TP-14, TP-15, TP-17 apply branch, TP-18 through TP-23, TP-28 through TP-30, TP-32, TP-33, and TP-35 through TP-37 are covered. Verify/uninstall branches remain NotRun at T-10/T-11. Audit must assess failure reporting and manifest custody as well as write scope, backups, launcher upgrades, and atomic writes. The implementation notes that a stale opaque plan hash reports candidate targets rather than identifying one exact changed target.

Dispatch: phase=audit task=T-09 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=c9ce8c6a-9874-4c2b-9e35-f9595c971600 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-09/1790914625-291669300-000000-T-09-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

T-10 task-quality check: The task owns verify.ts, CLI wiring, and rebuilt dist only. Query the host CLI for the actual registered command, launch that command, and speak initialize/tools-list/tools-call JSON-RPC over stdio without a client package. Require exactly one lintText tool and findings from en-US, zh-TW, and ja-JP probes, bounded by 30-second call timeouts. Missing dictionary, process/transport failure, missing tool, empty findings, stale outputStyle, invalid block count/size, and duplicate writing skill must yield incomplete and non-zero. Record every failed or skipped check. Preserve token redaction and injected home/environment conventions. No real-home install, test authoring, or behavior changes to earlier installer modules belong to this phase.

Dispatch: phase=implement task=T-10 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=c5679713-4f7d-46da-8ef5-e1676cdeb807 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790914893-531151200-000000-T-10-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

#### Retry Handoff — T-10 / IMPLEMENT

- Status: RESOLVED
- Problem: Boundary check failed on src/install/plan.ts and src/install/spawn.ts. Scope correction is required before commit, test, or audit.
- Evidence:
  - Test Results: not-applicable. Implementation probes report two npm test failures that require independent investigation.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Initial implementation completed at unchanged base 66887d4.
     - Result: verify works on Node fixture probes, but extracted conflict helper and interactive process helper change prior modules outside the task allowlist. The executor also stashed output for a baseline comparison. This changed execution-prompt line endings from LF to CRLF and caused the binary prompt-drift warning. Raw git diff against the pre-dispatch copy has no semantic changes, and HEAD is unchanged.
     - Validation: boundary-check overall fail on plan.ts and spawn.ts. Prompt digests differ due to line endings.
     - Commit: none
  2. 2026-10-02 — Completed scope correction at unchanged base 66887d4.
     - Result: Conflict-check and interactive-process logic moved into verify.ts. No net diff in plan.ts or spawn.ts, no stash, no HEAD drift, and no execution-prompt edits in this round. Payload rebuilt.
     - Validation: completed Claude session 1f6c21d4-ee73-472e-b51e-42738867c415 and boundary-check overall pass.
     - Commit: none
- Next human step: Scope correction resolved. Orchestrator must commit the allowlisted implementation, then TESTER must independently verify it and investigate the two reported npm test failures.

Dispatch: phase=implement task=T-10 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=1f6c21d4-ee73-472e-b51e-42738867c415 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790915337-506734400-000000-T-10-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=test task=T-10 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=c3424ceb-2c69-4992-a8cc-bba778c405e4 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790915523-128357100-000000-T-10-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-10 independent test: PASS at 5c42b1f51b3752d685813302953d2e9e58d37fb7 with unchanged HEAD and no production edits. TP-05, TP-16 verify branch, TP-17 verify branch, TP-24, TP-28, and TP-36 verify branch passed. Python artifacts 16/16 and checker tests 26/26 passed. Full npm test still has two failures in writing/test/okf.test.cjs due to stale source_sha256 in knowledge/usage/gemini.md from pre-existing 2026-09-29 commit bf6d3a5. Independent investigation established they predate T-10. Do not report the full npm suite as passing or manually edit knowledge. Uninstall-dependent test branches remain mandatory at T-11.

Dispatch: phase=audit task=T-10 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=996defa6-04bc-4f5b-ab00-b1de51ff45d4 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790916175-282360200-000000-T-10-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

#### Retry Handoff — T-10 / AUDIT

- Status: RESOLVED
- Problem: FINDING-001 is LOW and the auditor returned CLEAR, but the omitted session cleanup can keep verify alive after an invalid initialize response. Orchestrator requires the scoped cleanup repair before convergence.
- Evidence:
  - Test Results: PASS at 5c42b1f, invalid-initialize process exit not covered.
  - Review Results: T-10 2026-10-02 CLEAR with one open LOW FINDING-001 at src/install/verify.ts:252.
  - Security Review: no high or critical findings.
- Attempts:
  1. 2026-10-02 — Audited implementation at 5c42b1f.
     - Result: Invalid initialize response returns before session.close(), leaving child process and stdio active.
     - Validation: completed audit session 996defa6-04bc-4f5b-ab00-b1de51ff45d4.
     - Commit: 5c42b1f51b3752d685813302953d2e9e58d37fb7
  2. 2026-10-02 — Scoped cleanup fix committed at 8c93c76.
     - Result: session.close() is in finally. Invalid-initialize verification exits within 5 seconds, child PID terminated. Full task retest PASS and audit CLEAR with FINDING-001 RESOLVED.
     - Validation: completed test a8db1dfc-661c-4120-a6bb-d35c389c3358 and audit a68090d5-ca71-418e-a4ed-e4e81a88386f.
     - Commit: 8c93c7632001de3617106f08aa51c71650226a23
- Next human step: Resolved by scoped fix, independent retest, and independent audit. Continue T-11 after convergence gates pass.

Dispatch: phase=implement task=T-10 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=72c04dfb-3b78-4c5a-ba39-a3ad366c6b74 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790916425-438971900-000000-T-10-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-10 cleanup repair: checkServer now runs session.close() in finally, including the invalid initialize early-return path. Boundary check passes. Fresh committed TESTER and AUDITOR evidence is required before resolving FINDING-001 and converging.

Dispatch: phase=test task=T-10 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=a8db1dfc-661c-4120-a6bb-d35c389c3358 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790916595-199237600-000000-T-10-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-10 cleanup retest: PASS at unchanged HEAD 8c93c7632001de3617106f08aa51c71650226a23. Long-lived invalid-initialize server yields incomplete exit 1 within 5 seconds, and child PID is confirmed terminated. All task-scoped TP rows and regression suites pass again. Two pre-existing full npm test failures remain unchanged and are not a passing suite.

Dispatch: phase=audit task=T-10 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=a68090d5-ca71-418e-a4ed-e4e81a88386f log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-10/1790916883-102276600-000000-T-10-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

T-11 task-quality check: The task owns block.ts, uninstall.ts, cli.ts, and rebuilt dist only. Remove the block only when its exact bytes match the manifest hash, preserve foreign blocks, and retain every modified file/CLI entry with a reason. Query the actual CLI-managed state before comparing plugin/MCP fingerprints. Remove only hash-matching versioned payload files and retain backups. Resolve deletion paths within the injected home and intended kit/host artifact paths, and do not follow directory symlinks into unrelated paths. Preserve user content in pre-existing instruction/settings files. No real-home uninstall, test authoring, stash, HEAD change, prompt edits, or behavior refactors to prior modules belong to this phase. TESTER must exercise complete apply/rerun/verify/uninstall fixture cycles for both verified hosts, using native CLIs where available, and resolve every remaining TP branch including TP-17, TP-23, TP-25, TP-28, and TP-36. Do not mark a host cycle passed if Codex registration readback or native CLI syntax is merely assumed.

Dispatch: phase=implement task=T-11 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=35b80aaf-08eb-4885-9bce-ee53bd9301ac log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790917219-630438400-000000-T-11-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

#### Retry Handoff — T-11 / IMPLEMENT

- Status: RESOLVED
- Problem: Boundary-check failed because clearOutputStyle behavior was added to settings.ts outside T-11 scope.
- Evidence:
  - Test Results: not-applicable
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Initial implementation completed at unchanged base 9942c10.
     - Result: Block and settings probes passed, but settings.ts has a new behavior outside the task allowlist. The CLI-entry removal branch and complete host cycles remain untested.
     - Validation: boundary-check overall fail on src/install/settings.ts.
     - Commit: none
  2. 2026-10-02 — Scope correction completed at base 9942c10.
     - Result: clearOutputStyle moved into uninstall.ts. settings.ts only exports unchanged topLevelMembers from T-09. Orchestrator recorded the permitted visibility-only exception in doc-only commit a0f409a. Native Claude smoke succeeded.
     - Validation: completed session 9dd64b6d-4451-45aa-9632-35b7177e5218. Both task and base-range boundary checks pass.
     - Commit: none
- Next human step: Scope correction resolved through the permitted visibility-only protocol. Commit the implementation and run independent native host cycles. Preserve and report untracked marketplace retention, prior outputStyle not restored, and original trailing-newline limitations.

Dispatch: phase=implement task=T-11 role=CODER executor=claude model=claude-sonnet-5-5 state=completed session_id=9dd64b6d-4451-45aa-9632-35b7177e5218 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790917527-876661100-000000-T-11-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-11 test focus: CLI removals and full lifecycle must use actual installed Claude/Codex CLIs on isolated configuration directories where available. Retain hand-edited blocks, modified payload files, re-pointed MCP entries, and any hash-mismatching settings file, with explicit reasons. Test upgrade A-to-B payload removal and remaining TP branches. The manifest does not own the marketplace registration, so native uninstall currently retains it with a manual removal note. Prior outputStyle and nonstandard original trailing newline may require the retained backup for exact restoration. These limits must remain visible in receipts and docs, not be hidden as a pristine-state pass.

Dispatch: phase=test task=T-11 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=ca726cb9-1ccb-4b30-ad5a-1e8903663f4d log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790917850-574640100-000000-T-11-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=implement task=T-11 role=CODER executor=claude model=claude-sonnet-5-5 state=disconnected-partial session_id=6cdfd79d-3ee1-46bd-9dfa-db7280295fcf log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790918473-075475900-000000-T-11-implement-claude.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-11 runtime recovery: Claude returned provider api_error_status 429. The session limit resets at 16:10 Asia/Taipei. The process exited without code changes or a completed receipt. The machine CODER route was already codex at resume. A temporary agy route was selected, but no recovery dispatch started because gal.exe was unavailable both through PATH and at C:/Users/leetz/.cargo/bin/gal.exe. The alternate gal*.exe binaries have different SHA256 values from the pinned 69670503A1B10FAD07CC547E921C43F3DF316339CB1B4E5F1E9947A94735F9E3. The old preflight receipt is not fresh evidence. CODER was restored to codex. No leases, replay guards, or binary-managed receipts were altered. No handback checker could run, and no terminal decision or completion is claimed.

#### Interrupted Phase — T-11 / IMPLEMENT

- Status: RESOLVED
- Cause: tool-unavailable
- Workflow at interruption: IMPLEMENT
- Durable state present:
  - Task Base Commit: 9942c1079480bee0d4af56598669d138cb513708
  - Task Final Commit: 04f0746f490283af8ef47b3dabca3b9fd99dbf4c
  - Worktree: dirty, prompt/state recovery notes only
  - Test Results: yes, T-11 FAIL from native Codex removal syntax
  - Review Results: no
- Resume action: Restore the executable matching the pinned SHA256 or obtain explicit approval for a new binding. Re-run pipeline-preflight on .dev/plans/feat-cross-agent-plugin-installer.prompt.md and read the fresh receipt. Then perform the one permitted T-11 implement recovery dispatch with a no-sandbox executor, preserving existing output. Do not dispatch Codex with its fixed workspace-write sandbox. Run independent test and audit only after repair and commit. Do not clear this marker before the normal phase gate succeeds.

Resume authorization: The owner requested continue with gal-pipeline after inspection of the current executable. Pin C:/Users/leetz/.cargo/bin/gal.exe SHA256 9554F129DC1C2115E0995E4CE3D8BE0ED7674283D0B3C98EB6B1C84994DEC566, version gal 0.2.4 (ef70f97c-dirty), for this invocation. The executable now resolves and runs. Earlier not-found calls did not prove physical deletion or sandbox causation. Fresh preflight passes. Temporarily route CODER to agy for the permitted recovery dispatch, keeping phases separate and respecting the no-sandbox constraint. Restore codex at terminal handback.

Dispatch: phase=implement task=T-11 role=CODER executor=agy model=gemini-3.8-flash state=completed session_id=557ddaf2-0e95-4f74-9608-539449d34286 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790919789-925731700-000000-T-11-implement-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-11 recovery completed with unchanged HEAD and boundary pass. Codex now removes clear-writing-kit@clear-writing-kit. The same scoped uninstall module also records outputStyle backup paths and recognizes CRLF when deleting installer-created single-member settings. Independent tester must cover those extra settings branches and all native lifecycle/modified-item/upgrade checks. The interrupted implementation marker is resolved. The test retry remains OPEN pending new evidence.

Dispatch: phase=test task=T-11 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=89244ce5-ea32-4ddb-8fdd-60ca58b5ce2a log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790920168-480771900-000000-T-11-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-11 retest: PASS at unchanged HEAD b0f2d668ce78a0ce779a19c3a79e14db1372087d. Native Claude and Codex full fixture lifecycles, qualified Codex plugin removal, modified block/MCP/payload retention, upgrade cleanup, TP-05/17/25/28/36, and focused regressions pass. Full npm suite's two existing OKF failures are not cleared by this focused run. Independent audit remains required before convergence.

Dispatch: phase=audit task=T-11 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=d96a31a9-7eaa-4b44-bbf1-6795ed08786b log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-11/1790920701-393878600-000000-T-11-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

#### Retry Handoff — T-11 / TEST

- Status: RESOLVED
- Problem: TP-25 failed in native Codex CLI plugin removal. Codex requires the qualified plugin@marketplace identity or --marketplace.
- Evidence:
  - Test Results: T-11 2026-10-02 FAIL at 04f0746. Claude native lifecycle and other probes passed. Codex uninstall ran codex plugin remove clear-writing-kit and got exit 1: plugin requires --marketplace unless passed as <plugin>@<marketplace>.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Tested 04f0746 with actual host CLIs.
     - Result: TP-25 native Codex removal failed. Manifest retained and plugin not removed. Other test rows and regressions passed.
     - Validation: completed test session ca726cb9-1ccb-4b30-ad5a-1e8903663f4d.
     - Commit: 04f0746f490283af8ef47b3dabca3b9fd99dbf4c
  2. 2026-10-02 — Recovery repair committed as b0f2d66 after Claude provider 429 and tool-visibility interruption.
     - Result: Qualified Codex plugin removal and backup reporting corrected. Native lifecycle/retention/upgrade retest PASS. Audit CLEAR with zero open findings.
     - Validation: completed agy implement 557ddaf2-0e95-4f74-9608-539449d34286, test 89244ce5-ea32-4ddb-8fdd-60ca58b5ce2a, audit d96a31a9-7eaa-4b44-bbf1-6795ed08786b, current receipts and native records present.
     - Commit: b0f2d668ce78a0ce779a19c3a79e14db1372087d
- Next human step: Resolved by repair, native retest, and independent audit. Continue T-12 only after convergence gates pass.

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

Dispatch: phase=implement task=T-02 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f894-2123-7430-b5ec-6117f5fd0a04 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-02/1790876852-046196000-000000-T-02-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=test task=T-02 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=60695da4-d4a9-4130-b5f4-02bb8498d80e log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-02/1790877039-795457400-000000-T-02-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=audit task=T-02 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=666f9914-9c10-4ad9-9237-f7fbd96f0d62 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-02/1790877245-545652200-000000-T-02-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

Dispatch: phase=implement task=T-03 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f89d-23d4-70c0-bc98-b2c733d2b559 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-03/1790877442-568274100-000000-T-03-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-03 evidence limit: layout 1 Deno cold start exceeded 3 s. Layout 2 was not built, and full TP-01 parity was not run. The report's claim that neither layout passes remains unverified. No payload layout changes were retained. Independent testing must distinguish measured failure from untested alternatives.

#### Retry Handoff — T-03 / TEST

- Status: RESOLVED
- Problem: TP-04 failed. No standalone payload was delivered; isolated ja-JP crashes without repo node_modules. Layout 2 and full parity were untested. Independent Deno measurement did not reproduce the reported >3 s startup.
- Evidence:
  - Test Results: T-03 2026-10-02 FAIL. TP-04 failed; TP-05 passed. Deno 2.9.7 uncached 948 ms, warm 230–252 ms.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Tested report-only spike commit 988eb41.
     - Result: Isolated Japanese check cannot find kuromoji. No full parity evidence. STOP conclusion not supported by independent timings.
     - Validation: T-03-test.receipt.md; completed test session ee6defa3-dffb-477f-a132-dfe734e3220a.
     - Commit: 988eb41e4169c2e9adb7670c8f7ea2ce0db617bc
- Next human step: Resolved by fix 88e0fc9 and independent retest: 198/198 isolated payload parity checks passed across Node, Deno, and Bun. All measured startup runs were below 3 s; build reproducibility passed. Layout 1 satisfies the gate, so layout 2 is unnecessary under the ordered selection contract.

Dispatch: phase=test task=T-03 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=ee6defa3-dffb-477f-a132-dfe734e3220a log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-03/1790877850-188486700-000000-T-03-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=implement task=T-03 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8a9-2fb6-7330-aff7-22267c2beb22 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-03/1790878232-041216700-000000-T-03-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Fix commit 88e0fc9 delivers sibling dict with KUROMOJIN_DIC_PATH resolved from the bundle URL, no clone-dependent runtime paths, and corrected timings. Node 225 ms, Deno 216 ms, Bun 250 ms for representative finding samples. Full fixture parity remains for independent testing. Pre-commit and committed-range boundaries pass; worktree was clean before this test cursor update.

Dispatch: phase=test task=T-03 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=8b2e6306-5725-45dc-b0f8-21b71296413c log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-03/1790878706-871314800-000000-T-03-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=audit task=T-03 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=770ccbdb-e8f7-4be7-be2d-e25626ddc290 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-03/1790879626-787744300-000000-T-03-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

Dispatch: phase=implement task=T-04 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8c1-8da9-7870-b9e8-1a875108c519 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790879829-017358700-000000-T-04-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

#### Retry Handoff — T-04 / TEST

- Status: RESOLVED
- Problem: TP-06 still fails: all host records are marked unverified, despite captured installed-version capabilities for Claude Code and Codex. Installed-host discovery and field parity are now correct.
- Evidence:
  - Test Results: T-04 2026-10-02 second test FAIL. Home injection, field alignment, and five installed version captures passed. Claude/Codex capability verification flags failed.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Independently tested commit 5537bfa.
     - Result: Claude Code 2.1.286 available at C:/Users/leetz/AppData/Roaming/npm/claude.cmd. Antigravity CLI 1.2.14 available at C:/Users/leetz/AppData/Local/Microsoft/WinGet/Packages/Google.AntigravityCLI_Microsoft.Winget.Source_8wekyb3d8bbwe/agy.exe. opencode 1.18.34 available at C:/Users/leetz/scoop/shims/opencode.exe. Codex now reports 0.159.3. Several MD/TS field strings differ.
     - Validation: T-04-test.receipt.md, completed session c7db3eba-4636-4b55-b027-fa850bd9469d.
     - Commit: 5537bfa2584d04eb323fb62d89c11373cb2f38c5
  2. 2026-10-02 — Retested discovery and field alignment fix 1fb062b.
     - Result: Versions, canonical field parity, and home injection passed. Both mandatory hosts remain false because rolling official documentation was rejected without regard to captured installed-version CLI evidence.
     - Validation: T-04-test.receipt.md, completed session 09c02d0f-04a3-4e38-9272-cf5ec2f75b62.
     - Commit: 1fb062bb2f11732690451f61f439cb7251e04b09
- Next human step: Resolved by fix 8255e54 and independent TP-06 PASS: all five records match; Claude/Codex capabilities are evidence-verified; other hosts remain unverified where fields are not established. Full apply/rerun/verify/uninstall cycle remains pending for later tasks.

Dispatch: phase=test task=T-04 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=09c02d0f-04a3-4e38-9272-cf5ec2f75b62 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790880642-988990600-000000-T-04-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=test task=T-04 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=c7db3eba-4636-4b55-b027-fa850bd9469d log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790880114-187962800-000000-T-04-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=implement task=T-04 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8c9-a004-7613-ab33-3dd6c1c94b31 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790880357-974159700-000000-T-04-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=implement task=T-04 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8d1-b646-71e3-8d89-42d58aab407c log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790880887-976991200-000000-T-04-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=test task=T-04 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=ff76669a-997b-4506-a72f-ba4df908cef1 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790881026-459995400-000000-T-04-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=audit task=T-04 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=9e3aa209-173d-4cd8-9c3e-d5226c40d3eb log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-04/1790881167-893958400-000000-T-04-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

Dispatch: phase=implement task=T-05 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8d9-8c55-7421-a1c6-ea23546c6f94 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-05/1790881401-497529500-000000-T-05-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=test task=T-05 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=61803ed4-ba46-47dc-a128-c4c310e04ef2 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-05/1790881523-737593800-000000-T-05-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-05 independent test: TP-07 PASS, 12/12 Python artifact tests. TP-10 NotRun until T-07 creates plugin manifests. This records a dependency limit, not plugin installation success, and does not waive TP-10.

Dispatch: phase=audit task=T-05 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=077760cf-ae58-4ffe-9dc7-f2cce13ab170 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-05/1790881692-693388100-000000-T-05-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

T-06 dependency limit: TP-09 exercises fallback commands after apply and also covers T-09. Preserve it as mandatory at T-09 if install apply is unavailable during T-06. Do not claim it ran before its prerequisite exists.

Dispatch: phase=implement task=T-06 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8e0-b19d-77e2-b76d-c2286d08a028 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-06/1790881869-838343300-000000-T-06-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

#### Retry Handoff — T-06 / TEST

- Status: RESOLVED
- Problem: TP-08 failed. Begin marker omits v=2.0.0 and fallback instructions omit <runtime command>.
- Evidence:
  - Test Results: T-06 2026-10-02 FAIL. Generator check, 1,504-byte size, oversize error, source-version drift, and other content checks passed. TP-09 NotRun pending T-09.
  - Review Results: not-applicable
  - Security Review: not-applicable
- Attempts:
  1. 2026-10-02 — Tested implementation commit 3fa88ec.
     - Result: Wrong begin marker and absent required runtime placeholder.
     - Validation: T-06-test.receipt.md, completed session 5e1fa40d-5699-4d8e-8baf-496ee998da6b.
     - Commit: 3fa88ec1141e50b46160955b96a2b7f0f323e566
- Next human step: Resolved by fix 9dad332, committed independent tests c6e86b3, and independent TP-08 PASS on that commit. TP-09 remains pending the T-09 apply prerequisite.

Dispatch: phase=test task=T-06 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=5e1fa40d-5699-4d8e-8baf-496ee998da6b log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-06/1790882023-118497700-000000-T-06-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=implement task=T-06 role=CODER executor=codex model=gpt-6-luna state=completed session_id=01a0f8e6-0280-72b1-9209-1d6073ee9c7a log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-06/1790882218-248806100-000000-T-06-implement-codex.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

Dispatch: phase=test task=T-06 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=a2efe5ad-fb42-43d1-b06e-e84f224a390c log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-06/1790882318-231297100-000000-T-06-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Independent test code from the passing retest was committed as c6e86b3. Runtime/generator implementation remains 9dad332. Recheck the committed test suite and existing TP-08 probes without unnecessary new test changes. TP-09 remains pending T-09.

Dispatch: phase=test task=T-06 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=bb4c8238-e5cb-4a0b-9548-9fb63921fd68 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-06/1790882520-803870800-000000-T-06-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

Dispatch: phase=audit task=T-06 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=999fa6c6-d633-4218-ba4e-6f200f3b261a log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-06/1790882661-460499100-000000-T-06-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

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

- [x] T-02 — Ship the `cwk mcp` server with one `lintText` tool *(46216a1)*
  - Commit: 46216a1ba9bdae1ce262ba77c6f2c2acf400d177
  - Targets: `src/mcp.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-01
  - Change: Build an stdio MCP server on `@modelcontextprotocol/server` with one tool, `lintText`. Its input schema has `text`, the `language` and `genre` enums, and optional `filename`. It calls `lintText` from `src/check.ts` and returns findings as structured content. Validation errors become MCP errors. Add the `mcp` subcommand. Expose no file-reading or fix tools. Rebuild `dist/`.
  - Acceptance: An MCP client lists one tool and gets zh-TW findings from it.
  - Evidence: E + TP-03, TP-05.

- [x] T-03 — Make the payload run on Node, Deno, and Bun *(88e0fc9)*
  - Commit: 88e0fc90b838af21f4b1c01f13ea57f2395b5fef
  - Targets: `writing/package.json`, `dist/`, `.dev/research/payload-spike.md`
  - Depends on: T-02
  - Change: Extend the build to the first layout that passes, in this order: (1) bundle plus a sibling `dist/dict/` copied from the kuromoji dictionary, after finding and recording how the installed kuromojin version lets the rules point their dictionary path there through an option or environment variable; layout (1) fails if no such mechanism exists; (2) bundle plus a pruned production-only `dist/node_modules`. A layout passes when TP-01 parity holds on Node, Deno, and Bun and cold start is under 3 s on each. If both pass, take the smaller. Commit `dist/` and write the report with layout, size, cold-start times, and runtime versions. If neither passes, commit no layout change, write the report, and stop.
  - Acceptance: The committed payload passes parity on all three runtimes, and the report records the numbers.
  - Evidence: E + TP-04, TP-05.

- [x] T-04 — Record host capabilities as a verified host table *(8255e54)*
  - Commit: 8255e5430cc81c959fff80207d27af2316ecd9ee
  - Targets: `.dev/research/host-capabilities.md`, `src/hosts.ts`
  - Depends on: None
  - Change: Survey Claude Code, Codex, Copilot CLI, opencode, and Antigravity CLI. For each, record the installed version, plugin format, plugin skill support, plugin install, remove, and list commands, MCP add, remove, and list or get commands, the environment variable that relocates the configuration directory for fixture isolation, the global instruction file path, output-style support, and identity environment variables by exact name. Capture command output for installed hosts and cite official URLs otherwise. Mark an item verified only with captured output or an official source for the installed version. Encode the same data in `src/hosts.ts` as a typed constant, with paths as functions of an injected home directory and an evidence string per record.
  - Acceptance: The table and the survey agree row by row, and every verified record has evidence.
  - Evidence: E + TP-06.

- [x] T-05 — Ship the output style from the repository *(f2ce410)*
  - Commit: f2ce4107a21f593cb39249287bae30ef04d28e9e
  - Targets: `scripts/generate-output-style.py`, `output-styles/clear-writing-kit.md`, `tests/test_artifacts.py`
  - Depends on: T-03 (gate only, no technical dependency)
  - Change: Change `DEFAULT_OUTPUT` to `ROOT / "output-styles" / (PROJECT_NAME + ".md")`, using the repository root from `artifacts.py`. Generate and commit the file. Update `test_default_style_name_changes_without_deleting_existing_style` to the new default, and add a check that the committed file matches `render_claude()`.
  - Acceptance: The generator writes only the repository file, and Python tests pass.
  - Evidence: E + TP-07, TP-10.

- [x] T-06 — Ship the generated instruction block *(c6e86b3)*
  - Commit: c6e86b3c5572f364ef47c5a465b59d036ffa1da7
  - Targets: `scripts/artifacts.py`, `scripts/generate-agents-block.py`, `install/agents-block.md`, `tests/test_artifacts.py`
  - Depends on: T-03
  - Change: Add `render_agents_block()` to `artifacts.py`. It reads the skill version from `skills/coding-agent-writing/SKILL.md` metadata and emits the begin and end markers, the core rules from `persistent_core()`, the skill name, the `lintText` tool, and the fallback command `<runtime command> <home>/.clear-writing-kit/cwk.mjs check`, listing the forms `node`, `deno run -A`, and `bun`, with an instruction to resolve `<home>`. Add `generate-agents-block.py` following the `generate-output-style.py` pattern, with default output `install/agents-block.md` and `--check`. Raise an error at 2,048 bytes or more. Add tests.
  - Acceptance: `--check` passes on the committed block, and the size, marker, and content rules hold.
  - Evidence: E + TP-08, TP-09.

- [x] T-07 — Ship plugin manifests for every verified host *(f7c5bbf)*
  - Commit: f7c5bbfd8021f5ba96ce81e9a6b8d37a354cd18e
  - Targets: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, and one manifest per other verified host with plugin skills, at the paths in the survey
  - Depends on: T-04, T-05
  - Change: Declare `clear-writing-kit` for each verified host with plugin skill support, using the field names recorded in the survey. Every manifest ships only `skills/coding-agent-writing/`. The Claude manifest also ships `output-styles/`. Add the marketplace entries that point at the repository root. Declare no MCP server and never reference `web-skills/`. A verified host without plugin skills gets no manifest, because `skillCopyDir` in `src/hosts.ts` covers it.
  - Acceptance: Each manifest installs on an isolated fixture home and lists the skill.
  - Evidence: E + TP-10.

- [x] T-08 — Ship `cwk install plan` *(79c4d60)*
  - Commit: 79c4d6050993ed02dac6d621cdd108c5fd19ea1e
  - Targets: `src/install/spawn.ts`, `src/install/runtime.ts`, `src/install/identity.ts`, `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/block.ts`, `src/install/plan.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-03, T-04, T-06, T-07
  - Change: `spawn.ts`: export `which(name, env)` honoring PATHEXT, and `run(command, args, options)` that runs a `.cmd` or `.bat` through `cmd.exe /d /s /c` with every argument quoted for cmd.exe and other files directly, returning exit code, stdout, and stderr. `runtime.ts`: `selectRuntime(env)` picks Node >= 20.18, then Deno >= 2 (with `run -A`), then Bun, through `which()`, and returns an error value when none qualifies; `plan` reports that error and gives no hash. `identity.ts`: `resolveHost(agentArg, env)` requires `--agent` and checks identity variables by exact name, never prefix. A mismatch is a missing required variable of the requested host, or an exact-name variable of another host present without the requested host's variable. `fsutil.ts`: `readText(path)` returns text plus EOL, BOM, and trailing-newline state. `manifest.ts`: schema with version, file entries (path, SHA-256), CLI entries (host, kind, name, command fingerprint), and completed steps; a missing file is empty and an unparsable file is an error. `block.ts`: the pure function `upsertBlock(text, block)` replaces the one existing kit block or appends one after a single blank line in the file's EOL style, throws on two blocks, never changes bytes outside the markers, and returns the new text and whether anything changed. `plan.ts`: `computePlan(ctx)` resolves the host, selects the runtime, reads current plugin and MCP state through the host list or get commands, and returns ordered steps (payload, plugin, MCP, block, output style), line diffs of the kit's own block or entries only, computed from `upsertBlock` and without a diff dependency, so a rerun shows no diff, the legacy conflict list as defined in R-15 (an `accurate-answer` skill directory, a block naming `accurate-answer`, an `outputStyle` other than `clear-writing-kit`), and a SHA-256 plan hash over installer version, payload digest, and normalized target state, excluding timestamps and backup paths. An unverified host gets manual steps and no hash. Nothing is written. Add `install plan --agent` to `src/cli.ts` and rebuild `dist/`.
  - Acceptance: `plan` is read-only, deterministic, reports conflicts, and refuses unverified hosts.
  - Evidence: E + TP-05, TP-11, TP-12, TP-13, TP-14, TP-15, TP-16, TP-17, TP-22, TP-28, TP-32, TP-34, TP-36.

- [x] T-09 — Ship `cwk install apply` *(6d53fe2)*
  - Commit: 6d53fe2cf9f87dbe9d101b6207d2a922b22ee7b3
  - Targets: `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/payload.ts`, `src/install/settings.ts`, `src/install/apply.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-08
  - Change: `fsutil.ts`: add `writeTextAtomic(path, text, format)` writing a sibling temporary file and renaming it over the target, retrying a locked rename 5 times 100 ms apart before an error that names the path, and `backup(path, backupDir)`. `manifest.ts`: add `saveManifest` through `writeTextAtomic`. `payload.ts`: copy `dist/` to `<home>/.clear-writing-kit/<version>/` and write the launcher `<home>/.clear-writing-kit/cwk.mjs` with one dynamic import of the active version, keeping older versions. `settings.ts`: `setOutputStyle(path, value)` changes only `outputStyle`, keeps key order and indentation, backs up first, returns the old value, creates a missing file containing only `outputStyle`, and throws on invalid JSON before writing. `apply.ts`: `applyPlan(ctx, planHash)` recomputes the plan and writes nothing on a mismatch, backs up targets, writes the block text computed by `plan`, runs the other steps, registers `clear-writing-kit-textlint` with the launcher and the planned runtime, records each completed step in the manifest immediately, and on a failed step stops and returns the step, its output, and the completed steps. Add `install apply --agent --plan-hash` and rebuild `dist/`.
  - Acceptance: `apply` installs everything once, is idempotent, preserves file format and foreign blocks, and resumes after a failure through `plan`.
  - Evidence: E + TP-09, TP-14, TP-15, TP-17, TP-18, TP-19, TP-20, TP-21, TP-22, TP-23, TP-28, TP-29, TP-30, TP-32, TP-33, TP-35, TP-36, TP-37.

- [x] T-10 — Ship `cwk install verify` *(8c93c76)*
  - Commit: 8c93c7632001de3617106f08aa51c71650226a23
  - Targets: `src/install/verify.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-09
  - Change: `verify(ctx)` reads the registered MCP command through the host list or get command, starts it, and speaks MCP JSON-RPC over stdio directly (`initialize`, `tools/list`, `tools/call`) with no client library. It calls `lintText` once per language with a fixture sentence that must produce a finding, with a 30 s timeout per call. It re-reads `outputStyle` in Claude Code, checks block count and size, and lists legacy conflicts. It returns "pass" only when every check ran and passed, and "incomplete" with each failed or skipped check otherwise. Add `install verify` and rebuild `dist/`.
  - Acceptance: `verify` proves the server works per language and never reports pass with a missing or failed check.
  - Evidence: E + TP-16, TP-17, TP-24, TP-28, TP-36.

- [x] T-11 — Ship `cwk install uninstall` *(b0f2d66)*
  - Commit: b0f2d668ce78a0ce779a19c3a79e14db1372087d
  - Targets: `src/install/block.ts`, `src/install/uninstall.ts`, `src/install/settings.ts`, `src/cli.ts`, `dist/`
  - Boundary justification: settings.ts is limited to exporting the unchanged topLevelMembers parser from already-landed T-09 logic for reuse by uninstall.ts. No behavior change is authorized in that file.
  - Depends on: T-09
  - Change: Add `removeBlock(text, expectedHash)` to `block.ts`, where `expectedHash` is the SHA-256 of the block bytes as written. `uninstall(ctx)` removes manifest file entries whose hash matches, removes CLI entries through the host remove command when the current command matches the fingerprint, removes the kit block when its hash matches, and removes payload versions whose hashes match. It reports every kept item with the reason and keeps backups. Add `install uninstall` and rebuild `dist/`.
  - Acceptance: `uninstall` restores a clean fixture home and keeps every changed item.
  - Evidence: E + TP-17, TP-25, TP-28, TP-36.

- [x] T-12 — Document installation for agents and people *(53602d3)*
  - Commit: 53602d3031b215cae2b20e34eada6fb4788813da
  - Targets: `INSTALL.md`, `README.md`, `docs/verification.md`, `knowledge/usage/gemini.md`
  - Owner-authorized remediation: Refresh only the stale generated knowledge/usage/gemini.md through node writing/okf.cjs --generate. No manual knowledge edit, source rule change, other generated diff, SKILL.md change, or test-contract weakening is authorized. Check the generated diff and stop if additional content changes occur.
  - Depends on: T-10, T-11
  - Change: Write `INSTALL.md` with the R-19 procedure. The agent works from a repository clone, and `dist/` is committed, so no `npm install` is needed. It checks for `node`, `deno`, and `bun` and stops with official install URLs when none exists, without installing a runtime. It runs `install plan --agent <self>`, shows the result, waits for explicit confirmation, runs `install apply` with the plan hash, runs `install verify`, reports passed and failed steps separately, never edits host configuration files directly, and asks for a new session for the behavior check. In all three README language sections, add the same installer commands, replace the statement that the repository does not edit global agent settings with what the installer changes and how to uninstall, and update the output-style generator description. Document `verify` in `docs/verification.md`. Do not hand-edit `knowledge/`.
  - Acceptance: `INSTALL.md` covers every R-19 item, and the README and docs checks pass.
  - Evidence: E + TP-26, TP-27.

- [x] T-13 — Compare complete current MCP registrations safely *(f2fd346)*
  - Targets: `src/install/registration.ts`, `src/install/plan.ts`, `src/install/apply.ts`, `src/install/verify.ts`, `src/install/uninstall.ts`, `dist/`, `writing/test/installer-registration.test.cjs`, `writing/test/installer-fixtures.cjs`
  - Depends on: T-12
  - Change: Add one shared registration reader using existing spawn.ts and SHA-256/JSON-vector conventions. Distinguish present/absent/unreadable. Codex queries mcp get <name> --json and validates stdio command and the complete string-array args. Claude parses actual Command:/Args: output, JSON arrays when present, or a unique known-launcher anchor with unambiguous simple tokens. Reject duplicate fields, ambiguous quoting/whitespace, repeated anchors, malformed JSON, and unsupported transports without guessing. Only recognized missing-entry responses mean absent. Auth/permission/timeout/unknown failures are unreadable. Fingerprint the actual complete command and ordered args, not a reconstructed runtime preference. Include actual registration digest in plan target state, including different entries, so argument-only drift invalidates old hashes and apply writes nothing on stale approval. Uninstall removes exact matches only and keeps changed/unreadable entries. Verify shares the reader and never executes guessed commands. Remove obsolete duplicate parsing and substring-only checks. Never print current argv/env/raw host output or user-added secrets. No new dependency, host support, manifest ownership change, or real-home install. Rebuild dist with unchanged dictionary files.
  - Acceptance: Independently authored permanent integration tests prove argument add/remove/reorder/change invalidates plan approval, stale apply has no filesystem/CLI writes, exact match removal and changed/unreadable preservation, shared parsing/verify behavior, space-containing homes, runtime preference changes, explicit absence versus lookup failure, and no secret sentinel in formatted output. Keep production code unmodified in TESTER. TESTER alone authors named test files after implementation. Root commits those tests then retests the committed HEAD before audit. Maximum source/test/generated-entry files is 8, excluding unchanged dictionary assets.
  - Evidence: E + TP-38, TP-39, TP-05, TP-17, TP-24, TP-28, TP-36.

- [x] T-14 — Preserve host-owned artifacts and shared runtime consumers *(95df464)*
  - Commit: 95df4643afcbe804b100f22069400f417f893574
  - Targets: `src/install/manifest.ts`, `src/install/plan.ts`, `src/install/apply.ts`, `src/install/uninstall.ts`, `dist/`, `writing/test/installer-ownership.test.cjs`, `writing/test/installer-fixtures.cjs`, `docs/verification.md`
  - Depends on: T-13
  - Change: Add a validated manifest schema revision for per-file host owners, per-host completion metadata, and the durable actual output-style settings target. Preserve existing CLI host ownership, atomic replacement, hashes, and backups. Shared payload/launcher track known consumers. Block and settings records track their specific host and actual target. Include ownership/completion metadata in plan hash. Migrate old manifests conservatively: concrete recorded evidence may establish ownership, otherwise keep explicit unresolved legacy ownership and report it. Never assign every old item to the requesting host. On apply, exact matching current no-op artifacts may adopt selected-host metadata without rewriting artifact bytes or replacing differing old hashes. Metadata-only adoption is a manifest write, not a claim of zero writes. Fully adopted reruns are idempotent. Uninstall selects only requested-host block/settings records at persisted target paths. CLI cleanup precedes shared cleanup. Keep shared files while another owner, unresolved legacy ownership, kept/failed CLI consumer, retained block, or retained settings record remains. Persist retained owners/reasons so retry and final-consumer cleanup remain safe. No counters, generic adapters, new dependencies, registration redesign, or real-home writes. Rebuild dist without dictionary changes and update verification docs with tested ownership/migration behavior.
  - Acceptance: Independently authored permanent integration tests use actual production plan/apply/uninstall APIs and host CLI mutation logs. Both host installation orders and both first-uninstall choices preserve the surviving host registration, byte-identical block/settings, and runnable launcher. Final consumer removal cleans exact matching artifacts only. Test no-op adoption, legacy ambiguous ownership, changed old hashes, relocated configuration paths, upgrades, changed shared files/blocks, failed CLI removal, and repeated cleanup. TESTER owns test code only. Root commits tests then independently retests committed HEAD before audit. Maximum source/test/doc/generated-entry files is 8.
  - Evidence: E + TP-40, TP-41, TP-05, TP-17, TP-18, TP-19, TP-20, TP-21, TP-23, TP-24, TP-25, TP-28, TP-36.


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

| TP-38 | integration | Complete current MCP command/ordered args are observed using captured native output shapes and CLI fixtures. Added/removed/reordered/changed args change plan hash. Stale apply writes no file or CLI mutation. Reader rejects malformed/ambiguous output and distinguishes recognized absence from auth/permission/timeout. Exact matching unregisters, changed/unreadable entries remain, runtime preference change cannot authorize removal, and formatted outputs omit secret sentinels. Permanent TESTER-authored tests run through production callers. E. | T-13 |
| TP-39 | integration | Shared verify reader starts the parsed registered command on Node/Deno/Bun, probes all three languages, and fails/skips unreadable entries rather than guessing. Space-containing launcher paths are intact. Fresh build parity, existing full lint/OKF/Node/Python suites, and independent audit pass. Permanent test files are committed by root and independently rerun on final HEAD. E. | T-13 |
| TP-40 | integration | Install Claude and Codex in one isolated home in both orders and uninstall each host first. Surviving host retains registration, byte-identical block and unrelated settings, durable ownership, and runnable launcher with multilingual MCP findings. Removing final exact-match consumer cleans shared artifacts. Repeat and upgrade cycles remain safe on Node/Deno/Bun. E. | T-14 |
| TP-41 | integration | Legacy/partial manifests, no-op adoption, custom config relocation, modified old hashes/blocks/shared files, ambiguous legacy ownership, and kept/failed CLI removals retain referenced payload and report reasons. No-op adoption writes only validated metadata, then fully adopted rerun has no changes. Permanent regressions and full lint/OKF/Node/Python suites pass, fresh dist matches committed output, and docs accurately distinguish fixture verification from pending real-home acceptance. E. | T-14 |


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

### [T-02] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 2 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); stdio JSON-RPC probes against dist/cwk.mjs mcp verify single tool lintText with required (text, language, genre) and optional filename, zh-TW findings in structuredContent, MCP errors on invalid enum options, and absence of file-reading or fix tools (TP-03).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-03: MCP client against `dist/cwk.mjs mcp` lists single tool `lintText`, gets zh-TW findings, and returns MCP errors on invalid enums | Yes | PASS | 11/11 probes passed: single tool exposed, inputSchema verified, no file-reading/fix tools, zh-TW returns structured findings, invalid language/genre enums return `isError: true` validation errors, optional filename accepted |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build; `git status --porcelain dist/` produced 0 diff |

#### Failed Tests

- None. All 2 covering tests passed.

#### Not Tested

- None. All covering test plan rows for T-02 (TP-03, TP-05) were directly tested.

### [T-03] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 1 | Failed: 1 | Skipped: 0
Verdict: FAIL
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff). TP-04 failed because no standalone payload layout was committed to dist/, isolated execution crashes on ja-JP without repo node_modules (Cannot find module 'kuromoji'), Layout 2 was never built, full TP-01 parity was unrun, and independent benchmarks disproved the Deno > 3 s cold-start failure (uncached 948 ms, warm 230-252 ms on Deno 2.9.7).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-04: Multi-runtime payload parity on Node, Deno, Bun with cold start < 3 s and complete spike report | Yes | FAIL | No standalone layout committed to `dist/`; isolated execution fails ja-JP (`Cannot find module 'kuromoji'`); Layout 2 was unbuilt; full TP-01 parity was not run; independent Deno cold start is 948 ms (uncached) and 230–252 ms (warm), refuting the report's > 3 s failure claim |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build; `git status --porcelain dist/` produced 0 diff |

#### Failed Tests

- `TP-04: Multi-runtime payload layout and spike verification` — The task requires extending the build to the first layout passing parity on Node, Deno, and Bun with cold start under 3 s, or committing no layout change and stopping only if neither candidate passes. The committed `dist/` retains the unbundled state and fails in isolated environments without `writing/node_modules` (`Cannot find module 'kuromoji'` on `check --language ja-JP`). Furthermore, `.dev/research/payload-spike.md` recorded an unverified STOP conclusion: Layout 2 was never built, full TP-01 parity was explicitly skipped, and the recorded Deno cold start of 3,240 ms was disproved by independent measurement (948 ms uncached, 230–252 ms warm on Deno 2.9.7).

#### Not Tested

- Layout 2 was not tested because the implementer did not build the pruned vendored `node_modules` layout.
- Standalone multi-runtime parity on an isolated payload was not tested because no self-contained dictionary or dependency layout was committed to `dist/`.

### [T-03] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 2 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches committed dist/ (TP-05: 0 diff); multi-runtime test suite on isolated payload confirms full TP-01 parity across Node 25.2.1, Deno 2.9.7, and Bun 1.3.12 (198/198 passed: 66/66 per runtime) with cold starts under 500 ms (Node avg 228 ms / 424 ms JA, Deno avg 225 ms / 494 ms JA, Bun 257 ms / 486 ms JA), and .dev/research/payload-spike.md records layout evaluation, size, timings, and runtime versions (TP-04).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-04: Multi-runtime payload parity on Node, Deno, Bun with cold start < 3 s and complete spike report | Yes | PASS | 198/198 checks passed across Node 25.2.1, Deno 2.9.7, and Bun 1.3.12 (66 checks per runtime) executing standalone payload from isolated directory outside repo. Cold start measured across 5 runs each: sample text Node avg 228 ms (222–236 ms), Deno avg 225 ms (219–235 ms), Bun avg 257 ms (251–264 ms); Japanese dictionary load Node avg 424 ms (414–448 ms), Deno avg 494 ms (487–502 ms), Bun avg 486 ms (476–495 ms), all well within 3 s budget. Spike report verified for layout order, size (25,149,965 bytes total), runtime versions, timings, and kuromojin mechanism. |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build executed; `git status --porcelain dist/` produced 0 diff against committed payload |

#### Failed Tests

- None. All covering tests passed.

#### Not Tested

- None. All covering test plan rows for T-03 (TP-04, TP-05) were directly tested.

### [T-04] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 1 | Passed: 0 | Failed: 1 | Skipped: 0
Verdict: FAIL
Evidence: node unit probes against `src/hosts.ts` and `.dev/research/host-capabilities.md`: TP-06 failed because Claude Code is installed on the owner's machine (`claude --version` => `2.1.286 (Claude Code)`) but was surveyed as absent and unverified; field-by-field string divergence exists between markdown rows and TypeScript records.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-06: Every record in `src/hosts.ts` matches a row of `.dev/research/host-capabilities.md`, field by field; `verified: true` records cite captured output; no path uses `os.homedir()` | Yes | FAIL | `os.homedir()` check passed (0 uses; home injection tested); single-host verification passed for Codex. Failed on mandatory machine survey requirement (Claude Code is installed on owner machine but marked unverified) and field-by-field string agreement. |

#### Failed Tests

- `TP-06: Claude Code surveyed as absent and unverified on owner machine` — Step 2 and T-04 require: "Claude Code and Codex are surveyed on the owner's machine", "Capture command output for installed hosts and cite official URLs otherwise", and "Mark an item verified only with captured output or an official source for the installed version." The survey and `src/hosts.ts` record Claude Code as `not installed (claude not found on PATH)` and `verified: false`. However, Claude Code is installed on this machine at `C:\Users\leetz\AppData\Roaming\npm\claude.cmd`, and `claude --version` outputs `2.1.286 (Claude Code)`. `claude plugin` commands (`install`, `uninstall`, `list`) and `claude mcp` commands (`add`, `remove`, `list`, `get`) are locally executable. Under R-13, unverified hosts are rejected by `cwk install apply`, and under T-07 unverified hosts receive no plugin manifest, which blocks Claude Code installation and Step 7 verification.
- `TP-06: Installed host detection omissions on owner machine` — In addition to Claude Code:
  - Antigravity CLI is installed at `C:\Users\leetz\AppData\Local\Microsoft\WinGet\Packages\Google.AntigravityCLI_Microsoft.Winget.Source_8wekyb3d8bbwe\agy.exe`, and `agy --version` outputs `1.2.14` with plugin and mcp subcommands (`install`, `uninstall`, `list`, `add`, `remove`), but was recorded as absent and unverified.
  - opencode is installed at `C:\Users\leetz\scoop\shims\opencode.exe`, and `opencode --version` outputs `1.18.34` with `opencode mcp` and `opencode plugin`, but was recorded as unavailable due to an unhandled transient EEXIST error.
  - Codex CLI is currently `codex-cli 0.159.3` (`codex --version`), while the survey recorded `0.159.2`.
- `TP-06: Field-by-field row agreement between markdown survey and TypeScript table` — T-04 acceptance requires: "The table and the survey agree row by row, and every verified record has evidence." Field values diverge between `.dev/research/host-capabilities.md` and `src/hosts.ts`:
  - Claude plugin format: MD records `.claude-plugin/plugin.json and marketplace manifest; skills supported` vs TS `.claude-plugin/plugin.json and marketplace.json`.
  - Claude output style: MD records `Supported` vs TS `outputStyleSupport: "yes"`.
  - Codex installed version: MD records `codex-cli 0.159.2` vs TS `0.159.2`.
  - Codex plugin format: MD records `.codex-plugin/plugin.json compatibility format; portable root plugin.json and skills/; skills supported` vs TS `.codex-plugin/plugin.json compatibility format; portable plugin.json plus skills/`.
  - Copilot plugin format: MD records `Agent Plugins root plugin.json or legacy plugin formats; skills supported` vs TS `Agent Plugins plugin.json or legacy .plugin/plugin.json / .claude-plugin/plugin.json`.
  - opencode plugin commands: MD records `Configure in opencode.json or plugin directory / remove the entry or directory / no plugin list CLI command established` vs TS install command `Add plugin to opencode.json or plugin directory`.

#### Not Tested

- None. All covering test plan rows for T-04 (TP-06) were directly tested.

### [T-04] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 1 | Passed: 0 | Failed: 1 | Skipped: 0
Verdict: FAIL
Evidence: node unit probes against `src/hosts.ts` and `.dev/research/host-capabilities.md`: TP-06 failed because all five hosts are marked `verified: false` and `**No.**`, leaving zero verified hosts and breaking downstream contracts R-13, T-07, and Step 7.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-06: Every record in `src/hosts.ts` matches a row of `.dev/research/host-capabilities.md`, field by field; `verified: true` records cite captured output; no path uses `os.homedir()` | Yes | FAIL | Home injection and `os.homedir()` absence passed (0 uses). Field string alignment between MD and TS passed. Version capture passed for all 5 CLIs. Failed on verified status: Claude Code and Codex were surveyed on the owner's machine with full captured CLI output and official documentation, but were marked unverified (`verified: false` / `**No.**`), leaving zero verified hosts for downstream tasks. |

#### Failed Tests

- `TP-06: Claude Code and Codex marked unverified leaving zero verified hosts` — Step 2 and T-04 require surveying Claude Code, Codex, Copilot CLI, opencode, and Antigravity CLI, capturing command output for installed hosts, citing official URLs, and recording a verified host table. Both Claude Code (version 2.1.286) and Codex CLI (version 0.159.3) are installed on the owner's machine. Local command executions captured their installed versions, plugin CLI commands (`install`/`uninstall`/`list` and `add`/`remove`/`list`), MCP CLI commands (`add`/`remove`/`list`/`get`), configuration directory relocation environment variables (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`), default configuration paths (`~/.claude`, `~/.codex`), global instruction paths (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`), output-style support (`yes` for Claude Code), and exact identity environment variables (`CLAUDECODE` and `CODEX_SESSION_ID`, `CODEX_THREAD_ID`). The implementer marked all five hosts `verified: false` in `src/hosts.ts` and `**No.**` in `.dev/research/host-capabilities.md`, reasoning that official documentation is rolling rather than pinned to patch versions. This rationale inappropriately invalidates standard official documentation cited in the evidence string. Marking zero verified hosts breaks the pipeline architecture: under R-13, `cwk install plan` emits no plan hash and `apply` refuses to run on unverified hosts; under T-07, plugin manifests are generated only for verified hosts; and under Step 7, human review requires installing on Claude Code and Codex. To pass, Claude Code and Codex must be marked `verified: true` in `src/hosts.ts` and `**Yes.**` in `.dev/research/host-capabilities.md`, supported by their captured CLI output and official documentation. Copilot CLI, opencode, and Antigravity CLI correctly remain `verified: false` because their configuration relocation variables or identity variables are unestablished or unverified.

#### Not Tested

- None. All covering test plan rows for T-04 (TP-06) were directly tested.

### [T-04] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 1 | Passed: 1 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: Node unit probes against `src/hosts.ts` and `.dev/research/host-capabilities.md` confirm all 5 hosts match row by row and field by field with zero `os.homedir()` calls (injected home paths tested), Claude Code 2.1.286 and Codex 0.159.3 are marked verified (`verified: true` / `**Yes.**`) with captured CLI output and official documentation citations, and Copilot CLI, opencode, and Antigravity CLI remain `verified: false` / `**No.**` due to unestablished identity or isolation fields (TP-06).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-06: Every record in `src/hosts.ts` matches a row of `.dev/research/host-capabilities.md`, field by field; `verified: true` records cite captured output; no path uses `os.homedir()` | Yes | PASS | 5/5 hosts agree row by row and field by field. Zero uses of `os.homedir()` found; home injection functions return paths within the injected home directory. Claude Code 2.1.286 and Codex 0.159.3 are marked verified with captured local CLI executions and official documentation links. Copilot CLI, opencode, and Antigravity CLI correctly remain unverified due to unestablished identity or configuration relocation environment variables. |

#### Failed Tests

- None. All covering tests passed.

#### Not Tested

- None. All covering test plan rows for T-04 (TP-06) were directly tested.

### [T-05] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 1 | Failed: 0 | Skipped: 1
Verdict: PASS
Evidence: Python probes and unit test suite confirm scripts/generate-output-style.py defaults to output-styles/clear-writing-kit.md in the repo without writing to ~/.claude, --check catches missing and stale files, committed output style matches render_claude(), and all 12 test_artifacts.py tests pass (TP-07). TP-10 is skipped on T-05 because plugin manifests are introduced in T-07.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-07: `python scripts/generate-output-style.py` with no arguments writes only `output-styles/clear-writing-kit.md` in the repository, never under `~/.claude`. `--check` fails on a stale file. `python -m unittest discover -s tests -v` passes. | Yes | PASS | Running `scripts/generate-output-style.py` without arguments writes `ROOT / "output-styles" / "clear-writing-kit.md"` and leaves `~/.claude` untouched. `--check` succeeds on clean repository file and exits 1 on stale or deleted file. `python -m unittest discover -s tests -v` ran 12 tests with 12 passed (0 failures). |
| TP-10: For each host marked verified, its plugin installs from the local repository path on a fixture home isolated through the configuration-directory variable recorded in the survey, and the installed plugin lists `coding-agent-writing`. The Claude plugin also lists the `clear-writing-kit` output style. No manifest declares an MCP server or references `web-skills/`. | No | Skipped | Skipped on T-05 per plan instructions ("Report TP-10 dependency on T-07 honestly; do not claim plugin installation before manifests exist"). T-05 ships the output style file in the repository; plugin manifests are built and shipped in T-07. |

#### Failed Tests

- None. All covering tests for T-05 passed.

#### Not Tested

- `TP-10: Multi-host plugin installation and listing` — Not tested during T-05 because plugin manifests (.claude-plugin/plugin.json, .codex-plugin/plugin.json) are scheduled for implementation and test in T-07.

### [T-06] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 0 | Failed: 1 | Skipped: 1
Verdict: FAIL
Evidence: Python probes verify generator --check, size budget (<2048 bytes), skill version drift detection, and home instruction, but TP-08 fails because the begin marker in install/agents-block.md omits v=2.0.0 and the block text omits the fallback placeholder <runtime command>; TP-09 is skipped pending T-09 install apply.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-08: `python scripts/generate-agents-block.py --check` passes on committed `install/agents-block.md`. Block starts with `<!-- clear-writing-kit:begin v=2.0.0 -->`, ends with `<!-- clear-writing-kit:end -->`, under 2,048 bytes, names `coding-agent-writing`, `lintText`, fallback command with `<runtime command>` and `<home>`, no drive/user paths. Changed skill version fails `--check`. | Yes | FAIL | Generator `--check` passes on clean repo; 1,504 bytes is under 2,048 budget; oversize raises ValueError; version drift fails `--check`; ends with end marker; names skill, `lintText`, `<home>`, and runtime forms without machine paths. Fails because begin marker is `<!-- clear-writing-kit:begin -->` without `v=2.0.0` (violating R-11, R-18, Task Goal, TP-08), and fallback command text omits `<runtime command>`. |
| TP-09: Fallback command from `install/agents-block.md`, with `<home>` resolved and each runtime command form (`node`, `deno run -A`, `bun`), prints findings when run from cmd.exe and from PowerShell after `apply` on a fixture home. | No | Skipped | Skipped on T-06 per plan instructions ("T-06 dependency limit: TP-09 exercises fallback commands after apply and also covers T-09. Preserve it as mandatory at T-09 if install apply is unavailable during T-06. Do not claim it ran before its prerequisite exists."). Scheduled for T-09 when `cwk install apply` is implemented. |

#### Failed Tests

- `TP-08: Begin marker omits version attribute v=2.0.0` — Task Goal, R-11, R-18, and TP-08 require the instruction block to start with `<!-- clear-writing-kit:begin v=<version> -->` (specifically `<!-- clear-writing-kit:begin v=2.0.0 -->` matching `skills/coding-agent-writing/SKILL.md` metadata). The emitted and committed block in `install/agents-block.md` begins with `<!-- clear-writing-kit:begin -->` lacking the version parameter. R-18 relies on the `v=` marker during upgrades to replace existing instruction blocks.
- `TP-08: Instruction block omits <runtime command> placeholder` — Task Goal requires emitting "the fallback command `<runtime command> <home>/.clear-writing-kit/cwk.mjs check`, listing the forms `node`, `deno run -A`, and `bun`" and TP-08 requires naming "the fallback command with `<runtime command>` and `<home>`". The block lists the three specific runtime forms and explains `<home>`, but omits the `<runtime command>` placeholder.

#### Not Tested

- `TP-09: Fallback command verification after install apply` — Not run on T-06 because `cwk install apply` has not yet been implemented (scheduled for T-09). The dependency limit is recorded honestly per plan instructions and preserved as mandatory at T-09.

### [T-06] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 1 | Failed: 0 | Skipped: 1
Verdict: PASS
Evidence: Python test suite and CLI checks verify python scripts/generate-agents-block.py --check passes on install/agents-block.md, exact begin/end markers with v=2.0.0, 1,504-byte size under 2,048 budget, required tokens (coding-agent-writing, lintText, node, deno run -A, bun, <runtime command> <home>/.clear-writing-kit/cwk.mjs check, home resolution), no drive or user paths, version drift detection, and 16/16 passing unit tests in tests/test_artifacts.py (TP-08). TP-09 is skipped pending T-09 install apply.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-08: `python scripts/generate-agents-block.py --check` passes on committed `install/agents-block.md`. Block starts with `<!-- clear-writing-kit:begin v=2.0.0 -->`, ends with `<!-- clear-writing-kit:end -->`, under 2,048 bytes, names `coding-agent-writing`, `lintText`, fallback command with `<runtime command>` and `<home>`, no drive/user paths. Changed skill version fails `--check`. | Yes | PASS | `generate-agents-block.py --check` passes on clean repo. Block starts with `<!-- clear-writing-kit:begin v=2.0.0 -->` and ends with `<!-- clear-writing-kit:end -->\n`. Byte size (1,504 bytes) is within 2,048 budget. Oversize content raises ValueError. Required tokens present (`coding-agent-writing`, `lintText`, `node`, `deno run -A`, `bun`, `<runtime command> <home>/.clear-writing-kit/cwk.mjs check`, `Resolve <home>`). No drive letters or machine paths. Version drift and stale content fail `--check`. All 16 tests in `tests/test_artifacts.py` pass. |
| TP-09: Fallback command from `install/agents-block.md`, with `<home>` resolved and each runtime command form (`node`, `deno run -A`, `bun`), prints findings when run from cmd.exe and from PowerShell after `apply` on a fixture home. | No | Skipped | Skipped on T-06 per plan instructions ("T-06 dependency limit: TP-09 exercises fallback commands after apply and also covers T-09. Preserve it as mandatory at T-09 if install apply is unavailable during T-06. Do not claim it ran before its prerequisite exists."). Scheduled for T-09 when `cwk install apply` is implemented. |

#### Failed Tests

- None. All covering tests for T-06 passed.

#### Not Tested

- `TP-09: Fallback command execution after install apply` — Not run during T-06 because `cwk install apply` has not yet been implemented (scheduled for T-09). The dependency limit is preserved as mandatory at T-09.

### [T-06] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 2 | Passed: 1 | Failed: 0 | Skipped: 1
Verdict: PASS
Evidence: python scripts/generate-agents-block.py --check passes on committed install/agents-block.md (1,504 bytes < 2,048 budget), python -m unittest discover -s tests -v passes all 16 tests, and TP-08 assertions hold on committed HEAD c6e86b3.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-08: Instruction block generation, check mode, marker bounds, and size limit | Yes | PASS | `python scripts/generate-agents-block.py --check` passes on `install/agents-block.md` (1,504 bytes < 2,048 limit); markers `<!-- clear-writing-kit:begin v=2.0.0 -->` and `<!-- clear-writing-kit:end -->` verified; required tokens (`coding-agent-writing`, `lintText`, `node`, `deno run -A`, `bun`, `<runtime command> <home>/.clear-writing-kit/cwk.mjs check`, `Resolve <home>`, persistent core) present; no drive letters or host user paths; check fails on stale content and version drift |
| TP-09: Fallback command execution in cmd.exe and PowerShell on fixture home | No | Skipped | NotRun pending T-09 (`cwk install apply`); plan dependency limit: fallback execution requires applied launcher on fixture home |

#### Failed Tests

- None. All covering executable tests for T-06 passed.

#### Not Tested

- `TP-09`: Deferred to T-09 in accordance with plan dependency limit ("T-06 dependency limit: TP-09 exercises fallback commands after apply and also covers T-09. Preserve it as mandatory at T-09 if install apply is unavailable during T-06. Do not claim it ran before its prerequisite exists.").

### [T-07] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 1 | Passed: 1 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: python scratch/test_tp10.py: isolated fixture installation verified for Claude Code (CLAUDE_CONFIG_DIR) and Codex CLI (CODEX_HOME), listing coding-agent-writing and clear-writing-kit output style without MCP or web-skills

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-10: Plugin installation on isolated fixture homes for verified hosts (Claude Code, Codex CLI) listing `coding-agent-writing` and output style with no MCP or web-skills | Yes | PASS | Verified on clean fixture homes via `CLAUDE_CONFIG_DIR` and `CODEX_HOME`; Claude lists `coding-agent-writing` (Skills count 1) and caches `output-styles/clear-writing-kit.md`; Codex lists `clear-writing-kit@clear-writing-kit` as installed/enabled with `skills/coding-agent-writing/SKILL.md`; all manifests verified free of MCP declarations and `web-skills` references. |

#### Failed Tests

- None.

#### Not Tested

- None. All covering test plan rows for T-07 (TP-10) were executed and verified against isolated fixture homes.

### [T-07] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 6 | Passed: 6 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: TP-10 verified across Claude Code 2.1.286 and Codex CLI 0.159.3 isolated fixture homes, passing static schema audits, CLI validation, clean installation, inventory listing, and regression test suites.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| Manifest static schema check: Claude and Codex manifests declare only `skills/coding-agent-writing/`, Claude declares output style, source points to `.`, no MCP servers, no `web-skills/`, no manifests for unverified hosts | Yes | PASS | Checked `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`. Zero forbidden tokens. |
| CLI manifest validation: `claude plugin validate` on plugin and marketplace manifests | Yes | PASS | Both manifests passed validation with exit code 0. |
| Claude Code isolated fixture installation: `CLAUDE_CONFIG_DIR` isolated home | Yes | PASS | Local marketplace added, plugin `clear-writing-kit@clear-writing-kit` installed at version 2.0.0, enabled. `claude plugin details` confirms `Skills (1) coding-agent-writing` and `MCP servers (0)`. Cache contains `output-styles/clear-writing-kit.md`. |
| Codex CLI isolated fixture installation: `CODEX_HOME` isolated home | Yes | PASS | Local marketplace added, plugin `clear-writing-kit@clear-writing-kit` installed at version 2.0.0, status `installed, enabled`. Cache contains `skills/coding-agent-writing/SKILL.md` and `.codex-plugin/plugin.json` declaring `./skills/coding-agent-writing`. |
| Regression test: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 12 tests, 12 passed, exit code 0. |
| Regression test: Checkers suite | Yes | PASS | `node --test test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

None.

#### Not Tested

- TP-09: Fallback command verification after `apply`. Skipped because `apply` prerequisite is delivered in T-09.

### [T-08] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 15 | Passed: 15 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); 17/17 independent Node/Deno/Bun probes passed covering TP-05, TP-11, TP-12, TP-13, TP-14, TP-15, TP-16, TP-17, TP-22, TP-28, TP-32, TP-34, TP-36, Python artifacts (12/12), and checkers suite (26/26).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build; `git status --porcelain dist/` produced 0 diff. |
| TP-11: Host identity exact matching, mismatch error, and missing `--agent` | Yes | PASS | `--agent claude` with `CLAUDECODE` and `CODEX_COMPANION_SESSION_ID` passes and generates plan hash; `--agent codex` with only `CLAUDECODE` set fails with mismatch error and no hash; variable prefixes (`CLAUDECODE_XYZ`) fail; missing `--agent` fails with exit code 2. |
| TP-12: Runtime selection and `which()` with PATH fixtures | Yes | PASS | `which()` resolves `.cmd` via `PATHEXT`; runtime selection picks Node >= 20.18 first, skips Node 18 to pick Deno >= 2 with `run -A`, skips Deno < 2 to pick Bun, and returns absolute path. |
| TP-13: `plan` is read-only and diffs only kit's own block and entries | Yes | PASS | File hashes of existing `CLAUDE.md` and `settings.json` unchanged on disk after `plan`; diff shows only kit block additions with no existing content leaked as added lines. |
| TP-14: Deterministic plan hash across multiple runs | Yes | PASS | Two consecutive `plan` invocations on unchanged fixture home yield identical 64-character SHA-256 plan hashes. |
| TP-15: Unverified host lists manual steps without hash and refuses apply | Yes | PASS | `plan --agent copilot` lists manual installation steps (plugin, MCP, instruction block), emits no plan hash, explains apply refusal, and exits with code 1. |
| TP-16: Conflict reporting for legacy writing skill, block, and foreign outputStyle | Yes | PASS | `plan` detects and reports planted `accurate-answer` skill directory, instruction block naming `accurate-answer`, and non-kit `outputStyle`, without deleting any of them. |
| TP-17: Config token redaction | Yes | PASS | Secret API tokens planted in fixture host `settings.json` are never printed in `plan` stdout or stderr. |
| TP-22: Argument containing space and `&` preserved through `.cmd` stub | Yes | PASS | `run()` passing `"arg with space & ampersand"` to `.cmd` stub receives full quoted argument intact on Node, Deno, and Bun on Windows. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node, Deno, and Bun lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-32: Corrupted manifest handling | Yes | PASS | Invalid JSON in `install-manifest.json` causes `plan` to fail with error mentioning manifest and emit no plan hash. |
| TP-34: No qualifying runtime on PATH | Yes | PASS | When no qualifying runtime exists on PATH, `plan` reports an error and emits no plan hash. |
| TP-36: Subcommand exit code contracts | Yes | PASS | Valid `plan` exits 0; host mismatch and unverified host exit 1; invalid arguments and unknown subcommands exit 2. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 12 tests, 12 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- None. All 15 covering criteria and regression suites passed.

#### Not Tested

- TP-09: Fallback command execution after `apply`. Deferred until `apply` is delivered in T-09.
- TP-14 (`apply` branch): Target change detection and refusal during `apply`. Deferred until T-09.
- TP-15 (`apply` branch): Refusal to run `apply` on unverified host. Deferred until T-09.
- TP-16 (`verify` branch): Conflict reporting during `verify`. Deferred until T-10.
- TP-17 (`apply`, `verify`, `uninstall` branches): Secret non-leakage during subsequent subcommands. Deferred until respective tasks land.
- TP-32 (`apply` branch): Corrupted manifest refusal during `apply`. Deferred until T-09.
- TP-36 (`apply`, `verify`, `uninstall` branches): Subcommand exit code checks for future subcommands. Deferred until respective tasks land.

### [T-09] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 20 | Passed: 20 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); 18/18 independent Node/Deno/Bun probes passed covering TP-09, TP-14, TP-15, TP-17, TP-18, TP-19, TP-20, TP-21, TP-22, TP-23, TP-28, TP-29, TP-30, TP-32, TP-33, TP-35, TP-36, TP-37, Python artifacts (16/16), and checkers suite (26/26).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-09: Fallback command execution after `apply` | Yes | PASS | Fallback command template `<runtime> <home>/.clear-writing-kit/cwk.mjs check` executes and prints results across Node, Deno (`run -A`), and Bun from both cmd.exe and PowerShell. |
| TP-14: Deterministic plan hash and target change detection/refusal during `apply` | Yes | PASS | Unchanged state yields identical 64-char SHA-256 plan hash; mutating a target file after plan causes `apply` to refuse execution, leave target unmodified, and report hash mismatch. |
| TP-15: Unverified host lists manual steps without hash and refuses apply | Yes | PASS | `plan --agent copilot` lists manual installation steps without plan hash; `apply --agent copilot` refuses to run with exit code 1. |
| TP-17: Config token redaction | Yes | PASS | Host secrets in fixture `settings.json` are never printed in `apply` stdout or stderr. |
| TP-18: Normal `apply` execution and idempotency | Yes | PASS | `apply` copies payload, registers MCP server, runs plugin install, inserts instruction block, updates `settings.json`, and records completed steps in manifest; repeat execution is idempotent. |
| TP-19: CRLF, UTF-8 BOM preservation, and spaces in home path | Yes | PASS | `apply` preserves UTF-8 BOM and CRLF line endings on instruction files and succeeds when user home path contains spaces. |
| TP-20: Stop on failure and resume | Yes | PASS | When an MCP step fails, `apply` aborts immediately, manifest records prior completed steps, subsequent `plan` displays only remaining steps, and subsequent `apply` resumes to completion. |
| TP-21: `settings.json` preservation and backup | Yes | PASS | `apply` updates only `outputStyle`, preserves 4-space indentation and exact key ordering, and creates an automatic backup in `.clear-writing-kit/backups`. |
| TP-22: Argument containing space and `&` preserved through `.cmd` stub | Yes | PASS | Command spawning via Windows `.cmd` stub preserves arguments containing whitespace and ampersands intact across Node, Deno, and Bun. |
| TP-23: Versioned payload and launcher upgrade | Yes | PASS | `apply` deploys versioned payload to `<home>/.clear-writing-kit/<version>/`, updates `cwk.mjs` launcher to dynamically import active version, preserves older version payloads, and launcher responds. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node, Deno, and Bun lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-29: Locked file atomic rename retry | Yes | PASS | In Windows, locked target file rename retries 5 times 100ms apart before aborting with an error naming the path, leaving target bytes unchanged. |
| TP-30: Multiple foreign blocks preserved | Yes | PASS | Files containing foreign `ccync` and `codebase-memory-mcp` blocks retain both blocks byte-for-byte identical after kit block insertion. |
| TP-32: Corrupted manifest handling | Yes | PASS | Corrupted `install-manifest.json` causes `plan` and `apply` to fail with an error explicitly mentioning the manifest. |
| TP-33: Multiple kit blocks failure | Yes | PASS | Target file containing two kit blocks causes `apply` to fail and write no files. |
| TP-35: Missing `settings.json` creates minimal file | Yes | PASS | When `settings.json` is missing, `apply` creates a new file containing only `outputStyle`. |
| TP-36: Exit code contracts across subcommands | Yes | PASS | Valid `apply` exits 0; host mismatch, unverified host, or step failure exits 1; invalid arguments or unknown subcommands exit 2. |
| TP-37: Invalid JSON settings stops before writing any file | Yes | PASS | Malformed `settings.json` causes `apply` to stop before writing payload, launcher, or settings. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- None. All 18 covering criteria and 2 regression suites passed.

#### Not Tested

- TP-16 (`verify` branch): Conflict reporting during `verify`. Deferred until T-10.
- TP-17 (`verify`, `uninstall` branches): Secret non-leakage during verify/uninstall. Deferred until respective tasks land.
- TP-24: `cwk install verify` execution. Deferred until T-10.
- TP-25: `cwk install uninstall` execution. Deferred until T-11.

### [T-10] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 9 | Passed: 9 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); 10/10 independent Node/Deno/Bun probes passed covering TP-05, TP-16, TP-17, TP-24, TP-28, TP-36; Python artifacts suite passed (16/16); checkers suite passed (26/26). Independent investigation confirmed the two reported npm test failures in writing/test/okf.test.cjs stem from pre-existing stale knowledge/usage/gemini.md (Sep 29 commit bf6d3a5).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build executed; `git status --porcelain dist/` produced 0 diff against committed payload. |
| TP-16: Conflict reporting for legacy writing skill, block, and foreign outputStyle during `verify` | Yes | PASS | `verify` detects and reports planted `accurate-answer` skill directory, instruction block naming `accurate-answer`, and non-kit `outputStyle`, without deleting or modifying any of them. |
| TP-17: Config token redaction during `verify` | Yes | PASS | Host secrets planted in fixture `settings.json` are never printed in `verify` stdout or stderr across normal or failure execution paths. |
| TP-24: `cwk install verify` execution, per-language findings, timeout, and failure states | Yes | PASS | After `apply`, `verify` reads registered MCP command via `claude mcp get`, starts server, verifies `lintText` with findings for en-US, zh-TW, and ja-JP, and passes with spaces in home path; correctly reports `incomplete` with non-zero exit code when dictionary is removed, `outputStyle` is reset, a legacy skill exists, or MCP server hangs past timeout. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node (v25.2.1), Deno (2.9.7), and Bun (1.3.12) lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-36: Exit code contracts across subcommands for `verify` | Yes | PASS | Valid `verify` exits 0 on `pass`; returns exit 1 on `incomplete`, host mismatch, unverified host, or missing `--agent`; returns exit 2 on unknown flags. |
| Investigation: Root cause of reported `npm test` failures | Yes | PASS | Investigated two failures in `writing/test/okf.test.cjs`: both stem from stale `source_sha256` in `knowledge/usage/gemini.md` dating to pre-existing commit `bf6d3a5` (2026-09-29); unrelated to T-10 implementation. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test writing/test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- None. All covering criteria and regression suites passed.

#### Not Tested

- TP-17 (`uninstall` branch): Secret non-leakage during `uninstall`. Deferred until T-11.
- TP-25: `cwk install uninstall` execution. Deferred until T-11.
- TP-36 (`uninstall` branch): Subcommand exit code checks for `uninstall`. Deferred until T-11.

### [T-10] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 10 | Passed: 10 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); 11/11 independent Node/Deno/Bun probes passed covering TP-05, TP-16, TP-17, TP-24, TP-28, TP-36, including long-lived child process termination on invalid initialize (FINDING-001); Python artifacts suite passed (16/16); checkers suite passed (26/26). Independent investigation confirmed the two reported npm test failures in writing/test/okf.test.cjs stem from pre-existing stale knowledge/usage/gemini.md (Sep 29 commit bf6d3a5).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build executed. `git status --porcelain dist/` produced 0 diff against committed payload. |
| TP-16: Conflict reporting for legacy writing skill, block, and foreign outputStyle during `verify` | Yes | PASS | `verify` detects and reports planted `accurate-answer` skill directory, instruction block naming `accurate-answer`, and non-kit `outputStyle`, without deleting or modifying any of them. |
| TP-17: Config token redaction during `verify` | Yes | PASS | Host secrets planted in fixture `settings.json` are never printed in `verify` stdout or stderr across normal or failure execution paths. |
| TP-24: `cwk install verify` execution, per-language findings, timeout, and failure states | Yes | PASS | After `apply`, `verify` reads registered MCP command via `claude mcp get`, starts server, verifies `lintText` with findings for en-US, zh-TW, and ja-JP, and passes with spaces in home path. It correctly reports `incomplete` with non-zero exit code when dictionary is removed, `outputStyle` is reset, a legacy skill exists, or MCP server hangs past timeout. |
| TP-24 / FINDING-001: Invalid initialize reply process termination and prompt exit | Yes | PASS | A long-lived server returning initialize without a valid `protocolVersion` causes `verify` to exit incomplete promptly (< 5 s) with exit code 1. `session.close()` in `finally` terminates the child process. Process table confirmation verified child PID is no longer alive. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node (v25.2.1), Deno (2.9.7), and Bun (1.3.12) lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-36: Exit code contracts across subcommands for `verify` | Yes | PASS | Valid `verify` exits 0 on `pass`. It returns exit 1 on `incomplete`, host mismatch, unverified host, or missing `--agent`. It returns exit 2 on unknown flags. |
| Investigation: Root cause of reported `npm test` failures | Yes | PASS | Investigated two failures in `writing/test/okf.test.cjs`. Both stem from stale `source_sha256` in `knowledge/usage/gemini.md` dating to pre-existing commit `bf6d3a5` (2026-09-29), unrelated to T-10 implementation. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test writing/test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- None. All covering criteria and regression suites passed.

#### Not Tested

- TP-17 (`uninstall` branch): Secret non-leakage during `uninstall`. Deferred until T-11.
- TP-25: `cwk install uninstall` execution. Deferred until T-11.
- TP-36 (`uninstall` branch): Subcommand exit code checks for `uninstall`. Deferred until T-11.

### [T-11] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 5 | Passed: 4 | Failed: 1 | Skipped: 0
Verdict: FAIL
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); independent probes verify TP-17, TP-28, TP-36, Python artifacts (16/16), and checkers (26/26). TP-25 failed during native Codex CLI lifecycle because codex plugin remove requires <plugin>@<marketplace> or --marketplace.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build executed. `git status --porcelain dist/` produced 0 diff against committed payload. |
| TP-17: Config token redaction during `uninstall` | Yes | PASS | Secret API tokens planted in fixture host `settings.json` are never printed in `uninstall` stdout or stderr. |
| TP-25: `cwk install uninstall` clean fixture home restoration, hand-edited block retention, re-pointed MCP retention, changed payload retention, and upgrade removal | Yes | FAIL | Block unit tests, Claude Code native lifecycle, and mocked stubs passed. Native Codex CLI lifecycle failed at plugin removal: `codex plugin remove clear-writing-kit` exited with code 1 because Codex requires `<plugin>@<marketplace>` or `--marketplace`. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node (v25.2.1), Deno (2.9.7), and Bun (1.3.12) lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-36: Exit code contracts across subcommands for `uninstall` | Yes | PASS | Valid `uninstall` exits 0 on `done`. It returns exit 1 on `incomplete`, host mismatch, unverified host, or missing `--agent`. It returns exit 2 on unknown flags. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test writing/test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- `TP-25: Native Codex CLI plugin removal syntax error` — When running `cwk install uninstall --agent codex` against an isolated native Codex CLI installation (`CODEX_HOME`), the plugin removal step fails.
  - Command executed by `src/install/uninstall.ts:141`: `codex plugin remove clear-writing-kit`.
  - Observed behavior: Command exited with code 1 and emitted `Error: plugin requires --marketplace unless passed as <plugin>@<marketplace>`. `uninstall` returned `status: "incomplete"` and exited with code 1. The manifest was not deleted, and the plugin was not uninstalled.
  - Expected behavior: `uninstall` removes the plugin through the native host remove command and returns `status: "done"`. Native Codex CLI syntax requires either `clear-writing-kit@clear-writing-kit` (matching the argument used during `applyPlan`: `codex plugin add clear-writing-kit@clear-writing-kit`) or passing `--marketplace clear-writing-kit`.

#### Not Tested

- None. All covering test plan rows for T-11 (TP-05, TP-17, TP-25, TP-28, TP-36) were tested.

### [T-11] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 7 | Passed: 7 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: npm --prefix writing run build matches dist/ (TP-05: 0 diff); independent probes verify TP-17, TP-25, TP-28, TP-36, Python artifacts suite (16/16), and checkers suite (26/26). Native Codex CLI plugin removal passed with qualified identity clear-writing-kit@clear-writing-kit; full apply/verify/uninstall cycles verified on native Claude Code and native Codex CLI with isolated configuration directories.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build executed. `git status --porcelain dist/` produced 0 diff against committed payload `b0f2d66`. |
| TP-17: Config token redaction during `uninstall` | Yes | PASS | Planted secrets in host `settings.json` never appeared in `uninstall` stdout or stderr. |
| TP-25: `cwk install uninstall` clean fixture home restoration, hand-edited block retention, re-pointed MCP retention, changed payload retention, upgrade removal, and native host lifecycles | Yes | PASS | `removeBlock` unit tests, clean home restoration, hand-edited block retention, re-pointed MCP retention, changed payload retention, upgrade version A to B removal, and native Claude Code & Codex CLI lifecycles all passed. Native Codex CLI plugin removal succeeded using `clear-writing-kit@clear-writing-kit`, transitioning status to `not installed`. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node (v25.2.1), Deno (2.9.7), and Bun (1.3.12) lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-36: Exit code contracts across subcommands for `uninstall` | Yes | PASS | Valid `uninstall` exits 0 on `done`. Missing `--agent`, host mismatch, or unverified host exits 1. Unknown flags exit 2. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test writing/test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- None. All covering criteria and regression suites passed.

#### Not Tested

- None. All covering test plan rows for T-11 (TP-05, TP-17, TP-25, TP-28, TP-36) and regression suites were tested.

### [T-12] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 6 | Passed: 6 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: TP-26 verified with 10/10 R-19 item-by-item anchoring quotes from INSTALL.md; TP-27 verified with README 3-language parity (python test_readme_languages_have_equal_commands_and_local_links passed), removal of global settings disclaimer, and verification.md additions; direct Markdown lint (markdownlint-cli2 0 errors), docs lint (lint-docs.cjs 0 errors), profile/output-style/block generator checks, zhtw-mcp on zh-TW (0 errors, 0 warnings), Python artifacts suite (16/16), and checkers suite (26/26) all passed at commit 02a3c59.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-26: `INSTALL.md` covers R-19 item by item with anchoring quotes | Yes | PASS | Quotes validated for runtime preflight (L7-14), repo clone/committed `dist/` (L24-25), `plan` (L34-39), show output (L41), explicit confirmation wait (L45-46), `apply --plan-hash` (L50-53), `verify` (L60-63), separate pass/fail reporting (L70-71), ban on direct config edits (L29-30), and new session request (L75-76). |
| TP-27: README 3-language parity, removed disclaimer, updated generator docs, and verification.md | Yes | PASS | Parity confirmed across en-US, zh-TW, and ja-JP; old "does not edit global settings" text eliminated; generator default repo destination documented; `docs/verification.md` details `verify`, host support scopes, uninstall retention/restoration limits, and historical baseline distinction. |
| Changed documents lint: Markdown and writing quality | Yes | PASS | `npx --prefix writing markdownlint-cli2 --config writing/.markdownlint-cli2.jsonc "INSTALL.md" "README.md" "docs/verification.md"` produced 0 errors across all 3 files. `node writing/lint-docs.cjs` reported 0 errors. `zhtw-mcp` on Chinese README text reported 0 errors and 0 warnings. |
| Generator check parity: profile, output-style, and agents-block | Yes | PASS | `node writing/generate-profiles.cjs --check`, `python scripts/generate-output-style.py --check`, and `python scripts/generate-agents-block.py --check` all passed with exit code 0. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Checkers suite | Yes | PASS | `node --test writing/test/checkers.test.cjs` executed 26 tests, 26 passed, exit code 0. |

#### Failed Tests

- None. All covering criteria and regression suites passed.

#### Not Tested

- Full baseline `npm --prefix writing run okf:check` / `npm --prefix writing run lint`: pre-existing failure in `writing/test/okf.test.cjs` on `knowledge/usage/gemini.md` dates to commit `bf6d3a5` (2026-09-29). As specified in task constraints, `knowledge/` is not modified and baseline failures are distinguished from direct changed-document checks.
- Live new-session agent activation: requires interactive human agent session as specified in Step 7 human review checklist.

### [T-12] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 7 | Passed: 7 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: python -m unittest discover -s tests -v passed (16/16), npm --prefix writing run lint passed (0 errors), npm --prefix writing run okf:check passed (0 errors), and npm --prefix writing test passed (40/40); INSTALL.md quotes validated for all R-19 clauses.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-26: `INSTALL.md` covers R-19 item by item with anchoring quotes | Yes | PASS | Anchoring quotes verified for runtime preflight (lines 7, 10, 11-14), repository clone and committed payload (lines 24-25), ban on direct configuration edits (lines 29-30), read-only plan (lines 35, 38), showing plan output (line 41), explicit confirmation wait (lines 45-46), apply with plan hash (lines 50, 53), verify execution (lines 60, 63), separate pass and fail reporting (lines 70-71), and new session request for behavior check (lines 75-76). |
| TP-27: README 3-language parity, removed disclaimer, updated generator docs, and verification.md | Yes | PASS | Parity confirmed across English, Traditional Chinese, and Japanese sections. `test_readme_languages_have_equal_commands_and_local_links` passed. The legacy disclaimer that the repository does not edit global agent settings is removed. `npm --prefix writing run lint` and `npm --prefix writing run okf:check` passed with 0 errors. |
| Regression: Full writing test suite | Yes | PASS | `npm --prefix writing test` executed 40 tests, 40 passed, 0 failed. The two historical OKF failures are cleared following the authorized Gemini knowledge refresh. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Generator check parity | Yes | PASS | `node writing/generate-profiles.cjs --check`, `python scripts/generate-output-style.py --check`, and `python scripts/generate-agents-block.py --check` all passed with exit code 0. |
| Document lint: Markdown and writing quality | Yes | PASS | `npx --prefix writing markdownlint-cli2 --config writing/.markdownlint-cli2.jsonc INSTALL.md README.md docs/verification.md` reported 0 errors across 3 files. `node writing/lint-docs.cjs` reported 0 errors. `zhtw` MCP tool reported 0 errors and 0 warnings on updated README Traditional Chinese text. |
| Build parity: Fresh build matches committed payload | Yes | PASS | `npm --prefix writing run build` ran cleanly. `git status --porcelain dist/` showed 0 diff against committed payload at HEAD `53602d3`. |

#### Failed Tests

- None. All covering criteria, regression suites, and verification checks passed.

#### Not Tested

- None. All covering test plan rows for T-12 (TP-26 and TP-27), document lints, build checks, and regression suites were tested.

### [T-13] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 10 | Passed: 10 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: node --test writing/test/installer-registration.test.cjs executed 16 tests, 16 passed, exit code 0; npm --prefix writing test executed 56 tests, 56 passed, exit code 0; python -m unittest discover -s tests -v executed 16 tests, 16 passed, exit code 0; npm --prefix writing run lint passed with 0 errors; fresh build matched dist/ with 0 diff.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-38: Complete current MCP command and ordered args observed using captured native output shapes and CLI fixtures; argument add/remove/reorder/change invalidates plan approval; stale apply writes nothing; reader rejects malformed/ambiguous output and distinguishes recognized absence from auth/permission/timeout; exact matching unregisters while changed/unreadable entries remain; runtime preference changes cannot authorize removal; formatted outputs omit secret sentinels | Yes | PASS | 9 focused test blocks in `writing/test/installer-registration.test.cjs` prove full TP-38 acceptance criteria. Argument changes alter the computed plan hash. Stale apply returns mismatch error with zero filesystem writes and zero host mutation calls. Claude and Codex readers reject duplicate fields, unsupported transports, ambiguous quotes, and non-JSON args without an anchor. Explicit absence is separated from 401 unauthorized, EACCES permission denied, and timeout errors. Exact matching removes CLI entries during uninstall while changed and unreadable registrations remain kept. Planted sentinels do not appear in formatted output. |
| TP-39: Shared verify reader starts parsed registered command on runtimes, probes all three languages, and skips unreadable entries without guessing; space-containing launcher paths remain intact; fresh build parity and regression suites pass | Yes | PASS | Probes verify stdio communication, `initialize`, `tools/list`, and `tools/call` with findings for en-US, zh-TW, and ja-JP. Unreadable and absent registrations mark server checks as skipped without executing fallback commands. Space-containing fixture home paths and launcher scripts execute and verify cleanly. |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | Clean build ran via `npm --prefix writing run build`. `git status --porcelain dist/` produced 0 diff against committed payload at HEAD 81dd822. |
| TP-17: Config token redaction during plan, apply, verify, and uninstall | Yes | PASS | Planted secret token sentinels in host settings, environment variables, and error output lines never appear in formatted plan, apply, verify, or uninstall outputs. |
| TP-24: `cwk install verify` execution, per-language findings, timeout, and failure states | Yes | PASS | Verify returns status pass on working registrations. Verify returns status incomplete when `outputStyle` is reset, when a legacy skill directory exists, or when the MCP server times out. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | `cwk install --help` executed on Node (v25.2.1), Deno (2.9.7), and Bun (1.3.12) lists `plan`, `apply`, `verify`, and `uninstall` with exit code 0. |
| TP-36: Exit code contracts across subcommands | Yes | PASS | Valid operations exit 0. Subcommands exit 1 on missing `--agent` or host mismatch. Subcommands exit 2 on unknown flags or missing required `--plan-hash` for apply. |
| Regression: Full writing test suite | Yes | PASS | `npm --prefix writing test` executed 56 tests across checkers, okf, and installer-registration test suites, 56 passed, 0 failed. |
| Regression: Python artifacts suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Documentation and profile lint suite | Yes | PASS | `npm --prefix writing run lint` executed profile check, okf check, docs lint, and markdownlint-cli2 with 0 errors across all checked files. |

#### Failed Tests

- None. All covering criteria, integration scenarios, and regression suites passed.

#### Not Tested

- None. All covering test plan rows for T-13 (TP-38, TP-39, TP-05, TP-17, TP-24, TP-28, TP-36) and regression suites were directly tested.

### [T-13] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 10 | Passed: 10 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: node --test writing/test/installer-registration.test.cjs passed (16/16), npm --prefix writing test passed (56/56), python -m unittest discover -s tests -v passed (16/16), npm --prefix writing run lint passed (0 errors), npm --prefix writing run okf:check passed (0 errors), and npm --prefix writing run build matched dist/ (0 diff).

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-38: Complete MCP command and ordered args observation, plan invalidation, stale apply protection, error classification, exact match removal, and secret redaction | Yes | PASS | 9 tests in writing/test/installer-registration.test.cjs verify all TP-38 criteria. Added, removed, reordered, and changed arguments alter the computed plan hash. Stale apply returns mismatch error with zero filesystem writes and zero host CLI mutations. Claude and Codex readers reject duplicate fields, unsupported transports, ambiguous quotes, and non-JSON args without an anchor. Explicit absence is distinguished from 401 unauthorized, EACCES permission denied, and timeout errors. Exact matching removes CLI entries during uninstall while changed and unreadable registrations are kept. Formatted outputs omit secret sentinels. |
| TP-39: Shared verify reader starts registered command on runtimes, probes all three languages, and skips unreadable entries without guessing | Yes | PASS | Probes verify stdio communication, initialize, tools/list, and tools/call with findings for en-US, zh-TW, and ja-JP. Unreadable and absent registrations mark server checks as skipped without executing fallback commands. Space-containing fixture home paths and launcher scripts execute and verify cleanly. |
| TP-05: Fresh build produces zero diff against committed dist/ | Yes | PASS | Clean build ran via npm --prefix writing run build. git status --porcelain dist/ produced 0 diff against committed payload at HEAD 81dd822. |
| TP-17: Config token redaction during plan, apply, verify, and uninstall | Yes | PASS | Planted secret token sentinels in host settings, environment variables, and error output lines never appear in formatted plan, apply, verify, or uninstall outputs. |
| TP-24: cwk install verify execution, per-language findings, timeout, and failure states | Yes | PASS | Verify returns status pass on working registrations. Verify returns status incomplete when outputStyle is reset, when a legacy skill directory exists, or when the MCP server times out. |
| TP-28: install --help lists subcommands across runtimes | Yes | PASS | cwk install --help executed on Node (v25.2.1), Deno (2.9.7), and Bun (1.3.12) lists plan, apply, verify, and uninstall with exit code 0. |
| TP-36: Exit code contracts across subcommands | Yes | PASS | Valid operations exit 0. Subcommands exit 1 on missing --agent or host mismatch. Subcommands exit 2 on unknown flags or missing required --plan-hash for apply. |
| Regression: Full writing test suite | Yes | PASS | npm --prefix writing test executed 56 tests across checkers, okf, and installer-registration test suites, 56 passed, 0 failed. |
| Regression: Python artifacts suite | Yes | PASS | python -m unittest discover -s tests -v executed 16 tests, 16 passed, exit code 0. |
| Regression: Documentation and profile lint suite | Yes | PASS | npm --prefix writing run lint and npm --prefix writing run okf:check passed with 0 errors across all checked files. |

#### Failed Tests

- None. All covering criteria, integration scenarios, and regression suites passed.

#### Not Tested

- None. All covering test plan rows for T-13 (TP-38, TP-39, TP-05, TP-17, TP-24, TP-28, TP-36) and regression suites were directly tested.

### [T-13] 2026-10-02

Run: 2026-10-02
Mode: spec
Browser Route: No runnable browser route
Total: 16 | Passed: 16 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: node writing/test/installer-registration.test.cjs passed 16/16 tests; npm --prefix writing test passed 56/56; python -m unittest discover -s tests -v passed 16/16; npm --prefix writing run lint and okf:check passed with 0 errors; fresh build produced zero diff against committed dist/ at HEAD f2fd346.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-38: Complete MCP command/ordered args observed; argument add/remove/reorder/change invalidates plan approval; stale apply writes nothing; reader rejects malformed/ambiguous output; explicit absence separated from auth/permission/timeout; exact match unregisters while changed/unreadable entries remain; runtime preference changes cannot authorize removal; formatted outputs omit secret sentinels | Yes | PASS | 9 focused test blocks in `writing/test/installer-registration.test.cjs` prove full TP-38 criteria. Argument changes alter the computed plan hash. Stale apply returns mismatch error with zero filesystem writes and zero host mutation calls. Claude and Codex readers reject duplicate fields, unsupported transports, ambiguous quotes, and non-JSON args without an anchor. Explicit absence is separated from 401 unauthorized, EACCES permission denied, and timeout errors. Exact matching removes CLI entries during uninstall while changed and unreadable registrations remain kept. Planted sentinels do not appear in formatted output. |
| TP-39: Shared verify reader starts parsed registered command on runtimes, probes all three languages, and skips unreadable entries without guessing; space-containing launcher paths remain intact; fresh build parity and regression suites pass | Yes | PASS | Probes verify stdio communication, `initialize`, `tools/list`, and `tools/call` with findings for en-US, zh-TW, and ja-JP. Unreadable and absent registrations mark server checks as skipped without executing fallback commands. Space-containing fixture home paths and launcher scripts execute and verify cleanly. Permanent test files are committed at HEAD `f2fd346` and independently verified. |
| TP-05: Committed `dist/` equals fresh `npm --prefix writing run build` | Yes | PASS | `npm --prefix writing run build` executed cleanly. `git status --porcelain dist/` showed zero diff against committed payload at HEAD `f2fd346`. |
| TP-17: Config token redaction in formatted output | Yes | PASS | Secrets planted in fixture host configurations never appear in stdout or stderr for plan, apply, verify, or uninstall across normal and failure paths. |
| TP-24: `cwk install verify` execution, per-language findings, timeout, and failure states | Yes | PASS | Verified `verify` returns `incomplete` with exit 1 on missing dictionary, reset `outputStyle`, legacy conflict, or unresponsive server timeout, and succeeds with valid findings on normal homes. |
| TP-28: `install --help` lists subcommands across runtimes | Yes | PASS | Executed across runtimes; lists `plan`, `apply`, `verify`, and `uninstall` with exit 0. |
| TP-36: Exit code contracts across subcommands | Yes | PASS | Subcommands exit non-zero on host mismatch, refused unverified host, failed step, or incomplete result, and exit 0 on clean pass. |
| Regression: Full writing test suite | Yes | PASS | `npm --prefix writing test` executed 56 tests across 3 test suites, 56 passed, 0 failed, duration ~13 s. |
| Regression: Python artifacts test suite | Yes | PASS | `python -m unittest discover -s tests -v` executed 16 tests, 16 passed, exit code 0. |
| Regression: Format and lint checks | Yes | PASS | `npm --prefix writing run lint` and `npm --prefix writing run okf:check` reported 0 errors. |

#### Failed Tests

- None. All covering criteria, permanent registration tests, and regression suites passed.

#### Not Tested

- None. All covering test plan rows for T-13 (TP-38, TP-39, TP-05, TP-17, TP-24, TP-28, TP-36) and regression suites were tested against committed HEAD f2fd346.

### [T-14] 2026-10-02

Run: 2026-10-02
Mode: spec
Total: 0 | Passed: 0 | Failed: 0 | Skipped: 0
Verdict: BLOCKED
Evidence: No test command could be run because `exec_command` failed before PowerShell started with `helper_unknown_error: setup refresh had errors` on repeated attempts. The task prompt and test harness could not be inspected in this environment.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| Two-host installation orders and either first-uninstall choice preserve the surviving host registration, byte-identical block/settings, and runnable launcher | No | BLOCKED | Command runner unavailable; tests not authored. |
| Final consumer removal cleans only exact matching artifacts | No | BLOCKED | Command runner unavailable; tests not authored. |
| No-op adoption, ambiguous legacy ownership, changed old hashes, relocated configuration paths, upgrades, changed shared files/blocks, failed CLI removal, and repeated cleanup | No | BLOCKED | Command runner unavailable; tests not authored. |

#### Failed Tests

- None run.

#### Not Tested

- All T-14 acceptance scenarios. The repository could not be inspected or executed because the command runner failed during process setup.

### [T-14] 2026-10-02

Run: 2026-10-02
Mode: spec
Total: 0 | Passed: 0 | Failed: 0 | Skipped: 0
Verdict: BLOCKED
Evidence: No test commands ran. `exec_command` failed to create a process (`helper_unknown_error: setup refresh had errors`) on both initial workspace inspection attempts, so the active Test Plan, fixtures, and test runner could not be inspected. No test files were changed.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-40 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-41 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-05 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-17 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-18 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-19 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-20 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-21 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-23 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-24 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-25 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-28 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |
| TP-36 | No | BLOCKED | Could not inspect the active Test Plan or execute tests. |

#### Failed Tests

- None. No tests could be started.

#### Not Tested

- All T-14 ownership, migration, adoption, upgrade, and cleanup scenarios. Workspace execution was unavailable, so no independent integration tests could be authored or run.

### [T-14] 2026-10-02

Run: 2026-10-02
Mode: spec
Total: 0 | Passed: 0 | Failed: 0 | Skipped: 0
Verdict: BLOCKED
Evidence: Test authoring and execution did not start. `exec_command` failed before launching PowerShell with `Rejected("Failed to create unified exec process: helper_unknown_error: setup refresh had errors")` on three attempts, including `pwd` and reading the active prompt. The required source, fixtures, tests, and project conventions therefore could not be read or written.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| Host installation orders and first-uninstall choices preserve surviving registration and shared artifacts | No | BLOCKED | Could not inspect or execute repository. |
| Final consumer removal cleans exact matching artifacts only | No | BLOCKED | Could not inspect or execute repository. |
| No-op adoption, ambiguous legacy ownership, changed hashes, relocated paths, upgrades, changed shared files/blocks, failed CLI removal, and repeated cleanup | No | BLOCKED | Could not author tests or run APIs. |

#### Failed Tests

- None — no test process could be started.

#### Not Tested

- All T-14 acceptance scenarios; local process-launch setup failure prevented reading repository files, editing test files, and running tests.

### [T-14] 2026-10-02 — ORCHESTRATOR direct verification

Run: 2026-10-02
Mode: spec
Verification Independence: DEGRADED_BUNDLED
Total: 79 | Passed: 79 | Failed: 0 | Skipped: 0
Verdict: PASS
Evidence: At committed HEAD `95df4643afcbe804b100f22069400f417f893574`, `npm --prefix writing test` passed 63/63 Node tests and `python -m unittest discover -s tests -v` passed 16/16 tests. `npm --prefix writing run lint` completed with 0 errors and 10 existing wording warnings. A fresh `npm --prefix writing run build` left `dist/` unchanged, and `git diff --check` passed.

#### Coverage of Success Criteria / Scenarios

| Criteria / Scenario | Tested? | Result | Notes |
| --- | --- | --- | --- |
| TP-40: Both installation orders and either first-uninstall choice preserve the surviving host | Yes | PASS | Four production-API fixture permutations preserve the surviving MCP/plugin state, block bytes, settings bytes, ownership metadata, launcher, and three-language `verify`; final exact-match removal and repeated removal pass. |
| TP-41: Adoption, legacy migration, retained changes, retries, and cross-host upgrades | Yes | PASS | Seven permanent ownership tests cover metadata-only adoption and idempotence, explicit legacy ownership, strict schema validation, relocated settings/block paths, edited blocks, changed shared files, failed MCP removal and retry, and upgrade ownership transfer with final cleanup of both versions. |
| TP-05 and regression suites | Yes | PASS | Fresh build parity passed. The full Node and Python suites passed from committed HEAD; lint, OKF freshness, publication links, and Markdown checks completed with 0 errors. |
| TP-17 through TP-25, TP-28, and TP-36 inherited installer contracts | Yes | PASS | Existing registration, lifecycle, redaction, verify, CLI help, and exit-code regressions remained green. T-14 tests exercise production `computePlan`, `applyPlan`, `verifyInstall`, and `uninstall` with host mutation logs. |

#### Failed Tests

- None in the final committed-HEAD run. Two earlier 61/62 runs correctly failed the build-freshness assertion while an audited source fix and rebuilt bundle were still uncommitted; the committed-HEAD reruns passed.

#### Not Tested

- Real-home installation and new-session acceptance remain Step 7 human work and were explicitly outside this repair scope.

## Review Results

### Architecture Review

Remediation amendment 2026-10-02: APPROVE by isolated repair_review applying the golem-architect contract after the fixed architect model was unavailable on this account. One shared strict registration reader and a manifest schema revision are the minimum sufficient design. Unknown CLI state and legacy ownership fail closed. Two behavior-based rollback units under ten source/test/doc/generated-entry files, no new dependency or host support. No unresolved architectural question. The original review below is retained as history.

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

Remediation amendment: CLEAR. Isolated structural-atomicity and minimum-observable-probe lenses APPROVE. Fresh refining-check passes all 9 checks with 14 tasks and complete TP pairing. Permanent test code is authored only by independent TESTER after implementation. Root commits test-only additions, then fresh independent TESTER reruns final committed HEAD before audit. All existing test obligations remain. Real-home acceptance and finalize are excluded by owner instruction.

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

### [T-02] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-02 changes implementing the stdio MCP server in `src/mcp.ts`, CLI entrypoint in `src/cli.ts`, and the compiled bundle in `dist/cwk.mjs`. The server registers exactly one tool named `lintText` using `@modelcontextprotocol/server`. Input parameters are strictly validated with a Zod schema covering `text`, `language`, `genre`, and optional `filename`. No file system reading, file writing, shell execution, or auto-fix tools are exposed. Tool errors are captured safely within a try-catch block and returned as structured MCP errors without crashing the server. Profile instances remain cached in process memory and avoid redundant re-initialization. No deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-03] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-03 changes covering runtime portability, dictionary bundling, and build configuration across writing/package.json, dist/cwk.mjs, dist/dict/, and .dev/research/payload-spike.md. The build configuration pins esbuild and @modelcontextprotocol/server as exact dependencies. The bundle banner sets KUROMOJIN_DIC_PATH to a sibling dictionary path via import.meta.url. This path resolution eliminates runtime dependencies on the repository node_modules directory. The banner executes pure URL path resolution in memory with no hot-path synchronous file system I/O. The dictionary files contain static gzipped binary data copied directly from kuromoji. The payload introduces no dynamic code evaluation, network calls, or privilege boundary crossings. The review identified no deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-04] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-04 changes recording surveyed host capabilities across `src/hosts.ts` and `.dev/research/host-capabilities.md`. The implementation defines a strict, readonly typed structure (`HostCapability`) and constant array (`hosts`) with pure functions for path resolution under an injected home directory, avoiding unisolated `os.homedir()` calls or hardcoded user paths. Capability fields, CLI command templates, and verification statuses align row by row and field by field between the TypeScript constant and the research documentation. Claude Code and Codex CLI are verified with captured local command executions and official documentation URLs, while GitHub Copilot CLI, opencode, and Antigravity CLI remain explicitly unverified due to unestablished identity or configuration relocation environment variables. Path functions perform pure string interpolation without shell execution or dynamic evaluation. The exact-match environment variable definitions mitigate host identity spoofing. No deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-05] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-05 changes scoping Claude Code output style generation to the repository workspace across `scripts/generate-output-style.py`, `output-styles/clear-writing-kit.md`, and `tests/test_artifacts.py`. Updating `DEFAULT_OUTPUT` to `ROOT / "output-styles" / (PROJECT_NAME + ".md")` eliminates unexpected side effects against the host user's home directory (`~/.claude`), ensuring generator executions without arguments remain strictly confined to repository boundaries. The committed output style matches `render_claude()` byte-for-byte, verified deterministically via `--check` and unit tests. Path resolution uses standard `pathlib.Path` operations without shell execution or dynamic evaluation. No unbounded data loading, hot-path sync I/O, OWASP Top 10 vulnerabilities, or STRIDE security threats were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-06] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-06 changes implementing the agent instruction block generator across `scripts/artifacts.py`, `scripts/generate-agents-block.py`, `install/agents-block.md`, and `tests/test_artifacts.py`. Function `render_agents_block()` extracts the version from `skills/coding-agent-writing/SKILL.md` frontmatter, verifies the byte budget under 2,048 bytes, and formats markers with persistent core rules. The generated block uses the portable placeholder `<home>` to prevent leaking local environment paths. Script `generate-agents-block.py` defaults safely to `install/agents-block.md` inside the repository and supports deterministic integrity verification via `--check`. The generator runs offline without dynamic code evaluation or remote network access. The review identified no deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-07] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-07 changes delivering host plugin manifests across `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, and `.agents/plugins/marketplace.json`. Each manifest declares `clear-writing-kit` version 2.0.0 for verified hosts that support plugin skills. All manifests scope their skill declarations exclusively to `./skills/coding-agent-writing`. The Claude Code manifest also declares `./output-styles/clear-writing-kit.md`. Neither manifest declares MCP servers or references `web-skills/`. The marketplace declarations use safe relative paths pointing to the repository root. Static schema validation confirmed no path traversal vulnerabilities, no secrets, and no external network endpoints. The review identified no deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-08] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-08 changes delivering read-only installation planning (`cwk install plan`) across `src/install/spawn.ts`, `src/install/runtime.ts`, `src/install/identity.ts`, `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/block.ts`, `src/install/plan.ts`, `src/cli.ts`, and `dist/`. The implementation adheres strictly to read-only guarantees: no files or configurations are written during plan execution. Subprocess execution in `spawn.ts` safely routes `.cmd` and `.bat` through `cmd.exe /d /s /c` with defensive quoting and explicit rejection of unrepresentable metacharacters (`"`, `%`, `\r`, `\n`, `\0`), and executes non-batch binaries directly without shell evaluation. Host identity resolution in `identity.ts` enforces exact-variable matching without prefix matching, correctly distinguishing missing required variables from foreign variables present without the requested host's variable, which allows nested execution environments without spoofing. Plan hashing in `plan.ts` deterministically binds installer version, payload digest, normalized target states, manifest digest, runtime arguments, and detected conflicts without binding unstable timestamps or absolute paths. Token redaction is preserved: `settings.json` is only parsed to extract and sanitize `outputStyle`, ensuring authentication tokens and unrelated keys are never read, emitted in diffs, or leaked into error logs. Line diffing operates strictly on the kit block lines via LCS, preventing foreign file leakage. Manifest parsing validates schema integrity and rejects corruption without echoing untrusted input. No deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-09] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated T-09 changes delivering `cwk install apply` across `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/payload.ts`, `src/install/settings.ts`, `src/install/apply.ts`, `src/cli.ts`, and `dist/`. The implementation adheres strictly to security, integrity, and performance requirements. Cryptographic hash verification via `planHash` prevents TOCTOU drift and immediately halts execution before any filesystem modifications if target states change. Atomic writes in `fsutil.ts` (`writeTextAtomic`) utilize sibling temporary files with cleanup on failure and bounded Windows file-lock retry handling (5 retries at 100 ms) naming the locked path on exhaustion. Automated backups (`backup`) use `COPYFILE_EXCL` with monotonic collision counters to guarantee existing backups are never overwritten. In `payload.ts`, version deployment isolates extraction into a temporary staging directory prior to atomic substitution, and `writeLauncher` validates version strings against `/^[\w.+-]+$/` to eliminate path traversal and arbitrary code injection into dynamic imports. In `settings.ts`, `setOutputStyle` parses JSON before writing, validates the root object type without echoing file contents or secrets, and precisely edits only the `outputStyle` member while maintaining indentation, key order, BOM, and line endings. Subprocess invocations in `apply.ts` run with a 120-second timeout through `spawn.ts` argument safeguards, manifest state is committed to disk immediately after each successful step to support clean failure recovery, and diagnostic outputs are truncated to 2000 characters to prevent buffer bloat. No deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-10] 2026-10-02

**Date:** 2026-10-02
**Findings:** 1 total — 0 critical, 0 high, 0 medium, 1 low

#### Summary

The audit evaluated task T-10 changes implementing `cwk install verify` across `src/install/verify.ts`, `src/cli.ts`, and `dist/`. The implementation adheres to security boundaries, safe process execution, and configuration privacy. Host commands are resolved through exact name matching without shell interpolation, Windows `.cmd`/`.bat` commands enforce argument inspection against dangerous characters (`"`, `%`, `\r`, `\n`, `\0`), and MCP communications speak JSON-RPC 2.0 over isolated stdio pipes with dedicated per-request timeouts (30 seconds default). Host settings inspection re-reads only the target `outputStyle` key and truncates unexpected values without printing secret tokens or other keys. Legacy conflicts and instruction block byte limits are safely inspected without altering or deleting existing files. One low-severity resource cleanup defect was identified in `src/install/verify.ts:252`, where an early return on an invalid `initialize` response bypasses `session.close()`, leaving the child process and open stdio streams active on the Node.js event loop. No critical or high security vulnerabilities or deep performance bottlenecks were identified, and all success criteria (TP-16, TP-17, TP-24, TP-28, TP-36) remain satisfied.

#### Open Findings

**[LOW] FINDING-001: Omitted session cleanup on invalid initialize reply**
- File: `src/install/verify.ts:252`
- Exploit or failure scenario: If a registered server responds to `initialize` without a valid `protocolVersion` string, `checkServer` returns early before calling `session.close()`, leaving the spawned child process alive and stdio stream handles open on the Node.js event loop.
- Recommended fix: Ensure `session.close()` executes on all exit paths by wrapping MCP request execution in a `try ... finally` block or calling `session.close()` before returning on line 252.
- Confidence: 9/10

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| FINDING-001 | LOW | OPEN |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-10] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated task T-10 changes delivering `cwk install verify` across `src/install/verify.ts`, `src/cli.ts`, and `dist/cwk.mjs` through final commit 8c93c76. The verification implementation enforces rigorous security and robustness standards: host command inspection uses exact binary lookup without shell expansion, Windows batch execution parses and rejects injection characters, and MCP communications speak JSON-RPC 2.0 over isolated stdio pipes with 30-second per-call timeouts and unbuffered stderr draining. Configuration reading in `checkOutputStyle` selectively inspects only the target `outputStyle` key and truncates mismatches to 64 characters, avoiding leakage of surrounding tokens or secrets. File inspections for instruction block length and legacy conflict detection are strictly non-destructive. Commit 8c93c76 resolved FINDING-001 by placing `session.close()` in a `finally` block in `checkServer`, guaranteeing child process termination and stream cleanup across all normal, error, and early-exit paths (such as invalid protocol versions). Independent test verification confirmed prompt process exit and process table cleanup. No open security, privacy, or deep-performance findings exist.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| FINDING-001 | LOW | RESOLVED |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-11] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated task T-11 changes delivering `cwk install uninstall` across `src/install/block.ts`, `src/install/uninstall.ts`, `src/install/settings.ts`, `src/cli.ts`, and `dist/cwk.mjs` through final commit `b0f2d66`. The implementation adheres strictly to security containment, integrity verification, safe process execution, and configuration privacy. Block removal in `removeBlock` cryptographically verifies the instruction block against `expectedHash` (SHA-256 of bytes as written) before splicing, safely preserving foreign blocks and hand-edited content. Payload cleanup enforces path boundary containment (`isInside`) to ensure deletions remain strictly within `<home>/.clear-writing-kit`, and verifies file hashes against the manifest before unlinking. Host CLI removals execute without shell expansion, invoke host commands with 120-second timeouts, and enforce strict fingerprint and launcher verification before removing MCP or plugin registrations, properly qualifying the Codex plugin target (`clear-writing-kit@clear-writing-kit`). Settings modification in `clearOutputStyle` inspects only `outputStyle` and avoids leaking auth tokens or surrounding keys into outputs or logs. Automated backups are preserved, and empty directory pruning is safely bounded to the kit directory. No deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security risks were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-12] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated task T-12 changes delivering user- and agent-facing documentation across `INSTALL.md`, `README.md`, `docs/verification.md`, and the authorized generated artifact `knowledge/usage/gemini.md` through final commit `53602d3`. The documentation establishes strong security containment and defensive operations for AI coding agents: `INSTALL.md` explicitly forbids automatic runtime installation, mandates explicit user confirmation before applying installation plans, prohibits direct modification or deletion of host configuration files, requires cryptographic plan hashing to prevent state drift, and enforces separated pass and fail reporting. In `README.md`, three-language parity (English, Traditional Chinese, Japanese) is verified, the legacy disclaimer regarding global settings is replaced with accurate explanations of what files the installer touches, and safe uninstall and backup restoration procedures are documented. In `docs/verification.md`, stdio JSON-RPC transport, multi-language probes, strict exit codes, and backup preservation limits are clearly detailed. The authorized generated refresh of `knowledge/usage/gemini.md` was executed strictly via `node writing/okf.cjs --generate` with no manual tampering, resolving historical test failures and achieving complete test passage. No naming authority regressions, deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security threats were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-13] 2026-10-02

**Date:** 2026-10-02
**Findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low

#### Summary

The audit evaluated task T-13 changes delivering safe, exact comparison of MCP registrations across `src/install/registration.ts`, `src/install/plan.ts`, `src/install/apply.ts`, `src/install/verify.ts`, `src/install/uninstall.ts`, `dist/cwk.mjs`, and tests in `writing/test/installer-registration.test.cjs` and `writing/test/installer-fixtures.cjs` through final commit `f2fd346`. The shared registration reader distinguishes present, absent, and unreadable states without speculative parsing or execution. Codex queries `mcp get <name> --json` and validates the stdio transport, string command, and complete string-array args. Claude output parsing validates `Command:` and `Args:` lines, JSON arrays, or an unambiguous launcher anchor surrounded by simple tokens, rejecting duplicate fields, ambiguous quotes, repeated anchors, and non-stdio transports. Explicit absence is strictly separated from authentication, permission, and timeout failures, treating the latter as unreadable. Exact SHA-256 fingerprints of the ordered command and argument vector are recorded in the plan target state, ensuring that any argument addition, removal, reordering, or alteration invalidates prior approval and prevents stale apply writes. Uninstall unregisters only exact fingerprint matches while safely keeping changed or unreadable entries. Verification shares the reader and skips server probes on unreadable registrations without executing guessed commands. Error messages and formatted output avoid echoing raw host output, user arguments, or planted configuration secrets. No naming authority regressions, deep performance bottlenecks, OWASP Top 10 vulnerabilities, or STRIDE security threats were identified.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| None | None | CLEAR |

<!-- AUDIT_REVIEW: CLEAR -->

### [T-14] 2026-10-02 — ORCHESTRATOR direct audit

**Date:** 2026-10-02
**Verification Independence:** DEGRADED_BUNDLED
**Verdict:** CLEAR
**Open findings:** 0 total — 0 critical, 0 high, 0 medium, 0 low
**Remediated findings:** 2 medium

#### Summary

The audit covered `2016449e06be30ac0822ac15dc226f88780c42b5..95df4643afcbe804b100f22069400f417f893574`, including manifest parsing, plan hashing, metadata-only adoption, shared payload ownership, host-specific block/settings removal, exact CLI fingerprint removal, and final hash-gated cleanup. Unsupported or fractional manifest schema revisions and non-`outputStyle` schema-2 setting records now fail closed in commit `345d3bd`; saved manifests always emit revision 2. Cross-host upgrades now carry all recorded consumers onto the new payload and launcher in commit `95df464`, so removing the upgrading host cannot strand the surviving host or leave false legacy ownership. Both repairs have permanent negative or lifecycle regressions.

Deletion remains constrained to manifest paths inside `.clear-writing-kit`, exact file hashes, exact block hashes, and exact current CLI fingerprints. Changed, unreadable, failed, other-host, or unresolved legacy records are retained with reasons. Configuration contents and raw host output are not logged. No dependency, network path, host support, protected-path change, or real-home write was added. The added ownership scan is linear in the local manifest plus copied payload entries and introduces no material performance risk.

#### Open Findings

- None.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| Unknown manifest revisions and unsupported settings records were accepted as current schema | Medium | FIXED in `345d3bd`; negative parser regression passes |
| Cross-host upgrade assigned a new payload only to the upgrading host | Medium | FIXED in `95df464`; upgrade/removal lifecycle regression passes |

<!-- AUDIT_REVIEW: CLEAR -->

### Finalize Review 2026-10-03

| Requirement | L1 | L2 | L3 | L4 |
| --- | --- | --- | --- | --- |
| R-01 | PASS — The `computePlan` diff builds a deterministic read-only survey and hash; `Complete argument add/remove/reorder/change invalidates plan approval` reaches the production planner, and the live authoritative run passed. | PASS — `src/install/plan.ts` contains the complete planner, state readers, scoped diff builder, and formatter. | PASS — `src/cli.ts` routes `install plan` to `computePlan`; generated `dist/cwk.mjs` is fresh. | PASS — Environment, host CLI output, and settings are read-only inputs; output is scoped and sanitized before display. |
| R-02 | PASS — The `resolveHost` diff compares exact environment-variable names; `Subcommand exit codes for plan, apply, verify, and uninstall` exercises identity mismatch through the CLI. | PASS — `src/install/identity.ts` and the typed host records in `src/hosts.ts` are non-stub implementations. | PASS — Plan, apply, verify, and uninstall all call the same `resolveHost` function before host work. | PASS — Environment identity is untrusted; exact-name checks fail closed on missing or contradictory evidence. |
| R-03 | PASS — The `applyPlan` diff recomputes and compares the plan hash before mutation; `Stale apply writes nothing to filesystem and executes zero CLI mutations` covers the production path. | PASS — `src/install/plan.ts`, `src/install/apply.ts`, and `src/install/manifest.ts` contain hash inputs and enforcement. | PASS — The CLI requires `--plan-hash`, and the apply path calls `computePlan` before preparing writes or commands. | PASS — User-supplied hashes are untrusted and authorize work only after exact recomputation. |
| R-04 | PASS — The `applyPlan` step loop saves the manifest after each step and returns the failed step plus completed steps; `failed CLI removal retains shared runtime and a later retry cleans it` confirms persisted retry-safe lifecycle behavior through production commands. | PASS — `src/install/apply.ts` and `src/install/manifest.ts` implement per-step persistence and bounded failure output. | PASS — A subsequent plan derives remaining actions from current files, registrations, and manifest state instead of separate resume state. | PASS — Host-command failures are bounded, stop the loop, and cannot be mistaken for successful completion. |
| R-05 | PASS — The `writeTextAtomic` and `renameWithRetry` diff uses sibling temporary files, cleanup, and bounded lock retries; `both install orders and first-uninstall choices preserve the surviving host` reaches atomic writes through apply and uninstall. | PASS — `src/install/fsutil.ts`, `src/install/payload.ts`, and `src/install/settings.ts` preserve BOM and detected EOL while using non-stub atomic helpers. | PASS — Manifest, launcher, block, settings, and uninstall rewrites use `writeTextAtomic`; payload staging uses `renameWithRetry`. | PASS — Filesystem paths and lock errors are untrusted; retries are bounded and the terminal error names only the target path. |
| R-06 | PASS — Formatter diffs expose only kit-owned summaries; `Formatted outputs omit secret sentinels` exercises plan, verify, and uninstall formatting with planted secrets. | PASS — `src/install/plan.ts`, `src/install/verify.ts`, and `src/install/uninstall.ts` parse only required fields and truncate errors. | PASS — CLI output uses the dedicated formatters rather than serializing settings, environment data, or raw host responses. | PASS — Settings, environment variables, and CLI stdout are secret-bearing inputs; none is echoed verbatim. |
| R-07 | PASS — The payload and launcher diff installs under `.clear-writing-kit/<version>`; `a cross-host upgrade transfers current payload ownership and cleans after the final consumer` reaches the versioned launcher path. | PASS — `src/install/payload.ts`, committed `dist/`, and `install/agents-block.md` are complete artifacts without repository-path launch dependencies. | PASS — Apply registers MCP and writes blocks against `.clear-writing-kit/cwk.mjs`; no symlink path is present. | PASS — Version text is validated before launcher interpolation, and installed paths remain inside the injected home directory. |
| R-08 | PASS — The plugin step diff uses each verified host CLI; `both install orders and first-uninstall choices preserve the surviving host` installs the plugin through production apply. | PASS — `.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/`, and `skills/coding-agent-writing/` exist and exclude `web-skills/`. | PASS — `src/hosts.ts` supplies plugin capability metadata used by plan and apply; manifests expose only the intended skill. | PASS — Plugin installation executes an allowlisted host command with argument arrays and a repository-relative marketplace source. |
| R-09 | PASS — Runtime selection and MCP registration diffs implement Node, Deno, Bun order and one named entry; `Runtime preference changes do not authorize removal of unmatched entry` reaches exact registration state. | PASS — `src/install/runtime.ts`, `src/install/registration.ts`, and `src/install/apply.ts` contain version probes and CLI registration. | PASS — Plan-selected command and ordered arguments flow into apply, manifest fingerprints, verify, and uninstall. | PASS — PATH binaries and host registration output are untrusted; minimum versions and strict stdio parsing fail closed. |
| R-10 | PASS — The `createMcpServer` diff registers only `lintText`; `en-US document CLI and official MCP agree` and the other language-profile parity cases passed live. | PASS — `src/mcp.ts`, `src/check.ts`, and `src/rules.ts` provide the complete schema, six-profile cache, and lint implementation. | PASS — `src/cli.ts` exposes `mcp`, and the installed launcher loads the same bundled server used by verification. | PASS — MCP input is schema-validated; no read-file, write-file, shell, or fix tool is registered. |
| R-11 | PASS — The block upsert diff replaces one bounded marker pair; `test_agents_block_has_required_content_and_byte_limit` verifies markers, tool, skill, fallback, and byte budget. | PASS — `install/agents-block.md`, `scripts/artifacts.py`, and `src/install/block.ts` are generated and non-stub. | PASS — Both verified hosts consume the same generated block, and apply preserves text outside the located marker range. | PASS — Existing instruction files are untrusted; duplicate or malformed kit markers are rejected before writes. |
| R-12 | PASS — The output-style diff edits only the selected JSON member after backup; `Verify returns incomplete on missing dictionary, reset outputStyle, legacy conflict, and timeout` reaches the setting through apply and verify. | PASS — `output-styles/clear-writing-kit.md` and `src/install/settings.ts` implement the artifact and preserving editor. | PASS — Claude capability metadata enables the plan, apply, verify, manifest, and uninstall setting lifecycle. | PASS — Settings JSON is untrusted; invalid or non-object input fails before mutation and unrelated keys are not emitted. |
| R-13 | PASS — Verified-host guards in plan, apply, verify, and uninstall are present; `Subcommand exit codes for plan, apply, verify, and uninstall` reaches refusal and mismatch outcomes. | PASS — `.dev/research/host-capabilities.md` and `src/hosts.ts` provide evidence-linked capability records and verified flags. | PASS — All installer entry points share the host table and refuse mutating work for unverified hosts. | PASS — Unsupported-host capability claims are treated as absent authority; only manual steps are returned. |
| R-14 | PASS — The verify diff reads and starts the registered command and calls all three languages; `Shared verify reader starts registered command and checks en-US, zh-TW, ja-JP` passed live. | PASS — `src/install/verify.ts` contains registration, MCP session, style, block-size, and conflict checks. | PASS — Every skipped or failed check contributes to `incomplete`; the CLI maps incomplete verification to failure. | PASS — Registered commands and MCP replies are untrusted; strict parsing, per-call timeouts, and guaranteed session close bound execution. |
| R-15 | PASS — Plan and verify conflict scans retain legacy items; `Verify returns incomplete on missing dictionary, reset outputStyle, legacy conflict, and timeout` covers the incomplete result. | PASS — `src/install/plan.ts` and `src/install/verify.ts` implement skill, block, and output-style conflict discovery. | PASS — Conflict results reach formatters and verification completeness without any deletion call. | PASS — Foreign skill directories and instruction text are read-only evidence and are never treated as installer-owned. |
| R-16 | PASS — Manifest save diffs record SHA-256 files plus host, kind, name, and fingerprints; `exact current artifacts adopt missing host metadata without rewriting bytes` covers persisted ownership metadata. | PASS — `src/install/manifest.ts` has strict schema validation and atomic persistence; apply records every artifact type. | PASS — Plan hashing, apply, upgrade, verify, and uninstall share the manifest and fingerprint formats. | PASS — Manifest JSON is untrusted; unsupported revisions and malformed records fail closed without partial acceptance. |
| R-17 | PASS — Uninstall diffs compare current hashes and fingerprints before removal; `Uninstall removes exact matches and preserves changed or unreadable entries` reaches both remove and retain paths. | PASS — `src/install/uninstall.ts`, `src/install/block.ts`, and shared registration readers implement all removal guards. | PASS — File, block, setting, plugin, and MCP records flow from apply manifest entries into their matching uninstall checks. | PASS — Deletion is limited to manifest paths inside `.clear-writing-kit` with exact hashes; unreadable or changed state is retained. |
| R-18 | PASS — Upgrade diffs copy the new version, repoint the launcher, replace the marked block, and re-register MCP; `a cross-host upgrade transfers current payload ownership and cleans after the final consumer` passed live. | PASS — `src/install/payload.ts`, `src/install/apply.ts`, and ownership-aware manifest records implement the upgrade. | PASS — Normal plan and apply select the new version while preserving older payload records until safe removal. | PASS — Cross-host consumers are retained as explicit owners, preventing one host upgrade or uninstall from deleting shared runtime files. |
| R-19 | PASS — `INSTALL.md` contains runtime preflight, official links, stop, show, wait, apply, verify, split reporting, and no-direct-edit instructions; `install --help lists subcommands across runtimes` reaches the documented command surface. | PASS — `INSTALL.md` is a complete agent procedure with executable commands and explicit stop conditions. | PASS — The documented subcommands and flags match `src/cli.ts`, README installation links, and committed `dist/cwk.mjs`. | N/A — This documentation requirement adds no programmatic trust boundary; it narrows agent authority by requiring confirmation and forbidding direct configuration edits. |
| R-20 | PASS — README and verification-document diffs describe installer effects and omit the obsolete disclaimer; `test_readme_languages_have_equal_commands_and_local_links` passed live. | PASS — `README.md` and `docs/verification.md` contain complete multilingual installation and verification guidance. | PASS — Documentation commands match the CLI, and repository lint reports 0 errors across the documented surfaces. | N/A — This explanatory documentation adds no new input, write, command, path, or external-call boundary. |

#### Findings

- None. Severity: none. blocking: no.

Review Independence: DEGRADED_SAME_RUNTIME

## Debug Log

Dispatch: phase=audit task=T-12 role=AUDITOR executor=agy model=gemini-3.8-flash state=completed session_id=313fb68c-6b40-47fa-a97b-6f66d00166b9 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790931424-919424800-000000-T-12-audit-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-auditor.agent.md contract_source=embedded

T-12 audit CLEAR, zero findings. Current receipt, completed log, nonempty native session database, and unchanged HEAD verified. No whole-plan verification or real-home activation is claimed.

Dispatch: phase=test task=T-12 role=TESTER executor=agy model=gemini-3.8-flash state=completed session_id=e1dab52e-c12d-4bd4-bd50-4e454881c618 log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790931208-768857800-000000-T-12-test-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-tester.agent.md contract_source=embedded

T-12 independent TESTER passed TP-26 and TP-27 at 53602d3, including full lint/OKF, 40 Node tests, 16 Python tests, artifact checks, and fresh build parity. Current receipt, completed log, native session record, unchanged HEAD, and absence of production edits verified. Prior retry remains open pending independent audit and convergence.

Dispatch: phase=implement task=T-12 role=CODER executor=agy model=gemini-3.8-flash state=completed session_id=5780925f-6478-4ad6-a19c-cec06352a2ca log=C:/Code/clear-writing-kit/.dev/pipeline/feat-cross-agent-plugin-installer/T-12/1790930593-281821400-000000-T-12-implement-agy.log effort=medium contract=C:/Users/leetz/.gal/embedded-src/agents/golem-implementer.agent.md contract_source=embedded

T-12 documentation remediation completed. Current implementation receipt, completed attempt log, and nonempty native session database verified. HEAD remained 46ec937 during dispatch. Working-tree boundary passed for README.md, docs/verification.md, and orchestration metadata. Independent TESTER certification remains pending.
