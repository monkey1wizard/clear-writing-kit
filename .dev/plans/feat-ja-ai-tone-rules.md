<!-- gal:planning-authority
semantic-draft: .dev/plans/feat-ja-ai-tone-rules.en.md
planLanguage: zh-TW
draft-hash: 664165e87baa87b88bda9178d567211f6a300a126c6b5110f6bd10514f8ed23f
rendered-source-hash: f6d0f3c3249282c85b5b12afb6aa114095b14cfdeac9987a5a11a805671f48a7
prompt-hash: 6646681b9d1fa8563e20a880403e8853dea8fb0ed40d710678c50eaa1ea80370
equivalence-verdict: EQUIVALENT
-->

# Plan: Absorb yomiyasu AI-tone guidance into the ja-JP rules

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

ja-JP 規則提醒撰寫者避開常見於制式或機械生成日文、且可能降低可讀性的樣式，例如比喻動詞、英文直譯句型、空泛的評價詞、多餘的開場白和制式結語。這些樣式只供編輯時判斷，不是作者身分的證據。內容以專案自己的文字改寫成規則，並引用 yomiyasu 作為啟發來源。規則不得為了自然而犧牲意思或技術上的精確度。

### Why

- yomiyasu（MIT 授權）整理了日文 AI 腔的樣式。本計畫使用 commit `c2ffae670994fec96daef92e0bc219f5c1923113`（2026-10-07）的特定 repository snapshot，不把它標成 release `v1.1.0`。GitHub release 頁面的 `v1.1.0` 指向 commit `0df4774`。
- `references/ja-JP.md` 涵蓋文體、用語和意思保留，但沒有 AI 腔樣式。來源：`skills/coding-agent-writing/references/ja-JP.md`。
- yomiyasu 的意思保留規則列出改寫後必須保留的四項：主張、比重、斷定強度、句子功能。`references/accuracy.md` 的共用意思檢查涵蓋事實細節與確定程度，但沒有點名相對比重和句子功能。來源：鎖定 commit 的 yomiyasu `skills/yomiyasu/SKILL.md` §1。
- yomiyasu 有些換詞建議是寫給一般讀者的，會和標準技術用語衝突。例如 `既定`（預設）→「初めの設定」、`照合` →「照らし合わせる」。本工具的文件屬於技術文件，所以逐詞替換不能照單全收。來源：yomiyasu `skills/yomiyasu/references/slop-catalog.md` §3。
- 更正（2026-10-08）：第一點「`v1.1.0` 指向 commit `0df4774`」有誤。`gh api` 顯示 `v1.1.0` annotated tag `4a1f88f` 與已發布 release 的 target 都是 `c2ffae6` 本身。引用 commit snapshot 是為了鎖定不可變的內容，不是因為該 commit 未發布。

### Decisions already made by the owner

- 採用選項 A：只把內容寫成規則，不修改檢查器（2026-10-08）。
- 在 `docs/references.md` 把 yomiyasu 列為啟發來源。
- 本計畫在 `feat-ja-report-style` 之後執行，因為兩者都會修改 `references/ja-JP.md`。
- Web skill 原樣使用同一節。既有產生器會逐字複製 canonical ja-JP 參考檔，而縮短版會在沒有封裝限制證據時製造第二份規則來源。

## Requirements

