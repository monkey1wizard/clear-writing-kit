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
Step: 4 of 5
Last activity: 2026-10-10. T-04 converged at 46d42ff (test PASS, audit APPROVE)
Next step: start T-05
Current Task: —
Task Base Commit: c3d132e669d07e375a6ddada85d3416e6470caa2
Task Final Commit: 46d42ff338604bca8ff2afcc520f47e9212c8d16
Test Retry Count: 0
Review Retry Count: 0

### Deviations

| Step | Plan Said | Actually Did | Why |
| --- | --- | --- | --- |
| Preflight | Task bullets `- [ ] T-NN: ...` | Changed the separator to `- [ ] T-NN — ...` | `pipeline-preflight` check `tasks-well-formed` failed on the colon form. Task text is unchanged. The source plan received the same separator change at T-01 convergence. |
| T-01 test onward | Phases route through `config.json#executorRouting` (codex coder, agy tester/auditor) | T-01 implement ran on codex. T-01 test and every later implement, fix, test, and audit phase run as Claude subagents (`gal:golem-implementer`, `gal:golem-tester`, `gal:golem-auditor`). | Owner authorized non-standard routing on 2026-10-09. Same runtime as the orchestrator, so Verification Independence: DEGRADED_SAME_RUNTIME. |
| T-03 implement | T-03 allowlist excluded `writing/test/installer-ownership.test.cjs` | Added it to the allowlist. Split its adoption test so a missing MCP manifest entry is blocked with `hash: null` and 0/0 MCP mutations, while file, block, and settings adoption still pass. | The old test required adopting an unowned MCP entry with an identical vector, which R6 forbids. The owner chose to continue the pipeline after option A was recommended on 2026-10-10. |

### Handoff Notes

Prompt refreshed after final architecture verdict APPROVE, human approval, and passing planning and refining receipts. Existing execution state was preserved. No implementation task has started.

- T-01 audit FINDING-001 (medium, non-blocking): ccync 0.1.5 renders the Claude host vector as `powershell -NoProfile -Command "... & 'node' '<cache>/dist/cwk.mjs' 'mcp'"`. Codex, Copilot, and agy render `node` plus `[<cache>/dist/cwk.mjs, mcp]`, and opencode renders `[node, <cache>/dist/cwk.mjs, mcp]`. OA-02 expects a direct `node` vector in every native config, so the Claude row will not match as written. T-04 must document the Claude launcher as ccync-owned behavior. The owner decides whether OA-02 accepts it. FINDING-002 to FINDING-004 are low and open.

#### Human Handback — boundary-scope-decision

- Status: RESOLVED
- Reason: boundary-scope-decision
- Task: T-03
- Phase: IMPLEMENT
- Producer: orchestrator, after `gal:golem-implementer` fix-free implement dispatch
- Producer state: T-03 implement output is uncommitted in the worktree at HEAD `5deadcd`. Changed files are `src/install/lock.ts` (new), `src/install/plan.ts`, `src/install/apply.ts`, `src/install/uninstall.ts`, `writing/test/installer-registration.test.cjs`, and the rebuilt `dist/cwk.mjs`. `gal boundary-check --task T-03` passes. TP-07 through TP-12 pass one by one. TP-13 build is reproducible. Lint has 0 errors. `npm --prefix writing test` reports 74 tests, 72 pass, 2 fail. One failure is "Fresh build produces zero diff against committed dist/", which needs the rebuilt `dist/` to be committed. The other is `writing/test/installer-ownership.test.cjs:132` "exact current artifacts adopt missing host metadata without rewriting bytes". It expects a live MCP entry that has no manifest entry but equals the planned vector to be adopted (`ready`). R6 says the manifest entry is the only ownership proof, so the new plan returns `blocked`. The file is outside the T-03 allowlist and the Boundary Widening Protocol does not cover a behavior change.
- Git HEAD: 5deadcd
- Resolution: 2026-10-10. Owner said "continue pipeline" after option A was recommended. Option A was applied.
- Next human step: Choose one option. Option A widens the T-03 allowlist to `writing/test/installer-ownership.test.cjs`, records a Deviation, and changes that test to expect `blocked`, `hash: null`, and 0/0 MCP mutations while it keeps the file, block, and settings adoption checks. Option B approves a spec deviation that adopts an unowned entry whose fingerprint equals the planned vector, with no MCP mutation. Option B lets `cwk` take over a ccync entry with an identical vector, which conflicts with R7. Then rerun `/gal pipeline '#file:.dev/plans/feat-ccync-local-checks.prompt.md' from T-03 stop-at T-03`. Keep the uncommitted T-03 output in place.
- What to check: The owner decision recorded in this block and the result of `cmd.exe /d /c npm --prefix writing test` after the chosen change and the T-03 commit.
- Expected result: The decision is recorded, and the full Node suite reports 0 failures with the T-03 commit in place.
- Pass/fail rule: Pass only when an explicit owner choice is recorded and the full Node suite has zero failed tests. Otherwise fail.

