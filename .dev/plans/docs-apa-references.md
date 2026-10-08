<!-- gal:planning-authority
semantic-draft: .dev/plans/docs-apa-references.en.md
planLanguage: zh-TW
draft-hash: 54068fbe3716fe967d95deb01737695e762b563e7f1ce7aedcaa2adb71cd804c
rendered-source-hash: cf7004b6e6697978af723e5bbc4f6b875ea512dbd031ced84ece1f08e971fc87
prompt-hash: 43aa84a930fcfc30b65dcf5024808c7661a737fd3b74939edbc157b0e14b441d
equivalence-verdict: EQUIVALENT
-->

# Plan: APA 7 reference list and per-rule source attribution

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

寫作規則參考的每一個外部來源，都以 APA 7 格式列在 `docs/references.md`，且只列一次。每份維護中的規則檔都寫明哪些規則出自哪個來源，哪些是專案自訂。讀者能像讀論文或書一樣，從任一條規則追到它的依據。

### Why

以下是 2026-10-08 在本儲存庫蒐集的證據：

| 觀察 | 位置 |
| --- | --- |
| 全 repo 唯一點名的外部來源是 ISO 24495-1 和 ASD-STE100，兩者都沒有版次、年份、出版者或 URL。 | `README.md:13`、`README.md:113`、`README.md:213`、`references/accuracy.md:15`、`references/en-US.md:9` |
| 沒有任何檔案、分支或 commit（共 66 個，含所有 ref）引用「公用文作成の考え方」或文化廳。 | `git log --all -S"公用文"` 沒有結果 |
| ja-JP 的常體規則寫明是專案自訂，不是日文通則。 | `docs/writing-checks.md:36`、`references/ja-JP.md` |
| 鎖定版本的第三方檢查器會影響規則行為，但沒有被列為來源。 | `writing/package.json` |

### Decisions already made by the owner

- 引用格式採 APA 7（擁有者 2026-10-08 決定）。
- 來源寫法比照論文或書籍：完整、可查證，並能從每條規則追溯。
- 本計畫不修改 ja-JP 的文體規則。ja-JP 的 `Sources` 一節把常體規則列為專案自訂。本計畫不引用文化審議會（2022）「公用文作成の考え方」。之後另開計畫讓規則對齊這份指引，屆時再加入引用。

## Requirements

- [ ] R-01 `docs/references.md` 是唯一的參考文獻清單。條目依 APA 7 撰寫，依第一作者排序。每筆有固定代號（例如 `[ISO2023]`）、完整的 APA 7 書目、有的話附 URL 或 DOI。內容可能變動的網頁要附查閱日期。
- [ ] R-02 清單分兩組：標準與指引、軟體。由 `writing/package.json` 管理的軟體要引用確切鎖定版本。repo 沒有鎖定的 host-provided 軟體（包括 zhtw-mcp）只引用 repository URL 與查閱日期，不得自行宣稱版本。
- [ ] R-03 引用代號在兩個方向都能對上。規則檔引用的每個代號都在 `docs/references.md` 裡，清單裡的每筆條目也至少被一個規則檔引用。清單本身不重複列出哪些檔案使用了該條目。
- [ ] R-04 `skills/coding-agent-writing/references/` 下每份維護中的規則檔，結尾加一節 `Sources`，用該檔案的語言撰寫。這一節把規則對應到代號，並列出專案自訂的規則。這一節以上的規則文字不改動。
- [ ] R-05 每節 `Sources` 用絕對網址 `https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md` 連到清單，不用相對連結。同一份檔案會被複製到 `web-skills/`、OKF 套件和 Claude output style，在這些地方相對路徑無法解析。
- [ ] R-06 `references/accuracy.md` 的常駐指令摘要不放任何代號。產生的 ChatGPT、Gemini 指示區塊和 agents 指令區塊內的文字維持不變。
- [ ] R-07 `README.md` 的英文、繁中、日文段落各加一句話，連到 `docs/references.md`。清單本身在 repo 裡只出現一次。
- [ ] R-08 實作當天逐筆查證：開啟每筆條目的 URL 或目錄頁。版次、年份或出版者無法確認的條目不加入，改為回報。
- [ ] R-09 產生的投影檔（`web-skills/`、`knowledge/`、`web-instructions/`、`install/agents-block.md`、`output-styles/`）用既有的產生器重新產生，不手動編輯。
- [ ] R-10 專案自訂的主張維持「專案選擇」的寫法。引用來源不得暗示本 repo 符合或通過某項標準的認證。
- [ ] R-11 `docs/references.md` 通過既有的 en-US 文件 lint。含破折號或分號的正式標題寫成連結文字，`prose-punctuation` 規則本來就會略過連結，因此標題可以原樣引用。
- [ ] R-12 speak-human-tw 作為啟發來源引用，不寫成規則出處，只對應 2026-09-29 加入的兩條規則：必須保留原樣的項目新增網址和引文（`references/accuracy.md`），以及放寬列表與版面規則（`references/accuracy.md`、`references/zh-TW.md`）。`Sources` 的英文寫「informed by」，繁中寫「受其啟發」。引用版本為 2026-09-28 的 commit `e180f0a`。

