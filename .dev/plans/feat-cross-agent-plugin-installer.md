<!-- gal:planning-authority
semantic-draft: .dev/plans/feat-cross-agent-plugin-installer.en.md
planLanguage: zh-TW
draft-hash: 263db406a775dd9550735d6b73bac82ffb3bb4d4a457c48e25a97ab54e37ad5d
rendered-source-hash: 0793c7279785b1b81a4d4cb10df86fbc1d1f6ff0a35d145142041d86189834df
prompt-hash: 3d69326f0d9e0d97a09070465dee45917a6173c15fc3e6ea4cac8e845c70f218
equivalence-verdict: EQUIVALENT
-->

# Plan: Cross-agent plugin installer for clear-writing-kit

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

任何支援的 coding agent 都能讀一份 prompt 檔、執行一支 TypeScript 安裝程式，替自己裝好完整的 clear-writing-kit。裝完後，該工具會有 `coding-agent-writing` skill、可運作的 textlint MCP server，以及全域指令檔裡一段簡短的標記區塊。Claude Code 另外會選用 `clear-writing-kit` output style。不論有沒有 ccync 這類設定管理工具，安裝程式的行為都一樣。

### Why

Codex 目前無法完整使用這套工具。以下是 2026-10-01 在擁有者電腦上蒐集的證據：

| 觀察 | 位置 |
| --- | --- |
| Codex 全域指令裡的寫作區塊由 ccync 管理，指向舊的 `accurate-answer` skill，沒有 textlint 流程 | `~/.codex/AGENTS.md`（2,669 bytes） |
| ccync 仍登記 `C:/Code/accurate-answer` 為來源。儲存庫改名後，這個路徑已不存在 | `~/.ccync/plugins.json` |
| `~/.agents/skills/accurate-answer` 連到舊的單檔 skill。Codex 沒有安裝 `coding-agent-writing` | `~/.agents/skills/` |
| 所有工具都沒有 textlint MCP server。`zhtw-mcp` 已登記 | `~/.codex/config.toml` |
| Claude Code 仍選用舊樣式 | `~/.claude/settings.json` `outputStyle: accurate-answer` |
| README 寫明本儲存庫不修改全域 agent 設定 | `README.md` |

### Decisions already made by the owner

- 安裝程式和打包後的檢查程式都用 TypeScript 撰寫。
- 安裝程式不對 ccync 或任何管理工具做特殊處理。它附加自己的標記區塊，重跑時只替換這個區塊。精簡與最佳化指令檔是管理工具的工作。
- 對支援 plugin 的工具，這套工具以 plugin 形式安裝。plugin 無法修改全域指令檔，所以安裝程式也會修改各工具的全域指令檔。
- 安裝程式在 Claude Code 內執行時，自動安裝並選用 output style。原本的 `outputStyle` 不論是什麼值，都先備份再覆蓋，`plan` 的差異會顯示原本的值。
- 檢查程式必須能在 Node、Deno 或 Bun 上執行。第 1 版不提供編譯好的執行檔。三者都沒有的電腦，`INSTALL.md` 會停下來，請使用者先安裝其中一個。
- 工具身分由 agent 自己回報。環境變數只用來交叉比對。

## Requirements

### Commands and safety

- [ ] R-01 `cwk install plan` 只讀不寫。它回報發出請求的工具、電腦上找到的所有工具、可用的執行環境、各目標的狀態、衝突清單，以及它會修改的每個檔案、區塊、MCP 項目和設定，並附上差異。最後輸出一個 plan hash。
- [ ] R-02 工具身分以 `--agent` 為準。安裝程式用完整的環境變數名稱交叉比對，不用前綴。結果不一致時停止並說明。證據：Claude Code 會設定 `CLAUDECODE`；在這台電腦上，Codex plugin 也會設定 `CODEX_COMPANION_SESSION_ID`。
- [ ] R-03 `cwk install apply` 必須帶 `plan` 產生的 `--plan-hash`。它會重新計算計畫，hash 不同就停止，不寫入任何東西。hash 涵蓋安裝程式版本、payload 摘要值和正規化後的目標狀態，不含時間戳記和備份路徑。
- [ ] R-04 `apply` 中途有步驟失敗時，安裝程式停止，並回報失敗的步驟和輸出。已完成的步驟仍記錄在 manifest。因為 `plan` 依目前狀態計算，重跑 `plan` 和 `apply` 只會處理剩下的步驟。不另外保存續跑狀態。
- [ ] R-05 每次寫檔都先寫到同目錄的暫存檔，再用改名取代目標檔。安裝程式保留目標檔的換行格式、BOM 和結尾換行。檔案被鎖住而改名失敗時，先重試，再以含檔案路徑的錯誤結束。
- [ ] R-06 安裝程式不印出也不記錄工具設定檔的內容。差異只顯示自己的區塊和自己的項目。它只解析需要的欄位。

### What is installed

- [ ] R-07 `apply` 把 payload 複製到 `~/.clear-writing-kit/<version>/`。payload 是 Step 1 驗證後選定的 `dist/` 目錄。啟動檔 `~/.clear-writing-kit/cwk.mjs` 負責載入目前使用的版本。MCP 項目和指令區塊都指向這個啟動檔，不指向 repo 的 clone 或工具的 plugin 快取。用啟動檔取代 `current` 符號連結，原因是在 Windows 建立目錄符號連結需要開發人員模式或系統管理員權限。
- [ ] R-08 skill 透過工具的 plugin 機制安裝。已驗證的工具若不支援以 plugin 提供 skill，安裝程式改為把 skill 複製到該工具的 skill 目錄。`web-skills/` 永遠不安裝。
- [ ] R-09 textlint MCP server 命名為 `clear-writing-kit-textlint`。每個工具只登記一次，透過該工具自己的 CLI 登記，plugin 不宣告它。執行環境依序選用：Node >= 20.18、Deno >= 2、Bun。安裝程式本身就是在其中一個上執行，所以至少一定有一個。
- [ ] R-10 MCP server 只提供一個工具 `lintText`，參數為 `text`、`language`（`en-US`、`zh-TW`、`ja-JP`）、`genre`（`document`、`conversation`），以及選擇剖析器用的選填 `filename`。每個 profile 在第一次使用時載入，之後在程序內快取。server 沒有讀檔或自動修正的工具。
- [ ] R-11 指令區塊用 `<!-- clear-writing-kit:begin v=<version> -->` 和 `<!-- clear-writing-kit:end -->` 包住。區塊小於 2 KB，各工具內容相同。區塊寫明 skill 名稱、`lintText` 工具，以及 MCP 工具不存在時的備用指令 `<runtime> <home>/.clear-writing-kit/cwk.mjs check`。區塊要求 agent 把 `<home>` 換成使用者的家目錄，因為 cmd.exe 不會展開 `~`。重跑時只替換這個區塊，標記以外的內容一律不動。
- [ ] R-12 在 Claude Code 內，plugin 提供 `clear-writing-kit` output style，安裝程式設定 `~/.claude/settings.json` 的 `outputStyle`。不論原本是什麼值都會覆蓋。`plan` 的差異會顯示原本的值。其他欄位保持不變，修改前先備份。

### Hosts

- [ ] R-13 工具要先通過 Step 2 的調查，以及完整的測試循環（`apply`、重跑無差異、`verify`、`uninstall`），才算支援。每個工具的紀錄都有已驗證旗標。在未驗證的工具上，`plan` 列出手動步驟，`apply` 拒絕執行。

