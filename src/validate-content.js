import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadPoemRecords } from "./poem-data.js";

const COUNT_FIELDS = ["line_notes", "vocab", "grammar_notes", "cultural_notes", "translation_notes"];
const COUNT_RE = /(?:共\s*)?([0-9]+|[零〇一二两三四五六七八九十百]+)\s*(例|次|处|个)([㐀-鿿A-Za-zäöüÄÖÜß-]{0,10})/g;
const COUNTABLE_NOUN_RE = /^(?:韵词|韵脚|命令式|祈使|实例|第二格|分词|主语|谓语|复合词|代词|动词)/;
const CROSS_TRIGGER_RE = /本站[^。！？\n]*(?:亦有|亦出现|中都标注过|可对照|对读|互为|同一族|同类|构成[^。！？\n]*对照)/;
const GHOST_TOKEN_RE = /\b(?:dies|diese|dieser|dieses|diesem|diesen)\s+[a-zäöüß][a-zäöüß-]*\s*(?:为|是)/i;

function flattenText(value, path = "") {
  if (typeof value === "string") return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => flattenText(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => flattenText(item, path ? `${path}.${key}` : key));
  }
  return [];
}

function teachingTexts(poem) {
  return COUNT_FIELDS.flatMap((field) => flattenText(poem[field], field));
}

function chineseNumber(value) {
  if (/^\d+$/.test(value)) return Number(value);
  if (/^([零〇一二两三四五六七八九])\1+$/.test(value)) value = value[0];
  const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (value === "十") return 10;
  if (value === "百") return 100;
  if (value.includes("百")) {
    const [hundreds, rest = ""] = value.split("百");
    return (digits[hundreds] || 1) * 100 + (rest ? chineseNumber(rest) : 0);
  }
  if (value.includes("十")) {
    const [tens, ones = ""] = value.split("十");
    return (tens ? digits[tens] : 1) * 10 + (ones ? digits[ones] : 0);
  }
  return [...value].reduce((sum, char) => sum * 10 + (digits[char] ?? 0), 0);
}

function sentenceAround(text, index) {
  const left = Math.max(
    text.lastIndexOf("。", index),
    text.lastIndexOf("！", index),
    text.lastIndexOf("？", index),
    -1,
  );
  const candidates = [text.indexOf("。", index), text.indexOf("！", index), text.indexOf("？", index)].filter(
    (n) => n >= 0,
  );
  const right = candidates.length ? Math.min(...candidates) + 1 : text.length;
  return text.slice(left + 1, right).trim();
}

function expandLineToken(token) {
  const clean = token.replace(/\s/g, "");
  const range = clean.match(/^(\d+)[—–-](\d+)$/);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (end < start) return [];
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }
  return /^\d+$/.test(clean) ? [Number(clean)] : [];
}

function extractLineNumbers(sentence) {
  const values = [];
  const patterns = [
    /第\s*([0-9、，,和及与—–\-\s]+)\s*行/g,
    /行号\s*[：:]?\s*([0-9、，,和及与—–\-\s]+)/g,
    /L(?:ines?)?\.?\s*([0-9,、—–\-\s]+)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of sentence.matchAll(pattern)) {
      const chunks = match[1].split(/[、，,和及与\s]+/).filter(Boolean);
      for (const chunk of chunks) values.push(...expandLineToken(chunk));
    }
  }
  return values;
}

function isCountAssertion(text, sentence, match) {
  const prefix = text.slice(Math.max(0, (match.index || 0) - 8), match.index || 0);
  const unit = match[2];
  const following = match[3] || "";

  // “第一个/第二次”等序数不声称全诗共有多少项。
  if (/第[0-9零〇一二两三四五六七八九十百]{0,5}$/.test(prefix)) return false;
  if (unit === "例") return !following.startsWith("证");
  if (unit === "处") return match[0].trimStart().startsWith("共");
  if (unit === "个") return COUNTABLE_NOUN_RE.test(following);
  if (unit === "次") {
    if (/各出现$/.test(prefix) || /^(?:标记|改革|大战|会议|出版|发表|访问|旅行|尝试|接触)/.test(following))
      return false;
    if (/谱曲|正字法改革/.test(sentence)) return false;
    return /全诗|本诗|诗中|正文|本节|出现|使用|重复|反复|诱惑|呼语|命令式|省音|异文/.test(sentence);
  }
  return false;
}

