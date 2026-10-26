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
common/   全員向け
sales/    営業向け
```

- 1スキル = 1フォルダ（`<スキル名>/SKILL.md`）
- スキル名は `team-` から始め、個人用スキル（`my-`）と重複しないようにします
