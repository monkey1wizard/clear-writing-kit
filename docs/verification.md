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

The Chinese tool workflow remains Chinese. Shared references are generated into the Web package, not maintained as independent copies.

The earlier document profile required polite body text. Its passing tests did not establish the user's requested plain document style. That conclusion is withdrawn. The corrected document profile uses plain body text, plain headings, and plain or noun-phrase lists. The conversation profile retains polite body text and lists. README instructions, language guidance, and account snippets follow this project choice. Mechanical checks do not establish idiomatic Japanese. No independent proficient-reader assessment is claimed.

New document-style tests first failed against the earlier configuration. Further negative cases exposed missed polite past and negative endings in the upstream classifier. The supplemental rule covers those tested cases without auto-fixing them. The final tests check actual Japanese README text and both packaged language guides. Conversation tests accept polite wording, while document tests reject it. This distinction reflects the user's project policy, not a universal rule that Japanese documents must use plain forms.

No live ChatGPT or Gemini upload, global skill installation, ccync synchronization, new-agent activation, long-conversation evaluation, or message-blocking hook was tested. Neither format validation nor synthetic tests prove that a model will follow every rule. The original research specification's cross-host deployment acceptance remains outside this repository-only implementation.

## ccync installation verification

Date: 2026-10-10. Environment: Windows, ccync 0.1.5, and uv CPython 3.13.16 and 3.14.8 for the Python suite. This section records automated evidence for the ccync path and the direct installer ownership boundary.

### Automated evidence commands

Set `CCYNC_BIN` to the absolute path of the installed ccync executable, then run the projection test. The test fails when `CCYNC_BIN` is missing or invalid, and it never skips.

```text
node --test --test-name-pattern "ccync projects local clear-writing-kit MCP" writing/integration/ccync-projection.test.cjs
```

The default `npm --prefix writing test` suite does not discover this file. Run the repository suites separately:

```text
cmd.exe /d /c npm --prefix writing test
python -m unittest discover -s tests -v
cmd.exe /d /c npm --prefix writing run lint
```

The projection test uses one fresh isolated home for a successful five-host sync. Separate fresh homes preseed a foreign same-name entry before ccync owns the name, and each collision must be reported with the foreign bytes preserved.

### Per-host rendering

An isolated audit probe with ccync 0.1.5 observed the following vectors. The `<cache>` path is ccync's pinned plugin cache. The projection test checks only that each vector contains `node`, `mcp`, and one cache payload path. It does not assert these exact vectors.

| Host | Rendered registration |
| --- | --- |
| Codex, Copilot, agy | Command `node` with arguments `<cache>/dist/cwk.mjs` and `mcp` |
| opencode | Command vector `node`, `<cache>/dist/cwk.mjs`, `mcp` |
| Claude | A `powershell -NoProfile -Command` launcher that sets plugin environment variables and runs `& 'node' '<cache>/dist/cwk.mjs' 'mcp'` |

The Claude launcher is ccync-owned behavior, so Claude also needs PowerShell on PATH. The root `mcp.json` itself holds only literal `node` and has no launcher or runtime fallback. If Node.js 20.18 or later is not on the host's PATH, the MCP process cannot start. GUI-launched hosts may not inherit that PATH, and the host owns how it shows the error.

### Ownership and lock evidence

Automated installer tests cover the safe MCP transitions, blocking conflicts for unowned, unreadable, and drifted entries, manifest and live-registration changes between plan and apply, apply-uninstall lock contention, stale-lock refusal, and lock release on failure. The ownership rule, the shared lock `~/.clear-writing-kit.lock`, and recovery are documented in the [installer guide](installer.md). Before deleting a lock file, confirm that no `cwk install apply` or `cwk install uninstall` process is active.

### Owner acceptance limit

Owner acceptance in real homes is still pending. OA-01 to OA-03 must run in fresh host sessions against the published ccync pin. They have not run, and the automated evidence above does not replace them. The owner waived OA-01 to OA-03 when closing this plan on 2026-10-10. A waiver is not a pass. The repository does not claim that the published pin works in a real home.

## Cross-agent installer verification (2026-10-02)

Date: 2026-10-02. Environment: Windows, Node.js 25.2.1, Deno 2.9.7, Bun 1.3.12.

### The verify command

The `cwk install verify --agent <agent>` command tests live installer operations:

