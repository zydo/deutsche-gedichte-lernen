// ==========================================================================
// 来源独立性校验 — 依据 SOURCES.md 的规则检查 data/poems/*.json
// 用法：node src/validate-sources.js   （或 npm run check）
//
// 背景：gedichte7.de 与 zgedichte.de 由同一运营方（Heiko Possel）维护，
// 曾被误当作两个独立来源。本脚本把"什么算独立来源"变成可机器检查的规则。
// ==========================================================================
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadPoemRecords } from "./poem-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "poems");

// 运营方分组 —— 与 SOURCES.md 第 3 节保持一致。新增站点请同时更新两处。
const OPERATOR_GROUPS = [
  { id: "possel", tier: 3, hosts: ["gedichte7.de", "zgedichte.de"] },
  { id: "zeno", tier: 1, hosts: ["zeno.org"] },
  { id: "textlog", tier: 1, hosts: ["textlog.de"] },
  { id: "kalliope", tier: 1, hosts: ["kalliope.org"] },
  { id: "wikimedia", tier: 1, hosts: ["wikipedia.org", "wikisource.org"] },
  { id: "deutschelyrik", tier: 2, hosts: ["deutschelyrik.de"] },
  { id: "planetlyrik", tier: 2, hosts: ["planetlyrik.de"] },
  { id: "liedernet", tier: 2, hosts: ["lieder.net"] },
  { id: "textarchiv", tier: 2, hosts: ["textarchiv.com"] },
  { id: "aphorismen", tier: 2, hosts: ["aphorismen.de"] },
  { id: "wortwuchs", tier: 3, hosts: ["wortwuchs.net"] },
  { id: "augustana", tier: 1, hosts: ["hs-augsburg.de", "bibliotheca-augustana.net"] },
  { id: "ldm", tier: 1, hosts: ["ldm-digital.de"] },
  { id: "liederlexikon", tier: 1, hosts: ["liederlexikon.de", "deutscheslied.com"] },
  { id: "gutenberg", tier: 1, hosts: ["projekt-gutenberg.org", "gutenberg.org"] },
  { id: "volksliedarchiv", tier: 1, hosts: ["volksliedarchiv.de"] },
  { id: "liederprojekt", tier: 2, hosts: ["liederprojekt.org"] },
  { id: "heidelberg", tier: 1, hosts: ["digi.ub.uni-heidelberg.de"] },
  { id: "dta", tier: 1, hosts: ["deutschestextarchiv.de"] },
  { id: "archive", tier: 1, hosts: ["archive.org"] },
  { id: "freiburger", tier: 2, hosts: ["freiburger-anthologie.ub.uni-freiburg.de"] },
];

function classify(source) {
  const hay = `${source.url || ""} ${source.name || ""}`.toLowerCase();
  const declaredTier = Number(source.tier);
  for (const g of OPERATOR_GROUPS) {
    if (g.hosts.some((h) => hay.includes(h))) {
      return { ...g, tier: [1, 2, 3].includes(declaredTier) ? declaredTier : g.tier };
    }
  }
  return {
    id: "unknown:" + (source.url || source.name || "?").slice(0, 40),
    tier: [1, 2, 3].includes(declaredTier) ? declaredTier : 3,
    hosts: [],
  };
}

function loadPoems() {
  return loadPoemRecords(DATA_DIR).published.map(({ relativeFile, poem }) => ({ file: relativeFile, poem }));
}

