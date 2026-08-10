// ==========================================================================
// HTML 模板函数（纯字符串模板，无外部依赖）
// 视觉系统：德语学习画册 "Das annotierte Lernbuch"
//   字体：Fraunces(展示标题) · EB Garamond(德文正文) ·
//         Noto Serif SC(中文) · Inter(UI) · IBM Plex Mono(学术性元数据)
//         —— 全部为 SIL Open Font License，可自由商用 / 公开使用
//   色彩：旧纸 + 铁胆墨蓝(正文) + 档案蓝(链接) + 教师朱批红(注释标记/待办)
// ==========================================================================

const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet">`;

function esc(str) {
  if (str === undefined || str === null) return "";
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// 允许受控的内联标记直接透传
function raw(str) {
  return str === undefined || str === null ? "" : String(str);
}

// 印刷花纹（标题页装饰，朱批红）
const ORNAMENT = `<svg class="ornament" viewBox="0 0 120 10" width="120" height="10" aria-hidden="true">
  <line x1="0" y1="5" x2="48" y2="5" stroke="currentColor" stroke-width="0.8"/>
  <line x1="72" y1="5" x2="120" y2="5" stroke="currentColor" stroke-width="0.8"/>
  <path d="M60 0.5 L64.5 5 L60 9.5 L55.5 5 Z" fill="currentColor"/>
</svg>`;

// ---- 诗节渲染 ----

// 注：英文译文（translation_en）当前不渲染，数据仍保留在各诗歌 JSON 中备用。

// 德文原诗用：连续行号（左侧书眉）+ 朱批红引用标记（链接到逐行注释）
function makeNoteFinder(lineNotes) {
  const norm = (s) =>
    String(s || "")
      .replace(/\s+/g, " ")
      .trim();
  const items = (lineNotes || []).map((n, i) => ({ i: i + 1, de: norm(n.de) }));
  const exact = new Map(items.map((it) => [it.de, it.i]));
  return function (line) {
    const nl = norm(line);
    if (exact.has(nl)) return exact.get(nl);
    let best = null;
    for (const it of items) {
      if (!it.de) continue;
      if (nl.includes(it.de) || it.de.includes(nl)) {
        if (!best || it.de.length < best.de.length) best = it;
      }
    }
    return best ? best.i : 0;
  };
}

// 德汉对照 + 逐行注释三列（德 | 中 | 注），逐行对齐；注释随诗行高度自适应，无注释的诗行不留空柱
function renderParallel(deStanzas, zhStanzas, findNote) {
  const zS = zhStanzas || [];
  const nStanzas = Math.max(deStanzas.length, zS.length);
  const out = [];
  for (let s = 0; s < nStanzas; s++) {
    const de = deStanzas[s] || [];
    const zh = zS[s] || [];
    const n = Math.max(de.length, zh.length);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const deLine = de[i] || "";
      const zhLine = zh[i] || "";
      const noteN = deLine && findNote ? findNote(deLine) : 0;
      const mark = noteN ? `<sup class="refmark"><a href="#note-${noteN}">${noteN}</a></sup>` : "";
      const deAttr = noteN ? ` data-noteref="${noteN}"` : "";
      rows.push(`        <div class="pline">
          <div class="pline__de vline"${deAttr}><span class="linetext">${esc(deLine)}${mark}</span></div>
          <div class="pline__zh">${esc(zhLine)}</div>
        </div>`);
    }
    out.push(`      <div class="pstanza">\n${rows.join("\n")}\n      </div>`);
  }
  return out.join("\n");
}

function tag(text, extraClass = "") {
  return `<span class="tag ${extraClass}">${esc(text)}</span>`;
}

function difficultyTagClass(difficulty) {
  const d = (difficulty || "").toLowerCase();
  if (d.includes("a1") || d.includes("a2")) return "tag--a";
  if (d.includes("b1") || d.includes("b2")) return "tag--b";
  return "tag--c";
}

// ---- 页面骨架 ----

