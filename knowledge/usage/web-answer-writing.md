---
type: Playbook
title: Writing in Web assistants
description: Use bundled writing guidance in ChatGPT Web and Gemini Web sessions.
tags:
  - skills
  - ChatGPT
  - Gemini
language: en-US
audience:
  - web
sources:
  - resource: 'Clear Writing Kit repository file: scripts/templates/web-skill.md'
generated:
  by: process:clear-writing-kit-okf
source_path: scripts/templates/web-skill.md
source_sha256: 563ddf3ef6748f4e17cb2654dba4e1fba076d9df91a05ce2e4339b84099e61f7
---

# Clear Writing Kit for ChatGPT Web and Gemini Web

Use this package in a Web assistant that supports uploaded skills. Choose the platform's skill interface for installation. Uploading files into an ordinary chat does not by itself establish persistent skill activation.

## Use the bundled references

Read [accuracy.md](../rules/accuracy.md) before drafting. Read each language reference needed for the requested output:

- [en-US.md](../rules/en-US.md) for United States English.
- [zh-TW.md](../rules/zh-TW.md) for Traditional Chinese used in Taiwan.
- [ja-JP.md](../rules/ja-JP.md) for Japanese.

These references are included in the package. Do not try to read another local skill or repository.

## Web answer workflow

1. Identify the question, language, document or conversation format, and any user-specified style.
2. Distinguish information supplied by the user from facts that need verification. If current information matters, check the date and use available search or browsing.
3. Draft the complete answer. Apply the shared accuracy and relevant language rules.
4. Compare the result with the source material. Preserve qualifications, negation, numbers, scope, and protected literals.
5. If information cannot be verified with available tools, state the specific limit. Finish after answering the request.

## Web tool limits

Use only tools exposed by the current Web session. Do not assume that a local filesystem, command line, textlint installation, or MCP server exists.

When a writing checker is actually available and authorized, inspect its findings and recheck any edited draft. Otherwise, use the language references for manual review. Do not claim that a mechanical check ran.

Persistent account instructions are a separate feature. Include all rules needed by this skill in the uploaded package. Do not assume that another account-level instruction applies in this session.