### Verification, conflicts, and removal

- [ ] R-14 `cwk install verify` 啟動已登記的 MCP 指令，對每種語言各呼叫一次 `lintText`，用的測試文字必須產生至少一項結果。在 Claude Code 內，它會重新讀取 `outputStyle`。它也檢查區塊大小。任何一項失敗或沒執行，結果都是「未完成」，不會是「通過」。
- [ ] R-15 `plan` 和 `verify` 回報舊版衝突：`accurate-answer` skill、提到 `accurate-answer` 的指令區塊，以及舊的 `outputStyle`。安裝程式不刪除它們。只要重複的寫作 skill 仍在，`verify` 就回報「未完成」。
- [ ] R-16 manifest `~/.clear-writing-kit/install-manifest.json` 記錄每次寫檔的 SHA-256 雜湊值。經由 CLI 建立的項目，記錄工具、類型、名稱和指令指紋。
- [ ] R-17 `cwk install uninstall` 只在雜湊值與 manifest 相符時移除檔案。經由 CLI 建立的項目，只在目前的設定與指紋相符時，才用工具的移除指令移除。舊版本的 payload 目錄也只在雜湊值相符時移除。不相符的項目一律回報並保留。
- [ ] R-18 升級就是用新版本正常執行 `plan` 和 `apply`。它會重新登記 MCP 項目，依 `v=` 標記替換區塊，並改寫啟動檔，讓它載入新版本。

### Agent prompt and docs

- [ ] R-19 `INSTALL.md` 先指示 agent 檢查有沒有 `node`、`deno`、`bun`。三者都沒有時，agent 停下來，請使用者安裝其中一個，並附上官方安裝頁面的網址。agent 不自行安裝執行環境。有執行環境時，`INSTALL.md` 指示 agent：執行 `plan`、把結果給使用者看、等待確認、帶 plan hash 執行 `apply`、執行 `verify`，並分開回報通過與失敗的步驟。它禁止 agent 直接修改工具的設定檔。
- [ ] R-20 README 和文件說明安裝程式，並移除「本儲存庫不修改全域 agent 設定」的敘述。

## Diagrams

```text
使用者：「安裝 clear-writing-kit」
  │
  ▼
agent 讀 INSTALL.md
  │
  ├─ 沒有 node、deno、bun ──► 停止，請使用者先安裝
  ▼
cwk install plan --agent <工具>          （只讀；依序選執行環境 node → deno → bun）
  ├─ --agent 與環境變數不一致 ──► 停止並回報
  ├─ 工具未驗證 ──► 列出手動步驟，不輸出 plan hash
  └─ 已驗證 ──► 差異 + 衝突 + plan hash
                  │
                  ▼
           agent 顯示結果 ──► 使用者確認？
                                ├─ 否 ──► 停止
                                └─ 是
                                     │
                                     ▼
                 cwk install apply --agent <工具> --plan-hash <h>
                   ├─ 重算的 hash 不同 ──► 停止，不寫入
                   ├─ 某步驟失敗 ──► 停止並回報；重跑 plan 只涵蓋剩下的步驟
                   └─ 步驟：
                        ├─ 1 複製 payload 到 ~/.clear-writing-kit/<version>/，改寫啟動檔
                        ├─ 2 用工具的 CLI 安裝 plugin（工具不支援 plugin skill 時才複製 skill）
                        ├─ 3 用工具的 CLI，以計畫選定的執行環境登記 clear-writing-kit-textlint
                        ├─ 4 替換或附加自己的區塊（原子寫入，保留換行格式和 BOM）
                        └─ 5 只限 Claude：settings.outputStyle
                        （每完成一個步驟就立即記錄到 manifest：
                         檔案雜湊值、CLI 指紋）
                             │
                             ▼
                 cwk install verify
                   ├─ 啟動 MCP，每種語言呼叫 lintText，預期有結果
                   ├─ 重讀 outputStyle、區塊大小、衝突
                   └─ 任一項未通過 ──► 「未完成」
```

```text
變更後的儲存庫結構（新增項目標 +）

clear-writing-kit/
├─ + INSTALL.md
├─ + .claude-plugin/plugin.json, marketplace.json   skill + output style
├─ + .codex-plugin/plugin.json（+ 本機 marketplace 項目）
├─ + <通過 Step 2 的其他工具設定檔>
├─ + output-styles/clear-writing-kit.md        產生後 commit
├─ + install/agents-block.md                   產生後 commit
├─ + src/（TypeScript：cli、install/*、hosts.ts、rules.ts、check、mcp）
├─ + dist/cwk.mjs（+ 依 Step 1 結果的 dict/ 或精簡模組）   建置後 commit
├─   writing/profiles/, writing/rules/         規則來源，不變
├─   skills/coding-agent-writing/              不變，仍是規則來源
└─   web-skills/                               永不安裝

安裝到電腦上的結構

~/.clear-writing-kit/
├─ <version>/  dist/ 的複本
├─ cwk.mjs     載入目前版本的啟動檔
├─ install-manifest.json
└─ backups/<timestamp>/
```

## Files to Create or Modify

- `INSTALL.md` — 給 agent 讀的安裝 prompt。
- `.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` — Claude Code plugin，含 skill 和 output style，不宣告 MCP。
- `.codex-plugin/plugin.json` 與本機 marketplace 項目 — Codex plugin，含 skill。
- 其他工具的設定檔 — 只為通過 Step 2 的工具建立。
- `src/hosts.ts` — 有型別的工具表：路徑、CLI 指令、plugin 支援、已驗證旗標、證據來源。
- `src/cli.ts`、`src/install/*.ts` — `plan`、`apply`、`verify`、`uninstall`、原子寫入、manifest、執行環境選擇、Windows 指令啟動。
- `src/check.ts`、`src/rules.ts`、`src/mcp.ts` — 在同一個程序內執行、用靜態規則對應表建立並快取 profile 的 textlint，以及建立在 `@modelcontextprotocol/server` 上、只有一個工具的 MCP server。
- `dist/` — 依 Step 1 選定、commit 進 repo 的建置結果。
- `install/agents-block.md` — 產生出來的指令區塊。
- `output-styles/clear-writing-kit.md` — 產生出來的 output style。
- `scripts/generate-output-style.py` — 預設輸出改為 repo 的 `output-styles/`。除非用 `--output` 指定，否則不再寫入 `~/.claude`。
- `scripts/artifacts.py`、`scripts/generate-agents-block.py` — 產生指令區塊，並用 `--check` 檢查。
- `writing/package.json` — 把 `esbuild` 和 `@modelcontextprotocol/server` 固定版本並列為直接相依套件，新增建置與測試指令。
- `README.md`、`docs/verification.md` — 安裝與驗證文件。`knowledge/` 由 `SKILL.md` 產生，本計畫不修改 `SKILL.md`。
- `tests/` — 新產生檔案的 Python 測試。

## Test Cases

