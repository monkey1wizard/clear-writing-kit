# accurate-answer

`skills/accurate-answer/SKILL.md` is the single source of truth for the
accuracy-first, ISO-24495-based writing rules.

ccync manages this directory as a personal plugin and projects the skill
to every selected agent. The Claude Code **output style** at
`~/.claude/output-styles/accurate-answer.md` is a separate, always-on
artifact that Claude's output-style mechanism reads directly — ccync has
no concept of output styles, so it is generated, not projected.

Regenerate the output style after editing SKILL.md:

```bash
python3 scripts/generate-output-style.py
```

This is a manual step. Claude Code only loads a plugin's hooks in a
`claude --plugin-dir <root>` session, not a normal session, so this
cannot run automatically on every startup yet.
