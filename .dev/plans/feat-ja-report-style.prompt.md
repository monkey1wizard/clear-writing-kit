# Plan Prompt: Align ja-JP document style with the official report style

<!--
Generated from .dev/plans/feat-ja-report-style.md.
Output path: C:/Code/clear-writing-kit/.dev/plans/feat-ja-report-style.prompt.md
This is the shared mutable execution work file consumed by control-plane chat, /gal status, /gal whats-next, /gal pipeline, and specialist write-back flows.
-->

## Goal

Make ja-JP documents use the report-style である form based on 文化審議会 (2022), prohibit sentence-final だ, だろう, and だった in the `document` genre, retain polite conversation, document the basis, and enforce the behavior in the bundled checker.

## Requirements

- [ ] R1 — `references/ja-JP.md` treats documents as report-type documents, uses stable markers `報告書型`, `である体`, and `文末に「だ」「だろう」「だった」`, ends noun predicates with である and verbs in plain form, and prohibits document-final だ, だろう, and だった.
- [ ] R2 — Preserve existing exceptions: conversation uses polite style; explicit user or project style wins; quotations, code, and product names remain unchanged.
- [ ] R3 — Preserve the scope statement: this is a clear-writing-kit document rule, not a universal Japanese rule; consumer-facing manuals generally use polite style.
- [ ] R4 — Extend `writing/rules/ja-document-style` to report sentence-final だ, だろう, and だった only in ja-JP documents. Reuse protected-node and Japanese-quotation handling, skip whole-word まだ and ただ, and provide no auto-fix.
- [ ] R5 — Leave `conversation`, en-US, and zh-TW behavior unchanged.
- [ ] R6 — Add positive and negative regression coverage, including だ。, だろう。, だった。, のだ, である forms, verb plain forms, protected nodes, Japanese quotations, and unaffected genres.
- [ ] R7 — Update `docs/writing-checks.md` with the official basis, bounded scope, checker behavior, and consumer-manual exception.
- [ ] R8 — Rebuild committed `dist/` from source and require deterministic content.
- [ ] R9 — Cite `[Bunka2022]` in the ja-JP `Sources` section, reusing the entry from `docs/references.md` or adding it in the established APA 7 format only if absent.
- [ ] R10 — Update the persistent instruction excerpt to name である document style and exclude だ while keeping both generated instruction budgets valid.

## Approach

1. Rewrite the maintained ja-JP document-style paragraph and persistent excerpt without weakening conversation or override exceptions.
2. Extend the existing synchronous sentence-end rule; do not add a tokenizer or asynchronous path.
3. Add named rule, bundled CLI/MCP, and documentation-contract tests; update durable docs and citation.
4. Rebuild `dist/` and regenerate all declared delivery projections through existing generators.

Out of scope: mid-sentence だが, auto-fix, universal Japanese style enforcement, or a new tokenizer.

## Files to Create or Modify

- `skills/coding-agent-writing/references/ja-JP.md`
- `skills/coding-agent-writing/references/accuracy.md`
- `writing/rules/ja-document-style/index.cjs`
- `writing/test/checkers.test.cjs`
- `docs/writing-checks.md`
- `docs/references.md`
- `dist/cwk.mjs` and generator-owned adjacent runtime payload
- Nine generated Web, instruction, OKF, output-style, and agents-block projections declared by T-02.

## Test Cases

- Report だ, だろう, だった, and のだ only in ja-JP documents; do not report である, であろう, verbs, まだ, ただ, protected nodes, quotations, conversation, en-US, or zh-TW.
- Return no fix payload and preserve input bytes.
- Require bundled CLI and MCP agreement for document and conversation inputs.
- Require exact documentation statements, citation, generator equality, packaging budgets, deterministic `dist/`, and declared-path allowlists.
- Run the authoritative Node, Python, and lint suites.

## Success Criteria

- Maintained guidance, checker, bundled runtime, docs, citation, and projections agree on である document style.
- The checker reports only the bounded document cases and never rewrites input.
- All focused and authoritative tests pass, `dist/` rebuilds deterministically, and no undeclared generated file changes.

## Risks

- Regex sentence-end detection is intentionally bounded and may not model every Japanese construction.
- Over-broad matching could report まだ, ただ, quotations, or code; focused negative tests are mandatory.
- The persistent excerpt has strict packaging budgets.

