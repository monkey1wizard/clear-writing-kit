# Plan: Absorb yomiyasu AI-tone guidance into the ja-JP rules

## Approval

- Human approval: [pending]
- Architect review: [pending]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

The ja-JP rules tell writers to avoid the common signs of AI-generated Japanese, such as metaphorical verbs, English-calque syntax, vague evaluative words, filler openers, and canned closings. The guidance is paraphrased as project-authored rules, cites yomiyasu as an influence, and never trades meaning or technical precision for naturalness.

### Why

- yomiyasu (MIT) catalogs AI-tone patterns in Japanese. Source: https://github.com/nanaism/yomiyasu, release v1.1.0, commit `c2ffae670994fec96daef92e0bc219f5c1923113` (2026-10-07).
- `references/ja-JP.md` covers style, terminology, and meaning preservation, but no AI-tone patterns. Source: `skills/coding-agent-writing/references/ja-JP.md`.
- yomiyasu's own meaning-preservation rule names four properties that must survive a rewrite: claim, weight, assertion strength, and sentence function. The current ja-JP rule lists facts, conditions, negation, numbers, scope, sources, and uncertainty, but not weight or sentence function. Source: yomiyasu `skills/yomiyasu/SKILL.md` §1.
- Some yomiyasu word replacements target general readers and conflict with standard technical terms. Examples: `既定` (default) → 「初めの設定」, `照合` → 「照らし合わせる」. This kit's documents are technical, so word-level replacements cannot be adopted as-is. Source: yomiyasu `skills/yomiyasu/references/slop-catalog.md` §3.

### Decisions already made by the owner

- Option A: absorb the guidance as written rules only. No checker change (2026-10-08).
- yomiyasu is cited in `docs/references.md` as an influence.
- This plan runs after `feat-ja-report-style`, because both edit `references/ja-JP.md`.

## Requirements

- [ ] R-01 `references/ja-JP.md` gains one section on AI-tone patterns. It covers five categories: metaphorical verbs, English-calque syntax, vague or decorative evaluative words, filler openers and sentence-end padding, and canned closings. Each category has a one-sentence rule and at most two short examples.
- [ ] R-02 The section applies to both documents and conversation.
- [ ] R-03 The section states the guard: a word is replaced only when the replacement keeps the same meaning and scope. Defined terms, standard technical terms, product names, and quoted text stay unchanged. If the meaning cannot be determined from the source, the original wording stays.
- [ ] R-04 The existing meaning-preservation rule in `references/ja-JP.md` adds the two properties it lacks: the relative weight of points and the function of each sentence (evaluation, explanation, request, plan). Existing properties stay.
- [ ] R-05 The text is paraphrased and project-authored. No sentence or table row is copied from yomiyasu. Example words that appear in both are single words or short phrases, not reproduced explanations.
- [ ] R-06 yomiyasu's time-bound word list (its section on words that surged in 2026) and its per-word replacement tables are not adopted.
- [ ] R-07 `docs/references.md` gains a yomiyasu entry in APA 7 software format, pinned to the commit above. The ja-JP `Sources` section cites it as an influence ("informed by", 「着想を得た」 in Japanese).
- [ ] R-08 The new text passes the ja-JP document lint, including the である-form check added by `feat-ja-report-style`.
- [ ] R-09 Generated projections are regenerated through existing generators. The persistent instruction excerpt does not change.

## Diagrams

```text
yomiyasu v1.1.0 (c2ffae6)                    feat-ja-report-style (lands first)
   categories + meaning points                    |
        | paraphrase, filter for technical terms  v
        +----------------------------> skills/coding-agent-writing/references/ja-JP.md
                                              |  "Sources": [yomiyasu] informed by
                                              v
                               docs/references.md (docs-apa-references)
                                              |
                     generators --> web-skills/, knowledge/, output-styles/
```

## Files to Create or Modify

- `skills/coding-agent-writing/references/ja-JP.md` — new AI-tone section and extended meaning rule (protected path).
- `docs/references.md` — yomiyasu entry.
- Generated projections — regenerated only.

## Test Cases

- Lint: `npm --prefix writing run lint` passes, including the ja-JP document profile on `references/ja-JP.md`.
- Copy check: no run of 20 or more identical characters is shared between the new section and yomiyasu's `SKILL.md` or `references/slop-catalog.md` at the pinned commit. The check runs once during implementation and is recorded in the plan.
- Excerpt stability: the persistent instruction excerpt and generated account instruction blocks are unchanged.
- Projections: existing generator checks and `python -m unittest discover -s tests -v` pass.

## Success Criteria

- A writer reading `references/ja-JP.md` can identify the five AI-tone categories and knows when not to replace a word.
- The new rules do not tell writers to replace standard technical terms.
- yomiyasu is cited and no text is copied.

## Risks

- A rule to remove "vague" words can push writers to delete content that carries meaning. R-03 limits replacement to same-meaning cases.
- A Japanese-proficient reviewer has not checked the paraphrase. The repository already states that Japanese naturalness needs such review. This plan does not add one.
- yomiyasu changes daily. The citation is pinned, so later changes are not reflected.

## Open Questions

- [ ] OQ-01 [A] — Should the AI-tone section also apply to the web skill's conversation answers without change, or does the Web workflow need a shorter form? The section is copied verbatim into `web-skills/`. *(raised by: planning)*

## Approach

### Step 1: Extract and filter

- **Files**: none written.
- **What**: Read yomiyasu at the pinned commit. List each category and principle. Drop word-level replacements and time-bound lists. Mark items that conflict with technical terms.
- **Verify**: the filtered list maps to R-01 and R-04.

### Step 2: Write the rules

- **Files**: `skills/coding-agent-writing/references/ja-JP.md`, `docs/references.md`
- **What**: Write the section and the meaning-rule extension in project wording. Add the citation.
- **Verify**: lint and copy check pass.

### Step 3: Regenerate

- **Files**: generated projections.
- **What**: Run the existing generators.
- **Verify**: every command in Test Cases passes.

## Review Results

### Architecture Review

Pending.

### Business Review

Pending.

### Design Review

Pending.

### Engineering Review

Pending.

## Test Plan

Pending.

## Tasks

Pending.
