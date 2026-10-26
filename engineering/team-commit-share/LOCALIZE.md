# ローカライズ項目

| キー | 内容 | 例 | 必須 |
|---|---|---|---|
| SLACK_CHANNEL_NAME | 共有先の Slack チャンネル名 | #times-yamada | ○ |
| SLACK_CHANNEL_ID | 共有先の Slack チャンネルの ID（チャンネル詳細の最下部に表示） | C0123456789 | ○ |
| WORK_ROOT | 共有の対象にするリポジトリを置いているフォルダ | ~/Documents/Web | ○ |
| SLACK_TOKEN_FILE | Slack のボットトークン（`SLACK_BOT_TOKEN=xoxb-...`）を書いたファイルのパス。トークンは Slack アプリの「OAuth & Permissions」で発行し、`chat:write` 権限を付ける。ファイルは `chmod 600` にする | ~/.config/opencode/secrets/slack.env | ○ |