## Open Questions

None.

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

---

## Status

Workflow: IMPLEMENT (complete)
Step: 2 of 2
Last activity: 2026-10-08 — T-02 projections regenerated, TP-04 and TP-05 recorded
Next step: orchestrator test, review, and closeout
Current Task: T-02
Task Base Commit: ccc542e
T-01 Commit: 774ba50
Task Final Commit: recorded by the T-02 commit that contains this line
Test Retry Count: 0
Review Retry Count: 0

### Deviations

| Step | Plan Said | Actually Did | Why |
| --- | --- | --- | --- |
| T-01 | Seven files | Also edited `tests/test_artifacts.py`: updated the recorded `RULE_PREFIX_SHA256` digests for `accuracy` and `ja-JP`, required `Bunka2022` for `ja-JP`, and asserted that `Bunka2022` is in the Standards and guidelines group. Test logic was not weakened. | This plan intentionally changes ja-JP rule text and the accuracy excerpt, and `docs-apa-references` added digest guards for both after this plan was written. |
| T-01 | TP-03 en-US lint of `docs/writing-checks.md` returns zero findings | Exit 0 with zero errors and one warning: write-good `"objective" is wordy or unneeded` at line 40. | The warning is pre-existing at HEAD `ccc542e` (same line and column). That paragraph documents it as a contextual false positive, so removing it would change documented meaning. No new finding was introduced. |
| T-02 | Nine-file allowlist | Also committed `knowledge/usage/chatgpt.md` and `knowledge/usage/gemini.md`. The TP-04 allowlist command therefore exits 1 and lists exactly 11 paths: the nine allowed paths plus these two. | `okf:generate` rewrote them. Their `source_sha256` covers the Web instruction files, and they embed the instruction block text. Approved as a generator-owned scope extension by the orchestrator. |
| T-02 | Nine generated files | Also edited `tests/test_artifacts.py`: updated the three recorded `INSTRUCTION_BODY_SHA256` digests and changed the pinned phrase in `test_user_gemini_requirements_and_compact_limit` from "For ja-JP documents, use plain forms" to "For ja-JP documents, use である forms, not だ forms". | R-10 intentionally changes this excerpt. The assertion keeps the same strength. Between the T-01 and T-02 commits, this Python test failed because it renders from source. It passes after T-02. |
| T-01 | Rebuild picks up the edited rule | Copied `writing/rules/ja-document-style/index.cjs` into the ignored `writing/node_modules/textlint-rule-ja-document-style/` before building. | The installed package in this checkout is a copy, not a link, so esbuild would otherwise bundle the old rule. No tracked file is affected. |

### Handoff Notes

Human-approved implementation contract generated from the reconciled English semantic draft. This plan follows `docs-apa-references` because both edit `docs/references.md` and the ja-JP `Sources` section.

## Tasks

- [x] T-01 — Enforce である-form document style in the maintained rule and bundled checker.
  - **Files**: `skills/coding-agent-writing/references/ja-JP.md`, `skills/coding-agent-writing/references/accuracy.md`, `writing/rules/ja-document-style/index.cjs`, `writing/test/checkers.test.cjs`, `docs/writing-checks.md`, `docs/references.md`, `dist/cwk.mjs`.
  - **Change**: Update the maintained rule and persistent excerpt, extend the synchronous sentence-end checker for だ, だろう, だった, and のだ in ja-JP documents, preserve protected nodes and exceptions, skip まだ and ただ, add no fix, add the three named focused contracts, align durable docs and `[Bunka2022]`, then rebuild the committed bundle. Add no dependency or asynchronous path.
  - **Acceptance**: TP-01 through TP-03 pass. Findings use `ja-document-style`; protected and out-of-scope input stays unchanged; `dist/` equals a deterministic fresh build; T-01 records focused tests and rebuild evidence.
