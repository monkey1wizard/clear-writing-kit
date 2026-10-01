# Host capability survey

Survey date: 2026-10-02. Installed-version evidence is available only for Codex CLI. `verified` means the host's full capability record is confirmed against captured output from that installed host or official documentation matching its installed version. Records based only on general documentation remain unverified.

| Host | Installed version | Plugin format; skills | Plugin install / remove / list | MCP add / remove / list or get | Config relocation variable; config path | Global instructions | Output style | Identity environment variables | Verified; evidence |
|---|---|---|---|---|---|---|---|---|---|
| Claude Code | Not installed; `claude` was not found on PATH | `.claude-plugin/plugin.json` and marketplace manifest; skills supported | `claude plugin install <name>@<marketplace>` / `claude plugin uninstall <name>` / `claude plugin list` | `claude mcp add [options] <name> <command> [args...]` / `claude mcp remove <name>` / `claude mcp list` | `CLAUDE_CONFIG_DIR`; `~/.claude` | `~/.claude/CLAUDE.md` | Supported | `CLAUDECODE` | **No.** Official general docs, not tied to an installed version: [plugins](https://docs.anthropic.com/en/docs/claude-code/plugins), [MCP](https://docs.anthropic.com/en/docs/claude-code/mcp), [settings](https://docs.anthropic.com/en/docs/claude-code/settings), [CLI](https://docs.anthropic.com/en/docs/claude-code/cli-usage). |
| Codex CLI | `codex-cli 0.159.2` | `.codex-plugin/plugin.json` compatibility format; portable root `plugin.json` and `skills/`; skills supported | `codex plugin add <plugin>` / `codex plugin remove <plugin>` / `codex plugin list` | `codex mcp add <name> [options]` / `codex mcp remove <name>` / `codex mcp list` or `codex mcp get <name>` | `CODEX_HOME`; defaults to `~/.codex` | `~/.codex/AGENTS.md` | Unknown for this CLI version | `CODEX_SESSION_ID`, `CODEX_THREAD_ID` | **Yes.** Captured output: `codex --version` => `codex-cli 0.159.2`; `codex plugin --help` lists `add`, `remove`, `list`; `codex mcp --help` lists `add`, `remove`, `list`, `get`; process environment contained the two identity variables. Official docs: [plugin packaging and CLI](https://developers.openai.com/plugins/build/plugins), [MCP CLI](https://developers.openai.com/learn/docs-mcp), [Codex config reference](https://developers.openai.com/codex/config-reference/). |
| GitHub Copilot CLI | Not installed; `copilot` was not found on PATH | Agent Plugins root `plugin.json` or legacy plugin formats; skills supported | `copilot plugin install <spec>` / `copilot plugin uninstall <name>` / `copilot plugin list` | `copilot mcp add <name> [options]` / `copilot mcp remove <name>` / `copilot mcp list` | `COPILOT_HOME`; defaults to `~/.copilot` | `~/.copilot/copilot-instructions.md` | Unknown | No exact identity variable established | **No.** Official general docs, not tied to an installed version: [plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference), [config directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference), [plugin concepts](https://docs.github.com/en/copilot/concepts/agents/about-plugins). |
| opencode | Unavailable. The installed shim fails before version output with `EEXIST` while creating `C:\Users\leetz\.config\opencode`. | Config `plugin` entries and plugin directories; skills supported | Configure in `opencode.json` or plugin directory / remove the entry or directory / no plugin list CLI command established | Configure in `opencode.json` / remove the entry / `opencode mcp list` | `OPENCODE_CONFIG_DIR`; defaults to `~/.config/opencode` | `~/.config/opencode/AGENTS.md` | Unknown | No exact identity variable established | **No.** Captured output: `opencode --version` failed with the stated `EEXIST`. Official general docs, not tied to an installed version: [config](https://dev.opencode.ai/docs/config/), [plugins](https://dev.opencode.ai/docs/plugins/), [skills](https://dev.opencode.ai/docs/skills/), [MCP](https://dev.opencode.ai/docs/mcp-servers/). |
| Antigravity CLI | Not installed; neither `agy` nor `antigravity` was found on PATH | `plugin.json` directory bundle with optional `skills/`; skills supported | No documented plugin install/remove CLI command; install/remove the plugin directory manually / `/plugins` lists loaded plugins | Edit `~/.gemini/config/mcp_config.json` or use `/mcp` / same / `/mcp` manager | No relocation variable established; `~/.gemini/antigravity-cli` | `~/.gemini/antigravity-cli/GEMINI.md` | Unknown | No exact identity variable established | **No.** Official general docs, not tied to an installed version: [plugins and skills](https://antigravity.google/docs/cli/plugins), [MCP](https://www.antigravity.google/docs/cli/mcp/), [CLI reference](https://antigravity.google/docs/cli/reference/), [installation and auth](https://antigravity.google/docs/cli-install). |

## Captured local command evidence

The following command output was captured during this survey:

```text
codex --version
codex-cli 0.159.2

codex plugin --help
Commands: add, list, marketplace, remove

codex mcp --help
Commands: list, get, add, remove, login, logout

opencode --version
EEXIST: file already exists, mkdir 'C:\Users\leetz\.config\opencode'
```

`Get-Command claude,codex,gh,opencode,agy,antigravity` found `codex.exe` and `opencode.exe`; it found no Claude Code, Copilot CLI, or Antigravity CLI executable. The records for those three hosts therefore remain unverified. The installed opencode shim could not report its version, so its record also remains unverified.

Codex's commands and installed version are verified from local output. Its remaining config and plugin-format claims cite official documentation. Output-style support is left unknown because this survey did not establish a version-matched source.