- [ ] R-01 `references/ja-JP.md` 新增一節 AI 腔樣式，涵蓋五類：比喻動詞、英文直譯句型、空泛或裝飾性的評價詞、多餘的開場白與句尾贅詞、制式結語。每類一句規則，最多兩個簡短例子。
- [ ] R-02 這一節同時適用於文件和對話。
- [ ] R-03 這一節寫明限制：只有替換後意思和範圍都不變時才換詞。已定義的術語、標準技術用語、產品名稱和引文維持原樣。無法從原文判斷意思時，保留原本的寫法。
- [ ] R-04 `references/accuracy.md` 的共用意思檢查補上缺少的兩項：各論點的相對比重，以及每句話的功能（評價、說明、請託、預定）。既有項目保留。ja-JP 檔案不另建一份語言特定的跨語言契約。
- [ ] R-05 文字是專案自己改寫的。不照抄 yomiyasu 的任何句子或表格列。兩邊都出現的例子只限單詞或短語，不重現解說文字。
- [ ] R-06 不採用 yomiyasu 有時效性的詞表（2026 年急增詞那一節），也不採用逐詞替換表。
- [ ] R-07 `docs/references.md` 以 APA 7 軟體格式新增 yomiyasu 條目，鎖定 commit `c2ffae670994fec96daef92e0bc219f5c1923113`，且不把它標成 release `v1.1.0`。accuracy 與 ja-JP 的 `Sources` 章節都把它列為啟發來源（英文寫「informed by」，日文寫「着想を得た」）。
- [ ] R-08 新文字通過 ja-JP 文件 lint，包括 `feat-ja-report-style` 新增的「である」形檢查。
- [ ] R-09 產生的投影檔用既有產生器重新產生。常駐指令摘要，以及 ChatGPT、Gemini 指示的實質內文都不變；這兩份指示的 generated stamp 行可以因維護中參考檔納入雜湊而改變。`install/agents-block.md` 必須逐位元組相同，因為其產生器只使用未變更的常駐指令摘要。
- [ ] R-10 只有在 `docs-apa-references` 與 `feat-ja-report-style` 都已落地後才能開始實作。canonical 引用檔、交叉引用測試、更新後的 ja-JP 基準與「である」形 checker 都必須存在。任一前置條件不成立時停止，不得另建平行引用格式，也不得自行合併缺少的基準。

## Diagrams

```text
yomiyasu snapshot c2ffae6                 prerequisite plans land first
   categories + meaning points                   |
        | paraphrase and layer correctly         v
        +--> references/accuracy.md      references/ja-JP.md
        |       shared meaning guard       Japanese style signals
        +----------------------+------------------+
                               | Sources: informed by [yomiyasu]
                               v
                      docs/references.md
                               |
              existing generators --> web-skills/, knowledge/, output-styles/,
                                      web-instructions/
              unchanged check ------> install/agents-block.md
```

## Files to Create or Modify

- `skills/coding-agent-writing/references/accuracy.md` — 在常駐指令摘要以外的共用意思檢查加入相對比重與句子功能（受保護路徑）。
- `skills/coding-agent-writing/references/ja-JP.md` — 新增日文樣式訊號一節（受保護路徑）。
- `docs/references.md` — yomiyasu 條目。
- `tests/test_artifacts.py` — 新增聚焦的指引與投影契約測試。
- 產生的投影檔 — 只重新產生。

## Test Cases

- Lint：`npm --prefix writing run lint` 通過，包括 `references/ja-JP.md` 的 ja-JP 文件設定。
- 照抄檢查：取得鎖定 commit 的 `skills/yomiyasu/SKILL.md` 與 `skills/yomiyasu/references/slop-catalog.md`。先用標準函式庫執行一次連續 20 字以上相同比對，再逐條比較五類規則與例子。記錄 commit、來源路徑、機械結果和人工結果。`NotRun` 不算通過。
- 摘要穩定：排除 generated stamps 後，比對 `<!-- instructions:begin -->` 與 `<!-- instructions:end -->` 之間的文字，以及 ChatGPT、Gemini 的 fenced instruction blocks。這些內文必須不變。`install/agents-block.md` 包含 stamp 在內都必須逐位元組相同。
- 投影：既有產生器檢查與 `python -m unittest discover -s tests -v` 通過。

## Success Criteria

- 讀 `references/ja-JP.md` 的撰寫者能認出五類樣式訊號，也知道什麼情況不該換詞或推斷作者身分。
- 新規則不會要求撰寫者替換標準技術用語。
- 有引用 yomiyasu，且沒有照抄文字。

## Risks

- 「刪除空泛用語」的規則可能讓撰寫者刪掉帶有意思的內容。R-03 把替換限制在意思相同的情況。
- 改寫後的日文還沒有經過熟悉日文的人審閱。repo 已寫明日文自然度需要這種審閱。本計畫不另外安排，也不得宣稱已驗證自然度。
- yomiyasu 經常更新。引用鎖定 commit，之後的變更不會反映進來。

## Open Questions

None

## Approach

### Step 1: Verify prerequisites, then extract and filter

