import test from "node:test";
import assert from "node:assert/strict";
import { loadPoemRecords } from "../src/poem-data.js";
import { renderPoemPage } from "../src/templates.js";
import {
  chineseNumber,
  extractLineNumbers,
  lintCountAssertions,
  lintCrossReferences,
  lintImageChecklist,
  lintLineParity,
  lintPending,
  lintRhymeScheme,
  rhymeKey,
} from "../src/validate-content.js";

function poem(overrides = {}) {
  return {
    id: "99",
    slug: "fixture",
    title_de: "Fixture",
    title_zh: "测试",
    author: "Test Author",
    author_zh: "测试作者",
    german_text: [["eins", "zwei", "drei"]],
    translation_zh: { text: [["一", "二", "三"]] },
    line_notes: [],
    vocab: [],
    grammar_notes: [],
    cultural_notes: "",
    translation_notes: "",
    ...overrides,
  };
}

test("parses Chinese numerals and line ranges", () => {
  assert.equal(chineseNumber("十三"), 13);
  assert.deepEqual(extractLineNumbers("共三处（第2、4–5行）"), [2, 4, 5]);
});

test("count lint accepts matching line list", () => {
  const fixture = poem({
    grammar_notes: [{ title: "复现", body: "全诗共三次出现该词（第1、2、3行）。" }],
  });
  assert.deepEqual(lintCountAssertions(fixture), []);
});

test("count lint rejects mismatching line list", () => {
  const fixture = poem({
    grammar_notes: [{ title: "复现", body: "全诗共三次出现该词（第1、3行）。" }],
  });
  const errors = lintCountAssertions(fixture);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /要求 3 个行号，实际解析到 2 个/);
});

test("cross-reference lint verifies target needle", () => {
  const source = poem({
    slug: "source",
    title_de: "Source",
    grammar_notes: [{ title: "对照", body: "本站《目标》中亦出现此词，可对照。" }],
    cross_references: [{ target_slug: "target", needle: "gesucht", context: "《目标》" }],
  });
  const target = poem({ slug: "target", title_de: "Target", title_zh: "目标", german_text: [["gesucht"]] });
  assert.deepEqual(
    lintCrossReferences(
      source,
      new Map([
        ["source", source],
        ["target", target],
      ]),
    ),
    [],
  );
});

test("cross-reference lint reports missing target term", () => {
  const source = poem({
    slug: "source",
    cross_references: [{ target_slug: "target", needle: "nicht-da" }],
  });
  const target = poem({ slug: "target" });
  const errors = lintCrossReferences(
    source,
    new Map([
      ["source", source],
      ["target", target],
    ]),
  );
  assert.equal(errors[0].code, "cross-miss");
  assert.match(errors[0].message, /source \/ 被点名页面 target \/ 未命中的词 nicht-da/);
});

test("line parity includes optional Nhd. text", () => {
  const fixture = poem({ text_nhd: [["eins", "zwei"]] });
  const errors = lintLineParity(fixture);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "line-parity-nhd");
});

test("pending entries cannot contain protected text before release", () => {
  const record = {
    relativeFile: "pending/example.json",
    poem: {
      slug: "pending-example",
      published: false,
      release_date: "2027-01-01",
      german_text: [["geschützter Text"]],
    },
  };
  const errors = lintPending(record, new Date("2026-08-10T00:00:00Z"));
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "pending-text");
});

test("image checklist agrees with an attached image", () => {
  const fixture = poem({
    image_path: "/images/fixture.png",
    checklist: [{ label: "生成 AI 配图（已接入）", done: true }],
  });
  assert.deepEqual(lintImageChecklist(fixture), []);
});

test("image checklist rejects stale completion state", () => {
  const fixture = poem({
    image_path: "/images/fixture.png",
    checklist: [{ label: "生成 AI 配图", done: false }],
  });
  const errors = lintImageChecklist(fixture);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "image-checklist");
});

test("published poem DOM stays bilingual unless text_nhd exists", () => {
  const existing = loadPoemRecords().poems[0];
  const bilingual = renderPoemPage(existing, null, null, {});
  assert.doesNotMatch(bilingual, /parallel--trilingual|pline__nhd/);

  const trilingual = renderPoemPage({ ...existing, text_nhd: existing.german_text }, null, null, {});
  assert.match(trilingual, /parallel--trilingual/);
  assert.match(trilingual, /pline__nhd/);
  assert.match(trilingual, /Mhd\. · 原文/);
});

