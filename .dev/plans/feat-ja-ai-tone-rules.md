<!-- gal:planning-authority
semantic-draft: .dev/plans/feat-ja-ai-tone-rules.en.md
planLanguage: zh-TW
draft-hash: 42f2d673a11f5f27fb38954ba0ff8e130daa76f736cd64db275a61bd6cb756c7
rendered-source-hash: 4946b18cf516815d57c148277138997bcd7ecb9197f3fe87e8d17085f35624e4
prompt-hash: none
equivalence-verdict: pending
-->

# Plan: Absorb yomiyasu AI-tone guidance into the ja-JP rules

## Approval

- Human approval: [pending]
- Architect review: [pending]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

ja-JP 規則提醒撰寫者避開 AI 生成日文的常見痕跡，例如比喻動詞、英文直譯句型、空泛的評價詞、多餘的開場白和制式結語。這些內容以專案自己的文字改寫成規則，並引用 yomiyasu 作為啟發來源。規則不得為了自然而犧牲意思或技術上的精確度。

### Why

- yomiyasu（MIT 授權）整理了日文 AI 腔的樣式。來源：https://github.com/nanaism/yomiyasu，release v1.1.0，commit `c2ffae670994fec96daef92e0bc219f5c1923113`（2026-10-07）。
- `references/ja-JP.md` 涵蓋文體、用語和意思保留，但沒有 AI 腔樣式。來源：`skills/coding-agent-writing/references/ja-JP.md`。
- yomiyasu 的意思保留規則列出改寫後必須保留的四項：主張、比重、斷定強度、句子功能。現行 ja-JP 規則列了事實、條件、否定、數值、範圍、來源和不確定性，但沒有比重和句子功能。來源：yomiyasu `skills/yomiyasu/SKILL.md` §1。
- yomiyasu 有些換詞建議是寫給一般讀者的，會和標準技術用語衝突。例如 `既定`（預設）→「初めの設定」、`照合` →「照らし合わせる」。本工具的文件屬於技術文件，所以逐詞替換不能照單全收。來源：yomiyasu `skills/yomiyasu/references/slop-catalog.md` §3。

### Decisions already made by the owner

- 採用選項 A：只把內容寫成規則，不修改檢查器（2026-10-08）。
- 在 `docs/references.md` 把 yomiyasu 列為啟發來源。
- 本計畫在 `feat-ja-report-style` 之後執行，因為兩者都會修改 `references/ja-JP.md`。

## Requirements

- [ ] R-01 `references/ja-JP.md` 新增一節 AI 腔樣式，涵蓋五類：比喻動詞、英文直譯句型、空泛或裝飾性的評價詞、多餘的開場白與句尾贅詞、制式結語。每類一句規則，最多兩個簡短例子。
- [ ] R-02 這一節同時適用於文件和對話。
- [ ] R-03 這一節寫明限制：只有替換後意思和範圍都不變時才換詞。已定義的術語、標準技術用語、產品名稱和引文維持原樣。無法從原文判斷意思時，保留原本的寫法。
- [ ] R-04 `references/ja-JP.md` 既有的意思保留規則，補上缺少的兩項：各論點的相對比重，以及每句話的功能（評價、說明、請託、預定）。既有項目保留。
- [ ] R-05 文字是專案自己改寫的。不照抄 yomiyasu 的任何句子或表格列。兩邊都出現的例子只限單詞或短語，不重現解說文字。
- [ ] R-06 不採用 yomiyasu 有時效性的詞表（2026 年急增詞那一節），也不採用逐詞替換表。
- [ ] R-07 `docs/references.md` 以 APA 7 軟體格式新增 yomiyasu 條目，鎖定上述 commit。ja-JP 的 `Sources` 一節把它列為啟發來源（英文寫「informed by」，日文寫「着想を得た」）。
- [ ] R-08 新文字通過 ja-JP 文件 lint，包括 `feat-ja-report-style` 新增的「である」形檢查。
- [ ] R-09 產生的投影檔用既有產生器重新產生。常駐指令摘要不變。

## Diagrams

```text
yomiyasu v1.1.0 (c2ffae6)                    feat-ja-report-style (lands first)
   categories + meaning points                    |
        | paraphrase, filter for technical terms  v
        +----------------------------> skills/coding-agent-writing/references/ja-JP.md
                                              |  "Sources": [yomiyasu] informed by
                                              v
                               docs/references.md (docs-apa-references)
                                              |
                     generators --> web-skills/, knowledge/, output-styles/
```

## Files to Create or Modify

- `skills/coding-agent-writing/references/ja-JP.md` — 新增 AI 腔一節，擴充意思保留規則（受保護路徑）。
- `docs/references.md` — yomiyasu 條目。
- 產生的投影檔 — 只重新產生。

## Test Cases

- Lint：`npm --prefix writing run lint` 通過，包括 `references/ja-JP.md` 的 ja-JP 文件設定。
- 照抄檢查：新的一節和鎖定 commit 的 yomiyasu `SKILL.md`、`references/slop-catalog.md` 之間，沒有連續 20 字以上相同的片段。實作時執行一次，結果記錄在計畫裡。
- 摘要穩定：常駐指令摘要和產生的帳號指示區塊不變。
- 投影：既有產生器檢查與 `python -m unittest discover -s tests -v` 通過。

## Success Criteria

- 讀 `references/ja-JP.md` 的撰寫者能認出五類 AI 腔，也知道什麼情況不該換詞。
- 新規則不會要求撰寫者替換標準技術用語。
- 有引用 yomiyasu，且沒有照抄文字。

## Risks

- 「刪除空泛用語」的規則可能讓撰寫者刪掉帶有意思的內容。R-03 把替換限制在意思相同的情況。
- 改寫後的日文還沒有經過熟悉日文的人審閱。repo 已寫明日文自然度需要這種審閱。本計畫不另外安排。
- yomiyasu 幾乎每天更新。引用鎖定版本，之後的變更不會反映進來。

## Open Questions

- [ ] OQ-01 [A] — AI 腔一節原樣複製到 `web-skills/` 後，是否直接適用於 Web 對話回答，還是 Web 流程需要較短的版本？ *(raised by: planning)*

## Approach

### Step 1: Extract and filter

- **Files**: 不寫入檔案。
- **What**: 讀取鎖定 commit 的 yomiyasu。列出每個分類和原則。刪掉逐詞替換和有時效性的詞表。標出和技術用語衝突的項目。
- **Verify**: 篩選後的清單能對應到 R-01 和 R-04。

### Step 2: Write the rules

- **Files**: `skills/coding-agent-writing/references/ja-JP.md`、`docs/references.md`
- **What**: 用專案自己的文字寫出這一節和意思保留規則的擴充。加入引用。
- **Verify**: lint 和照抄檢查通過。

### Step 3: Regenerate

- **Files**: 產生的投影檔。
- **What**: 執行既有產生器。
- **Verify**: Test Cases 列出的指令全部通過。

## Review Results

### Architecture Review

Pending.

### Business Review

Pending.

### Design Review

Pending.

### Engineering Review

Pending.

## Test Plan

Pending.

## Tasks

Pending.