- 在 Claude Code 內執行 `plan --agent claude` → 工具為 `claude`，沒有不一致。即使設了 `CODEX_COMPANION_SESSION_ID` 也一樣。
- 在 Claude Code 內執行 `plan --agent codex` → 不一致，結束碼非零，不輸出 plan hash。
- 在沒有變動的測試用家目錄執行兩次 `plan` → plan hash 相同。
- 用目標檔變動前取得的 plan hash 執行 `apply` → 停止，不寫入，訊息指出變動的目標。
- 工具 CLI 的替身在 MCP 步驟失敗 → `apply` 停止，manifest 記錄 plugin 步驟已完成，重跑 `plan` 只顯示剩下的步驟。
- 在測試用家目錄執行兩次 `apply` → 第二次回報沒有變更，指令檔裡只有一個 kit 區塊。
- 測試用指令檔含 ccync 區塊與 codebase-memory 區塊 → `apply` 後，兩個區塊的位元組與原本完全相同。
- 含 BOM 的 CRLF `AGENTS.md` → `apply` 後仍是含 BOM 的 CRLF，只有 kit 區塊不同。
- 家目錄路徑含空格 → `apply` 和 `verify` 通過。
- 區塊裡的備用指令，把 `<home>` 換成實際路徑後，分別從 cmd.exe 和 PowerShell 執行 → 檢查會執行並印出結果。
- 從版本 A 升級到 B → 啟動檔載入 B，MCP 項目仍可運作，`uninstall` 只在 A 的雜湊值相符時移除 A。
- Windows 上目標檔在改名時被鎖住 → 重試後以非零結束碼結束並附檔案路徑，原檔完好。
- 測試資料中 kit 區塊被手動改過 → `uninstall` 保留該區塊，並回報它已被修改。
- 使用者把 `clear-writing-kit-textlint` 改指向其他指令 → `uninstall` 保留該項目，並回報它已被修改。
- 測試用 `settings.json` 含其他欄位 → `apply` 後只有 `outputStyle` 不同，`plan` 的差異有顯示原本的值。
- PATH 上只有 Deno，並用 `deno` 執行安裝程式 → MCP 指令使用 `deno`。
- 工具 CLI 是 `.cmd` 替身，參數含空格和 `&` → 參數原樣傳到，Node、Deno、Bun 都一樣。
- 打包後的檢查程式在 Node、Deno、Bun 上 → 6 個 profile 對 `writing/test` 的結果都與目前的 `writing/check.cjs` 相同。
- payload 的 kuromoji 字典被移除後執行 `verify` → ja-JP 呼叫失敗，結果為「未完成」。
- `outputStyle` 被其他程式改回去後執行 `verify` → 結果為「未完成」。
- 測試資料含 `~/.agents/skills/accurate-answer` → `verify` 回報「未完成」，並指出舊 skill。
- 測試用設定檔含 token → 任何輸出行都不含這個 token。

## Success Criteria

- 在擁有者的電腦上，新的 Codex 對話能說出 `coding-agent-writing` skill，列出 `clear-writing-kit-textlint`，並對 zh-TW 草稿呼叫 `lintText`。
- 在擁有者的電腦上，新的 Claude Code 對話使用 `clear-writing-kit` output style。
- 每個標為已驗證的工具，都在測試用家目錄上通過 `apply`、重跑無差異、`verify` 和 `uninstall`。其他工具列為未驗證，`apply` 拒絕執行。
- 同一個 `dist/cwk.mjs` 能在 Node、Deno、Bun 上執行 `install`、`check` 和 `mcp`。

## Risks

- 各工具的 plugin 格式和 CLI 不同，而且會隨版本改變。Copilot CLI、opencode、Antigravity 的支援都未驗證。
- 日文規則組在執行時從一個目錄載入 kuromoji 字典檔。磁碟上的字典有 17 MB，所以 payload 不可能是單一檔案。
- `writing/check.cjs` 目前從 `node_modules` 另外啟動 textlint CLI。新的入口必須在同一個程序內執行 textlint。結果一致性測試用來防止行為走樣。
- 用環境變數判斷工具，目前只在 Claude Code 驗證過。
- 沒有 Node、Deno、Bun 的使用者，要先手動安裝其中一個才能安裝。
- 只附加不刪除的區塊會讓指令檔越來越長。2 KB 上限和單一區塊替換限制了成長幅度。
- 在擁有者電腦上的過渡期，ccync 區塊和 kit 區塊會同時存在，而且指向不同的 skill，直到 ccync 的來源更新為止。
- agent 可能沒有真的取得使用者確認就執行 `apply`。`--plan-hash` 只能證明套用的計畫和顯示過的計畫相同，不能證明有人讀過。
- Claude Code 可能在執行中的對話改寫 `~/.claude/settings.json`，導致 `outputStyle` 的變更遺失。`verify` 能發現，但無法防止。
- 在 Windows 上，工具的 CLI 常是 `.cmd` 替身。從 Node 20.12.2 起，不經 shell 啟動 `.cmd` 會失敗；經 `cmd.exe` 啟動則會讓參數受 cmd.exe 解析影響。Deno 和 Bun 的啟動行為也和 Node 不同。

### Trust boundaries

| 邊界 | 跨越的動作 | 控制方式 |
| --- | --- | --- |
| agent → 安裝程式 | agent 決定 `--agent` 並執行 `apply` | 環境變數交叉比對、plan hash、`INSTALL.md` 的確認步驟 |
| 安裝程式 → 工具設定 | 寫入指令檔和設定，登記 plugin 與 MCP 項目 | 優先用工具 CLI、標記範圍內的原子寫入、備份、manifest 雜湊值和指紋 |
| 安裝程式 → 可能含密鑰的檔案 | 讀取 `config.toml` 和 `settings.json` | 只解析需要的欄位，不印出任何值 |
| agent → MCP server | 送出草稿文字 | 只有一個 `lintText` 工具，不能讀檔，不能自動修正 |

## Open Questions

None

## Approach

### Step 1: Feasibility spike for the payload

- **Files**: `src/check.ts`、`src/mcp.ts`、`dist/`、`.dev/research/payload-spike.md`
- **What**: 在同一個程序內執行 textlint 並快取 profile，建立只有一個工具的 MCP server。依序嘗試三種 payload 配置：(1) 一個打包檔加同層的 `dict/` 目錄；(2) 打包檔加只含正式相依套件的精簡 `node_modules`。兩者都不通過時，停止並把計畫退回 deep-planning。選第一個在 Node、Deno、Bun 上結果都一致的配置。不只一個通過時，選 payload 較小的。冷啟動必須在 3 秒內。
- **Verify**: 三種執行環境上，6 個 profile 對 `writing/test` 測試資料的結果都與目前的檢查程式相同。報告記錄各執行環境的配置、payload 大小和冷啟動時間。

### Step 2: Host capability survey

- **Files**: `src/hosts.ts`、`.dev/research/host-capabilities.md`
- **What**: 對 Claude Code、Codex、Copilot CLI、opencode、Antigravity CLI，記錄已安裝的版本、plugin 格式、plugin skill 支援、plugin 列出指令、MCP 新增／移除／列出或查詢指令、隔離測試用家目錄的設定目錄變數、全域指令檔，以及 output style 支援。每一項都引用指令輸出或官方文件網址。
- **Verify**: 每個工具的紀錄都有已驗證旗標和證據來源。Claude Code 和 Codex 在擁有者的電腦上調查。

### Step 3: Generated artifacts

- **Depends on**: Step 1，因為區塊裡的備用指令格式取決於它。
- **Files**: `scripts/generate-output-style.py`、`scripts/artifacts.py`、`scripts/generate-agents-block.py`、`install/agents-block.md`、`output-styles/clear-writing-kit.md`、`tests/`
- **What**: 從 `skills/coding-agent-writing/` 產生指令區塊並 commit。把 output style 產生器的預設輸出改到 `output-styles/`。加上 `--check` 檢查。
- **Verify**: 產生器檢查和 Python 測試都通過。區塊小於 2 KB，不含特定電腦的絕對路徑。

