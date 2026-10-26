# opencode-team-skills

OpenCode 用のチーム共有スキル置き場です。

## 使い方

```bash
git clone https://github.com/ARKLET-1111/opencode-team-skills.git ~/.config/opencode/skills/team-skills
```

OpenCode は `~/.config/opencode/skills/` 配下をサブフォルダまで自動で探すため、追加の設定は不要です。
更新は `git -C ~/.config/opencode/skills/team-skills pull` で反映されます。

## 構成

```text
common/       全員向け
engineering/  エンジニア向け
```

- 1スキル = 1フォルダ（`<スキル名>/SKILL.md`）
- スキル名は `team-` から始め、個人用スキル（`my-`）と重複しないようにします

## Notion 連携（スキル一覧・利用ログ）

| 仕組み | 内容 |
|---|---|
| スキル一覧の同期 | main に push されると GitHub Actions（`.github/workflows/sync-skills.yml`）が `scripts/sync-skills-to-notion.mjs` を実行し、Notion の「スキル一覧」DB を更新します（説明・作成者・最終更新者・更新回数など）。リポジトリから消えたスキルは「削除済み」になります。 |
| 利用ログの記録 | OpenCode プラグイン（`plugin/skill-usage-notion.js`）が、チーム用スキルの読み込みを Notion の「スキル利用ログ」DB に1件ずつ記録します。「スキル一覧」にないスキル（個人用）は記録しません。 |
| 利用回数 | 「スキル一覧」DB の「累計利用回数」に、利用ログの件数が自動集計されます。 |

### リポジトリ側の設定（管理者・初回のみ）

- Secrets: `NOTION_TOKEN`（Notion インテグレーションのトークン）
- Variables: `NOTION_SKILLS_DATA_SOURCE_ID`（「スキル一覧」DB のデータソースID）

### メンバー側の設定（各自・初回のみ）

```bash
mkdir -p ~/.config/opencode/plugins
ln -s ~/.config/opencode/skills/team-skills/plugin/skill-usage-notion.js ~/.config/opencode/plugins/
```

`~/.config/opencode/skill-usage.json` を作成します（トークンを含むため Git には入れないでください）。

```json
{
  "notionToken": "ntn_xxxxxxxx",
  "skillsDataSourceId": "「スキル一覧」DB のデータソースID",
  "logsDataSourceId": "「スキル利用ログ」DB のデータソースID"
}
```

設定後に OpenCode を再起動すると記録が始まります。
