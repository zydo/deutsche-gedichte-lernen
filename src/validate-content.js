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

// 编号 34 起的新诗一律要求可复算的 public_domain 字段（批次 4 起的新版规则，
// 与 validate-sources.js 的 usesV2 门槛一致）。上界随批次扩容而取消。
function lintPublicDomain(poem) {
  const numericId = Number(poem.id);
  if (!Number.isFinite(numericId) || numericId < 34) return [];
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

// ==========================================================================
// §0.3 韵式自校验 —— 声明的韵式必须与正文实测的韵脚聚类一致（G8）
//
// 正向：页面写出「韵式 abab…」时，从 german_text 逐行取末词、按韵尾聚类、
//       转成规范字母串，与声明比对。
// 反向：tags/页眉声明了形式（十四行、交叉韵、叠句…）而正文没有任何
//       韵式或格律表述 → 同样报错。G2–G6 全属这一类。
// ==========================================================================

const RHYME_LETTERS = "abcdefghijklmnopqrstuvwxyz";
const RHYME_VOWELS = "aeiouyäöü";
const RHYME_WORD_RE = /[A-Za-zÄÖÜäöüßÀ-ÖØ-öø-ÿ]+/g;
// 末音节为弱读（Schwa）时，韵脚要往前一个音节取：schließen 的韵是 -ießen 而非 -en。
const SCHWA_TAIL_RE = /^e[nlmr]{0,2}$/;
const SCHEME_LETTERS = "[a-z]+(?:[\\s/|·–—-]*[a-z]+)*";
const SCHEME_DECL_RE = new RegExp(
  `(?:第\\s*([0-9一二三四五六七八九十]+)\\s*节(?:的)?\\s*)?韵式(?:为|是|：|:)?\\s*(${SCHEME_LETTERS})`,
  "g",
);
const NO_RHYME_RE = /没有韵式|无韵式|不押韵|无尾韵/;
// 页眉一旦声明这些形式，正文就必须给出韵式或格律表述（本站 §0.3）。
const FORM_TAGS = ["十四行", "交叉韵", "抱韵", "亚历山大体", "韵脚", "长行诗", "叠句", "对句"];
const FORM_EVIDENCE_RE =
  /韵式|押韵|韵脚|尾韵|抱韵|交叉韵|随韵|对句|格律|音步|音节|抑扬格|扬抑格|Reim|Vers(?:maß|zeile)/;

function rhymeLastWord(line) {
  const words = String(line ?? "").match(RHYME_WORD_RE);
  return words ? words[words.length - 1] : "";
}

function foldRhymeWord(word) {
  return (
    word
      .toLowerCase()
      .replace(/æ/g, "ä")
      .replace(/œ/g, "ö")
      .replace(/[àáâãå]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõ]/g, "o")
      .replace(/[ùúû]/g, "u")
      .replace(/[^a-zäöüß]/g, "")
      // qu = /kv/：Qual 的 u 不是元音，否则韵尾会误取成 -ual 而不与 Zahl 相押。
      .replace(/qu/g, "kv")
  );
}

// 只归并「同音不同写」：长音 h、重复元音、ie、chs/x、ck/tz 等。
// 按规格，ä/ö/ü 不与 a/o/u 归并（ä 与 e 同音，故并入 e）；ss/ß 归并。
function rhymeSoundKey(tail) {
  return (
    tail
      .replace(/ß/g, "ss")
      // 长音 h 只在不接元音时脱落：sehn → -en，但 sehen 仍是双音节 -ehen（阴性韵）。
      .replace(/([aeiouyäöü])h(?![aeiouyäöü])/g, "$1")
      .replace(/äu/g, "eu")
      .replace(/ai/g, "ei")
      .replace(/ä/g, "e")
      .replace(/aa/g, "a")
      .replace(/ee/g, "e")
      .replace(/oo/g, "o")
      .replace(/ie/g, "i")
      .replace(/chs/g, "ks")
      .replace(/x/g, "ks")
      .replace(/ph/g, "f")
      .replace(/th/g, "t")
      .replace(/dt/g, "t")
      .replace(/ck/g, "k")
      .replace(/tz/g, "ts")
      .replace(/([bcdfgklmnprstv])\1/g, "$1")
      // 词尾清化（Auslautverhärtung）：Tod 与 Gott、Wind 与 findt 在德语里是真押韵。
      .replace(/b$/, "p")
      .replace(/d$/, "t")
      .replace(/g$/, "k")
  );
}