const SITE_SCRIPT = `<script>
  (function () {
    // 入场显现（尊重 prefers-reduced-motion，由 CSS 兜底关闭）
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    }
    // 朱批旁注联动：诗行 ↔ 注释互相高亮
    function highlight(id, on, source) {
      var escId = (window.CSS && CSS.escape) ? CSS.escape(id) : id;
      var sel = '[data-noteref="' + escId + '"]';
      document.querySelectorAll(sel).forEach(function (p) {
        if (p !== source) p.classList.toggle('is-linked', on);
      });
      if (source) source.classList.toggle('is-self', on);
    }
    // 鼠标：悬停诗行或注释
    document.querySelectorAll('.vline[data-noteref], .lnote[data-noteref]').forEach(function (el) {
      var id = el.getAttribute('data-noteref');
      el.addEventListener('mouseenter', function () { highlight(id, true, el); });
      el.addEventListener('mouseleave', function () { highlight(id, false, el); });
    });
    // 键盘：聚焦诗行内的引用标记链接（交互元素），高亮该行与其注释
    document.querySelectorAll('.refmark a').forEach(function (a) {
      var vline = a.closest('.vline[data-noteref]');
      if (!vline) return;
      var id = vline.getAttribute('data-noteref');
      a.addEventListener('focus', function () { highlight(id, true, vline); });
      a.addEventListener('blur', function () { highlight(id, false, vline); });
    });
    // 主题切换：日 / 夜，记忆到 localStorage（首次访问跟随系统）
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      var syncToggle = function () {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
        toggle.setAttribute('aria-label', dark ? '切换到浅色主题' : '切换到深色主题');
      };
      syncToggle();
      toggle.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme') || 'light';
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        syncToggle();
      });
    }
    // 配图提示词弹窗（原生 <dialog>，主题自适应；ESC / 点遮罩 / ✕ 关闭）
    var modals = document.querySelectorAll('dialog.modal');
    modals.forEach(function (modal) {
      var closeBtn = modal.querySelector('.modal__close');
      // ✕ 关闭
      if (closeBtn) closeBtn.addEventListener('click', function () { modal.close(); });
      // 点遮罩（dialog 自身区域）关闭
      modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
      // 关闭后恢复：解锁滚动、焦点归位、刷新 aria
      modal.addEventListener('close', function () {
        document.body.classList.remove('modal-open');
        var t = modal._trigger;
        if (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); modal._trigger = null; }
      });
    });
    var triggers = document.querySelectorAll('.brief-trigger');
    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-modal');
        var modal = id && document.getElementById(id);
        if (!modal || typeof modal.showModal !== 'function') return;
        if (modal.open) { modal.close(); return; }
        modal._trigger = btn;
        btn.setAttribute('aria-expanded', 'true');
        modal.showModal();
        document.body.classList.add('modal-open');
        var c = modal.querySelector('.modal__close');
        if (c) c.focus();
      });
    });
    // 回到顶部按钮：滚动一段距离后才显示
    var toTop = document.querySelector('.to-top');
    if (toTop) {
      var prefersReduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var syncToTop = function () {
        if (window.scrollY > 420) toTop.classList.add('is-visible');
        else toTop.classList.remove('is-visible');
      };
      window.addEventListener('scroll', syncToTop, { passive: true });
      syncToTop();
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReduce ? 'auto' : 'smooth' });
      });
    }
    // 打印时展开全部折叠章节（CSS 无法强制打开 <details>），打印完恢复原状
    var folds = document.querySelectorAll('details.section--fold');
    var reopened = [];
    window.addEventListener('beforeprint', function () {
      reopened = [];
      folds.forEach(function (d) {
        if (!d.open) { d.open = true; reopened.push(d); }
      });
    });
    window.addEventListener('afterprint', function () {
      reopened.forEach(function (d) { d.open = false; });
      reopened = [];
    });
  })();
  </script>`;

