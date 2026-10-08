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

Workflow: IMPLEMENT complete
Step: 5 of 5
Last activity: 2026-10-08 — T-05 implemented and TP-07 passed
Next step: Orchestrator test and review phases
Current Task: T-05
Task Base Commit: c9d3fbc
Checkpoint: T-05 implemented — all five tasks committed; TP-07 suites, lint, and generator checks pass
Task Final Commit: —
Test Retry Count: 0
Review Retry Count: 0

### Deviations

| Step | Plan Said | Actually Did | Why |
| --- | --- | --- | --- |
| T-01 | Change only the new tests in `tests/test_artifacts.py` | Also narrowed the regex in the existing `test_claude_embeds_local_procedures_without_file_links` to skip `https:` targets | The old regex rejected every `](...md)` target, so the required absolute `docs/references.md` URL in the embedded `Sources` sections would fail it after T-05. Relative file links are still rejected. |
| T-01 | Instruction bodies stay equal to the committed files | The gemini baseline digest is the generator output from HEAD sources, not the committed file | At base commit `70b58fe`, `web-instructions/gemini.md` was already stale: it says "reply in zh-TW" while `scripts/templates/gemini.txt` says "reply in Traditional Chinese", and `generate-web-artifacts.py --check` fails on a clean HEAD export. T-03 regeneration will apply that template text. The persistent excerpt is unchanged. |
| T-01 | `npm --prefix writing run lint` passes for T-01 | `okf.cjs --check` stage fails as stale until T-04 | The lint script runs `okf.cjs --check`, which compares `knowledge/` with the edited rule files. The other stages pass. |
| T-03 | TP-04 runs `test_reference_citation_projections` as the T-03 check | Ran it after T-03 and again in TP-07 after T-05 | The test also asserts the T-04 concepts and the T-05 output style, so it cannot fully pass until T-05. Its Web subtests passed after T-03. |
| T-04 | Commit the six declared concept files | Also committed `knowledge/usage/chatgpt.md` and `knowledge/usage/gemini.md` | `okf.cjs --generate` rewrites their `source_sha256`, which covers the Web instruction files changed in T-03. Only that line changed in each file. Orchestrator approved this generator-owned scope extension; without it `okf:check` fails. |

### Handoff Notes

Human-approved implementation contract generated from the reconciled English semantic draft. Execute tasks in dependency order.

## Tasks

- [x] T-01 — Establish the canonical APA 7 citation contract.
  - **Files**: `docs/references.md`, `skills/coding-agent-writing/references/accuracy.md`, `skills/coding-agent-writing/references/en-US.md`, `skills/coding-agent-writing/references/ja-JP.md`, `skills/coding-agent-writing/references/zh-TW.md`, `skills/coding-agent-writing/references/local-checks.md`, `skills/coding-agent-writing/references/zhtw-checks.md`, `tests/test_artifacts.py`.
  - **Change**: Verify each candidate source, implement the locked attribution map, create the single keyed APA 7 list, append language-appropriate `Sources` mappings with the absolute URL, and add `test_reference_citation_contract` plus `test_reference_citation_projections`. Preserve every rule prefix and the persistent excerpt. Add no dependency or parallel citation store.
  - **Acceptance**: TP-01 and TP-02 pass, including R1, R2, R10, and R12. Every confirmed entry has one key and consumer; omitted entries and all evidence are recorded under T-01.
- [x] T-02 — Add the reference-list link to each README language section.
  - **Files**: `README.md`.
  - **Change**: Add one equivalent relative-link sentence to the English, Traditional Chinese, and Japanese overview sections without duplicating the list.
  - **Acceptance**: TP-03 passes and T-02 records the three matching links.
