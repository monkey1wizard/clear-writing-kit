# Plan Prompt: Local writing checks for ccync-managed installs

<!--
Generated from .dev/plans/feat-ccync-local-checks.md.
Output path: C:/Code/clear-writing-kit/.dev/plans/feat-ccync-local-checks.prompt.md
This is the shared mutable execution work file consumed by control-plane chat, /gal status, /gal whats-next, /gal pipeline, and specialist write-back flows.
-->

## Goal

When ccync installs clear-writing-kit, all five projected MCP host families must run the committed checker through one ccync-owned `clear-writing-kit-textlint` server that exposes exactly `lintText`. Persistent instructions must not reference a path that ccync does not create. Direct `cwk install` must retain safe standalone behavior and reject same-name ownership conflicts without mutation.

## Requirements

- [ ] R1 — After `ccync sync`, each of the five ccync MCP host families has exactly one ccync-owned `clear-writing-kit-textlint` server that exposes exactly `lintText`.
- [ ] R2 — Root `mcp.json` declares `node` with ordered arguments `${PLUGIN_ROOT}/dist/cwk.mjs` and `mcp`, uses the committed bundle from ccync's pinned plugin root, and requires no package installation.
- [ ] R3 — Keep `mcp.json` ccync-only. Root `plugin.json` and `.mcp.json` remain absent. Neither compatibility manifest declares `mcpServers` or references an MCP manifest. Tests fail if this boundary changes.
- [ ] R4 — Root `mcp.json` uses literal `node` with no launcher or runtime fallback. If Node.js 20.18 or later is unavailable on PATH, the MCP process cannot initialize. Automated evidence proves the exact command vector and no fallback. Host-specific error presentation is out of scope.
- [ ] R5 — Remove the fixed `.clear-writing-kit` checker fallback from the persistent instruction block and keep the generated block below 2,048 bytes.
- [ ] R6 — Enforce one owner per same-name MCP registration. Permit safe create, owned recreate, no-op, and owned update only. Unowned, unreadable, or fingerprint-drifted live entries are blocking conflicts with no applicable plan hash or MCP mutation. Apply and uninstall share `~/.clear-writing-kit.lock`. Apply acquires it before internal `computePlan`. Uninstall acquires it before reading the manifest. Both hold it through final manifest save or removal and release it in `finally`. Competing or stale locks refuse either command before writes. Apply recomputes state and rejects ownership evidence changed before the final reread. Manual writers that ignore the lock after that reread are outside the guarantee.
- [ ] R7 — Preserve direct Claude and Codex install, verify, upgrade, and uninstall behavior. Both installation orders with ccync must fail safely at the ownership boundary without removing or adopting the other owner's entry.
- [ ] R8 — Automated evidence must cover the manifest boundary, resolved command and arguments, exact tool surface, three-language findings, actual five-host ccync rendering, fail-closed collisions, apply-uninstall lock contention, stale-lock refusal, and failure-path lock release. Owner acceptance validates the published pin in five fresh host sessions. Missing, unreadable, skipped, unexpected collision, runtime failure, or `NotRun` evidence fails.
- [ ] R9 — Update the English, Traditional Chinese, and Japanese installation paths in `README.md`. Distinguish direct installer ownership from ccync projection in `INSTALL.md`, `docs/installer.md`, and `docs/verification.md`. Document lock contention and stale-lock recovery that first confirms no `cwk install apply` or `cwk install uninstall` process is active. Re-index `.dev/project.md`, then regenerate `AGENTS.md`.
- [ ] R10 — Regenerate `AGENTS.md`, `install/agents-block.md`, and `dist/` only through their existing generators. Keep the agents-block generator separate from the GAL adapter renderer.

## Approach

1. Add bare root `mcp.json` as ccync-only metadata. Keep root `plugin.json` and `.mcp.json` absent, and keep both compatibility manifests free of MCP declarations.
2. Run `node ${PLUGIN_ROOT}/dist/cwk.mjs mcp`. Remove the invalid fixed-path fallback without adding another guessed path.
3. Add an explicit external-CLI integration test outside the default Node test glob. Use one fresh isolated home for successful five-host projection and separate fresh homes with foreign same-name vectors preseeded before ccync ownership for collision cases.
4. Use the install manifest fingerprint as the direct installer's only ownership proof. Apply and uninstall share one exclusive lock from each command's first authoritative read through final manifest persistence. Refuse competing and stale locks. Release the lock in `finally` on success or error. Apply rereads the manifest entry and live registration before the first MCP mutation and rejects evidence already changed.
5. Update durable installation guidance, re-index `.dev/project.md`, and regenerate `AGENTS.md`. Exclude repository-wide structure-map initialization.
6. After the implementation commit is published and pinned, complete owner acceptance and update only evidence-backed limits in `docs/verification.md`.

Out of scope: root portable-package migration, a multi-runtime launcher, ccync behavior changes, component selectors, silent runtime fallback, and a new structure-map mechanism.

## Files to Create or Modify

