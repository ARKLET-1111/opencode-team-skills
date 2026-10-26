---
name: team-skill-localize
description: Use when the user wants to set up, localize, or customize team skills for their own environment after cloning or pulling the team skills repository (ローカライズ, 自分用に設定, マスキングされた値を設定, プレースホルダーを埋める). Fills {{LOCAL:...}} placeholders via a local settings file without modifying the shared repository.
---

# team-skill-localize

チーム用スキルの `{{LOCAL:キー名}}`（マスキングされた値）を、自分の環境に合わせて設定する手順です。
**チーム用リポジトリ（`~/.config/opencode/skills/team-skills/`）のファイルは書き換えません。** 値はリポジトリの外にある設定ファイルに保存するため、`git pull` で更新しても設定は消えず、誤ってコミットされることもありません。

## 1. 対象を確認する

1. `git -C ~/.config/opencode/skills/team-skills pull` で最新化する。
2. リポジトリ内の `LOCALIZE.md` をすべて探し、スキルごとのプレースホルダー一覧を読む。

```bash
find ~/.config/opencode/skills/team-skills -name LOCALIZE.md -not -path '*/.git/*'
```

3. 設定ファイル `~/.config/opencode/skill-local.json` を読み（無ければ空として扱う）、スキルごとに「設定済み／未設定」を表にしてユーザーに見せる。値は「設定済み」とだけ表示し、中身は表示しない。
4. ユーザーが対象のスキルを指定していない場合は、未設定の項目があるスキルを対象にする。

## 2. 値を集める

未設定の項目（または変更したい項目）を、`LOCALIZE.md` の「内容」「例」を示しながらユーザーに質問する。

- パスやアカウント名など、手元で確認できるものは候補を調べて提示してよい（例：`ls ~/Documents`、`git config user.name`）。
- API キーやトークンなどの認証情報は、ユーザーに入力してもらう。会話の中で値を復唱しない。
- 「必須」でない項目は空のままでよい。

## 3. 設定ファイルに保存する

`~/.config/opencode/skill-local.json` に、スキル名ごとに保存する。既存の値は、ユーザーが変更を指示したもの以外は残す。

```json
{
  "team-weekly-report": {
    "SLACK_CHANNEL_ID": "C0123456789",
    "WORK_DIR": "~/Documents/weekly"
  }
}
```

保存後、認証情報を含むため権限を自分だけにする。

```bash
chmod 600 ~/.config/opencode/skill-local.json
```

## 4. 動作を確認する

- 対象スキルの `SKILL.md` に、`skill-local.json` の値で読み替える旨の一文があるか確認する。無い場合は、そのスキルの作成者に team-skill-publish の手順で追記してもらうよう伝える（このスキルではリポジトリを書き換えない）。
- 設定したスキルを一度呼び出してもらい、プレースホルダーが正しい値で使われることを確認する。

## 5. 値の読み替えだけでは足りない場合（個人用にカスタマイズ）

手順の追加・削除など、値の設定を超えてスキルの中身を変えたい場合は、個人用のコピーを作る。

1. チーム用スキルのフォルダを `~/.config/opencode/skills/my-<元の名前から team- を除いた名前>/` にコピーする（例：`team-weekly-report` → `my-weekly-report`）。
2. コピーした `SKILL.md` の `name` を新しいフォルダ名に変え、`description` の先頭に「（個人用）」と付ける。
3. プレースホルダーを実際の値に置き換え、必要な手順を変更する。
4. 個人用のコピーはチーム用リポジトリの外にあるため、`git pull` での更新は反映されない。元のスキルが更新されたら、差分を見て必要な部分を取り込む。

## 禁止事項

- `~/.config/opencode/skills/team-skills/` 配下のファイルを書き換えない。
- `skill-local.json` や個人用コピーの中身を、チーム用リポジトリにコミットしない。
