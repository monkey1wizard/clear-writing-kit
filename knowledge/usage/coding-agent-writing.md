---
type: Playbook
title: Writing in coding agents
description: Use local writing rules and available tools for coding-agent output.
tags:
  - skills
  - coding-agent
language: en-US
audience:
  - coding-agent
sources:
  - resource: 'Clear Writing Kit repository file: skills/coding-agent-writing/SKILL.md'
generated:
  by: process:clear-writing-kit-okf
source_path: skills/coding-agent-writing/SKILL.md
source_sha256: d8cdbbf0278a3ba25687bf2180632990f9f864ce57f70cdbd0fea32e09f44e35
---

# Clear Writing Kit for Coding Agents

This skill runs inside a coding-agent workspace. It covers every reader-facing output, including short replies and progress messages. It requires local tool discovery and checks when available. It does not grant permission to install tools or edit settings.

## Read the rules

Read [accuracy.md](../rules/accuracy.md) whenever this skill is activated. Select each output language that the task needs:

- For en-US, read [en-US.md](../rules/en-US.md).
- For zh-TW, read [zh-TW.md](../rules/zh-TW.md).
- For ja-JP, read [ja-JP.md](../rules/ja-JP.md).

For a multilingual document, check each language section with its own rules. A filename does not select a textlint profile.

Read [local-checks.md](../checks/local-checks.md) before using writing tools. For zh-TW, also read [zhtw-checks.md](../checks/zhtw-checks.md). The latter preserves the original Chinese tool procedure.

## Before each delivery

1. Identify the reader, output language, and genre. Read applicable project instructions and approved terminology.
2. Draft the complete meaning. Preserve conditions, exceptions, negation, numbers, scope, attribution, and uncertainty.
3. Discover available tools, including deferred MCP tools. Run the applicable textlint profile when available. For zh-TW, also run zhtw-mcp when available.
4. Review findings in context. Preserve code, literals, approved terms, and meaning. Recheck the final edited text.
5. Deliver only claims supported by evidence. State a tool limitation on its first occurrence, then only when it changes or affects the result.

If a required project check still fails, report its location and the remaining problem. Do not describe the document as verified. Advisory style findings require judgment, not silent automatic replacement.

Instructions cannot guarantee host enforcement. Do not claim that a hook intercepted a message unless the host actually checked and could block the final message.

## Delivery check

Confirm that the reader can find the point and act on any instruction. Distinguish facts, inferences, and recommendations. Report partial success as both what succeeded and what failed. Do not add unsolicited follow-up questions or a checker summary to every answer.