- `mcp.json`
- `scripts/artifacts.py`, `install/agents-block.md`, `tests/test_artifacts.py`
- `writing/test/checkers.test.cjs`, `writing/integration/ccync-projection.test.cjs`
- `src/install/plan.ts`, `src/install/apply.ts`, `src/install/uninstall.ts`, `src/install/lock.ts`, `writing/test/installer-registration.test.cjs`, `dist/cwk.mjs`
- `README.md`, `INSTALL.md`, `docs/installer.md`, `docs/verification.md`
- `.dev/project.md`, `AGENTS.md`

## Test Cases

- Parse root `mcp.json` and enforce the exact server name, command, argument order, and compatibility-package isolation boundary.
- Start the committed bundle over stdio, require the exact tool list `[lintText]`, and require en-US, zh-TW, and ja-JP findings with the named rule IDs.
- Run an explicitly selected ccync executable against local snapshots in isolated environments. Verify every success renderer and every pre-ownership foreign-vector collision without treating skipped or missing evidence as success.
- Cover direct-installer safe transitions, ownership conflicts, both installation orders, and drift injected after apply's internal `computePlan` but before the first MCP mutation. Preserve manifest bytes visible at the final reread and require MCP remove/add counts of 0/0 on conflict.
- Cover apply-uninstall mutual exclusion, stale-lock fail-closed behavior, and lock release after post-acquisition errors in both mutation paths.
- Regenerate the agents block, `dist/`, and `AGENTS.md`. Require exact generated equality or an empty second-run diff.
- Verify multilingual installation guidance and run the authoritative Node, Python, and lint suites.

## Success Criteria

- All five ccync host families receive one working `clear-writing-kit-textlint` server with only `lintText`.
- The server command resolves to the ccync-pinned plugin root and committed bundle.
- Persistent instructions contain no path that ccync does not create.
- Direct `cwk install` remains functional alone and refuses unsafe same-name ownership conflicts without MCP mutation.
- All automated and owner-acceptance evidence passes. `NotRun` never counts as success.

## Risks

- A future root `plugin.json` would make `mcp.json` native Codex plugin metadata. Boundary tests and documentation must force an explicit redesign before that migration.
- A future Claude Code release could add bare `mcp.json` discovery. Revalidate native loader behavior when plugin schemas change.
- GUI-launched hosts may not inherit a PATH with Node.js 20.18 or later. The direct `node` process then cannot initialize. The repository verifies the command and no fallback, while each host owns error presentation.
- ccync cache paths change on upgrade. `ccync sync` must rewrite all five host registrations before old-cache removal.
- Concurrent apply and uninstall commands could otherwise overwrite manifest state or invalidate registration evidence. The shared lock serializes cooperating mutations. A crash leaves a stale lock that fails closed. Remove it only after confirming no `cwk install apply` or `cwk install uninstall` process is active.
- A manual writer can ignore the lock. Apply rejects changes visible at the final pre-mutation reread but cannot guarantee safety against a writer that races afterward.

## Owner Acceptance

OA-01 has a hard prerequisite: `ccync show clear-writing-kit` must report the
implementation commit that contains the new root `mcp.json`. If it reports an
older pin, OA-01 through OA-03 remain `NotRun` and cannot satisfy the plan.

| ID | What to check | Expected result | Pass/fail rule | Why not automated |
| --- | --- | --- | --- | --- |
| OA-01 | Run `ccync upgrade clear-writing-kit` and `ccync sync`. | Both commands complete and sync output contains no collision, skip, unresolved placeholder, or unreadable registration. | Pass only when both commands succeed and none of the four failure labels appears. | These commands mutate the owner's real host configuration and cache. |
| OA-02 | Inspect `%USERPROFILE%\.ccync\build\mcp\projected-state.json`, `%USERPROFILE%\.claude.json`, `%USERPROFILE%\.codex\config.toml`, `%USERPROFILE%\.copilot\mcp-config.json`, `%APPDATA%\opencode\opencode.json`, and `%USERPROFILE%\.gemini\config\mcp_config.json`. | State owns claude, copilot, opencode, codex, and agy. Each native config has one vector: `node`, one common pinned `dist/cwk.mjs`, `mcp`. | Pass only if all vectors resolve to `ccync show clear-writing-kit`'s pin and no second lint server exists. | Repository fixtures cannot prove the owner's current native configs and pin. |
| OA-03 | In all five hosts, select the `clear-writing-kit-textlint` server, run its server-scoped `tools/list`, and call `lintText({language:"en-US",genre:"document",text:"alpha; beta"})`, `lintText({language:"zh-TW",genre:"document",text:"alpha; beta"})`, and `lintText({language:"ja-JP",genre:"document",text:"処理は完了していません。"})`. | The selected server lists only `lintText`. Other user-owned servers and their tools may remain. The three calls contain `prose-punctuation`, `prose-punctuation`, and `ja-document-style`, respectively. | Pass only when the 5 by 4 matrix for the selected server's exact tool list plus three probes has 20 PASS cells and no `NotRun`. | Fresh host sessions and host tool pickers require owner interaction. |

## Open Questions

None.

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

---

## Status

Workflow: IMPLEMENT
Step: 1 of 5
Last activity: 2026-10-10. T-01 converged at 71f9028 (test retry 1 PASS, audit APPROVE)
Next step: start T-02
Current Task: —
Task Base Commit: 3c68d3aed8a23e3ae4316b8c0fdabe12b8becdd6
Task Final Commit: 71f902896d4a2fcbe7fb2604ce0e706bccd18f0d
Test Retry Count: 0
Review Retry Count: 0

