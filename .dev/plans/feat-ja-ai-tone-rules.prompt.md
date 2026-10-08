# Plan Prompt: Absorb yomiyasu AI-tone guidance into the ja-JP rules

<!--
Generated from .dev/plans/feat-ja-ai-tone-rules.md.
Output path: C:/Code/clear-writing-kit/.dev/plans/feat-ja-ai-tone-rules.prompt.md
This is the shared mutable execution work file consumed by control-plane chat, /gal status, /gal whats-next, /gal pipeline, and specialist write-back flows.
-->

## Goal

Add bounded ja-JP guidance for formulaic or machine-generated style signals without treating style as authorship evidence. Paraphrase the pinned yomiyasu snapshot, preserve meaning and technical precision, and cite yomiyasu only as an influence.

## Requirements

- [ ] R1 — Add one ja-JP section with five categories: metaphorical verbs, English-calque syntax, vague or decorative evaluative words, filler openers and sentence-end padding, and canned closings. Give each category one rule and at most two short examples.
- [ ] R2 — Apply the section to both documents and conversation.
- [ ] R3 — Replace wording only when meaning and scope remain identical. Preserve defined terms, standard technical terms, product names, and quotations; retain original wording when meaning is uncertain.
- [ ] R4 — Add relative point weight and sentence function to the shared `accuracy.md` meaning check outside the persistent excerpt. Do not duplicate the cross-language contract in ja-JP.
- [ ] R5 — Use project-authored paraphrase. Copy no sentence or table row from yomiyasu; shared examples may be only necessary single words or short phrases.
- [ ] R6 — Exclude yomiyasu's time-bound 2026 word list and per-word replacement tables.
- [ ] R7 — Add an APA 7 yomiyasu repository-snapshot entry pinned to commit `c2ffae670994fec96daef92e0bc219f5c1923113`, never label it release `v1.1.0`, and cite it as an influence from both `accuracy.md` and `ja-JP.md`.
- [ ] R8 — Pass ja-JP document lint, including the predecessor plan's である-form check.
- [ ] R9 — Regenerate the eight actual projections through existing generators. Preserve the persistent excerpt and substantive ChatGPT/Gemini bodies; allow only their generated stamps to change. Keep `install/agents-block.md` byte-identical.
- [ ] R10 — Start only after `docs-apa-references` and `feat-ja-report-style` have landed, passed their focused contracts, and left Active Plans. Stop instead of recreating missing citation or report-style baselines.

## Approach

1. Enforce all Preconditions. Before any repository edit, fetch and hash the two exact commit-bound yomiyasu sources; fail closed on unavailable or mismatched content.
2. Filter out time-bound and per-word tables. Add the two shared meaning properties to `accuracy.md`, the five bounded categories to `ja-JP.md`, the pinned citation, and focused guidance/projection tests.
3. Run mechanical 20-character overlap detection plus item-by-item manual comparison.
4. Regenerate the eight declared projections. Check the agents block without changing it.

Out of scope: checker changes, dependencies, authorship detection, a shorter Web variant, time-bound vocabulary lists, per-word replacement tables, or a permanent copy-detection tool.

## Files to Create or Modify

- `skills/coding-agent-writing/references/accuracy.md`
- `skills/coding-agent-writing/references/ja-JP.md`
- `docs/references.md`
- `tests/test_artifacts.py`
- Eight generator-owned Web, instruction, OKF, and output-style projections declared by T-02.

## Test Cases

- Verify the exact commit citation, influence wording, five-category contract, example limits, both genres, meaning guards, protected terms, no authorship inference, and excluded tables.
- Require zero en-US and ja-JP lint findings and a byte-identical persistent excerpt.
- Fetch and hash both pinned source files, run the 20-character overlap command, and record item-by-item manual evidence; `NotRun` fails.
- Require generator equality, empty substantive instruction-body diffs, the eight-file allowlist, and a byte-identical agents block.
- Run the authoritative Node, Python, and lint suites.

## Success Criteria

- Readers can identify all five style-signal categories and know when not to replace wording or infer authorship.
- Meaning, scope, standard technical terms, product names, and quotations remain protected.
- yomiyasu is cited at the exact commit and no sentence or table row is copied.

## Risks

- Removing vague wording can erase meaningful weight or function; the shared meaning guard is binding.
- Japanese naturalness remains unverified without a proficient reviewer and must not be claimed.
- The pinned snapshot will not track later upstream changes.

## Preconditions

