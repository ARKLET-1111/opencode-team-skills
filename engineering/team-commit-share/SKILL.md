---
name: team-commit-share
description: Use when the user asks to commit changes (コミットして, commit). After committing, share the commit summary to the user's own Slack channel (e.g. a times channel).
---

# team-commit-share

> このスキル内の `{{LOCAL:キー名}}` は、`~/.config/opencode/skill-local.json` の `"team-commit-share"` に設定した値で読み替えてください。値が未設定の場合は team-skill-localize スキルで設定するよう案内してください。

コミットするたびに、その内容を Slack の {{LOCAL:SLACK_CHANNEL_NAME}}（チャンネルID：`{{LOCAL:SLACK_CHANNEL_ID}}`）に共有する。

## 1. コミットする

1. `git status` と `git diff` で変更内容を確認する。
2. 変更内容に合ったコミットメッセージを日本語で作り、ユーザーに見せてからコミットする。
3. 対象は `{{LOCAL:WORK_ROOT}}` 配下のリポジトリ。それ以外の場所ではコミットだけ行い、共有するか確認する。

## 2. 共有する内容を作る

次の情報を集める。

```bash
git rev-parse --short HEAD
git branch --show-current
git log -1 --format=%s
git diff --stat HEAD~1 HEAD | tail -1
git remote get-url origin
```

投稿文の形式：

```
:white_check_mark: コミットしたよ（<リポジトリ名> / <ブランチ名>）
> <コミットメッセージ>
変更：<n> files changed, +<追加行> / -<削除行>
<GitHub のコミット URL>
```

- GitHub のコミット URL は `origin` の URL から `https://github.com/<owner>/<repo>/commit/<ハッシュ>` の形で作る。
- push していないコミットの場合は URL の代わりに「（未 push）」と書く。

## 3. Slack に投稿する

トークンは `{{LOCAL:SLACK_TOKEN_FILE}}` に `SLACK_BOT_TOKEN=xoxb-...` の形で保存してある。会話やログにトークンを表示しない。

```bash
source {{LOCAL:SLACK_TOKEN_FILE}}
curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$(jq -n --arg ch {{LOCAL:SLACK_CHANNEL_ID}} --arg text "$TEXT" '{channel:$ch, text:$text}')"
```

- レスポンスの `ok` が `true` なら完了。`false` の場合は `error` の内容をユーザーに伝える。
- 投稿したら、投稿内容と {{LOCAL:SLACK_CHANNEL_NAME}} に共有したことをユーザーに報告する。