#### Interrupted Phase — T-03 / IMPLEMENT

- Status: RESOLVED
- Cause: unknown
- Workflow at interruption: IMPLEMENT
- Durable state present:
  - Task Base Commit: c3d132e669d07e375a6ddada85d3416e6470caa2
  - Task Final Commit: 46d42ff338604bca8ff2afcc520f47e9212c8d16
  - Worktree: dirty
  - Test Results: no
  - Review Results: no
- Resume action: After the owner decision, apply the chosen test or spec change, run `gal boundary-check` for T-03, commit, then dispatch T-03 test and audit.

## Tasks

- [x] T-01 — Add the ccync-only MCP declaration and executable contract. *(71f9028)*
  - **Files**: `mcp.json`, `tests/test_artifacts.py`, `writing/test/checkers.test.cjs`, `writing/integration/ccync-projection.test.cjs`.
  - **Dependencies**: None.
  - **Change**: Declare only `clear-writing-kit-textlint` with `node` and `${PLUGIN_ROOT}/dist/cwk.mjs mcp`. Add guards that forbid root `plugin.json`, root `.mcp.json`, and MCP declarations in both compatibility manifests. Reuse the MCP client for stdio tool-list and three-language probes. Add a named ccync CLI integration test outside `writing/test/*.test.cjs`. Use a fresh home for successful five-host projection and separate fresh homes with foreign vectors preseeded before ccync ownership for byte-preserving collision checks. Require explicit `CCYNC_BIN`.
  - **Acceptance**: TP-01 through TP-05 prove the exact vector, all four isolation guards, `[lintText]`, the three named findings, actual ccync manifest selection, placeholder expansion, five native vectors, and fail-closed collisions before publication.
- [x] T-02 — Remove the invalid checker fallback from the generated agents block. *(5c8a40f)*
  - **Files**: `scripts/artifacts.py`, `install/agents-block.md`, `tests/test_artifacts.py`.
  - **Dependencies**: T-01. Both tasks modify `tests/test_artifacts.py`, so run them in order.
  - **Change**: Update the maintained generator text, regenerate the committed block, and refresh only generator-owned digest expectations. Leave runtime selection and installation guidance unchanged.
  - **Acceptance**: TP-06 proves exact generated equality, no `.clear-writing-kit` checker path, and measured size below 2,048 bytes.
- [x] T-03 — Enforce one-owner MCP mutation safety in the direct installer. *(dc11252)*
  - **Files**: `src/install/plan.ts`, `src/install/apply.ts`, `src/install/uninstall.ts`, `src/install/lock.ts`, `writing/test/installer-registration.test.cjs`, `writing/test/installer-ownership.test.cjs`, `dist/cwk.mjs`. The ownership test was added on 2026-10-10 because its exact-match adoption case contradicts R6.
  - **Dependencies**: T-01. TP-05 supplies reverse-order ccync collision evidence.
  - **Change**: Use the manifest entry for the same host, kind, and name as the only ownership proof. Add the plan-time gate in `readHostState` and `computePlan`. Permit absent create and owned safe transitions only. Convert unowned, unreadable, and fingerprint-drifted entries to blocking conflicts. Add a shared exclusive-file lock helper. Apply acquires the lock before internal `computePlan`. Uninstall acquires it before reading the manifest. Both hold it through final manifest persistence and release it in `finally` on success or error. Refuse competing and stale locks before writes. Apply rereads manifest and live registration evidence immediately before the first MCP mutation and rejects changes already visible. Preserve uninstall exact-match behavior and rebuild the bundle.
  - **Acceptance**: TP-05 and TP-07 through TP-13 prove both installation orders, safe transitions, conflicts, manifest and live drift rejection, apply-uninstall serialization, stale-lock refusal, error-path release, zero unsafe mutations, direct lifecycle continuity, exact spy and write counts, and reproducible `dist/`.
- [x] T-04 — Document the two installation ownership paths. *(46d42ff)*
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
Task Final Commit: 46d42ff338604bca8ff2afcc520f47e9212c8d16 (task base 3c68d3a); HEAD unchanged after the run
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
Task Final Commit: 46d42ff338604bca8ff2afcc520f47e9212c8d16 (task range 3c68d3a..71f9028); HEAD stayed at 71f9028 during and after the run
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

### [T-02] 2026-10-10

Run: 2026-10-10
Mode: spec
Browser Route: No runnable browser route (not applicable)
Commit: 5c8a40f283d345d2262c191445d8b184c55e023d (range 290b5dc..5c8a40f)
Interpreter: `python` on PATH is the WindowsApps stub, so every command ran with `%APPDATA%\uv\python\cpython-3.13.16-windows-x86_64-none\python.exe` (Python 3.13.16) and the same arguments.
Total: 24 | Passed: 24 | Failed: 0 | Skipped: 0