| ID | Requirement | Check command | Expected result | How to satisfy |
| --- | --- | --- | --- | --- |
| PC-01 | The canonical APA reference plan has landed and left Active Plans. | `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`; `python -c "from pathlib import Path;s=Path('.dev/state.md').read_text(encoding='utf-8').split('## Active Plans',1)[1].split('## Recent Close-outs',1)[0];raise SystemExit('docs-apa-references' in s)"` | The focused test reports `ok`; both commands exit 0 and the active-plan slice contains no `docs-apa-references`. | Complete and finalize `docs-apa-references`. |
| PC-02 | The ja-JP report-style plan has landed and left Active Plans. | `node --test --test-name-pattern="Japanese documents reject da-form endings without fixes" writing/test/checkers.test.cjs`; `python -c "from pathlib import Path;s=Path('.dev/state.md').read_text(encoding='utf-8').split('## Active Plans',1)[1].split('## Recent Close-outs',1)[0];raise SystemExit('feat-ja-report-style' in s)"` | The named test passes; both commands exit 0 and the active-plan slice contains no `feat-ja-report-style`. | Complete and finalize `feat-ja-report-style`. |
| PC-03 | The maintained ja-JP rule contains the complete report-style baseline. | `python -c "from pathlib import Path;s=Path('skills/coding-agent-writing/references/ja-JP.md').read_text(encoding='utf-8');required=['報告書型','である体','文末に「だ」「だろう」「だった」'];raise SystemExit(not all(x in s for x in required))"` | Exits 0 only when all three baseline markers are present. | Complete and finalize `feat-ja-report-style`. |

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
Next step: wait for both predecessor plans to finalize, then execute T-01
Current Task: —
Task Base Commit: —
Task Final Commit: —
Test Retry Count: 0
Review Retry Count: 0

### Deviations

None.

### Handoff Notes

Human-approved implementation contract generated from the reconciled English semantic draft. The predecessor order is binding; do not start while either predecessor remains active.

## Tasks

- [ ] T-01 — Add shared meaning guards and Japanese style-signal guidance.
  - **Files**: `skills/coding-agent-writing/references/accuracy.md`, `skills/coding-agent-writing/references/ja-JP.md`, `docs/references.md`, `tests/test_artifacts.py`.
  - **Change**: After all Preconditions pass and before the first repository edit, fetch `skills/yomiyasu/SKILL.md` and `skills/yomiyasu/references/slop-catalog.md` from `https://github.com/nanaism/yomiyasu` at exact commit `c2ffae670994fec96daef92e0bc219f5c1923113` using TP-03's raw URLs. Fail without repository modification on any source mismatch. Add relative weight and sentence function to the shared meaning check, add five bounded ja-JP style-signal rules and guards, add the pinned citation, and add the named guidance and projection contract tests. Add no checker, dependency, Web variant, or permanent copy tool.
  - **Acceptance**: All Preconditions and TP-01 through TP-03 pass. The citation resolves both ways, the persistent excerpt is byte-identical, meaning and technical terms remain protected, both copy-review methods are recorded, and T-01 ends `completed`; `NotRun` fails.