### Deviations

| Step | Plan Said | Actually Did | Why |
| --- | --- | --- | --- |
| Preflight | Task bullets `- [ ] T-NN: ...` | Changed the separator to `- [ ] T-NN — ...` | `pipeline-preflight` check `tasks-well-formed` failed on the colon form. Task text is unchanged. The source plan received the same separator change at T-01 convergence. |
| T-01 test onward | Phases route through `config.json#executorRouting` (codex coder, agy tester/auditor) | T-01 implement ran on codex. T-01 test and every later implement, fix, test, and audit phase run as Claude subagents (`gal:golem-implementer`, `gal:golem-tester`, `gal:golem-auditor`). | Owner authorized non-standard routing on 2026-10-09. Same runtime as the orchestrator, so Verification Independence: DEGRADED_SAME_RUNTIME. |

### Handoff Notes

Prompt refreshed after final architecture verdict APPROVE, human approval, and passing planning and refining receipts. Existing execution state was preserved. No implementation task has started.

- T-01 audit FINDING-001 (medium, non-blocking): ccync 0.1.5 renders the Claude host vector as `powershell -NoProfile -Command "... & 'node' '<cache>/dist/cwk.mjs' 'mcp'"`. Codex, Copilot, and agy render `node` plus `[<cache>/dist/cwk.mjs, mcp]`, and opencode renders `[node, <cache>/dist/cwk.mjs, mcp]`. OA-02 expects a direct `node` vector in every native config, so the Claude row will not match as written. T-04 must document the Claude launcher as ccync-owned behavior. The owner decides whether OA-02 accepts it. FINDING-002 to FINDING-004 are low and open.

## Tasks

- [x] T-01 — Add the ccync-only MCP declaration and executable contract. *(71f9028)*
  - **Files**: `mcp.json`, `tests/test_artifacts.py`, `writing/test/checkers.test.cjs`, `writing/integration/ccync-projection.test.cjs`.
  - **Dependencies**: None.
  - **Change**: Declare only `clear-writing-kit-textlint` with `node` and `${PLUGIN_ROOT}/dist/cwk.mjs mcp`. Add guards that forbid root `plugin.json`, root `.mcp.json`, and MCP declarations in both compatibility manifests. Reuse the MCP client for stdio tool-list and three-language probes. Add a named ccync CLI integration test outside `writing/test/*.test.cjs`. Use a fresh home for successful five-host projection and separate fresh homes with foreign vectors preseeded before ccync ownership for byte-preserving collision checks. Require explicit `CCYNC_BIN`.
  - **Acceptance**: TP-01 through TP-05 prove the exact vector, all four isolation guards, `[lintText]`, the three named findings, actual ccync manifest selection, placeholder expansion, five native vectors, and fail-closed collisions before publication.
- [ ] T-02 — Remove the invalid checker fallback from the generated agents block.
  - **Files**: `scripts/artifacts.py`, `install/agents-block.md`, `tests/test_artifacts.py`.
  - **Dependencies**: T-01. Both tasks modify `tests/test_artifacts.py`, so run them in order.
  - **Change**: Update the maintained generator text, regenerate the committed block, and refresh only generator-owned digest expectations. Leave runtime selection and installation guidance unchanged.
  - **Acceptance**: TP-06 proves exact generated equality, no `.clear-writing-kit` checker path, and measured size below 2,048 bytes.
- [ ] T-03 — Enforce one-owner MCP mutation safety in the direct installer.
  - **Files**: `src/install/plan.ts`, `src/install/apply.ts`, `src/install/uninstall.ts`, `src/install/lock.ts`, `writing/test/installer-registration.test.cjs`, `dist/cwk.mjs`.
  - **Dependencies**: T-01. TP-05 supplies reverse-order ccync collision evidence.
  - **Change**: Use the manifest entry for the same host, kind, and name as the only ownership proof. Add the plan-time gate in `readHostState` and `computePlan`. Permit absent create and owned safe transitions only. Convert unowned, unreadable, and fingerprint-drifted entries to blocking conflicts. Add a shared exclusive-file lock helper. Apply acquires the lock before internal `computePlan`. Uninstall acquires it before reading the manifest. Both hold it through final manifest persistence and release it in `finally` on success or error. Refuse competing and stale locks before writes. Apply rereads manifest and live registration evidence immediately before the first MCP mutation and rejects changes already visible. Preserve uninstall exact-match behavior and rebuild the bundle.
  - **Acceptance**: TP-05 and TP-07 through TP-13 prove both installation orders, safe transitions, conflicts, manifest and live drift rejection, apply-uninstall serialization, stale-lock refusal, error-path release, zero unsafe mutations, direct lifecycle continuity, exact spy and write counts, and reproducible `dist/`.
- [ ] T-04 — Document the two installation ownership paths.
  - **Files**: `README.md`, `INSTALL.md`, `docs/installer.md`, `docs/verification.md`, `tests/test_artifacts.py`.
  - **Dependencies**: T-01, T-02, T-03.
  - **Change**: Add equivalent English, Traditional Chinese, and Japanese ccync quick paths. Separate direct-installer ownership from ccync projection. Document Node.js 20.18, the manifest boundary, conflict behavior, lock contention, conservative stale-lock recovery, and still-pending real-home acceptance without claiming it ran. Recovery must first confirm no `cwk install apply` or `cwk install uninstall` process is active. Add a focused artifact test.
  - **Acceptance**: TP-14 finds the same prerequisites, owner invariant, commands, lock behavior, recovery warning, and acceptance limit in every relevant durable document.