| TP | Command | Result | Evidence |
| --- | --- | --- | --- |
| TP-06 | `python -m unittest tests.test_artifacts.Artifacts.test_agents_block_ccync_contract -v` | PASS | `test_agents_block_ccync_contract ... ok`, `Ran 1 test in 0.108s`, `OK`. The test runs `scripts/generate-agents-block.py --output <tempdir>/agents-block.md` in a subprocess and asserts byte equality with the committed `install/agents-block.md`, equality with `render_agents_block()`, no `.clear-writing-kit`, and size < `AGENTS_BLOCK_BUDGET` (asserted == 2048). Independent check: the block is 1388 bytes (`wc -c`), and `grep -c ".clear-writing-kit"` returns 0. |
| TP-06 (regeneration) | `python scripts/generate-agents-block.py` | PASS | `wrote C:\Code\clear-writing-kit\install\agents-block.md`, exit 0. Afterwards `git status --short -- install/agents-block.md` is empty, so regeneration is byte-identical. HEAD is still `5c8a40f`. |
| TP-17 (partial) | `python -m unittest discover -s tests -v` | PASS | `Ran 23 tests in 1.352s`, `OK`, exit 0, with no FAIL or ERROR lines. This covers only the Python suite at T-02. The full TP-17 closeout is later. |

Verdict: PASS

#### Coverage of Success Criteria

| Criteria | Tested? | Result | Notes |
| --- | --- | --- | --- |
| R5: no fixed `.clear-writing-kit` checker fallback in the generated block | Yes | PASS | 0 matches in `install/agents-block.md`. The generator source `scripts/artifacts.py:55` no longer emits the template or the `<home>` line. |
| R5: generated block below 2,048 bytes | Yes | PASS | 1388 bytes measured independently |
| R10: block regenerated only through its existing generator | Yes | PASS | The generator rerun produced no diff. TP-06 invokes the real generator script, not a file-to-itself comparison. |

#### Not Tested

- TP-16 (`npm --prefix writing test`) and TP-18 (lint) were not run in this dispatch. They are NotRun, not PASS.

Findings

1. Generator-exercise judgment: TP-06 does exercise the generator. `tests/test_artifacts.py:356-367` runs `scripts/generate-agents-block.py` through `subprocess` into a temp file and compares those bytes to the committed file. It does not compare a file to itself. Severity: none.
2. Out-of-scope references to `~/.clear-writing-kit/cwk.mjs` remain (T-04 durable docs, not T-02). `README.md:105`, `README.md:205`, `README.md:305`, `docs/installer.md:61` and related lines 52/54/60/62, and `docs/verification.md:73` describe the direct `cwk install` launcher and payload. These describe installer behavior, and the direct installer still creates that path (`src/install/apply.ts:46`, `src/install/plan.ts:175`, `src/install/verify.ts:297`). None of them is a persistent-instruction fallback. No other generated instruction surface still contains `<home>` or the `.clear-writing-kit/cwk.mjs check` template. `git grep "cwk.mjs check"` matches only the block, its generator, and its test. R5 covers only the generated block. Whether the README or docs should say that ccync installs do not create this path belongs to T-04. Severity: low, out of T-02 scope.
3. Reworded runtime sentence (`install/agents-block.md:6`): "If it is unavailable, run the installed `cwk.mjs check` command with one of these runtime commands". This is accurate because it names no path that ccync does not create. It also follows the project prose rules: no semicolons, em dashes, or parenthetical asides, and the condition comes before the action. One limitation: the sentence no longer tells the agent where `cwk.mjs` is (ccync uses `${PLUGIN_ROOT}/dist/cwk.mjs`, and direct install uses `~/.clear-writing-kit/cwk.mjs`). An agent without `lintText` must find it on its own. This is a usability gap, not an inaccuracy, and R5 accepts it by design. Severity: informational.

### [T-03] 2026-10-10