### 已鎖定的來源對應表

引用代號只用 ASCII 字母與數字。標準或指引使用正規化名稱加出版年份；鎖定版軟體使用產品名加上移除標點的完整版本數字；commit-pinned 指引使用 repository 名稱加年份；沒有鎖定版本的 host 軟體只使用 repository 名稱。

| 引用代號 | 規則檔與主張 | 關係 |
| --- | --- | --- |
| `[ISO2023]` | `accuracy.md`：plain language 的讀者結果 | 由標準推導。準確性優先、非合規措辭與安全限制仍為專案自訂。 |
| `[ASDSTE1002025]` | `en-US.md`：選用的短句與先寫條件指引 | 由指引推導。有限採用、排除字彙規範及不宣稱合規仍為專案自訂。 |
| `[SpeakHumanTW2026]` | `accuracy.md`：保護 URL 與引文；`accuracy.md`、`zh-TW.md`：彈性列表、表格與版面 | 受 2026-09-28 commit `e180f0a` 啟發。沒有複製文字，最終範圍仍為專案自訂。 |
| `[Textlint1580]` | `local-checks.md`：textlint profile、CLI、MCP、`lintText` 與 `lintFile` 的軟體行為 | 只歸因軟體行為；repository workflow 仍為專案自訂。 |
| `[TextlintRulePresetJaTechnicalWriting1202]` | `local-checks.md`：鎖定版日文技術寫作 preset 行為 | 只歸因軟體行為。 |
| `[TextlintRuleWriteGood200]` | `local-checks.md`：鎖定版 write-good 規則行為 | 只歸因軟體行為。 |
| `[TextlintRuleNoZeroWidthSpaces101]` | `local-checks.md`：鎖定版 zero-width-space 規則行為 | 只歸因軟體行為。 |
| `[ZhtwMCP]` | `zhtw-checks.md`：host-provided schema 與 capabilities | 依 repository URL 與查閱日期歸因軟體行為，不宣稱版本；workflow 與安全規則仍為專案自訂。 |

其他現有內容皆為專案自訂：`accuracy.md` 的事實／推論、情態強度、不確定性、部分成功、單句單意、條件優先、行為者、程序與描述、標點、意思檢查與例子；目前 `ja-JP.md` 的全部內容；以及 `en-US.md`、`zh-TW.md`、`local-checks.md`、`zhtw-checks.md` 的其餘內容。本計畫不新增 `[Bunka2022]`，該引用由獨立的報告文體計畫負責。只有明確、由擁有者確認或有 repository 紀錄的影響才能加上 attribution；文字相似本身不構成歸因。

## Diagrams

```text
docs/references.md  (APA 7 list, keys only)
        ^                                   ^
        | absolute URL + key                | relative link
skills/coding-agent-writing/                README.md (en / zh-TW / ja)
  references/*.md  -> "Sources" section
        |
        | existing generators (verbatim copy or embed)
        +--> web-skills/web-answer-writing/references/*.md
        +--> knowledge/rules/*.md, knowledge/checks/*.md   (okf.cjs passes absolute URLs through)
        +--> output-styles/clear-writing-kit.md
        +--> web-instructions/*.md, install/agents-block.md (excerpt only, unchanged text)
```

## Files to Create or Modify

