<!--
  Compressed index of the durable documentation layer (README.md + docs/), not a knowledge sink.
  Add durable facts to README.md or docs/ first, then re-index them here.
-->

# clear-writing-kit

## What This Is

clear-writing-kit is a multilingual writing-quality toolkit for coding agents, Web assistants, ChatGPT, and Gemini. It maintains shared accuracy and language rules for English (`en-US`), Traditional Chinese (`zh-TW`), and Japanese (`ja-JP`), publishes agent-specific skills and instruction files, and provides local textlint checks through a CLI and one `lintText` MCP tool.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | TypeScript bundled to ESM; Node.js >= 20.18, Deno >= 2, or Bun |
| Writing checks | textlint with pinned local and upstream rules |
| MCP | `@modelcontextprotocol/server` with one `lintText` tool |
| Artifact generation | Python generators plus Node.js OKF and profile generators |
| Testing | Node test runner and Python `unittest` |
| Distribution | Committed `dist/cwk.mjs` plus adjacent kuromoji dictionary files |

<!-- gal:authoritative-check -->
```json
{
  "command": [
    "cmd.exe /d /c npm --prefix writing test",
    "python -m unittest discover -s tests -v",
    "cmd.exe /d /c npm --prefix writing run lint"
  ]
}
```

## Architecture

The repository has one maintained rule source and several generated or projected delivery surfaces. `skills/coding-agent-writing/` is the coding-agent skill. `web-skills/web-answer-writing/` and `web-instructions/` serve Web and account-level consumers. `knowledge/` is the generated OKF retrieval bundle. `src/` implements the bundled checker, MCP server, and cross-agent installer. `scripts/` generates committed instruction, output-style, and Web artifacts. `writing/` owns the Node toolchain and regression suites. `tests/` verifies generated artifacts.

### Runtime Layers

| Layer | Paths | Responsibility |
| --- | --- | --- |
| Rule sources | `skills/coding-agent-writing/`, `web-skills/web-answer-writing/` | Maintained accuracy and locale guidance |
| Generated knowledge and instructions | `knowledge/`, `web-instructions/`, `install/agents-block.md`, `output-styles/` | Committed projections generated from maintained sources |
| Checker and MCP | `src/check.ts`, `src/rules.ts`, `src/mcp.ts`, `src/cli.ts` | Profile loading, textlint execution, MCP transport, and CLI routing |
| Installer | `src/install/`, `src/hosts.ts` | Plan, hash-bound apply, verify, uninstall, host capability and ownership tracking |
| Runtime payload | `dist/` | Reproducible committed ESM bundle and Japanese dictionary |
| Tooling and tests | `writing/`, `scripts/`, `tests/` | Build, lint, OKF publication, artifact generation, and regression coverage |

## Constraints

- Keep `skills/coding-agent-writing/` and `web-skills/web-answer-writing/` as distinct products with shared rule meaning.
- Generate committed projections through their existing generators; do not hand-edit generated OKF, Web, instruction-block, or output-style content.
- Keep the bundled checker behavior aligned with `writing/check.cjs` for every supported language and genre.
- Never expose host configuration contents or secrets in installer output.
- Installer writes are atomic and backup-aware. Uninstall removes only exact hash or fingerprint matches and retains ambiguous, changed, unreadable, or still-shared items.
- MCP registration is performed through each host CLI. Plugin manifests do not declare an MCP server.
- `dist/` is committed and must equal a fresh `npm --prefix writing run build`.

## Response Style

- Lead with the answer, decision, or required action.
- Preserve material facts, conditions, scope limits, and genuine uncertainty.
- Use concise paragraphs and flat lists. Keep commands, paths, identifiers, and product names unchanged.
- Match the user's language. For Traditional Chinese, use natural Taiwan usage and keep technical identifiers in English.
- For reviews, report findings first in severity order with file and line evidence.

## Project Language

- `PROJECT_LANGUAGE`: `en`
- `README.md` intentionally contains parallel English, Traditional Chinese, and Japanese user guidance.
- Canonical technical documentation under `docs/` is English unless a document explicitly states otherwise.

## Protected Paths

