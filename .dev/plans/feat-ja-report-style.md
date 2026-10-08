<!-- gal:planning-authority
semantic-draft: .dev/plans/feat-ja-report-style.en.md
planLanguage: zh-TW
draft-hash: 8a6fb88eb6dd7c150f3a8b9887d43db5f07e28ec70206386853cb92bfc99d80d
rendered-source-hash: 7cc8b36753cdaddc71bc52e6769a14403aac12de19f407fb91b834f302b92f08
prompt-hash: none
equivalence-verdict: pending
-->

# Plan: Align ja-JP document style with the official report style

## Approval

- Human approval: [pending]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

本工具產出的日文文件，採用常體的「である」形，依據是文化審議會（2022）「公用文作成の考え方」Ⅲ－１對常體文件的規定。文件不使用「だ」形（だ・だろう・だった）。規則檔寫明這項依據，內建檢查器會在 `document` 類型回報「だ」形句尾。對話文字維持敬體。

### Why

- 現行規則允許名詞述語用「である」，但沒有排除「だ」。檢查器只回報敬體句尾。來源：`skills/coding-agent-writing/references/ja-JP.md`、`writing/rules/ja-document-style/index.cjs`。
- 「公用文作成の考え方」Ⅲ－１ ウ 規定，公文的常體用「である・であろう・であった」，不用「だ・だろう・だった」。來源：https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93651301_01.pdf
- 日本大學的寫作指引對報告和論文採用相同形式。例如青山學院大學經濟學會「論文・エッセイ執筆の手引き」要求用「である」調。來源：https://www.aoyama.ac.jp/wp-content/uploads/2024/06/論文・エッセイ執筆の手引き.pdf
- 一般消費者的說明書則用敬體。來源：JTF 日本語標準スタイルガイド 1.1 §1.1.1，https://www.ospn.jp/osc2013-spring/pdf/osc2013spring_jtf_style_guide.pdf。本工具的文件不是消費者說明書。
- repo 內目前沒有任何日文句子以「だ。」「だろう。」「だった。」結尾（2026-10-08 以 `grep` 檢查 `README.md`、`skills/`、`web-skills/`、`knowledge/`、`docs/`、`scripts/templates/`）。新檢查預期不會讓現有文字失敗。

### Decisions already made by the owner

- 對齊官方指引（2026-10-08）。
- 專案文件視為報告類文件，使用「である」形常體（2026-10-08）。
- 本計畫與 `docs-apa-references` 分開。後者只新增參考文獻清單，不改變規則意思。

## Requirements

- [ ] R-01 `references/ja-JP.md` 寫明文件視為報告類文件，使用「である」形常體。名詞述語以「である」結尾，動詞用普通形結尾。文件中不以「だ」「だろう」「だった」作為句尾。
- [ ] R-02 `references/ja-JP.md` 保留既有例外。對話文字用敬體。使用者或專案指定的文體優先。引文、程式碼與產品名稱維持原樣。
- [ ] R-03 `references/ja-JP.md` 保留適用範圍的說明：這是本工具文件的規則，不是所有日文的規則。並註明面向一般消費者的說明書通常用敬體。
- [ ] R-04 `writing/rules/ja-document-style` 在 `document` 類型回報句尾的「だ」「だろう」「だった」。和既有的敬體句尾檢查一樣，略過「」與『』內的引文、引用區塊、連結、圖片和程式碼。整個詞是「まだ」或「ただ」時略過。不自動修正。
- [ ] R-05 對話類型不受影響。新檢查不在 `conversation`、`en-US` 或 `zh-TW` 執行。
- [ ] R-06 `writing/test/checkers.test.cjs` 涵蓋正向案例（文件中的「だ。」「だろう。」「だった。」）、反向案例（「である」形、動詞普通形、引文內的「だ」、對話類型），且既有案例不變。
- [ ] R-07 `docs/writing-checks.md` 說明新檢查，並把「專案選擇，不是日文通則」的說法改為官方依據與其適用範圍。
- [ ] R-08 用 `npm --prefix writing run build` 重新建置 `dist/`，結果與全新建置相同。產生的投影檔用既有產生器重新產生。
- [ ] R-09 `docs/references.md` 存在時，ja-JP 的 `Sources` 一節以 `[Bunka2022]` 引用這條規則。若 `docs-apa-references` 計畫尚未落地，本計畫以相同的 APA 7 格式，把 `[Bunka2022]` 條目加入該清單。
- [ ] R-10 `references/accuracy.md` 的常駐指令摘要對 ja-JP 文件寫明「である」形並排除「だ」。產生的 ChatGPT 區塊維持在 1,500 字上限內，agents 區塊維持在 2,048 bytes 以下。

## Diagrams

```text
Bunka2022 Ⅲ-1 ウ (である form)
        |
        v
skills/coding-agent-writing/references/ja-JP.md  ---(generators)--->  web-skills/, knowledge/, output-styles/
        |
        v
writing/rules/ja-document-style/index.cjs
        |  imported by src/rules.ts
        v
dist/cwk.mjs (rebuild)  ---> CLI `cwk check` and MCP `lintText` (ja-JP, document)
```

## Files to Create or Modify