- `docs/references.md` — 新的 APA 7 參考文獻清單。
- `skills/coding-agent-writing/references/accuracy.md` — 在指令摘要之外加 `Sources` 一節。
- `skills/coding-agent-writing/references/en-US.md` — 加 `Sources` 一節。
- `skills/coding-agent-writing/references/ja-JP.md` — 用日文加 `Sources` 一節。
- `skills/coding-agent-writing/references/zh-TW.md` — 用繁中加 `Sources` 一節。
- `skills/coding-agent-writing/references/local-checks.md` — 為檢查器軟體加 `Sources` 一節。
- `skills/coding-agent-writing/references/zhtw-checks.md` — 為 zhtw-mcp 加 `Sources` 一節。
- `tests/test_artifacts.py` — 加入引用交叉檢查測試。
- `README.md` — 每個語言段落各加一句連結。
- 產生的輸出 — 只重新產生。

## Test Cases

- 交叉引用：`skills/coding-agent-writing/references/*.md` 中每個 `[Key]` 都能在 `docs/references.md` 找到，每筆條目至少被引用一次。缺代號或有條目沒被引用時，測試失敗。
- 摘要穩定：`<!-- instructions:begin -->` 與 `<!-- instructions:end -->` 之間的摘要不含 `[Key]` 樣式。`web-instructions/chatgpt.md`、`web-instructions/gemini.md` 的程式碼區塊文字，以及 `install/agents-block.md` 的內文，都與修改前相同。stamp 行不比對，因為它的雜湊值涵蓋整份參考檔。
- 連結形式：每節 `Sources` 都連到清單的絕對網址，且不含指向 `docs/` 的相對連結。
- 投影：`node writing/okf.cjs --check`、既有產生器檢查與 `python -m unittest discover -s tests -v` 通過。
- Lint：`npm --prefix writing run lint` 與 `npm --prefix writing test` 通過。

## Success Criteria

- 不論在 repo、web skill 複本、OKF 套件或 output style，讀者打開任一規則檔，找到 `Sources` 一節，點一次連結就能看到完整的 APA 7 條目。
- `docs/references.md` 每筆條目都在實作當天對照來源查證過。
- 沒有任何規則改變意思。每份規則檔在 `Sources` 一節以上的差異為空。

## Risks

- 需付費的標準（ISO 24495-1、ASD-STE100）只能從目錄頁查證，無法看全文。條目引用目錄頁，並寫明頁面上顯示的版次。
- 絕對網址指向公開 repo 的 `main` 分支。repo 改名或改為私人時，複製出去的檔案裡的連結會失效。交叉引用測試偵測不到這種情況。
- 只為了看起來權威而列的來源會降低清單的可信度。只加入實際影響過規則的來源。

## Open Questions

None

## Approach

### Step 1: Collect and verify sources

- **Files**: 不寫入檔案。
- **What**: 依 repo 證據和擁有者對 OQ-02 的回答建立候選清單。擁有者 2026-09-27 至 09-28 評估過但沒有採用的來源不引用：humanizer、Humanizer-zh、taste-skill、Vale、Pangu。repo 內都找不到它們的痕跡。前身 `accurate-answer` skill 是本 repo 自己的歷史，記錄在 `docs/rule-migration.md`，不算外部來源。候選：speak-human-tw（擁有者決定，只作為啟發來源引用）、ISO 24495-1、ASD-STE100、textlint 15.8.0、textlint-rule-preset-ja-technical-writing 12.0.2、textlint-rule-write-good 2.0.0、textlint-rule-no-zero-width-spaces 1.0.1、zhtw-mcp。逐一開啟目錄頁或專案頁，記錄版次、年份、出版者和 URL。
- **Verify**: 每個候選都有查證紀錄，或被回報為無法查證。

### Step 2: Write the reference list

- **Files**: `docs/references.md`
- **What**: 撰寫含代號的 APA 7 條目，先列標準與指引，再列軟體。
- **Verify**: 對照 APA Style 官方書目範例人工檢查。`npm --prefix writing run lint` 通過。

### Step 3: Add Sources sections and the cross-reference test

- **Files**: `skills/coding-agent-writing/references/*.md`、`tests/test_artifacts.py`
- **What**: 在結尾加附絕對連結的 `Sources` 一節。指令摘要不放代號。加入交叉引用與連結形式測試。
- **Verify**: 新測試通過。每份檔案 `Sources` 一節以上的差異為空。

### Step 4: Link from README and regenerate projections

- **Files**: `README.md`、產生的輸出。
- **What**: 每個語言段落加一句連結。執行既有產生器。
- **Verify**: Test Cases 列出的指令全部通過，摘要穩定比對成立。

## Review Results

### Architecture Review

結論：APPROVE。下列修正已套用到本計畫。

2026-10-08 依 `golem-architect.agent.md` 在本次對話中審查。

