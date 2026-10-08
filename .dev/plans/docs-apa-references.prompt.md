# Plan Prompt: APA 7 reference list and per-rule source attribution

<!--
Generated from .dev/plans/docs-apa-references.md.
Output path: C:/Code/clear-writing-kit/.dev/plans/docs-apa-references.prompt.md
This is the shared mutable execution work file consumed by control-plane chat, /gal status, /gal whats-next, /gal pipeline, and specialist write-back flows.
-->

## Goal

Create one APA 7 reference list at `docs/references.md`. Make every maintained rule file map externally informed rules to stable citation keys and identify project-authored rules without changing existing rule meaning.

## Requirements

- [ ] R1 — `docs/references.md` is the only reference list. Entries use APA 7, sort by first author, have stable keys, include available URLs or DOIs, and include retrieval dates for mutable web content.
- [ ] R2 — Separate standards and guidelines from software. Use exact `writing/package.json` versions only for repository-pinned software. Cite unpinned host software such as zhtw-mcp by repository URL and retrieval date without a version claim.
- [ ] R3 — Citation keys resolve both ways: every cited key exists and every reference entry has at least one rule-file consumer. Do not add redundant used-by lists.
- [ ] R4 — Every maintained file under `skills/coding-agent-writing/references/` ends with a language-appropriate `Sources` section that maps cited and project-authored rules. Preserve all preceding rule text.
- [ ] R5 — Every `Sources` section links to `https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md`; do not use relative links.
- [ ] R6 — Keep citation keys outside the persistent `accuracy.md` instruction excerpt. Preserve substantive ChatGPT, Gemini, and agents instruction bodies.
- [ ] R7 — Add one semantically equivalent `docs/references.md` link to each README language section; do not duplicate the list.
- [ ] R8 — Verify each entry against its live source on the implementation date. Omit and report any entry whose edition, year, or publisher cannot be confirmed.
- [ ] R9 — Regenerate committed projections only through existing generators; never hand-edit generated output.
- [ ] R10 — Keep project-authored claims framed as project choices. Do not imply standards compliance or certification.
- [ ] R11 — Make `docs/references.md` pass en-US document lint. Preserve official punctuation inside link text.
- [ ] R12 — Cite speak-human-tw only as an influence on the protected URL/quotation and flexible layout rules, pinned to commit `e180f0a`; use only "informed by" or the required Traditional Chinese equivalent.

Locked attribution: `[ISO2023]` derives plain-language reader outcomes; `[ASDSTE1002025]` derives selected short-sentence and condition-before-action guidance; `[SpeakHumanTW2026]` only informs the two bounded rules; `[Textlint1580]`, `[TextlintRulePresetJaTechnicalWriting1202]`, `[TextlintRuleWriteGood200]`, and `[TextlintRuleNoZeroWidthSpaces101]` establish pinned software behavior; `[ZhtwMCP]` establishes unpinned host-software behavior. All other current rule content is project-authored. This plan does not add `[Bunka2022]`.

## Approach

1. Verify the locked candidate sources and record confirmed metadata; stop on unconfirmed metadata.
2. Create the keyed APA 7 list and append `Sources` mappings plus focused contract tests without changing rule prefixes or the persistent excerpt.
3. Add the three README links.
4. Regenerate the Web, OKF, and output-style delivery families through their existing generators.

Out of scope: changing the ja-JP document-style rule, adding an OKF node for the reference list, adding a new citation store, or citing sources that did not inform a rule.

## Files to Create or Modify

- `docs/references.md`
- `skills/coding-agent-writing/references/accuracy.md`
- `skills/coding-agent-writing/references/en-US.md`
- `skills/coding-agent-writing/references/ja-JP.md`
- `skills/coding-agent-writing/references/zh-TW.md`
- `skills/coding-agent-writing/references/local-checks.md`
- `skills/coding-agent-writing/references/zhtw-checks.md`
- `tests/test_artifacts.py`
- `README.md`
- Generator-owned Web, OKF, instruction, agents-block, and output-style projections declared by the tasks.

## Test Cases

- Bidirectional key resolution, locked attribution, absolute links, pinned-version policy, excerpt exclusion, and unchanged rule prefixes.
- Live metadata and APA 7 review with explicit omission of unconfirmed entries.
- Exactly one README link per language and no copied reference-list heading or entry.
- Generator equality, stamp-excluded instruction-body equality, absolute URLs in copied references, no unmapped OKF links, and no undeclared generated paths.
- Full authoritative Node, Python, and lint suites.

## Success Criteria

- Readers can trace every externally informed rule to one complete APA 7 entry from every delivery surface.
- Every entry is verified on the implementation date and consumed by at least one rule.
- Existing rule meaning and substantive persistent instruction bodies remain unchanged.

## Risks

- Paywalled standards can be verified only from catalog metadata.
- The absolute link depends on the public repository name and `main` branch.
- Superficial citations would weaken the contract; add only locked, genuine influences.

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
Step: 0 of 5
Last activity: 2026-10-08 — prompt generated from source plan
Next step: execute T-01
Current Task: —
Task Base Commit: —
Task Final Commit: —
Test Retry Count: 0
Review Retry Count: 0

### Deviations

None.

### Handoff Notes

Human-approved implementation contract generated from the reconciled English semantic draft. Execute tasks in dependency order.

## Tasks