### Step 4: Plugin manifests

- **Depends on**: Step 2。
- **Files**: `.claude-plugin/`、`.codex-plugin/`，以及通過 Step 2 的其他工具設定檔
- **What**: 每份設定檔只指向 `skills/coding-agent-writing/`。Claude 的設定檔另外帶 output style。不宣告 MCP server。
- **Verify**: 在測試用家目錄上，各工具的 CLI 能從本機路徑安裝 plugin，並列出 skill。

### Step 5: Installer

- **Depends on**: Steps 1 to 4。
- **Files**: `src/cli.ts`、`src/install/*.ts`、`dist/`
- **What**: 依 `src/hosts.ts` 實作 `plan`、`apply`、`verify`、`uninstall`，符合 R-01 到 R-18。
- **Verify**: 所有測試案例在 Node、Deno、Bun 上，對測試用家目錄全部通過。

### Step 6: Agent prompt and docs

- **Files**: `INSTALL.md`、`README.md`、`docs/verification.md`
- **What**: 撰寫 agent 安裝流程並更新文件。
- **Verify**: `npm --prefix writing run lint` 對修改後的文件通過。

### Step 7: Human review

- **Files**: 無
- **What**: 所有任務和目標回推驗證都通過後，擁有者審核一次。指令由 agent 執行，擁有者只看結果。檢查清單：
  1. 在 Claude Code 依 `INSTALL.md` 執行到 `plan`。差異只涉及 kit 區塊、plugin、`clear-writing-kit-textlint` 和 `outputStyle`。
  2. `apply` 之後，`verify` 顯示「通過」；或只因舊的 ccync `accurate-answer` 區塊或 skill 而顯示「未完成」。
  3. 在 Codex 重做第 1 和第 2 項。
  4. 新的 Claude Code 對話使用 `clear-writing-kit` output style。
  5. 新的 Codex 對話回答這個 prompt 時，說出 `coding-agent-writing` 並呼叫 `lintText`：「說出你目前使用的寫作 skill 名稱，並用 lintText 檢查這句：這個功能可以讓使用者更方便的進行設定。」
- **Verify**: 擁有者逐項標記是或否。

## Review Results

### Architecture Review

判定：APPROVE（golem-architect，2026-10-02，第二輪）。第一輪判定 REVISE，有 4 項阻擋問題，這一版都已解決：

- B1 驗證只看存在與否 → R-14 對每種語言實際呼叫 `lintText`，並重讀 `outputStyle`。
- B2 payload 位置和升級方式未定義 → R-07 分版本存放 payload 並使用啟動檔，R-18 定義升級。
- B3 經由 CLI 建立的項目無法計算雜湊值 → R-16 和 R-17 改記指令指紋，server 名稱加上命名空間。
- B4 寫入不是原子操作，也會改變檔案格式 → R-05，以及 CRLF、BOM、檔案鎖定、路徑含空格的測試。

併入的非阻擋項目：Windows 的 `.cmd` 啟動（列入風險並加測試）、沒有 MCP 的工具改用區塊裡的備用指令（R-11）、可重現的 plan hash（R-03）、output style 產生器的預設輸出位置（Step 3）、用啟動檔取代符號連結（R-07），以及備用指令的家目錄解析（R-11）。

接受的偏離：MCP server 只透過工具 CLI 登記，不透過 plugin 設定檔。執行環境在 `apply` 時依電腦決定，靜態的 plugin 設定檔無法表達；只用一條登記路徑也能避免重複登記。因此只裝 plugin 不會有 MCP server，`verify` 會回報這個缺口。

精簡結果：兩個打包檔合併為 `dist/cwk.mjs`；工具 JSON 表改為 `src/hosts.ts`；MCP 只留 `lintText`；不再讀取 `.claude.json`；續跑機制改為可重跑的 `plan`；只有不支援 plugin skill 的已驗證工具才複製 skill；第 1 版不提供編譯好的執行檔。

A 類 Open Questions 的關閉紀錄：

- OQ-01 已關閉。工具要通過 Step 2 調查和完整測試循環才算支援（R-13），`apply` 拒絕未驗證的工具。取捨：第 1 版支援的工具可能較少，但不會宣稱未經證實的支援。
- OQ-02 已關閉。Step 1 是有關卡的可行性驗證，有固定的退路順序，以及結果一致、大小、3 秒冷啟動三項選擇標準。kuromoji 從目錄載入 17 MB 的字典，所以 payload 是一個目錄（R-07）。
- OQ-04 已關閉。只登記一個 MCP server，它只有一個 `lintText` 工具，並在程序內快取 profile（R-10）。textlint 內建的 server 在啟動時就固定一個設定。約 80 行建立在 `@modelcontextprotocol/server` 上的程式碼，取代 6 個登記項目；textlint 15.8.0 本來就相依這個套件。
- OQ-06 已關閉。產生器留在 Python，因為產出會 commit，安裝程式在執行時不產生任何東西。Python 只是開發時的相依項目，`--check` 用來防止產出與來源不一致。

擁有者關閉的問題（H 類，2026-10-02）：

- OQ-03 由擁有者關閉：第 1 版不提供編譯好的執行檔。payload 是 commit 進 repo 的 JavaScript 打包檔和字典，需要 Node、Deno 或 Bun，但不用安裝套件，也不用連網。`INSTALL.md` 會先檢查執行環境。這也更正了先前的理由：R-09 不會遇到「沒有執行環境」的狀況，因為安裝程式本身就需要執行環境。
- OQ-05 由擁有者關閉：安裝程式先備份再覆蓋原本的 `outputStyle`，`plan` 的差異會顯示原本的值（R-12）。

<!-- ARCH_REVIEW: CLEAR -->

### Business Review

未申請。本計畫不涉及商業規則、定價、權限、通知、新手引導或資格判定。

### Design Review

未申請。本計畫沒有面向客戶的介面。

### Documentation Structure Review (steward)

結果：沒有問題。計畫位於 `.dev/plans/feat-cross-agent-plugin-installer.md`，slug 以 `feat-` 開頭，旁邊有 EN 語意草稿。它是 `.dev/plans/` 裡唯一的計畫。範本的所有章節都在。兩張流程圖都與 R-01 到 R-18 和檔案清單一致，包含啟動檔和只經由 CLI 登記 MCP。`accurate-answer` 只以安裝程式要偵測的舊項目出現，不是殘留的舊名。

### Engineering Review

判定：CLEAR（STAGE 3.5，golem-architect，2026-10-02）。

- 套用擁有者的規則：一個任務是一個可交付的行為，可當成一個 commit 審查；不按檔案或語言拆開；沒有只跑驗證的任務；一個測試點檢查一個行為，全部由 agent 執行；人工審核只有一次，以檢查清單在所有自動任務和目標回推驗證後進行（Step 7）。這些規則優先於 GAL 偏好單一檔案的預設。最大的任務是 T-08（8 個原始碼檔案加 `dist/`）和 T-09（6 個原始碼檔案加 `dist/`），各自是一個行為。
- Lens 1 結構原子性：APPROVE。12 個任務，相依順序正確。前幾輪修正了：打包後仍能載入規則（`src/rules.ts`）、查詢 CLI 管理項目的目前狀態、移除 `--all`、共用的 `which()`、明確的重試和雜湊定義，以及重組任務時遺漏的規格（`saveManifest`、身分不一致規則、執行環境錯誤值、R-15 衝突清單、`settings.json` 不存在時的處理、結束碼規則）。最後一項阻擋問題是相依順序：`plan` 在 T-09 之前就需要 `upsertBlock`。協調者依 architect 指定的方式，把純函式 `upsertBlock` 移到 T-08 並核對結果。這一處移動沒有再經 architect 審查。
- Lens 2 最小可觀察驗證：APPROVE。37 個測試點，每個檢查一個行為，證據都不只是結束碼 0。`INSTALL.md` 的符合度檢查要求引用對應的行（TP-26）。Test Plan 不含需要人的檢查。
- 流程圖和檔案清單：一致。
- 關卡：T-03 決定 payload 配置。它以「停止」結束時，T-05 之後的任務都不開始，計畫退回 deep-planning。

