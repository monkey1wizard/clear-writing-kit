<!-- gal:planning-authority
semantic-draft: .dev/plans/feat-ccync-local-checks.en.md
planLanguage: zh-TW
draft-hash: 7f460abba0513cf2ab3928a2bcc6f12cd2be27a446ce05699591309521de95df
rendered-source-hash: d97198de9fcbc91782960a2d32a5914f8f21418e36fbbdfe55b90bcc77cdf00a
prompt-hash: 36aa6f14d55395c23cd5a1c3776825f558ffa5a64ca3876338b434e2504fa371
equivalence-verdict: EQUIVALENT
-->

# Plan: ccync 管理安裝的本機寫作檢查

## Approval

- Human approval: [approved]
- Architect review: [clear]
- Design review: [not-requested]
- Business review: [not-requested]

## Goal

ccync 安裝 clear-writing-kit 後，ccync 投影的 5 個 MCP host 都能透過單一
`clear-writing-kit-textlint` server 執行已提交的檢查器。該 server 只提供
`lintText`。常駐指令區塊不得引導 agent 使用 ccync 沒有建立的路徑。
ccync 未管理同名 server 時，直接使用 `cwk install` 必須維持目前的安全行為。

### Why

以下證據已在 2026-10-09 查核：

| 觀察 | 證據 |
| --- | --- |
| ccync 會先讀取 root `.mcp.json`，再讀取 root `mcp.json`。它會展開 `${PLUGIN_ROOT}`，並將同一份定義投影到 Claude Code、Codex、Copilot、OpenCode 與 Antigravity。 | `C:/Code/ccync/crates/ccync-engine/src/install.rs`、`C:/Code/ccync/crates/mcp/src/host_render.rs`、`C:/Code/ccync/docs/mcp.md` |
| 本 repo 有 `.claude-plugin/plugin.json` 與 `.codex-plugin/plugin.json`，但沒有 portable root `plugin.json`。兩份 compatibility manifest 都沒有宣告 MCP component。 | `.claude-plugin/plugin.json`、`.codex-plugin/plugin.json` |
| Codex 只會對具有 root `plugin.json` 的 portable package 自動發現 root `mcp.json`。Compatibility package 必須用 `mcpServers` 明確指向 root `.mcp.json`。 | [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins)、[OpenAI submission reference](https://developers.openai.com/plugins/deploy/submission) |
| Claude Code 使用 root `.mcp.json` 作為 plugin MCP 檔案，並在其中解析 `${CLAUDE_PLUGIN_ROOT}`。官方文件沒有將 bare `mcp.json` 列為 compatibility plugin component。 | [Claude Code plugin reference](https://code.claude.com/docs/en/plugins-reference) |
| 產生的共用區塊先要求 agent 使用 `lintText`，再備援到 `<home>/.clear-writing-kit/cwk.mjs check`。ccync-only 安裝不會建立該目錄。 | `scripts/artifacts.py`、`install/agents-block.md`、`tests/test_artifacts.py` |
| `cwk install` 會記錄 MCP fingerprint。目前的 update 路徑會移除任何同名 live registration，只要其 fingerprint 與新計畫不同。 | `src/install/plan.ts`、`src/install/apply.ts`、`src/install/manifest.ts` |
| Uninstall 已會保留 fingerprint 與 manifest 紀錄不同的 live MCP entry。 | `src/install/uninstall.ts`、`writing/test/installer-registration.test.cjs` |
| 內建 MCP server 只提供 `lintText`。既有驗證會探測 en-US、zh-TW 與 ja-JP。 | `src/mcp.ts`、`src/install/verify.ts`、`writing/test/installer-registration.test.cjs` |

### Decisions already made by the owner

- 使用 ccync 管理 clear-writing-kit，並投影其 coding-agent skill。
- 使用產生的 `install/agents-block.md` 作為 ccync 共用指令區塊。

### Decisions made by this plan

- 使用 root `mcp.json` 作為 ccync-only 中繼資料，不使用 `.mcp.json`。
- 維持目前的 compatibility-package 結構。不得新增 portable root
  `plugin.json`。兩份 compatibility manifest 都不得參照 `mcp.json`。
- 執行 `node ${PLUGIN_ROOT}/dist/cwk.mjs mcp`。必要 runtime 是 Node.js
  20.18 或更新版本。不得新增多 runtime launcher。
- 從常駐區塊刪除無效的固定路徑 CLI fallback。不得換成另一個推測路徑。
- 所有未擁有、無法讀取或 fingerprint 不符的同名 live MCP entry 都視為
  conflict。Planning 必須回報。Apply 必須拒絕移除或取代。

## Requirements

- [ ] R-01 執行 `ccync sync` 後，ccync 管理的 5 個 MCP host 各有且只有一個
  `clear-writing-kit-textlint` server。該 server 由 ccync projection
  擁有，且只提供 `lintText`。
- [ ] R-02 Root `mcp.json` 宣告 `node`，args 精確為
  `${PLUGIN_ROOT}/dist/cwk.mjs` 與 `mcp`。定義使用 ccync pin 住的 plugin
  root 內已提交的 bundle，不需要安裝 package。
- [ ] R-03 `mcp.json` 維持 ccync-only。Repo 不得有 root `plugin.json`
  或 root `.mcp.json`。`.claude-plugin/plugin.json` 與
  `.codex-plugin/plugin.json` 都不得宣告 `mcpServers` 或參照 MCP
  manifest。此邊界變更時，測試必須失敗。
- [ ] R-04 Host PATH 沒有 Node.js 20.18 或更新版本時，只有該 server
  啟動失敗，且 host 必須顯示失敗。不得新增 launcher 或靜默 runtime fallback。
- [ ] R-05 常駐指令區塊不得包含固定的 `.clear-writing-kit` 檢查器路徑，
  且必須維持在 2,048 bytes 預算內。
- [ ] R-06 同名 MCP registration 只能有一個 owner。`cwk install` 可以建立
  不存在的 entry、重建其 manifest 擁有但已不存在的 entry，或更新 live
  fingerprint 仍與 manifest 紀錄相同的 entry。Live entry 未被擁有、
  無法讀取或與紀錄 fingerprint 不同時，必須回報 conflict，且不得修改
  MCP。Blocking conflict 不得產生可套用的 MCP plan hash。Apply 重新計算
  狀態後，必須拒絕先前發出的 hash。
- [ ] R-07 單獨使用 `cwk install` 時，Claude 與 Codex registration 的
  install、verify、upgrade 與 uninstall 仍可運作。兩種 ccync 安裝順序都
  必須在 ownership conflict 安全失敗，不得移除或接管另一個 owner 的 entry。
- [ ] R-08 自動化證據必須驗證 manifest 邊界、解析後的 command 與 args、
  精確的 `lintText` 工具集合，以及 en-US、zh-TW、ja-JP findings。發布前，
  具名的隔離整合測試必須使用已安裝的 ccync CLI 與此 repo 的本機 snapshot，
  涵蓋 5 個 host renderer，並證明 projection 成功與同名 collision 會安全失敗。
  Owner acceptance 必須在 5 個 fresh host session 驗證已發布的 pin。
  Missing、unreadable、skipped、成功案例中的 collision、runtime failure 或
  `NotRun` 都算失敗。
- [ ] R-09 更新 `README.md` 的英文、繁體中文與日文安裝路徑。在
  `INSTALL.md`、`docs/installer.md` 與 `docs/verification.md`
  區分 direct installer ownership 與 ccync-managed projection。Durable docs
  更新後才重新索引 `.dev/project.md`，再重新產生 `AGENTS.md`。
- [ ] R-10 `AGENTS.md`、agents block 與 `dist/` 只能透過各自的既有
  產生器重新產生。Agents-block generator 與 GAL adapter renderer
  必須維持為兩條獨立 projection path。

## Diagrams

```text
ccync pin
  |
  v
root mcp.json (ccync-only)
  | expand ${PLUGIN_ROOT}
  v
ccync projection
  +-- Claude Code ----+
  +-- Codex ----------+
  +-- Copilot --------+--> node <pinned-root>/dist/cwk.mjs mcp
  +-- OpenCode -------+                         |
  +-- Antigravity ----+                         v
                                      exactly lintText
```

```text
cwk install plans clear-writing-kit-textlint
  |
  +-- live absent ------------------------------> create
  |
  +-- manifest owns, live absent --------------> recreate
  |
  +-- manifest owns, live == recorded
  |     +-- live == planned --------------------> no-op
  |     +-- live != planned --------------------> update
  |
  +-- no manifest owner ------------------------> CONFLICT, no mutation
  +-- live unreadable --------------------------> CONFLICT, no mutation
  +-- live != recorded manifest fingerprint ---> CONFLICT, no mutation
  |
  +-- plan hash issued, then live state changes
        |
        v
      apply recomputes state -------------------> CONFLICT, no mutation
```

## Candidate approaches

| ID | 做法 | 評估 |
| --- | --- | --- |
| A | 新增 bare root `mcp.json` 作為 ccync-only 中繼資料，並在修改前強制檢查 installer ownership。 | 採用。它沿用 ccync 既有的 5 host projection，且不會在目前的 compatibility package 中啟用原生 plugin MCP component。 |
| B | 新增 root `.mcp.json`，或新增 portable root `plugin.json` 與 `mcp.json`。 | 不採用。Claude Code 或 Codex 會原生載入內建 server。直接安裝 plugin 時，host 狀態可能在 installer ownership plan 外改變。 |
| C | 替 `cwk install` 新增 component selector，並讓 ccync 執行 installer。 | 不採用。它必須修改 ccync 行為、涵蓋較少 host，且會重複管理 payload。 |
| D | 只刪除指令區塊中的無效 fallback。 | 不採用。ccync 管理的 agent 仍無法使用檢查器。 |

## Files to Create or Modify

- `mcp.json`：新增 ccync-only server 定義。
- `scripts/artifacts.py`、`install/agents-block.md`、
  `tests/test_artifacts.py`：刪除無效 fallback、保護大小與 compatibility
  manifest 邊界、驗證 MCP 定義，並執行已提交的 server。
- `writing/test/checkers.test.cjs`、
  `writing/integration/ccync-projection.test.cjs`：驗證 bundled MCP
  protocol 與實際 ccync 5 host projection。External-CLI test 位於預設
  `writing/test/*.test.cjs` suite 以外。
- `src/install/plan.ts`、`src/install/apply.ts`：建立 MCP ownership
  狀態模型，並拒絕不安全的 update。
- `writing/test/installer-registration.test.cjs`：涵蓋 ownership 狀態、
  兩種安裝順序，以及 apply-time manifest 與 live-registration drift。
- `dist/cwk.mjs`：installer 來源變更後重新產生。
- `README.md`、`INSTALL.md`、`docs/installer.md`、
  `docs/verification.md`：在 durable user-facing 與 verification
  reference 中記錄兩種支援的 ownership path。
- `.dev/project.md`、`AGENTS.md`：重新索引 durable docs，並重新產生
  adapter 指令。

## Test Cases

- 解析 `mcp.json`。確認只有一個 server、command 為 `node`、兩個 args
  完全符合預期，且沒有額外 tool 或 transport 定義。
- 確認 root `plugin.json` 與 root `.mcp.json` 都不存在，且兩份
  compatibility manifest 都省略 `mcpServers`。未來改為 portable package
  時，必須明確重新設計。
- 將 `${PLUGIN_ROOT}` 解析到 fixture plugin root。透過 stdio 啟動已提交
  的 bundle，列出工具，並確認唯一工具是 `lintText`。
- 使用 en-US、zh-TW 與 ja-JP fixture 呼叫 `lintText`，每個 probe
  都必須取得 findings。
- 使用已安裝的 ccync CLI 與此 repo 的 plain directory snapshot。成功案例
  使用一個全新的隔離 home，執行 5 host projection。Collision 案例使用各自
  全新的 home，並在 ccync 尚未取得該名稱的 ownership 前放入 foreign
  same-name vector。成功案例必須確認每個 renderer 的 resolved command 與
  args 順序。Collision 案例必須回報衝突，且 foreign state 的 bytes 不變。
- 涵蓋 installer ownership 狀態：absent、manifest-owned 且 current、
  manifest-owned 且 stale、manifest-owned 但 missing、unowned same-name、
  unreadable，以及 live fingerprint 與 manifest 紀錄不同。
- 每個 conflict 都必須確認 plan 回報衝突，apply 未執行 MCP remove 或 add。
- 涵蓋先 ccync 再 `cwk install`，以及先 `cwk install` 再 ccync。
  第二個 owner 不得接管或靜默取代。
- 重新產生 agents block。確認產生結果完全相同、不含固定
  `.clear-writing-kit` 路徑，且小於 2,048 bytes。
- 驗證英文、繁體中文與日文的 ccync quick path，以及 direct-installer
  ownership 的區分。
- 重新產生 `AGENTS.md` 與 `dist/`。第二次產生或建置不得產生 diff。
- 執行 authoritative Node tests、Python tests 與 writing lint command。

## Success Criteria

- ccync-only 安裝讓 5 個 projection host 都取得一個可運作的
  `clear-writing-kit-textlint` server，且只提供 `lintText`。
- Server command 解析到 ccync pin 住的 plugin root，並使用已提交的 bundle。
- 常駐指令不含 ccync 沒有建立的路徑。
- 單獨使用 `cwk install` 時仍可運作。遇到不安全的同名 MCP ownership
  conflict 時，會拒絕修改。
- 所有自動化檢查與 owner acceptance 證據都通過。`NotRun` 不得算成功。

## Risks

- 未來若新增 portable root `plugin.json`，`mcp.json` 會成為原生 Codex
  plugin 中繼資料。邊界測試與文件必須在遷移前強制要求明確重新設計。
- 未來 Claude Code 可能新增 bare `mcp.json` discovery。Plugin schema
  變更時，freshness check 必須重新驗證原生 loader 行為。
- 從 GUI 啟動的 host 可能沒有繼承含 Node.js 20.18 或更新版本的 PATH。
  只讓該 host 啟動失敗是刻意設計，且失敗必須可見。
- ccync 升級會改變 cache path。移除舊 cache 前，`ccync sync` 必須將 5 個
  host registration 全部改寫到新的 pinned root。
- Install manifest 或 host 狀態可能在 plan 與 apply 間改變。每個 operation
  在內部 `computePlan` 完成後及第一次修改 MCP 前，apply 必須同時重讀兩者。
  先前 step 的 persistence 不得覆寫並行發生的 manifest drift。任一項 drift
  都必須在 MCP remove 或 add 前阻擋操作。

## Open Questions

None.

OQ-01 已決定刪除無效的固定路徑 fallback。OQ-02 已決定直接使用 Node.js
20.18 或更新版本。OQ-03 已決定回報 ownership conflict，並拒絕 MCP 修改。

## Approach

### Step 1：新增 ccync-only 定義並修正常駐指令

- **Files**：`mcp.json`、`scripts/artifacts.py`、
  `install/agents-block.md`、`tests/test_artifacts.py`、
  `writing/test/checkers.test.cjs`、
  `writing/integration/ccync-projection.test.cjs`。
- **What**：透過 `${PLUGIN_ROOT}` 宣告內建 server。刪除無效 checker
  fallback。加入 contract、邊界、大小、tool list 與語言 probe 測試。
  新增 opt-in cross-repository test，使用暫存 home、本機 immutable snapshot
  與已安裝的 ccync CLI。
- **Verify**：Artifact tests 證明定義完全符合預期、compatibility 邊界未變、
  產生結果一致、大小合格、只提供一個工具，且三語都有 findings。Ccync
  需另行執行的 ccync integration test 必須證明實際 bare-manifest
  selection、placeholder expansion、5 host rendering 與 fail-closed
  collision path，且不得將 ccync 加入預設 test suite 的 prerequisite。

### Step 2：強制執行 installer MCP ownership

- **Files**：`src/install/plan.ts`、`src/install/apply.ts`、
  `writing/test/installer-registration.test.cjs`、`dist/cwk.mjs`。
- **What**：使用 install manifest 作為 ownership 紀錄。拒絕 unowned、
  unreadable 與 drifted 的同名 entry。每個 operation 在內部 `computePlan`
  完成後及第一次執行 remove 或 add 前，立即重讀 manifest entry 與 live
  registration。每次較早的 manifest save 都必須防止覆寫並行變更。
  保留安全的 create、recreate、upgrade、verify 與 uninstall 行為。
- **Verify**：Ownership state 與 install-order fixture 證明 conflict
  不會修改 MCP。既有 installer verification 維持通過。

### Step 3：更新 durable docs

- **Files**：`README.md`、`INSTALL.md`、`docs/installer.md`、
  `docs/verification.md`、`tests/test_artifacts.py`。
- **What**：新增三語 ccync quick path。以明確的 direct-installer 與 ccync
  ownership path 取代 installer-only 陳述。Owner acceptance 執行前，
  保留目前未驗證 real-home 的說明。
- **Verify**：Documentation contract tests 通過，且不會宣稱已執行
  real-home acceptance。

### Step 4：重新索引 durable docs 並重新產生 adapter guidance

- **Files**：`.dev/project.md`、`AGENTS.md`。
- **What**：Durable docs 完成後更新壓縮 project index，再透過 GAL renderer
  重新產生 adapter 指令。
- **Verify**：第二次 adapter render 不產生 diff。Agents-block generator
  必須維持為 GAL adapter renderer 以外的獨立 projection。

### Step 5：驗證並記錄已發布的 ccync projection

- **Files**：Owner acceptance 成功後更新 `docs/verification.md`。
- **What**：實作發布並 pin 後，執行 ccync upgrade 與 sync。檢查 5 個 host
  registration，並實際執行 MCP tool。
- **Verify**：Owner acceptance 記錄每個 host 的 resolved command、args、
  owner、精確 tool list 與三語 findings。後續文件更新只能取代這份證據
  已推翻的 acceptance limit。

## Review Results

### Architecture Review

2026-10-09 的隔離 adversarial review 結論為 APPROVE。

- ccync-only `mcp.json` 邊界解決原生 plugin discovery race。原因是 repo
  沒有 portable root `plugin.json`、沒有 root `.mcp.json`，且
  compatibility manifest 沒有 MCP reference。
- Install manifest fingerprint 是 `cwk install` 擁有同名 live entry
  的唯一證據。Planned vector 相同但沒有 manifest 證據時，仍視為 foreign
  並阻擋。
- Conflict 發生時，planning 不得提供可套用的 MCP plan hash。Apply 必須
  重新計算狀態，且不得執行 MCP remove 或 add。
- Runtime verification 必須證明 5 個 host 的 ccync ownership、共同的
  pinned command vector、精確的 `lintText` 工具集合，以及三語 findings。
  Collision、skip、unresolved、unreadable、Node 版本不足、啟動失敗、
  finding 缺失與 `NotRun` 都算失敗。

<!-- ARCH_REVIEW: CLEAR -->

### Business Review

未要求。本變更不新增商業規則、定價或權限。

### Design Review

未要求。本變更沒有使用者介面。

### Documentation Structure Review

2026-10-09 scope review 後，結論為 CLEAR。

- `README.md` 與 `INSTALL.md` 已納入範圍，因為目前的安裝說明遺漏
  ccync-managed path，或與該路徑衝突。
- `docs/verification.md` 繼續作為未測 real-home limit 的 authoritative
  reference。只有 owner acceptance 成功後才寫入證據。
- Durable docs 先更新，再重新索引 `.dev/project.md`，最後 render
  `AGENTS.md`。Agents-block generator 維持獨立。
- R-01 至 R-10 不需要新的 repository-wide structure-map mechanism。
  該工作不納入本計畫，且必須另建計畫取得核准。

### Adversarial Review

2026-10-09 最後一次獨立複審結論為 APPROVE。初次結論為 REVISE。
修訂後的計畫已處理 3 輪審查提出的 7 項 finding。

- 具名 ccync integration test 會透過已安裝的 CLI 讀取實際 root
  `mcp.json`、解析 `${PLUGIN_ROOT}`，並在發布前涵蓋 5 個 host renderer
  與 fail-closed collision。
- Apply-time ownership check 會同時重讀 manifest entry 與 live
  registration。獨立 drift subcase 都要求 remove 與 add 次數為 0。
- Owner acceptance 會把 `tools/list` 判定範圍限制在
  `clear-writing-kit-textlint` server，不使用 host-wide tool inventory。
- 本計畫已移除無直接關聯的 structure-map 初始化。
- Projection 的成功與 collision 案例使用不同的 fresh isolated home。
  Collision fixture 會在 ccync commit ownership 前建立。
- Apply-time drift fixture 會在內部 `computePlan` 完成後及第一次 MCP
  mutation 前注入，並保留並行變更後的 manifest bytes。
- 明確執行的 ccync integration test 位於預設 Node test glob 以外。
  `CCYNC_BIN` 無法解析到已安裝的 executable 時，測試必須失敗。

### Engineering Review

2026-10-09 在 adversarial revision 前的結論為 CLEAR。修訂後的 task 與 test
寫回後，最終 engineering receipt 必須再次通過。

- T-01 至 T-05 仍是單一概念的 atomic change。Dependency 已明列，沒有
  verification-only task，且 diagram 與修訂後的 scope 一致。
- TP-01 至 TP-16 提供可執行 probe、具體 result 或 diff 證據、完整 task
  coverage，並將實際 host mutation 獨立放在 owner-only acceptance。
- Marker 寫入前的 refining receipt 已通過所有 substantive row。唯一
  `not-run` row 是刻意尚未寫入的 clear marker。此 write-back 後，
  最終 receipt 必須通過。

<!-- ENG_REVIEW: CLEAR -->

## Test Plan

| ID | Type | Description | Covers |
| --- | --- | --- | --- |
| TP-01 | unit | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_manifest_contract -v`。解析後的檔案只有一個精確名稱、`node`，以及依序為 `${PLUGIN_ROOT}/dist/cwk.mjs`、`mcp` 的 args。 | T-01 |
| TP-02 | unit | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_ccync_mcp_native_loader_isolation -v`。兩個禁止的 root file 都不存在，且兩份 compatibility manifest 都省略 `mcpServers` 與 MCP reference。 | T-01 |
| TP-03 | integration | 執行 `node --test --test-name-pattern "bundled MCP contract" writing/test/checkers.test.cjs`。Initialization 成功，且 `tools/list` 只回傳名稱 `lintText`。 | T-01 |
| TP-04 | integration | 執行 `node --test --test-name-pattern "bundled MCP language probes" writing/test/checkers.test.cjs`。具名的 en-US、zh-TW、ja-JP document request 都有非空 `structuredContent.findings`，並依序包含 `prose-punctuation`、`prose-punctuation`、`ja-document-style`。 | T-01 |
| TP-05 | integration | 將 `CCYNC_BIN` 設為已安裝 ccync executable 的 absolute path，再執行 `node --test --test-name-pattern "ccync projects local clear-writing-kit MCP" writing/integration/ccync-projection.test.cjs`。一個全新的隔離環境使用專屬的 `HOME`、`USERPROFILE`、`APPDATA`、`LOCALAPPDATA` 與 `XDG_CONFIG_HOME`，執行 `ccync init codex`、選取 5 個 host family、加入 plain local snapshot，再執行 sync。成功案例的每個 renderer 都包含 `node`、一個 cache-root `dist/cwk.mjs` 與 `mcp`。另外的全新環境會在 ccync 擁有該名稱前預先放入 foreign same-name vector。每個 collision renderer 都回報衝突，且 foreign bytes 不變。若 `CCYNC_BIN` 缺失、無效、skipped，或回傳 unresolved 或 unreadable 證據，具名測試必須失敗。預設 `npm --prefix writing test` suite 不會找到此檔案。 | T-01 |
| TP-06 | unit | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_agents_block_ccync_contract -v`。具名 test 必須執行，並證明 regenerated byte equality、不含 `.clear-writing-kit`，且大小小於 2,048 bytes。 | T-02 |
| TP-07 | integration | 執行 `node --test --test-name-pattern "installer MCP safe transitions" writing/test/installer-registration.test.cjs`。Absent、owned-missing、owned-current、owned-stale 產生的 remove/add 次數為 0/1、0/1、0/0、1/1。 | T-03 |
| TP-08 | integration | 執行 `node --test --test-name-pattern "installer MCP ownership conflicts" writing/test/installer-registration.test.cjs`。Unowned、unreadable、drifted 與 ccync-first 狀態都會阻擋 `cwk`，沒有可套用 hash，且 remove/add 次數為 0/0。 | T-03 |
| TP-09 | integration | 執行 `node --test --test-name-pattern "installer apply rejects ownership evidence drift" writing/test/installer-registration.test.cjs`。Mock host 會記錄 registration-read call。Apply 的內部 `computePlan` 完成後，下一次 read 會在第一次 MCP mutation 前注入三種 subcase 之一，分別是在 disk 修改 manifest entry、在 disk 移除 manifest entry，或回傳已改變的 live registration。每個 subcase 都必須證明第二次 read 已發生、拒絕操作、避免較早的 step save 覆寫注入的 manifest bytes，且 MCP remove/add 次數維持 0/0。 | T-03 |
| TP-10 | integration | 執行 `node --test --test-name-pattern "direct installer owned lifecycle" writing/test/installer-registration.test.cjs`。具名 Claude 與 Codex install、verify、upgrade、uninstall lifecycle test 必須通過，並保留精確 manifest fingerprint。 | T-03 |
| TP-11 | integration | 執行 `cmd.exe /d /c npm --prefix writing run build` 兩次。第二次執行後，`git diff --exit-code -- dist` 為空。 | T-03 |
| TP-12 | documentation | 執行 `python -m unittest tests.test_artifacts.Artifacts.test_ccync_installation_docs_contract -v`。三種 README 語言都有 ccync quick path，且三份 installation docs 說明相同 owner rule 與 pending real-home limit。 | T-04 |
| TP-13 | documentation | 執行 `C:\Users\leetz\.cargo\bin\gal.exe render-adapters` 兩次。第二次執行後，`git diff --exit-code -- AGENTS.md` 為空，且 `.dev/project.md` 列出修訂後的 durable installation references。 | T-05 |
| TP-14 | integration | 執行 `cmd.exe /d /c npm --prefix writing test`。保留 Node tests 零失敗的 summary。 | T-01, T-02, T-03, T-04, T-05 |
| TP-15 | integration | 執行 `python -m unittest discover -s tests -v`。保留所有 Python test 都為 `OK` 的 summary。 | T-01, T-02, T-03, T-04, T-05 |
| TP-16 | integration | 執行 `cmd.exe /d /c npm --prefix writing run lint`。保留零 error 的 lint summary，並回報所有 advisory warning。 | T-01, T-02, T-03, T-04, T-05 |

Headless execution 時，每個 covering row 還需要 executor log terminal state
`completed`，以及 `.dev/plans/feat-ccync-local-checks.prompt.md` 中對應的
T-NN 與 test-result write-back。證據必須是 command output、spy count、
parsed result object 或指定的 empty diff。只有 PASS label 而沒有上述證據，
不能滿足該列。

## Tasks

- [ ] T-01 — 新增 ccync-only MCP 定義與 executable contract。
  - **Files**：`mcp.json`、`tests/test_artifacts.py`、
    `writing/test/checkers.test.cjs`、
    `writing/integration/ccync-projection.test.cjs`。
  - **Dependencies**：None.
  - **Change**：只宣告 `clear-writing-kit-textlint`，使用 `node` 與
    `${PLUGIN_ROOT}/dist/cwk.mjs mcp`。新增 guard，禁止 root
    `plugin.json`、root `.mcp.json`，也禁止兩份 compatibility manifest
    宣告 MCP。重用 `writing/test/checkers.test.cjs` 的 MCP client，執行
    stdio tool-list 與三語 probe。新增具名 ccync CLI integration test。
    該測試會把目前 repo 複製成 plain snapshot。成功案例使用全新的 home
    驗證 5 個 host family。Collision 案例使用各自全新的 home，並在 ccync
    擁有該名稱前預先放入 foreign same-name vector。每個 host renderer
    的 collision 都必須保留原始 bytes。此檔案必須位於預設
    `writing/test/*.test.cjs` discovery glob 以外，且明確要求 `CCYNC_BIN`。
  - **Acceptance**：TP-01 至 TP-05 證明精確 vector、4 項 isolation guard、
    可觀察的 tool list `[lintText]`，以及具名 request 的非空 findings
    包含指定 rule ID。這些測試也必須在發布前證明實際 ccync manifest
    selection 與 placeholder expansion 會產生 5 個預期的 native vector。
- [ ] T-02 — 從產生的 agents block 刪除無效 checker fallback。
  - **Files**：`scripts/artifacts.py`、`install/agents-block.md`、
    `tests/test_artifacts.py`。
  - **Dependencies**：T-01。兩個 task 都會修改 `tests/test_artifacts.py`，
    必須依序執行。
  - **Change**：更新維護中的 generator 文字，重新產生 committed block，
    並只更新 generator-owned digest expectation。Runtime 選擇與安裝指引
    保持不變。
  - **Acceptance**：TP-06 通過。產生結果完全相同、不含
    `.clear-writing-kit` checker path，且實測大小小於 2,048 bytes。
- [ ] T-03 — 在 direct installer 強制執行 one-owner MCP mutation safety。
  - **Files**：`src/install/plan.ts`、`src/install/apply.ts`、
    `writing/test/installer-registration.test.cjs`、`dist/cwk.mjs`。
  - **Dependencies**：None.
  - **Change**：將相同 host、kind 與 name 的 manifest entry 作為唯一
    ownership 證據。在 `readHostState` 與 `computePlan` 實作 plan-time
    gate，並使用 manifest `cli` entry lookup。Entry absent 時可以 create。
    只有 live fingerprint 仍與紀錄 fingerprint 相同時才可 update。將
    unowned、unreadable 與 drifted entry 轉為 blocking conflict。在
    `applyPlan` 中，每個 operation 都在內部 `computePlan` 完成後及第一次
    修改 MCP 前重讀 manifest entry 與 live registration。先前 step 的
    save 不得覆寫並行發生的 manifest 變更。Manifest entry 改變或消失，
    以及 live registration 改變時都必須拒絕修改。保留 uninstall
    exact-match 規則，不移除 foreign entry，並重新建置 bundle。
  - **Acceptance**：TP-07 至 TP-11 證明 create、recreate、no-op、update、
    conflict、apply-time manifest drift rejection、apply-time live drift
    rejection、direct lifecycle continuity、精確 spy count 與可重現的
    `dist/`。TP-05 透過實際 ccync projection 證明反向安裝順序的 collision。
- [ ] T-04 — 記錄兩種 installation ownership path。
  - **Files**：`README.md`、`INSTALL.md`、`docs/installer.md`、
    `docs/verification.md`、`tests/test_artifacts.py`。
  - **Dependencies**：T-01, T-02, T-03.
  - **Change**：新增語意相同的英文、繁體中文與日文 ccync quick path。
    區分 direct installer ownership 與 ccync projection。記錄 Node.js
    20.18、manifest 邊界、conflict 行為，以及仍待執行的 real-home
    acceptance，不得聲稱已執行。新增一個聚焦 artifact test，檢查必要
    literal 與 limit。
  - **Acceptance**：TP-12 在每份相關 durable document 找到相同的
    prerequisite、owner invariant、command 與 acceptance limit。
- [ ] T-05 — 重新索引 durable docs 並重新產生 adapter guidance。
  - **Files**：`.dev/project.md`、`AGENTS.md`。
  - **Dependencies**：T-04.
  - **Change**：在 `.dev/project.md` 重新索引變更後的 durable installation
    references，再執行 `C:\Users\leetz\.cargo\bin\gal.exe render-adapters`。
    不得使用 agents-block generator 產生 `AGENTS.md`。本 feature plan
    不得新增 repository-wide structure-map mechanism。
  - **Acceptance**：TP-13 通過。Project index 包含修訂後的 references，
    且 `AGENTS.md` 第二次 render 的 diff 為空。

## Owner Acceptance

OA-01 有一項必要前提。`ccync show clear-writing-kit` 回報的 pin 必須是包含
新 root `mcp.json` 的 implementation commit。若仍是較舊的 pin，OA-01 至
OA-03 必須維持 `NotRun`，且不能滿足本計畫。

| ID | What to check | Expected result | Pass/fail rule | Why not automated |
| --- | --- | --- | --- | --- |
| OA-01 | 執行 `ccync upgrade clear-writing-kit` 與 `ccync sync`。 | 兩個 command 都完成，且 sync output 沒有 collision、skip、unresolved placeholder 或 unreadable registration。 | 兩個 command 都成功，且 4 個 failure label 都沒有出現時才通過。 | 這些 command 會修改 owner 的實際 host config 與 cache。 |
| OA-02 | 檢查 `%USERPROFILE%\.ccync\build\mcp\projected-state.json`、`%USERPROFILE%\.claude.json`、`%USERPROFILE%\.codex\config.toml`、`%USERPROFILE%\.copilot\mcp-config.json`、`%APPDATA%\opencode\opencode.json`、`%USERPROFILE%\.gemini\config\mcp_config.json`。 | State 擁有 claude、copilot、opencode、codex、agy。每個 native config 只有一個 vector：`node`、共同 pinned `dist/cwk.mjs`、`mcp`。 | 所有 vector 都解析到 `ccync show clear-writing-kit` 的 pin，且沒有第二個 lint server 時才通過。 | Repo fixture 無法證明 owner 目前的 native config 與 pin。 |
| OA-03 | 在 5 個 host 選取 `clear-writing-kit-textlint` server，執行該 server scope 的 `tools/list`，並呼叫 `lintText({language:"en-US",genre:"document",text:"alpha; beta"})`、`lintText({language:"zh-TW",genre:"document",text:"alpha; beta"})`、`lintText({language:"ja-JP",genre:"document",text:"処理は完了していません。"})`。 | 選取的 server 只列出 `lintText`。其他 user-owned server 與工具可以保留。三次呼叫依序含 `prose-punctuation`、`prose-punctuation` 與 `ja-document-style`。 | 選取 server 的 exact tool list 加三語 probe，其 5 × 4 matrix 共 20 格都是 PASS，且沒有 `NotRun` 時才通過。 | Fresh host session 與 host tool picker 需要 owner 操作。 |