改變計畫的發現：

| 發現 | 證據 | 修正 |
| --- | --- | --- |
| 規則檔用相對連結指向 `docs/references.md`，會讓 OKF 產生失敗。`okf.cjs` 遇到沒有 OKF 條目的相對連結會丟出 `Unmapped link`。 | `writing/okf.cjs` `render()` | R-05 改用絕對網址。`okf.cjs` 對 `scheme:` 連結原樣保留。 |
| 同一個相對連結在 `web-skills/` 複本和 Claude output style 裡也會失效，因為這些檔案會離開 repo。 | `scripts/artifacts.py` `render_web()`、`render_claude()` | 同上。repo 是公開的，絕對網址可以開啟。 |
| 原本「web 指示逐位元組相同」的測試一定失敗。stamp 行雜湊整份共用參考檔，而本計畫會修改這些檔案。 | `scripts/artifacts.py` `digest()` | Test Cases 改為比對指示區塊文字，排除 stamp 行。 |
| ISO 24495-1 等 APA 標題含破折號。`prose-punctuation` 規則會回報連結以外的破折號。 | `writing/rules/prose-punctuation/index.cjs` | R-11 把原樣標題放在連結文字。 |
| 清單裡的「Used by」與各節 `Sources` 重複，日後會不一致。 | 極簡階梯：可由現有資料推導 | 移除。改由 R-03 和交叉引用測試保證對應關係。 |

取捨摘要：

| 選擇 | 得到 | 代價 | 判定 |
| --- | --- | --- | --- |
| `Sources` 用絕對網址 | 每個複本都能開啟 | 依賴 repo 名稱與公開狀態 | OK |
| web skill 複本保留 `Sources` | 不必修改產生器 | 上傳檔案略大 | OK |
| 用一個 Python 測試，不另寫檢查器 | 沿用既有測試套件 | 只在 CI 和本機執行 | OK |

沒有安全面的影響。本變更只新增文件和一個測試，不寫入使用者設定。

來源歸因邊界也已鎖定：只引用明確、由擁有者確認或有 repository 紀錄的影響；ISO 與 ASD 標為「由其推導」，speak-human-tw 只標為「受其啟發」；目前 ja-JP 內容仍是專案自訂；套件引用只證明軟體行為，不是規則文字權威；未鎖定的 zhtw-mcp 不得自行宣稱版本。這些決定已寫入「已鎖定的來源對應表」，實作時不需再作 attribution 判斷。

<!-- ARCH_REVIEW: CLEAR -->

### Resolved Questions

| Question | Closed by | Decision | Rationale |
| --- | --- | --- | --- |
| ja-JP 規則與「公用文作成の考え方」 | Human（擁有者，2026-10-08） | 本計畫不引用這份指引，另開計畫對齊規則。 | 引用現行規則沒有遵循的來源，會誤導讀者對規則依據的理解。 |
| `docs/references.md` 要不要成為 OKF 節點？ | Architect，class A | 不要。規則檔以絕對網址連結，OKF 不需要新條目。 | 加節點要新增 `okf.cjs` 條目與索引文字，而這次需求沒有提出檢索上的需要。 |
| 上傳上限是否需要從 web skill 複本移除 `Sources`？ | Architect，class F | 不需要。產生器的字數上限只套用在指令摘要。 | `render_web()` 原樣複製參考檔，只對 ChatGPT、Gemini 區塊設上限。每節 `Sources` 都很短。 |
| 是否引用 speak-human-tw？ | Human（擁有者，2026-10-08） | 引用，只作為兩條規則的啟發來源。 | 沒有照搬文字。這兩條規則在擁有者討論建議部分吸收的隔天出現，擁有者也記得很可能參考過。 |

### Documentation Structure Review (steward)

通過。計畫位於 `.dev/plans/docs-apa-references.md`，英文草稿位於 `.dev/plans/docs-apa-references.en.md`。它是三份 active source plans 之一，且不與兩份日文計畫重複。必要章節齊全。圖與 `scripts/artifacts.py`、`writing/okf.cjs` 的五項工作投影路徑一致。沒有殘留舊專案名稱。

### Business Review

未要求。本變更不涉及商業規則、定價、權限或新手引導。

### Design Review

未要求。本變更沒有使用者介面。

### Engineering Review

