# accurate-answer

[English](#english) | [繁體中文](#繁體中文) | [日本語](#日本語)

## English

### Purpose and language support

This repository provides writing rules for coding agents and Web assistants. Accuracy comes first, clarity second, and plain language third. The rules cover en-US, zh-TW, and ja-JP.

The guidance applies the reader outcomes of ISO 24495-1. English also uses selected structural principles associated with ASD-STE100. This repository does not claim full compliance with either standard.

### Choose the right files

| Use | Location | How to use it |
| --- | --- | --- |
| Coding-agent replies and documents | [coding-agent-writing](skills/coding-agent-writing/SKILL.md) | Install this folder through your agent's skill manager |
| ChatGPT Web or Gemini Web skills | [web-answer-writing](web-skills/web-answer-writing/SKILL.md) | Upload the generated ZIP in a supported skill interface |
| ChatGPT Custom Instructions | [chatgpt.md](web-instructions/chatgpt.md) | Paste only the text inside the block |
| Instructions for Gemini | [gemini.md](web-instructions/gemini.md) | Paste only the text inside the block |
| Claude Code output style | [generate-output-style.py](scripts/generate-output-style.py) | Generate the file, then select it in Claude Code |

Only the coding-agent skill belongs in the local skill search path. The Web skill uses browser-session tools and bundled language references. The instruction files are account preferences, not another installed skill.

Feature availability and limits depend on the account and product. Check the current [ChatGPT skill instructions](https://help.openai.com/en/articles/20001066-skills-in-chatgpt) and [Gemini skill instructions](https://support.google.com/gemini/answer/17094296) before uploading. For Gemini, use the Spark skill interface. Uploading a file into an ordinary chat does not establish persistent skill activation.

### Shared rules and local checks

The maintained source is `skills/coding-agent-writing/`. Its references contain the accuracy rules and language guidance. The Web generator copies the shared references and inserts the canonical instruction excerpt into both platform texts. Platform-specific steps live in `scripts/templates/`.

Coding agents must discover available writing tools before declaring them unavailable. They use the selected textlint configuration and also use zhtw-mcp for zh-TW when available. The Chinese tool procedure is preserved in [zhtw-checks.md](skills/coding-agent-writing/references/zhtw-checks.md).

The Web skill includes manual review steps for sessions without writing tools. A tool failure is not a successful check. Mechanical checks do not establish factual accuracy or natural language quality.

### Generate and use the files

Requirements: Python 3.10 or newer for generation, plus Node.js 20.18 or newer and npm for local writing checks. Run these commands from the repository root.

Preview in a new temporary directory:

```powershell
python scripts/generate-web-artifacts.py
```

Update the Web files and build the uploadable skill:

```powershell
python scripts/generate-web-artifacts.py --update
python scripts/generate-web-artifacts.py --output-dir build/web --archive-dir build/packages
```

Upload `build/packages/web-answer-writing.zip`. Its root contains `SKILL.md`. For account instructions, copy the relevant block from `web-instructions/`. Read the limits displayed by your account. The ChatGPT block uses a conservative packaging budget of 1,500 characters.

The Gemini text preserves your request for date checks and search, direct tone, no-follow-up preference, and Taiwan-specific Chinese wording. It also requires an honest statement when search or date verification is unavailable. These files do not change online accounts.

Generate and check a Claude output-style preview:

```powershell
python scripts/generate-output-style.py --output build/accurate-answer.md
python scripts/generate-output-style.py --output build/accurate-answer.md --check
```

Without `--output`, the generator writes `~/.claude/output-styles/accurate-answer.md`. It does not select the output style in a conversation.

### Verify changes

```powershell
npm --prefix writing ci
npm --prefix writing run lint
npm --prefix writing test
python scripts/generate-web-artifacts.py --check
python -m unittest discover -s tests -v
```

The text checker selects each README language section separately. It also checks skill instructions and generated account text. The six profiles in `writing/profiles/` distinguish language and genre. Run zhtw-mcp on the final Chinese draft through the host's MCP connection.

Tests check generation, routing, failure handling, and protected content. They do not prove that an online account loaded the skill or that every future answer follows it. Japanese naturalness still needs review by a proficient reader.

### Migrate the original skill

The original `skills/accurate-answer/` becomes `skills/coding-agent-writing/`. Update the selected skill in your installation manager, including ccync if it manages the installation. Do not install both names. Keep the existing Claude output-style name `accurate-answer`.

This repository does not edit global agent settings. The [rule migration record](docs/rule-migration.md) explains where the original requirements now live. The [checker reference](docs/writing-checks.md) documents rule scope and examples.

## 繁體中文

### 用途與語言支援

本儲存庫提供 coding agents 與 Web 助理使用的寫作規則。優先順序是準確、清楚、淺白。支援語言為 en-US、zh-TW 與 ja-JP。

規則採用 ISO 24495-1 的讀者成果原則。英文另採部分 ASD-STE100 結構原則。本儲存庫不宣稱完全符合這兩項標準。

### 選擇適合的檔案

| 用途 | 位置 | 使用方式 |
| --- | --- | --- |
| coding-agent 回答與文件 | [coding-agent-writing](skills/coding-agent-writing/SKILL.md) | 使用代理程式的技能管理工具安裝此資料夾 |
| ChatGPT Web 或 Gemini Web 技能 | [web-answer-writing](web-skills/web-answer-writing/SKILL.md) | 在支援技能的介面上傳產生的 ZIP |
| ChatGPT 自訂指示 | [chatgpt.md](web-instructions/chatgpt.md) | 只貼上文字區塊內容 |
| 給 Gemini 的指令 | [gemini.md](web-instructions/gemini.md) | 只貼上文字區塊內容 |
| Claude Code 輸出樣式 | [generate-output-style.py](scripts/generate-output-style.py) | 產生檔案後，在 Claude Code 選取樣式 |

本機技能搜尋路徑只放 coding-agent skill。Web skill 會讀取隨附的語言參考，並使用網站對話提供的工具。自訂指示是帳號偏好設定，不是另一個需要安裝的技能。

功能與限制因帳號及產品而異。上傳前，請查閱最新的 [ChatGPT 技能說明](https://help.openai.com/en/articles/20001066-skills-in-chatgpt)與 [Gemini 技能說明](https://support.google.com/gemini/answer/17094296)。Gemini 請使用 Spark 的技能介面。把檔案上傳到一般聊天，不等於啟用常駐技能。

### 共用規則與本機檢查

規則來源位於 `skills/coding-agent-writing/`。參考檔案保存準確性原則與各語言規則。Web 產生器複製共用參考，並將同一份指示摘要插入兩個平台的文字。平台專用步驟保存在 `scripts/templates/`。

coding agents 必須先探索可用的寫作工具，才能判斷工具是否不存在。代理程式使用所選的 textlint 設定。處理繁中時，若 zhtw-mcp 可用，也必須呼叫。原本的中文工具流程保留於 [zhtw-checks.md](skills/coding-agent-writing/references/zhtw-checks.md)。

若網站對話沒有寫作工具，Web skill 會要求人工檢查。工具執行失敗不能算檢查成功。機械檢查也不能證明事實正確或文字自然。

### 產生與使用檔案

產生器需要 Python 3.10 以上版本。本機文字檢查需要 Node.js 20.18 以上版本及 npm。請在儲存庫根目錄執行以下命令。

在新的暫存目錄預覽：

```powershell
python scripts/generate-web-artifacts.py
```

更新 Web 檔案並建立可上傳的技能：

```powershell
python scripts/generate-web-artifacts.py --update
python scripts/generate-web-artifacts.py --output-dir build/web --archive-dir build/packages
```

上傳 `build/packages/web-answer-writing.zip`。ZIP 根目錄包含 `SKILL.md`。設定帳號指示時，請複製 `web-instructions/` 中對應檔案的文字區塊。請以帳號介面顯示的限制為準。ChatGPT 文字採 1,500 字元的保守封裝上限。

Gemini 文字保留你要求的日期與搜尋流程、直接語氣、不主動追問，以及臺灣繁體中文用詞。若搜尋或日期查證不可用，指示會要求如實說明。這些檔案不會修改線上帳號。

產生並檢查 Claude 輸出樣式預覽：

```powershell
python scripts/generate-output-style.py --output build/accurate-answer.md
python scripts/generate-output-style.py --output build/accurate-answer.md --check
```

若未指定 `--output`，產生器會寫入 `~/.claude/output-styles/accurate-answer.md`。產生器不會替對話選取輸出樣式。

### 驗證變更

```powershell
npm --prefix writing ci
npm --prefix writing run lint
npm --prefix writing test
python scripts/generate-web-artifacts.py --check
python -m unittest discover -s tests -v
```

文字檢查器分別檢查 README 的各語言區塊，也檢查技能指示與產生的帳號文字。`writing/profiles/` 內的六份設定分開處理語言與文體。最後的繁中草稿另由宿主的 MCP 連線呼叫 zhtw-mcp 檢查。

測試涵蓋產生、規則選擇、失敗處理與內容保護。測試不能證明線上帳號已載入技能，也不能保證未來每則回答都遵守規則。日文自然度仍需熟練讀者評閱。

### 遷移原有技能

原本的 `skills/accurate-answer/` 改為 `skills/coding-agent-writing/`。請在安裝管理工具更新選用的技能。若由 ccync 管理，請使用 ccync 調整。不要同時安裝新舊兩個名稱。Claude 輸出樣式維持原本的 `accurate-answer` 名稱。

本儲存庫不會修改全域代理程式設定。[規則遷移紀錄](docs/rule-migration.md)說明原本要求的新位置。[檢查器說明](docs/writing-checks.md)列出規則範圍與範例。

## 日本語

### 目的と対応言語

このリポジトリは、コーディングエージェントとWebアシスタント向けの文章規則を提供する。正確性、明確さ、平易さの順に優先する。対応言語はen-US、zh-TW、ja-JPである。

ISO 24495-1の読者中心の原則を採用している。英語には、ASD-STE100の一部の構成原則も適用する。いずれの規格についても、完全準拠を表明するものではない。

### 使用するファイルの選択

| 用途 | 場所 | 使用方法 |
| --- | --- | --- |
| コーディングエージェントの回答と文書 | [coding-agent-writing](skills/coding-agent-writing/SKILL.md) | エージェントのスキル管理ツールでフォルダーをインストールする |
| ChatGPT WebとGemini Webのスキル | [web-answer-writing](web-skills/web-answer-writing/SKILL.md) | 対応するスキル画面で生成済みZIPをアップロードする |
| ChatGPTのカスタム指示 | [chatgpt.md](web-instructions/chatgpt.md) | テキストブロックの内容だけを貼り付ける |
| Geminiへの指示 | [gemini.md](web-instructions/gemini.md) | テキストブロックの内容だけを貼り付ける |
| Claude Codeの出力スタイル | [generate-output-style.py](scripts/generate-output-style.py) | ファイルを生成し、Claude Codeで選択する |

ローカルのスキル検索先には、コーディングエージェント用のスキルだけを配置する。Web用スキルは、会話で使えるツールと同梱の言語資料を使用する。アカウントへの指示は、設定用の文章である。インストールするスキルではない。

利用できる機能と制限は、アカウントや製品によって異なる。アップロード前に、最新の[ChatGPTのスキル説明](https://help.openai.com/en/articles/20001066-skills-in-chatgpt)と[Geminiのスキル説明](https://support.google.com/gemini/answer/17094296)を確認する。Geminiでは、Sparkのスキル画面を使う。通常の会話にファイルを添付しても、常設スキルの有効化にはならない。

### 共通規則とローカル検査

規則の原本は `skills/coding-agent-writing/` にある。参照ファイルには、正確性の原則と言語別の規則を保存する。Web用の生成処理は、共通の参照ファイルをコピーする。両サービスの指示文には、同じ原本から指示の要約を挿入する。サービス固有の手順は `scripts/templates/` にある。

コーディングエージェントは、ツールが使えないと判断する前に、利用可能なツールを探す。選択した設定でtextlintを実行する。繁体字中国語では、zhtw-mcpが利用できる場合に呼び出す。元の中国語の検査手順は、[zhtw-checks.md](skills/coding-agent-writing/references/zhtw-checks.md)に保持している。

Webの会話で検査ツールが使えない場合は、文章を手動で確認する。ツールの実行失敗を検査成功として扱わない。機械的な検査は、事実の正確性や文章の自然さを証明しない。

### ファイルの生成と利用

生成処理にはPython 3.10以降が必要である。ローカルの文章検査には、Node.js 20.18以降とnpmが必要である。次のコマンドは、リポジトリのルートで実行する。

新しい一時フォルダーにプレビューを生成する。

```powershell
python scripts/generate-web-artifacts.py
```

Web用ファイルを更新し、アップロード用のスキルを作成する。

```powershell
python scripts/generate-web-artifacts.py --update
python scripts/generate-web-artifacts.py --output-dir build/web --archive-dir build/packages
```

`build/packages/web-answer-writing.zip` をアップロードする。ZIPのルートには `SKILL.md` がある。アカウントへの指示には、`web-instructions/` 内の対応するテキストブロックを使う。文字数の制限は、アカウントの画面で確認する。ChatGPT用の文章は、余裕を持たせて1,500文字以内に収める。

Gemini用の文章は、日付確認と検索、簡潔な回答、不要な質問の省略、台湾の繁体字中国語という利用者の要件を維持する。検索や日付確認ができない場合は、その制限を明示する。これらのファイルは、オンラインアカウントを変更しない。

Claudeの出力スタイルを生成し、プレビューを確認する。

```powershell
python scripts/generate-output-style.py --output build/accurate-answer.md
python scripts/generate-output-style.py --output build/accurate-answer.md --check
```

`--output` を省略すると、生成先は `~/.claude/output-styles/accurate-answer.md` になる。生成処理は、会話で使う出力スタイルを選択しない。

### 変更内容の検証

```powershell
npm --prefix writing ci
npm --prefix writing run lint
npm --prefix writing test
python scripts/generate-web-artifacts.py --check
python -m unittest discover -s tests -v
```

検査処理は、READMEの言語区画を個別に確認する。スキルの指示と生成済みのアカウント用文章も対象である。`writing/profiles/` には、言語と文体を分けた6つの設定がある。最終版の繁体字中国語は、ホストのMCP接続からzhtw-mcpでも確認する。

テストでは、生成、規則の選択、失敗時の処理、内容の保護を確認する。オンラインアカウントでの読み込みや、将来の回答すべてが規則に従うことは証明しない。日本語の自然さは、習熟した読者による確認も必要である。

### 既存スキルの移行

従来の `skills/accurate-answer/` は、`skills/coding-agent-writing/` に変わる。インストール管理ツールで、使用するスキルを更新する。ccyncで管理している場合は、ccync側で変更する。新旧のスキルを同時にインストールしない。Claudeの出力スタイル名は `accurate-answer` のままである。

このリポジトリは、エージェントのグローバル設定を変更しない。[規則の移行記録](docs/rule-migration.md)に、元の要件の移行先を記載する。[検査ツールの説明](docs/writing-checks.md)には、規則の範囲と例を記載する。
