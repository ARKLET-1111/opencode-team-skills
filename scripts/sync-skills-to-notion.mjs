// リポジトリ内の SKILL.md を走査し、Notion の「スキル一覧」DB に同期する。
// GitHub Actions（.github/workflows/sync-skills.yml）から main への push 時に実行される。
//
// 必要な環境変数:
//   NOTION_TOKEN                 Notion インテグレーションのトークン
//   NOTION_SKILLS_DATA_SOURCE_ID 「スキル一覧」DB のデータソースID
//   GITHUB_REPOSITORY            owner/repo（Actions では自動で入る）
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const NOTION_VERSION = "2025-09-03";
const ROOT = process.cwd();
const { NOTION_TOKEN, NOTION_SKILLS_DATA_SOURCE_ID, GITHUB_REPOSITORY } = process.env;
const BRANCH = process.env.GITHUB_REF_NAME || "main";

if (!NOTION_TOKEN || !NOTION_SKILLS_DATA_SOURCE_ID) {
  console.error("NOTION_TOKEN と NOTION_SKILLS_DATA_SOURCE_ID を設定してください");
  process.exit(1);
}

async function notion(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

// OpenCode と同じく、隠しフォルダと node_modules を除いて SKILL.md を探す（SKILL.md のあるフォルダの中は探さない）
function findSkillDirs(dir, depth = 0) {
  if (depth > 6) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  if (entries.some((e) => e.isFile() && e.name === "SKILL.md")) return [dir];
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules")
    .flatMap((e) => findSkillDirs(join(dir, e.name), depth + 1));
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return fm;
}

// 作成者 = 最初のコミット、最終更新者 = 最新のコミット、更新回数 = そのフォルダに触れたコミット数
function gitHistory(relDir) {
  const out = execFileSync("git", ["log", "--format=%an\t%aI", "--", relDir], { encoding: "utf8" }).trim();
  const commits = out ? out.split("\n").map((l) => l.split("\t")) : [];
  const latest = commits[0] ?? ["", ""];
  const first = commits.at(-1) ?? ["", ""];
  return { creator: first[0], createdAt: first[1], updater: latest[0], updatedAt: latest[1], count: commits.length };
}

const text = (s) => ({ rich_text: s ? [{ text: { content: s.slice(0, 2000) } }] : [] });
const date = (s) => ({ date: s ? { start: s } : null });

async function listExistingPages() {
  const pages = new Map();
  let cursor;
  do {
    const res = await notion("POST", `/data_sources/${NOTION_SKILLS_DATA_SOURCE_ID}/query`, {
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      const name = page.properties["名前"]?.title?.map((t) => t.plain_text).join("") ?? "";
      if (name) pages.set(name, page.id);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

const skills = findSkillDirs(ROOT).map((dir) => {
  const relDir = relative(ROOT, dir).split(sep).join("/");
  const fm = parseFrontmatter(readFileSync(join(dir, "SKILL.md"), "utf8"));
  const parts = relDir.split("/");
  return {
    name: fm.name || parts.at(-1),
    category: parts.length > 1 ? parts[0] : "",
    description: fm.description ?? "",
    url: GITHUB_REPOSITORY ? `https://github.com/${GITHUB_REPOSITORY}/tree/${BRANCH}/${relDir}` : null,
    ...gitHistory(relDir),
  };
});

const existing = await listExistingPages();

for (const s of skills) {
  const properties = {
    名前: { title: [{ text: { content: s.name } }] },
    分類: { select: s.category ? { name: s.category } : null },
    説明: text(s.description),
    GitHub: { url: s.url },
    作成者: text(s.creator),
    作成日: date(s.createdAt),
    最終更新者: text(s.updater),
    最終更新日: date(s.updatedAt),
    更新回数: { number: s.count },
    状態: { select: { name: "有効" } },
  };
  const pageId = existing.get(s.name);
  if (pageId) {
    await notion("PATCH", `/pages/${pageId}`, { properties });
    console.log(`更新: ${s.name}`);
  } else {
    await notion("POST", "/pages", {
      parent: { type: "data_source_id", data_source_id: NOTION_SKILLS_DATA_SOURCE_ID },
      properties,
    });
    console.log(`追加: ${s.name}`);
  }
}

// リポジトリから消えたスキルはページを残したまま「削除済み」にする（利用ログとの紐付けを保つため）
const current = new Set(skills.map((s) => s.name));
for (const [name, pageId] of existing) {
  if (current.has(name)) continue;
  await notion("PATCH", `/pages/${pageId}`, { properties: { 状態: { select: { name: "削除済み" } } } });
  console.log(`削除済みに変更: ${name}`);
}
