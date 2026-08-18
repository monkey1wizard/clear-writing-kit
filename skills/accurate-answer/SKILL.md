---
name: accurate-answer
description: |
  Write or rewrite text (chat replies, docs, commit messages, error
  messages, runbooks, reports) so it is accurate first, clear second, plain
  third. Layers ISO 24495-1 plain-language principles as the base for every
  output, then adds a language-specific standard on top: English gets
  ASD-STE100 structural discipline; Traditional Chinese (zh-TW) gets both
  the plain-language layer and a locked zh-TW terminology check that catches
  Mainland-Chinese (zh-CN) term drift and AI-writing artifacts. Code,
  identifiers, CLI commands, paths, quoted error text, and product names
  stay untouched. Use whenever output risks losing a condition, a number, a
  scope qualifier, or a real hedge for the sake of sounding simpler.
version: 1.1.0
metadata:
  supersedes: output-styles/precise-plain.md (dangling adhd-zh-tw reference removed)
---

# Accurate Answer

Every text output — chat replies, docs, commit messages, error messages,
runbooks, reports — follows the rules below. Code blocks, inline code,
identifiers, CLI commands, file paths, quoted error text, and product names
are exempt; leave them exactly as given.

## Priority Ladder

**Accuracy > clarity > plainness.**

- When plainness conflicts with accuracy, keep accuracy. A longer sentence
  beats a shorter one that drops a condition, a number, a scope qualifier,
  or a real hedge.
- When clarity conflicts with plainness, keep clarity.
- No rewrite may delete a fact, a number, a condition, a scope qualifier, or
  a hedge that carries real uncertainty.

## Clarity: Structural Discipline

These rules only reorder information; they never change what is asserted,
so apply them unconditionally.

- **One idea per sentence.** A sentence carrying two ideas gets split.
  Length is not the limit — carrying two ideas is the violation.
- **Condition before instruction, separated by a comma.** "If the build
  fails, read the log," not "Read the log if the build fails." The reader
  needs to know early whether the sentence applies to them.
- **State the subject.** Every obligation and every action names who does
  it. Use passive voice only when the actor is genuinely unknown.
- **One term, one meaning, no rotation.** Do not call the same thing
  "config" here and "settings" there. Synonym variation is a literary
  virtue and a technical-writing defect.
- **Front-load the point.** The conclusion, decision, or required action
  comes first. Reasoning follows.
- **Three or more parallel items become a list; compared values become a
  table.** Reasoning stays in prose.
- **No semicolons** — write two sentences instead. **No em dashes.** **No
  parenthetical asides** — write them as their own sentence.
- **Procedural text uses imperative sentences; descriptive text uses plain
  declaratives. Never mix the two inside one passage.**

## Accuracy: Handling Uncertainty

State uncertainty explicitly. Never imply it vaguely.

- **Keep hedges that carry real information; cut decorative ones.**
  "may potentially, in some cases" compresses to "may." Stacked hedges
  compress to one.
- **Never upgrade an unverified judgment to certain language.** Do not
  turn "should" into "must," or "may" into "can," for the sake of sounding
  definite. These words carry real distinctions in probability and
  permission; flattening them is a lie, not a simplification.
- **Rewrite empty hedges into factual statements.** Not "this should be
  faster" — "not benchmarked; theoretically saves one I/O round trip." Not
  "there might be an issue" — the specific failure location and the exact
  reproduction condition.
- **Keep verified and unverified claims apart.** "Changed, not yet run"
  and "changed and passing test X" are two different states. Do not blend
  them into one sentence.
- **Report partial success as both what passed and what failed** — including
  the failure location and expected-vs-actual values.

## Standards Layering

Every output gets a base layer plus one language-specific layer on top.
The base applies first; the language layer never overrides the Priority
Ladder above it.

**Base, for every output — ISO 24495-1.** Apply the `iso-24495` skill's
four reader-outcome principles (relevant / findable / understandable /
usable) before anything language-specific. Its English technique file and
Traditional Chinese technique file are the two implementations the
language layers below build on.

**English output, on top of the base — ISO stays on, ASD-STE100 layers over
it.** English output carries both layers; the base layer is not optional
for English, only Traditional Chinese needs a second standard to cover what
ISO alone would otherwise leave to ASD-STE100 for the "plain" job:

1. **ISO 24495-1, still active.** Keep applying the `iso-24495` skill's
   `references/english-techniques.md` throughout — it is not superseded by
   the STE layer below, the two run together.
2. **ASD-STE100 structural discipline, on top.** Apply the structural
   clauses (rules 2.x, 4.x, 5.x, 6.x, 8.x — short sentences,
   condition-first procedures, one topic per paragraph) from the
   `simple-english` skill. Do not apply STE's modal bans or its
   approved-word dictionary here — see the Priority Ladder above;
   flattening should/may/must loses real distinctions. When the user
   explicitly needs full STE compliance (they name ASD-STE100,
   "compliance," or a machine-parsed controlled language), invoke
   `simple-english` on its own and say that full compliance trades away
   some of that certainty distinction.

**繁體中文（zh-TW）輸出,在基礎層之上——鎖定 zh-TW,同時維持「簡」。**這一段規則
本身在講中文的問題,所以用中文寫。zh-TW 輸出要疊兩層,兩層都要：

1. **簡（simple）：** 沿用 ISO 24495 基礎層裡 `iso-24495` skill 的
   `references/chinese-techniques.md`。中文沒有對應 ASD-STE100 的官方「簡體
   技術中文」標準,所以這一份就是 zh-TW 這邊「simple」層的實作,處理歐化長句、
   公文腔、成語堆疊、被字句濫用、中英夾雜。跟 EN 分支的差異只在於：EN 有
   ASD-STE100 這個現成標準可以疊,zh-TW 沒有,所以由 ISO 基礎層本身兼任這個
   角色,不是省略這一層。
2. **鎖定 zh-TW（locked）：** 用 `zhtw-mcp` 這個 MCP 工具
   （`mcp__zhtw-mcp__zhtw`）即時檢查,不要手動維護靜態禁用詞清單。這個工具會
   自動偵測中國大陸用語漂移（zh-CN → zh-TW,例如「視頻」「軟件」「信息」）、
   AI 寫作痕跡、翻譯腔（歐化語法）。流程：
   1. 草稿寫完、送出前,把整段 zh-TW 文字傳給這個工具的 `text` 參數。
   2. 技術文件（commit message、error message、runbook、報告）設
      `content_type: "markdown"`,一般對話回覆用 `"plain"`。
   3. 檢查回傳的 issue 清單：中國大陸用語漂移、AI 寫作痕跡、翻譯腔,三類分開看
      （`detect_style: true` 可以拿到三軸分數,不會被壓成單一分數）。
   4. 有需要自動改的地方,設 `fix_mode`：`"orthographic"` 只動標點/字形,
      `"lexical_safe"` 動安全的詞彙替換,`"lexical_contextual"` 需要上下文判斷
      時才用；改完的版本要重新過一次「準確」自檢,不能因為工具建議的替代詞而把
      已驗證/未驗證的界線、hedge 的真實不確定性壓掉。
   5. 專案有自己指定的用詞（例如人名、產品名、決定不換的詞）,用
      `glossary.proper_nouns` 排除,不要每次手動忽略同一個誤判。
   6. 找不到 `zhtw-mcp` 這個工具時（未連線、未安裝）,退回用
      `references/chinese-techniques.md` 裡的歐化語法規則人工檢查,並在回覆裡
      告知使用者這次沒有跑用詞檢查。

## Pre-Delivery Self-Check

1. Does any sentence carry two ideas? Split it.
2. Does every `if`/`when`/若/當 sit at the start of its sentence?
3. Does any single concept have two different names in this output?
4. After rewriting, did every fact, number, condition, scope qualifier, and
   real hedge survive?
5. Are verified and unverified claims kept visibly separate?
6. Did anything get written as certain that is actually unverified, just to
   sound more definite?
7. Did the ISO 24495 base layer run before the language layer, not instead
   of it?
8. **zh-TW output only：** 有沒有跑過 `zhtw-mcp`？跑不到的話,回覆裡有沒有講清楚
   這次略過了用詞檢查？

## Relationship to Other Skills

- `iso-24495` — the base layer every output goes through first; also
  supplies the zh-TW "simple" technique file directly (see Standards
  Layering above).
- `simple-english` — the EN-only layer on top of the base; full ASD-STE100
  vocabulary compliance is invoked only on explicit request.
