# Cross-agent installer

The cross-agent installer configures Clear Writing Kit for a supported coding-agent host. It separates inspection from mutation. Run `plan`, review the complete output, and run `apply` only with the exact plan hash that the user approved.

## Supported scope

| Host ID | Automated apply | Required session identity | Managed host-specific state |
| --- | --- | --- | --- |
| `claude` | Verified in isolated fixtures | `CLAUDECODE` | Plugin, MCP registration, `CLAUDE.md` block, and `outputStyle` |
| `codex` | Verified in isolated fixtures | `CODEX_SESSION_ID` or `CODEX_THREAD_ID` | Plugin, MCP registration, and `AGENTS.md` block |
| `copilot` | No | None | `plan` prints manual steps. `apply` refuses to run |
| `opencode` | No | None | `plan` prints manual steps. `apply` refuses to run |
| `antigravity` | No | None | `plan` prints manual steps. `apply` refuses to run |

Fixture verification does not establish installation in a real home directory or activation in a fresh interactive session. Host CLI versions and plugin formats can change. Recheck current host capabilities before changing the verified-host list.

## Install from a repository clone

Run the installer from a repository clone. The committed `dist/` payload is ready to use, so installation does not require `npm install`.

1. Select the first available supported runtime in this order: Node.js 20.18.0 or newer, Deno 2.0.0 or newer, then Bun.
2. Run the command inside the matching Claude Code or Codex session. The installer rejects a missing or conflicting host identity.
3. Run the read-only plan command and show its complete output to the user.
4. Wait for explicit user approval of that plan.
5. Run `apply` with the exact approved plan hash.
6. Run `verify` for the same host.
7. Start a fresh host session and confirm that the skill, MCP tool, and applicable output style are active.

Choose one runtime prefix:

```text
node dist/cwk.mjs
deno run -A dist/cwk.mjs
bun dist/cwk.mjs
```

Use that prefix for the lifecycle commands:

```text
<runtime-command> install plan --agent <claude|codex>
<runtime-command> install apply --agent <claude|codex> --plan-hash <approved-hash>
<runtime-command> install verify --agent <claude|codex>
<runtime-command> install uninstall --agent <claude|codex>
```

Do not edit host configuration files directly. The installer owns its marked instruction block and its own registered items. It preserves content outside those boundaries.

## Plan and apply contract

`plan` surveys the available runtimes and known hosts. It reads the selected host's plugin, MCP, instruction, settings, payload, and manifest state. The output lists conflicts, target paths, step-level changes, and a deterministic plan hash. Planning does not write files or change registrations.

`apply` recomputes the plan before it writes. If the supplied hash is missing or the target state changed after planning, it refuses the request without applying the stale plan. After a step succeeds, the installer records its completion in `~/.clear-writing-kit/install-manifest.json`. If a later step fails, run `plan` again to inspect the remaining work before retrying.

File updates use temporary files and atomic replacement. Backups are stored under `~/.clear-writing-kit/backups/`. Instruction-file updates preserve the existing byte-order mark and line-ending style. A locked destination produces a bounded retry failure instead of an unbounded wait.

## Managed state

| Item | Location or registration | Ownership rule |
| --- | --- | --- |
| Runtime payload | `~/.clear-writing-kit/<version>/` | Versioned files tracked by SHA-256 and host owner |
| Stable launcher | `~/.clear-writing-kit/cwk.mjs` | Points at the selected installed version |
| Install manifest | `~/.clear-writing-kit/install-manifest.json` | Schema revision 2 records files, registrations, blocks, settings, and completed steps |
| Plugin | Host plugin manager | Installed and removed through the host CLI |
| MCP server | `clear-writing-kit-textlint` | One host registration with the complete command and ordered arguments fingerprinted |
| Global instructions | `CLAUDE.md` or `AGENTS.md` in the active host configuration directory | Only the bounded `clear-writing-kit` marker block is managed |
| Claude output style | `settings.json` and the host output-style target | Existing settings are preserved. `outputStyle` is set only after backup |

The runtime payload contains no repository path dependency after installation. The MCP server exposes one tool, `lintText`, with `text`, `language`, and `genre` inputs.

## Verification

`verify` re-reads the installed state and starts the registered MCP command over stdio. It requires the following results:

- the server initializes and lists exactly the expected `lintText` tool
- English, Traditional Chinese, and Japanese probes each return findings
- exactly one bounded instruction block is present and its content matches the installed block
- Claude Code has `outputStyle` set to `clear-writing-kit`
- no unresolved legacy conflict prevents a complete result

The command returns `pass` only when every required check runs and passes. A missing tool, stale setting, failed language probe, duplicate block, or legacy conflict produces `incomplete`. Report passed and incomplete checks separately.

## Upgrades and multiple hosts

An upgrade is a normal `plan` and `apply` cycle. The stable launcher moves to the new version only through the approved plan. The manifest transfers every recorded host consumer to the new shared payload.

Claude Code and Codex can share the same payload and launcher. Removing one host preserves shared files while another recorded consumer remains. Unresolved ownership from a legacy manifest also retains shared files. The final consumer can remove exact-matching payload files and the launcher.

## Uninstall safety

`uninstall` removes only state that still matches the manifest:

- files require an exact SHA-256 match
- CLI registrations require the recorded complete fingerprint
- instruction blocks require the recorded content hash
- host settings require the recorded target and value

Changed, unreadable, ambiguous, or still-shared items are retained and reported. Unsupported future manifest schemas are rejected instead of being interpreted as older state. Backups and host marketplace entries remain available for manual recovery or cleanup.

This conservative behavior protects user-owned configuration. It also means that an incomplete uninstall can require a manual decision after the installer reports the retained item and reason.