<!-- ENG_REVIEW: CLEAR -->

## Test Plan

每一列只檢查一個行為，可以涵蓋多個任務。每一列都由 agent 執行。需要人來做的檢查放在 Step 7 的人工審核清單，不在這裡。測試程式由 tester 在 pipeline 階段，依這些列和公開介面撰寫。證據 E 的定義在 Tasks。

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | integration | 在 Node 上，`dist/cwk.mjs check --language <l> --genre <g> --stdin` 與 `writing/check.cjs` 對 `writing/test/checkers.test.cjs` 的每個案例，回報相同的規則 ID、行號和欄號。沒有結果和有結果兩種情況的結束碼相同。未知語言這類啟動錯誤，`dist/cwk.mjs` 以 2 結束（參考程式以 1 結束）。E。 | T-01 |
| TP-02 | unit | 對 6 個 profile 重複呼叫 `lintText` 後，匯出的載入計數器顯示每個 profile 只載入一次。E。 | T-01 |
| TP-03 | integration | 對 `dist/cwk.mjs mcp` 啟動的 MCP client 只看到一個工具 `lintText`，參數為 `text`、`language`、`genre` 和選填的 `filename`。zh-TW 呼叫會回傳結果。無效的列舉值回傳 MCP 錯誤。沒有任何工具會讀檔或自動修正。E。 | T-02 |
| TP-04 | integration | 使用 commit 進 repo 的 `dist/` 配置時，TP-01 的一致性在 Node、Deno（`deno run -A`）、Bun 上都成立，三者的冷啟動都在 3 秒內。`.dev/research/payload-spike.md` 依序記錄嘗試過的配置、payload 大小、冷啟動時間和執行環境版本。沒有配置通過時，結果是「停止：退回 deep-planning」，不是通過。E。 | T-03 |
| TP-05 | integration | commit 進 repo 的 `dist/` 與重新執行 `npm --prefix writing run build` 的結果相同。E。 | T-01, T-02, T-03, T-08, T-09, T-10, T-11 |
| TP-06 | unit | `src/hosts.ts` 的每筆紀錄，逐欄對應 `.dev/research/host-capabilities.md` 的一列。每筆 `verified: true` 的紀錄，在該列都引用了指令輸出或官方網址。`src/hosts.ts` 沒有任何路徑使用 `os.homedir()`。E。 | T-04 |
| TP-07 | unit | 不帶參數執行 `python scripts/generate-output-style.py` 時，只寫入 repo 的 `output-styles/clear-writing-kit.md`，不寫入 `~/.claude`。檔案過期時 `--check` 失敗。`python -m unittest discover -s tests -v` 通過。E。 | T-05 |
| TP-08 | unit | `python scripts/generate-agents-block.py --check` 對 commit 的 `install/agents-block.md` 通過。區塊以 `<!-- clear-writing-kit:begin v=2.0.0 -->` 開頭、以 `<!-- clear-writing-kit:end -->` 結尾，小於 2,048 位元組，寫明 `coding-agent-writing`、`lintText`，以及含 `<runtime command>` 和 `<home>` 的備用指令，不含磁碟代號或使用者路徑。skill 版本改變時 `--check` 失敗。E。 | T-06 |
| TP-09 | integration | 在測試用家目錄執行 `apply` 後，把 `install/agents-block.md` 裡的備用指令的 `<home>` 換成實際路徑，分別用三種執行環境的指令形式（`node`、`deno run -A`、`bun`），從 cmd.exe 和 PowerShell 執行，都會印出結果。E。 | T-06, T-09 |
| TP-10 | integration | 對每個標為已驗證的工具，用調查記錄的設定目錄變數隔離測試用家目錄，從本機 repo 路徑安裝 plugin，安裝後的 plugin 列出 `coding-agent-writing`。Claude 的 plugin 另外列出 `clear-writing-kit` output style。沒有任何設定檔宣告 MCP server 或提到 `web-skills/`。E。 | T-05, T-07 |
| TP-11 | unit | 設了 `CLAUDECODE` 和 `CODEX_COMPANION_SESSION_ID` 時，`--agent claude` 判定為 `claude`。只設 `CLAUDECODE` 時，`--agent codex` 是不一致錯誤，且不輸出 plan hash。沒有 `--agent` 是錯誤。E。 | T-08 |
| TP-12 | unit | 用 PATH 測試資料時，執行環境依序選 Node >= 20.18、Deno >= 2、Bun，略過 Node 18，並回傳絕對路徑。在 Windows 上，`which()` 會依 PATHEXT 解析。E。 | T-08 |
| TP-13 | integration | 在測試用家目錄執行 `plan` 後，每個檔案的雜湊值都不變，差異只顯示 kit 自己的區塊和項目。E。 | T-08 |
| TP-14 | integration | 狀態不變時，兩次 `plan` 得到相同的 hash。用目標檔變動前取得的 hash 執行 `apply`，不寫入任何東西，並指出變動的目標。E。 | T-08, T-09 |
| TP-15 | integration | 在標為未驗證的工具上，`plan` 列出手動步驟且不輸出 hash，`apply` 拒絕執行。E。 | T-08, T-09 |
| TP-16 | integration | 測試用家目錄放了三種舊版衝突：`accurate-answer` skill 目錄、提到 `accurate-answer` 的區塊、不是 `clear-writing-kit` 的 `outputStyle`。`plan` 和 `verify` 都逐一回報，且三者都沒被刪除。E。 | T-08, T-10 |
| TP-17 | integration | 在測試用工具設定檔放一個 token 後，`plan`、`apply`、`verify`、`uninstall` 的任何輸出行都不含這個 token。E。 | T-08, T-09, T-10, T-11 |
| TP-18 | integration | 在有工具 CLI 替身的測試用家目錄執行 `apply`：安裝 plugin，用啟動檔路徑和計畫選定的執行環境登記 `clear-writing-kit-textlint`，寫入一個 kit 區塊，對 Claude 設定 `outputStyle`，並在 manifest 記錄每個步驟。第二次 `apply` 沒有任何變更。E。 | T-09 |
| TP-19 | integration | 對含 BOM 的 CRLF `AGENTS.md` 執行 `apply` 後，仍是 CRLF 且保留 BOM。家目錄路徑含空格也能運作。E。 | T-09 |
| TP-20 | integration | 工具 CLI 替身在 MCP 步驟失敗時，`apply` 停止，manifest 列出已完成的步驟，下一次 `plan` 只顯示剩下的步驟。E。 | T-09 |
| TP-21 | integration | 對含其他欄位的測試用 `settings.json` 執行 `apply`，只改變 `outputStyle`，保留欄位順序和縮排，並備份檔案。`plan` 的差異有顯示原本的值。E。 | T-09 |
| TP-22 | integration | 在 Windows 上，安裝程式在 Node、Deno、Bun 上執行時，`.cmd` 形式的工具 CLI 替身都原樣收到含空格和 `&` 的參數。E。 | T-08, T-09 |
| TP-23 | integration | `apply` 把 `dist/` 複製到 `<home>/.clear-writing-kit/<version>/` 並寫入啟動檔。從版本 A 升級到 B 時，啟動檔改為載入 B，A 保留，MCP 項目仍可透過啟動檔回應。E。 | T-09 |
| TP-24 | integration | `apply` 後，`verify` 讀取已登記的 MCP 指令並啟動它，每種語言都至少得到一項結果。payload 字典被移除、`outputStyle` 被改回、存在舊的寫作 skill、MCP 替身在每次呼叫 30 秒的時限內都不回應，這四種情況都回傳「未完成」。家目錄路徑含空格時，這些案例一樣通過。E。 | T-10 |
| TP-25 | integration | `apply` 後執行 `uninstall`，測試用家目錄回到安裝前的位元組，只多出備份資料夾。手動改過的區塊、改指向其他指令的 `clear-writing-kit-textlint`、被修改的 payload 檔案，都會保留並回報。從 A 升級到 B 後，只有在 A 的雜湊值相符時才移除 A。E。 | T-11 |
| TP-26 | integration | agent 逐項對照 R-19 檢查 `INSTALL.md`，每一項都引用 `INSTALL.md` 中對應的那一行：執行環境預檢並附官方安裝網址且不自動安裝、從 repo clone 執行且 `dist/` 已 commit、`plan` → 顯示 → 等待 → `apply --plan-hash` → `verify`、分開回報通過與失敗、禁止直接修改設定檔、開新對話做行為驗收。找不到可引用的行的項目，判為失敗。E。 | T-12 |
| TP-27 | integration | README 三種語言的段落都顯示相同的安裝指令，`test_readme_languages_have_equal_commands_and_local_links` 通過，「本儲存庫不修改全域 agent 設定」的敘述已移除。`npm --prefix writing run lint` 和 `npm --prefix writing run okf:check` 通過。E。 | T-12 |
| TP-28 | integration | 在 Node、Deno、Bun 上執行 `install --help`，都列出 `plan`、`apply`、`verify`、`uninstall`。E。 | T-08, T-09, T-10, T-11 |
| TP-29 | integration | 在 Windows 上，目標檔在改名時被鎖住，`apply` 每隔 100 ms 重試 5 次，之後以含路徑的錯誤結束，原檔位元組不變。E。 | T-09 |
| TP-30 | integration | 對同時含 ccync 區塊和 codebase-memory 區塊的測試檔執行 `apply` 後，兩個區塊的位元組與原本完全相同。E。 | T-09 |
| TP-31 | unit | 用未知的語言或文體呼叫 `lintText` 會丟出錯誤，不會回傳空的報告。E。 | T-01 |
| TP-32 | integration | manifest 損壞時，`plan` 和 `apply` 以錯誤結束，不會把它當成空的 manifest。E。 | T-08, T-09 |
| TP-33 | integration | 目標檔已經有兩個 kit 區塊時，`apply` 失敗，而且不寫入任何檔案。E。 | T-09 |
| TP-34 | integration | PATH 上沒有符合條件的執行環境時，`plan` 回報錯誤，且不輸出 plan hash。E。 | T-08 |
| TP-35 | integration | 沒有 `settings.json` 時，對 Claude Code 執行 `apply` 會建立只含 `outputStyle` 的檔案。E。 | T-09 |
| TP-36 | integration | 每個 `install` 子指令在工具不一致、拒絕未驗證工具、步驟失敗或結果為「未完成」時，都以非零結束碼結束，其他情況以 0 結束。E。 | T-08, T-09, T-10, T-11 |
| TP-37 | integration | `settings.json` 不是有效的 JSON 時，對 Claude Code 執行 `apply` 會在寫入任何檔案前停止。E。 | T-09 |