- [ ] T-05 — Re-index durable docs and regenerate adapter guidance.
  - **Files**: `.dev/project.md`, `AGENTS.md`.
  - **Dependencies**: T-04.
  - **Change**: Re-index the durable installation references in `.dev/project.md`, then run `C:\Users\leetz\.cargo\bin\gal.exe render-adapters`. Do not use the agents-block generator for `AGENTS.md` and do not introduce a repository-wide structure map.
  - **Acceptance**: TP-15 finds the revised references and an empty second-render diff for `AGENTS.md`.

## Deferred Follow-up

None.

## Analyze

Not started.

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | unit | Run `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_manifest_contract -v`. The parsed file has one exact name, `node`, and ordered args `${PLUGIN_ROOT}/dist/cwk.mjs`, `mcp`. | T-01 |
| TP-02 | unit | Run `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_native_loader_isolation -v`. Both forbidden root files are absent and both compatibility manifests omit `mcpServers` and MCP references. | T-01 |
| TP-03 | integration | Run `node --test --test-name-pattern "bundled MCP contract" writing/test/checkers.test.cjs`. Initialization succeeds and `tools/list` returns the single name `lintText`. | T-01 |
| TP-04 | integration | Run `node --test --test-name-pattern "bundled MCP language probes" writing/test/checkers.test.cjs`. The named en-US, zh-TW, and ja-JP document requests have nonempty `structuredContent.findings` containing `prose-punctuation`, `prose-punctuation`, and `ja-document-style`. | T-01 |
| TP-05 | integration | Set `CCYNC_BIN` to the absolute installed ccync executable, then run `node --test --test-name-pattern "ccync projects local clear-writing-kit MCP" writing/integration/ccync-projection.test.cjs`. One fresh isolated environment with dedicated `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, and `XDG_CONFIG_HOME` paths runs `ccync init codex`, selects all five host families, adds a plain local snapshot, and syncs. Every success renderer contains `node`, one cache-root `dist/cwk.mjs`, and `mcp`. Separate fresh environments preseed a foreign same-name vector before ccync owns that name. Every collision renderer reports the collision and preserves the foreign bytes. The named test must fail if `CCYNC_BIN` is missing, invalid, skipped, or returns unresolved or unreadable evidence. The default `npm --prefix writing test` suite does not discover this file. | T-01 |
| TP-06 | unit | Run `python -m unittest tests.test_artifacts.Artifacts.test_agents_block_ccync_contract -v`. The named test runs and proves regenerated byte equality, no `.clear-writing-kit`, and size below 2,048 bytes. | T-02 |
| TP-07 | integration | Run `node --test --test-name-pattern "installer MCP safe transitions" writing/test/installer-registration.test.cjs`. Absent, owned-missing, owned-current, and owned-stale produce remove/add counts 0/1, 0/1, 0/0, and 1/1. | T-03 |
| TP-08 | integration | Run `node --test --test-name-pattern "installer MCP ownership conflicts" writing/test/installer-registration.test.cjs`. Unowned, unreadable, drifted, and ccync-first states each block `cwk` with no applicable hash and remove/add counts 0/0. | T-03 |
| TP-09 | integration | Run `node --test --test-name-pattern "installer apply rejects ownership evidence drift" writing/test/installer-registration.test.cjs`. After apply's internal `computePlan`, inject a manifest change, manifest removal, or changed live registration before the first MCP mutation. Each case proves the second read occurred, rejects the operation, preserves bytes visible before that reread, and keeps MCP remove/add counts 0/0. | T-03 |
| TP-10 | integration | Run `node --test --test-name-pattern "installer mutations share one ownership lock" writing/test/installer-registration.test.cjs`. While apply holds `~/.clear-writing-kit.lock`, competing apply and uninstall calls refuse before payload, manifest, or MCP writes. While uninstall holds it, competing apply refuses. A preseeded stale lock blocks both commands and is not removed automatically. Record the lock path, result objects, and zero write counts for refused runs. | T-03 |
| TP-11 | integration | Run `node --test --test-name-pattern "installer ownership lock releases after failure" writing/test/installer-registration.test.cjs`. Inject one apply error and one uninstall error after lock acquisition. Each command returns the expected error, preserves expected pre-error state, and leaves no lock file. | T-03 |
| TP-12 | integration | Run `node --test --test-name-pattern "direct installer owned lifecycle" writing/test/installer-registration.test.cjs`. The named Claude and Codex install, verify, upgrade, and uninstall lifecycle test passes with exact manifest fingerprints. | T-03 |
| TP-13 | integration | Run `cmd.exe /d /c npm --prefix writing run build` twice. The second run leaves `git diff --exit-code -- dist` empty. | T-03 |
| TP-14 | documentation | Run `python -m unittest tests.test_artifacts.Artifacts.test_ccync_installation_docs_contract -v`. All three README languages expose the ccync quick path. Installation docs share the owner rule, lock contention behavior, conservative stale-lock recovery, and pending real-home limit. | T-04 |
| TP-15 | documentation | Run `C:\Users\leetz\.cargo\bin\gal.exe render-adapters` twice. The second run leaves `git diff --exit-code -- AGENTS.md` empty, and `.dev/project.md` names the revised durable installation references. | T-05 |
| TP-16 | integration | Run `cmd.exe /d /c npm --prefix writing test`. Retain the summary with zero failed Node tests. | T-01, T-02, T-03, T-04, T-05 |
| TP-17 | integration | Run `python -m unittest discover -s tests -v`. Retain the summary with every Python test `OK`. | T-01, T-02, T-03, T-04, T-05 |
| TP-18 | integration | Run `cmd.exe /d /c npm --prefix writing run lint`. Retain the lint summary with zero errors and report any advisory warnings. | T-01, T-02, T-03, T-04, T-05 |

For headless execution, every covering row also requires executor log terminal state `completed` plus the matching T-NN and test-result write-back in this prompt. Command output, spy counts, parsed result objects, or an empty named diff are required evidence. A PASS label without evidence does not satisfy a row.

## Test Results

### [T-01] 2026-10-09

Run: 2026-10-09 (clock rolled to 2026-10-10 during the run)
Mode: spec
Browser Route: No runnable browser route (not applicable; no browser surface)
Task Final Commit: 71f902896d4a2fcbe7fb2604ce0e706bccd18f0d (task base 3c68d3a); HEAD unchanged after the run
Total: 5 | Passed: 5 | Failed: 0 | Skipped: 0 (raw command outcomes; TP-05 is judged FAIL on proof adequacy, see Findings)

| TP | Command | Result | Evidence |
| --- | --- | --- | --- |
| TP-01 | `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_manifest_contract -v` | PASS | `python` on PATH is the Microsoft Store stub ("Python was not found"). Ran the same module invocation with uv CPython 3.13.16 (`%APPDATA%\uv\python\cpython-3.13.16-windows-x86_64-none\python.exe -m unittest ...`): `test_ccync_mcp_manifest_contract ... ok`, `Ran 1 test`, `OK`. The test asserts full-dict equality, so the name, `node`, and the ordered args are exact. |
| TP-02 | `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_native_loader_isolation -v` | PASS | Same interpreter substitution. `test_ccync_mcp_native_loader_isolation ... ok`, `Ran 1 test`, `OK`. Root `plugin.json` and `.mcp.json` are absent. Neither `.claude-plugin/plugin.json` nor `.codex-plugin/plugin.json` contains "mcp". |
| TP-03 | `node --test --test-name-pattern "bundled MCP contract" writing/test/checkers.test.cjs` | PASS | `✔ bundled MCP contract (254.722ms)`; tests 1, pass 1, fail 0, skipped 0. The test deep-equals the tool names against `["lintText"]` after `initialize` and `notifications/initialized`. |
| TP-04 | `node --test --test-name-pattern "bundled MCP language probes" writing/test/checkers.test.cjs` | PASS | `✔ bundled MCP language probes (571.7678ms)`; tests 1, pass 1, fail 0, skipped 0. Each probe asserts `!isError`, a nonempty `structuredContent.findings`, and the named `ruleId`. |
| TP-05 | `$env:CCYNC_BIN='C:\Users\leetz\bin\ccync.exe'` (ccync 0.1.5); `node --test --test-name-pattern "ccync projects local clear-writing-kit MCP" writing/integration/ccync-projection.test.cjs` | FAIL (proof gap; command passed) | Command: `✔ ccync projects local clear-writing-kit MCP (7858.881ms)`; tests 1, pass 1, skipped 0. With CCYNC_BIN unset, the test fails rather than skips: `fail 1`, `AssertionError: CCYNC_BIN must name an installed ccync executable` at ccync-projection.test.cjs:20, exit 1. `writing/package.json:10` runs `node --test test/*.test.cjs`, so `writing/integration/` is not discovered. The real-home host files (`.claude.json`, `.codex/config.toml`, `.copilot/mcp-config.json`, `.gemini/config/mcp_config.json`, `%APPDATA%\opencode\opencode.json`) and the `~/.ccync` mtime have the same SHA-256 and mtime before and after the run. The collision assertion does not prove that a collision was reported (Finding 1). |

Verdict: FAIL

#### Findings

1. `writing/integration/ccync-projection.test.cjs:148` and `:158` (TP-05, high): the collision-report assertion is vacuous. The collision home is created under the `mkdtemp` prefix `cwk-ccync-${host.name}-collision-`. ccync 0.1.5 echoes absolute host-file paths in its `sync` output, for example `MCP host files (may be written...)` followed by `<base>\home\.claude.json`. The pattern `/collision|conflict|foreign|unowned/i` therefore matches the temp path even when ccync reports nothing. The test also ignores the `sync` exit status (`:156`). If ccync skipped the projection silently, the foreign bytes would stay unchanged and the test would still pass. As a result, "Every collision renderer reports the collision" is not proven. Today's ccync does report the collision correctly. Probes in isolated temp homes with a neutral `neutral-` prefix showed `ccync sync --yes => status 1` and `MCP projection failed: unowned MCP entries collide with managed servers: <host>/clear-writing-kit-textlint; live entries preserved` for claude, copilot, agy, and opencode, with the foreign bytes preserved. Codex was not probed separately. Suggested fix: use a neutral temp prefix, assert `synced.status !== 0`, and match the host-specific `${host.name}/${SERVER_NAME}` collision line.
2. `writing/test/checkers.test.cjs:261` (TP-04, low, no functional mismatch): the ja-JP probe text `本ツールは開発者向けだ。` differs from the OA-03 text `処理は完了していません。`. Both texts produce `ja-document-style` through `writing/check.cjs` and `dist/cwk.mjs check` (`--language ja-JP --genre document`). OA-03 text: `1:9 error Use a plain-form sentence in Japanese documents. Preserve negation and uncertainty ja-document-style`. Committed text: `1:11 error Use the である form ...  ja-document-style`. Aligning the test text with OA-03 would make the automated evidence match the owner probe.
3. `tests/test_artifacts.py:137` (TP-02, informational): `r"mcp(?:servers|\.json)?"` is equivalent to a plain `mcp` substring search, so the optional group has no effect. The guard is correct for R3 ("omit `mcpServers` and MCP references"), but it is broader than its form suggests. It would also reject a benign descriptive mention of "MCP" in a manifest description. This is not a defect against the TP row.
4. Environment note (TP-01/TP-02): `python` resolves to the WindowsApps stub on this machine, so the literal command cannot run here. The results come from the same `-m unittest` invocation under uv CPython 3.13.16.

#### Not Tested

- Codex collision path through the neutral-prefix probe. The TOML seed was not reproduced outside the committed test, which passed for all five hosts.
- Owner Acceptance OA-01..OA-03: these need fresh host sessions and remain out of scope for T-01 automated testing.

### [T-01] 2026-10-10 (retry 1)

Run: 2026-10-10
Mode: spec
Browser Route: No runnable browser route (not applicable; no browser surface)
Task Final Commit: 71f9028 (task range 3c68d3a..71f9028); HEAD stayed at 71f9028 during and after the run
Total: 5 | Passed: 5 | Failed: 0 | Skipped: 0

| TP | Command | Result | Evidence |
| --- | --- | --- | --- |
| TP-01 | `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_manifest_contract -v` | PASS | `python` on PATH is the WindowsApps stub. I ran the same `-m unittest` invocation with `%APPDATA%\uv\python\cpython-3.13.16-windows-x86_64-none\python.exe`: `Ran 1 test`, `OK`, exit 0. |
| TP-02 | `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_native_loader_isolation -v` | PASS | Same uv CPython 3.13.16 substitution: `Ran 1 test`, `OK`, exit 0. |
| TP-03 | `node --test --test-name-pattern "bundled MCP contract" writing/test/checkers.test.cjs` | PASS | `✔ bundled MCP contract (307.4872ms)`; tests 1, pass 1, fail 0, skipped 0; exit 0. |
| TP-04 | `node --test --test-name-pattern "bundled MCP language probes" writing/test/checkers.test.cjs` | PASS | `✔ bundled MCP language probes (483.5976ms)`; tests 1, pass 1, fail 0, skipped 0; exit 0. The ja-JP probe is now the OA-03 text `処理は完了していません。` (checkers.test.cjs:261), which closes retry-0 Finding 2. |
| TP-05 | `$env:CCYNC_BIN='C:\Users\leetz\bin\ccync.exe'` (ccync 0.1.5); `node --test --test-name-pattern "ccync projects local clear-writing-kit MCP" writing/integration/ccync-projection.test.cjs` | PASS | Ran the test with CCYNC_BIN set: `✔ ccync projects local clear-writing-kit MCP (8061.9267ms)`; tests 1, pass 1, fail 0, skipped 0; exit 0. Ran it again with CCYNC_BIN unset: the test fails and does not skip (`fail 1`, `skipped 0`, `AssertionError: CCYNC_BIN must name an installed ccync executable`, exit 1). The collision assertion is no longer vacuous; mutation evidence is below. Real-home `.codex/config.toml`, `.copilot/mcp-config.json`, `.gemini/config/mcp_config.json`, `%APPDATA%\opencode\opencode.json`, and the `~/.ccync` mtime have identical SHA-256 and mtime before and after the run. `~/.claude.json` changed during the run, but it contains no `clear-writing-kit-textlint` (0 occurrences). The change comes from the live Claude Code session rewriting its own state file, not from the test. |

Verdict: PASS

#### TP-05 non-vacuity verification (retry-0 Finding 1)

Code check: the collision temp prefix is now `cwk-ccync-${host.name}-seeded-` (ccync-projection.test.cjs:149). The test now asserts `synced.status !== 0` (:159). It also requires one output line that contains `${host.name}/clear-writing-kit-textlint` and matches `/collid|collision/i` (:160-162). Neither the temp path nor the cache path can contain a `<host>/clear-writing-kit-textlint` segment. On the success path, `base` is removed from the output before the `/unresolved|unreadable|collision|collide/i` check runs (:133-134).

Mutation run: I made scratch copies of the test with ROOT pinned to the repo. Each copy wraps `run()` so that it rewrites a failing `sync` result. No repo file was modified. Results with ccync 0.1.5:
- CONTROL (identity): pass 1, exit 0. All five hosts emit a real `<host>/clear-writing-kit-textlint` collision line and fail sync.
- A (collision lines removed): fail 1, with `claude renderer must report the claude/clear-writing-kit-textlint collision`.
- B (sync status forced to 0): fail 1, with `claude sync must fail when a foreign registration owns clear-writing-kit-textlint`.
- C (silent skip, status 1, output only echoes a path containing `collision`): fail 1, with `must report the ... collision`. The retry-0 vacuous pattern no longer passes.
- D (collision line for the wrong host token): fail 1, with `must report the ... collision`.

#### Findings

None blocking. Two retry-0 notes still apply:
- `tests/test_artifacts.py:137` (TP-02, informational): `r"mcp(?:servers|\.json)?"` matches the same strings as a plain `mcp` substring search.
- The literal `python` command cannot run on this machine because of the WindowsApps stub. TP-01 and TP-02 evidence comes from uv CPython 3.13.16 running the same `-m unittest` invocation.

#### Not Tested

- The mutants exercised the shared collision predicate on the first host (claude) only. Collision evidence for the other four hosts comes from the unmutated CONTROL and TP-05 runs, which passed for all five hosts.
- Owner Acceptance OA-01..OA-03 need fresh host sessions and are outside T-01 automated testing.

## Review Results

### Architecture Review

CLEAR. Root `mcp.json` remains ccync-only. Direct-installer mutation requires matching manifest ownership and live fingerprint evidence. Apply and uninstall share one exclusive lock from their first authoritative read through final manifest persistence, with fail-closed contention and `finally` cleanup. Literal `node` and no fallback are the repository-owned runtime contract. The isolated final re-review returned APPROVE with no blocking finding. Residual risks are manual writers, stale locks after crashes, active-lock removal, and externally mutable host discovery and cache paths.

### Business Review

Not requested. The change adds no business rule, pricing, or permission surface.

### Design Review

Not requested. The change has no user interface.

### Engineering Review

CLEAR. Five atomic tasks and 18 executable probes cover declaration boundaries, real ccync rendering, MCP runtime behavior, direct-installer ownership, apply-time drift, apply-uninstall serialization, error cleanup, generated artifacts, durable documentation, and adapter regeneration. TP-10 isolates mutual exclusion and stale-lock refusal. TP-11 separately proves error-path cleanup. Missing or `NotRun` evidence fails. Planning and refining receipts passed.

### [T-01] Audit 2026-10-10

**Date:** 2026-10-10
**Scope:** `git diff 3c68d3a 71f9028 -- mcp.json tests/test_artifacts.py writing/test/checkers.test.cjs writing/integration/ccync-projection.test.cjs` (HEAD `71f9028`, unchanged by this audit)
**Findings:** 4 total: 0 critical, 0 high, 1 medium, 3 low

Verdict: APPROVE

Security finding: none confirmed. One low-severity defensive hardening note (FINDING-002) concerns environment isolation for future ccync versions. It is not exploitable with ccync 0.1.5.
Protected Path finding: none. T-01 touched only `mcp.json`, `tests/test_artifacts.py`, `writing/test/checkers.test.cjs`, `writing/integration/ccync-projection.test.cjs`, and `.dev/` bookkeeping. No file under `skills/coding-agent-writing/`, `web-skills/web-answer-writing/`, `src/`, `scripts/artifacts.py`, `writing/okf.cjs`, generated outputs, or `dist/` changed.

#### Summary

`mcp.json` matches R2 and R4 exactly. It has one server, `clear-writing-kit-textlint`, with literal `node` and ordered args `${PLUGIN_ROOT}/dist/cwk.mjs`, `mcp`, and TP-01 enforces this with full-dict equality. The R3 guard is sound. Root `plugin.json` and `.mcp.json` are asserted absent. Both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` are rejected on any case-insensitive `mcp` substring, which is stricter than required. TP-03 and TP-04 reuse `mcpClient`, which has a 20 s per-request timeout, so `finally { server.child.kill(); }` always runs and no child process outlives a hang. The probes cannot pass on an empty or error response because they assert `!isError`, nonempty findings, and the named `ruleId`. The ccync integration test sits outside the default glob (`writing/package.json` runs `node --test test/*.test.cjs`). It fails rather than skips when `CCYNC_BIN` is absent, spawns without a shell, uses `mkdtemp` bases removed in `finally`, and excludes `.git`, `.dev`, `node_modules`, `build`, `__pycache__`, and `.pytest_cache` from the snapshot. No tracked file is lost to that filter. Home isolation holds for ccync 0.1.5. A scan of the binary shows that it resolves state and host paths only from `USERPROFILE` and `APPDATA`, and `HOME` appears only in its cargo-install detection. An isolated probe that I ran confirmed that all five host files and the cache resolve under the temp home. Snapshot cost is about 26 MB per copy (about 25 MB is `dist/`, mostly the kuromoji dictionary), copied 6 times plus ccync cache copies, and the measured run time is about 8 s. That cost is acceptable for an opt-in integration test and is not a finding. No N+1, unbounded-load, injection, or shell-spawn issue was found.

#### Open Findings

**[MEDIUM] FINDING-001 (NON-BLOCKING): ccync projection test accepts any wrapper around `node`. Claude is actually rendered through a PowerShell launcher.**
- File: `writing/integration/ccync-projection.test.cjs:79-89` (substring checks at `:81-82`)
- Evidence: `assertResolvedVector` only checks that the stringified vector contains `node`, contains `mcp`, has no `${PLUGIN_ROOT}`, and has exactly one cache `dist/cwk.mjs` path. I ran an isolated probe in a `mkdtemp` home with ccync 0.1.5 and the same setup/add/sync steps. Codex, Copilot, and agy render `command: "node"` with args `[<cache>/dist/cwk.mjs, "mcp"]`. Opencode renders `command: ["node", <cache>/dist/cwk.mjs, "mcp"]`. Claude renders `{"command":"powershell","args":["-NoProfile","-Command","$env:PLUGIN_DATA = '…'; $env:PLUGIN_ROOT = '…'; & 'node' '…/dist/cwk.mjs' 'mcp'"]}`. The test passes on this launcher vector, and neither the test nor `## Risks` records that ccync uses this launcher.
- Failure scenario: a future ccync that renders a launcher or a runtime fallback, for example `cmd /c node … || npx …`, for any host would still pass TP-05. R4's "no launcher or runtime fallback" property would then be lost silently at the projected host, and R8's "resolved command and arguments" evidence would not detect it. Today's Claude projection also depends on `powershell` being on the host's PATH, which is the same GUI-PATH class of risk already listed for `node`.
- Recommended fix: assert exact per-host vectors. Use `command === "node"` and `args` deep-equal to `[payload, "mcp"]` for codex, copilot, and agy. Use `command` deep-equal to `["node", payload, "mcp"]` for opencode. Pin the Claude PowerShell form exactly, ending in `& 'node' '<payload>' 'mcp'`, and record the Claude launcher in `## Risks` or `docs/verification.md` (T-04) as ccync-owned behavior.
- Confidence: 9/10

**[LOW] FINDING-002 (NON-BLOCKING): `isolatedEnv` inherits every host-home override from the developer environment.**
- File: `writing/integration/ccync-projection.test.cjs:26-35`
- Evidence: the function spreads `process.env` and overrides only `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, and `XDG_CONFIG_HOME`. It does not override or remove `HOMEDRIVE`/`HOMEPATH`, `XDG_DATA_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME`, `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, `COPILOT_HOME`, or `OPENCODE_CONFIG*`. ccync 0.1.5 reads none of these, and none is set on this machine, so the test is safe today.
- Failure scenario: if a future ccync, or a host CLI that ccync spawns, honours one of these variables while a developer has it set, the test writes to the real host configuration. The test then fails because the expected temp file is missing, but only after the real configuration has already changed.
- Recommended fix: delete the known host-home variables from the child env, or set them under `home`. Optionally assert before the first `ccync` call that no inherited variable resolves outside `base`.
- Confidence: 8/10

**[LOW] FINDING-003 (NON-BLOCKING): the R3 guard does not cover marketplace manifests.**
- File: `tests/test_artifacts.py:134-137`
- Evidence: the guard checks only the two `plugin.json` files. `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` are also plugin-loader inputs. A Claude marketplace plugin entry can carry manifest fields such as `mcpServers` inline. Both marketplace files are MCP-free today.
- Failure scenario: an inline `mcpServers` entry added to a marketplace plugin entry would make Claude load an MCP server natively while TP-02 still passes.
- Recommended fix: add both marketplace files to the same lowercase `mcp`-substring loop.
- Confidence: 8/10

**[LOW] FINDING-004 (NON-BLOCKING): `initializeMcp` was added, but the identical inline sequence remains.**
- File: `writing/test/checkers.test.cjs:192-195` versus `:204-205` and `:222-223`
- Evidence: the two pre-existing MCP tests still repeat the same `initialize` request and `notifications/initialized` write.
- Failure scenario: a future protocol-version bump updates the helper but misses the two inline copies.
- Recommended fix: call `initializeMcp(server)` in the two existing tests.
- Confidence: 9/10

#### Notes (outside the formal findings)

- TP-03 and TP-04 launch the bundle with `process.execPath`, not the literal `node` from `mcp.json`. The literal vector is proven only by TP-01. This is acceptable under the current TP wording.
- Two fixed-name directories, `%TEMP%\cwk-ccync-experiment` and `%TEMP%\cwk-ccync-probe`, dated 2026-10-09 23:52, are leftovers from earlier manual probes, not from the committed test, which uses `mkdtemp` and removes its directory in `finally`. They can be deleted by hand.
- My own probe used a scratch copy of the test with `ROOT` pinned to the repo and a `mkdtemp` home. It removed its temp base and the scratch copy. No tracked file was edited.

#### Remediation Tracking

| Finding | Severity | Blocking | Status |
| --- | --- | --- | --- |
| FINDING-001 | MEDIUM | NON-BLOCKING | OPEN |
| FINDING-002 | LOW | NON-BLOCKING | OPEN |
| FINDING-003 | LOW | NON-BLOCKING | OPEN |
| FINDING-004 | LOW | NON-BLOCKING | OPEN |

<!-- AUDIT_REVIEW: CLEAR -->

## Debug Log

None.
