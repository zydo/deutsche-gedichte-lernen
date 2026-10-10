import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadPoemRecords } from "../src/poem-data.js";
import { renderIndex, renderAbout, renderPoemPage, renderSnapshotPage } from "../src/templates.js";
import { SITE_URL, siteUrl, renderSeoHead, renderSitemap } from "../src/seo.js";

const records = loadPoemRecords();
const poems = records.poems;

function graph(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "Structured data must be present in the initial HTML");
  return JSON.parse(match[1])["@graph"];
}

function canonical(html) {
  return html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
}

test("home aliases use one canonical URL and its catalogue matches the visible link order", () => {
  const html = renderIndex(poems);
  assert.equal(canonical(html), SITE_URL);
  assert.equal(siteUrl("index.html"), SITE_URL);
  assert.match(html, new RegExp(`${poems.length} 首经典德语诗歌`));
  const catalogue = graph(html).find((node) => node["@type"] === "CollectionPage").mainEntity;
  const visible = [...html.matchAll(/class="toc-row" href="([^"]+)"/g)].map((match) => siteUrl(match[1]));
  assert.deepEqual(
    catalogue.itemListElement.map((item) => item.url),
    visible,
  );
  assert.equal(catalogue.numberOfItems, poems.length);
  assert.equal(new Set(visible).size, poems.length);
});

test("every published poem has unique indexable metadata and share images inside the project path", () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const p of poems) {
    const html = renderPoemPage(p, null, null);
    const url = `${SITE_URL}poems/${p.slug}.html`;
    assert.equal(canonical(html), url);
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.ok(html.includes(`<meta property="og:image" content="${siteUrl(p.image_path)}">`));
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
    descriptions.add(html.match(/<meta name="description" content="([^"]+)">/)[1]);
    const nodes = graph(html);
    const lesson = nodes.find((node) => node["@type"] === "LearningResource");
    const original = nodes.find((node) => node["@type"] === "CreativeWork");
    assert.equal(lesson.educationalLevel, p.difficulty);
    assert.equal(lesson.about["@id"], original["@id"]);
    assert.equal(lesson.author, undefined, "Poet attribution belongs to the original work, not the lesson");
    assert.equal(original.name, p.title_de);
    for (const node of nodes) {
      assert.ok(node["@id"].startsWith(SITE_URL));
    }
  }
  assert.equal(titles.size, poems.length);
  assert.equal(descriptions.size, poems.length);
});

test("anonymous folk poems are not attributed to a fictional person", () => {
  const p = poems.find((poem) => poem.author_type === "anonymous");
  assert.ok(p);
  const original = graph(renderPoemPage(p, null, null)).find((node) => node["@type"] === "CreativeWork");
  assert.equal(original.author, undefined);
  const named = graph(renderPoemPage(poems[0], null, null)).find((node) => node["@type"] === "CreativeWork");
  assert.equal(named.author.name, poems[0].author);
});

test("all source archives are noindex while their verification content remains readable", () => {
  const snapshots = JSON.parse(readFileSync(new URL("../snapshots/manifest.json", import.meta.url)));
  for (const [url, snap] of Object.entries(snapshots).filter(([, item]) => item.ok)) {
    const html = renderSnapshotPage({ ...snap, url }, "<p>Source text</p>", [poems[0]]);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.equal(canonical(html), undefined);
    assert.doesNotMatch(html, /application\/ld\+json/);
    assert.match(html, /Source text/);
    assert.ok(html.includes(`href="../poems/${poems[0].slug}.html"`));
    assert.ok(html.includes(`<meta property="og:url" content="${SITE_URL}snapshots/${snap.id}.html">`));
  }
});

test("sitemap contains every published canonical page once and excludes pending poems and archives", () => {
  const xml = renderSitemap(records.records.map((record) => record.poem));
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, [SITE_URL, `${SITE_URL}about.html`, ...poems.map((p) => `${SITE_URL}poems/${p.slug}.html`)]);
  assert.equal(urls.length, new Set(urls).size);
  assert.doesNotMatch(xml, /index\.html|snapshots\/|lastmod/);
  for (const { poem } of records.pending) assert.ok(!xml.includes(`${poem.slug}.html`));
});

test("metadata safely handles quoted titles and script-like content from source records", () => {
  const hostile = 'Gedicht "quoted" & </script><script>alert(1)</script>';
  const head = renderSeoHead({
    title: hostile,
    description: hostile,
    structuredData: [{ "@type": "WebPage", name: hostile }],
  });
  assert.match(head, /Gedicht &quot;quoted&quot; &amp; &lt;\/script&gt;/);
  assert.equal((head.match(/<\/script>/g) || []).length, 1);
  assert.equal(graph(head)[0].name, hostile);
  const html = renderPoemPage({ ...poems[0], title_de: hostile }, null, null);
  assert.match(html, /content="[^"]*&quot;quoted&quot;[^"]*">/);
  assert.equal(graph(html).find((node) => node["@type"] === "CreativeWork").name, hostile);
});

test("poem learning sections use h2 headings, language annotations and visible breadcrumbs", () => {
  const html = renderPoemPage(poems[0], null, null);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<h2 class="section__zh">原诗 · 译文<\/h2>/);
  assert.match(html, /<h2 class="section__zh">语法要点<\/h2>/);
  assert.match(html, /class="pline__de vline" lang="de"/);
  assert.match(html, /class="pline__zh" lang="zh-CN"/);
  assert.match(html, /<nav class="breadcrumbs"/);
  assert.match(html, /<noscript><style>\.reveal/);
  assert.match(html, /loading="eager" fetchpriority="high"/);
  assert.ok(html.includes(`《${poems[0].title_zh} · ${poems[0].title_de}》AI 插图`));
  assert.doesNotMatch(html, /hreflang/, "Bilingual content does not imply separate language versions");
});

test("about page canonical and breadcrumb agree with the published URL", () => {
  const html = renderAbout(poems);
  assert.equal(canonical(html), `${SITE_URL}about.html`);
  const trail = graph(html).find((node) => node["@type"] === "BreadcrumbList");
  assert.deepEqual(
    trail.itemListElement.map((item) => item.item),
    [SITE_URL, `${SITE_URL}about.html`],
  );
  assert.match(html, /aria-current="page">关于本站 · 校对说明/);
});

test("Search Console verification is optional and limited to the homepage", () => {
  const base = { title: "Title", description: "Description", verification: "" };
  assert.doesNotMatch(renderSeoHead(base), /google-site-verification/);
  assert.match(
    renderSeoHead({ ...base, verification: 'token"value' }),
    /name="google-site-verification" content="token&quot;value"/,
  );
  assert.doesNotMatch(
    renderSeoHead({ ...base, verification: "token", pagePath: "about.html" }),
    /google-site-verification/,
  );
});