- `skills/coding-agent-writing/` and `web-skills/web-answer-writing/` - maintained rule authority.
- `src/install/` and `src/hosts.ts` - writes to user configuration, runs host commands, and owns uninstall safety.
- `src/check.ts`, `src/rules.ts`, and `src/mcp.ts` - checker/MCP behavior shared by every runtime.
- `scripts/artifacts.py`, `writing/okf.cjs`, and committed generated outputs - source-to-projection integrity.
- `dist/` - generated runtime payload; edit source and rebuild instead of editing the bundle directly.

Protected-path changes require recorded architectural review before implementation.

## Key Decisions

| Decision | Rationale | Date |
| --- | --- | --- |
| Maintain one shared accuracy contract with locale-specific writing rules | Keeps factual safeguards aligned while allowing language-appropriate style | 2026-09-29 |
| Keep coding-agent and Web skills distinct | Their activation context and operational instructions differ even when rule meaning is shared | 2026-09-29 |
| Publish OKF as a generated retrieval bundle | Gives AI systems structured concepts without making generated files the rule authority | 2026-09-29 |
| Use one bundled checker and one `lintText` MCP tool | Avoids per-profile server drift and keeps runtime installation self-contained | 2026-10-02 |
| Register MCP through host CLIs and install skills through host plugins | Uses each host's supported ownership mechanism and prevents duplicate registration paths | 2026-10-02 |
| Track per-host consumers in manifest schema revision 2 | Shared payloads must survive one host's uninstall and be removed only after the final exact-matching consumer | 2026-10-02 |
| Treat unknown manifest schemas and ownership as unsafe | Future or ambiguous state is retained and reported instead of guessed or deleted | 2026-10-02 |

## Source Documents

| Path | Type | Notes |
| --- | --- | --- |
| `README.md` | root | Three-language overview, artifact selection, generation, installation, and verification commands |
| `INSTALL.md` | root | Agent-facing cross-host installation procedure and explicit confirmation boundary |
| `docs/writing-checks.md` | docs | Local checker commands, rule coverage, and test boundaries |
| `docs/verification.md` | docs | Executed checks, retained findings, installer verification, ownership, and acceptance limits |
| `docs/okf.md` | docs | OKF scope, generation, conformance, and publication limits |
| `docs/rule-migration.md` | docs | Migration from the predecessor rule set and intentionally changed behavior |
| `skills/coding-agent-writing/SKILL.md` | skill | Coding-agent workflow and reference routing |
| `web-skills/web-answer-writing/SKILL.md` | skill | Web-answer workflow and reference routing |

## Verified Facts

- The checker supports six profiles: three languages times `document` and `conversation`. Japanese document style uses plain body text; Japanese conversation style retains polite body text.
- `src/cli.ts` exposes `check`, `mcp`, and `install`. Installer subcommands are `plan`, `apply`, `verify`, and `uninstall`.
- Claude Code and Codex are the verified automated installer hosts. Copilot, opencode, and Antigravity remain manual/unverified and automated apply refuses them.
- Installer approval is bound to a deterministic plan hash covering payload, runtime, manifest, registration, target state, and conflicts.
- Registration parsing distinguishes present, absent, and unreadable states. Complete ordered command arguments are fingerprinted; changed or unreadable registrations are retained.
- Manifest schema revision 2 records per-file owners, per-host completed steps, host-specific block paths, and actual output-style targets. Legacy ownership is inferred only from concrete evidence.
- Cross-host upgrades transfer every recorded consumer to the new shared payload. Removing one host preserves the survivor; removing the last consumer cleans exact-matching old and current versions.
- `verify` starts the registered MCP command, lists `lintText`, and requires findings from English, Traditional Chinese, and Japanese probes. Claude verification also checks `outputStyle`.
- The committed payload runs the installer under Node, Deno, and Bun. The Japanese profile requires the adjacent committed kuromoji dictionary directory.
- Current repository regressions comprise 63 Node tests and 16 Python tests. Lint completes with zero errors and ten reviewed advisory `write-good` warnings.

## Known Limits

- Repository and isolated-fixture verification does not establish real-home installation or fresh Claude/Codex session activation. Those remain explicit human acceptance steps.
- Host CLIs and plugin formats can change independently of this repository; capability evidence must be refreshed before marking another host verified.
- Backups are retained. Restoring an earlier `outputStyle`, marketplace registration, or non-standard trailing newline can require manual action documented in `docs/verification.md`.
- Mechanical checks do not prove idiomatic Japanese or that every AI host will follow every writing instruction.
