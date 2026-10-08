# Plan: APA 7 reference list and per-rule source attribution

## Approval

- Human approval: [pending]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

Every external source that informs the writing rules is listed once, in APA 7 format, in `docs/references.md`. Each maintained rule file states which of its rules come from which source and which rules are project-authored. A reader can trace any rule to its basis the way a reader of a paper or book traces a claim to its citation.

### Why

Evidence collected on 2026-10-08 in this repository:

| Observation | Location |
| --- | --- |
| The only external sources named anywhere are ISO 24495-1 and ASD-STE100. Neither has an edition, year, publisher, or URL. | `README.md:13`, `README.md:113`, `README.md:213`, `references/accuracy.md:15`, `references/en-US.md:9` |
| No file, branch, or commit (66 commits, all refs) cites 「公用文作成の考え方」 or the Agency for Cultural Affairs. | `git log --all -S"公用文"` returns nothing |
| The ja-JP plain-form rule is documented as a project choice, not a general Japanese rule. | `docs/writing-checks.md:36`, `references/ja-JP.md` |
| Pinned third-party checkers shape rule behavior but are not cited as sources. | `writing/package.json` |

### Decisions already made by the owner

- Citation style is APA 7 (owner choice, 2026-10-08).
- Sources are written to the standard of a paper or book: complete, verifiable, and traceable from each rule.
- This plan does not change the ja-JP style rule. The ja-JP `Sources` section lists the plain-form rule as project-authored. 文化審議会 (2022) 「公用文作成の考え方」 is not cited in this plan. A separate plan will align the rule with that guideline and add the citation then.

## Requirements

- [ ] R-01 `docs/references.md` holds the single reference list. Entries follow APA 7 and are sorted by first author. Each entry has a stable citation key such as `[ISO2023]`, the full APA 7 reference, a URL or DOI when one exists, and a retrieval date for web content that can change.
- [ ] R-02 The reference list separates two groups: standards and guidelines, and software. Software entries cite the exact pinned version from `writing/package.json`.
- [ ] R-03 Citation keys resolve in both directions. Every key cited in a rule file exists in `docs/references.md`, and every entry in `docs/references.md` is cited by at least one rule file. The reference list does not repeat which files use each entry.
- [ ] R-04 Each maintained rule file under `skills/coding-agent-writing/references/` ends with a `Sources` section, written in that file's language. The section maps rules to citation keys and lists the rules that are project-authored. Rule wording above that section does not change.
- [ ] R-05 Each `Sources` section links to the reference list with the absolute URL `https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md`. Relative links are not used, because the same file is copied into `web-skills/`, the OKF bundle, and the Claude output style, where a relative path does not resolve.
- [ ] R-06 The persistent instruction excerpt in `references/accuracy.md` carries no citation keys. The text inside the generated ChatGPT and Gemini instruction blocks and the agents instruction block stays identical.
- [ ] R-07 The English, Traditional Chinese, and Japanese sections of `README.md` each add one sentence that links to `docs/references.md`. The reference list itself appears only once in the repository.
- [ ] R-08 Every entry is verified on the implementation date by opening its URL or catalog page. An entry whose edition, year, or publisher cannot be confirmed is not added. It is reported instead.
- [ ] R-09 Generated projections (`web-skills/`, `knowledge/`, `web-instructions/`, `install/agents-block.md`, `output-styles/`) are regenerated through their existing generators. No generated file is edited by hand.
- [ ] R-10 Project-authored claims stay worded as project choices. A citation never implies that the repository complies with or is certified against a standard.
- [ ] R-11 `docs/references.md` passes the existing en-US document lint. Official titles that contain an em dash or semicolon are written as link text, which the `prose-punctuation` rule already skips, so the title is quoted exactly.
- [ ] R-12 speak-human-tw is cited as an influence, not as a derivation, for two rules added on 2026-09-29: URLs and quotations in the protected-literal list (`references/accuracy.md`), and the relaxed list and layout rule (`references/accuracy.md`, `references/zh-TW.md`). The `Sources` wording says "informed by" in English and 「受其啟發」 in Traditional Chinese. The citation uses the 2026-09-28 commit `e180f0a`.

## Diagrams