## Tasks

每個任務是一個可交付的行為，擁有者可以把它當成一個 commit 審查。任務不按檔案或按語言拆開，也沒有只負責跑驗證的任務。這是擁有者的 refining 規則，優先於 GAL 偏好單一檔案的預設。每個任務的影響範圍列在 Targets。

所有任務共用的約定：

- TypeScript 原始碼放在 repo 根目錄的 `src/`。相依套件放在 `writing/package.json`。建置用 esbuild，以 `writing/node_modules` 為模組路徑，輸出到 `dist/`。開發時的測試可以用 Node 內建的型別移除功能（Node >= 23.6）。發佈的 `dist/` 必須能在 Node >= 20.18、Deno >= 2 和 Bun 上執行。
- 每個安裝模組都以參數接收家目錄和環境變數。只有 `src/cli.ts` 讀取真實的家目錄和環境變數。
- 工具 CLI 一律經由 `src/install/spawn.ts` 以名稱呼叫，測試才能把替身放在 PATH 最前面。
- 任何模組都不印出工具設定檔的內容。
- 修改 `src/` 的任務，在同一個 commit 重新建置並 commit `dist/`。
- 每個 `install` 子指令在工具不一致、拒絕未驗證工具、步驟失敗或結果為「未完成」時，以非零結束碼結束，其他情況以 0 結束。
- `src/install/` 的模組只使用 Deno 和 Bun 也支援的 `node:fs` 與 `node:path` API。
- 測試程式由 tester 之後依 Test Plan 撰寫。refining 階段不寫測試程式。

證據 E：每個任務的 tester 收據以任務標題開頭，記錄任務列出的每個 TP ID、確切的指令、觀察到的輸出或檔案路徑、結果、commit hash，以及 NotRun 的限制。headless 派遣另外需要狀態為 `completed` 的 executor log，以及已核對的寫回內容。結束碼 0 本身不算通過。

Step 與任務的對應：Step 1 → T-01 到 T-03，Step 2 → T-04，Step 3 → T-05 和 T-06，Step 4 → T-07，Step 5 → T-08 到 T-11，Step 6 → T-12，Step 7 → 人工審核清單。T-03 是關卡：它以「停止」結束時，T-05 之後的任務都不開始。

- [x] T-01 — 交付打包後的 `cwk check` 指令 *(dd7f4ff)*
  - Commit: dd7f4ff37c9c9f6786cbb6116564045473ad4ad9
  - Targets: `writing/package.json`, `writing/package-lock.json`, `src/rules.ts`, `src/check.ts`, `src/cli.ts`, `dist/`
  - Depends on: None
  - Change: 把 `esbuild` 和 `@modelcontextprotocol/server` 以固定版本加入 devDependencies，server 的版本採用 textlint 15.8.0 已解析的版本。新增 `build` 指令，把 `../src/cli.ts` 打包成 `../dist/cwk.mjs`（ESM、platform node、`nodePaths` 設為 `writing/node_modules`，並加上給 CommonJS 相依套件用的 `createRequire` banner）。在 `src/rules.ts` 靜態匯入 `writing/profiles/*.json` 用到的每條規則和規則組，並把名稱對應到模組。在 `src/check.ts` 匯出 `lintText({ text, language, genre, filename })`：驗證 `language`（`en-US`、`zh-TW`、`ja-JP`）和 `genre`（`document`、`conversation`），其他值丟出錯誤；用建置時匯入的 profile JSON 和規則對應表建立 kernel descriptor，不經過 `loadTextlintrc`，因為它在執行時才依套件名稱解析；每個 profile 在每個程序只呼叫一次 `createLinter` 並快取；遇到未對應的規則或零條規則時丟出錯誤；匯出載入計數器。在 `src/cli.ts` 加上子指令分派，以及 `check --language --genre`：讀取 `--stdin`（可加 `--stdin-filename`）或檔案路徑，用 textlint 預設格式輸出，以 0、1 或 2 結束，並拒絕 `--config`、`--rule`、`--rulesdir`、`--no-textlintrc` 和 `-c`。`writing/check.cjs` 保持不變，作為一致性的參考。建置並 commit `dist/`。
  - Acceptance: 在 Node 上，`dist/cwk.mjs check` 對現有測試案例的結果與 `writing/check.cjs` 相同，每個 profile 只載入一次。
  - Evidence: E + TP-01, TP-02, TP-05, TP-31.

