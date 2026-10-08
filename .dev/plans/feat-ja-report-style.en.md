# Plan: Align ja-JP document style with the official report style

## Approval

- Human approval: [pending]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

Japanese documents produced under this kit use plain style in the である form, as 文化審議会 (2022) 「公用文作成の考え方」 section Ⅲ-1 prescribes for plain-style documents. The だ form (だ・だろう・だった) is not used in documents. The rule file states this basis, and the bundled checker reports だ-form sentence endings in the `document` genre. Conversation text keeps polite style.

### Why

- The current rule allows である for noun predicates but does not exclude だ. The checker reports only polite endings. Source: `skills/coding-agent-writing/references/ja-JP.md`, `writing/rules/ja-document-style/index.cjs`.
- 「公用文作成の考え方」 Ⅲ-1 ウ says that plain style in official documents uses 「である・であろう・であった」, not 「だ・だろう・だった」. Source: https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93651301_01.pdf
- Japanese university writing guides use the same form for reports and papers. Example: 青山学院大学経済学会 「論文・エッセイ執筆の手引き」 requires 「である」調. Source: https://www.aoyama.ac.jp/wp-content/uploads/2024/06/論文・エッセイ執筆の手引き.pdf
- Consumer manuals use polite style instead. Source: JTF 日本語標準スタイルガイド 1.1 §1.1.1, https://www.ospn.jp/osc2013-spring/pdf/osc2013spring_jtf_style_guide.pdf. This kit's documents are not consumer manuals.
- No Japanese text in the repository currently ends a sentence with だ。, だろう。, or だった。 (`grep` on 2026-10-08 over `README.md`, `skills/`, `web-skills/`, `knowledge/`, `docs/`, `scripts/templates/`). The new check is not expected to break existing text.

### Decisions already made by the owner

- Align with the official guideline (2026-10-08).
- Project documents are treated as report-type documents. They use である-form plain style (2026-10-08).
- This plan is separate from `docs-apa-references`, which adds the reference list without changing rule meaning.

## Requirements

- [ ] R-01 `references/ja-JP.md` states that documents are treated as report-type documents and use plain style in the である form. Noun predicates end with である. Verbs end in the plain form. だ, だろう, and だった are not used as sentence endings in documents.
- [ ] R-02 `references/ja-JP.md` keeps the existing exceptions. Conversation text uses polite style. A style the user or project specifies takes precedence. Quotations, code, and product names stay unchanged.
- [ ] R-03 `references/ja-JP.md` keeps the scope statement that this is a rule for this kit's documents, not for all Japanese text. It notes that consumer-facing manuals generally use polite style.
- [ ] R-04 `writing/rules/ja-document-style` reports sentence-final だ, だろう, and だった in the `document` genre. It skips quotations in 「」 and 『』, block quotes, links, images, and code, the same as the existing polite-ending check. It skips a match when the whole word is まだ or ただ. It does not auto-fix.
- [ ] R-05 The conversation genre is unaffected. The new check does not run for `conversation`, `en-US`, or `zh-TW`.
- [ ] R-06 `writing/test/checkers.test.cjs` covers positive cases (だ。, だろう。, だった。 in documents), negative cases (である forms, verb plain forms, quoted だ, conversation genre), and the existing cases unchanged.
- [ ] R-07 `docs/writing-checks.md` describes the new check and replaces the "project choice, not a universal rule" wording with the official basis and its scope limit.
- [ ] R-08 `dist/` is rebuilt with `npm --prefix writing run build` and equals a fresh build. Generated projections are regenerated through existing generators.
- [ ] R-09 When `docs/references.md` exists, the ja-JP `Sources` section cites `[Bunka2022]` for this rule. If plan `docs-apa-references` has not landed, this plan adds the `[Bunka2022]` entry to that list in the same APA 7 format.
- [ ] R-10 The persistent instruction excerpt in `references/accuracy.md` names the である form for ja-JP documents and excludes だ. The generated ChatGPT block stays within its 1,500-character budget, and the agents block stays under 2,048 bytes.

## Diagrams

```text
Bunka2022 Ⅲ-1 ウ (である form)
        |
        v
skills/coding-agent-writing/references/ja-JP.md  ---(generators)--->  web-skills/, knowledge/, output-styles/
        |
        v
writing/rules/ja-document-style/index.cjs
        |  imported by src/rules.ts
        v
dist/cwk.mjs (rebuild)  ---> CLI `cwk check` and MCP `lintText` (ja-JP, document)
```

## Files to Create or Modify

