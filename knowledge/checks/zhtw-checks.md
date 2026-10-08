---
type: Procedure
title: 繁體中文工具檢查
description: 使用 zhtw-mcp 檢查臺灣用詞與翻譯腔，並如實處理工具限制。
tags:
  - zh-TW
  - zhtw-mcp
  - checks
language: zh-TW
audience:
  - coding-agent
sources:
  - resource: 'Clear Writing Kit repository file: skills/coding-agent-writing/references/zhtw-checks.md'
generated:
  by: process:clear-writing-kit-okf
source_path: skills/coding-agent-writing/references/zhtw-checks.md
source_sha256: 0d9f57d26c45f14ffaf78c8a6348f4739694022b2e54f0e7648bb84e4f1eab15
---

# coding agents 的繁中工具檢查

本流程保留原始 skill 的兩項要求：文字要容易理解，也要使用臺灣繁體中文。語言原則見 [zh-TW.md](../rules/zh-TW.md)。

## 尋找與呼叫工具

先搜尋宿主完整工具目錄及延遲載入工具。搜尋名稱包含 `zhtw` 的工具，並核對參數結構。不同宿主可能使用不同的工具名稱字首。不可只因初始工具清單沒有列出，就宣稱工具不存在。

工具可用時，必須在交付前執行檢查。將完整繁中草稿傳入 `text`。依內容格式選擇 `content_type`。Markdown 文件使用 `markdown`，純文字對話使用 `plain`。

首次檢查使用以下設定：

```json
{
  "fix_mode": "none",
  "detect_style": true,
  "verify": false
}
```

技術文件另設 `translationese_domain: "technical"`。一般對話使用 `general`。多語文件只傳入繁中區塊，不把日文當作繁中檢查。

## 判讀與修正

分別檢查臺灣用詞、AI 寫作痕跡與翻譯腔。分數只提供提示，不是文章品質的證明。不要另外維護通用的禁止用詞清單。

依修正範圍選擇模式：

- `orthographic`：修正標點與字形。
- `lexical_safe`：套用不改變語意的安全詞彙替換。
- `lexical_contextual`：需要上下文判斷，只在人工確認後使用。

自動修正最多執行兩輪。每次修改後，重新核對事實、數字、條件、否定、範圍與確定程度。再檢查最後要交付的文字。不要為了消除警告而接受錯誤替換。

專有名詞使用 `glossary.proper_nouns` 保護。專案偏好詞可以使用 `glossary.preferred` 表達，但仍須核對工具實際行為。一般詞彙誤判應依語境說明，不能任意放進專有名詞清單。

預設維持 `verify: false`。只有在使用者允許將文字送往外部翻譯服務時，才能啟用相關驗證。

## 工具不可用時

區分未安裝、未連線、權限遭拒、呼叫失敗與逾時。使用 [zh-TW.md](../rules/zh-TW.md) 完成人工檢查，並在首次發生時交代未執行的檢查。只有在狀態改變或影響當次結果時，才重述相同限制。

若專案將該檢查列為必要關卡，未完成時必須回報阻擋。不得把人工檢查說成工具檢查成功。

## 資料來源

完整書目見[參考文獻清單](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md)。

- 工具參數與功能：`text`、`content_type`、`fix_mode`、`detect_style`、`verify`、`translationese_domain` 與 `glossary` 等參數，以及修正模式的行為，依據 `[ZhtwMCP]`。本專案不指定該工具的版本。使用前仍須讀取宿主提供的實際參數結構。
- 本專案自訂的規則：本檔其餘內容，包括尋找工具、交付前檢查、修正輪數上限、判讀方式、外部驗證限制，以及工具不可用時的回報方式。