- [x] T-02 — 交付只有一個 `lintText` 工具的 `cwk mcp` server *(46216a1)*
  - Commit: 46216a1ba9bdae1ce262ba77c6f2c2acf400d177
  - Targets: `src/mcp.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-01
  - Change: 在 `@modelcontextprotocol/server` 上建立 stdio MCP server，只有一個工具 `lintText`。輸入 schema 有 `text`、`language` 和 `genre` 列舉，以及選填的 `filename`。它呼叫 `src/check.ts` 的 `lintText`，以結構化內容回傳結果。驗證錯誤轉成 MCP 錯誤。新增 `mcp` 子指令。不提供讀檔或修正工具。重新建置 `dist/`。
  - Acceptance: MCP client 只看到一個工具，並從它取得 zh-TW 結果。
  - Evidence: E + TP-03, TP-05.

- [x] T-03 — 讓 payload 能在 Node、Deno、Bun 上執行 *(88e0fc9)*
  - Commit: 88e0fc90b838af21f4b1c01f13ea57f2395b5fef
  - Targets: `writing/package.json`, `dist/`, `.dev/research/payload-spike.md`
  - Depends on: T-02
  - Change: 把建置擴充成依序嘗試、取第一個通過的配置：(1) 打包檔加同層的 `dist/dict/`（從 kuromoji 字典複製）。先找出並記錄已安裝的 kuromojin 版本，能用哪個選項或環境變數讓規則把字典路徑指向那裡；沒有這種機制時，配置 (1) 失敗。(2) 打包檔加只含正式相依套件的精簡 `dist/node_modules`。配置通過的條件是：TP-01 的一致性在 Node、Deno、Bun 上都成立，且三者的冷啟動都在 3 秒內。兩者都通過時，取較小的。commit `dist/`，並寫報告記錄配置、大小、冷啟動時間和執行環境版本。兩者都不通過時，不 commit 配置變更，寫報告並停止。
  - Acceptance: commit 的 payload 在三種執行環境上都通過一致性檢查，報告記錄了數據。
  - Evidence: E + TP-04, TP-05.

- [x] T-04 — 把工具能力記錄成已驗證的工具表 *(8255e54)*
  - Commit: 8255e5430cc81c959fff80207d27af2316ecd9ee
  - Targets: `.dev/research/host-capabilities.md`, `src/hosts.ts`
  - Depends on: None
  - Change: 調查 Claude Code、Codex、Copilot CLI、opencode、Antigravity CLI。逐一記錄已安裝的版本、plugin 格式、plugin skill 支援、plugin 安裝／移除／列出指令、MCP 新增／移除／列出或查詢指令、讓測試用家目錄隔離的設定目錄環境變數、全域指令檔路徑、output style 支援，以及完整名稱的身分環境變數。已安裝的工具擷取指令輸出，其他的引用官方網址。只有具備指令輸出或對應已安裝版本的官方來源時，才標為已驗證。把同樣的資料寫成 `src/hosts.ts` 裡有型別的常數，路徑寫成以注入的家目錄為參數的函式，每筆紀錄附證據字串。
  - Acceptance: 工具表和調查逐列一致，每筆已驗證紀錄都有證據。
  - Evidence: E + TP-06.

- [x] T-05 — 從 repo 提供 output style *(f2ce410)*
  - Commit: f2ce4107a21f593cb39249287bae30ef04d28e9e
  - Targets: `scripts/generate-output-style.py`, `output-styles/clear-writing-kit.md`, `tests/test_artifacts.py`
  - Depends on: T-03（只是關卡，沒有技術上的相依）
  - Change: 把 `DEFAULT_OUTPUT` 改為 `ROOT / "output-styles" / (PROJECT_NAME + ".md")`，使用 `artifacts.py` 的 repo 根目錄。產生並 commit 檔案。把 `test_default_style_name_changes_without_deleting_existing_style` 改成新的預設位置，並新增檢查：commit 的檔案與 `render_claude()` 相同。
  - Acceptance: 產生器只寫入 repo 內的檔案，Python 測試通過。
  - Evidence: E + TP-07, TP-10.

- [ ] T-06 — 交付產生出來的指令區塊
  - Targets: `scripts/artifacts.py`, `scripts/generate-agents-block.py`, `install/agents-block.md`, `tests/test_artifacts.py`
  - Depends on: T-03
  - Change: 在 `artifacts.py` 新增 `render_agents_block()`。它從 `skills/coding-agent-writing/SKILL.md` 的 metadata 讀取 skill 版本，輸出開始和結束標記、`persistent_core()` 的核心規則、skill 名稱、`lintText` 工具，以及備用指令 `<runtime command> <home>/.clear-writing-kit/cwk.mjs check`。備用指令要列出 `node`、`deno run -A`、`bun` 三種形式，並要求把 `<home>` 換成實際路徑。仿照 `generate-output-style.py` 新增 `generate-agents-block.py`，預設輸出 `install/agents-block.md`，支援 `--check`。區塊達到 2,048 位元組時丟出錯誤。新增測試。
  - Acceptance: `--check` 對 commit 的區塊通過，大小、標記和內容規則都成立。
  - Evidence: E + TP-08, TP-09.

- [ ] T-07 — 為每個已驗證工具提供 plugin 設定檔
  - Targets: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, Codex 的 marketplace 檔，以及其他支援 plugin skill 的已驗證工具各一份設定檔，路徑依調查結果
  - Depends on: T-04, T-05
  - Change: 對每個支援 plugin skill 的已驗證工具，用調查記錄的欄位名稱宣告 `clear-writing-kit`。每份設定檔只提供 `skills/coding-agent-writing/`。Claude 的設定檔另外提供 `output-styles/`。新增指向 repo 根目錄的 marketplace 項目。不宣告 MCP server，也不提到 `web-skills/`。不支援 plugin skill 的已驗證工具不需要設定檔，由 `src/hosts.ts` 的 `skillCopyDir` 處理。
  - Acceptance: 每份設定檔都能在隔離的測試用家目錄安裝，並列出 skill。
  - Evidence: E + TP-10.

- [ ] T-08 — 交付 `cwk install plan`
  - Targets: `src/install/spawn.ts`, `src/install/runtime.ts`, `src/install/identity.ts`, `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/block.ts`, `src/install/plan.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-03, T-04, T-06, T-07
  - Change: `spawn.ts`：匯出依 PATHEXT 解析的 `which(name, env)`，以及 `run(command, args, options)`。`.cmd` 或 `.bat` 經由 `cmd.exe /d /s /c` 執行，每個參數都依 cmd.exe 規則加引號；其他檔案直接執行；回傳結束碼、stdout 和 stderr。`runtime.ts`：`selectRuntime(env)` 透過 `which()` 依序選 Node >= 20.18、Deno >= 2（加 `run -A`）、Bun；都不符合時回傳錯誤值，`plan` 回報這個錯誤且不輸出 hash。`identity.ts`：`resolveHost(agentArg, env)` 必須有 `--agent`，用完整名稱比對身分變數，不用前綴。不一致的定義是：缺少所指定工具的必要變數，或出現其他工具的完整名稱變數而沒有所指定工具的變數。`fsutil.ts`：`readText(path)` 回傳文字，以及換行格式、BOM、結尾換行的狀態。`manifest.ts`：schema 含版本、檔案項目（路徑、SHA-256）、CLI 項目（工具、類型、名稱、指令指紋）和已完成的步驟；檔案不存在視為空，無法解析是錯誤。`block.ts`：純函式 `upsertBlock(text, block)` 替換唯一一個 kit 區塊，或依檔案自己的換行格式在一行空行後附加一個區塊；有兩個區塊時丟出錯誤；不改動標記以外的位元組；回傳新文字和是否有變更。`plan.ts`：`computePlan(ctx)` 判定工具、選執行環境、透過工具的列出或查詢指令讀取目前的 plugin 和 MCP 狀態，並回傳：依序的步驟（payload、plugin、MCP、區塊、output style）；只含 kit 自己區塊或項目的逐行差異，由 `upsertBlock` 算出、不另用差異套件，所以重跑時沒有差異；R-15 定義的舊版衝突清單（`accurate-answer` skill 目錄、提到 `accurate-answer` 的區塊、不是 `clear-writing-kit` 的 `outputStyle`）；以及涵蓋安裝程式版本、payload 摘要值和正規化目標狀態的 SHA-256 plan hash，不含時間戳記和備份路徑。未驗證的工具得到手動步驟，沒有 hash。不寫入任何東西。在 `src/cli.ts` 新增 `install plan --agent`，重新建置 `dist/`。
  - Acceptance: `plan` 只讀、結果可重現、會回報衝突，並拒絕未驗證的工具。
  - Evidence: E + TP-05, TP-11, TP-12, TP-13, TP-14, TP-15, TP-16, TP-17, TP-22, TP-28, TP-32, TP-34, TP-36.