- `skills/coding-agent-writing/references/ja-JP.md` — rule wording (protected path).
- `skills/coding-agent-writing/references/accuracy.md` — persistent excerpt wording (R-10).
- `writing/rules/ja-document-style/index.cjs` — だ-form detection.
- `writing/test/checkers.test.cjs` — new cases.
- `docs/writing-checks.md` — check description and basis.
- `docs/references.md` — `[Bunka2022]` entry, if not already present.
- `dist/cwk.mjs` — rebuilt only.
- Generated projections — regenerated only.

## Test Cases

- `本ツールは開発者向けだ。` in `ja-JP` `document` → reported by `ja-document-style`.
- `結果は変わるだろう。` and `原因は設定だった。` in `document` → reported.
- `本ツールは開発者向けである。`, `結果は変わるであろう。`, `設定を変更した。` in `document` → not reported.
- `原文は「本ツールは開発者向けだ。」である。` → not reported for the quoted part.
- `本ツールは開発者向けだ。` in `conversation` → not reported by `ja-document-style`.
- Full suite: `npm --prefix writing test`, `npm --prefix writing run lint`, `python -m unittest discover -s tests -v`, and a fresh build diff of `dist/` pass.

## Success Criteria

- A ja-JP document containing a だ-form sentence ending fails the bundled check, and the same text in conversation genre does not.
- The rule file names the official guideline and its scope.
- `dist/` equals a fresh build, and all existing tests still pass.

## Risks

- A regex on だ can match words that end in だ but are not copulas, such as まだ or ただ at a sentence end. These are rare in technical prose. The test set includes them to measure the impact.
- Writers may move from だ to noun-ending sentences (体言止め) to avoid the check. The rule text should not encourage that. It is not checked.
- The ChatGPT instruction block is 1,414 of 1,500 characters. Adding the である detail to the persistent excerpt leaves little headroom.

## Open Questions

None

## Approach

### Step 1: Update the rule text

- **Files**: `skills/coding-agent-writing/references/ja-JP.md`
- **What**: Rewrite the document-style paragraph per R-01 to R-03. Add or extend the `Sources` section with `[Bunka2022]`.
- **Verify**: textlint ja-JP document profile passes on the file. Meaning of other paragraphs unchanged.

### Step 2: Extend the checker

- **Files**: `writing/rules/ja-document-style/index.cjs`, `writing/test/checkers.test.cjs`
- **What**: Add だ-form detection with the same protection logic as the polite-ending check. Add tests.
- **Verify**: `npm --prefix writing test` passes.

### Step 3: Document, rebuild, regenerate

- **Files**: `docs/writing-checks.md`, `docs/references.md`, `dist/`, generated projections.
- **What**: Update docs. Rebuild `dist/`. Run generators.
- **Verify**: every command in Test Cases passes. `dist/` equals a fresh build.

## Review Results

### Architecture Review

Verdict: APPROVE.

Reviewed in-session against `golem-architect.agent.md` on 2026-10-08.

| Choice | Gain | Price | Verdict |
| --- | --- | --- | --- |
| Sentence-end regex with a two-word exclusion list | Same design as the existing polite-ending check. No async tokenizer inside the custom rule. | Rare hiragana nouns ending in だ may still match. Tests measure the known cases. | OK |
| Add the である detail to the persistent excerpt | Account-level users get the same rule as skill users | About 25 more characters in a block with 86 left | OK, verified at build time |
| Check only sentence ends | Matches R-01 scope and keeps the rule small | Mid-sentence だが is not reported | OK |

Bug surface: the existing preset `no-mix-dearu-desumasu` classifies だ as plain style, so it does not report だ. The new check does not conflict with it. The explanatory のだ is a だ-form ending and is reported, which matches the official guideline.

No security surface. The change edits rule text, one textlint rule, tests, and the rebuilt bundle.

<!-- ARCH_REVIEW: CLEAR -->

### Resolved Questions

| Question | Closed by | Decision | Rationale |
| --- | --- | --- | --- |
| Regex or kuromoji tokens for だ detection? | Architect, class A | Regex on the sentence end. Skip a match when the whole word is まだ or ただ. | Matches the existing rule design. Kuromoji would add asynchronous dictionary loading to a synchronous rule. Known false positives are covered by an exclusion and tests. |
| Name the である form in the persistent excerpt? | Architect, class A | Yes. Change "use plain forms" to name the である form and exclude だ. | The excerpt is the only Japanese guidance that account instructions carry. The ChatGPT block has 86 characters left, and the generator fails the build if the 1,500-character budget is exceeded. |

### Documentation Structure Review (steward)

Pass. The plan is at `.dev/plans/feat-ja-report-style.md` with an EN draft. It is one of two active plans and does not duplicate `docs-apa-references`. The diagram matches `src/rules.ts` and the build path. No old project names appear.

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
