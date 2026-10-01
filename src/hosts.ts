export type HostCapability = {
  id: "claude" | "codex" | "copilot" | "opencode" | "antigravity";
  displayName: string;
  installedVersion: string;
  pluginFormat: string;
  pluginSkills: "yes" | "no" | "unknown";
  pluginCommands: { install: string; remove: string; list: string };
  mcpCommands: { add: string; remove: string; listOrGet: string };
  configDirectoryEnv: string | null;
  configDirectory: (home: string) => string;
  globalInstructionsFile: (home: string) => string;
  outputStyleSupport: "yes" | "no" | "unknown";
  identityEnvironmentVariables: readonly string[];
  verified: boolean;
  evidence: string;
};

export const hosts: readonly HostCapability[] = [
  {
    id: "claude",
    displayName: "Claude Code",
    installedVersion: "2.1.286",
    pluginFormat: ".claude-plugin/plugin.json with marketplace.json; plugin skills supported",
    pluginSkills: "yes",
    pluginCommands: { install: "claude plugin install <plugin[@marketplace]>", remove: "claude plugin uninstall <plugin>", list: "claude plugin list" },
    mcpCommands: { add: "claude mcp add <name> <commandOrUrl> [args...]", remove: "claude mcp remove <name>", listOrGet: "claude mcp list | claude mcp get <name>" },
    configDirectoryEnv: "CLAUDE_CONFIG_DIR",
    configDirectory: home => `${home}/.claude`,
    globalInstructionsFile: home => `${home}/.claude/CLAUDE.md`,
    outputStyleSupport: "yes",
    identityEnvironmentVariables: ["CLAUDECODE"],
    verified: false,
    evidence: "Captured: absolute-path claude.exe --version => 2.1.286 (Claude Code); claude plugin --help lists install/uninstall/list; claude mcp --help lists add/remove/list/get. Official docs: https://docs.anthropic.com/en/docs/claude-code/plugins ; https://docs.anthropic.com/en/docs/claude-code/mcp ; https://docs.anthropic.com/en/docs/claude-code/settings ; https://docs.anthropic.com/en/docs/claude-code/cli-usage",
  },
  {
    id: "codex",
    displayName: "Codex CLI",
    installedVersion: "0.159.3",
    pluginFormat: "Portable plugin.json and skills/; .codex-plugin/plugin.json compatibility format",
    pluginSkills: "yes",
    pluginCommands: { install: "codex plugin add <plugin>", remove: "codex plugin remove <plugin>", list: "codex plugin list" },
    mcpCommands: { add: "codex mcp add <name> [options]", remove: "codex mcp remove <name>", listOrGet: "codex mcp list | codex mcp get <name>" },
    configDirectoryEnv: "CODEX_HOME",
    configDirectory: home => `${home}/.codex`,
    globalInstructionsFile: home => `${home}/.codex/AGENTS.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: ["CODEX_SESSION_ID", "CODEX_THREAD_ID"],
    verified: false,
    evidence: "Captured: codex --version => codex-cli 0.159.3; codex plugin --help lists add/remove/list; codex mcp --help lists add/remove/list/get. Official docs: https://developers.openai.com/plugins/build/plugins ; https://developers.openai.com/learn/docs-mcp ; https://developers.openai.com/codex/config-reference/",
  },
  {
    id: "copilot",
    displayName: "GitHub Copilot CLI",
    installedVersion: "1.0.90",
    pluginFormat: "Agent Plugins root plugin.json; legacy .plugin/plugin.json or .claude-plugin/plugin.json; skills supported",
    pluginSkills: "yes",
    pluginCommands: { install: "copilot plugin install <spec>", remove: "copilot plugin uninstall <name>", list: "copilot plugin list" },
    mcpCommands: { add: "copilot mcp add <name> [options]", remove: "copilot mcp remove <name>", listOrGet: "copilot mcp list | copilot mcp get <name>" },
    configDirectoryEnv: "COPILOT_HOME",
    configDirectory: home => `${home}/.copilot`,
    globalInstructionsFile: home => `${home}/.copilot/copilot-instructions.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: [],
    verified: false,
    evidence: "Captured: absolute-path copilot.exe --version => GitHub Copilot CLI 1.0.90; plugin --help lists install/uninstall/list; mcp --help lists add/remove/list/get. Official docs: https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference ; https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference ; https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference",
  },
  {
    id: "opencode",
    displayName: "opencode",
    installedVersion: "1.18.34",
    pluginFormat: "opencode.json plugin entries or plugin files in .opencode/plugins/ or ~/.config/opencode/plugins/; skill files supported",
    pluginSkills: "yes",
    pluginCommands: { install: "opencode plugin <npm-module> [-g]", remove: "Remove the plugin entry from opencode.json", list: "No plugin list command shown by opencode --help" },
    mcpCommands: { add: "opencode mcp add [name]", remove: "Remove the mcp entry from opencode.json", listOrGet: "opencode mcp list" },
    configDirectoryEnv: "OPENCODE_CONFIG_DIR",
    configDirectory: home => `${home}/.config/opencode`,
    globalInstructionsFile: home => `${home}/.config/opencode/AGENTS.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: [],
    verified: false,
    evidence: "Captured after retry through the installed scoop shim: opencode --version => 1.18.34; opencode --help lists plugin; mcp --help lists add/list only. Official docs: https://dev.opencode.ai/docs/config/ ; https://dev.opencode.ai/docs/plugins/ ; https://dev.opencode.ai/docs/skills/ ; https://dev.opencode.ai/docs/mcp-servers/",
  },
  {
    id: "antigravity",
    displayName: "Antigravity CLI",
    installedVersion: "1.2.14",
    pluginFormat: "plugin.json directory bundle; skills/ with SKILL.md supported",
    pluginSkills: "yes",
    pluginCommands: { install: "agy plugin install <target>", remove: "agy plugin uninstall <name>", list: "agy plugin list" },
    mcpCommands: { add: "agy mcp add <name> [flags]", remove: "agy mcp remove <name>", listOrGet: "agy mcp list" },
    configDirectoryEnv: null,
    configDirectory: home => `${home}/.gemini/antigravity-cli`,
    globalInstructionsFile: home => `${home}/.gemini/antigravity-cli/GEMINI.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: [],
    verified: false,
    evidence: "Captured: absolute-path agy.exe --version => 1.2.14; agy --help and plugin/mcp --help list the recorded command families. Official docs: https://www.antigravity.google/docs/cli/features ; https://www.antigravity.google/docs/cli/reference/ ; https://www.antigravity.google/docs/plugins?tab=cli ; https://www.antigravity.google/docs/cli/gcli-migration/",
  },
];