- [ ] T-01 — Establish the canonical APA 7 citation contract.
  - **Files**: `docs/references.md`, `skills/coding-agent-writing/references/accuracy.md`, `skills/coding-agent-writing/references/en-US.md`, `skills/coding-agent-writing/references/ja-JP.md`, `skills/coding-agent-writing/references/zh-TW.md`, `skills/coding-agent-writing/references/local-checks.md`, `skills/coding-agent-writing/references/zhtw-checks.md`, `tests/test_artifacts.py`.
  - **Change**: Verify each candidate source, implement the locked attribution map, create the single keyed APA 7 list, append language-appropriate `Sources` mappings with the absolute URL, and add `test_reference_citation_contract` plus `test_reference_citation_projections`. Preserve every rule prefix and the persistent excerpt. Add no dependency or parallel citation store.
  - **Acceptance**: TP-01 and TP-02 pass, including R1, R2, R10, and R12. Every confirmed entry has one key and consumer; omitted entries and all evidence are recorded under T-01.
- [ ] T-02 — Add the reference-list link to each README language section.
  - **Files**: `README.md`.
  - **Change**: Add one equivalent relative-link sentence to the English, Traditional Chinese, and Japanese overview sections without duplicating the list.
  - **Acceptance**: TP-03 passes and T-02 records the three matching links.
- [ ] T-03 — Regenerate the Web delivery family.
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, four copied reference files, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`.
  - **Change**: Run the existing Web generator after T-01. Accept only copied `Sources` sections and generator stamps; preserve instruction bodies.
  - **Acceptance**: TP-04 passes and T-03 records the generator and projection-contract evidence.
- [ ] T-04 — Regenerate the six source-derived OKF concepts.
  - **Files**: `knowledge/rules/accuracy.md`, `knowledge/rules/en-US.md`, `knowledge/rules/ja-JP.md`, `knowledge/rules/zh-TW.md`, `knowledge/checks/local-checks.md`, `knowledge/checks/zhtw-checks.md`.
  - **Change**: Run the existing OKF generator after T-01. Preserve absolute-link pass-through and add no reference-list node.
  - **Acceptance**: TP-05 passes and T-04 records the OKF summary.
- [ ] T-05 — Regenerate the Claude Code output style.
  - **Files**: `output-styles/clear-writing-kit.md`.
  - **Change**: Run the existing output-style generator after T-01; do not hand-edit output.
  - **Acceptance**: TP-06 passes and T-05 records the generator summary.

## Deferred Follow-up

None.

## Analyze

Not started.

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | integration | Run `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`. Require bidirectional keys and consumers, locked attribution, absolute links, exact versions only for `writing/package.json` software, no invented zhtw-mcp version, no excerpt keys, unchanged rule prefixes, project-choice wording, and speak-human-tw commit `e180f0a` influence wording. Record a `completed` terminal and T-01 evidence. | T-01 |
| TP-02 | manual | Why manual: live source pages lack a stable local oracle. Record confirmed metadata, compare every entry with the applicable APA 7 example, require two groups and first-author ordering, add retrieval dates for mutable pages, omit unconfirmed items, and manually enforce R10/R12. Record a `completed` terminal and T-01 evidence. | T-01 |
| TP-03 | documentation | Run `python -m unittest tests.test_artifacts.Artifacts.test_readme_languages_have_equal_commands_and_local_links -v`, `rg -o -n "docs/references\\.md" README.md`, `rg -n -e "^#{1,6} References$" -e "^#{1,6} 參考文獻$" -e "^#{1,6} 参考文献$" -e "^\\[[A-Za-z]+[0-9]{4}\\]" README.md`, and `cmd.exe /d /c npm --prefix writing run lint`. Require three link occurrences, expected negative `rg` exit 1 with no output, and passing tests and lint. Record T-02 evidence. | T-02 |
| TP-04 | documentation | Run `python scripts/generate-web-artifacts.py --check` and `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_projections -v`. Scan all seven outputs, require stamp-excluded ChatGPT/Gemini body equality, and require the absolute URL in exactly four copied reference files. Record T-03 evidence. | T-03 |
| TP-05 | integration | Run `cmd.exe /d /c npm --prefix writing run okf:check`. Require six fresh concepts with no unmapped or relative `docs/` link and no unexpected knowledge file. Record T-04 evidence. | T-04 |
| TP-06 | documentation | Run `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check`. Require exact generated content and absolute reference-list URLs. Record T-05 evidence. | T-05 |
| TP-07 | integration | Run `cmd.exe /d /c npm --prefix writing test`, `python -m unittest discover -s tests -v`, `cmd.exe /d /c npm --prefix writing run lint`, `python scripts/generate-agents-block.py --output install/agents-block.md --check`, and `git diff --name-only -- web-skills knowledge web-instructions install output-styles`. Require four passing summaries and only declared generated paths. Record T-01 and T-04 evidence. | T-01, T-04 |

## Test Results

Not run.

## Review Results

### Architecture Review

CLEAR. Use one keyed reference list, absolute source links, existing generators, and the locked attribution map. No new runtime, dependency, citation store, or security surface.

### Business Review

Not requested; no business rules, pricing, permissions, or onboarding change.

### Design Review

Not requested; no user-interface change.

### Engineering Review

CLEAR. Five atomic tasks and seven reproducible test probes were approved. No unresolved implementation judgment or verification-only task remains.

## Debug Log

None.
