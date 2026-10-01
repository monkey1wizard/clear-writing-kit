# Host capability survey

Survey date: 2026-10-02. All five CLI installations were found by absolute executable paths or `where.exe`, and all five versions were captured. `Verified` is true only when the full record is backed by captured output or documentation matching the installed version. The captured output confirms versions and available command families. Documentation consulted is rolling documentation and is not explicitly pinned to these installed versions, so no full record is marked verified. `Unknown` means this survey did not establish the capability or exact variable.

| Host | Installed version | Plugin format; plugin skills | Plugin install / remove / list | MCP add / remove / list or get | Config relocation variable; config path | Global instruction file | Output style support | Identity environment variables | Verified; evidence |
|---|---|---|---|---|---|---|---|---|---|
| Claude Code | `2.1.286` | `.claude-plugin/plugin.json` with `marketplace.json`; yes | `claude plugin install <plugin[@marketplace]>` / `claude plugin uninstall <plugin>` / `claude plugin list` | `claude mcp add <name> <commandOrUrl> [args...]` / `claude mcp remove <name>` / `claude mcp list` or `claude mcp get <name>` | `CLAUDE_CONFIG_DIR`; `~/.claude` | `~/.claude/CLAUDE.md` | Yes | `CLAUDECODE` | **No.** Captured absolute-path version and plugin/MCP help output. Official docs: [plugins](https://docs.anthropic.com/en/docs/claude-code/plugins), [MCP](https://docs.anthropic.com/en/docs/claude-code/mcp), [settings](https://docs.anthropic.com/en/docs/claude-code/settings), [CLI](https://docs.anthropic.com/en/docs/claude-code/cli-usage). |
| Codex CLI | `0.159.3` | Portable `plugin.json` and `skills/`; `.codex-plugin/plugin.json` compatibility format; yes | `codex plugin add <plugin>` / `codex plugin remove <plugin>` / `codex plugin list` | `codex mcp add <name> [options]` / `codex mcp remove <name>` / `codex mcp list` or `codex mcp get <name>` | `CODEX_HOME`; `~/.codex` | `~/.codex/AGENTS.md` | Unknown | `CODEX_SESSION_ID`, `CODEX_THREAD_ID` | **No.** Captured `codex --version`, `codex plugin --help`, and `codex mcp --help`. Official docs: [plugin packaging](https://developers.openai.com/plugins/build/plugins), [MCP CLI](https://developers.openai.com/learn/docs-mcp), [Codex config](https://developers.openai.com/codex/config-reference/). |
| GitHub Copilot CLI | `1.0.90` | Agent Plugins root `plugin.json`; legacy `.plugin/plugin.json` or `.claude-plugin/plugin.json`; yes | `copilot plugin install <spec>` / `copilot plugin uninstall <name>` / `copilot plugin list` | `copilot mcp add <name> [options]` / `copilot mcp remove <name>` / `copilot mcp list` or `copilot mcp get <name>` | `COPILOT_HOME`; `~/.copilot` | `~/.copilot/copilot-instructions.md` | Unknown | None established | **No.** Captured absolute-path version, `plugin --help`, and `mcp --help`. Official docs: [plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference), [config directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference), [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference). |
| opencode | `1.18.34` | `opencode.json` plugin entries or plugin files in `.opencode/plugins/` or `~/.config/opencode/plugins/`; yes | `opencode plugin <npm-module> [-g]` / remove the plugin entry from `opencode.json` / no plugin list command shown by `opencode --help` | `opencode mcp add [name]` / remove the `mcp` entry from `opencode.json` / `opencode mcp list` | `OPENCODE_CONFIG_DIR`; `~/.config/opencode` | `~/.config/opencode/AGENTS.md` | Unknown | None established | **No.** Retried the installed scoop shim successfully: `opencode --version` returned `1.18.34`; `--help` and `mcp --help` captured command forms. Official docs: [config](https://dev.opencode.ai/docs/config/), [plugins](https://dev.opencode.ai/docs/plugins/), [skills](https://dev.opencode.ai/docs/skills/), [MCP](https://dev.opencode.ai/docs/mcp-servers/). |
| Antigravity CLI | `1.2.14` | `plugin.json` directory bundle with optional `skills/` containing `SKILL.md`; yes | `agy plugin install <target>` / `agy plugin uninstall <name>` / `agy plugin list` | `agy mcp add <name> [flags]` / `agy mcp remove <name>` / `agy mcp list` | No relocation variable established; `~/.gemini/antigravity-cli` | `~/.gemini/antigravity-cli/GEMINI.md` | Unknown | None established | **No.** Captured absolute-path version and `agy --help`, `agy plugin --help`, and `agy mcp --help`. Official docs: [features](https://www.antigravity.google/docs/cli/features), [CLI reference](https://www.antigravity.google/docs/cli/reference/), [plugins](https://www.antigravity.google/docs/plugins?tab=cli), [migration/config paths](https://www.antigravity.google/docs/cli/gcli-migration/). |

## Captured local command output

```text
claude.exe --version
2.1.286 (Claude Code)

codex --version
codex-cli 0.159.3

copilot.exe --version
GitHub Copilot CLI 1.0.90.
Run 'copilot update' to check for updates.

opencode.exe --version
1.18.34

agy.exe --version
1.2.14
```

The absolute executable paths were found for Claude Code, Copilot CLI, Antigravity CLI, and the opencode scoop shim. `codex` was available directly. The installed help output listed Claude plugin install/uninstall/list and MCP add/remove/list/get; Codex plugin add/remove/list and MCP add/remove/list/get; Copilot plugin install/uninstall/list and MCP add/remove/list/get; opencode plugin installation and MCP add/list; and Antigravity plugin install/uninstall/list and MCP add/remove/list. The survey did not capture environment values for all hosts. Identity variable lists therefore contain only exact names found by the prior local survey; unestablished names remain empty rather than inferred.