- Direct stdio JSON-RPC transport: It starts the registered MCP command and speaks `initialize`, `tools/list`, and `tools/call` over stdio without an external client package.
- Multi-language probes: It calls `lintText` with probe sentences in `en-US`, `zh-TW`, and `ja-JP`. Each probe must produce at least one finding. Calls are bounded by a 30-second timeout.
- Host configuration checks: In Claude Code, it re-reads `~/.claude/settings.json` to confirm `outputStyle` equals `clear-writing-kit`.
- Instruction block validation: It checks that exactly one instruction block exists within `<!-- clear-writing-kit:begin v=<version> -->` and `<!-- clear-writing-kit:end -->`, and verifies the block stays under 2,048 bytes.
- Conflict reporting: It lists conflicts, such as an `outputStyle` set to another value, under `Conflicts:`. It reports them without deleting them.
- Strict verdict: It returns `pass` (exit code 0) only when every check runs and passes. Any missing tool, failed probe, stale setting, or oversize block results in `incomplete` (exit code 1).

### Host verification scope

Native fixture lifecycles verify Claude Code (`claude`) and Codex CLI (`codex`) on isolated configuration directories. Other surveyed hosts (`copilot`, `opencode`, `antigravity`) remain marked unverified (`verified: false`). For unverified hosts, `plan` outputs manual installation instructions and `apply` refuses to run.

### Uninstall lifecycle and restoration limits

The `cwk install uninstall --agent <agent>` command removes installed items based on manifest tracking:

- Tracked file removal: Files are deleted only when their SHA-256 matches the install manifest.
- Registered CLI entries: Host plugin and MCP registrations are removed through host CLIs when current commands match recorded fingerprints.
- Instruction block removal: The instruction block is removed only when its exact content hash matches.
- Payload version cleanup: Versioned directories in `~/.clear-writing-kit/<version>/` are removed when their hashes match.
- Modified item retention: Any file, instruction block, or MCP entry modified after installation is preserved and reported with the reason.
- Restoration limits: Timestamped backups (such as `settings.json.bak`) are preserved in the backup directory. Restoring a prior `outputStyle` or an original non-standard trailing newline requires manual restoration from the retained backup. Host marketplace registrations are retained for manual removal.

### Manifest ownership, shared retention, and migration

Manifest schema revision 2 tracks granular ownership across hosts:

- Per-file host owners: Each tracked payload file and launcher records an array of host owners that consume the runtime.
- Block and settings records: Instruction blocks and output-style settings entries track their specific host and persisted actual target path.
- Per-host completion metadata: Completed step lists are partitioned by host rather than recorded as a single global list.
- Shared runtime retention: Payload files and launcher are preserved during uninstall while another host owner, unresolved legacy ownership, a retained or failed CLI registration, a retained block, or a retained settings record remains.
- Final consumer removal: When no surviving host or unresolved record references the shared runtime, exact-matching payload files and launcher are removed, empty directories are pruned, and the manifest is deleted.
- Metadata adoption on apply: Applying an already-current artifact adopts host ownership metadata into the manifest without rewriting file bytes or replacing differing old hashes. Fully adopted reruns are idempotent.
- Conservative legacy migration: Unversioned or schema revision 1 manifests are migrated into revision 2 structures. Where unambiguous evidence exists (such as host-specific instruction file paths or unique CLI entries), ownership is attributed to that host. Where ownership cannot be resolved from recorded evidence, items receive explicit unresolved legacy ownership and are retained, rather than assigned to the requesting host.
- Relocated configuration targets: Custom configuration directories specified through environment variables are persisted as durable target paths, ensuring uninstall cleans the exact files written during apply.

### Historical test status distinction

Keep the 2026-09-29 local check results above distinct from later regression runs. Two historical test failures in `writing/test/okf.test.cjs` stemmed from a stale `source_sha256` in `knowledge/usage/gemini.md` dating from commit `bf6d3a5` (2026-09-29), predating the installer implementation. Under owner authorization on 2026-10-02, that stale generated file was repaired through `node writing/okf.cjs --generate` (recorded at commit `46ec937`) without manual edits or changes to source rules, restoring full OKF check and test passage.

All installer test passes reflect execution in isolated fixture homes with stubbed or simulated host CLI environments. Live real-home installation and end-to-end interactive session activation across Claude Code and Codex remain pending human review.