| TP | Command | Result | Evidence |
| --- | --- | --- | --- |
| TP-05 | `CCYNC_BIN=C:\Users\leetz\bin\ccync.exe; node --test --test-name-pattern "ccync projects local clear-writing-kit MCP" writing/integration/ccync-projection.test.cjs` | PASS | tests 1, pass 1, fail 0. Covers cwk-first then ccync collision (R7 order 1). |
| TP-07 | `node --test --test-name-pattern "installer MCP safe transitions" writing/test/installer-registration.test.cjs` | PASS | tests 1, pass 1, fail 0. Counts come from the fixture spy `mutationCalls` filtered by family/verb (installer-fixtures.cjs:167), not constants. absent: create remove/add 0/1; owned-missing: create 0/1; owned-current: none 0/0; owned-stale: update 1/1. Also asserts live vector and manifest fingerprint after each step. |
| TP-08 | `node --test --test-name-pattern "installer MCP ownership conflicts" writing/test/installer-registration.test.cjs` | PASS | tests 1, pass 1, fail 0. unowned, unreadable, drifted, ccync-first each: status=blocked, hash=null (asserted `plan.hash === null`, installer-registration.test.cjs:828), remove/add 0/0, earlier and guessed hashes rejected as mismatch, live and manifest bytes preserved, no lock left. ccync-first is R7 order 2. |
| TP-09 | `node --test --test-name-pattern "installer apply rejects ownership evidence drift" writing/test/installer-registration.test.cjs` | PASS | tests 1, pass 1, fail 0. Drift injected after computePlan via beforeOwnershipReread; the second read is proven (`rereads.length === 1`, line 919). Manifest change, manifest removal and live change each give failed at mcp, remove/add 0/0, manifest bytes and live registration equal those seen at reread. |
| TP-10 | `node --test --test-name-pattern "installer mutations share one ownership lock" writing/test/installer-registration.test.cjs` | PASS | tests 1, pass 1, fail 0. Apply-holding (competing apply + uninstall refused), uninstall-holding (competing apply refused), and stale lock (apply and uninstall refused, lock bytes unchanged, plan does not take lock). Refusal message names the lock path; snapshots show zero host mutation calls and unchanged manifest, launcher and live state. |
| TP-11 | `node --test --test-name-pattern "installer ownership lock releases after failure" writing/test/installer-registration.test.cjs` | PASS | tests 1, pass 1, fail 0. Lock confirmed held at injection, then absent after the apply error (and after a thrown afterLock) and after the uninstall error; uninstall retry returns done. Zero MCP calls, manifest and live preserved. |
| TP-12 | `node --test --test-name-pattern "direct installer owned lifecycle" writing/test/installer-registration.test.cjs` | PASS | tests 1, pass 1, fail 0. Claude and Codex: install (0/1), verify pass, upgrade owned-current (0/0), verify pass, uninstall (1/0), manifest and lock gone; exact fingerprints match. |
| TP-13 | `cmd.exe /d /c npm --prefix writing run build` x2, each followed by `git diff --exit-code -- dist` | PASS | Both builds exit 0; `git diff --exit-code -- dist` exit 0 after each (empty diff; only an LF/CRLF warning). HEAD stayed dc11252. |
| TP-16 (partial) | `cmd.exe /d /c npm --prefix writing test` | PASS | tests 75, pass 75, fail 0, cancelled 0, skipped 0, exit 0. Also `node --test writing/test/installer-ownership.test.cjs`: tests 8, pass 8, fail 0. |

Verdict: PASS

Findings

None blocking. Observations:
- R7 both orders are covered: cwk-first then ccync by TP-05; ccync-first then cwk by TP-08 "ccync-first". The ccync-first case runs only for the codex host (installer-registration.test.cjs:804-813); the claude host is covered by the generic unowned case (line 770), same code path.
- The TP-10 stale-lock case asserts the lock bytes are unchanged and zero mutation calls, so the "never auto-removed" requirement is proven.

### [T-04] 2026-10-10

Mode: spec | HEAD 46d42ff (range c3d132e..46d42ff). `python` is a WindowsApps stub, so Python commands ran with `%APPDATA%\uv\python\cpython-3.13.16-windows-x86_64-none\python.exe` and the same arguments.

| TP | Command | Result | Evidence |
| --- | --- | --- | --- |
| TP-14 | `python -m unittest tests.test_artifacts.Artifacts.test_ccync_installation_docs_contract -v` | PASS | `Ran 1 test`, `OK`, exit 0 |
| TP-16 | `cmd.exe /d /c npm --prefix writing test` | PASS | tests 75, pass 75, fail 0, cancelled 0, skipped 0, exit 0 |
| TP-17 | `python -m unittest discover -s tests -v` | PASS | `Ran 24 tests`, `OK`, exit 0 |
| TP-18 | `cmd.exe /d /c npm --prefix writing run lint` | PASS | `0 errors, 10 warnings`; markdownlint `0 error(s)`; exit 0. All 10 are write-good warnings ("requirement"/"objective" wordy) in skills/, web-skills/, web-instructions/, knowledge/, docs/writing-checks.md:40, scripts/templates/. None are in T-04 files (README.md, INSTALL.md, docs/installer.md, docs/verification.md, tests/test_artifacts.py). |

Total: 4 | Passed: 4 | Failed: 0 | Skipped: 0

Verdict: PASS

Findings (independent TP-14 judgment; no blocking defect, tracked gaps are test-strength only):

