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

Workflow: DRAFT
Step: 0 of 2
Last activity: 2026-10-08 — prompt generated from source plan
Next step: wait for `docs-apa-references` to land, then execute T-01
Current Task: —
Task Base Commit: —
Task Final Commit: —
Test Retry Count: 0
Review Retry Count: 0

### Deviations

None.

### Handoff Notes

Human-approved implementation contract generated from the reconciled English semantic draft. This plan follows `docs-apa-references` because both edit `docs/references.md` and the ja-JP `Sources` section.

## Tasks

- [ ] T-01 — Enforce である-form document style in the maintained rule and bundled checker.
  - **Files**: `skills/coding-agent-writing/references/ja-JP.md`, `skills/coding-agent-writing/references/accuracy.md`, `writing/rules/ja-document-style/index.cjs`, `writing/test/checkers.test.cjs`, `docs/writing-checks.md`, `docs/references.md`, `dist/cwk.mjs`.
  - **Change**: Update the maintained rule and persistent excerpt, extend the synchronous sentence-end checker for だ, だろう, だった, and のだ in ja-JP documents, preserve protected nodes and exceptions, skip まだ and ただ, add no fix, add the three named focused contracts, align durable docs and `[Bunka2022]`, then rebuild the committed bundle. Add no dependency or asynchronous path.
  - **Acceptance**: TP-01 through TP-03 pass. Findings use `ja-document-style`; protected and out-of-scope input stays unchanged; `dist/` equals a deterministic fresh build; T-01 records focused tests and rebuild evidence.
- [ ] T-02 — Regenerate every delivery projection affected by the rule and excerpt.
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

Not run.

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