function check() {
  const poems = loadPoems();
  let errors = 0,
    warns = 0;
  const report = [];

  for (const { file, poem } of poems) {
    const srcs = Array.isArray(poem.german_sources) ? poem.german_sources : [];
    const groups = srcs.map(classify);
    const distinct = [...new Set(groups.map((g) => g.id))];
    // 去掉三级来源后，还剩几个互相独立的组？
    const qualifying = [...new Set(groups.filter((g) => g.tier <= 2).map((g) => g.id))];
    const hasTier1 = groups.some((g) => g.tier === 1);

    const problems = [];
    const numericId = Number(poem.id);
    const usesV2 = Number.isFinite(numericId) && numericId >= 34;

    if (usesV2) {
      if (srcs.length < 3) problems.push({ level: "ERROR", msg: `来源仅 ${srcs.length} 条（新版规则 A 要求 ≥3）` });
      if (distinct.length < 3)
        problems.push({
          level: "ERROR",
          msg: `仅 ${distinct.length} 个独立运营方组 [${distinct.join(", ")}]（新版规则 B 要求 ≥3）`,
        });
      const missingTier = srcs.filter((source) => ![1, 2, 3].includes(Number(source.tier)));
      if (missingTier.length)
        problems.push({ level: "ERROR", msg: `${missingTier.length} 条来源未显式标注 tier（新版规则 D）` });
      const tier1Sources = srcs.filter((source, index) => groups[index].tier === 1);
      if (!tier1Sources.length) problems.push({ level: "ERROR", msg: "无一级来源（新版规则 D）" });
      for (const source of tier1Sources) {
        const citation = `${source.citation || ""} ${source.name || ""} ${source.note || ""}`;
        // 印刷本按页码（S./Seite/p./页）核验；中古/早期抄本按 folio（fol./folio/f.）或 shelfmark 核验。
        const hasAnchor =
          /(?:S\.|Seite|p\.|页码|第\s*\d+\s*页)\s*\d+/i.test(citation) ||
          /\bfol(?:io|\.)?\s*\d/i.test(citation) ||
          /\b(?:cpg|cod|ms|hs|HB)\s*[\w.-]*\d/i.test(citation) ||
          /\b(?:Nr\.|Nrn\.|Nr)\s*\.?\s*\d/i.test(citation) ||
          /\bBuch\s+[IVXLCDM\dA-Za-zÄÖÜäöü]/i.test(citation);
        if (!source.citation || !hasAnchor) {
          problems.push({
            level: "ERROR",
            msg: `一级来源缺少结构化纸本版次/页码（或抄本 folio/shelfmark）citation：${source.url || source.name || "?"}`,
          });
        }
      }
    } else {
      if (srcs.length < 2) problems.push({ level: "ERROR", msg: `来源仅 ${srcs.length} 条（legacy 规则 A 要求 ≥2）` });
      if (srcs.length >= 2 && distinct.length < 2)
        problems.push({ level: "ERROR", msg: `全部来源同属运营方组「${distinct[0]}」（违反 legacy 规则 B）` });
      if (qualifying.length < 2)
        problems.push({
          level: "WARN",
          msg: `去掉三级来源后仅剩 ${qualifying.length} 个独立组 [${qualifying.join(", ") || "无"}] —— 需补一个一级/二级来源`,
        });
      if (!hasTier1)
        problems.push({ level: "WARN", msg: "无一级来源（数字化全集/校勘版），可信度偏低（legacy 规则 D）" });
    }

    const level = problems.some((p) => p.level === "ERROR") ? "ERROR" : problems.length ? "WARN" : "OK";
    if (level === "ERROR") errors++;
    else if (level === "WARN") warns++;

    report.push({ id: poem.id, slug: poem.slug, file, level, problems, groups: groups.map((g) => g.id) });
  }

  // ---- 输出 ----
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`来源独立性校验 — 依据 SOURCES.md\n共 ${poems.length} 首\n`);

  for (const r of report.filter((r) => r.level !== "OK")) {
    console.log(`${r.level === "ERROR" ? "❌" : "⚠️ "} [${r.id}] ${pad(r.slug, 34)} ${r.groups.join(" + ")}`);
    for (const p of r.problems) console.log(`      ${p.level}: ${p.msg}`);
  }

  const ok = report.filter((r) => r.level === "OK");
  if (ok.length) {
    console.log(`\n✅ 通过 ${ok.length} 首：`);
    for (const r of ok) console.log(`   [${r.id}] ${pad(r.slug, 34)} ${r.groups.join(" + ")}`);
  }

  console.log(`\n合计：${errors} 个 ERROR，${warns} 个 WARN，${ok.length} 个通过。`);
  if (errors) console.log("发布前必须清零 ERROR。");
  else if (warns) console.log("无 ERROR。WARN 项应在后续录入中逐步补齐独立来源。");
  return errors;
}

const errorCount = check();
process.exitCode = errorCount ? 1 : 0;