1. README per-language check is sound. The test splits README.md on the `## English` (README.md:7), `## 繁體中文` (:116), `## 日本語` (:225) headings, asserts exactly 3 sections, and checks each separately for `ccync add <clear-writing-kit source>`, `ccync sync`, `Node.js 20.18`, `clear-writing-kit-textlint`, `INSTALL.md`. I read all three sections (README.md:42-49, :151-158, :260-267). They are equivalent in meaning: Node 20.18+ on PATH, the two commands, one ccync-owned server projected to Claude/Codex/Copilot/opencode/agy, runs the committed `dist/cwk.mjs`, `lintText` only, no package install, no `~/.clear-writing-kit/`, use ccync or direct installer per host, see INSTALL.md.
2. Shared-content checks: owner rule (INSTALL.md:15 area, docs/installer.md:14 area), lock path, and the recovery sentence naming both `cwk install apply` and `cwk install uninstall` are asserted in all required docs, and present in all three. The pending real-home acceptance limit is asserted and present in docs/verification.md:85-87 (the only place it applies).
3. Gap (low): the test never asserts the Node.js 20.18 prerequisite in INSTALL.md, docs/installer.md, or docs/verification.md. It is present in INSTALL.md:11 and docs/verification.md:79, but docs/installer.md has no ccync Node prerequisite (its only 20.18 mention, line 51, concerns the direct installer runtime). Removal from INSTALL.md or verification.md would go undetected.
4. Gap (low): the `ccync add` / `ccync sync` commands are asserted only in README sections. INSTALL.md:9 and docs/installer.md:10 contain them but the test checks only the generic string "ccync" there; docs/verification.md has no `ccync add`/`ccync sync` quick path (it documents automated evidence commands instead).
5. Gap (low): lock-contention behavior ("refuse before any write", "never removes the lock") is not asserted by string; only the lock path and recovery sentence are. Content is present at INSTALL.md:21 and docs/installer.md:26-30.
6. Cosmetic: the new test is added after a two-blank-line gap inside class `Artifacts` (tests/test_artifacts.py ~line 517-520); no lint/test impact.

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

### [T-02] Audit 2026-10-10

**Date:** 2026-10-10
**Scope:** `git diff 290b5dc 5c8a40f -- scripts/artifacts.py install/agents-block.md tests/test_artifacts.py` (HEAD `5c8a40f`, `.dev/` bookkeeping ignored)
**Findings:** 1 total: 0 critical, 0 high, 0 medium, 1 low
**Verdict: APPROVE**

#### Summary

T-02 deletes two generator lines and rewords one sentence in `scripts/artifacts.py:55`. These edits remove the fixed `<home>/.clear-writing-kit/cwk.mjs` template and the `<home>` resolution sentence. The commit regenerates `install/agents-block.md` from the generator and replaces exactly one digest in `INSTRUCTION_BODY_SHA256`. It rewrites the template assertion in `test_agents_block_contract` and adds `test_agents_block_ccync_contract` for TP-06. The change stays within the reviewed scope: R5, R10, and the T-02 files list. It does not touch runtime selection, installer code, or `dist/`. No Security finding exists. No Protected Path finding exists.

#### Evidence

- Full suite: `python -m unittest discover -s tests` ran 23 tests and returned `OK` with the uv CPython 3.13.16 interpreter. The suite includes the Web instruction, output-style, OKF, plugin-manifest, and agents-block equality and digest tests. No other projection is stale.
- TP-06: `python -m unittest tests.test_artifacts.Artifacts.test_agents_block_ccync_contract -v` returned `OK`. It regenerates through `scripts/generate-agents-block.py --output`, checks byte equality, checks that `.clear-writing-kit` is absent, and checks the size against the 2,048-byte budget.
- Block size: `install/agents-block.md` is 1,388 bytes, which is below 2,048.
- Residual references: a grep for `.clear-writing-kit`, `<home>`, and `Resolve \`<home>\`` across `scripts/`, `install/`, `web-instructions/`, `output-styles/`, `knowledge/`, `skills/`, `AGENTS.md`, `.claude-plugin`, and `.codex-plugin` found no source matches. Only stale `__pycache__` bytecode matched.
- Generator dead code: `render_agents_block` has no leftover home or path helper. `scripts/generate-agents-block.py` still imports only `ROOT` and `render_agents_block`.
- `dist/` freshness: `git diff 290b5dc 5c8a40f -- dist` is empty. `dist/cwk.mjs` reads the block at runtime through `readFile(join(payloadDir, "..", "install", "agents-block.md"))`, matching `src/cli.ts:45`. A scan of the bundle found neither the old template text nor the persistent core text. No rebuild is needed.
- Installer upgrade path: `src/install/plan.ts:225-237` calls `upsertBlock`, which finds the block by its begin and end markers (`src/install/block.ts:3`, `findBlock`). It does not compare the live block against a manifest hash before replacing it. A previously installed old block is therefore reported as action `update` and replaced. `src/install/apply.ts:133-140` then records the new block SHA-256 in the manifest. The begin marker `v=` value is unchanged, so `blockVersion` still parses it. Uninstall (`src/install/uninstall.ts:181+`, `removeBlock`) compares the live block with the manifest hash. Before an upgrade, that hash is the old block's hash. After an upgrade, it is the new block's hash. Both cases match, so the edit cannot make an old installed block look drifted or unowned.
- Digest change: only the `install/agents-block.md` entry changed, from `a65abcc9…` to `bdc148f0…`. The ChatGPT and Gemini digests are unchanged, which matches the "generator-owned digest only" instruction in T-02.
- Writing rules: `npm --prefix writing run lint` reported 0 errors. The new sentence has no semicolons, em dashes, or parentheses, and it states the condition before the action. Running `node dist/cwk.mjs check --language en-US --genre document install/agents-block.md` reported 0 errors and 2 warnings, which are recorded in FINDING-001.
- Security: the edit removes a filesystem path template from agent instructions and adds no new execution path. The new test calls `subprocess.run` with a fixed argument list, `sys.executable`, and a `TemporaryDirectory` target, with no shell and no user input. No OWASP or STRIDE issue applies. Deep-performance scan: not applicable, because the change adds no runtime code.

