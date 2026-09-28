# Clear Writing Kit verification

Date: 2026-09-29, Asia/Taipei. Environment: Windows, Node.js 25.2.1, Python 3.12.14. This record describes local checks, not deployment to an account or agent host.

## Executed checks

| Check | Command or method | Result |
| --- | --- | --- |
| Reproducible dependency installation | `npm --prefix writing ci --ignore-scripts --no-audit --no-fund` | Completed from the lockfile |
| Checker and OKF regression suites | `npm --prefix writing test` | 40 tests passed |
| Artifact regression suite | `python -m unittest discover -s tests -v` | 10 tests passed |
| Language and Markdown checks | `npm --prefix writing run lint` | No errors, ten English style warnings reviewed below |
| OKF publication | `npm --prefix writing run okf:check` | Ten concepts and four indexes pass format, freshness, and link checks |
| Generated Web consistency | `python scripts/generate-web-artifacts.py --check` | Seven artifacts match their maintained sources |
| Web package | Generator with `--output-dir build/web --archive-dir build/packages` | ZIP created, exact membership and content covered by tests |
| Claude preview | Generator with `--output build/clear-writing-kit.md`, followed by `--check` | Generated and checked without writing global settings |
| Skill structure | skill-creator `quick_validate.py` on both skill folders | Both passed |
| Chinese source review | Host zhtw-mcp on the final README Chinese section, zh-TW reference, and Chinese tool procedure | Zero errors and warnings, three informational findings |
| Patch whitespace | `git diff --check` | No findings |

The skill validator initially could not load PyYAML. A pinned PyYAML 6.0.3 installation under the ignored `build/validation-deps/` directory enabled the successful retry. It did not change global Python packages.

The six CLI/MCP parity tests start the actual official textlint server. They compare findings under each language and genre profile. The Japanese fixture includes a polite negative ending to exercise the supplemental document rule. They also confirm that an absent file produces an error. Other negative tests cover unknown profiles, prohibited configuration overrides, incorrect Japanese body, heading, and list style, and bad prose punctuation. Tests confirm the protected code and quotation examples remain exempt from the relevant local rules.

Artifact tests change the canonical source in a temporary directory and observe changes in both platform instructions and the Claude output. They also detect missing, stale, and extra Web files. The README test compares commands and local links across all three languages. Naming tests cover the approved title and subtitle, package identity, distinct skill names, the new temporary-directory prefix, and default output-style generation without deleting an existing old style.

## Findings retained after review

Ten write-good warnings remain. Three concern `requirement` in the canonical accuracy reference and its generated copies. The word distinguishes an obligation from a recommendation, so it remains. Seven concern `objective` in platform text, generated OKF copy blocks, templates, and the checker explanation. Here it means impartial, not a goal. The user's original Gemini wording remains unchanged.

The three zhtw-mcp informational findings identify parallel lists of protected content and meaning checks. These lists name distinct items that must be preserved. They remain unchanged. No automatic replacement was applied.

## Semantic review and limits

The OKF checks follow version 0.2 of the linked specification. Tests cover minimal concepts, unknown fields and types, malformed YAML, reserved files, missing and stale outputs, CRLF checkouts, protected literals, and standalone bundle navigation. Broken links remain acceptable to the format check. The repository publication check requires generated links to resolve. No search-ranking benchmark or external AI ingestion was run. The new Chinese README paragraph and index descriptions passed zhtw-mcp with no findings.

The in-process review compared the rewrite with the original skill at `f136386`. The [migration record](rule-migration.md) identifies preserved and intentionally adjusted rules. The original Chinese tool workflow remains Chinese. Shared references are generated into the Web package, not maintained as independent copies.

The earlier document profile required polite body text. Its passing tests did not establish the user's requested plain document style. That conclusion is withdrawn. The corrected document profile uses plain body text, plain headings, and plain or noun-phrase lists. The conversation profile retains polite body text and lists. README instructions, language guidance, and account snippets follow this project choice. Mechanical checks do not establish idiomatic Japanese. No independent proficient-reader assessment is claimed.

New document-style tests first failed against the earlier configuration. Further negative cases exposed missed polite past and negative endings in the upstream classifier. The supplemental rule covers those tested cases without auto-fixing them. The final tests check actual Japanese README text and both packaged language guides. Conversation tests accept polite wording, while document tests reject it. This distinction reflects the user's project policy, not a universal rule that Japanese documents must use plain forms.

No live ChatGPT or Gemini upload, global skill installation, ccync synchronization, new-agent activation, long-conversation evaluation, or message-blocking hook was tested. Neither format validation nor synthetic tests prove that a model will follow every rule. The original research specification's cross-host deployment acceptance remains outside this repository-only implementation.

Repository branding and the Claude output-style name now use `clear-writing-kit`. The coding-agent and Web skill names remain distinct. The [migration record](rule-migration.md) documents the old names and the required installation changes. This repository update does not rename the local checkout folder or the remote repository.
