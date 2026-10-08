<!-- gal:planning-authority
semantic-draft: .dev/plans/feat-ja-report-style.en.md
planLanguage: zh-TW
draft-hash: 3e635763c32015a495392f2b87ccffeec2c0459089e12d2ef9c57a4ba70c7ae3
rendered-source-hash: 9b1826260091f506deea94a1d0decac6dc6ab81072398fb620db96bd7dc66277
prompt-hash: cb23d9d02a69d015521912e5fcef675e8ba42b172f9e9e1171e36676aeaec278
equivalence-verdict: EQUIVALENT
-->

# Plan: Align ja-JP document style with the official report style

## Approval

- Human approval: [approved]
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

- [ ] R-01 `references/ja-JP.md` 寫明文件視為報告類文件，使用「である」形常體。基準文字使用穩定的日文 markers `報告書型`、`である体`、`文末に「だ」「だろう」「だった」`，讓相依計畫能驗證完整基準確實已落地。名詞述語以「である」結尾，動詞用普通形結尾。文件中不以「だ」「だろう」「だった」作為句尾。
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

通過。計畫位於 `.dev/plans/feat-ja-report-style.md`，並有英文草稿。它是三份 active source plans 之一，且不與引用或 AI tone 工作重複。圖與經過 `src/rules.ts`、build 及 generated projections 的兩項工作路徑一致。沒有殘留舊專案名稱。

### Business Review

Pending.

### Design Review

Pending.

### Engineering Review

CLEAR。Structural-atomicity review 已核准兩項工作的切分：T-01 負責單一 ja-JP 報告文體行為，涵蓋規則、checker、tests、durable documentation、citation 與 rebuilt bundle；T-02 只負責九份 generated projections。Tester review 已核准 TP-01 至 TP-05，包括已命名的 boundary、CLI/MCP 與 documentation contracts、完整 `dist/` 重建 hashes、machine allowlists、packaging budgets 與 authoritative suites。沒有剩餘的實作選擇。

