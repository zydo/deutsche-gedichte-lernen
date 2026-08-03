// ==========================================================================
// 静态网站构建脚本 — 读取 data/poems/*.json，生成 dist/ 静态页面
// 用法：node src/build.js
// ==========================================================================
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderIndex, renderPoemPage, renderAbout } from "./templates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "poems");
const DIST_DIR = path.join(ROOT, "dist");
const PUBLIC_DIR = path.join(ROOT, "public");

function loadPoems() {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const poems = files.map((f) => {
    const raw = readFileSync(path.join(DATA_DIR, f), "utf-8");
    try {
      return JSON.parse(raw);
    } catch (e) {
      throw new Error(`JSON 解析失败: ${f} — ${e.message}`);
    }
  });
  poems.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return poems;
}

function validatePoem(p, filename) {
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

function build() {
  // 注意：本环境的 outputs 目录禁止删除已写入的文件/目录，因此构建脚本采用
  // "覆盖写入"而非"先删除再重建"的策略；如需彻底清理旧文件，请手动删除 dist/ 后再次构建。
  mkdirSync(DIST_DIR, { recursive: true });
  mkdirSync(path.join(DIST_DIR, "poems"), { recursive: true });

  const poems = loadPoems();
  console.log(`读取到 ${poems.length} 首诗歌数据。`);

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
  writeFileSync(path.join(DIST_DIR, "about.html"), renderAbout(poems.length), "utf-8");

  // poem pages
  poems.forEach((p, i) => {
    const prev = i > 0 ? poems[i - 1] : null;
    const next = i < poems.length - 1 ? poems[i + 1] : null;
    const html = renderPoemPage(p, prev, next);
    writeFileSync(path.join(DIST_DIR, "poems", `${p.slug}.html`), html, "utf-8");
  });

  // copy static assets（逐文件复制，避免部分沙箱环境下目录级 cpSync 的权限限制）
  // 注意：输出文件名为 theme.css（而非 style.css），因为构建过程中 dist/style.css
  // 曾被一次失败的目录复制操作占用为 0 字节的只读文件，此沙箱环境下的 outputs 目录
  // 不允许覆盖/删除已创建的文件，故改用新文件名规避该问题。
  copyFileFlat(path.join(PUBLIC_DIR, "style.css"), path.join(DIST_DIR, "theme.css"));
  copyFileFlat(path.join(PUBLIC_DIR, "favicon.svg"), path.join(DIST_DIR, "favicon.svg"));

  // 复制配图：public/images/* → dist/images/*
  const imagesSrcDir = path.join(PUBLIC_DIR, "images");
  if (existsSync(imagesSrcDir)) {
    const imagesDestDir = path.join(DIST_DIR, "images");
    mkdirSync(imagesDestDir, { recursive: true });
    for (const f of readdirSync(imagesSrcDir)) {
      copyFileFlat(path.join(imagesSrcDir, f), path.join(imagesDestDir, f));
    }
  }

  // GitHub Pages 默认会用 Jekyll 处理产物（忽略以 _ 开头的文件等），加 .nojekyll 原样发布
  writeFileSync(path.join(DIST_DIR, ".nojekyll"), "", "utf-8");

  console.log(`✅ 构建完成：dist/index.html, dist/about.html, ${poems.length} 个诗歌页面`);
}

build();