function vowelGroupStarts(word) {
  const starts = [];
  let inGroup = false;
  for (let index = 0; index < word.length; index += 1) {
    const isVowel = RHYME_VOWELS.includes(word[index]);
    if (isVowel && !inGroup) starts.push(index);
    inGroup = isVowel;
  }
  return starts;
}

function rhymeKey(word) {
  const folded = foldRhymeWord(word);
  const starts = vowelGroupStarts(folded);
  if (!starts.length) return folded;
  let start = starts[starts.length - 1];
  if (starts.length > 1 && SCHWA_TAIL_RE.test(folded.slice(start))) start = starts[starts.length - 2];
  return rhymeSoundKey(folded.slice(start));
}

// 逐行末词 → { 行号, 节号, 末词, 韵尾键 }，叠句等豁免行标 exempt。
//
// rhyme_groups 显式声明的行组会覆盖自动聚类，两种用途：
//   (a) 不纯韵（unreiner Reim）：stille/Hülle 写法不同音也不同，但诗人当作一个韵；
//   (b) 非重读词尾：schnurrend/murrend 的 -end 不重读，自动聚类会把它误并到
//       behend/rennt 的重读 -end 上。重音位置无法由拼写推出，只能显式声明。
function rhymeLines(poem) {
  const exempt = new Set((poem.rhyme_exempt_lines || []).map(Number));
  const merged = new Map();
  (poem.rhyme_groups || []).forEach((group, index) => {
    for (const line of group) merged.set(Number(line), `=${index}`);
  });

  const lines = [];
  let lineNumber = 0;
  (poem.german_text || []).forEach((stanza, stanzaIndex) => {
    (Array.isArray(stanza) ? stanza : []).forEach((line) => {
      lineNumber += 1;
      const word = rhymeLastWord(line);
      lines.push({
        line: lineNumber,
        stanza: stanzaIndex + 1,
        word,
        key: merged.get(lineNumber) || rhymeKey(word),
        exempt: exempt.has(lineNumber),
      });
    });
  });
  return lines;
}

function rhymeLetter(index) {
  if (index < 26) return RHYME_LETTERS[index];
  return RHYME_LETTERS[Math.floor(index / 26) - 1] + RHYME_LETTERS[index % 26];
}

function schemeOf(entries, shared = new Map()) {
  return entries
    .filter((entry) => !entry.exempt)
    .map((entry) => {
      if (!shared.has(entry.key)) shared.set(entry.key, rhymeLetter(shared.size));
      return shared.get(entry.key);
    })
    .join("");
}

function byStanza(lines) {
  const groups = [];
  for (const entry of lines) {
    const index = entry.stanza - 1;
    (groups[index] ||= []).push(entry);
  }
  return groups.map((group) => group || []);
}

// 本站三种合法写法：①全诗连续编字母（跨节复用同韵）②逐节重新编字母 ③各节同型时只写一节。
function measuredSchemes(lines) {
  const stanzas = byStanza(lines);
  const global = schemeOf(lines);
  const perStanza = stanzas.map((stanza) => schemeOf(stanza));
  const variants = new Map([
    ["全诗连续编号", global],
    ["逐节重新编号", perStanza.join("")],
  ]);
  const nonEmpty = perStanza.filter(Boolean);
  if (nonEmpty.length > 1 && nonEmpty.every((scheme) => scheme === nonEmpty[0])) {
    variants.set("各节同型（只写一节）", nonEmpty[0]);
  }
  return { variants, global, perStanza };
}

// 一条声明可以只覆盖诗的一段（如十四行诗只讲两个四行节）。
// 合法范围限定为「连续若干个完整诗节」，避免任意截断蒙混过关。
function schemeWindows(lines) {
  const stanzas = byStanza(lines).filter((stanza) => stanza.length);
  const windows = new Set();
  for (let start = 0; start < stanzas.length; start += 1) {
    for (let end = start + 1; end <= stanzas.length; end += 1) {
      const slice = stanzas.slice(start, end).flat();
      for (const scheme of measuredSchemes(slice).variants.values()) windows.add(scheme);
    }
  }
  return windows;
}