CLEAR。Structural-atomicity review 已核准五項工作：T-01 負責唯一引用契約與已鎖定來源對應表，T-02 至 T-05 各自負責一個 delivery family。Tester review 已核准 TP-01 至 TP-07，證據涵蓋雙向引用、live metadata、README occurrence、projection body、generators、allowlist 與 authoritative suites。沒有剩餘的實作判斷、未解依賴或 verification-only task。

<!-- ENG_REVIEW: CLEAR -->

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | integration | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_contract -v`。要求雙向代號與使用者、已鎖定的來源對應、絕對連結、只對 `writing/package.json` 軟體要求確切版本、不得虛構 zhtw-mcp 版本、常駐指令摘要不含代號，以及每份規則檔在 `Sources` 以上的前綴不變。專案自訂主張必須維持專案選擇，不得暗示合規或認證；`[SpeakHumanTW2026]` 必須使用 commit `e180f0a`，且只能寫「informed by」或「受其啟發」。另要求 executor terminal 記錄為 `completed`，且 `.dev/plans/docs-apa-references.prompt.md` 有相符的 T-01 write-back 子節。 | T-01 |
| TP-02 | manual | Why manual: 線上目錄頁與專案頁沒有穩定的本機 oracle。逐筆記錄已確認 metadata，並以適用的 APA 7 example 檢查最終條目。要求兩個規劃分組、各組依第一作者排序、可變網頁附查閱日期；任何無法確認的項目必須省略並寫入 task write-back。逐項依 R-10、R-12 檢查：不得暗示合規或認證，speak-human-tw 只能以 commit `e180f0a` 的啟發來源出現。要求 terminal 記錄為 `completed`，且 `.dev/plans/docs-apa-references.prompt.md` 有 T-01 子節。 | T-01 |
| TP-03 | documentation | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_readme_languages_have_equal_commands_and_local_links -v`、`rg -o -n "docs/references\\.md" README.md`、`rg -n -e "^#{1,6} References$" -e "^#{1,6} 參考文獻$" -e "^#{1,6} 参考文献$" -e "^\\[[A-Za-z]+[0-9]{4}\\]" README.md` 與 `cmd.exe /d /c npm --prefix writing run lint`。第一個 `rg` 必須正好有三個 occurrences；第二個 `rg` 必須無輸出並以預期的 1 結束；三個語言段落的連結均可用，測試與 lint 均通過。另要求 terminal 記錄為 `completed`，且 `.dev/plans/docs-apa-references.prompt.md` 有 T-02 子節。 | T-02 |
| TP-04 | documentation | 執行 `python scripts/generate-web-artifacts.py --check` 與預定的聚焦測試 `python -m unittest tests.test_artifacts.Artifacts.test_reference_citation_projections -v`。聚焦測試必須掃描全部七個 render outputs、移除 generated stamp 行後比較 ChatGPT 與 Gemini 指示內文並要求差異為空、只對四份複製的 reference files 要求絕對參考文獻網址，且不對 skill 或兩份 instruction files 要求該網址。另要求 terminal 記錄為 `completed`，且 `.dev/plans/docs-apa-references.prompt.md` 有 T-03 子節。 | T-03 |
| TP-05 | integration | 執行 `cmd.exe /d /c npm --prefix writing run okf:check`。六份來源派生 concept 必須最新，且沒有 unmapped、相對 `docs/` 或未預期的 knowledge 檔案。另要求 terminal 記錄為 `completed`，且 prompt 有 T-04 write-back 子節。 | T-04 |
| TP-06 | documentation | 執行 `python scripts/generate-output-style.py --output output-styles/clear-writing-kit.md --check`。要求內容完全等於產生器結果，且內嵌參考文獻 URL 都是絕對網址。另要求 terminal 記錄為 `completed`，且 prompt 有 T-05 write-back 子節。 | T-05 |
| TP-07 | integration | 執行 `cmd.exe /d /c npm --prefix writing test`、`python -m unittest discover -s tests -v`、`cmd.exe /d /c npm --prefix writing run lint`、`python scripts/generate-agents-block.py --output install/agents-block.md --check` 與 `git diff --name-only -- web-skills knowledge web-instructions install output-styles`。要求四份通過摘要，且 generated-path diff 只能出現 T-03 至 T-05 宣告的檔案。要求 terminal 記錄為 `completed`，且 `.dev/plans/docs-apa-references.prompt.md` 有 T-01 與 T-04 子節。 | T-01, T-04 |

## Tasks

