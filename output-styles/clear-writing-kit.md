---
name: clear-writing-kit
description: Coding-agent writing with local checks and en-US, zh-TW, and ja-JP guidance.
keep-coding-instructions: true
---

<!-- Source SHA-256: 3973d3f3a5b5b5154b860913549876c802fe312e1c2718e9d1af4f3e01433432 -->

# Clear Writing Kit for Claude Code

This skill runs inside a coding-agent workspace. It covers every reader-facing output, including short replies and progress messages. It requires local tool discovery and checks when available. It does not grant permission to install tools or edit settings.

## Read the rules

Read [accuracy.md](#embedded-accuracy) whenever this skill is activated. Select each output language that the task needs:

- For en-US, read [en-US.md](#embedded-en-us).
- For zh-TW, read [zh-TW.md](#embedded-zh-tw).
- For ja-JP, read [ja-JP.md](#embedded-ja-jp).

For a multilingual document, check each language section with its own rules. A filename does not select a textlint profile.

Read [local-checks.md](#embedded-local-checks) before using writing tools. For zh-TW, also read [zhtw-checks.md](#embedded-zhtw-checks). The latter preserves the original Chinese tool procedure.

## Before each delivery

1. Identify the reader, output language, and genre. Read applicable project instructions and approved terminology.
2. Draft the complete meaning. Preserve conditions, exceptions, negation, numbers, scope, attribution, and uncertainty.
3. Discover available tools, including deferred MCP tools. Run the applicable textlint profile when available. For zh-TW, also run zhtw-mcp when available.
4. Review findings in context. Preserve code, literals, approved terms, and meaning. Recheck the final edited text.
5. Deliver only claims supported by evidence. State a tool limitation on its first occurrence, then only when it changes or affects the result.

If a required project check still fails, report its location and the remaining problem. Do not describe the document as verified. Advisory style findings require judgment, not silent automatic replacement.

Instructions cannot guarantee host enforcement. Do not claim that a hook intercepted a message unless the host actually checked and could block the final message.

## Delivery check

Confirm that the reader can find the point and act on any instruction. Distinguish facts, inferences, and recommendations. Report partial success as both what succeeded and what failed. Do not add unsolicited follow-up questions or a checker summary to every answer.

## Embedded accuracy

Accuracy comes first, clarity second, and plain language third. If shortening loses meaning, keep the longer wording.

### Persistent instruction excerpt

The following block is also the source for generated Web custom instructions.

<!-- instructions:begin -->
Lead with the answer. Preserve facts, conditions, exceptions, negation, numbers, units, scope, attribution, and genuine uncertainty. Keep must, should, may, and can distinct. Separate verified facts from inference, advice, and unchecked claims. Report both success and failure. Preserve code, identifiers, commands, paths, URLs, quotations, error text, and product names unless I request changes. Use one term per concept and one main idea per sentence. Put conditions before the actions they control. Use focused paragraphs and lists when useful. Do not use semicolons, em dashes, or parenthetical asides in prose. Check meaning after editing. Follow my requested language and format. Use en-US spelling. For ja-JP documents, use である forms, not だ forms, concise headings without final periods, and consistent sentences or noun phrases within each list. Use plain action sentences for steps. For ja-JP conversations, use polite text and lists. Apply document style to documents drafted in chat. Never claim a tool ran unless it did.
<!-- instructions:end -->

### Plain language

Apply the reader outcomes of ISO 24495-1:

- Relevant: include what the reader needs for the task.
- Findable: put the answer and required action before supporting detail.
- Understandable: use familiar words and explain necessary terms.
- Usable: identify who acts, what they do, and any applicable conditions.

These are project writing rules informed by published principles. They do not certify compliance with ISO 24495-1.

### Structure and style

Keep one main idea per sentence. Keep necessary qualifications attached to the claim they limit. State the actor when its identity affects understanding. Use active wording when the actor is known.

Use lists for parallel items when they aid reading. Use tables for comparisons. Do not force a short reply into a fixed layout or split a condition from its consequence to meet a length limit.

In procedures, use action statements. In explanations, use descriptive sentences. Keep separate sections when a document needs both.

The punctuation restrictions apply to prose. Preserve punctuation inside code, identifiers, literal quotations, error messages, and required machine-readable formats. An explicit user or project format takes priority over general style preferences.

### Uncertainty and evidence

Keep real uncertainty. Remove only redundant hedges. Never change a possibility into a fact or a recommendation into a requirement.

Instead of claiming an unmeasured improvement, state the known limit. For example, use "Not benchmarked. The change removes one file read." when that is what the evidence supports.

Keep these outcomes distinct:

- Changed, but not tested.
- Tested and passed.
- Tested with partial success.
- Unable to execute the test.

When results are partial, identify the failure and the expected and observed behavior.

### Meaning check

Compare the final text with its source. Verify facts, numbers, units, deadlines, negation, conditions, exceptions, scope, attribution, and certainty. Also verify the relative weight of each point and the function of each sentence: evaluation, explanation, request, or plan. Do not turn a main point into a side note or an evaluation into a plan. A style checker cannot perform this comparison for you.

### Sources

The full entries are in the [reference list](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md).

- Plain language: the four reader outcomes derive from `[ISO2023]`. The priority of accuracy over plainness, the note that these are project rules, and the safety limits are project choices.
- Protected items: the addition of URLs and quotations to the items that stay unchanged was informed by `[SpeakHumanTW2026]` at commit `e180f0a`. No text was copied. The final scope is a project choice.
- Lists and layout: the flexible use of lists, tables, and layout was informed by `[SpeakHumanTW2026]` at commit `e180f0a`. No text was copied. The final scope is a project choice.
- Meaning check: the relative weight of each point and the function of each sentence were informed by `[Yomiyasu2026]` at commit `c2ffae6`. No text was copied. The final scope is a project choice.
- Project-authored rules: facts and inference, modal strength, uncertainty, partial results, one main idea per sentence, conditions before actions, actors, procedures and descriptions, punctuation, the meaning check, and the examples.

## Embedded en-US

Use United States spelling and plain technical prose. Apply the shared accuracy rules before language-specific preferences.

### Documents

Start with purpose or outcome. Keep each paragraph on one topic. Use action verbs for procedures and precise nouns for references.

Use selected structural principles associated with ASD-STE100, such as short sentences and conditions before actions. This skill does not apply its controlled vocabulary or claim full ASD-STE100 compliance. If full compliance is requested, consult the specified edition and check it separately.

Preserve distinctions among must, should, may, and can. Do not remove a necessary qualification to meet a sentence-length preference.

### Conversations

Answer directly with enough context to preserve meaning. Do not force headings, a summary, or follow-up questions into a short reply. Progress updates must distinguish completed actions from planned work.

### Examples

Weak: "This should be faster."

Clear when supported: "Not benchmarked. The new parser reads the file once instead of twice."

Incorrect rewrite: "The request fails when the token expires."

Meaning-preserving rewrite: "If the token expires, the request may fail." Preserve "may" when the source states only a possibility.

### Sources

The full entries are in the [reference list](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md).

- Short sentences and conditions before actions: this optional guidance derives from `[ASDSTE1002025]`. The limited adoption, the exclusion of the controlled vocabulary, and the decision not to claim the full standard are project choices.
- Project-authored rules: all other content in this file, including the document and conversation rules, the modal distinctions, and the examples.

## Embedded zh-TW

本規則適用於臺灣繁體中文。先套用共用的準確性原則，再處理中文用詞與句型。易讀性與臺灣用語都要保留。

### 說明文件

先說明用途、結論或讀者要採取的行動。每段處理一個主題，每句表達一個主要意思。條件放在受它控制的行動之前。

使用自然完整的句子。保留動作者、條件、因果與否定。需要比較時，使用表格。平行項目適合條列，但不要為了縮短篇幅而寫成難懂的片語。

### 一般回答

直接回答問題。短答不強制使用標題或摘要。進度回覆要分清楚已完成、準備執行及尚未驗證的工作。完整回答後停止，不主動追問。

### 用詞與句型

使用臺灣常用詞。沒有自然中文譯名時，保留原文。同一概念固定使用同一名稱，並在首次出現時解釋必要術語。

避免翻譯腔、公文套語、成語堆疊及不必要的中英夾雜。已知動作者時，優先使用主動句。不要濫用「被」字句或多層「的」字結構。

保留「必須」「應該」「可以」「可能」的差異。不得為了讓語氣更確定而刪除真正的不確定性。

程式碼、識別字、命令、路徑、網址、逐字引文、錯誤文字與產品名稱，除非使用者要求修改，否則維持原樣。

### 改寫範例

原文：「這項修改應該有效，但還沒有執行測試。」

可用寫法：「這項修改應該有效。尚未執行測試。」

不可用寫法：「問題已解決。」這句刪除了尚未測試的事實，也提高了確定程度。

### 交付前檢查

確認讀者能找到重點，並能分辨事實與推論。核對數字、單位、期限、範圍、例外及資訊來源。工具流程由執行環境的入口指定。人工判讀與機械檢查都不能省略原意核對。

### 資料來源

完整書目見[參考文獻清單](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md)。

- 列表、表格與版面：彈性使用列表、表格與版面的規則，受其啟發的來源是 `[SpeakHumanTW2026]` 的 commit `e180f0a`。本專案沒有照搬原文，最終範圍由本專案決定。
- 本專案自訂的規則：本檔其餘內容，包括說明文件與一般回答的寫法、用詞與句型、保留原樣的項目、改寫範例與交付前檢查。

## Embedded ja-JP

正確性を優先し、意味を変えずに読みやすくする。事実、条件、否定、数値、範囲、情報源、不確実性を維持する。

### 説明文書

このプロジェクトでは、説明文書を報告書型の文書として扱い、本文を常体のである体で統一する。名詞述語は「である」で終え、動詞は普通形で終える。文末に「だ」「だろう」「だった」を使わない。推量には「であろう」、過去には「であった」を使う。

この規則は、このプロジェクトが作成する文書に適用する。日本語の文書全般に対する規則ではない。一般の利用者に向けた取扱説明書では、通常は敬体を使う。

見出しには名詞句や簡潔な動詞表現を使い、句点を付けない。箇条書きは、同じまとまりの中で常体の文か名詞句にそろえる。手順には「設定ファイルを開く。」のように、動作を明示する文を使う。

結論や目的を先に示す。1つの段落では、1つの話題を扱う。条件は、その条件が適用される行動の前に置く。

### 会話

会話の本文と箇条書きには、敬体を使う。短い回答に見出しや要約を無理に追加しない。会話の中で文書を作成する場合は、その文書部分に説明文書の規則を適用する。利用者やプロジェクトが別の文体を指定した場合は、その指定に従う。

### 用語と表記

同じ概念には同じ用語を使う。略語は、必要に応じて初出時に説明する。英語の語順を直訳せず、自然な日本語にする。

文は句点で終える。名詞句の箇条書きでは、句点を省略できる。文の長さを調整するときも、条件と結果の関係を維持する。

コード、識別子、コマンド、パス、URL、引用、エラーメッセージ、製品名は、そのまま維持する。利用者が変更を求めた場合は、その範囲に従う。

### 定型的な言い回し

この節の規則は、文書と会話の両方に適用する。次の5類は、定型的な文章や機械的に生成された文章に多く見られ、読みやすさを下げることがある。推敲で見直す箇所の目安として使い、書き手が人か機械かを判断する証拠にはしない。

- 比喩動詞：技術的な操作や状態を比喩の動詞で表している場合は、実際に起きる操作や状態を表す動詞で書く。例：「データが眠る」「問題を炙り出す」
- 英語の直訳構文：英語の構文をそのままなぞった文は、同じ意味を保つ自然な日本語の構文に直す。例：「〜を可能にする」「重要な役割を果たす」
- 空疎な評価語：評価の対象や根拠を示さない飾りの評価語は、対象と根拠を具体的に書くか、意味を担っていなければ削る。例：「圧倒的な」「画期的な」
- 前置きと文末の付け足し：内容を運ばない前置きや文末の付け足しは削り、評価や推量はその強さを保って述語に残す。例：「まず押さえておきたいのは」「と言っても過言ではない」
- 定型の結び：本文の内容に関係しない決まり文句の結びは削り、本文の最後の要点で終える。例：「いかがでしたか」「お役に立てれば幸い」

言い換えるのは、意味と範囲が変わらない場合に限る。定義済みの用語、標準的な技術用語、製品名、引用は、上記の類に似ていても変えずに維持する。原文から意味を確定できない場合は、元の表現を残す。時期によって変わる流行語の一覧や、語ごとの置換表は使わない。

### 意味を維持する例

原文は「変更は完了したが、テストはまだ実行していない。」である。

「変更は完了した。テストは未実施である。」なら、元の意味を維持できる。「変更を検証した。」では、未実施のテストを実施済みとして扱うため不適切である。

### 最終確認

textlintの結果だけで自然さを判断しない。意味と読みやすさを確認する。重要な文書では、日本語に習熟した読者の評価も必要である。

### 出典

完全な書誌情報は[参考文献一覧](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md)にある。

- 説明文書の文体：報告書型の文書をである体で書き、文末に「だ」「だろう」「だった」を使わない規則は、`[Bunka2022]` のⅢ－１ ウに基づく。この規則を本プロジェクトの文書に限ることと、取扱説明書の扱いは、このプロジェクトの判断である。
- 定型的な言い回し：5類の分類と、言い換えを意味が変わらない場合に限る考え方は、`[Yomiyasu2026]` のコミット `c2ffae6` から着想を得た。文章は複製していない。例、適用範囲、技術用語の保護、書き手の判定に使わない制限は、このプロジェクトの判断である。
- その他の規則：見出し、箇条書き、会話の敬体、文体指定の優先、用語と表記、意味を維持する例、最終確認は、このプロジェクトが独自に定めたものである。

## Embedded local-checks

Apply this procedure before delivering reader-facing output. It covers progress messages as well as final answers and saved documents.

### Discover tools before declaring them unavailable

Inspect the host's full tool catalog, including deferred tools. Search by capability and name for textlint and zhtw-mcp. Absence from the initial list does not establish unavailability.

Prefer the project's configured textlint MCP server. Confirm its configuration matches the output language and genre. If MCP is unavailable, use the project's pinned local CLI. Do not download a floating package for each answer.

For this repository, the maintained profiles are in `writing/profiles/`. If the skill was installed without this repository, discover the current project's configuration. Do not assume that the repository path exists beside the installed skill.

### Run the selected profile

Select `<language>.<genre>.json` explicitly. Supported languages are en-US, zh-TW, and ja-JP. Genres are document and conversation.

From the repository's `writing/` directory, a document check uses:

```powershell
node check.cjs --language ja-JP --genre document --stdin --stdin-filename draft.md
```

Provide the full draft through standard input. For a real file, pass its path instead of the stdin arguments.

The launcher rejects empty rule sets. The official MCP server uses the same configuration:

```powershell
node check.cjs --language ja-JP --genre document --mcp
```

Read the actual tool schema before calling `lintText` or `lintFile`. A virtual filename identifies the content type, not its language. For multilingual documents, use the repository's section-aware checker or separate the sections before linting.

For zh-TW, run [zhtw-checks.md](#embedded-zhtw-checks) after textlint. The tools have different responsibilities.

### Review, recheck, and report

Start in check-only mode. Review proposed changes against the original meaning. Limit automatic correction to two rounds. Never accept a change that alters a protected literal, number, condition, negation, scope, or certainty.

If a required document check remains blocked, report the location and unresolved finding. For advisory style findings, deliver the meaning-preserving draft and disclose a limitation when it affects the result.

If a tool is absent, denied, misconfigured, or times out, report that observed state. Perform the manual language checks. Do not report missing execution as a pass. Disclose unchanged degradation once, not in every progress message.

Record evidence when the task requires it. Do not add a self-evaluation or tool-success ritual to every answer. Checking an already sent message cannot establish a pre-delivery check.

### Sources

The full entries are in the [reference list](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md).

- Checker behavior: profiles, the CLI, the MCP server, and the `lintText` and `lintFile` tools follow `[Textlint1580]`.
- Japanese preset behavior follows `[TextlintRulePresetJaTechnicalWriting1202]`.
- English style rule behavior follows `[TextlintRuleWriteGood200]`.
- Zero-width space rule behavior follows `[TextlintRuleNoZeroWidthSpaces101]`.
- Project-authored rules: tool discovery, profile selection, the review and recheck limits, and the reporting rules.

These software citations describe tool behavior. They are not the source of the rule text.

## Embedded zhtw-checks

本流程保留原始 skill 的兩項要求：文字要容易理解，也要使用臺灣繁體中文。語言原則見 [zh-TW.md](#embedded-zh-tw)。

### 尋找與呼叫工具

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

### 判讀與修正

分別檢查臺灣用詞、AI 寫作痕跡與翻譯腔。分數只提供提示，不是文章品質的證明。不要另外維護通用的禁止用詞清單。

依修正範圍選擇模式：

- `orthographic`：修正標點與字形。
- `lexical_safe`：套用不改變語意的安全詞彙替換。
- `lexical_contextual`：需要上下文判斷，只在人工確認後使用。

自動修正最多執行兩輪。每次修改後，重新核對事實、數字、條件、否定、範圍與確定程度。再檢查最後要交付的文字。不要為了消除警告而接受錯誤替換。

專有名詞使用 `glossary.proper_nouns` 保護。專案偏好詞可以使用 `glossary.preferred` 表達，但仍須核對工具實際行為。一般詞彙誤判應依語境說明，不能任意放進專有名詞清單。

預設維持 `verify: false`。只有在使用者允許將文字送往外部翻譯服務時，才能啟用相關驗證。

### 工具不可用時

區分未安裝、未連線、權限遭拒、呼叫失敗與逾時。使用 [zh-TW.md](#embedded-zh-tw) 完成人工檢查，並在首次發生時交代未執行的檢查。只有在狀態改變或影響當次結果時，才重述相同限制。

若專案將該檢查列為必要關卡，未完成時必須回報阻擋。不得把人工檢查說成工具檢查成功。

### 資料來源

完整書目見[參考文獻清單](https://github.com/monkey1wizard/clear-writing-kit/blob/main/docs/references.md)。

- 工具參數與功能：`text`、`content_type`、`fix_mode`、`detect_style`、`verify`、`translationese_domain` 與 `glossary` 等參數，以及修正模式的行為，依據 `[ZhtwMCP]`。本專案不指定該工具的版本。使用前仍須讀取宿主提供的實際參數結構。
- 本專案自訂的規則：本檔其餘內容，包括尋找工具、交付前檢查、修正輪數上限、判讀方式、外部驗證限制，以及工具不可用時的回報方式。
