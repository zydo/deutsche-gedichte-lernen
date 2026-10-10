// 所有公开 URL 共用实际部署地址，保留 GitHub Pages 的项目子路径。
export const SITE_URL = "https://zydo.github.io/deutsche-gedichte-lernen/";
export const SITE_NAME = "德语诗歌学习画册";
const DEFAULT_IMAGE = "images/heidenroeslein.png";

export function siteUrl(pagePath = "") {
  return new URL(pagePath === "index.html" ? "" : pagePath.replace(/^\/+/, ""), SITE_URL).href;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function website() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: "Deutsche Gedichte — Ein Lernbuch",
    inLanguage: ["zh-CN", "de"],
  };
}

function breadcrumbs(pagePath, name) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${siteUrl(pagePath)}#breadcrumbs`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "诗歌目录", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: siteUrl(pagePath) },
    ],
  };
}

export function indexStructuredData(poems, title, description) {
  return [
    website(),
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}#webpage`,
      url: SITE_URL,
      name: title,
      description,
      inLanguage: ["zh-CN", "de"],
      isPartOf: { "@id": `${SITE_URL}#website` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: poems.length,
        itemListElement: poems.map((p, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${p.title_de} · ${p.title_zh} — ${p.author}`,
          url: siteUrl(`poems/${p.slug}.html`),
        })),
      },
    },
  ];
}

export function poemStructuredData(p, title, description) {
  const pagePath = `poems/${p.slug}.html`;
  const url = siteUrl(pagePath);
  const name = `${p.title_de} · ${p.title_zh}`;
  return [
    website(),
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: ["zh-CN", "de"],
      isPartOf: { "@id": `${SITE_URL}#website` },
      breadcrumb: { "@id": `${url}#breadcrumbs` },
      mainEntity: { "@id": `${url}#lesson` },
    },
    {
      "@type": "LearningResource",
      "@id": `${url}#lesson`,
      url,
      name,
      description,
      inLanguage: ["zh-CN", "de"],
      learningResourceType: "德语诗歌阅读与逐行注释",
      educationalLevel: p.difficulty,
      isAccessibleForFree: true,
      teaches: ["德语阅读", "德语词汇", "德语语法", "诗歌赏析"],
      about: { "@id": `${url}#poem` },
      ...(p.image_path ? { image: siteUrl(p.image_path) } : {}),
      citation: (p.german_sources || []).map((s) => s.url).filter(Boolean),
    },
    {
      "@type": "CreativeWork",
      "@id": `${url}#poem`,
      name: p.title_de,
      alternateName: p.title_zh,
      genre: "poetry",
      ...(p.author_type === "anonymous"
        ? {}
        : { author: { "@type": "Person", name: p.author, alternateName: p.author_zh } }),
    },
    breadcrumbs(pagePath, name),
  ];
}

export function aboutStructuredData(title, description) {
  return [
    website(),
    {
      "@type": "AboutPage",
      "@id": `${siteUrl("about.html")}#webpage`,
      url: siteUrl("about.html"),
      name: title,
      description,
      inLanguage: "zh-CN",
      isPartOf: { "@id": `${SITE_URL}#website` },
      breadcrumb: { "@id": `${siteUrl("about.html")}#breadcrumbs` },
    },
    breadcrumbs("about.html", "关于本站 · 校对说明"),
  ];
}

export function renderSeoHead({
  title,
  description,
  pagePath = "",
  imagePath,
  indexable = true,
  structuredData = [],
  verification = process.env.GOOGLE_SITE_VERIFICATION,
}) {
  const url = siteUrl(pagePath);
  const image = siteUrl(imagePath || DEFAULT_IMAGE);
  const imageAlt = imagePath ? `${title} · AI 生成的诗歌插图` : "歌德《野玫瑰》AI 插图 · 德语诗歌学习画册";
  // JSON-LD 来自诗歌与外站标题；转义 <，防止数据里的 </script> 提前结束脚本。
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": structuredData }).replaceAll(
    "<",
    "\\u003c",
  );
  return `${indexable ? `  <link rel="canonical" href="${esc(url)}">\n` : ""}  <meta name="robots" content="${indexable ? "index, follow, max-image-preview:large" : "noindex, follow"}">
${verification && !pagePath ? `  <meta name="google-site-verification" content="${esc(verification)}">\n` : ""}  <link rel="sitemap" type="application/xml" href="${esc(siteUrl("sitemap.xml"))}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE_NAME)}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:alt" content="${esc(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(image)}">
  <meta name="twitter:image:alt" content="${esc(imageAlt)}">
${structuredData.length ? `  <script type="application/ld+json">${json}</script>\n` : ""}`;
}

export function renderSitemap(poems) {
  // 只列出可索引的规范 URL：快照、pending 和 index.html 别名均不收录。
  // 未记录可靠的页面修改日期，因此不伪造 lastmod。
  const urls = [
    SITE_URL,
    siteUrl("about.html"),
    ...poems.filter((p) => p.published !== false).map((p) => siteUrl(`poems/${p.slug}.html`)),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${esc(url)}</loc></url>`).join("\n")}
</urlset>
`;
}