function lintCountAssertions(poem) {
  const errors = [];
  for (const { path, text } of teachingTexts(poem)) {
    COUNT_RE.lastIndex = 0;
    for (const match of text.matchAll(COUNT_RE)) {
      const expected = chineseNumber(match[1]);
      const sentence = sentenceAround(text, match.index || 0);
      if (!isCountAssertion(text, sentence, match)) continue;
      const matchOffset = sentence.indexOf(match[0]);
      const afterCount = matchOffset >= 0 ? sentence.slice(matchOffset + match[0].length) : sentence;
      const adjacentParen = afterCount.match(/^[^。！？；;]{0,6}（([^）]*行[^）]*)）/);
      const lines = extractLineNumbers(adjacentParen ? adjacentParen[1] : sentence);
      if (lines.length !== expected) {
        errors.push({
          code: "count-lines",
          poem: poem.slug,
          path,
          message: `计数“${match[0]}”要求 ${expected} 个行号，实际解析到 ${lines.length} 个${lines.length ? `（${lines.join("、")}）` : ""}`,
          excerpt: sentence,
        });
      }
    }
  }
  return errors;
}

function normalizeReference(reference) {
  if (!reference || typeof reference !== "object") return null;
  return {
    targetSlug: reference.target_slug,
    needle: reference.needle,
    context: reference.context || "",
    fields: reference.fields || null,
  };
}

function targetHaystack(target, fields) {
  if (!fields?.length) return JSON.stringify(target);
  return fields.map((field) => JSON.stringify(target[field] ?? "")).join("\n");
}

function lintCrossReferences(poem, bySlug) {
  const errors = [];
  const references = (poem.cross_references || []).map(normalizeReference).filter(Boolean);

  for (const reference of references) {
    const target = bySlug.get(reference.targetSlug);
    if (!target) {
      errors.push({
        code: "cross-target",
        poem: poem.slug,
        message: `断言页面 ${poem.slug} / 被点名页面 ${reference.targetSlug} / 目标不存在`,
      });
      continue;
    }
    if (!reference.needle || !targetHaystack(target, reference.fields).includes(reference.needle)) {
      errors.push({
        code: "cross-miss",
        poem: poem.slug,
        message: `断言页面 ${poem.slug} / 被点名页面 ${reference.targetSlug} / 未命中的词 ${reference.needle || "（空）"}`,
      });
    }
  }

  const names = [...bySlug.values()].map((target) => ({
    slug: target.slug,
    names: [target.title_de, target.title_zh, target.author, target.author_zh].filter(
      (name) => name && name.length >= 2,
    ),
  }));

  for (const { path, text } of teachingTexts(poem)) {
    const sentences = text.split(/(?<=[。！？\n])/).map((sentence) => sentence.trim());
    for (const sentence of sentences) {
      if (!CROSS_TRIGGER_RE.test(sentence)) continue;
      const mentioned = names.filter(
        ({ slug, names: targetNames }) => slug !== poem.slug && targetNames.some((name) => sentence.includes(name)),
      );
      if (!mentioned.length) continue;
      const covered = references.some(
        (reference) =>
          (!reference.context || sentence.includes(reference.context)) &&
          mentioned.some(({ slug }) => slug === reference.targetSlug),
      );
      if (!covered) {
        errors.push({
          code: "cross-undeclared",
          poem: poem.slug,
          path,
          message: `跨页断言未声明 cross_references：${sentence}`,
        });
      }
    }
  }
  return errors;
}

function stanzaShape(stanzas) {
  if (!Array.isArray(stanzas)) return [];
  return stanzas.map((stanza) => (Array.isArray(stanza) ? stanza.length : -1));
}

