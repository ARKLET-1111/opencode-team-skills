---
name: team-skill-publish
description: Use when the user wants to share, publish, or commit a skill to the team skills repository (チームに共有, スキルを公開, team-skills にコミット). Reviews the skill for secrets and environment-specific information, masks them with placeholders, then commits via a pull request.
---

# team-skill-publish

スキルをチーム用リポジトリ（`~/.config/opencode/skills/team-skills/`）に追加・更新するときの手順です。
**機密情報や個人の環境に依存する情報をマスキングしてから**コミットします。リポジトリは Public のため、この手順を省略してはいけません。

## 1. 対象を確認する

- 共有するスキルのフォルダ（例：`~/.config/opencode/skills/my-xxx/`）と、分類フォルダ（`common/`・`engineering/` など）をユーザーに確認する。
- チーム用のスキル名は `team-` で始める。個人用の `my-xxx` を共有する場合は `team-xxx` に改名し、`SKILL.md` の `name` も合わせる。
- 作業前に `git -C ~/.config/opencode/skills/team-skills pull` で最新化し、作業用ブランチを作る（例：`git switch -c add-team-xxx`）。

## 2. 精査する

スキルフォルダ内の**すべてのファイル**（`SKILL.md`、参考資料、スクリプト）を読み、次に当てはまる箇所を一覧にする。

| 区分 | 例 |
|---|---|
| 認証情報 | API キー、トークン、パスワード、秘密鍵、Webhook URL、`.env` の値 |
| 個人情報 | 氏名、メールアドレス、電話番号、住所 |
| 社外秘・顧客情報 | 取引先名、案件名、金額、社内ドキュメントの URL |
| サービス固有の ID | Notion の DB/ページ ID、Slack のチャンネル/ユーザー ID、Google Drive のフォルダ ID、スプレッドシート ID |
| 環境依存の値 | `/Users/<名前>/...` などの絶対パス、ホスト名、社内ドメイン、個人のアカウント名 |

判断に迷うものは「マスキング候補」として残し、ユーザーに確認する。

## 3. マスキングする

- 該当箇所を `{{LOCAL:キー名}}` の形式のプレースホルダーに置き換える（キー名は英大文字とアンダースコア。例：`{{LOCAL:SLACK_CHANNEL_ID}}`、`{{LOCAL:WORK_DIR}}`）。
- 同じ値は同じキー名にそろえる。
- 汎用化できる記述（特定の顧客名を含む例文など）は、プレースホルダーにせず一般的な表現に書き換えてよい。
- 認証情報は**キー名だけ**を残し、値はどこにも書かない。取得方法（「Notion のインテグレーション画面で発行」など）を説明に書く。
- スキルフォルダに `LOCALIZE.md` を作成（既にあれば更新）し、プレースホルダーの一覧を書く。

```markdown
# ローカライズ項目

| キー | 内容 | 例 | 必須 |
|---|---|---|---|
| SLACK_CHANNEL_ID | 週報を投稿する Slack チャンネルの ID | C0123456789 | ○ |
| WORK_DIR | 週報の下書きを保存するフォルダ | ~/Documents/weekly | ○ |
```

- `SKILL.md` の本文の先頭に、次の一文を入れる（既にあれば不要）。

```markdown
> このスキル内の `{{LOCAL:キー名}}` は、`~/.config/opencode/skill-local.json` の `"<スキル名>"` に設定した値で読み替えてください。値が未設定の場合は team-skill-localize スキルで設定するよう案内してください。
```

## 4. ユーザーに確認する

コミット前に必ず次を提示し、了承を得る。

- マスキングした箇所の一覧（ファイル名・元の内容の種類・置き換えたキー名）。**元の値そのものは表示しない。**
- 汎用化のために書き換えた箇所
- `git diff` の要約

## 5. 最終チェックしてコミットする

1. 次のコマンドで、取りこぼしがないか確認する。ヒットした場合は手順 3 に戻る。

```bash
cd ~/.config/opencode/skills/team-skills
git diff --cached --name-only; git status --short
grep -rInE '(ntn_|secret_|sk-|ghp_|xox[bp]-[0-9]|AKIA|-----BEGIN|/Users/[^/{ ]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,})' <スキルフォルダ>
```

2. `git add <スキルフォルダ>` → `git commit`（メッセージに「何のスキルか」と「マスキングした項目数」を書く）→ `git push -u origin <ブランチ名>`
3. `gh pr create` で Pull Request を作成し、本文にマスキング項目（キー名のみ）を記載する。
4. PR の URL をユーザーに伝える。main へのマージはレビュー後に行う。

## 禁止事項

- マスキング前の値を、コミット・PR 本文・コミットメッセージに含めない。
- `~/.config/opencode/skill-local.json` をリポジトリにコピー・コミットしない。
- main ブランチに直接 push しない。