#### Open Findings

**[LOW] FINDING-001 (NON-BLOCKING): write-good flags "it is" twice on the reworded line**
- File: `install/agents-block.md:6` (source `scripts/artifacts.py:55`)
- Evidence: the bundled checker in en-US document mode reports two `"it is" is wordy or unneeded` warnings at 6:30 and 6:50. Both come from the clause "when it is available. If it is unavailable", which already existed before T-02, so T-02 did not introduce them.
- Failure scenario: none at runtime. The warnings are style-only and do not cause a lint error or gate failure.
- Recommended fix: optional. The clause could read "Use the `lintText` tool if available. Otherwise, run …". Make that edit only through the generator, then refresh the digest.
- Confidence: 9/10 (the warning output is real, and the severity is low)

#### Observations (not findings)

- The fallback sentence now says "the installed `cwk.mjs check` command" and gives no location. This follows R5, because ccync places the bundle under its plugin cache and not under `~/.clear-writing-kit`. Agents now have to locate the bundle themselves. The plan states this as intended, with runtime selection and installation guidance left unchanged.
- An existing direct install keeps the old block, with its now-removed fixed path, until the user runs `cwk install plan` and `cwk install apply` again. That path still exists for direct installs, so the old block stays correct there.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| FINDING-001 | LOW | OPEN (NON-BLOCKING) |

Security finding: none. Protected Path finding: none. The change is confined to the reviewed T-02 scope of `scripts/artifacts.py`, the committed `install/agents-block.md` projection, and `tests/test_artifacts.py`.

<!-- AUDIT_REVIEW: CLEAR -->

### [T-03] Audit 2026-10-10

**Date:** 2026-10-10
**Findings:** 3 total, 0 critical, 0 high, 0 medium, 3 low (all NON-BLOCKING)
Verdict: APPROVE

#### Summary

Scope: `git diff 5deadcd dc11252 -- src writing/test` (HEAD dc11252). Build reproducibility: `npm --prefix writing run build` then `git diff --exit-code -- dist` exits 0, so the committed bundle is reproducible. `npm --prefix writing test` passes (75/75). No tracked file changed; no stray lock or temp artifacts found. Security finding: none. Protected Path finding: none (src/install/ changes match the CLEAR architecture review for T-03).

Checked and found sound:
- Lock (`src/install/lock.ts`): `open(path, "wx")` is an exclusive create on Windows and POSIX. Any open failure refuses; EEXIST gives the "held" message, other codes the "unavailable" message. A failed token write removes the file this run created and refuses. Release reads the file and removes it only when it contains this run's UUID token, and never throws. Stale locks are never auto-removed. The message names only the lock path and the recovery check; the lock body holds token, command, pid, and timestamp, with no config contents. An unwritable or missing home gives a clean refusal before any write.
- Apply: `withInstallerLock` wraps `applyLocked`, so the lock is taken before `computePlan` and every return or throw releases it in `finally`. A blocked plan returns a `mismatch` error before the hash comparison, and `hash` is null, so no hash can apply. The ownership reread sits in the `mcp` step before `mcp remove` (update) and `mcp add`. It compares manifest bytes against the last bytes this run read or wrote, the manifest MCP fingerprint, and the live registration. A mismatch returns `failed` with no MCP mutation and no further manifest save. The `owned-current` (none) action performs no MCP mutation and needs no reread.
- Uninstall: lock acquired after host resolution and before the manifest read; the removal logic is unchanged. Host resolution and "not verified" refusals take no lock and write nothing.
- Plan: `classifyMcpOwnership` is correct for all 7 states (absent, owned-missing, owned-current, owned-stale, unowned, unreadable, drifted). Blocked plans have `hash: null` and `status: "blocked"`. `targetStates.mcp` carries status, full live fingerprint, and manifest fingerprint, so the hash still covers the full registration vector. Unreadable reasons are fixed strings from `registration.ts` and include no host output, config contents, or secrets.
- Backward compatibility: the manifest MCP fingerprint is written by the unchanged `mcpFingerprint(registration)`, the same hash the live read computes, so a direct install from the previous version is `owned-current` or `owned-stale`. Intentional behavior changes: `plan` now exits 1 for a blocked plan (the old code listed an unowned or different entry as an update), and an install with a missing MCP manifest entry no longer adopts the live entry. Both match R6. CLI exit codes for applied, failed, and refused are unchanged.
- Tests: use temp fixture homes with try/finally cleanup; the lock, stale-lock, failure-release, and unowned-adoption tests are deterministic and need no real home or sleeps.