function sameShape(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function lintLineParity(poem) {
  const errors = [];
  const german = stanzaShape(poem.german_text);
  const chinese = stanzaShape(poem.translation_zh?.text);
  if (!sameShape(german, chinese)) {
    errors.push({
      code: "line-parity",
      poem: poem.slug,
      message: `德中逐行结构不一致：德文 [${german.join(",")}] / 中文 [${chinese.join(",")}]`,
    });
  }
  if (poem.text_nhd) {
    const nhd = stanzaShape(poem.text_nhd);
    if (!sameShape(german, nhd)) {
      errors.push({
        code: "line-parity-nhd",
        poem: poem.slug,
        message: `Mhd./Nhd. 逐行结构不一致：原文 [${german.join(",")}] / Nhd. [${nhd.join(",")}]`,
      });
    }
  }
  return errors;
}

function lintPublicDomain(poem) {
  const numericId = Number(poem.id);
  if (!Number.isFinite(numericId) || numericId < 34 || numericId > 50) return [];
  const info = poem.public_domain;
  if (!info) return [{ code: "public-domain", poem: poem.slug, message: "新诗缺少 public_domain 复算字段" }];
  if (Number.isInteger(info.death_year) && info.public_domain_year !== info.death_year + 71) {
    return [
      {
        code: "public-domain",
        poem: poem.slug,
        message: `公版年份错误：${info.death_year} + 71 应为 ${info.death_year + 71}，实际为 ${info.public_domain_year}`,
      },
    ];
  }
  if (!Number.isInteger(info.death_year) && !info.basis) {
    return [{ code: "public-domain", poem: poem.slug, message: "无确定卒年时必须在 public_domain.basis 说明公版依据" }];
  }
  return [];
}

function lintGhostTokens(poem) {
  const errors = [];
  for (const { path, text } of teachingTexts(poem)) {
    const match = text.match(GHOST_TOKEN_RE);
    if (match) {
      errors.push({
        code: "ghost-token",
        poem: poem.slug,
        path,
        message: `疑似幽灵 token：${match[0]}`,
      });
    }
  }
  return errors;
}

function lintPending(record, now = new Date()) {
  const poem = record.poem;
  const errors = [];
  if (poem.published !== false) return errors;
  if (!poem.release_date) {
    errors.push({
      code: "pending-release",
      poem: poem.slug || record.relativeFile,
      message: "pending 条目缺少 release_date",
    });
  }
  const beforeRelease = !poem.release_date || now < new Date(`${poem.release_date}T00:00:00Z`);
  if (beforeRelease) {
    const hasGermanText =
      Array.isArray(poem.german_text) &&
      poem.german_text.some((stanza) => Array.isArray(stanza) && stanza.some((line) => line.trim()));
    if (hasGermanText) {
      errors.push({
        code: "pending-text",
        poem: poem.slug || record.relativeFile,
        message: `${poem.release_date} 前 pending 条目不得写入德文正文`,
      });
    }
  }
  return errors;
}

function validateContent({ published, pending }, options = {}) {
  const errors = [];
  const poems = published.map(({ poem }) => poem);
  const bySlug = new Map();
  const byId = new Map();

  for (const poem of poems) {
    if (bySlug.has(poem.slug))
      errors.push({ code: "duplicate-slug", poem: poem.slug, message: `重复 slug: ${poem.slug}` });
    else bySlug.set(poem.slug, poem);
    if (byId.has(String(poem.id)))
      errors.push({ code: "duplicate-id", poem: poem.slug, message: `重复 id: ${poem.id}` });
    else byId.set(String(poem.id), poem);
  }

  const numericIds = poems
    .map((poem) => Number(poem.id))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  numericIds.forEach((id, index) => {
    if (index && id !== numericIds[index - 1] + 1) {
      errors.push({ code: "id-gap", poem: String(id), message: `编号不连续：${numericIds[index - 1]} 后为 ${id}` });
    }
  });

  for (const poem of poems) {
    const lineCount = (poem.german_text || []).reduce((sum, stanza) => sum + stanza.length, 0);
    poem.annotation_density = lineCount ? (poem.line_notes || []).length / lineCount : 0;
    errors.push(...lintLineParity(poem));
    errors.push(...lintCountAssertions(poem));
    errors.push(...lintCrossReferences(poem, bySlug));
    errors.push(...lintPublicDomain(poem));
    errors.push(...lintGhostTokens(poem));
  }

  for (const record of pending) errors.push(...lintPending(record, options.now));

  const genitivePages = poems.filter((poem) => JSON.stringify(poem).includes("前置第二格"));
  for (const poem of genitivePages) {
    const text = JSON.stringify(poem);
    if (poem.slug !== "haelfte-des-lebens" && (text.includes("荷尔德林") || text.includes("Hölderlin"))) {
      errors.push({
        code: "holderlin-genitive",
        poem: poem.slug,
        message: "“前置第二格”页面不得把荷尔德林列入本站已标注清单",
      });
    }
  }

  return errors;
}

function formatContentErrors(errors) {
  return errors
    .map(
      (error) =>
        `❌ [${error.poem || "?"}] ${error.code}${error.path ? ` @ ${error.path}` : ""}\n   ${error.message}${error.excerpt ? `\n   ${error.excerpt}` : ""}`,
    )
    .join("\n");
}

function runCli() {
  const records = loadPoemRecords();
  const errors = validateContent(records);
  console.log(`内容校验 — ${records.published.length} 首已发布，${records.pending.length} 个 pending`);
  if (errors.length) {
    console.log(`\n${formatContentErrors(errors)}\n\n合计：${errors.length} 个 ERROR。`);
    process.exitCode = 1;
  } else {
    console.log("✅ 内容 lint 全部通过。");
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) runCli();

export {
  chineseNumber,
  extractLineNumbers,
  flattenText,
  formatContentErrors,
  lintCountAssertions,
  lintCrossReferences,
  lintLineParity,
  lintPending,
  validateContent,
};
