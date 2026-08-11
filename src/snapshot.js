// ==========================================================================
// 德文原文出处的网页存档 — 抓取 data/poems/*.json 中所有 german_sources 的 URL，
// 把页面当时的状态保存到本地 snapshots/，供日后核验。
//
// 用法：
//   node src/snapshot.js              # 只抓尚未存档的 URL（增量，可反复运行）
//   node src/snapshot.js --refresh    # 重抓全部 URL（更新已有存档）
//   node src/snapshot.js --only zeno  # 只处理 URL 含该子串的来源
//
// 产物：
//   snapshots/raw/<id>.html   抓取到的原始字节（存档正本，SHA-256 记录在清单中）
//   snapshots/manifest.json   清单：URL → 文件名 / 抓取时间 / HTTP 状态 / 哈希 / 标题
//
// 站点只发布由正本渲染出的**纯文本**存档页（见 templates.js），不转发第三方页面
// 自身的脚本与版式：存档的用途是核对诗歌正文，不是镜像别人的网站。
// ==========================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import path from "node:path";
import { loadPoemRecords } from "./poem-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "poems");
const SNAP_DIR = path.join(ROOT, "snapshots");
const RAW_DIR = path.join(SNAP_DIR, "raw");
const MANIFEST = path.join(SNAP_DIR, "manifest.json");

const USER_AGENT =
  "Mozilla/5.0 (compatible; deutsche-gedichte-lernen/0.1; Quellenarchiv; +https://github.com/zydo/deutsche-gedichte-lernen)";
const TIMEOUT_MS = 30000;
const CONCURRENCY = 4;
const DELAY_MS = 400; // 每次请求之间的礼貌间隔

// ---- 工具 ----

export function snapshotId(url) {
  let host = "unknown";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* URL 不合法时用占位主机名，仍按哈希区分 */
  }
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 12);
  return `${host.replace(/[^a-z0-9.-]/gi, "-")}-${hash}`;
}

function collectSources() {
  const byUrl = new Map();
  const { poems } = loadPoemRecords(DATA_DIR);
  for (const poem of poems) {
    for (const s of poem.german_sources || []) {
      if (!s.url) continue;
      if (!byUrl.has(s.url)) byUrl.set(s.url, { url: s.url, name: s.name || "", poems: [] });
      byUrl.get(s.url).poems.push(poem.slug);
    }
  }
  return [...byUrl.values()];
}

function loadManifest() {
  if (!existsSync(MANIFEST)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf-8"));
  } catch {
    console.warn("⚠️  manifest.json 无法解析，将重新生成");
    return {};
  }
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 200) : "";
}

async function fetchOne(src) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(src.url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    const buf = Buffer.from(await res.arrayBuffer());
    // 多数目标站点是 UTF-8；ISO-8859-1 的页面按 latin1 解码，避免变音字母乱码
    const ct = res.headers.get("content-type") || "";
    const charset = /charset=([\w-]+)/i.exec(ct)?.[1]?.toLowerCase() || "";
    const enc = /8859-1|windows-1252|latin1/.test(charset) ? "latin1" : "utf-8";
    const html = buf.toString(enc);
    return {
      ok: res.ok,
      http_status: res.status,
      final_url: res.url && res.url !== src.url ? res.url : undefined,
      content_type: ct || undefined,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      title: extractTitle(html),
      html,
    };
  } catch (e) {
    return { ok: false, http_status: 0, error: e.name === "AbortError" ? `超时（${TIMEOUT_MS}ms）` : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const refresh = args.includes("--refresh");
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

  mkdirSync(RAW_DIR, { recursive: true });
  const manifest = loadManifest();

  let sources = collectSources();
  if (only) sources = sources.filter((s) => s.url.includes(only));

  const todo = sources.filter((s) => {
    const prev = manifest[s.url];
    return refresh || !prev || !prev.ok || !existsSync(path.join(RAW_DIR, prev.file || ""));
  });

  console.log(
    `德文原文出处共 ${sources.length} 个 URL，本次需抓取 ${todo.length} 个${refresh ? "（--refresh 全量重抓）" : ""}。`,
  );
  if (!todo.length) {
    console.log("全部已有存档，无需抓取。");
    return 0;
  }

  let done = 0,
    failed = 0;
  const queue = [...todo];

  async function worker() {
    while (queue.length) {
      const src = queue.shift();
      const r = await fetchOne(src);
      const id = snapshotId(src.url);
      const file = `${id}.html`;
      done++;
      if (r.ok && r.html) {
        writeFileSync(path.join(RAW_DIR, file), r.html, "utf-8");
        manifest[src.url] = {
          id,
          file,
          ok: true,
          fetched_at: new Date().toISOString(),
          http_status: r.http_status,
          final_url: r.final_url,
          content_type: r.content_type,
          bytes: r.bytes,
          sha256: r.sha256,
          title: r.title,
          name: src.name,
          poems: src.poems,
        };
        console.log(`  [${done}/${todo.length}] ✅ ${r.http_status} ${src.url}`);
      } else {
        failed++;
        manifest[src.url] = {
          ...(manifest[src.url] || {}),
          id,
          ok: false,
          attempted_at: new Date().toISOString(),
          http_status: r.http_status,
          error: r.error,
          name: src.name,
          poems: src.poems,
        };
        console.log(`  [${done}/${todo.length}] ❌ ${r.http_status || "ERR"} ${src.url} — ${r.error || "HTTP 错误"}`);
      }
      if (queue.length) await new Promise((res) => setTimeout(res, DELAY_MS));
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  // 清单按 URL 排序写出，保证 diff 稳定
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n", "utf-8");

  const okCount = Object.values(sorted).filter((r) => r.ok).length;
  console.log(`\n完成：本次成功 ${done - failed}，失败 ${failed}；清单内累计有效存档 ${okCount}/${sources.length}。`);
  if (failed) console.log("失败项可稍后重跑 node src/snapshot.js（增量模式只会重试失败与缺失的 URL）。");
  return failed;
}

run().then((failed) => {
  process.exitCode = failed ? 1 : 0;
});