```text
docs/references.md  (APA 7 list, keys only)
        ^                                   ^
        | absolute URL + key                | relative link
skills/coding-agent-writing/                README.md (en / zh-TW / ja)
  references/*.md  -> "Sources" section
        |
        | existing generators (verbatim copy or embed)
        +--> web-skills/web-answer-writing/references/*.md
        +--> knowledge/rules/*.md, knowledge/checks/*.md   (okf.cjs passes absolute URLs through)
        +--> output-styles/clear-writing-kit.md
        +--> web-instructions/*.md, install/agents-block.md (excerpt only, unchanged text)
```

## Files to Create or Modify

- `docs/references.md` — new APA 7 reference list.
- `skills/coding-agent-writing/references/accuracy.md` — add `Sources` section outside the instruction excerpt.
- `skills/coding-agent-writing/references/en-US.md` — add `Sources` section.
- `skills/coding-agent-writing/references/ja-JP.md` — add `Sources` section in Japanese.
- `skills/coding-agent-writing/references/zh-TW.md` — add `Sources` section in Traditional Chinese.
- `skills/coding-agent-writing/references/local-checks.md` — add `Sources` section for checker software.
- `skills/coding-agent-writing/references/zhtw-checks.md` — add `Sources` section for zhtw-mcp.
- `tests/test_artifacts.py` — add the citation cross-reference test.
- `README.md` — one link sentence in each language section.
- Generated outputs — regenerated only.

## Test Cases

- Cross-reference: every `[Key]` in `skills/coding-agent-writing/references/*.md` resolves to an entry in `docs/references.md`, and every entry is cited at least once. A missing key or an uncited entry fails the test.
- Excerpt stability: the excerpt between `<!-- instructions:begin -->` and `<!-- instructions:end -->` contains no `[Key]` pattern. The fenced block text in `web-instructions/chatgpt.md` and `web-instructions/gemini.md`, and the body of `install/agents-block.md`, equal the pre-change text. Stamp lines are excluded because their hash covers the full reference files.
- Link form: every `Sources` section links to the absolute reference-list URL and contains no relative link to `docs/`.
- Projections: `node writing/okf.cjs --check`, the existing generator checks, and `python -m unittest discover -s tests -v` pass.
- Lint: `npm --prefix writing run lint` and `npm --prefix writing test` pass.

## Success Criteria

- A reader can open any rule file, find its `Sources` section, and reach a full APA 7 entry in one link, from the repository, the web skill copy, the OKF bundle, or the output style.
- Every entry in `docs/references.md` was verified against its source on the implementation date.
- No rule changed meaning. The diff of each rule file above its `Sources` section is empty.

## Risks

- Paywalled standards (ISO 24495-1, ASD-STE100) can only be verified from catalog pages, not full text. The entry cites the catalog page and states the edition shown there.
- The absolute URL points at the `main` branch of a public repository. Renaming the repository or making it private breaks the link in copied artifacts. The cross-reference test does not detect that case.
- A source listed only to look authoritative weakens the list. Only sources that actually informed a rule are added.

## Open Questions

None

## Approach

### Step 1: Collect and verify sources

- **Files**: none written.
- **What**: Build the candidate list from repository evidence and the owner's answer to OQ-02. Sources the owner evaluated on 2026-09-27 to 09-28 but did not adopt are not cited: humanizer, Humanizer-zh, taste-skill, Vale, and Pangu. The repository has no trace of any of them. The predecessor `accurate-answer` skill is this repository's own history, documented in `docs/rule-migration.md`, and is not an external source. Candidates: speak-human-tw (owner decision, cited as an influence only), ISO 24495-1, ASD-STE100, textlint 15.8.0, textlint-rule-preset-ja-technical-writing 12.0.2, textlint-rule-write-good 2.0.0, textlint-rule-no-zero-width-spaces 1.0.1, zhtw-mcp. Open each catalog or project page and record edition, year, publisher, and URL.
- **Verify**: every candidate has a verified record or is reported as unverifiable.

### Step 2: Write the reference list

- **Files**: `docs/references.md`
- **What**: Write APA 7 entries with keys, grouped as standards and guidelines, then software.
- **Verify**: manual APA 7 review against the APA Style reference examples. `npm --prefix writing run lint` passes.