- `skills/coding-agent-writing/references/ja-JP.md` — 規則文字（受保護路徑）。
- `skills/coding-agent-writing/references/accuracy.md` — 常駐摘要文字（R-10）。
- `writing/rules/ja-document-style/index.cjs` — 偵測「だ」形。
- `writing/test/checkers.test.cjs` — 新案例。
- `docs/writing-checks.md` — 檢查說明與依據。
- `docs/references.md` — 尚未有 `[Bunka2022]` 時加入條目。
- `dist/cwk.mjs` — 只重新建置。
- 產生的投影檔 — 只重新產生。

## Test Cases

- `ja-JP` `document` 中的 `本ツールは開発者向けだ。` → `ja-document-style` 回報。
- `document` 中的 `結果は変わるだろう。` 和 `原因は設定だった。` → 回報。
- `document` 中的 `本ツールは開発者向けである。`、`結果は変わるであろう。`、`設定を変更した。` → 不回報。
- `原文は「本ツールは開発者向けだ。」である。` → 引文部分不回報。
- `conversation` 中的 `本ツールは開発者向けだ。` → `ja-document-style` 不回報。
- 完整套件：`npm --prefix writing test`、`npm --prefix writing run lint`、`python -m unittest discover -s tests -v`，以及 `dist/` 全新建置比對都通過。

## Success Criteria

- 含「だ」形句尾的 ja-JP 文件無法通過內建檢查，同一段文字在對話類型則通過。
- 規則檔寫出官方指引的名稱與適用範圍。
- `dist/` 與全新建置相同，既有測試全部通過。

## Risks

- 用正規表示式比對「だ」，可能誤判以「だ」結尾但不是斷定助動詞的詞，例如句尾的「まだ」「ただ」。這在技術文章裡很少見。測試集會納入這些詞來衡量影響。
- 撰寫者可能改用名詞結尾（体言止め）來避開檢查。規則文字不應鼓勵這種寫法。這一點不做檢查。
- ChatGPT 指示區塊已用 1,500 字中的 1,414 字。在常駐摘要加入「である」形的說明，剩餘空間很少。

## Open Questions

None

## Approach

### Step 1: Update the rule text

- **Files**: `skills/coding-agent-writing/references/ja-JP.md`
- **What**: 依 R-01 到 R-03 改寫說明文件那一段。新增或擴充 `Sources` 一節，加入 `[Bunka2022]`。
- **Verify**: 這份檔案通過 textlint ja-JP document 設定。其他段落意思不變。

### Step 2: Extend the checker

- **Files**: `writing/rules/ja-document-style/index.cjs`、`writing/test/checkers.test.cjs`
- **What**: 加入「だ」形偵測，沿用敬體句尾檢查的保護邏輯。加入測試。
- **Verify**: `npm --prefix writing test` 通過。

### Step 3: Document, rebuild, regenerate

- **Files**: `docs/writing-checks.md`、`docs/references.md`、`dist/`、產生的投影檔。
- **What**: 更新文件。重新建置 `dist/`。執行產生器。
- **Verify**: Test Cases 列出的指令全部通過。`dist/` 與全新建置相同。

## Review Results

### Architecture Review

結論：APPROVE。

2026-10-08 依 `golem-architect.agent.md` 在本次對話中審查。

| 選擇 | 得到 | 代價 | 判定 |
| --- | --- | --- | --- |
| 句尾正規表示式，加上兩個詞的排除清單 | 與既有敬體句尾檢查設計相同。自訂規則內不需要非同步斷詞。 | 少數以「だ」結尾的平假名名詞仍可能誤判。測試會衡量已知案例。 | OK |
| 在常駐摘要寫明「である」形 | 帳號指示使用者和 skill 使用者拿到相同規則 | 在只剩 86 字的區塊多用約 25 字 | OK，建置時驗證 |
| 只檢查句尾 | 符合 R-01 範圍，規則保持精簡 | 句中的「だが」不會被回報 | OK |

錯誤面：既有 preset 的 `no-mix-dearu-desumasu` 把「だ」歸為常體，所以不會回報「だ」。新檢查與它不衝突。說明語氣的「のだ」屬於「だ」形句尾，會被回報，這符合官方指引。

沒有安全面的影響。本變更修改規則文字、一條 textlint 規則、測試和重新建置的套件。

<!-- ARCH_REVIEW: CLEAR -->

### Resolved Questions

| Question | Closed by | Decision | Rationale |
| --- | --- | --- | --- |
| 偵測「だ」用正規表示式還是 kuromoji 斷詞？ | Architect，class A | 用句尾正規表示式。整個詞是「まだ」或「ただ」時略過。 | 與既有規則設計一致。kuromoji 會在同步規則裡加入非同步字典載入。已知誤判以排除清單和測試處理。 |
| 常駐摘要要不要寫明「である」形？ | Architect，class A | 要。把「use plain forms」改成寫明「である」形並排除「だ」。 | 摘要是帳號指示裡唯一的日文規則。ChatGPT 區塊剩 86 字，超過 1,500 字上限時產生器會讓建置失敗。 |

### Documentation Structure Review (steward)

通過。計畫位於 `.dev/plans/feat-ja-report-style.md`，並有英文草稿。它是兩份進行中的計畫之一，與 `docs-apa-references` 不重複。圖與 `src/rules.ts` 和建置路徑一致。沒有殘留舊專案名稱。

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