- [ ] T-09 — 交付 `cwk install apply`
  - Targets: `src/install/fsutil.ts`, `src/install/manifest.ts`, `src/install/payload.ts`, `src/install/settings.ts`, `src/install/apply.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-08
  - Change: `fsutil.ts`：新增 `writeTextAtomic(path, text, format)`，先寫同目錄的暫存檔，再改名取代目標檔；改名因鎖定失敗時，每隔 100 ms 重試 5 次，之後丟出含路徑的錯誤。另新增 `backup(path, backupDir)`。`manifest.ts`：新增經由 `writeTextAtomic` 寫入的 `saveManifest`。`payload.ts`：把 `dist/` 複製到 `<home>/.clear-writing-kit/<version>/`，寫入啟動檔 `<home>/.clear-writing-kit/cwk.mjs`，內容是動態匯入目前版本的一行程式，舊版本保留。`settings.ts`：`setOutputStyle(path, value)` 只改 `outputStyle`，保留欄位順序和縮排，先備份，回傳原本的值；檔案不存在時建立只含 `outputStyle` 的檔案；JSON 無效時在寫入前丟出錯誤。`apply.ts`：`applyPlan(ctx, planHash)` 重新計算計畫，hash 不符就不寫入；備份目標檔；寫入 `plan` 算出的區塊文字；執行其他步驟；用啟動檔和計畫選定的執行環境登記 `clear-writing-kit-textlint`；每完成一個步驟就立即記錄到 manifest；步驟失敗時停止，回傳該步驟、它的輸出和已完成的步驟。新增 `install apply --agent --plan-hash`，重新建置 `dist/`。
  - Acceptance: `apply` 一次裝好全部內容、可重跑、保留檔案格式和其他工具的區塊，失敗後可經由 `plan` 接續。
  - Evidence: E + TP-09, TP-14, TP-15, TP-17, TP-18, TP-19, TP-20, TP-21, TP-22, TP-23, TP-28, TP-29, TP-30, TP-32, TP-33, TP-35, TP-36, TP-37.

- [ ] T-10 — 交付 `cwk install verify`
  - Targets: `src/install/verify.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-09
  - Change: `verify(ctx)` 透過工具的列出或查詢指令讀取已登記的 MCP 指令並啟動它，直接以 stdio 傳送 MCP JSON-RPC（`initialize`、`tools/list`、`tools/call`），不使用 client 套件。它對每種語言各呼叫一次 `lintText`，用的句子必須產生結果，每次呼叫的時限是 30 秒。它在 Claude Code 內重新讀取 `outputStyle`，檢查區塊數量和大小，並列出舊版衝突。只有每項檢查都執行而且通過時才回傳「通過」，否則回傳「未完成」並列出每項失敗或略過的檢查。新增 `install verify`，重新建置 `dist/`。
  - Acceptance: `verify` 證明 server 在每種語言都能運作，且有檢查缺漏或失敗時絕不回報通過。
  - Evidence: E + TP-16, TP-17, TP-24, TP-28, TP-36.

- [ ] T-11 — 交付 `cwk install uninstall`
  - Targets: `src/install/block.ts`, `src/install/uninstall.ts`, `src/cli.ts`, `dist/`
  - Depends on: T-09
  - Change: 在 `block.ts` 新增 `removeBlock(text, expectedHash)`，`expectedHash` 是寫入時區塊位元組的 SHA-256。`uninstall(ctx)` 移除雜湊值相符的 manifest 檔案項目；目前指令與指紋相符時，用工具的移除指令移除 CLI 項目；kit 區塊的雜湊值相符時移除區塊；移除雜湊值相符的 payload 版本。每個被保留的項目都附上原因回報。備份保留。新增 `install uninstall`，重新建置 `dist/`。
  - Acceptance: `uninstall` 讓乾淨的測試用家目錄回到原狀，並保留每個被修改過的項目。
  - Evidence: E + TP-17, TP-25, TP-28, TP-36.

- [ ] T-12 — 為 agent 和使用者撰寫安裝文件
  - Targets: `INSTALL.md`, `README.md`, `docs/verification.md`
  - Depends on: T-10, T-11
  - Change: 依 R-19 撰寫 `INSTALL.md`。agent 從 repo clone 執行，`dist/` 已 commit，所以不需要 `npm install`。agent 先檢查 `node`、`deno`、`bun`，三者都沒有時附官方安裝網址並停止，不自行安裝執行環境。接著執行 `install plan --agent <self>`、顯示結果、等待明確確認、帶 plan hash 執行 `install apply`、執行 `install verify`、分開回報通過與失敗的步驟、絕不直接修改工具設定檔，並請使用者開新對話做行為驗收。在 README 三種語言的段落加入相同的安裝指令，把「本儲存庫不修改全域 agent 設定」改寫成安裝程式會修改什麼、怎麼解除安裝，並更新 output style 產生器的說明。在 `docs/verification.md` 說明 `verify`。不手動修改 `knowledge/`。
  - Acceptance: `INSTALL.md` 涵蓋 R-19 的每一項，README 和文件檢查都通過。
  - Evidence: E + TP-26, TP-27.