- [ ] T-02 — Regenerate the eight delivery projections affected by the canonical rules.
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, `web-skills/web-answer-writing/references/accuracy.md`, `web-skills/web-answer-writing/references/ja-JP.md`, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`, `knowledge/rules/accuracy.md`, `knowledge/rules/ja-JP.md`, `output-styles/clear-writing-kit.md`.
  - **Change**: Run the existing Web, OKF, and output-style generators after T-01. Commit only generator-owned copies, embeds, and stamps. Check the agents-block generator and require `install/agents-block.md` to remain byte-identical.
  - **Acceptance**: TP-04 passes. All eight projections equal their generators, substantive instruction bodies and agents block remain unchanged as specified, no undeclared projection changes, and T-02 records four generator/check summaries.

## Deferred Follow-up

None.

## Analyze

Not started.

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | integration | Run `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`. Require bidirectional exact-commit citation, no `v1.1.0` label, and influence-only wording in both `Sources` sections. Record T-01 evidence. | T-01 |
| TP-02 | documentation | Add and run `python -m unittest tests.test_artifacts.Artifacts.test_ja_ai_tone_guidance_contract -v`, then run `node writing/check.cjs --language en-US --genre document skills/coding-agent-writing/references/accuracy.md` and `node writing/check.cjs --language ja-JP --genre document skills/coding-agent-writing/references/ja-JP.md`. Compare the persistent excerpt with `python -c "import pathlib,subprocess;p='skills/coding-agent-writing/references/accuracy.md';a=subprocess.check_output(['git','show','HEAD:'+p],text=True,encoding='utf-8');b=pathlib.Path(p).read_text(encoding='utf-8');f=lambda s:s.split('<!-- instructions:begin -->',1)[1].split('<!-- instructions:end -->',1)[0];raise SystemExit(0 if f(a)==f(b) else 1)"`. Enforce all five categories, example limits, both genres, all meaning/protected-term guards, no authorship inference, excluded tables, the two shared meaning properties, zero lint findings, and byte identity. Record T-01 evidence. | T-01 |
| TP-03 | manual | Why manual: semantic paraphrase of external text has no stable local oracle. Before editing, fetch exact sources with `python -c "from pathlib import Path as P;from urllib.request import urlopen;P('build').mkdir(exist_ok=True);P('build/yomiyasu-SKILL.md').write_bytes(urlopen('https://raw.githubusercontent.com/nanaism/yomiyasu/c2ffae670994fec96daef92e0bc219f5c1923113/skills/yomiyasu/SKILL.md').read())"` and `python -c "from pathlib import Path as P;from urllib.request import urlopen;P('build').mkdir(exist_ok=True);P('build/yomiyasu-slop-catalog.md').write_bytes(urlopen('https://raw.githubusercontent.com/nanaism/yomiyasu/c2ffae670994fec96daef92e0bc219f5c1923113/skills/yomiyasu/references/slop-catalog.md').read())"`; record SHA-256 with `powershell -NoProfile -Command "Get-FileHash build/yomiyasu-SKILL.md,build/yomiyasu-slop-catalog.md -Algorithm SHA256"`. Save the new section as `build/ai-tone-section.txt`, run `python -c "from pathlib import Path as P;a=P('build/ai-tone-section.txt').read_text(encoding='utf-8');b='\\n'.join(P(p).read_text(encoding='utf-8') for p in ['build/yomiyasu-SKILL.md','build/yomiyasu-slop-catalog.md']);print(sorted({a[i:i+20] for i in range(max(0,len(a)-19)) if a[i:i+20] in b}))"`, justify only necessary short overlaps, and compare every rule and example item by item. Missing evidence or `NotRun` fails. Record T-01 evidence. | T-01 |
| TP-04 | documentation | Run `python scripts/generate-web-artifacts.py --check`, `cmd.exe /d /c npm --prefix writing run okf:check`, `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check`, `python scripts/generate-agents-block.py --output install/agents-block.md --check`, and `python -m unittest tests.test_artifacts.Artifacts.test_ja_ai_tone_projection_contract -v`. Then run `python -c "import subprocess;allowed={'web-skills/web-answer-writing/SKILL.md','web-skills/web-answer-writing/references/accuracy.md','web-skills/web-answer-writing/references/ja-JP.md','web-instructions/chatgpt.md','web-instructions/gemini.md','knowledge/rules/accuracy.md','knowledge/rules/ja-JP.md','output-styles/clear-writing-kit.md'};changed=set(subprocess.check_output(['git','diff','--name-only','--','web-skills','web-instructions','knowledge','output-styles','install/agents-block.md'],text=True).splitlines());print('\\n'.join(sorted(changed)));raise SystemExit(bool(changed-allowed))"`. Require clean generator summaries, empty substantive instruction diffs, a byte-identical agents block, and no path outside the eight-file allowlist. Record T-02 evidence. | T-02 |
| TP-05 | integration | Run `cmd.exe /d /c npm --prefix writing test`, `python -m unittest discover -s tests -v`, and `cmd.exe /d /c npm --prefix writing run lint`. Require three passing summaries and T-01 plus T-02 write-back evidence. | T-01, T-02 |

## Test Results

Not run.

## Review Results

### Architecture Review

CLEAR. Keep shared meaning guards in `accuracy.md`, Japanese style signals in `ja-JP.md`, and existing generators for every projection. The source is a commit snapshot, not release `v1.1.0`; style signals are not authorship evidence. Add no checker, dependency, permanent copy tool, or Web-specific variant.

### Business Review

Not requested; no business rules, pricing, permissions, notifications, onboarding, or eligibility change.

### Design Review

Not requested; no customer-facing flow, layout, component, state, or accessibility change.

### Engineering Review

CLEAR. Two atomic tasks, finalize-aware Preconditions, fail-closed commit-bound source retrieval, four canonical files, eight generated projections, five reproducible probes, and byte-identical agents-block evidence were approved. No unresolved implementation choice remains.

## Debug Log

None.