- **Files**: 不寫入檔案。
- **What**: 確認兩份前置計畫均已落地。讀取鎖定 commit 的兩份 yomiyasu 檔案，列出每個分類和原則。刪掉逐詞替換和有時效性的詞表，標出和技術用語衝突的項目。任一前置條件或鎖定來源無法取得時停止。
- **Verify**: 引用契約與更新後的 ja-JP 基準存在，篩選後的清單能對應到 R-01 和 R-04。

### Step 2: Write the rules

- **Files**: `skills/coding-agent-writing/references/accuracy.md`、`skills/coding-agent-writing/references/ja-JP.md`、`docs/references.md`
- **What**: 在 accuracy 加入共用意思項目，以專案文字撰寫日文一節，並加入不含 release 標籤的鎖定引用。分類只能描述為編輯訊號，不得作為作者身分證據。
- **Verify**: lint、機械重疊檢查與逐條人工比較通過。

### Step 3: Regenerate

- **Files**: 產生的投影檔。
- **What**: 執行既有產生器。
- **Verify**: Test Cases 列出的指令全部通過。

## Review Results

### Architecture Review

結論：APPROVE。

計畫沿用最小的既有架構：共用意思保護留在 `accuracy.md`，日文樣式訊號留在 `ja-JP.md`，再由既有產生器送到各交付投影。不新增 checker、相依套件、永久 copy-detection 工具或 Web 專用規則變體。前置條件不成立或鎖定來源無法取得時會停止，不會靜默降級。

OQ-01 屬於 Class A。architect 選擇 Web 原樣共用，因為產生器已逐字複製 canonical ja-JP 參考檔、參考檔不受 instruction block 預算限制，而且縮短版會製造不必要的第二份規則來源。代價是 Web 參考檔略長。

引用把 commit `c2ffae670994fec96daef92e0bc219f5c1923113` 稱為 repository snapshot，不會誤標成 release `v1.1.0`。樣式訊號不會被當成作者身分證據。日文自然度仍明確維持未驗證狀態。

<!-- ARCH_REVIEW: CLEAR -->

### Business Review

未要求。本計畫修改寫作規則與引用，不涉及商業規則、定價、權限、通知、新手引導或資格判定。

### Design Review

未要求。本計畫不修改使用者流程、版面、元件、狀態或無障礙行為。

### Documentation Structure Review (steward)

通過。source plan 與 EN semantic draft 位於預期路徑，且必要章節齊全。圖與兩份 canonical rule files、引用檔、前置條件及 generator-only 投影流程一致。兩個語言表面的敘述語言一致，沒有重複 source plan 或舊產品名稱。已解決的 OQ 已內化到計畫內容，沒有保留成過程紀錄。

### Engineering Review

CLEAR。Structural-atomicity review 已核准兩項工作的切分、能辨識 finalize 狀態的前置條件、綁定 commit 且 fail-closed 的來源取得、四檔 canonical 變更與八檔投影範圍。Tester review 已核准 TP-01 至 TP-05，包括已命名的 guidance 與 projection contracts、exact source hashes、機械與逐條 copy review、agents-block 逐位元組相同證據、machine allowlist 與 authoritative suites。前置計畫順序具有約束力，且沒有剩餘的實作選擇。

<!-- ENG_REVIEW: CLEAR -->

## Preconditions

