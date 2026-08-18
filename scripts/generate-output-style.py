#!/usr/bin/env python3
"""Generate ~/.claude/output-styles/accurate-answer.md from
skills/accurate-answer/SKILL.md. SKILL.md is the single source of truth;
this script derives the Claude output-style file from it so the two never
drift apart by hand-editing.

Not run automatically by ccync or by Claude Code — ccync materializes
plugin hooks but does not execute them, and Claude only loads a plugin's
hooks in a `claude --plugin-dir <root>` session, not a normal session. Run
this script by hand after editing SKILL.md:

    python3 scripts/generate-output-style.py
"""
import re
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
SKILL_PATH = PLUGIN_ROOT / "skills" / "accurate-answer" / "SKILL.md"
OUTPUT_STYLE_PATH = Path.home() / ".claude" / "output-styles" / "accurate-answer.md"

OUTPUT_STYLE_DESCRIPTION = (
    "Accuracy-first plain output. ISO 24495 is the base layer for every "
    "response; English adds ASD-STE100 structural discipline; zh-TW adds a "
    "locked terminology check via zhtw-mcp. Never trades certainty for "
    "simplicity."
)

# Sections that exist for the skill's own bookkeeping and do not belong in
# an always-on output style (skills reference each other by name; an
# output style just states the rules).
DROP_SECTIONS = {"## Relationship to Other Skills"}


def strip_frontmatter(text):
    if not text.startswith("---\n"):
        raise ValueError("SKILL.md has no frontmatter block")
    end = text.index("\n---\n", 4)
    return text[end + 5:]


def drop_h1(text):
    text = text.lstrip("\n")
    return re.sub(r"^# .+\n\n", "", text, count=1)


def drop_sections(text, headings):
    lines = text.split("\n")
    out = []
    skipping = False
    for line in lines:
        if line.strip() in headings:
            skipping = True
            continue
        if skipping and line.startswith("## "):
            skipping = False
        if not skipping:
            out.append(line)
    return "\n".join(out).rstrip() + "\n"


def main():
    if not SKILL_PATH.exists():
        print(f"error: {SKILL_PATH} not found", file=sys.stderr)
        return 1

    raw = SKILL_PATH.read_text(encoding="utf-8")
    body = strip_frontmatter(raw)
    body = drop_h1(body)
    body = drop_sections(body, DROP_SECTIONS)

    frontmatter = (
        "---\n"
        "name: accurate-answer\n"
        f"description: {OUTPUT_STYLE_DESCRIPTION}\n"
        "keep-coding-instructions: true\n"
        "---\n\n"
    )

    OUTPUT_STYLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_STYLE_PATH.write_text(frontmatter + body, encoding="utf-8")
    print(f"wrote {OUTPUT_STYLE_PATH} ({len(frontmatter + body)} bytes) from {SKILL_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