function renderLayout({ title, description = "", bodyHtml, active = "", root: rootOverride }) {
  const root = rootOverride !== undefined ? rootOverride : active === "poem" ? "../" : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>
    (function () {
      try {
        var t = localStorage.getItem('theme');
        if (t !== 'dark' && t !== 'light') {
          t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', t);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  </script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
  ${FONT_LINK}
  <link rel="stylesheet" href="${root}style.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="${root}index.html">
        <span class="brand__de">Gedichte</span>
      </a>
      <div class="site-header__right">
        <nav class="site-nav" aria-label="主导航">
          <a href="${root}index.html">诗歌总览</a>
          <a href="${root}about.html">关于 · 校对</a>
        </nav>
        <a class="header-icon" href="https://github.com/zydo/deutsche-gedichte-lernen" target="_blank" rel="noopener noreferrer" aria-label="GitHub 仓库（zydo/deutsche-gedichte-lernen）" title="GitHub 仓库">
          <svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
        </a>
        <button class="theme-toggle" type="button" aria-label="切换主题" title="切换 日 / 夜 主题">
          <svg class="icon-moon" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.8A8.2 8.2 0 1 1 9.7 3.6 6.6 6.6 0 0 0 20.5 14.8z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>
        </button>
      </div>
    </div>
  </header>
  <main>
    ${bodyHtml}
  </main>
  <footer class="site-footer">
    <p>本站为非商业性德语学习资料。德文原诗均标注出处；译文除注明出处外均为本站学习译文（AI 辅助）。</p>
    <p class="site-footer__meta">详见 <a href="${root}about.html">关于本站 / 校对说明</a> 与项目 README　·　Ein Lernbuch</p>
  </footer>
  <button class="to-top" type="button" aria-label="回到顶部" title="回到顶部">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 12l6-6 6 6"/></svg>
  </button>
${SITE_SCRIPT}
</body>
</html>`;
}

// ---- 首页（诗集目录 Inhalt） ----

function renderIndex(poems) {
  // 按作者分组，保留首次出现顺序
  const groups = [];
  const idx = new Map();
  for (const p of poems) {
    if (!idx.has(p.author)) {
      const g = { author: p.author, author_zh: p.author_zh, items: [] };
      idx.set(p.author, g);
      groups.push(g);
    }
    idx.get(p.author).items.push(p);
  }

  const groupHtml = groups
    .map((g) => {
      const rows = g.items
        .map((p) => {
          const periodShort = (p.period || "").split("（", 1)[0].trim();
          return `        <a class="toc-row" href="poems/${p.slug}.html">
          <span class="toc-title">${esc(p.title_de)}<span class="toc-title-zh">${esc(p.title_zh)}</span></span>
          <span class="toc-leader" aria-hidden="true"></span>
          <span class="toc-meta">
            <span class="toc-period">${esc(periodShort)}</span>
            ${tag(p.difficulty, difficultyTagClass(p.difficulty))}
          </span>
        </a>`;
        })
        .join("\n");
      return `      <section class="author-group">
        <header class="author-group__head">
          <span class="author-group__name">${esc(g.author)}</span>
          <span class="author-group__zh">${esc(g.author_zh || "")}</span>
          <span class="author-group__count">${g.items.length} ${g.items.length === 1 ? "Gedicht" : "Gedichte"}</span>
        </header>
${rows}
      </section>`;
    })
    .join("\n");

  const body = `
    <header class="masthead reveal">
      <h1 class="masthead__title">Deutsche<span class="masthead__amp"> · </span>Gedichte</h1>
      <p class="masthead__zh">德　语　诗　歌　学　习　画　册</p>
      <figure class="epigraph">
        <p class="epigraph__text">Über allen Gipfeln<br>Ist Ruh’,</p>
        <figcaption class="epigraph__attr">Goethe · Wandrers Nachtlied</figcaption>
      </figure>
      <p class="masthead__lede">德文原诗 · 学习译文 · 逐行注释 · 词汇与变位 · 语法与文化背景</p>
    </header>

    <section class="anthology" aria-label="诗歌目录">
      <h2 class="anthology__heading"><span>Inhalt</span><em>目录 · 共 ${poems.length} 首</em></h2>
${groupHtml}
    </section>`;

  return renderLayout({
    title: "德语诗歌学习画册 · Deutsche Gedichte",
    description: "面向德语学习者与文学爱好者的诗歌学习网站：德文原诗、出处校对、学习译文、词汇语法注释。",
    bodyHtml: body,
  });
}

// ---- 词汇卡片 ----

function renderVocabCard(v) {
  return `      <div class="vocab-card">
        <div class="vocab-card__head"><span class="vocab-card__term">${esc(v.term)}</span></div>
        <span class="vocab-card__pos">${esc(v.pos || "")}</span>
        <div class="vocab-card__meaning">${esc(v.meaning)}</div>
        ${v.note ? `<div class="vocab-card__note">${esc(v.note)}</div>` : ""}
      </div>`;
}

// ---- 动词变位表 ----

function renderVerbTable(verbs) {
  if (!verbs?.length) return `<p class="prose">本诗中未标注需要特别说明的不规则动词变位。</p>`;
  const rows = verbs
    .map((v) => {
      let noteRow = "";
      if (v.note) {
        noteRow = '        <tr class="verb-note"><td colspan="7">↳ ' + esc(v.note) + "</td></tr>";
      }
      return `        <tr>
          <td class="de">${esc(v.infinitive)}</td>
          <td class="de">${esc(v.present_3sg || "—")}</td>
          <td class="de">${esc(v.preterite || "—")}</td>
          <td class="de">${esc(v.perfect || "—")}</td>
          <td class="de">${esc(v.participle_ii || "—")}</td>
          <td class="de">${esc(v.subjunctive_ii || "—")}</td>
          <td>${esc(v.auxiliary || "—")}</td>
        </tr>
${noteRow}`;
    })
    .join("\n");
  return `<div class="verb-table-wrap">
      <table class="verb-table">
        <thead>
          <tr>
            <th>Infinitiv</th><th>Präsens<br><span class="th-sub">3. Sg.</span></th><th>Präteritum</th><th>Perfekt</th><th>Partizip II</th><th>Konjunktiv II</th><th>Hilfsverb</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>`;
}

// ---- 语法要点 ----

function renderGrammarNotes(notes) {
  return notes
    .map(
      (n) => `      <article class="grammar-item">
        <h3 class="grammar-item__title">${esc(n.title)}</h3>
        ${n.quote ? `<p class="grammar-item__quote">${esc(n.quote)}</p>` : ""}
        <div class="grammar-item__body">${esc(n.body)}</div>
      </article>`,
    )
    .join("\n");
}

// ---- 逐行注释（带朱批红序号，与诗行联动） ----

// 逐行注释（独立小节，朱批红序号与诗行联动）
function renderLineNotes(notes) {
  return notes
    .map((n, i) => {
      const num = i + 1;
      return `      <article class="lnote" id="note-${num}" data-noteref="${num}">
        <span class="lnote__mark">${num}</span>
        <p class="lnote__de">${esc(n.de)}</p>
        <p class="lnote__zh">${esc(n.zh)}</p>
      </article>`;
    })
    .join("\n");
}

// ---- 出处 ----

// snapshots: manifest.json 的内容（URL → 存档记录），缺省时不渲染快照链接
function renderSourceList(sources, snapshots = {}, root = "") {
  return `<ul class="source-list">
${sources
  .map((s) => {
    const snap = s.url ? snapshots[s.url] : null;
    let snapLink = "";
    if (snap && snap.ok) {
      snapLink = `<a class="source-snap" href="${root}snapshots/${esc(snap.id)}.html" title="抓取于 ${esc(snap.fetched_at)} 的本地存档">快照（${esc(snapDate(snap))}）</a>`;
    } else if (snap) {
      // 抓取失败也照实显示，不假装存档存在（如对方站点屏蔽了非浏览器请求）
      const why = snap.http_status ? `HTTP ${snap.http_status}` : snap.error || "抓取失败";
      snapLink = `<span class="source-snap source-snap--failed" title="${esc(String(snap.attempted_at || "").slice(0, 10))} 抓取失败：${esc(why)}">快照（未能抓取）</span>`;
    }
    return `      <li>
        <span class="source-name">${esc(s.name)}</span>${s.url ? `<a class="source-url" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ""}${snapLink}
        ${s.note ? `<span class="source-note">${esc(s.note)}</span>` : ""}
      </li>`;
  })
  .join("\n")}
    </ul>`;
}

function snapDate(snap) {
  return String(snap.fetched_at || "").slice(0, 10);
}

// ---- 出处快照页 ----

// 把存档下来的第三方页面转成纯文本：只保留可读正文，丢弃脚本、样式与版式。
// 站点发布的是这份文本，而不是第三方页面本身——存档的用途是核对诗歌正文。
const ENTITIES = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  bdquo: "„",
  ldquo: "“",
  rdquo: "”",
  sbquo: "‚",
  lsquo: "‘",
  rsquo: "’",
  hellip: "…",
  middot: "·",
  shy: "",
  zwnj: "",
};

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z#0-9]+);/gi, (m, name) => (name in ENTITIES ? ENTITIES[name] : m));
}

function htmlToText(html) {
  return decodeEntities(
    String(html)
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6]|blockquote|section|article|table)>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderSnapshotPage(snap, rawHtml, poems = []) {
  const text = htmlToText(rawHtml);
  const kb = (snap.bytes / 1024).toFixed(1);
  const rows = [
    ["原始 URL", `<a href="${esc(snap.url)}" target="_blank" rel="noopener">${esc(snap.url)}</a>`],
    snap.final_url ? ["最终 URL（重定向后）", esc(snap.final_url)] : null,
    ["抓取时间", esc(snap.fetched_at)],
    ["HTTP 状态", esc(String(snap.http_status))],
    ["Content-Type", esc(snap.content_type || "—")],
    ["原始大小", `${esc(kb)} KB`],
    ["SHA-256", `<code class="snap-hash">${esc(snap.sha256)}</code>`],
    ["页面标题", esc(snap.title || "—")],
  ].filter(Boolean);

  const used = poems.length
    ? `<p class="snap-used">被以下诗歌用作德文原文出处：${poems
        .map((p) => `<a href="../poems/${esc(p.slug)}.html">${esc(p.title_de)}</a>`)
        .join("、")}</p>`
    : "";

  const body = `
    <article class="snapshot reveal">
      <header class="snapshot__head">
        <p class="snapshot__kicker">Quellen-Schnappschuss · 出处快照</p>
        <h1 class="snapshot__title">${esc(snap.title || snap.url)}</h1>
        <p class="snapshot__lede">这是本站在 <strong>${esc(snapDate(snap))}</strong> 抓取的该页面纯文本存档，用于日后核对德文原文——网页会改版、下线或被悄悄修改，出处链接本身并不足以自证。</p>
      </header>
      <div class="snapshot__note">
        <p>本页只呈现抓取时页面的<strong>文字内容</strong>，不复制对方站点的版式、图片与脚本；原始 HTML 正本保存在仓库 <code>snapshots/raw/${esc(snap.file)}</code>，可用上方 SHA-256 校验其未被改动。页面著作权归原站点所有，此处仅作出处核验之用。</p>
      </div>
      ${used}
      <table class="snap-meta">
        <tbody>
${rows.map(([k, v]) => `          <tr><th scope="row">${k}</th><td>${v}</td></tr>`).join("\n")}
        </tbody>
      </table>
      <h2 class="snap-h2">存档正文</h2>
      <pre class="snap-text">${esc(text)}</pre>
    </article>`;

  return renderLayout({
    title: `快照 ${snapDate(snap)} · ${snap.title || snap.url} | 德语诗歌学习画册`,
    description: `${snap.url} 在 ${snapDate(snap)} 的本地存档，用于德文原文出处核验。`,
    bodyHtml: body,
    root: "../",
  });
}

// ---- 散文段 ----

function renderProse(text) {
  return `<div class="prose">${(text || "")
    .split("\n\n")
    .map((p) => `<p>${esc(p).replaceAll("\n", "<br>")}</p>`)
    .join("\n")}</div>`;
}

// ---- 配图位（image brief） ----

// 提示词条目（意象 / 情绪 / 画面元素 / 时代感 / 推荐风格 / 比例 / 禁忌），无图原位展示与弹窗共用
function renderBriefDL(prompt, aspect) {
  return `      <dl>
        <dt>意象</dt><dd>${esc(prompt.imagery)}</dd>
        <dt>情绪</dt><dd>${esc(prompt.mood)}</dd>
        <dt>画面元素</dt><dd>${esc(prompt.elements)}</dd>
        <dt>时代感</dt><dd>${esc(prompt.era)}</dd>
        <dt>推荐风格</dt><dd>${esc(prompt.style)}</dd>
        <dt>比例</dt><dd>${esc(aspect)}（横版）</dd>
        <dt>禁忌</dt><dd>${esc(prompt.taboos)}</dd>
      </dl>`;
}

function renderImageSlot(prompt, imagePath, root = "") {
  // 全站统一排版：配图比例默认 4:3（横版）；单首诗可在 image_prompt.aspect 覆盖
  const aspect = prompt?.aspect || "4:3";
  // image_path 按站点根（如 /images/x.png）书写，渲染时换算成相对当前页的路径，兼容 file:// 与子路径部署
  const imgSrc = imagePath ? root + String(imagePath).replace(/^\/+/, "") : "";
  const standbyNote = `当前部署环境未接入 AI 图像生成模型，此处保留 image brief 供后续以受信任工具（并遵循上方“禁忌”与“比例 ${esc(aspect)}”约束）补图；上线后应在图下标注“图片由 AI 生成”。`;
  const modalNote = `此为生成本配图所用的提示词（image brief）。生成时须遵循上方“禁忌”与“比例 ${esc(aspect)}”约束；插图标注为“图片由 AI 生成”。`;

  // 有配图：4:3 画框；图下方居中一行“图片由 AI 生成 查看提示词”（仅“查看提示词”可点）+ 自定义弹窗
  if (imgSrc) {
    return `    <figure class="image-slot image-slot--filled">
      <img src="${esc(imgSrc)}" alt="受诗歌启发生成的插图 / AI-generated illustration inspired by the poem" loading="lazy">
    </figure>
    <p class="image-caption-line">图片由 AI 生成　<button class="brief-trigger" type="button" data-modal="brief-modal" aria-haspopup="dialog" aria-expanded="false" aria-controls="brief-modal">查看提示词</button></p>
    <dialog class="modal" id="brief-modal" aria-labelledby="brief-modal-title">
      <header class="modal__head">
        <span class="modal__title" id="brief-modal-title">配图提示词 · Bildkonzept</span>
        <button class="modal__close" type="button" aria-label="关闭弹窗">✕</button>
      </header>
      <div class="modal__body">
        <div class="image-slot">
${renderBriefDL(prompt, aspect)}
          <p class="image-slot__caption">${modalNote}</p>
        </div>
      </div>
    </dialog>`;
  }

  // 无配图：原位显示提示词
  return `    <div class="image-slot">
      <div class="image-slot__label"><span class="dot" aria-hidden="true"></span>Bildkonzept · 配图（ausstehend / 待生成）</div>
${renderBriefDL(prompt, aspect)}
      <p class="image-slot__caption">${standbyNote}</p>
    </div>`;
}

// ---- 章节封装（带罗马序号 + 中德双标签） ----

function renderSections(secs) {
  return secs
    .map((s) => {
      const cls = `section reveal${s.wide ? " section--wide" : ""}${s.parallel ? " section--parallel" : ""}`;
      // 考据性章节默认折叠：正文与注释先入眼，出处、校对记录等按需展开。
      // 用原生 <details>，无 JS 也能开合，键盘可达，打印时由 CSS 强制全部展开。
      if (s.foldable) {
        return `    <details class="${cls} section--fold">
      <summary class="section__head">
        <span class="section__zh">${esc(s.zh)}</span>
        <span class="section__de">${esc(s.de)}</span>
        <span class="section__caret" aria-hidden="true"></span>
      </summary>
      ${s.html}
    </details>`;
      }
      return `    <section class="${cls}">
      <header class="section__head">
        <span class="section__zh">${esc(s.zh)}</span>
        <span class="section__de">${esc(s.de)}</span>
      </header>
      ${s.html}
    </section>`;
    })
    .join("\n");
}

// ---- 诗歌详情页 ----

function renderPoemPage(p, prev, next, snapshots = {}) {
  const findNote = makeNoteFinder(p.line_notes);

  // 上一首 / 下一首导航（仅显示中文译名；首/末首对应一侧隐藏）
  const prevLink = prev
    ? `<a class="poem-nav__link poem-nav__prev" href="${esc(prev.slug)}.html" rel="prev"><span class="poem-nav__arrow" aria-hidden="true">←</span><span class="poem-nav__title">${esc(prev.title_zh)}</span></a>`
    : `<span class="poem-nav__spacer" aria-hidden="true"></span>`;
  const nextLink = next
    ? `<a class="poem-nav__link poem-nav__next" href="${esc(next.slug)}.html" rel="next"><span class="poem-nav__title">${esc(next.title_zh)}</span><span class="poem-nav__arrow" aria-hidden="true">→</span></a>`
    : `<span class="poem-nav__spacer" aria-hidden="true"></span>`;
  const poemNav = `    <nav class="poem-nav" aria-label="诗歌导航">
${prevLink}
${nextLink}
    </nav>`;

  const titleBlock = `
${poemNav}
    <header class="poem-titleblock reveal">
      <h1 class="poem-titleblock__de${(p.title_de || "").length >= 24 ? " poem-titleblock__de--long" : ""}">${esc(p.title_de)}</h1>
      <p class="poem-titleblock__author">${esc(p.author)}</p>
      <p class="poem-titleblock__zh">${esc(p.title_zh)}</p>
      <p class="poem-titleblock__author-zh">${esc(p.author_zh)}</p>
      <div class="poem-titleblock__biblio">
        <p>${esc(p.collection)}</p>
        <p>${esc(p.period)}</p>
        <p>${esc(p.year)}</p>
      </div>
      <div class="poem-titleblock__meta">
        ${tag(p.difficulty, difficultyTagClass(p.difficulty))}
        ${(p.tags || []).map((t) => tag(t)).join("\n        ")}
      </div>
      ${renderImageSlot(p.image_prompt, p.image_path, "../")}
    </header>`;

  const parallelBlock = `      <div class="parallel">
${renderParallel(p.german_text, p.translation_zh.text, findNote)}
        <p class="translation-meta">${esc(p.translation_zh.translator)}</p>
      </div>`;

  const checklistItems = (p.checklist || [])
    .map((c) => {
      const classAttr = c.done ? "" : ' class="pending"';
      return `        <li${classAttr}>${esc(c.label)}</li>`;
    })
    .join("\n");

  const secs = [
    { zh: "原诗 · 译文", de: "Gedicht · Übertragung", html: parallelBlock, parallel: true },
    {
      zh: "逐行注释",
      de: "Zeilenkommentar",
      html: `      <div class="lnotes">${renderLineNotes(p.line_notes)}      </div>`,
    },
    {
      zh: "重点词汇",
      de: "Wortschatz",
      html: `      <div class="vocab-list">${p.vocab.map(renderVocabCard).join("\n")}      </div>`,
      wide: true,
    },
    { zh: "动词变位", de: "Konjugation", html: renderVerbTable(p.verb_forms), wide: true },
    {
      zh: "语法要点",
      de: "Grammatik",
      html: `      <div class="grammar-list">${renderGrammarNotes(p.grammar_notes)}      </div>`,
    },
    { zh: "文学意象与文化背景", de: "Hintergrund", html: renderProse(p.cultural_notes) },
    { zh: "译文说明", de: "Anmerkung", html: renderProse(p.translation_notes), foldable: true },
    {
      zh: "德文原文出处",
      de: "Quellen",
      html: renderSourceList(p.german_sources, snapshots, "../"),
      foldable: true,
    },
    {
      zh: "译文出处 · 版权",
      de: "Übersetzungsnachweis",
      html: renderSourceList(p.translation_sources),
      foldable: true,
    },
    { zh: "校对记录", de: "Korrektorat", html: renderProse(p.verification_notes), foldable: true },
    {
      zh: "上线前质量 Checklist",
      de: "Prüfliste",
      html: `      <ul class="checklist">${checklistItems}      </ul>`,
      wide: true,
      foldable: true,
    },
  ];

  const body = `
    <div class="poem-shell">
${titleBlock}
${renderSections(secs)}
    </div>`;

  return renderLayout({
    title: `${p.title_de} · ${p.title_zh} — ${p.author} | 德语诗歌学习画册`,
    description: `${p.title_de}（${p.title_zh}）— ${p.author}。德文原诗、学习译文、词汇语法注释与出处校对。`,
    bodyHtml: body,
    active: "poem",
  });
}

// ---- 关于页 ----

function renderAbout(poemsCount) {
  const titleBlock = `
    <header class="poem-titleblock reveal">
      <p class="poem-titleblock__eyebrow">Vorwort · 编者前言</p>
      <h1 class="poem-titleblock__de" style="font-size: clamp(2rem,5vw,3rem);">关于本站 · 校对说明</h1>
      <div class="poem-titleblock__ornament">${ORNAMENT}</div>
    </header>`;

  const secs = [
    {
      zh: "项目定位",
      de: "Profil",
      html: renderProse(
        "本站是面向德语学习者与文学爱好者的诗歌学习资料库，目前收录 " +
          poemsCount +
          " 首德语经典诗歌（第一批）。每首诗提供德文原诗（含出处）、本站学习中译（AI 辅助）、逐行注释、重点词汇、动词变位、语法要点、文学背景与完整的校对记录，目标是成为“可信的文学学习资料”，而不是“看起来像真的 AI 内容”。",
      ),
    },
    {
      zh: "德文原文的校对原则",
      de: "Korrekturprinzip",
      html: renderProse(
        "每首诗的德文原文均来自公开、可核实的文本来源（如 deutschelyrik.de、textlog.de、Zeno.org、维基百科所引权威版本等），并至少用两个独立来源交叉核对诗节、行数、标点与新旧拼法差异。凡两来源之间存在异文（例如 Goethe《Heidenröslein》1789 年 Göschen 版与 1827 年 Ausgabe letzter Hand 版的代词/动词差异），均在该诗页面的“校对记录”中说明，不擅自取舍或改写。少数诗仅取得单一直接来源核对、尚待第二独立来源复核的，会在“校对记录”中明确标注“待进一步核实”。",
      ),
    },
    {
      zh: "中文 / 英文译文策略",
      de: "Übersetzungsweise",
      html: renderProse(
        "已出版的现代译本（如钱春绮、冯至、杨武能等译者的中译）大多仍在版权保护期内，本站不会未经授权大段复制其译文全文；页面中仅以文字提及这些译本的存在，供读者自行查阅，不作为可核实的书目引用。\n\n本站展示的中文译文为“本站学习译文（AI 辅助）”：在人工核对德文原意的基础上，由本站编写/AI 辅助生成，以贴近原文结构、便于学习者对照单词与语法为首要目标，不追求诗意的独立文学价值，页面中均以徽标明确标注。\n\n英文译文：本站当前不提供英译。若今后采用英译，将优先选用已确认进入公有领域的 19 世纪译本（如 Edgar Alfred Bowring 译 Goethe，1853）并标注出处与公版状态；在未采用前，不会声称使用了任何英译本。",
      ),
    },
    {
      zh: "图片说明",
      de: "Bildnachweis",
      html: renderProse(
        "本批每首诗均已配 AI 生成插图（4:3 横版），图下统一标注“AI-generated illustration inspired by the poem”。插图依据各诗页面撰写的 image brief（意象、情绪、画面元素、时代感、推荐风格、禁忌内容）生成，并经人工检查确认无文字、水印、肢体错误或明显违和的现代元素。少数若暂缺配图（image_path 为 null）的诗，会原位展示完整的 image brief 作为占位，待接入图像生成工具后按简报补充。",
      ),
    },
    {
      zh: "局限性与后续工作",
      de: "Grenzen",
      html: renderProse(
        "本项目为第一批内容（" +
          poemsCount +
          " 首），后续会按照 README 中“如何添加一首新诗”的流程持续扩充。所有标注为“待核实”的信息，欢迎读者对照来源自行验证；如发现错误，请以 README 中的方式反馈或直接修改对应的诗歌 JSON 数据文件。",
      ),
    },
  ];

  const body = `
    <div class="poem-shell">
${titleBlock}
${renderSections(secs)}
    </div>`;

  return renderLayout({
    title: "关于本站 / 校对说明 | 德语诗歌学习画册",
    description: "关于本站的资料来源、校对原则、译文版权策略与配图说明。",
    bodyHtml: body,
  });
}

export { renderIndex, renderPoemPage, renderAbout, renderSnapshotPage, htmlToText, esc };