#### Open Findings

**[LOW] FINDING-001: Reread failure message overstates the manifest guarantee — NON-BLOCKING**
- File: `src/install/apply.ts:258`
- Evidence: the message says "the install manifest was not written again". Earlier steps (payload, plugin) in the same run already persisted the manifest via `persistManifest`.
- Failure scenario: a changed live entry is detected at the `mcp` step after `payload` and `plugin` completed. The output reports `failed` with `completed: [payload, plugin]` and the manifest holds those completed records. The sentence is accurate only for the MCP record, so a reader might expect the manifest to be fully untouched.
- Recommended fix: reword to "no MCP manifest record was written". Confidence: 8/10.

**[LOW] FINDING-002: Release leaves the lock when its read fails transiently — NON-BLOCKING**
- File: `src/install/lock.ts:55`
- Evidence: `release` swallows any `readFile` error (for example an EBUSY/EPERM from antivirus scanning on Windows) and leaves the lock.
- Failure scenario: apply finishes, the release read fails once, and the lock stays. The next apply or uninstall refuses and the user must follow the documented manual recovery. This is a fail-closed outcome with no data risk.
- Recommended fix: optionally retry the read once or twice before giving up. Confidence: 8/10.

**[LOW] FINDING-003: Re-export duplicates the lock names — NON-BLOCKING**
- File: `src/install/apply.ts:13`
- Evidence: `export { INSTALLER_LOCK_NAME, installerLockPath } from "./lock.js"` re-exports lock names from apply, which duplicates the public surface of `lock.ts`. Additionally, after each step `knownManifestText` is re-read from disk, so a foreign write between the save and the re-read is accepted as this run's own.
- Failure scenario: no functional defect. This is a readability issue and a narrow window that sits within the plan's stated "manual writers that ignore the lock are outside the guarantee" boundary.
- Recommended fix: import the names from `lock.js` where needed, or keep the re-export if the test harness depends on it; compute `knownManifestText` from the bytes that `saveManifest` wrote, if it can return them. Confidence: 8/10.

#### Remediation Tracking

| Finding | Severity | Status |
| --- | --- | --- |
| FINDING-001 | LOW | OPEN (non-blocking) |
| FINDING-002 | LOW | OPEN (non-blocking) |
| FINDING-003 | LOW | OPEN (non-blocking) |

<!-- AUDIT_REVIEW: CLEAR -->

Orchestrator final verification (Opus, 2026-10-10): reviewed `src/install/lock.ts`, `apply.ts`, `plan.ts`, and `uninstall.ts` in `5deadcd..dc11252`. Ownership classification, `wx` lock acquisition with token-checked release in `finally`, and the pre-mutation reread match R6 and R7. No Security or Protected Path finding. Low findings 1 to 3 stay open as non-blocking.

### [T-04] Audit 2026-10-10

Verdict: APPROVE

Scope: `git diff c3d132e 46d42ff -- README.md INSTALL.md docs tests` (HEAD 46d42ff, unchanged). Read-only audit. No tracked file edited.

Security finding: none. Protected Path finding: none. The diff touches no file under `src/install/`, `src/hosts.ts`, `src/check.ts`, `src/rules.ts`, `src/mcp.ts`, `scripts/artifacts.py`, `writing/okf.cjs`, or `dist/`. It adds no host configuration content, secret, or credential. Examples use only the placeholder `<clear-writing-kit source>` and the public lock path.

#### Behavioral claims verified against source