function normalizeDeclared(text) {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

function stanzaNumber(token) {
  return /^\d+$/.test(token) ? Number(token) : chineseNumber(token);
}

function lineRoster(entries) {
  return entries
    .map((entry) => `${entry.line}. ${entry.word || "—"}${entry.exempt ? "（豁免）" : `[${entry.key}]`}`)
    .join("　");
}

function lintRhymeScheme(poem) {
  const errors = [];
  const warnings = [];
  const texts = teachingTexts(poem);
  const corpus = texts.map(({ text }) => text).join("\n");
  const lines = rhymeLines(poem);
  if (!lines.length) return { errors, warnings };

  const declaredIrregular = poem.rhyme_scheme === "irregular";
  const declaredNone = NO_RHYME_RE.test(corpus);

  // —— 反向校验：页眉声明了形式，正文必须给出韵式/格律表述 ——
  const formTags = (poem.tags || []).filter((tag) => FORM_TAGS.some((form) => String(tag).includes(form)));
  if (formTags.length && !FORM_EVIDENCE_RE.test(corpus)) {
    errors.push({
      code: "rhyme-missing",
      poem: poem.slug,
      message: `页眉声明了形式（tags: ${formTags.join("、")}），正文未给出任何韵式或格律表述`,
    });
  }

  if (declaredIrregular && !/不规则/.test(corpus)) {
    errors.push({
      code: "rhyme-irregular",
      poem: poem.slug,
      message: 'rhyme_scheme 为 "irregular" 时，正文必须写明「押韵不规则」并给出实际韵脚清单',
    });
  }

  // —— 正向校验：逐条比对声明的字母串 ——
  for (const { path, text } of texts) {
    SCHEME_DECL_RE.lastIndex = 0;
    for (const match of text.matchAll(SCHEME_DECL_RE)) {
      const declared = normalizeDeclared(match[2]);
      if (declared.length < 2) continue;
      const scopeToken = match[1];
      const scope = scopeToken ? stanzaNumber(scopeToken) : null;
      const entries = scope ? lines.filter((entry) => entry.stanza === scope) : lines;

      if (scope && !entries.length) {
        errors.push({
          code: "rhyme-scope",
          poem: poem.slug,
          path,
          message: `声明了第 ${scope} 节的韵式，但本诗只有 ${byStanza(lines).length} 节`,
        });
        continue;
      }

      const singles = [...new Set([...declared])].filter((letter) => declared.split(letter).length - 1 === 1);
      if (singles.length) {
        warnings.push(
          `[${poem.slug}] 声明「韵式 ${match[2].trim()}」中的字母 ${singles.join("、")} 只出现一次，` +
            "即这些行被声明为不入韵，请确认。",
        );
      }

      const { variants } = measuredSchemes(entries);
      if ([...variants.values()].includes(declared)) continue;
      if (!scope && schemeWindows(entries).has(declared)) continue;

      const measured = [...variants.entries()].map(([label, scheme]) => `${label} ${scheme}`).join(" / ");
      errors.push({
        code: "rhyme-scheme",
        poem: poem.slug,
        path,
        message:
          `${scope ? `第 ${scope} 节韵式` : "韵式"}声明与实测不符\n` +
          `   声明：${declared}\n` +
          `   实测：${measured}\n` +
          `   逐行末词：${lineRoster(entries)}`,
      });
    }
  }

  if (declaredIrregular || declaredNone) {
    return { errors: errors.filter((error) => error.code !== "rhyme-scheme"), warnings };
  }
  return { errors, warnings };
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
  const warnings = [];
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

  // pending 骨架（如 51–54 的 2027 年预置条目）占着自己的编号：它们不出现在目录里，
  // 但编号已被预留，因此连续性按「已发布 + pending」一起算，且不得被新诗顶掉。
  const pendingPoems = pending.map(({ poem }) => poem);
  const reservedIds = new Map(
    pendingPoems.filter((poem) => poem.id !== undefined).map((poem) => [String(poem.id), poem]),
  );
  for (const poem of poems) {
    const reserved = reservedIds.get(String(poem.id));
    if (reserved) {
      errors.push({
        code: "id-reserved",
        poem: poem.slug,
        message: `编号 ${poem.id} 已被 pending 条目 ${reserved.slug || "?"} 预留，不得复用`,
      });
    }
  }

  const numericIds = [...poems, ...pendingPoems]
    .map((poem) => Number(poem.id))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  numericIds.forEach((id, index) => {
    if (index && id !== numericIds[index - 1] && id !== numericIds[index - 1] + 1) {
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
    const rhyme = lintRhymeScheme(poem);
    errors.push(...rhyme.errors);
    warnings.push(...rhyme.warnings);
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

  errors.warnings = warnings;
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
  for (const warning of errors.warnings || []) console.log(`⚠️  ${warning}`);
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
  lintRhymeScheme,
  rhymeKey,
  rhymeLines,
  validateContent,
};
