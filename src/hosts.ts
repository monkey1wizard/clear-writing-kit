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
    installedVersion: "not installed (claude not found on PATH)",
    pluginFormat: ".claude-plugin/plugin.json and marketplace.json",
    pluginSkills: "yes",
    pluginCommands: { install: "claude plugin install <name>@<marketplace>", remove: "claude plugin uninstall <name>", list: "claude plugin list" },
    mcpCommands: { add: "claude mcp add [options] <name> <command> [args...]", remove: "claude mcp remove <name>", listOrGet: "claude mcp list" },
    configDirectoryEnv: "CLAUDE_CONFIG_DIR",
    configDirectory: home => `${home}/.claude`,
    globalInstructionsFile: home => `${home}/.claude/CLAUDE.md`,
    outputStyleSupport: "yes",
    identityEnvironmentVariables: ["CLAUDECODE"],
    verified: false,
    evidence: "Unverified locally: Get-Command found no claude executable. Official docs (not pinned to an installed version): https://docs.anthropic.com/en/docs/claude-code/plugins ; https://docs.anthropic.com/en/docs/claude-code/mcp ; https://docs.anthropic.com/en/docs/claude-code/settings ; https://docs.anthropic.com/en/docs/claude-code/cli-usage",
  },
  {
    id: "codex",
    displayName: "Codex CLI",
    installedVersion: "0.159.2",
    pluginFormat: ".codex-plugin/plugin.json compatibility format; portable plugin.json plus skills/",
    pluginSkills: "yes",
    pluginCommands: { install: "codex plugin add <plugin>", remove: "codex plugin remove <plugin>", list: "codex plugin list" },
    mcpCommands: { add: "codex mcp add <name> [options]", remove: "codex mcp remove <name>", listOrGet: "codex mcp list | codex mcp get <name>" },
    configDirectoryEnv: "CODEX_HOME",
    configDirectory: home => `${home}/.codex`,
    globalInstructionsFile: home => `${home}/.codex/AGENTS.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: ["CODEX_SESSION_ID", "CODEX_THREAD_ID"],
    verified: true,
    evidence: "Captured local output: `codex --version` => `codex-cli 0.159.2`; `codex plugin --help` lists add/remove/list; `codex mcp --help` lists add/remove/list/get. Environment captured CODEX_SESSION_ID and CODEX_THREAD_ID. Official docs: https://developers.openai.com/plugins/build/plugins ; https://developers.openai.com/learn/docs-mcp ; https://developers.openai.com/codex/config-reference/",
  },
  {
    id: "copilot",
    displayName: "GitHub Copilot CLI",
    installedVersion: "not installed (copilot not found on PATH)",
    pluginFormat: "Agent Plugins plugin.json or legacy .plugin/plugin.json / .claude-plugin/plugin.json",
    pluginSkills: "yes",
    pluginCommands: { install: "copilot plugin install <spec>", remove: "copilot plugin uninstall <name>", list: "copilot plugin list" },
    mcpCommands: { add: "copilot mcp add <name> [options]", remove: "copilot mcp remove <name>", listOrGet: "copilot mcp list" },
    configDirectoryEnv: "COPILOT_HOME",
    configDirectory: home => `${home}/.copilot`,
    globalInstructionsFile: home => `${home}/.copilot/copilot-instructions.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: [],
    verified: false,
    evidence: "Unverified locally: Get-Command found no copilot executable. Official docs (not pinned to an installed version): https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference ; https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference ; https://docs.github.com/en/copilot/concepts/agents/about-plugins",
  },
  {
    id: "opencode",
    displayName: "opencode",
    installedVersion: "unavailable: opencode shim exits with EEXIST while creating ~/.config/opencode",
    pluginFormat: "opencode.json plugin entries or plugin directory",
    pluginSkills: "yes",
    pluginCommands: { install: "Add plugin to opencode.json or plugin directory", remove: "Remove plugin entry or plugin directory", list: "No plugin list CLI command established" },
    mcpCommands: { add: "Configure mcp in opencode.json", remove: "Remove mcp entry from opencode.json", listOrGet: "opencode mcp list" },
    configDirectoryEnv: "OPENCODE_CONFIG_DIR",
    configDirectory: home => `${home}/.config/opencode`,
    globalInstructionsFile: home => `${home}/.config/opencode/AGENTS.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: [],
    verified: false,
    evidence: "Captured local failure: `opencode --version` exits before version output with EEXIST creating C:\\Users\\leetz\\.config\\opencode. Official docs (not pinned to an installed version): https://dev.opencode.ai/docs/config/ ; https://dev.opencode.ai/docs/plugins/ ; https://dev.opencode.ai/docs/skills/ ; https://dev.opencode.ai/docs/mcp-servers/",
  },
  {
    id: "antigravity",
    displayName: "Antigravity CLI",
    installedVersion: "not installed (agy and antigravity not found on PATH)",
    pluginFormat: "~/.gemini/antigravity-cli/plugins/<name>/plugin.json with optional skills/",
    pluginSkills: "yes",
    pluginCommands: { install: "No documented CLI command; place plugin in the global plugins directory", remove: "Remove plugin directory", list: "/plugins" },
    mcpCommands: { add: "Edit ~/.gemini/config/mcp_config.json or use /mcp", remove: "Edit ~/.gemini/config/mcp_config.json or use /mcp", listOrGet: "/mcp manager" },
    configDirectoryEnv: null,
    configDirectory: home => `${home}/.gemini/antigravity-cli`,
    globalInstructionsFile: home => `${home}/.gemini/antigravity-cli/GEMINI.md`,
    outputStyleSupport: "unknown",
    identityEnvironmentVariables: [],
    verified: false,
    evidence: "Unverified locally: Get-Command found neither agy nor antigravity. Official docs (not pinned to an installed version): https://antigravity.google/docs/cli/plugins ; https://www.antigravity.google/docs/cli/mcp/ ; https://www.antigravity.google/docs/cli/reference/ ; https://antigravity.google/docs/cli-install",
  },
];