### Step 3: Add Sources sections and the cross-reference test

- **Files**: `skills/coding-agent-writing/references/*.md`, `tests/test_artifacts.py`
- **What**: Append `Sources` sections with absolute links. Keep the instruction excerpt free of keys. Add the cross-reference and link-form test.
- **Verify**: the new test passes. The diff above each `Sources` section is empty.

### Step 4: Link from README and regenerate projections

- **Files**: `README.md`, generated outputs.
- **What**: Add one link sentence per language section. Run the existing generators.
- **Verify**: every command in Test Cases passes. The excerpt-stability comparison holds.

## Review Results

### Architecture Review

Verdict: APPROVE, after the revisions below were applied to this plan.

Reviewed in-session against `golem-architect.agent.md` on 2026-10-08.

Findings that changed the plan:

| Finding | Evidence | Change |
| --- | --- | --- |
| A relative link from a rule file to `docs/references.md` breaks OKF generation. `okf.cjs` throws `Unmapped link` for any relative link without an OKF entry. | `writing/okf.cjs` `render()` | R-05 requires an absolute URL. `okf.cjs` passes `scheme:` links through unchanged. |
| The same relative link would be dead in `web-skills/` copies and the Claude output style, which leave the repository. | `scripts/artifacts.py` `render_web()`, `render_claude()` | Same as above. The repository is public, so the absolute URL resolves. |
| The planned "byte-identical web instructions" test would always fail. The stamp line hashes the full shared reference files, which this plan changes. | `scripts/artifacts.py` `digest()` | Test Cases compare the instruction block text and exclude stamp lines. |
| APA titles such as ISO 24495-1 contain an em dash. The `prose-punctuation` rule reports em dashes outside links. | `writing/rules/prose-punctuation/index.cjs` | R-11 places exact titles in link text. |
| "Used by" lists in the reference list duplicate the `Sources` sections and drift. | minimalism ladder: derivable from existing data | Removed. R-03 and the cross-reference test enforce the mapping. |

Trade-off summary:

| Choice | Gain | Price | Verdict |
| --- | --- | --- | --- |
| Absolute URL in `Sources` | Works in every copy | Depends on repository name and visibility | OK |
| Keep `Sources` in web skill copies | No generator change | Slightly larger upload | OK |
| One Python test instead of a new checker | Reuses the existing suite | Runs only in CI and locally | OK |

No security surface. The change adds documentation and one test. It writes no user configuration.

<!-- ARCH_REVIEW: CLEAR -->

### Resolved Questions

| Question | Closed by | Decision | Rationale |
| --- | --- | --- | --- |
| ja-JP rule vs 「公用文作成の考え方」 | Human (owner, 2026-10-08) | Do not cite the guideline in this plan. Align the rule in a separate plan. | Citing a source the current rule does not follow would misstate the rule's basis. |
| Should `docs/references.md` become an OKF node? | Architect, class A | No. Rule files link by absolute URL, so OKF needs no new entry. | Adding a node would add an `okf.cjs` entry and index text for no retrieval need stated in the request. |
| Do upload limits require stripping `Sources` from web skill copies? | Architect, class F | No. Generator budgets apply only to the instruction excerpt. | `render_web()` copies references verbatim and enforces limits only on ChatGPT and Gemini blocks. Each `Sources` section is short. |
| Cite speak-human-tw? | Human (owner, 2026-10-08) | Yes, as an influence on two rules only. | No text was copied. The two rules appeared the day after the owner's discussion recommended partial adoption, and the owner recalls likely using it. |

### Documentation Structure Review (steward)

Pass. The plan is at `.dev/plans/docs-apa-references.md` with an EN draft at `.dev/plans/docs-apa-references.en.md`. No other plan exists in `.dev/plans/`. Required sections are present. The diagram matches the projection paths in `scripts/artifacts.py` and `writing/okf.cjs`. No old project names appear.

### Business Review

Not requested. The change has no business rules, pricing, permissions, or onboarding.

### Design Review

Not requested. The change has no user interface.

### Engineering Review

Pending.

## Test Plan

Pending.

## Tasks

Pending.