- [x] T-03 — Regenerate the Web delivery family.
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, four copied reference files, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`.
  - **Change**: Run the existing Web generator after T-01. Accept only copied `Sources` sections and generator stamps; preserve instruction bodies.
  - **Acceptance**: TP-04 passes and T-03 records the generator and projection-contract evidence.
- [x] T-04 — Regenerate the six source-derived OKF concepts.
  - **Files**: `knowledge/rules/accuracy.md`, `knowledge/rules/en-US.md`, `knowledge/rules/ja-JP.md`, `knowledge/rules/zh-TW.md`, `knowledge/checks/local-checks.md`, `knowledge/checks/zhtw-checks.md`.
  - **Change**: Run the existing OKF generator after T-01. Preserve absolute-link pass-through and add no reference-list node.
  - **Acceptance**: TP-05 passes and T-04 records the OKF summary.
- [x] T-05 — Regenerate the Claude Code output style.
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

### T-01

Verified 2026-10-08. Every candidate source was confirmed. No entry was omitted.

| Key | Verified metadata | Evidence |
| --- | --- | --- |
| `[ISO2023]` | ISO 24495-1:2023, Plain language — Part 1: Governing principles and guidelines. Edition 1, published 2023-06, stage 60.60. Publisher: International Organization for Standardization. | `https://www.iso.org/standard/78907.html` fetched with curl, HTTP 200 |
| `[ASDSTE1002025]` | ASD-STE100 Simplified Technical English, Issue 9, January 15, 2025, subtitle "Standard for Technical Documentation". Owner and publisher: ASD, Aerospace, Security and Defence Industries Association of Europe. | `https://www.asd-ste100.org/` fetched with curl, HTTP 200; ASD news page confirms Issue 9 |
| `[SpeakHumanTW2026]` | Repository `Raymondhou0917/speak-human-tw`, owner Raymond Hou, MIT. Commit `e180f0a9960e396d28b394a77f51c5bd31106b36` dated 2026-09-28T04:55:56Z. | `gh api` repo, user, and commit; tree URL HTTP 200 |
| `[Textlint1580]` | textlint 15.8.0, author azu, published 2026-08-01, npm. | `writing/package.json` and lockfile pin 15.8.0; `npm view`; GitHub tag `v15.8.0` |
| `[TextlintRulePresetJaTechnicalWriting1202]` | textlint-rule-preset-ja-technical-writing 12.0.2, author azu, published 2025-01-02, npm. | Pin and lockfile 12.0.2; `npm view`; GitHub tag `v12.0.2` |
| `[TextlintRuleWriteGood200]` | textlint-rule-write-good 2.0.0, author nodaguti, published 2021-06-06, npm. | Pin and lockfile 2.0.0; `npm view`; GitHub tag `v2.0.0` |
| `[TextlintRuleNoZeroWidthSpaces101]` | textlint-rule-no-zero-width-spaces 1.0.1, author Tomoyuki Hata, published 2021-05-01, npm. | Pin and lockfile 1.0.1; `npm view` |
| `[ZhtwMCP]` | Repository `sysprog21/zhtw-mcp`, "A linguistic linter for Traditional Chinese (zh-TW)", MIT. No version claimed. Retrieval date October 8, 2026. | `gh api repos/sysprog21/zhtw-mcp`; URL HTTP 200 |

Limits: npmjs.com package pages return HTTP 403 to automated clients, so npm metadata comes from the npm registry through `npm view`. The ISO and ASD standards are paywalled or on request. Their entries rely on catalog and publisher pages only.

APA 7 review (TP-02, manual): two groups, standards and guidelines first. Each group is sorted by first author. Software entries use `Author. (Year). Title (Version) [Computer software]. Publisher.`. The unpinned zhtw-mcp entry uses `n.d.` and a retrieval date. Titles are link text, so official dashes stay in the title. Entries contain no used-by lists and no compliance or certification wording. speak-human-tw appears only as "informed by" or 「受其啟發」 with commit `e180f0a`. `[Bunka2022]` was not added.

| Check | Result |
| --- | --- |
| `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v` | PASS, 1 test |
| `test_reference_citation_projections` after local regeneration of all five generators | PASS. Full `python -m unittest discover -s tests`: 18 tests OK. Generated outputs were then reverted and not committed. |
| `test_reference_citation_projections` on the committed tree | Expected FAIL until T-03 to T-05; `test_committed_style_matches_generated_content` also fails until T-05 |
| `cmd.exe /d /c npm --prefix writing run lint` | FAIL at `okf.cjs --check`: six stale concepts, expected until T-04 |
| Lint stages run separately | `generate-profiles.cjs --check` exit 0; `lint-docs.cjs` 0 errors, 6 warnings, all on pre-existing lines; `markdownlint-cli2` 0 errors |
| zhtw-mcp on the two zh-TW `Sources` sections | 0 errors, 0 warnings, 0 info |

### T-02