// ---- §0.3 韵式自校验（G8）----

test("rhyme keys fold German spelling onto sound", () => {
  // 长音 h / 重复元音：Baal 与 Zahl 同韵。
  assert.equal(rhymeKey("Baal"), rhymeKey("Zahl"));
  // 词尾清化：Tod 与 Gott、Wind 与 findt。
  assert.equal(rhymeKey("Tod"), rhymeKey("Gott"));
  assert.equal(rhymeKey("Wind"), rhymeKey("findt"));
  // ai/ei 同音：Mai 与 Schrei。
  assert.equal(rhymeKey("Mai"), rhymeKey("Schrei"));
  // qu = /kv/，Qual 的 u 不是元音。
  assert.equal(rhymeKey("Qual"), rhymeKey("Zahl"));
  // 弱读词尾要往前取一个音节：schließen 押 -ießen，不与 Verlangen 混。
  assert.equal(rhymeKey("schließen"), rhymeKey("fließen"));
  assert.notEqual(rhymeKey("schließen"), rhymeKey("Verlangen"));
  // sehn（单音节）与 sehen（双音节）是不同的韵。
  assert.notEqual(rhymeKey("sehn"), rhymeKey("sehen"));
  assert.equal(rhymeKey("sehen"), rhymeKey("stehen"));
});

function rhymePoem(overrides = {}) {
  return poem({
    german_text: [["breit", "Stirn", "Einsamkeit", "verirrn"]],
    translation_zh: { text: [["一", "二", "三", "四"]] },
    ...overrides,
  });
}

test("rhyme lint accepts a scheme that matches the measured rhymes", () => {
  const fixture = rhymePoem({ grammar_notes: [{ title: "形式", body: "韵式 abab（交叉韵）。" }] });
  assert.deepEqual(lintRhymeScheme(fixture).errors, []);
});

test("rhyme lint rejects a scheme that denies a real rhyme (G1 类)", () => {
  // abcd 声称四行互不押韵，但 breit/Einsamkeit 与 Stirn/verirrn 各自相押。
  const fixture = rhymePoem({ grammar_notes: [{ title: "形式", body: "韵式 abcd。" }] });
  const errors = lintRhymeScheme(fixture).errors;
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "rhyme-scheme");
  assert.match(errors[0].message, /实测/);
});

test("rhyme lint warns about letters that appear only once", () => {
  const fixture = rhymePoem({ grammar_notes: [{ title: "形式", body: "韵式 abcd。" }] });
  const { warnings } = lintRhymeScheme(fixture);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /只出现一次/);
});

test("rhyme lint requires form prose when a form tag is in the header", () => {
  const fixture = rhymePoem({ tags: ["交叉韵"], grammar_notes: [{ title: "词汇", body: "无关内容。" }] });
  const errors = lintRhymeScheme(fixture).errors;
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "rhyme-missing");
});

test("rhyme lint skips refrain lines listed in rhyme_exempt_lines", () => {
  const fixture = rhymePoem({
    german_text: [["linden", "heide", "was", "vinden", "beide", "gras", "tal", "tandaradei", "nahtegal"]],
    translation_zh: { text: [["一", "二", "三", "四", "五", "六", "七", "八", "九"]] },
    rhyme_exempt_lines: [8],
    grammar_notes: [{ title: "形式", body: "韵式 abc abc d–d。" }],
  });
  assert.deepEqual(lintRhymeScheme(fixture).errors, []);
});

test("rhyme lint flags an unmarked refrain line", () => {
  const fixture = rhymePoem({
    german_text: [["linden", "heide", "was", "vinden", "beide", "gras", "tal", "tandaradei", "nahtegal"]],
    translation_zh: { text: [["一", "二", "三", "四", "五", "六", "七", "八", "九"]] },
    grammar_notes: [{ title: "形式", body: "韵式 abc abc d–d。" }],
  });
  const errors = lintRhymeScheme(fixture).errors;
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "rhyme-scheme");
});

test("irregular poems must actually say so", () => {
  const fixture = rhymePoem({ rhyme_scheme: "irregular", grammar_notes: [{ title: "形式", body: "押韵零散。" }] });
  const errors = lintRhymeScheme(fixture).errors;
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "rhyme-irregular");
});