- [ ] T-01 — 建立唯一的 APA 7 引用契約。
  - **Files**: `docs/references.md`, `skills/coding-agent-writing/references/accuracy.md`, `skills/coding-agent-writing/references/en-US.md`, `skills/coding-agent-writing/references/ja-JP.md`, `skills/coding-agent-writing/references/zh-TW.md`, `skills/coding-agent-writing/references/local-checks.md`, `skills/coding-agent-writing/references/zhtw-checks.md`, `tests/test_artifacts.py`.
  - **Change**: 逐筆對照線上頁面查證候選來源，建立唯一且含代號的 APA 7 清單，依「已鎖定的來源對應表」實作且不得再作 attribution 判斷，在各規則檔附加符合其語言的 `Sources` 對應與指定絕對網址，並新增雙向代號、使用者、連結形式、歸因、指示摘要穩定性與 generated projection 測試（`test_reference_citation_contract`、`test_reference_citation_projections`）。每個新 `Sources` 章節以上的規則文字必須保持不變，引用代號不得進入常駐指令摘要。沿用既有 artifact 測試模組，不新增相依套件或平行引用資料庫。影響範圍：8 個檔案。
  - **Acceptance**: TP-01 與 TP-02 通過，包含 R-01、R-02、R-10、R-12。每個新 `Sources` 標題以上的差異為空，每筆已確認條目都有唯一固定代號和至少一個使用者，無法確認的條目已省略並回報。executor log 以 `completed` 結束，且測試摘要記錄在 `.dev/plans/docs-apa-references.prompt.md` 的 T-01 下。
- [ ] T-02 — 在 README 的每個語言段落加入參考文獻連結。
  - **Files**: `README.md`.
  - **Change**: 在英文、繁體中文和日文概覽各加入一句語意相同的連結。參考文獻清單只保留在既有唯一檔案，並沿用既有三語段落結構。影響範圍：1 個檔案。
  - **Acceptance**: TP-03 通過。每個語言段落各有一個指向唯一參考文獻清單的相對連結，repo 沒有重複清單。executor log 以 `completed` 結束並記錄三個相符行。
- [ ] T-03 — 從維護來源重新產生 Web 交付檔案群組。
  - **Files**: `web-skills/web-answer-writing/SKILL.md`, `web-skills/web-answer-writing/references/accuracy.md`, `web-skills/web-answer-writing/references/en-US.md`, `web-skills/web-answer-writing/references/ja-JP.md`, `web-skills/web-answer-writing/references/zh-TW.md`, `web-instructions/chatgpt.md`, `web-instructions/gemini.md`.
  - **Change**: 在 T-01 後執行既有 Web artifact 產生器。只接受產生器擁有的變更，也就是複製的 `Sources` 章節與來源雜湊 stamp。指示區塊必須保持不變。不得手動編輯產生檔。影響範圍：7 個檔案。
  - **Acceptance**: TP-04 通過。提交檔案等於 `render_web()` 的結果，排除 stamp 後的指示區塊差異為空，每個複製的 `Sources` URL 都是絕對網址。executor log 以 `completed` 結束並記錄檢查摘要。
- [ ] T-04 — 重新產生由來源派生的 OKF concepts。
  - **Files**: `knowledge/rules/accuracy.md`, `knowledge/rules/en-US.md`, `knowledge/rules/ja-JP.md`, `knowledge/rules/zh-TW.md`, `knowledge/checks/local-checks.md`, `knowledge/checks/zhtw-checks.md`.
  - **Change**: 在 T-01 後執行既有 OKF 產生器，只提交六份由已修改規則檔派生的 concept。沿用現有 `scheme:` pass-through 保留絕對外部連結，不新增參考文獻清單 OKF node。影響範圍：6 個檔案。
  - **Acceptance**: TP-05 通過。產生的 concept 與 `writing/okf.cjs` 一致，不含 unmapped link 或指向 `docs/` 的相對連結，也沒有未預期的 concept。executor log 以 `completed` 結束並記錄 OKF 摘要。
- [ ] T-05 — 重新產生 Claude Code output style。
  - **Files**: `output-styles/clear-writing-kit.md`.
  - **Change**: 在 T-01 後執行既有 output-style 產生器，讓內嵌的維護中參考檔含有新的 `Sources` 章節。不得手動編輯產生檔。影響範圍：1 個檔案。
  - **Acceptance**: TP-06 通過。提交的 output style 等於 `render_claude()`，每個參考文獻清單連結都是絕對網址。executor log 以 `completed` 結束並記錄產生器摘要。