Verified 2026-10-08. Each README overview paragraph gained one sentence with a relative link to `docs/references.md`. The link text is "reference list", 「參考文獻清單」, and 「参考文献一覧」, so the path appears once per line. No list entry or heading was copied.

| Check | Result |
| --- | --- |
| `python -m unittest tests.test_artifacts.Artifacts.test_readme_languages_have_equal_commands_and_local_links -v` | PASS, 1 test |
| `rg -o -n "docs/references\.md" README.md` | 3 matches: lines 13, 113, 213 |
| Negative `rg` for copied headings or keyed entries | No output, exit 1 (expected) |
| `cmd.exe /d /c npm --prefix writing run lint` | FAIL at `okf.cjs --check` only: the same six stale concepts as T-01, expected until T-04 |
| Lint stages run separately | `generate-profiles.cjs --check` exit 0; `lint-docs.cjs` 0 errors, 6 warnings, none in `README.md`; `markdownlint-cli2` 0 errors |
| zhtw-mcp on the new zh-TW sentence | 0 errors, 0 warnings, 0 info |

### T-03

Verified 2026-10-08. `python scripts/generate-web-artifacts.py --update` wrote the seven declared files and nothing else. The diff contains the copied `Sources` sections in the four reference files, the new source stamp in `SKILL.md`, `chatgpt.md`, and `gemini.md`, and one generator-owned body line in `gemini.md`: "reply in zh-TW" became "reply in Traditional Chinese", which is the text of `scripts/templates/gemini.txt` (see the T-01 deviation).

| Check | Result |
| --- | --- |
| `python scripts/generate-web-artifacts.py --check` | PASS: "checked 7 Web artifacts", exit 0 |
| `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_projections -v` right after T-03 | Web subtests pass: all seven outputs equal `render_web()`, no relative `docs/` link, absolute URL in the four copied reference files, stamp-excluded ChatGPT and Gemini bodies match the baseline digests, agents block equals `render_agents_block()`. The test still FAILS on 7 subtests owned by later tasks: six `knowledge/` concepts (T-04) and the output style (T-05). Full rerun recorded under TP-07. |

### T-04

Verified 2026-10-08. `cmd.exe /d /c npm --prefix writing run okf:generate` reported "Generated 14 OKF files" and changed eight paths: the six declared concepts plus `knowledge/usage/chatgpt.md` and `knowledge/usage/gemini.md`. In the two usage files only the `source_sha256` line changed, because that hash covers the Web instruction files regenerated in T-03. Each of the six concepts contains the absolute reference-list URL once. `knowledge/` contains no `](docs/` or `](../docs` link.

| Check | Result |
| --- | --- |
| `cmd.exe /d /c npm --prefix writing run okf:check` | PASS: "OKF format, source freshness, and publication links passed", exit 0 |

### T-05

Verified 2026-10-08. `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md` rewrote only the output style: 49 insertions, 1 deletion (the source stamp). The file contains the absolute reference-list URL six times, one per embedded `Sources` section, and no `](docs/` or `](../docs` link.

| Check | Result |
| --- | --- |
| `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check` | PASS, exit 0 |

### TP-07

Verified 2026-10-08 on commit `3ea6e15`, after T-01 to T-05.

| Check | Result |
| --- | --- |
| `cmd.exe /d /c npm --prefix writing test` | PASS: 63 tests, 63 pass, 0 fail |
| `python -m unittest discover -s tests -v` | PASS: 18 tests OK, including `test_reference_citation_contract` and `test_reference_citation_projections` |
| `cmd.exe /d /c npm --prefix writing run lint` | PASS, exit 0. `okf.cjs --check` passes. `lint-docs.cjs`: 50 text sections, 0 errors, 10 warnings, all on unchanged "objective" or "requirement" lines that existed before this plan. `markdownlint-cli2`: 0 errors. |
| `python scripts/generate-agents-block.py --output install/agents-block.md --check` | PASS, exit 0. `install/agents-block.md` has no diff from `70b58fe`. |
| `python scripts/generate-web-artifacts.py --check` | PASS: 7 Web artifacts |
| `git diff --name-only 70b58fe..HEAD -- web-skills knowledge web-instructions install output-styles` | 16 paths: the 7 T-03 files, the 6 T-04 concepts, `knowledge/usage/chatgpt.md`, `knowledge/usage/gemini.md` (approved T-04 extension), and `output-styles/clear-writing-kit.md`. No undeclared path. |

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
