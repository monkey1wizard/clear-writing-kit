# Clear Writing Kit migration

Baseline: Git commit `f136386`, skill version 1.1.0.

| Original rule | New location under coding-agent-writing | Treatment |
| --- | --- | --- |
| Accuracy, clarity, plainness priority | references/accuracy.md | Preserved |
| Facts, conditions, numbers, scope, real uncertainty | references/accuracy.md | Preserved, with units, deadlines, exceptions, and attribution |
| One idea per sentence | references/accuracy.md | One main idea, keeping necessary qualifications attached |
| Condition before action | references/accuracy.md | Preserved |
| Every sentence names the actor | references/accuracy.md | Actor required when needed for understanding, per the research specification |
| Consistent terms and answer first | references/accuracy.md | Preserved |
| Fixed list threshold | references/accuracy.md | Lists selected for reader usefulness, per the research specification |
| No semicolons, em dashes, parenthetical asides | references/accuracy.md | Preserved in prose, with protected-literal exceptions |
| Procedures versus descriptions | references/accuracy.md | Preserved |
| Modal distinctions and real hedges | references/accuracy.md | Preserved |
| Untested claims and partial success | references/accuracy.md | Preserved |
| ISO 24495-1 base layer | references/accuracy.md | Project-authored guidance embedded, no unresolved external skill call |
| English structural discipline | references/en-US.md | Selected principles retained, no full STE compliance claim |
| Original Chinese plain-language layer | references/zh-TW.md | Chinese guidance retained with meaning-preservation examples |
| Original Chinese MCP procedure, lines 122–139 | references/zhtw-checks.md | Functional requirements retained in Chinese |
| content_type, detect_style, fix_mode | references/zhtw-checks.md | Preserved, check-only default |
| Glossary and post-edit meaning check | references/zhtw-checks.md | Preserved |
| Tool absence and manual fallback | references/local-checks.md and references/zhtw-checks.md | Preserved, deferred discovery added |
| Pre-delivery self-check | SKILL.md and references/accuracy.md | Preserved |
| Japanese | references/ja-JP.md | Document and conversation guidance added |

The new skill explicitly routes readers to the appropriate references. The Web package copies shared rules and portable language guidance. It excludes local tool procedures and supplies a Web-specific workflow.

The persistent-instruction excerpt in accuracy.md is the single source for both generated account texts. The surrounding platform text is maintained in `scripts/templates/`. The Gemini source retains the user's original three instructions.

The source folder changes from `skills/accurate-answer/` to `skills/coding-agent-writing/`. Update the installed skill through its existing manager. The new repository name is `clear-writing-kit`. The skill names remain `coding-agent-writing` and `web-answer-writing` so their audiences remain clear.

The Claude output-style name changes from `accurate-answer` to `clear-writing-kit`. The default generated path becomes `~/.claude/output-styles/clear-writing-kit.md`. Existing style files and selection settings are not migrated automatically. Generate and select the new style before retiring the old one. Global settings, local checkout paths, Git remote URLs, and online accounts are not modified by the generators.

The original files remain recoverable from Git. This record documents content migration, not proof that every host loaded the replacement.
