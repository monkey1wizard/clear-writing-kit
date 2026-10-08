---
type: Writing Rule
title: Accuracy and clarity
description: Preserve meaning, uncertainty, and scope while making answers clear.
tags:
  - accuracy
  - plain-language
language: en-US
audience:
  - coding-agent
  - web
sources:
  - resource: 'Clear Writing Kit repository file: skills/coding-agent-writing/references/accuracy.md'
generated:
  by: process:clear-writing-kit-okf
source_path: skills/coding-agent-writing/references/accuracy.md
source_sha256: b0d934cc28b53288664cb8beb8cb93533a8024e01a814759ebc4e7dcd26192c5
---

# Shared accuracy and clarity rules

Accuracy comes first, clarity second, and plain language third. If shortening loses meaning, keep the longer wording.

## Persistent instruction excerpt

The following block is also the source for generated Web custom instructions.

<!-- instructions:begin -->
Lead with the answer. Preserve facts, conditions, exceptions, negation, numbers, units, scope, attribution, and genuine uncertainty. Keep must, should, may, and can distinct. Separate verified facts from inference, advice, and unchecked claims. Report both success and failure. Preserve code, identifiers, commands, paths, URLs, quotations, error text, and product names unless I request changes. Use one term per concept and one main idea per sentence. Put conditions before the actions they control. Use focused paragraphs and lists when useful. Do not use semicolons, em dashes, or parenthetical asides in prose. Check meaning after editing. Follow my requested language and format. Use en-US spelling. For ja-JP documents, use plain forms, concise headings without final periods, and consistent sentences or noun phrases within each list. Use plain action sentences for steps. For ja-JP conversations, use polite text and lists. Apply document style to documents drafted in chat. Never claim a tool ran unless it did.
<!-- instructions:end -->

## Plain language

Apply the reader outcomes of ISO 24495-1:

- Relevant: include what the reader needs for the task.
- Findable: put the answer and required action before supporting detail.
- Understandable: use familiar words and explain necessary terms.
- Usable: identify who acts, what they do, and any applicable conditions.

These are project writing rules informed by published principles. They do not certify compliance with ISO 24495-1.

## Structure and style

Keep one main idea per sentence. Keep necessary qualifications attached to the claim they limit. State the actor when its identity affects understanding. Use active wording when the actor is known.

Use lists for parallel items when they aid reading. Use tables for comparisons. Do not force a short reply into a fixed layout or split a condition from its consequence to meet a length limit.

In procedures, use action statements. In explanations, use descriptive sentences. Keep separate sections when a document needs both.

The punctuation restrictions apply to prose. Preserve punctuation inside code, identifiers, literal quotations, error messages, and required machine-readable formats. An explicit user or project format takes priority over general style preferences.

## Uncertainty and evidence

Keep real uncertainty. Remove only redundant hedges. Never change a possibility into a fact or a recommendation into a requirement.

Instead of claiming an unmeasured improvement, state the known limit. For example, use "Not benchmarked. The change removes one file read." when that is what the evidence supports.

Keep these outcomes distinct:

- Changed, but not tested.
- Tested and passed.
- Tested with partial success.
- Unable to execute the test.

When results are partial, identify the failure and the expected and observed behavior.

## Meaning check

Compare the final text with its source. Verify facts, numbers, units, deadlines, negation, conditions, exceptions, scope, attribution, and certainty. A style checker cannot perform this comparison for you.

## Sources

The full entries are in the [reference list](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md).

- Plain language: the four reader outcomes derive from `[ISO2023]`. The priority of accuracy over plainness, the note that these are project rules, and the safety limits are project choices.
- Protected items: the addition of URLs and quotations to the items that stay unchanged was informed by `[SpeakHumanTW2026]` at commit `e180f0a`. No text was copied. The final scope is a project choice.
- Lists and layout: the flexible use of lists, tables, and layout was informed by `[SpeakHumanTW2026]` at commit `e180f0a`. No text was copied. The final scope is a project choice.
- Project-authored rules: facts and inference, modal strength, uncertainty, partial results, one main idea per sentence, conditions before actions, actors, procedures and descriptions, punctuation, the meaning check, and the examples.