- Lock path `~/.clear-writing-kit.lock`: `src/install/lock.ts` (`INSTALLER_LOCK_NAME = ".clear-writing-kit.lock"`, `join(home, ...)`). Correct.
- Apply takes the lock before computing its plan: `src/install/apply.ts:107` (`withInstallerLock`) precedes `computePlan` at `:114`. Correct.
- Uninstall takes the lock before reading the manifest: `src/install/uninstall.ts:98` precedes `readManifest` at `:105`. Correct.
- Release in `finally`, including failure: `lock.ts` `withInstallerLock`. Correct.
- Competing or stale lock refuses before any write and the installer never removes a foreign lock: `lock.ts` `acquireInstallerLock` (exclusive `wx` create) and `lockRefusalMessage`. Correct. The recovery wording matches the code message, including the "confirm that no `cwk install apply` or `cwk install uninstall` process is active" check before deletion.
- `plan` does not take the lock: `src/cli.ts:71-73` calls `computePlan` directly. Correct.
- `plan` exits 1 on a blocked plan and prints no hash: `src/cli.ts:73` (`outcome.status === "ready" ? 0 : 1`), `plan.ts:337` (`hash: null`), `plan.ts:372` ("No plan hash"). Correct.
- MCP transition table (absent/none create, owned-missing recreate, owned-current none, owned-stale update, else blocked): `plan.ts:~255-263`. Correct. Blocking set is unowned, unreadable, drifted: `plan.ts:192-203`. Correct.
- Final reread before the first MCP mutation compares manifest and live registration and stops without MCP change: `apply.ts:246-259`. Correct.
- Direct installer supports Claude and Codex only (`--agent <claude|codex>` in `docs/installer.md`). Consistent with the new text.
- `mcp.json` holds literal `node` with args `${PLUGIN_ROOT}/dist/cwk.mjs`, `mcp`. Correct.
- `npm --prefix writing test` does not discover the integration file: `writing/package.json:10` globs `test/*.test.cjs`. Correct. The test asserts `CCYNC_BIN` and never skips. Correct.
- Success home and per-host collision homes: matches the structure of `ccync-projection.test.cjs`. Correct.
- No claim that owner acceptance ran. `docs/verification.md` states OA-01 to OA-03 have not run and that the repository does not claim the pin works in a real home. Correct.
- Stale-lock recovery tells the reader to confirm no `cwk install apply` or `cwk install uninstall` process is active before deleting: present in INSTALL.md, docs/installer.md, docs/verification.md.
- README: the three sections carry the same facts (Node.js 20.18+ on PATH, two commands, one ccync-owned server, five hosts, committed bundle, `lintText` only, no package install, no `~/.clear-writing-kit/`, one path per host, pointer to INSTALL.md). Traditional Chinese uses natural Taiwan wording and "宿主" as in the rest of the README. Japanese uses である style.
- English prose: no semicolons, em dashes, or parenthetical asides found in the added English text. must/should/may are used distinctly.

#### Findings

**NON-BLOCKING, MEDIUM: per-host rendering table cites tests that do not assert those exact vectors.**
- File: `docs/verification.md:~70-78` (the "Per-host rendering" section: "ccync 0.1.5 rendered the following vectors in isolated tests").
- Evidence: `writing/integration/ccync-projection.test.cjs:79-89` (`assertResolvedVector`) checks only that the stringified vector contains `node` and `mcp`, has no `${PLUGIN_ROOT}`, and has exactly one cache `dist/cwk.mjs` path. It never asserts `command === "node"`, the exact args, the opencode vector shape, or the Claude PowerShell launcher (`grep -i powershell` on the test returns nothing). The table's source is the T-01 audit probe (plan FINDING-001), which matches the table content, so the claims are true for ccync 0.1.5 as observed but not as regression-protected evidence.
- Impact: the sentence implies committed automated evidence for exact vectors. A future ccync that adds a launcher or fallback would still pass the test while the docs read as verified.
- Recommended fix: either reword to "observed in an isolated probe with ccync 0.1.5", or tighten `assertResolvedVector` to the exact per-host vectors (T-01 FINDING-001 fix). The scope to ccync 0.1.5 is already stated, so the claim does not overreach beyond the version.

**NON-BLOCKING, LOW: INSTALL.md states ccync collision behavior without a version scope.**
- File: `INSTALL.md` (the "Both orders fail safely" list), "ccync reports the collision and keeps the existing entry."
- Evidence: the committed test proves this only for foreign entries on ccync 0.1.5, seeded before sync. The cwk-first order is not exercised against a real cwk-created entry.
- Recommended fix: add "ccync 0.1.5" or soften to "in ccync 0.1.5 testing". `docs/installer.md` has the same sentence.

**NON-BLOCKING, LOW: doc contract test coverage gaps (carried from the tester entry).**
- File: `tests/test_artifacts.py:520-544`.
- Evidence: the test does not assert the Node.js 20.18 prerequisite in INSTALL.md or verification.md, nor lock-refusal wording. Removal of those sentences would pass.
- Recommended fix: optional extra `assertIn` checks.

No BLOCKING finding. No factually wrong behavioral claim was found in durable docs.

## Debug Log

None.
