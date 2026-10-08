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
- [ ] R4 — Require Node.js 20.18 or later on each host PATH. If unavailable, only that server fails and the host surfaces the error. Add no launcher or silent fallback.
- [ ] R5 — Remove the fixed `.clear-writing-kit` checker fallback from the persistent instruction block and keep the generated block below 2,048 bytes.
- [ ] R6 — Enforce one owner per same-name MCP registration. Permit safe create, owned recreate, no-op, and owned update only. Unowned, unreadable, or fingerprint-drifted live entries are blocking conflicts with no applicable plan hash or MCP mutation. Apply must recompute state and reject later ownership-evidence drift.
- [ ] R7 — Preserve direct Claude and Codex install, verify, upgrade, and uninstall behavior. Both installation orders with ccync must fail safely at the ownership boundary without removing or adopting the other owner's entry.
- [ ] R8 — Automated evidence must cover the manifest boundary, resolved command and arguments, exact tool surface, three-language findings, actual five-host ccync rendering, and fail-closed collisions from isolated homes before publication. Owner acceptance validates the published pin in five fresh host sessions. Missing, unreadable, skipped, unexpected collision, runtime failure, or `NotRun` evidence fails.
- [ ] R9 — Update the English, Traditional Chinese, and Japanese installation paths in `README.md`. Distinguish direct installer ownership from ccync projection in `INSTALL.md`, `docs/installer.md`, and `docs/verification.md`. Re-index `.dev/project.md`, then regenerate `AGENTS.md`.
- [ ] R10 — Regenerate `AGENTS.md`, `install/agents-block.md`, and `dist/` only through their existing generators. Keep the agents-block generator separate from the GAL adapter renderer.

## Approach

1. Add bare root `mcp.json` as ccync-only metadata. Keep root `plugin.json` and `.mcp.json` absent, and keep both compatibility manifests free of MCP declarations.
2. Run `node ${PLUGIN_ROOT}/dist/cwk.mjs mcp`. Remove the invalid fixed-path fallback without adding another guessed path.
3. Add an explicit external-CLI integration test outside the default Node test glob. Use one fresh isolated home for successful five-host projection and separate fresh homes with foreign same-name vectors preseeded before ccync ownership for collision cases.
4. Use the install manifest fingerprint as the direct installer's only ownership proof. After apply's internal `computePlan`, reread both the manifest entry and live registration immediately before the first MCP mutation. Guard earlier manifest saves against overwriting concurrent drift.
5. Update durable installation guidance, re-index `.dev/project.md`, and regenerate `AGENTS.md`. Exclude repository-wide structure-map initialization.
6. After the implementation commit is published and pinned, complete owner acceptance and update only evidence-backed limits in `docs/verification.md`.

Out of scope: root portable-package migration, a multi-runtime launcher, ccync behavior changes, component selectors, silent runtime fallback, and a new structure-map mechanism.

## Files to Create or Modify

- `mcp.json`
- `scripts/artifacts.py`, `install/agents-block.md`, `tests/test_artifacts.py`
- `writing/test/checkers.test.cjs`, `writing/integration/ccync-projection.test.cjs`
- `src/install/plan.ts`, `src/install/apply.ts`, `writing/test/installer-registration.test.cjs`, `dist/cwk.mjs`
- `README.md`, `INSTALL.md`, `docs/installer.md`, `docs/verification.md`
- `.dev/project.md`, `AGENTS.md`

## Test Cases

- Parse root `mcp.json` and enforce the exact server name, command, argument order, and compatibility-package isolation boundary.
- Start the committed bundle over stdio, require the exact tool list `[lintText]`, and require en-US, zh-TW, and ja-JP findings with the named rule IDs.
- Run an explicitly selected ccync executable against local snapshots in isolated environments. Verify every success renderer and every pre-ownership foreign-vector collision without treating skipped or missing evidence as success.
- Cover direct-installer safe transitions, ownership conflicts, both installation orders, and drift injected after apply's internal `computePlan` but before the first MCP mutation. Preserve concurrent manifest bytes and require MCP remove/add counts of 0/0 on conflict.
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
- GUI-launched hosts may not inherit a PATH with Node.js 20.18 or later. The host-specific start failure is intentional and must remain visible.
- ccync cache paths change on upgrade. `ccync sync` must rewrite all five host registrations before old-cache removal.
- Manifest or host state may change between plan and apply. The pre-mutation reread and manifest-save guard must reject either drift before MCP remove or add.

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

None. OQ-01 was resolved by removing the invalid fixed-path fallback. OQ-02 was resolved by requiring Node.js 20.18 or later. OQ-03 was resolved by reporting ownership conflicts and refusing MCP mutation.

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

---

## Status

Workflow: DRAFT
Step: 0 of 5
Last activity: 2026-10-09 — prompt generated from source plan
Next step: start T-01
Current Task: —
Task Base Commit: —
Task Final Commit: —
Test Retry Count: 0
Review Retry Count: 0

### Deviations

| Step | Plan Said | Actually Did | Why |
| --- | --- | --- | --- |

### Handoff Notes

Prompt generated after final adversarial verdict APPROVE, human approval, and passing planning and refining receipts. No implementation task has started.

## Tasks

