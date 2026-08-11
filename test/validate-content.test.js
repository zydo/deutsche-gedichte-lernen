import test from "node:test";
import assert from "node:assert/strict";
import { loadPoemRecords } from "../src/poem-data.js";
import { renderPoemPage } from "../src/templates.js";
import {
  chineseNumber,
  extractLineNumbers,
  lintCountAssertions,
  lintCrossReferences,
  lintLineParity,
  lintPending,
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

test("published poem DOM stays bilingual unless text_nhd exists", () => {
  const existing = loadPoemRecords().poems[0];
  const bilingual = renderPoemPage(existing, null, null, {});
  assert.doesNotMatch(bilingual, /parallel--trilingual|pline__nhd/);

  const trilingual = renderPoemPage({ ...existing, text_nhd: existing.german_text }, null, null, {});
  assert.match(trilingual, /parallel--trilingual/);
  assert.match(trilingual, /pline__nhd/);
  assert.match(trilingual, /Mhd\. · 原文/);
});
