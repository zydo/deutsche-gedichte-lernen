// ==========================================================================
// 静态网站构建脚本 — 读取 data/poems/*.json，生成 dist/ 静态页面
// 用法：node src/build.js
// ==========================================================================
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  renderIndex,
  renderPoemPage,
  renderAbout,
  renderSnapshotPage,
  warnMissingTemplateFields,
} from "./templates.js";
import { loadPoemRecords } from "./poem-data.js";
import { formatContentErrors, validateContent } from "./validate-content.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "poems");
const DIST_DIR = path.join(ROOT, "dist");
const PUBLIC_DIR = path.join(ROOT, "public");
const SNAP_DIR = path.join(ROOT, "snapshots");

function validatePoem(p, filename) {
  // prettier-ignore
  const required = [
    "id", "slug", "author", "author_zh", "title_de", "title_zh", "year",
    "collection", "period", "difficulty", "tags", "german_text",
    "translation_zh", "vocab", "verb_forms", "grammar_notes",
    "cultural_notes", "translation_notes", "image_prompt",
    "german_sources", "translation_sources", "verification_notes", "line_notes",
  ];
  const missing = required.filter((k) => p[k] === undefined || p[k] === null);
  if (missing.length) {
    console.warn(`⚠️  [${filename}] 缺少字段: ${missing.join(", ")}`);
  }
  if (!Array.isArray(p.german_sources) || p.german_sources.length < 1) {
    console.warn(`⚠️  [${filename}] 德文原文来源少于 1 个`);
  }
}

function copyFileFlat(src, dest) {
  if (!existsSync(src)) {
    console.warn(`⚠️  静态资源不存在，跳过: ${src}`);
    return;
  }
  const data = readFileSync(src);
  writeFileSync(dest, data);
}

function pruneGeneratedFiles(directory, expectedNames, shouldPrune = () => true) {
  if (!existsSync(directory)) return 0;
  let removed = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || expectedNames.has(entry.name) || !shouldPrune(entry.name)) continue;
    unlinkSync(path.join(directory, entry.name));
    removed++;
  }
  return removed;
}

// ---- 出处快照 ----

// snapshots/manifest.json 由 src/snapshot.js 生成；没有它时构建照常进行，只是不渲染快照链接。
function loadSnapshots() {
  const manifestPath = path.join(SNAP_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    console.warn("⚠️  未找到 snapshots/manifest.json，本次构建不生成出处快照（先运行 npm run snapshot）");
    return null;
  }
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (e) {
    console.warn(`⚠️  snapshots/manifest.json 解析失败，跳过快照: ${e.message}`);
    return null;
  }
}

function buildSnapshotPages(snapshots, poems) {
  const entries = Object.entries(snapshots).filter(([, snap]) => snap && snap.ok);
  const outDir = path.join(DIST_DIR, "snapshots");
  mkdirSync(outDir, { recursive: true });
  const expectedNames = new Set();

  const bySlug = new Map(poems.map((p) => [p.slug, p]));
  let written = 0,
    missing = 0;

  for (const [url, snap] of entries) {
    const rawPath = path.join(SNAP_DIR, "raw", snap.file || "");
    if (!existsSync(rawPath)) {
      console.warn(`⚠️  快照正本缺失，跳过: ${snap.file} (${url})`);
      missing++;
      continue;
    }
    const raw = readFileSync(rawPath, "utf-8");
    const usedBy = (snap.poems || []).map((s) => bySlug.get(s)).filter(Boolean);
    const html = renderSnapshotPage({ ...snap, url }, raw, usedBy);
    const outputName = `${snap.id}.html`;
    writeFileSync(path.join(outDir, outputName), html, "utf-8");
    expectedNames.add(outputName);
    written++;
  }
  const removed = pruneGeneratedFiles(outDir, expectedNames, (name) => name.endsWith(".html"));
  console.log(`   出处快照页 ${written} 个${missing ? `（${missing} 个正本缺失）` : ""}`);
  return removed;
}

function build() {
  // 不清空整个 dist/；只同步由本脚本全权生成的 poems、snapshots 与 images
  // 三个目录，避免重命名或删除内容后留下无法再访问的旧文件。
  mkdirSync(DIST_DIR, { recursive: true });
  mkdirSync(path.join(DIST_DIR, "poems"), { recursive: true });

  const records = loadPoemRecords(DATA_DIR);
  const poems = records.poems;
  console.log(`读取到 ${poems.length} 首已发布诗歌数据、${records.pending.length} 个 pending 条目。`);

  for (const poem of poems) warnMissingTemplateFields(poem);
  const contentErrors = validateContent(records);
  if (contentErrors.length) {
    throw new Error(`内容 lint 失败：\n${formatContentErrors(contentErrors)}`);
  }

  const seenSlugs = new Set();
  for (const p of poems) {
    validatePoem(p, p.slug || p.id);
    if (seenSlugs.has(p.slug)) {
      throw new Error(`重复的 slug: ${p.slug}`);
    }
    seenSlugs.add(p.slug);
  }

  // index
  writeFileSync(path.join(DIST_DIR, "index.html"), renderIndex(poems), "utf-8");

  // about
  writeFileSync(path.join(DIST_DIR, "about.html"), renderAbout(poems), "utf-8");

  const snapshots = loadSnapshots();
  const snapshotMap = snapshots || {};

  // poem pages
  poems.forEach((p, i) => {
    const prev = i > 0 ? poems[i - 1] : null;
    const next = i < poems.length - 1 ? poems[i + 1] : null;
    const html = renderPoemPage(p, prev, next, snapshotMap);
    writeFileSync(path.join(DIST_DIR, "poems", `${p.slug}.html`), html, "utf-8");
  });
  let pruned = pruneGeneratedFiles(
    path.join(DIST_DIR, "poems"),
    new Set(poems.map((poem) => `${poem.slug}.html`)),
    (name) => name.endsWith(".html"),
  );

  if (snapshots) pruned += buildSnapshotPages(snapshots, poems);

  // 静态资源逐文件复制（不用目录级 cpSync，便于对缺失文件单独告警）
  copyFileFlat(path.join(PUBLIC_DIR, "style.css"), path.join(DIST_DIR, "style.css"));
  copyFileFlat(path.join(PUBLIC_DIR, "favicon.svg"), path.join(DIST_DIR, "favicon.svg"));

  // 复制配图：public/images/* → dist/images/*
  const imagesSrcDir = path.join(PUBLIC_DIR, "images");
  if (existsSync(imagesSrcDir)) {
    const imagesDestDir = path.join(DIST_DIR, "images");
    mkdirSync(imagesDestDir, { recursive: true });
    const imageNames = new Set();
    for (const entry of readdirSync(imagesSrcDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      imageNames.add(entry.name);
      copyFileFlat(path.join(imagesSrcDir, entry.name), path.join(imagesDestDir, entry.name));
    }
    pruned += pruneGeneratedFiles(imagesDestDir, imageNames);
  }

  // GitHub Pages 默认会用 Jekyll 处理产物（忽略以 _ 开头的文件等），加 .nojekyll 原样发布
  writeFileSync(path.join(DIST_DIR, ".nojekyll"), "", "utf-8");

  console.log(
    `✅ 构建完成：dist/index.html, dist/about.html, ${poems.length} 个诗歌页面${pruned ? `；清理 ${pruned} 个过期生成文件` : ""}`,
  );
}

build();