| ID | Requirement | Check command | Expected result | How to satisfy |
| --- | --- | --- | --- | --- |
| PC-01 | canonical APA 參考文獻計畫已落地並離開 Active Plans。 | `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`；`python -c "from pathlib import Path;s=Path('.dev/state.md').read_text(encoding='utf-8').split('## Active Plans',1)[1].split('## Recent Close-outs',1)[0];raise SystemExit('docs-apa-references' in s)"` | 聚焦測試顯示 `ok`；兩個 commands 都以 0 結束，Active Plans 區段不含 `docs-apa-references`。 | 完成並 finalize `docs-apa-references`。 |
| PC-02 | ja-JP 報告文體計畫已落地並離開 Active Plans。 | `node --test --test-name-pattern="Japanese documents reject da-form endings without fixes" writing/test/checkers.test.cjs`；`python -c "from pathlib import Path;s=Path('.dev/state.md').read_text(encoding='utf-8').split('## Active Plans',1)[1].split('## Recent Close-outs',1)[0];raise SystemExit('feat-ja-report-style' in s)"` | 指定測試通過；兩個 commands 都以 0 結束，Active Plans 區段不含 `feat-ja-report-style`。 | 完成並 finalize `feat-ja-report-style`。 |
| PC-03 | 維護中的 ja-JP 規則已含完整報告文體基準。 | `python -c "from pathlib import Path;s=Path('skills/coding-agent-writing/references/ja-JP.md').read_text(encoding='utf-8');required=['報告書型','である体','文末に「だ」「だろう」「だった」'];raise SystemExit(not all(x in s for x in required))"` | 只有三個 baseline markers 都存在時才以 0 結束。 | 完成並 finalize `feat-ja-report-style`。 |

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | integration | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`。要求 exact commit snapshot 的引用雙向解析，不得標成 release `v1.1.0`，且兩份 `Sources` 只能說 yomiyasu 對規則有啟發。要求 terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 有 T-01 子節。 | T-01 |
| TP-02 | documentation | 新增並執行 `python -m unittest tests.test_artifacts.Artifacts.test_ja_ai_tone_guidance_contract -v`，再執行 `node writing/check.cjs --language en-US --genre document skills/coding-agent-writing/references/accuracy.md` 與 `node writing/check.cjs --language ja-JP --genre document skills/coding-agent-writing/references/ja-JP.md`。以 `python -c "import pathlib,subprocess;p='skills/coding-agent-writing/references/accuracy.md';a=subprocess.check_output(['git','show','HEAD:'+p],text=True,encoding='utf-8');b=pathlib.Path(p).read_text(encoding='utf-8');f=lambda s:s.split('<!-- instructions:begin -->',1)[1].split('<!-- instructions:end -->',1)[0];raise SystemExit(0 if f(a)==f(b) else 1)"` 比對常駐指令摘要。指定測試必須強制 R-01 五類、每類一條規則且最多兩個例子、文件與對話範圍、意思與範圍相同限制、已定義／技術／產品／引文文字保護、無法判斷意思時保留原文、不得推論作者身分、排除有時效性與逐詞表，以及 R-04 的兩項共用意思屬性。要求零 lint findings、摘要逐位元組相同、terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 有 T-01 子節。 | T-01 |
| TP-03 | manual | Why manual: 鎖定的 upstream 文字位於外部，語意改寫無法由本機 oracle 證明。第一次修改前，以 `python -c "from pathlib import Path as P;from urllib.request import urlopen;P('build').mkdir(exist_ok=True);P('build/yomiyasu-SKILL.md').write_bytes(urlopen('https://raw.githubusercontent.com/nanaism/yomiyasu/c2ffae670994fec96daef92e0bc219f5c1923113/skills/yomiyasu/SKILL.md').read())"` 與 `python -c "from pathlib import Path as P;from urllib.request import urlopen;P('build').mkdir(exist_ok=True);P('build/yomiyasu-slop-catalog.md').write_bytes(urlopen('https://raw.githubusercontent.com/nanaism/yomiyasu/c2ffae670994fec96daef92e0bc219f5c1923113/skills/yomiyasu/references/slop-catalog.md').read())"` 取得 exact sources；以 `powershell -NoProfile -Command "Get-FileHash build/yomiyasu-SKILL.md,build/yomiyasu-slop-catalog.md -Algorithm SHA256"` 記錄兩份 SHA-256。把新增章節存成 `build/ai-tone-section.txt`，再執行 `python -c "from pathlib import Path as P;a=P('build/ai-tone-section.txt').read_text(encoding='utf-8');b='\\n'.join(P(p).read_text(encoding='utf-8') for p in ['build/yomiyasu-SKILL.md','build/yomiyasu-slop-catalog.md']);print(sorted({a[i:i+20] for i in range(max(0,len(a)-19)) if a[i:i+20] in b}))"`。記錄 commit、兩個來源路徑、hashes 與每個 overlap；只容許能說明的必要術語或短語。逐條比較每條規則與例子，要求沒有複製句子或表格列。缺少證據或 `NotRun` 都算失敗。要求 terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 有 T-01 子節。 | T-01 |
| TP-04 | documentation | 執行 `python scripts/generate-web-artifacts.py --check`、`cmd.exe /d /c npm --prefix writing run okf:check`、`python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check`、`python scripts/generate-agents-block.py --output install/agents-block.md --check` 與 `python -m unittest tests.test_artifacts.Artifacts.test_ja_ai_tone_projection_contract -v`。再執行 `python -c "import subprocess;allowed={'web-skills/web-answer-writing/SKILL.md','web-skills/web-answer-writing/references/accuracy.md','web-skills/web-answer-writing/references/ja-JP.md','web-instructions/chatgpt.md','web-instructions/gemini.md','knowledge/rules/accuracy.md','knowledge/rules/ja-JP.md','output-styles/clear-writing-kit.md'};changed=set(subprocess.check_output(['git','diff','--name-only','--','web-skills','web-instructions','knowledge','output-styles','install/agents-block.md'],text=True).splitlines());print('\\n'.join(sorted(changed)));raise SystemExit(bool(changed-allowed))"`。指定測試必須比對常駐指令摘要及 ChatGPT、Gemini fenced blocks 的實質內文並允許其 stamps 改變，且要求 `install/agents-block.md` 逐位元組相同。要求摘要乾淨、實質差異為空、沒有超出八檔 allowlist 的路徑、terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 有 T-02 子節。 | T-02 |
| TP-05 | integration | 執行 `cmd.exe /d /c npm --prefix writing test`、`python -m unittest discover -s tests -v` 與 `cmd.exe /d /c npm --prefix writing run lint`。要求三份通過摘要、terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 有 T-01 與 T-02 子節。 | T-01, T-02 |

## Tasks

- [ ] T-01 — 新增共用意思保護與日文樣式訊號指引。
  - **Files**: `skills/coding-agent-writing/references/accuracy.md`, `skills/coding-agent-writing/references/ja-JP.md`, `docs/references.md`, `tests/test_artifacts.py`.
  - **Change**: 全部 Preconditions 通過後、第一次修改 repo 之前，從 repository `https://github.com/nanaism/yomiyasu` 的 exact commit `c2ffae670994fec96daef92e0bc219f5c1923113` 取得 `skills/yomiyasu/SKILL.md` 與 `skills/yomiyasu/references/slop-catalog.md`，使用 TP-03 兩個 commit-bound raw URLs。確認 repository、兩個路徑與 commit；任一來源無法取得或不符時，在未修改 repo 的狀態下失敗。之後在常駐指令摘要以外的共用意思檢查加入相對比重與句子功能。新增五類有界的日文樣式訊號規則，每類最多兩個短例子，並加入意思與範圍相同、技術用語保護，以及不得用樣式訊號判定作者身分的限制。以專案文字改寫鎖定 snapshot，排除有時效性的詞表和逐詞替換表。新增 APA 7 commit-snapshot 條目，兩份規則檔都只把它列為啟發來源，並新增 TP-02 與 TP-04 指定的聚焦 guidance 與 projection contract tests。沿用既有引用契約，不新增 checker、相依套件、Web 變體或永久 copy 工具。影響範圍：4 個檔案。
  - **Acceptance**: 全部 Preconditions 與 TP-01 至 TP-03 通過。引用可雙向解析，常駐指令摘要逐位元組相同，五類規則保留範圍與技術用語，copy review 記錄機械與逐條人工結果。executor log 以 `completed` 結束，證據記錄在 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 的 T-01 下。`NotRun` 視為失敗。
- [ ] T-02 — 重新產生受兩份 canonical rules 影響的交付投影。
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, `web-skills/web-answer-writing/references/accuracy.md`, `web-skills/web-answer-writing/references/ja-JP.md`, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`, `knowledge/rules/accuracy.md`, `knowledge/rules/ja-JP.md`, `output-styles/clear-writing-kit.md`.
  - **Change**: 在 T-01 後執行 `python scripts/generate-web-artifacts.py --update`、`cmd.exe /d /c npm --prefix writing run okf:generate` 與 `python scripts/generate-output-style.py`。只提交產生器擁有的副本、內嵌內容與 stamps。帳號指示的實質內文必須不變；以 check mode 驗證 agents-block generator，並要求 `install/agents-block.md` 逐位元組相同。不得手動編輯產生檔。影響範圍：8 個檔案。
  - **Acceptance**: TP-04 通過。每個宣告投影都等於產生器輸出，實質指示內文差異為空，沒有未宣告的投影變更。executor log 以 `completed` 結束，四份產生器摘要記錄在 `.dev/plans/feat-ja-ai-tone-rules.prompt.md` 的 T-02 下。
