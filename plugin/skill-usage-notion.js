// OpenCode プラグイン：チーム用スキルが読み込まれたら、Notion の「スキル利用ログ」DB に1件記録する。
//
// 導入（各メンバー）:
//   ln -s ~/.config/opencode/skills/team-skills/plugin/skill-usage-notion.js ~/.config/opencode/plugins/
// 設定ファイル ~/.config/opencode/skill-usage.json（Git には入れない）:
//   { "notionToken": "ntn_...", "skillsDataSourceId": "...", "logsDataSourceId": "..." }
//
// 「スキル一覧」DB に載っているスキル（＝チーム用）だけを記録し、個人用スキルは記録しない。
import { readFileSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { basename, join } from "node:path";

const NOTION_VERSION = "2025-09-03";

function loadConfig() {
  try {
    return JSON.parse(readFileSync(join(homedir(), ".config/opencode/skill-usage.json"), "utf8"));
  } catch {
    return null;
  }
}

export default async ({ $, directory }) => {
  const config = loadConfig();
  if (!config?.notionToken) return {};

  const user = (await $`git config user.name`.quiet().nothrow().text()).trim() || userInfo().username;
  const skillPageIds = new Map(); // スキル名 → スキル一覧のページID（見つからなければ null）

  async function notion(method, path, body) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }

  async function findSkillPage(name) {
    if (!skillPageIds.has(name)) {
      const res = await notion("POST", `/data_sources/${config.skillsDataSourceId}/query`, {
        filter: { property: "名前", title: { equals: name } },
        page_size: 1,
      });
      skillPageIds.set(name, res.results[0]?.id ?? null);
    }
    return skillPageIds.get(name);
  }

  async function record(name, sessionID) {
    const skillPageId = await findSkillPage(name);
    if (!skillPageId) return; // 個人用スキルなど、一覧にないものは記録しない
    await notion("POST", "/pages", {
      parent: { type: "data_source_id", data_source_id: config.logsDataSourceId },
      properties: {
        名前: { title: [{ text: { content: `${name} / ${user}` } }] },
        スキル: { relation: [{ id: skillPageId }] },
        利用者: { rich_text: [{ text: { content: user } }] },
        日時: { date: { start: new Date().toISOString() } },
        プロジェクト: { rich_text: [{ text: { content: basename(directory) } }] },
        セッションID: { rich_text: [{ text: { content: sessionID ?? "" } }] },
      },
    });
  }

  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "skill" || !output.args?.name) return;
      // 記録の失敗で作業を止めないよう、待たずに投げて失敗は握りつぶす
      record(output.args.name, input.sessionID).catch((err) => console.error("[skill-usage-notion]", err.message));
    },
  };
};