- [ ] T-01 — Add the ccync-only MCP declaration and executable contract.
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
  - **Files**: `src/install/plan.ts`, `src/install/apply.ts`, `writing/test/installer-registration.test.cjs`, `dist/cwk.mjs`.
  - **Dependencies**: None.
  - **Change**: Use the manifest entry for the same host, kind, and name as the only ownership proof. Add the plan-time gate in `readHostState` and `computePlan`. Permit absent create and owned safe transitions only. Convert unowned, unreadable, and fingerprint-drifted entries to blocking conflicts. After apply's internal `computePlan`, reread the manifest entry and live registration immediately before the first MCP mutation. Prevent earlier saves from overwriting concurrent manifest changes. Preserve uninstall exact-match behavior and rebuild the bundle.
  - **Acceptance**: TP-05 and TP-07 through TP-11 prove both installation orders, safe transitions, conflicts, manifest and live drift rejection, zero unsafe MCP mutations, direct lifecycle continuity, exact spy counts, and reproducible `dist/`.
- [ ] T-04 — Document the two installation ownership paths.
  - **Files**: `README.md`, `INSTALL.md`, `docs/installer.md`, `docs/verification.md`, `tests/test_artifacts.py`.
  - **Dependencies**: T-01, T-02, T-03.
  - **Change**: Add equivalent English, Traditional Chinese, and Japanese ccync quick paths. Separate direct-installer ownership from ccync projection. Document Node.js 20.18, the manifest boundary, conflict behavior, and still-pending real-home acceptance without claiming it ran. Add a focused artifact test.
  - **Acceptance**: TP-12 finds the same prerequisites, owner invariant, commands, and acceptance limit in every relevant durable document.
- [ ] T-05 — Re-index durable docs and regenerate adapter guidance.
  - **Files**: `.dev/project.md`, `AGENTS.md`.
  - **Dependencies**: T-04.
  - **Change**: Re-index the durable installation references in `.dev/project.md`, then run `C:\Users\leetz\.cargo\bin\gal.exe render-adapters`. Do not use the agents-block generator for `AGENTS.md` and do not introduce a repository-wide structure map.
  - **Acceptance**: TP-13 finds the revised references and an empty second-render diff for `AGENTS.md`.

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
| TP-09 | integration | Run `node --test --test-name-pattern "installer apply rejects ownership evidence drift" writing/test/installer-registration.test.cjs`. The mock host records registration-read calls. After apply's internal `computePlan` completes, the next read injects one of three subcases before the first MCP mutation: change the manifest entry on disk, remove it on disk, or return a changed live registration. Each subcase proves the second read occurred, rejects the operation, preserves the injected manifest bytes against earlier-step saves, and keeps MCP remove/add counts 0/0. | T-03 |
| TP-10 | integration | Run `node --test --test-name-pattern "direct installer owned lifecycle" writing/test/installer-registration.test.cjs`. The named Claude and Codex install, verify, upgrade, and uninstall lifecycle test passes with exact manifest fingerprints. | T-03 |
| TP-11 | integration | Run `cmd.exe /d /c npm --prefix writing run build` twice. The second run leaves `git diff --exit-code -- dist` empty. | T-03 |
| TP-12 | documentation | Run `python -m unittest tests.test_artifacts.Artifacts.test_ccync_installation_docs_contract -v`. All three README languages expose the ccync quick path and the three installation docs share the owner rule and pending real-home limit. | T-04 |
| TP-13 | documentation | Run `C:\Users\leetz\.cargo\bin\gal.exe render-adapters` twice. The second run leaves `git diff --exit-code -- AGENTS.md` empty, and `.dev/project.md` names the revised durable installation references. | T-05 |
| TP-14 | integration | Run `cmd.exe /d /c npm --prefix writing test`. Retain the summary with zero failed Node tests. | T-01, T-02, T-03, T-04, T-05 |
| TP-15 | integration | Run `python -m unittest discover -s tests -v`. Retain the summary with every Python test `OK`. | T-01, T-02, T-03, T-04, T-05 |
| TP-16 | integration | Run `cmd.exe /d /c npm --prefix writing run lint`. Retain the lint summary with zero errors and report any advisory warnings. | T-01, T-02, T-03, T-04, T-05 |

For headless execution, every covering row also requires executor log terminal state `completed` plus the matching T-NN and test-result write-back in this prompt. Command output, spy counts, parsed result objects, or an empty named diff are required evidence. A PASS label without evidence does not satisfy a row.

## Test Results

Not started.

## Review Results

### Architecture Review

CLEAR. Use root `mcp.json` only for ccync projection. Keep the compatibility-package boundary, direct Node.js 20.18 runtime, manifest-fingerprint ownership proof, fail-closed conflicts, and explicit five-host runtime evidence. The final independent adversarial re-review returned APPROVE after seven findings were resolved.

### Business Review

Not requested. The change adds no business rule, pricing, or permission surface.

### Design Review

Not requested. The change has no user interface.

### Engineering Review

CLEAR. Five atomic tasks and 16 executable probes cover declaration boundaries, real ccync rendering, MCP runtime behavior, direct-installer ownership, apply-time drift, generated artifacts, durable documentation, and adapter regeneration. Missing or `NotRun` evidence fails. Planning and refining receipts passed after the adversarial revisions.

## Debug Log

None.
