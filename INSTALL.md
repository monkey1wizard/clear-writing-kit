# Clear Writing Kit: Agent Installation Procedure

This document instructs coding agents on how to install clear-writing-kit for their host environment. Follow this procedure step-by-step.

## Choose One Ownership Path

Pick one path for each host before you install. Two paths exist, and they own separate registrations of the same server name `clear-writing-kit-textlint`.

The ccync path projects the server. Run `ccync add <clear-writing-kit source>` and then `ccync sync`. ccync owns the server in Claude, Codex, Copilot, opencode, and agy. The root `mcp.json` declares `node` with the arguments `${PLUGIN_ROOT}/dist/cwk.mjs` and `mcp`, so ccync runs the committed bundle from its pinned plugin cache. This path needs no package installation, exposes only `lintText`, and does not create `~/.clear-writing-kit/`. Skip sections 4 to 7 on this path.

- Node.js 20.18 or later must be on the host's PATH. The command is literal `node` and has no launcher or runtime fallback. Hosts that start from a desktop shortcut may not inherit that PATH. The MCP process cannot start then, and the host decides how to show the error.
- ccync 0.1.5 registers Claude through a `powershell -NoProfile -Command` launcher that runs `& 'node' '<cache>/dist/cwk.mjs' 'mcp'`. This launcher is ccync behavior, so Claude also needs PowerShell on PATH.
- The root `plugin.json` and `.mcp.json` stay absent. The `.claude-plugin` and `.codex-plugin` manifests declare no MCP server.

The direct installer path is sections 4 to 7. It installs to `~/.clear-writing-kit/` and registers the same server name through the host CLI for Claude and Codex. The install manifest entry for the same host, kind, and name is the only ownership proof. Do not use the direct installer on a host where ccync already owns the server.

Both orders fail safely and neither tool removes or adopts the other's entry:

- If you install with `cwk` first and then run `ccync sync`, ccync reports the collision and keeps the existing entry.
- If you install with ccync first, `cwk install plan` reports a blocking conflict, prints no plan hash, and exits with code 1. Report the conflict to the user and do not run `apply`.

`cwk install apply` and `cwk install uninstall` share the lock file `~/.clear-writing-kit.lock`. A competing run, or a stale lock from a crashed run, makes both commands refuse before any write. The installer never removes the lock itself. Before you delete the lock file, confirm that no `cwk install apply` or `cwk install uninstall` process is active. Then delete the file and rerun the command. `plan` does not take the lock.

## 1. Runtime Preflight

Check for an available JavaScript runtime on the system PATH in this priority order: `node`, `deno`, or `bun`.

- Supported versions: Node.js >= 20.18.0, Deno >= 2.0.0, or Bun.
- If none of these runtimes is found on PATH, STOP immediately. Do not install a runtime automatically.
- Direct the user to install a supported runtime and provide the official installation URLs:
  - Node.js: <https://nodejs.org/>
  - Deno: <https://deno.com/>
  - Bun: <https://bun.sh/>

Select the runtime command:

- Node: `node dist/cwk.mjs`
- Deno: `deno run -A dist/cwk.mjs`
- Bun: `bun dist/cwk.mjs`

## 2. Repository Clone and Committed Payload

The agent works directly from a repository clone.
The runtime payload in `dist/` is pre-built and committed to the repository, so no `npm install` is needed.

## 3. Ban on Direct Configuration Edits

Never edit host configuration files directly.
Do not manually edit or create host configuration files, settings files (such as `settings.json`), instruction files (such as `CLAUDE.md` or `AGENTS.md`), or plugin manifests. All configuration changes, plugin registrations, MCP registrations, and instruction blocks must be performed through the installer commands. Never manually edit or delete conflicting items or foreign blocks.

## 4. Compute and Show the Installation Plan

Identify your host identity `<self>` (`claude`, `codex`, `copilot`, `opencode`, or `antigravity`).
Run the read-only plan command:

```bash
<runtime-command> install plan --agent <self>
```

Show the complete plan output to the user, including the target host, target files, diffs, conflict list, and the computed plan hash.

## 5. Wait for Explicit User Confirmation

Wait for explicit confirmation from the user before applying changes.
Never run `apply` without explicit user confirmation.

## 6. Apply the Installation Plan

Once the user confirms, run the apply command with the exact plan hash from the plan step:

```bash
<runtime-command> install apply --agent <self> --plan-hash <plan-hash>
```

The installer verifies that the current target state matches the plan hash before making changes. If a step fails, the installer stops and reports the failed step. Completed steps remain recorded in the manifest.

## 7. Verify the Installation

After `apply` completes, run the verification command:

```bash
<runtime-command> install verify --agent <self>
```

The verification command checks the registered MCP server with probe sentences across all supported languages (en-US, zh-TW, ja-JP), validates the instruction block, and verifies host settings.

## 8. Separate Pass and Fail Reporting

Report passed and failed steps separately.
Do not combine passed and failed checks into a single generic summary. Clearly list every check that passed, and separately report any failed or incomplete checks along with their error messages and diagnostic details.

## 9. Request a New Session for Behavior Check

Ask the user to start a new agent session to perform the behavior check.
Host configuration changes, plugin discovery, output styles, and global instruction blocks take effect in fresh agent sessions. Prompt the user to start a new session to confirm that the skill, MCP tools, and output style are active.