- [x] T-02 — Regenerate every delivery projection affected by the rule and excerpt.
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, `web-skills/web-answer-writing/references/accuracy.md`, `web-skills/web-answer-writing/references/ja-JP.md`, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`, `knowledge/rules/accuracy.md`, `knowledge/rules/ja-JP.md`, `output-styles/clear-writing-kit.md`, `install/agents-block.md`.
  - **Change**: Run the existing Web, OKF, output-style, and agents-block generators after T-01. Commit only generator-owned changes and enforce both packaging budgets.
  - **Acceptance**: TP-04 passes. Every projection equals its generator, the nine-file allowlist holds, and T-02 records all four generator summaries.

## Deferred Follow-up

None.

## Analyze

Not started.

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | unit | Add and run `node --test --test-name-pattern="Japanese documents reject da-form endings without fixes" writing/test/checkers.test.cjs`. Require findings for だ, だろう, だった, and のだ; none for である, であろう, verbs, whole-word まだ or ただ, blockquotes, links, images, inline or fenced code, Japanese quotations, conversation, en-US, or zh-TW; no fix payload; byte-identical input. Record T-01 evidence. | T-01 |
| TP-02 | integration | Run `cmd.exe /d /c npm --prefix writing run build` and `node --test --test-name-pattern="bundled Japanese report style CLI and MCP agree" writing/test/checkers.test.cjs`. Require document CLI failure plus `ja-document-style` and nonempty MCP findings; require conversation CLI success, no rule, and empty findings. Then run `python -c "import hashlib,pathlib,subprocess;f=lambda:hashlib.sha256(b''.join(p.relative_to('dist').as_posix().encode()+b'\\0'+p.read_bytes() for p in sorted(pathlib.Path('dist').rglob('*')) if p.is_file())).hexdigest();a=f();subprocess.run(['cmd.exe','/d','/c','npm','--prefix','writing','run','build'],check=True);b=f();print(a,b);raise SystemExit(a!=b)"` and require equal full-tree hashes. Record T-01 evidence. | T-01 |
| TP-03 | documentation | Run `node --test --test-name-pattern="Japanese report-style documentation contract" writing/test/checkers.test.cjs`, `node writing/check.cjs --language ja-JP --genre document skills/coding-agent-writing/references/ja-JP.md`, and `node writing/check.cjs --language en-US --genre document docs/writing-checks.md`. Require the bounded scope, exceptions, protected content, checker message, `[Bunka2022]`, and zero lint findings. Record T-01 evidence. | T-01 |
| TP-04 | documentation | Run `python scripts/generate-web-artifacts.py --check`, `cmd.exe /d /c npm --prefix writing run okf:check`, `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check`, and `python scripts/generate-agents-block.py --output install/agents-block.md --check`. Then run `python -c "import subprocess;allowed={'web-skills/web-answer-writing/SKILL.md','web-skills/web-answer-writing/references/accuracy.md','web-skills/web-answer-writing/references/ja-JP.md','web-instructions/chatgpt.md','web-instructions/gemini.md','knowledge/rules/accuracy.md','knowledge/rules/ja-JP.md','output-styles/clear-writing-kit.md','install/agents-block.md'};changed=set(subprocess.check_output(['git','diff','--name-only','--','web-skills','web-instructions','knowledge','output-styles','install/agents-block.md'],text=True).splitlines());print('\\n'.join(sorted(changed)));raise SystemExit(bool(changed-allowed))"`. Require both budgets and no path outside the nine-file allowlist. Record T-02 evidence. | T-02 |
| TP-05 | integration | Run `cmd.exe /d /c npm --prefix writing test`, `python -m unittest discover -s tests -v`, `cmd.exe /d /c npm --prefix writing run lint`, and `git diff --name-only -- dist web-skills knowledge web-instructions install output-styles`. Require three passing summaries, only declared generated paths, and T-01 plus T-02 write-back evidence. | T-01 |

## Test Results

### T-01

Run on 2026-10-08 from `C:\Code\clear-writing-kit`, base `ccc542e`.

- `[Bunka2022]` source check: downloaded https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93651301_01.pdf (63 pages) and extracted its text with pypdf. Cover: title 「公用文作成の考え方（建議）」, author 文化審議会, date 令和４年１月７日 (2022-01-07). Section Ⅲ－１ ウ: 常体では、「である・であろう・であった」の形を用いる. The explanation part states that official documents use である forms rather than だ・だろう・だった. Publisher 文化庁 is inferred from the hosting site `bunka.go.jp`. The cover names only 文化審議会.
- TP-01 `node --test --test-name-pattern="Japanese documents reject da-form endings without fixes" writing/test/checkers.test.cjs`: tests 1, pass 1, fail 0.
- TP-02 `cmd.exe /d /c npm --prefix writing run build`: completed, `dist/cwk.mjs` changed (+11 lines). `dist/dict/` unchanged.
- TP-02 `node --test --test-name-pattern="bundled Japanese report style CLI and MCP agree" writing/test/checkers.test.cjs`: tests 1, pass 1, fail 0.
- TP-02 reproducible-build hash command: `a5318fb588774fcef346bbbcbb894f2fac8b7f1e4a783a2998e0bc8e01afd9b0` before and after a second build, exit 0.
- TP-03 `node --test --test-name-pattern="Japanese report-style documentation contract" writing/test/checkers.test.cjs`: tests 1, pass 1, fail 0.
- TP-03 `node writing/check.cjs --language ja-JP --genre document skills/coding-agent-writing/references/ja-JP.md`: exit 0, zero findings.
- TP-03 `node writing/check.cjs --language en-US --genre document docs/writing-checks.md`: exit 0, 0 errors, 1 pre-existing warning (see Deviations).
- `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`: 1 test, OK.
- Extra: `node --test test/checkers.test.cjs` in `writing/`: tests 29, pass 29, fail 0. `node lint-docs.cjs`: 0 errors, 10 warnings. `markdownlint-cli2`: 36 files, 0 errors.
- Budgets after the excerpt edit, computed from the generator renderer before T-02: ChatGPT block 1,425 of 1,500 characters. Agents block 1,522 bytes, below 2,048.
- Status: completed.

### T-02

Run on 2026-10-08 after T-01 commit `774ba50`.

- Generators: `python scripts/generate-web-artifacts.py --update` wrote 7 Web artifacts. `cmd.exe /d /c npm --prefix writing run okf:generate` generated 14 OKF files. `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md` and `python scripts/generate-agents-block.py --output install/agents-block.md` each wrote their file. All exited 0.
- TP-04 `python scripts/generate-web-artifacts.py --check`: "checked 7 Web artifacts", exit 0.
- TP-04 `cmd.exe /d /c npm --prefix writing run okf:check`: "OKF format, source freshness, and publication links passed", exit 0.
- TP-04 `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check`: exit 0.
- TP-04 `python scripts/generate-agents-block.py --output install/agents-block.md --check`: exit 0.
- TP-04 budgets: ChatGPT block 1,425 of 1,500 characters (was 1,414). the Gemini instruction block that holds the excerpt is 891 characters (was 880). `install/agents-block.md` 1,522 bytes, below 2,048.
- TP-04 allowlist command: exit 1. It lists the nine allowed paths plus `knowledge/usage/chatgpt.md` and `knowledge/usage/gemini.md`, and nothing else (see Deviations).
- Status: completed.

### TP-05

- `cmd.exe /d /c npm --prefix writing test`: tests 66, pass 66, fail 0, skipped 0.
- `python -m unittest discover -s tests -v`: 18 tests, OK (after the T-02 test update; 1 failure before it, see Deviations).
- `cmd.exe /d /c npm --prefix writing run lint`: profiles, OKF, and doc lint passed with 0 errors and 10 warnings. markdownlint checked 36 files with 0 errors. Exit 0.
- `git diff --name-only -- dist web-skills knowledge web-instructions install output-styles` before the T-02 commit: the nine allowed projections plus the two `knowledge/usage/` files. `dist/cwk.mjs` was already committed in T-01.

## Review Results

### Architecture Review

CLEAR. Reuse the existing synchronous sentence-end rule, protected-node handling, generator path, citation list, and build. Add no tokenizer, dependency, async path, or auto-fix.

### Business Review

Not requested; no business logic, pricing, permissions, onboarding, or eligibility change.

### Design Review

Not requested; no customer-facing flow, layout, state, component, or accessibility change.

### Engineering Review

CLEAR. The canonical behavior and nine generated projections are separated into two atomic tasks. Five reproducible probes cover rule boundaries, CLI/MCP parity, documentation, deterministic build output, generator budgets, allowlists, and authoritative suites.

## Debug Log

None.
