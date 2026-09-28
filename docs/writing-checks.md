# Writing checks

## Run the checks

Use Node.js 20.18 or newer and `npm --prefix writing ci`. Dependencies and transitive versions are locked. Run `npm --prefix writing run lint` for text and Markdown checks, and `npm --prefix writing test` for checker regression tests.

The maintained profile source is `writing/profile.cjs`. Run `node writing/generate-profiles.cjs` after changing it. Six generated JSON profiles select en-US, zh-TW, or ja-JP and document or conversation style. Their consistency is checked before linting.

Use the same explicit profile for CLI and MCP. The safe local launcher checks that the configuration loaded rules before starting the official textlint CLI:

```powershell
node writing/check.cjs --language ja-JP --genre document --stdin --stdin-filename draft.md
node writing/check.cjs --language zh-TW --genre conversation --mcp
```

Provide a complete draft on standard input. Use a file path instead of the stdin arguments to check a saved document. The MCP option starts the official server without registering it in any host.

## Rule coverage

| Stable rule ID or group | Scope | Severity | Positive and negative examples | Automatic changes |
| --- | --- | --- | --- | --- |
| no-zero-width-spaces | All profiles | Error | Ordinary prose passes. U+200B in prose is reported | None in our runner |
| prose-punctuation | All profiles | Error | Separate sentences pass. A prose semicolon is reported. Code remains protected | None |
| write-good tooWordy and cliches | en-US, both genres | Warning | Direct wording passes. "in order to" prompts review | None |
| ja-technical-writing/no-mix-dearu-desumasu | ja-JP documents | Error | Plain body text, plain headings, and plain or noun-phrase lists pass. Detected polite forms are reported | None |
| ja-technical-writing/no-mix-dearu-desumasu | ja-JP conversations | Error | Polite body and lists pass. Explicit dearu body endings are reported | None |
| ja-document-style | ja-JP documents only | Error | Plain action sentences pass. Selected polite endings missed by the preset and final periods in headings are reported | None |
| ja-technical-writing/sentence-length | ja-JP, both genres | Warning | Sentences over 100 characters prompt review | None |
| ja-technical-writing/max-ten and max-comma | ja-JP, both genres | Warning | More than three commas prompts review | None |
| ja-technical-writing/max-kanji-continuous-len | ja-JP, both genres | Warning | More than six consecutive kanji prompts review | None |
| Remaining enabled Japanese preset rules | ja-JP, both genres | Error | Pinned upstream defaults and examples apply | None |
| zhtw-mcp | zh-TW, host MCP | Review findings in context | Taiwanese terminology and translationese assessed separately | Check-only default |

The Japanese preset is version 12.0.2. Its upstream inventory lists all remaining rule IDs and examples. The local profile records each override. English checks do not ban real hedges or modal verbs. The Chinese textlint profile checks basic prose issues. zhtw-mcp supplies regional wording and translationese checks.

Japanese document prose uses plain forms by project choice, not by a universal Japanese-language rule. Conversation prose uses polite forms. Documents drafted inside a conversation still use document style. Headings omit final periods, steps use plain action sentences, and each list keeps one sentence or noun-phrase pattern. The style classifier does not recognize every ordinary verb ending, so passing results still need a contextual review.

The project-authored `ja-document-style` rule covers `ません`, `ませんでした`, `ました`, `でした`, `でしょう`, `ましょう`, and `ください` at sentence endings. It supplements observed gaps in the pinned preset. It does not run for conversations or other languages. It skips code, block quotations, link content, and matched Japanese quotation spans within a text node. It reports findings without changing negation, certainty, or any other meaning. This rule does not check all Japanese grammar.

A warning is not proof of an error. For example, "objective" in the user's Gemini instruction means impartial. Replacing it with "goal" would change the meaning. Preserve the instruction and record the finding as a contextual false positive.

The runner does not auto-fix. Inline code, code blocks, block quotations, and link content are exempt from the local punctuation rule. Compare each accepted edit with the source for changes to numbers, negation, conditions, scope, attribution, and certainty.

## Test boundaries

Negative examples must trigger findings. Empty rule sets and unknown profiles must fail. CLI and MCP must report the same findings for the same profile and draft. Tests use synthetic examples and do not claim to reproduce actual user conversations.

Python tests verify shared-source propagation, generated-file drift detection, self-contained packages, archive membership, and Claude embedding. These tests do not execute a model or check an online account.

Human review remains necessary for meaning and Japanese naturalness. Cross-agent activation, long conversations, and online uploads require separate host sessions and are not established by local tests.

The [implementation verification record](verification.md) separates executed checks from untested host behavior.

## Sources

- [textlint configuration](https://textlint.org/docs/configuring/) and [official MCP server](https://textlint.org/docs/mcp/): textlint 15.8.0, MIT.
- [Japanese technical writing preset](https://github.com/textlint-ja/textlint-rule-preset-ja-technical-writing): 12.0.2, MIT.
- [write-good rule](https://github.com/textlint-rule/textlint-rule-write-good): 2.0.0, MIT.
- [no-zero-width-spaces](https://github.com/textlint-rule/textlint-rule-no-zero-width-spaces): 1.0.1, MIT.
- [zhtw-mcp](https://github.com/sysprog21/zhtw-mcp): provided through the host. Discover its current schema before use.

Third-party rule code is installed as dependencies. Project-authored guidance does not reproduce ISO or ASD-STE100 standard text.
