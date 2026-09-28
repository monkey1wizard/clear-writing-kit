---
type: Procedure
title: Local writing checks
description: Discover and run language and genre checks in a coding-agent workspace.
tags:
  - textlint
  - checks
language: en-US
audience:
  - coding-agent
sources:
  - resource: 'Clear Writing Kit repository file: skills/coding-agent-writing/references/local-checks.md'
generated:
  by: process:clear-writing-kit-okf
source_path: skills/coding-agent-writing/references/local-checks.md
source_sha256: 8197a7038b081e421de394d69f717072474efa83850eeb7e7342ab1f83c12772
---

# Local writing checks for coding agents

Apply this procedure before delivering reader-facing output. It covers progress messages as well as final answers and saved documents.

## Discover tools before declaring them unavailable

Inspect the host's full tool catalog, including deferred tools. Search by capability and name for textlint and zhtw-mcp. Absence from the initial list does not establish unavailability.

Prefer the project's configured textlint MCP server. Confirm its configuration matches the output language and genre. If MCP is unavailable, use the project's pinned local CLI. Do not download a floating package for each answer.

For this repository, the maintained profiles are in `writing/profiles/`. If the skill was installed without this repository, discover the current project's configuration. Do not assume that the repository path exists beside the installed skill.

## Run the selected profile

Select `<language>.<genre>.json` explicitly. Supported languages are en-US, zh-TW, and ja-JP. Genres are document and conversation.

From the repository's `writing/` directory, a document check uses:

```powershell
node check.cjs --language ja-JP --genre document --stdin --stdin-filename draft.md
```

Provide the full draft through standard input. For a real file, pass its path instead of the stdin arguments.

The launcher rejects empty rule sets. The official MCP server uses the same configuration:

```powershell
node check.cjs --language ja-JP --genre document --mcp
```

Read the actual tool schema before calling `lintText` or `lintFile`. A virtual filename identifies the content type, not its language. For multilingual documents, use the repository's section-aware checker or separate the sections before linting.

For zh-TW, run [zhtw-checks.md](zhtw-checks.md) after textlint. The tools have different responsibilities.

## Review, recheck, and report

Start in check-only mode. Review proposed changes against the original meaning. Limit automatic correction to two rounds. Never accept a change that alters a protected literal, number, condition, negation, scope, or certainty.

If a required document check remains blocked, report the location and unresolved finding. For advisory style findings, deliver the meaning-preserving draft and disclose a limitation when it affects the result.

If a tool is absent, denied, misconfigured, or times out, report that observed state. Perform the manual language checks. Do not report missing execution as a pass. Disclose unchanged degradation once, not in every progress message.

Record evidence when the task requires it. Do not add a self-evaluation or tool-success ritual to every answer. Checking an already sent message cannot establish a pre-delivery check.