<!-- ENG_REVIEW: CLEAR -->

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | unit | 新增名為 `Japanese documents reject da-form endings without fixes` 的測試，再執行 `node --test --test-name-pattern="Japanese documents reject da-form endings without fixes" writing/test/checkers.test.cjs`。文件中的「だ」「だろう」「だった」「のだ」必須回報；「である」「であろう」、動詞、完整詞「まだ」或「ただ」、blockquotes、links、images、inline 或 fenced code、日文引文、conversation、en-US、zh-TW 均不得回報。finding 不得含 fix payload，輸入文字必須逐位元組相同。要求 terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-report-style.prompt.md` 有 T-01 子節。 | T-01 |
| TP-02 | integration | 執行 `cmd.exe /d /c npm --prefix writing run build`，再新增並執行 `node --test --test-name-pattern="bundled Japanese report style CLI and MCP agree" writing/test/checkers.test.cjs`。該測試必須對 document 與 conversation 輸入 spawn `node dist/cwk.mjs check` 並呼叫 MCP path：document 非零結束、輸出 `ja-document-style` 且 findings 非空；conversation 為零結束、不含該規則且 findings 為空。以 `python -c "import hashlib,pathlib,subprocess;f=lambda:hashlib.sha256(b''.join(p.relative_to('dist').as_posix().encode()+b'\\0'+p.read_bytes() for p in sorted(pathlib.Path('dist').rglob('*')) if p.is_file())).hexdigest();a=f();subprocess.run(['cmd.exe','/d','/c','npm','--prefix','writing','run','build'],check=True);b=f();print(a,b);raise SystemExit(a!=b)"` 證明重建可重現；要求完整 `dist/` tree 重建前後 hash 相同。要求 terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-report-style.prompt.md` 有 T-01 子節。 | T-01 |
| TP-03 | documentation | 新增並執行 `node --test --test-name-pattern="Japanese report-style documentation contract" writing/test/checkers.test.cjs`，再執行 `node writing/check.cjs --language ja-JP --genre document skills/coding-agent-writing/references/ja-JP.md` 與 `node writing/check.cjs --language en-US --genre document docs/writing-checks.md`。指定測試必須要求 document-only「である」範圍、敬體對話、使用者或專案 override、引文／程式碼／產品名稱保護、一般消費者說明書範圍、checker message 與 `[Bunka2022]`；兩個 lint commands 均須回傳零 findings。另要求 terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-report-style.prompt.md` 有 T-01 子節。 | T-01 |
| TP-04 | documentation | 執行 `python scripts/generate-web-artifacts.py --check`、`cmd.exe /d /c npm --prefix writing run okf:check`、`python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check` 與 `python scripts/generate-agents-block.py --output install/agents-block.md --check`。再執行 `python -c "import subprocess;allowed={'web-skills/web-answer-writing/SKILL.md','web-skills/web-answer-writing/references/accuracy.md','web-skills/web-answer-writing/references/ja-JP.md','web-instructions/chatgpt.md','web-instructions/gemini.md','knowledge/rules/accuracy.md','knowledge/rules/ja-JP.md','output-styles/clear-writing-kit.md','install/agents-block.md'};changed=set(subprocess.check_output(['git','diff','--name-only','--','web-skills','web-instructions','knowledge','output-styles','install/agents-block.md'],text=True).splitlines());print('\\n'.join(sorted(changed)));raise SystemExit(bool(changed-allowed))"`。要求符合兩個預算，且沒有超出 T-02 九檔 allowlist 的路徑。另要求 terminal 記錄為 `completed`，且 prompt 有 T-02 write-back 子節。 | T-02 |
| TP-05 | integration | 執行 `cmd.exe /d /c npm --prefix writing test`、`python -m unittest discover -s tests -v`、`cmd.exe /d /c npm --prefix writing run lint` 與 `git diff --name-only -- dist web-skills knowledge web-instructions install output-styles`。要求三份通過摘要，且 generated-path diff 只能含 `dist/cwk.mjs` 與 T-02 的九檔 allowlist。要求 terminal 記錄為 `completed`，且 `.dev/plans/feat-ja-report-style.prompt.md` 有 T-01 與 T-02 子節。 | T-01 |

## Tasks

- [ ] T-01 — 在維護規則與 bundled checker 強制「である」形文件文體。
  - **Files**: `skills/coding-agent-writing/references/ja-JP.md`, `skills/coding-agent-writing/references/accuracy.md`, `writing/rules/ja-document-style/index.cjs`, `writing/test/checkers.test.cjs`, `docs/writing-checks.md`, `docs/references.md`, `dist/cwk.mjs`.
  - **Change**: 更新維護中的 ja-JP 規則與常駐指令摘要，要求文件使用「である」形，同時保留對話和明確指定文體的例外。擴充現有同步句尾規則，不新增 tokenizer。規則只在 ja-JP document 回報「だ」「だろう」「だった」「のだ」。沿用現有 protected node 與日文引文處理，排除完整詞「まだ」和「ただ」，不提供 auto-fix。加入三個已命名的聚焦 regression 與 documentation-contract tests，對齊 durable documentation；`[Bunka2022]` 已存在時沿用，只有缺少時才新增。最後由來源重建已提交的 bundle。影響範圍：7 個檔案。
  - **Acceptance**: TP-01、TP-02 與 TP-03 通過。findings 使用 `ja-document-style`，受保護或範圍外文字維持不變，規則不新增相依套件或非同步路徑，`dist/cwk.mjs` 等於 fresh build。executor log 以 `completed` 結束並記錄聚焦測試與重新建置證據。
- [ ] T-02 — 重新產生受規則與摘要影響的所有交付投影。
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, `web-skills/web-answer-writing/references/accuracy.md`, `web-skills/web-answer-writing/references/ja-JP.md`, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`, `knowledge/rules/accuracy.md`, `knowledge/rules/ja-JP.md`, `output-styles/clear-writing-kit.md`, `install/agents-block.md`.
  - **Change**: 在 T-01 後執行既有 Web、OKF、output-style 與 agents-block 產生器。只提交產生器擁有的變更，持續強制所有 packaging budgets，不得直接編輯產生輸出。影響範圍：9 個檔案。
  - **Acceptance**: TP-04 通過。每個提交的投影都等於產生器輸出，更新後的指示內容符合兩個預算，沒有不相關的產生檔變更。executor log 以 `completed` 結束並記錄四份檢查摘要。
