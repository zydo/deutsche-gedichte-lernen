# 德语诗歌学习画册 · Deutsche Gedichte — Ein Lernbuch

**🌐 在线阅读：<https://zydo.github.io/deutsche-gedichte-lernen/>**

一个面向德语学习者与文学爱好者的**数据驱动静态网站**。收录德语经典诗歌，每首诗配有：德文原诗（含可核实出处）、本站学习中译（AI 辅助，明确标注）、逐行注释、重点词汇、动词变位表、语法要点、文学与文化背景、image brief、译文说明、校对记录与上线前 checklist。

视觉风格：纸张质感米白背景 + 优雅衬线字体（德文用 Cormorant/EB Garamond，中文用 Noto Serif SC）+ 暗金/灰蓝点缀，目标是"打开一本文学画册，旁边有位德语老师做精炼注释"的阅读体验。

> **当前状态：共 58 首诗，分六批录入。**
>
> - **第一批（11 首）**：Goethe ×3、Heine ×3、Eichendorff、Mörike、Hölderlin、Rilke ×2 — 已配图。
> - **第二批（9 首）**：Goethe ×2（_Wandrers Nachtlied I_、_Mignon_）、Heine（_Der Tod, das is die kühle Nacht_）、Rilke（_Archaïscher Torso Apollos_）、Schiller、Novalis、Droste-Hülshoff、Trakl、Claudius — 已配图。
> - **第三批（9 首）**：Brentano、Uhland、Lenau、Hebbel、Storm、C. F. Meyer、Fontane、Hofmannsthal、Morgenstern — 已配图。
> - **第四批（4 首）**：Gryphius ×2、Fleming、van Hoddis — 已配图。
> - **第五批（17 首，编号 34–50）**：补三个硬缺口——时间轴断层（Walther《Under der linden》约1200、表现主义至1915）、流派与形式（狂飙突进纲领诗 _Prometheus_、民歌 _Die Gedanken sind frei_、政治诗 _Nachtgedanken_、长行诗 _Fahrt über die Kölner Rheinbrücke_、Wortkunst _Patrouille_、亚历山大体十四行 _Vergänglichkeit der Schönheit_、格言对句 _Cherubinischer Wandersmann_）、作者结构（第二位女性作者 Lasker-Schüler、首部匿名民歌）。正文已录入，配图已补齐（第五批的 17 张配图于 2026 年 8 月生成入库）。
> - **第六批（8 首，编号 55–62）**：补三处结构性缺口——女性作者（Günderrode《Der Kuß im Traume》、Huch《Wo hast du all die Schönheit hergenommen》、Lasker-Schüler《Weltende》，女性作者由 2 位增至 4 位）、1650–1770 的 120 年空白（Gellert《Die Ehre Gottes aus der Natur》、Bürger《Lenore》节选）、体裁与形式（恐怖谣曲 _Lenore_、Klopstock 无韵颂歌 _Das Rosenband_、诗论诗 _Tristan_、表现主义 _Die Dämmerung_）。本批含一首与编号 33 同名不同作者的诗（Lasker-Schüler《Weltende》vs van Hoddis《Weltende》），已作双向消歧；配图待生成。
>
> 收录诗人现共 37 位具名作者 + 1 个匿名民歌组（共 38 个目录组），其中 **4 位女性作者**（Droste-Hülshoff、Lasker-Schüler、Günderrode、Huch），时间跨度自约 1200 年的 Walther 至 1911 年的 Lichtenstein。
>
> ★ **编辑工作规范**：从候选诗到可发布页面的端到端流程（选诗、来源矩阵、正文锁定、逐行审计、形式自验、跨页接线、构建门槛）见新增的 **[EDITORIAL_WORKFLOW.md](EDITORIAL_WORKFLOW.md)**。第五批起的新增诗（编号 ≥34）采用更严格的来源规则：至少 3 个独立运营方 + 至少 1 个一级来源（每条来源显式标 tier，一级来源写纸本版次/页码），由 `npm run check` 机器校验。
>
> 技术架构支持持续扩充，见下方"如何添加一首新诗"。
>
> ⚠️ **来源独立性问题（2026 年 8 月发现并处理）**：`gedichte7.de` 与 `zgedichte.de` 属同一运营方（页面 metadata 中 `meta-author` 均为 Heiko Possel），
> 此前曾被当作两个独立来源使用。全站已重新审计：**未发现任何一首诗真的只靠这一组站点自证**（0 个 ERROR），
> 12 首在扣除三级来源后独立来源不足。**截至 2026 年 8 月已全部补验证完毕，目前 50 首中 49 首通过、仅剩 1 首 WARN**；
> 补验证过程中查出 1 处本站转录错误、1 处 Zeno 一级来源的转录讹误、以及 3 首诗的真实版本异文，均已如实记录。
> 新的强制性标准见 **[SOURCES.md](SOURCES.md)**，可用 `npm run check` 做机器校验。

---

## 目录

- [德语诗歌学习画册 · Deutsche Gedichte — Ein Lernbuch](#德语诗歌学习画册--deutsche-gedichte--ein-lernbuch)
  - [目录](#目录)
  - [项目是什么](#项目是什么)
  - [技术栈与目录结构](#技术栈与目录结构)
  - [如何安装依赖](#如何安装依赖)
  - [如何本地运行](#如何本地运行)
  - [如何构建静态网站](#如何构建静态网站)
  - [如何添加一首新诗](#如何添加一首新诗)
  - [如何添加或替换配图](#如何添加或替换配图)
  - [如何记录来源](#如何记录来源)
    - [出处快照（Quellen-Schnappschuss）](#出处快照quellen-schnappschuss)
  - [内容与译文版权注意事项](#内容与译文版权注意事项)
  - [已知局限 / 后续工作](#已知局限--后续工作)

---

## 项目是什么

本项目不是"看起来像真的 AI 内容"，而是希望做到**可信的文学学习资料**：

- 每首诗的德文原文必须有明确、可核实的出处，并至少用**两个相互独立的来源**交叉核对诗节、行数、标点、新旧拼法与版本差异。**"什么算独立来源"由 [SOURCES.md](SOURCES.md) 强制规定**（含运营方分组表与来源分级），并由 `npm run check` 机器校验——这条规则不是口头约定，是可执行的。
- 中文译文优先说明已有译本的存在，但**不擅自转载受版权保护的现代译本全文**；本站展示的是"本站学习译文（AI 辅助）"，在页面上以徽标明确标注，绝不冒充名家译本。
- 任何不确定的信息（版本差异、缺失的第二来源等）都在页面"校对记录"中如实注明"待核实"，不做主观取舍或美化。
- 每首诗页面末尾附带一份可见的**上线前质量 Checklist**，尚未完成的项目会明确标红（如"生成 AI 配图"——见下文说明）。

**关于配图**：50 首中前 33 首（编号 01–33）已配有 AI 生成插图（`public/images/`，4:3 横版）；第五批的 17 首（编号 34–50）正文已录入、配图待生成。若某首诗的 `image_path` 为 `null`，页面会自动改为渲染完整的 image brief（意象、情绪、画面元素、时代感、推荐风格、禁忌内容）作为占位；详见[如何添加或替换配图](#如何添加或替换配图)。

---

## 技术栈与目录结构

网站采用**零依赖的 Node.js 静态站点生成器**（未使用 Astro/Vite 等框架），原因是本项目的部署沙箱对 npm 大型依赖树的安装稳定性无法保证，选择用 Node 内置模块（`fs`/`http`）手写一个轻量构建脚本，以确保"真正可运行、可构建"这一硬性要求始终能满足。整体设计仍然遵循"结构化数据 + 可复用模板"的原则，如果你希望迁移到 Astro/11ty 等框架，`data/poems/*.json` 的字段设计可以直接复用，仅需重写 `src/templates.js` 中的渲染逻辑。

```
.
├── data/
│   └── poems/                  # 每首诗一个 JSON 文件，是全站唯一的数据源
│       ├── 01-heidenroeslein.json
│       ├── 02-wandrers-nachtlied-ii.json
│       ├── ...                  # 目前共 50 个文件（01–50）
│       └── pending/             # 未到公版日的条目（published: false，正文留空）
├── public/
│   ├── style.css                # 主样式表（纸张质感 / 衬线字体 / 配色变量）
│   └── images/                  # 配图（33 张，对应编号 01–33）
├── src/
│   ├── build.js                 # 构建脚本：读取 data/poems/*.json → 生成 dist/
│   ├── templates.js             # 纯字符串 HTML 模板（无第三方模板引擎）
│   ├── validate-sources.js      # 来源独立性校验（npm run check），规则见 SOURCES.md
│   ├── validate-content.js      # 内容一致性校验：计数—行号、跨页断言、韵式自校验等
│   ├── snapshot.js              # 抓取出处网页存档（npm run snapshot）
│   └── serve.js                 # 零依赖本地静态文件服务器（预览用）
├── snapshots/                   # 德文原文出处的网页存档（npm run snapshot 生成）
│   ├── raw/                     # 抓取到的原始 HTML 正本
│   └── manifest.json            # 清单：URL → 抓取时间 / HTTP 状态 / SHA-256
├── dist/                        # 构建产物（HTML + CSS），可直接部署到任意静态托管
├── SOURCES.md                   # ★ 来源独立性规范（强制性，新增诗歌前必读）
├── package.json
└── README.md（本文件）
```

---

## 如何安装依赖

**构建与运行不需要任何 npm 依赖**：`npm run build`、`npm run serve`、`npm run check` 全部只用 Node.js 内置模块，克隆后直接就能跑，CI 亦然（`.github/workflows/deploy.yml` 没有 install 步骤）。你只需要：

- Node.js ≥ 18（推荐 LTS 版本）

确认版本：

```bash
node -v
```

唯一的例外是**开发期的代码格式化**：`prettier` 作为 `devDependencies` 仅供 `npm run format` 与 pre-commit hook 使用，不参与构建、不影响部署。如果你要参与提交，请执行：

```bash
npm install                        # 只装 prettier
git config core.hooksPath .githooks # 启用 pre-commit 格式化 hook
```

不装也能正常构建和部署，只是提交 `dist/` 时不会自动格式化（hook 会打印提示并跳过）。

---

## 如何本地运行

```bash
# 1. 构建静态页面到 dist/
node src/build.js

# 2. 启动本地预览服务器（默认 http://localhost:4321）
node src/serve.js
```

或者一步到位：

```bash
node src/build.js && node src/serve.js
```

如果你的 `package.json` 支持 `npm run`（本仓库已配置好 scripts），也可以：

```bash
npm run build   # 等价于 node src/build.js
npm run serve   # 等价于 node src/serve.js
npm run dev     # 等价于先 build 再 serve
npm run check    # 来源独立性校验 + 内容一致性校验（validate-sources.js 与 validate-content.js）
npm run snapshot # 抓取德文原文出处的网页存档到 snapshots/（见"出处快照"一节）
npm run format   # 格式化仓库代码与文档（需先 npm install；pre-commit hook 会自动格式化 dist/）
```

打开浏览器访问 `http://localhost:4321` 即可看到首页；也可以直接用浏览器打开 `dist/index.html`（部分相对路径在 `file://` 协议下也能正常工作，但仍推荐用本地服务器预览，行为更接近真实部署）。

---

## 如何构建静态网站

```bash
node src/build.js
```

该命令会：

1. 读取 `data/poems/` 目录下所有 `.json` 文件；
2. 对每首诗做基本字段完整性校验（缺字段会在终端打印 `⚠️` 警告，但不会中断构建，便于你在草稿阶段先看到渲染效果再补全数据）；
3. 生成 `dist/index.html`（诗歌总览）、`dist/about.html`（关于本站/校对说明）以及 `dist/poems/<slug>.html`（每首诗的详情页）；
4. 由 `snapshots/` 生成 `dist/snapshots/<id>.html`（德文原文出处的存档页）；
5. 复制样式表与配图到 `dist/`。

构建产物 `dist/` 是完全独立的静态文件集合，可以直接拖拽到 Netlify / Vercel / GitHub Pages / 任意静态文件服务器上部署，无需服务端运行环境。

> **注意**：`build.js` 采用"覆盖写入"而非"先清空 `dist/` 再重建"的策略。重命名 slug 或删除某首诗后，`dist/` 下的旧页面不会自动消失——此时手动删除 `dist/` 再构建一次即可。

---

## 如何添加一首新诗

**不需要写任何新代码**，只需要在 `data/poems/` 目录下新建一个 JSON 文件（文件名建议格式：`两位数字前缀-拼音或英文slug.json`，例如 `12-an-die-freude.json`），并填写以下字段（可参照任意一个现有文件作为模板，例如 `data/poems/01-heidenroeslein.json`）：

| 字段                    | 类型                                                                                              | 说明                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `id`                    | string                                                                                            | 排序用编号，如 `"12"`                                                                           |
| `slug`                  | string                                                                                            | URL 中使用的英文短标识，需全站唯一                                                              |
| `author` / `author_zh`  | string                                                                                            | 作者德文名 / 中文名                                                                             |
| `title_de` / `title_zh` | string                                                                                            | 诗名德文 / 中文                                                                                 |
| `year`                  | string                                                                                            | 创作/发表年代（含背景说明也可以写在这里）                                                       |
| `collection`            | string                                                                                            | 所属诗集                                                                                        |
| `period`                | string                                                                                            | 文学时期                                                                                        |
| `difficulty`            | string                                                                                            | 难度等级，如 `"A2"` `"B1–B2"`                                                                   |
| `tags`                  | string[]                                                                                          | 主题标签                                                                                        |
| `german_text`           | string[][]                                                                                        | **诗节数组，每个诗节是行数组**（保留原始换行与标点）                                            |
| `translation_zh`        | `{type, translator, text}`                                                                        | `type` 填 `"site"`（本站学习译文）或 `"public-domain"`（公版译本）；`text` 结构同 `german_text` |
| `translation_en`        | 同上或 `null`                                                                                     | 没有英译时填 `null`                                                                             |
| `line_notes`            | `{de, zh}[]`                                                                                      | 逐行注释，挑选值得讲解的诗行即可，不必逐行全覆盖                                                |
| `vocab`                 | `{term, pos, meaning, note}[]`                                                                    | 重点词汇卡片                                                                                    |
| `verb_forms`            | `{infinitive, present_3sg, preterite, perfect, participle_ii, subjunctive_ii, auxiliary, note}[]` | 动词变位表；如全诗无需特别讲解的不规则动词，可填空数组 `[]`                                     |
| `grammar_notes`         | `{title, quote, body}[]`                                                                          | 语法要点，**必须结合诗句引用**（`quote` 字段）                                                  |
| `cultural_notes`        | string                                                                                            | 文学背景，用 `\n\n` 分段                                                                        |
| `translation_notes`     | string                                                                                            | 译文策略说明                                                                                    |
| `image_prompt`          | `{imagery, mood, elements, era, taboos, style, aspect?}`                                          | image brief；`aspect` 可选，默认 `4:3`（全站统一横版排版）                                      |
| `image_path`            | string 或 `null`                                                                                  | 配图文件路径；未生成配图前填 `null`                                                             |
| `german_sources`        | `{name, url, note}[]`                                                                             | **至少 2 个独立来源**                                                                           |
| `translation_sources`   | `{name, note}[]`                                                                                  | 译文来源/版权说明                                                                               |
| `verification_notes`    | string                                                                                            | 校对过程记录，含版本差异、未核实事项                                                            |
| `checklist`             | `{label, done}[]`                                                                                 | 上线前质量 checklist，未完成项 `done` 填 `false`                                                |

填好后运行 `node src/build.js`，新诗会自动出现在首页列表与 `dist/poems/<slug>.html`。

**在动笔之前，请务必完成资料收集与校对**（对应 README 开头强调的核心要求）：

1. 从至少 2 个独立、权威的德文文本来源核对原文（Wikisource、Zeno.org、textlog.de、deutschelyrik.de、Projekt Gutenberg-DE 等）；
2. 记录版本/拼写/标点异文；
3. 查找是否已有中文译本，若有则只记录译者与出处（不转载全文），除非能确认其为公版；
4. 无可用译文时，编写"本站学习译文（AI 辅助）"，并如实标注；
5. 完整填写 `verification_notes` 与 `checklist`，不确定的地方写"待核实"，绝不编造。

---

## 如何添加或替换配图

1. 先完整撰写 `image_prompt`（意象/情绪/画面元素/时代感/推荐风格/禁忌内容），这是给图像生成工具的"创作简报"，也是质量控制的一部分。**配图比例全站统一为 4:3 横版**（便于日后版式一致）；生成时请直接向图像工具指定 `--ar 4:3` 或等价参数。如某首诗确需其它比例，可在该诗 `image_prompt` 里加 `"aspect": "16:9"` 之类覆盖。
2. 使用你信任的 AI 图像生成工具（本项目当前部署环境未接入任何图像生成模型），按 `image_prompt` 与 **4:3 比例**生成图片，并**逐张人工检查**：
   - 是否包含文字、水印？
   - 是否有肢体/解剖错误？
   - 是否出现现代服饰、建筑、电线等违和元素？
   - 是否符合"19世纪浪漫主义油画感 / 古典书籍插画"的统一风格？
3. 将检查通过的图片放入 `public/images/`（需自行创建该目录），命名建议与 `slug` 一致，如 `public/images/heidenroeslein.jpg`。
4. 在对应诗歌的 JSON 中，把 `image_path` 改为该文件的相对路径，例如 `"image_path": "/images/heidenroeslein.jpg"`。
5. `renderImageSlot` 已实现：`image_path` 不为 `null` 时自动渲染 `<img>`（套在统一的 4:3 画框 `.image-slot--filled`，`object-fit: cover`），并在图下标注 "AI-generated illustration inspired by the poem"；为 `null` 时仍渲染 image brief（其中"比例 / Format"一行默认显示 4:3）。无需再改代码。
6. 重新运行 `node src/build.js`。

---

## 如何记录来源

本项目对"出处"的记录方式统一为结构化字段，而非散落在正文中的模糊描述：

- **德文原文出处**（`german_sources`）：每条记录包含来源名称、完整 URL（如有）、以及一句话说明该来源在校对中起到的作用（主来源/辅助来源/用于核实某处异文等）。**至少 2 条，且必须分属不同运营方组**——判定标准、运营方分组表与来源分级见 **[SOURCES.md](SOURCES.md)**，务必先读。同一网站的镜像/转载、以及同一运营方的不同域名（典型例子：`gedichte7.de` 与 `zgedichte.de`），**都不算两个独立来源**。填好后运行 `npm run check` 自查。
- **译文出处**（`translation_sources`）：说明译文性质（公版译本 / 本站学习译文 / 已知存在但因版权未转载的译本名称），不需要 URL（本站学习译文没有外部出处）。
- **校对记录**（`verification_notes`）：自由文本，用于记录交叉核对的具体过程、发现的版本差异、以及尚未解决的疑点。这是最重要的可信度记录，请认真填写，不要留空或写套话。

### 出处快照（Quellen-Schnappschuss）

出处链接本身并不足以自证：网页会改版、下线，或被悄悄修改。因此 `german_sources` 中的每个 URL 都会被抓取存档一次，页面上以「快照（YYYY-MM-DD）」链接呈现。

```bash
npm run snapshot              # 只抓尚未存档的 URL（增量，可反复运行）
npm run snapshot -- --refresh # 重抓全部，更新已有存档
npm run build                 # 由存档生成 dist/snapshots/*.html
```

产物分两层：

- `snapshots/raw/<id>.html` —— 抓取到的**原始字节**，是存档正本，随仓库一起提交；
- `snapshots/manifest.json` —— 清单：URL → 文件名、抓取时间、HTTP 状态、字节数、**SHA-256**、页面标题、被哪几首诗引用。

网站上发布的是由正本渲染出的**纯文本**存档页（含上述全部元数据），**不转发第三方页面自身的版式、图片与脚本**——存档的用途是核对诗歌正文，不是镜像别人的网站；页面著作权仍归原站点所有。正本的 SHA-256 记在清单里，任何人都可以据此验证存档未被事后改动。

抓取失败的来源（例如对方站点屏蔽非浏览器请求）不会被静默跳过：清单中记录失败原因，页面上照实显示「快照（未能抓取）」。新增诗歌后记得跑一次 `npm run snapshot`。

---

## 内容与译文版权注意事项

- **德文原文**：目前收录的 50 首诗，作者均已去世超过 70 年。逝世最晚的是 Else Lasker-Schüler（1945年，其作品自2016年起进入公有领域），其次为 Stramm（1915）、Stadler 与 Morgenstern（均 1914）、Heym（1912）。所有原始德文文本在德国/欧盟法律下均已进入公有领域，可以自由使用、展示、转载。每首诗的公版年份复算记录在 JSON 的 `public_domain` 字段中，由 `npm run check` 机器校验。
- **德文原文的具体录入版本**：即便原诗本身公版，某些出版社/编辑校勘的"具体版本"（如某大学出版社的现代校勘本）本身可能受编辑劳动的版权保护；本站引用的 deutschelyrik.de、textlog.de、Zeno.org、Kalliope、gedichte7.de、维基百科等均为面向公众免费开放阅读的资源，但如果你计划将本项目用于商业用途，建议进一步核实这些网站的转载政策。
- **现代中文/英文译本**：绝大多数广为流传的名家译本（如钱春绮、冯至、杨武能、Stephen Mitchell 等译者的作品）译者去世未满 70 年，仍受版权保护。**本站不转载任何此类译本的原文**，仅在"译文说明"中提及其存在，供读者自行查阅正版出版物。
- **本站学习译文**：由 AI 辅助生成，以贴近原文结构、便于学习为目标，不追求独立文学价值。这些译文可视为本项目的原创内容，采用与本项目其余部分相同的开源/非商业学习用途授权（具体授权条款请项目维护者自行补充选定的 License，例如 CC BY-NC 4.0）。
- **AI 配图**：生成的图片已在页面中标注 "AI-generated illustration inspired by the poem"，并遵循所使用图像生成工具自身的服务条款。

---

## 已知局限 / 后续工作

- 当前共 **58 首、37 位具名诗人 + 1 个匿名民歌组**：Goethe ×7、Heine ×5、Rilke ×3，Eichendorff／Schiller／Storm／C. F. Meyer／Fontane／Morgenstern／Gryphius 各 ×2，Lasker-Schüler ×2，其余 28 位各 1 首。
- **遗留清单结清情况**：第四批原计划巴洛克 ×6 + 表现主义 ×6，第五批（编号 34–50）补入其中 6 首；第六批（编号 55–62）又补入 Lichtenstein《Die Dämmerung》。**目前唯一仍未收录的历史候选只剩 1 首**：Opitz《Ach Liebste, laß uns eilen》（巴洛克，已公版）。其余历史候选均已录入。
- **★ 配图状态（第六批后）**：前 50 首已全部配图（编号 01–50，`public/images/` 各一张 4:3 横版）；第六批 8 首（编号 55–62）正文已录入、配图待生成。配图优先于继续扩容，详见下方「语料方针」。
- **未到公版日的作者**：Gottfried Benn 与 Bertolt Brecht 均逝于 1956 年，公版起始年为 2027 年。本站已在 `data/poems/pending/` 预置 4 条元数据骨架（`published: false`、`german_text` 为空），正文须待公版日后按 [SOURCES.md](SOURCES.md) 的来源规则抓取录入；`npm run check` 会强制校验：release_date 之前写入德文正文即报 ERROR。
- **★ 来源独立性问题与全站审计（最重要的一项）**：`gedichte7.de` 与 `zgedichte.de` 由同一运营方维护（页面 metadata 中 `meta-author` / `meta-copyright` 均为 Heiko Possel），**不可互相充当"两个独立来源"**。发现后已做三件事：
  1. 制定强制性的 **[SOURCES.md](SOURCES.md)**（运营方分组表、来源三级分级、规则 A–E、新增诗歌的来源工作流）；
  2. 写了机器校验 `npm run check`（`src/validate-sources.js`），把规则变成可执行的检查，而不是口头约定；
  3. 对当时在库的全部 33 首做了审计（第五批的 34–50 于其后录入，直接适用更严格的新版规则）。**结果：0 个 ERROR** —— 没有任何一首诗真的只靠 Possel 一组站点自证，每首都另有至少一个独立来源，此前记录的逐词比对结论全部有效、不予撤回。
     但有 **12 首**在扣除三级来源后独立来源不足 2 个（多为「Zeno/Wikipedia + gedichte7」的组合）。

  **补验证已于 2026 年 8 月完成**：这 12 首逐首补入了第三个独立来源（Zeno 一级来源 3 首、deutschelyrik.de 二级来源 8 首），当时全站 **0 个 ERROR、1 个 WARN、32 首通过**（扩容至 50 首后为 0 个 ERROR、1 个 WARN、49 首通过）。补验证并非走过场，它实际改动了正文并暴露了三类问题：

  - **查出本站自己的转录错误 1 处**（28 Die Beiden 首行行末破折号误置于次行行首）；
  - **查出一级来源的转录讹误 1 处**（27 Herr von Ribbeck 第 40 行，Zeno 的《冯塔纳全集》作 `ich gew di`，但该行是低地德语引语、同诗第 10 行即为 `ick hebb`，三来源二比一 + 内证 ⇒ 判为讹误，正文已改作 `ick`）；
  - **查出 3 首诗存在真正的版本异文**（17 `ewgen`/`wahren`、20 `im Himmel`/`in Himmel`、21 两个传本并存）。这三处一律**不擅改正文**，而是并列两读、说明倾向、列为待核实项。

  余下 1 个 WARN（33 Weltende）与几项未了结的版本问题见 [SOURCES.md](SOURCES.md) 第 8 节。

- 各批次中**尚未解决的文本疑点**均已写入对应诗页的"校对记录"，并在 checklist 中标为未完成，特此汇总提醒：
  - Novalis《Wenn nicht mehr Zahlen und Figuren》第10、11 行存在两处实质异文（`ewgen`/`wahren`、`vor Einem`/`von einem`），本站从历史批评版，但流通版本异文的来源尚未查明。
  - Claudius《Abendlied》1783 年版第 35 行作 `Laß uns im Himmel kommen`（第三格），按现代语法应为 `in den Himmel`；究竟是 18 世纪用法波动还是排印之误，本站未能确定。
  - Trakl《Ein Winterabend》存两稿且差异极大，本站采第二稿（定稿）并在背景说明中完整引述第一稿；第 9 行 `Wanderer tritt still herein` 的命令式／陈述句歧义按原文保留，未作消歧。
  - Brentano《Der Spinnerin Nachtlied》第 9、14 行存在两处异文（`Als`/`Da`、`Denk' ich wohl dein`/`Gedenk ich dein`），孰为作者定本尚未查明。
  - Fontane《Herr von Ribbeck》共记录 8 类版本差异，其中第 40 行 `ich gew di`（全集本）与 `ick gew di`（通行本）疑为排印之误，需对照原刊核实。
  - Hofmannsthal《Die beiden》第 2 行的 `glich`（单数）与 `glichen`（复数）之争：本站从两个来源共同支持的单数形式，但建议对照历史批评版复核。
  - C. F. Meyer《Der römische Brunnen》现存六至七种稿本，本站仅采 1892 年定稿，早期稿本未逐一核对。
  - 多首诗的具体标点采自数字化转录而非原刊影印件（详见各诗校对记录）。
- **巴洛克作品的正字法处理原则（第四批起适用）**：17 世纪诗作的正文一律采用**现代化正字法的通行文本**（即今日德语选本与课堂使用的形式），而非原刊拼写。理由是本站面向学习者——原刊的 `Dv sihst/ wohin du sihst nur eitelkeit auff erden.` 对初学者近乎不可读，且无法查词典。**原刊形态在每首诗的"校对记录"中逐字完整给出**，包括斜线（Virgel）代逗号、名词小写、v/u 互换等系统性差异，绝不隐瞒。个别涉及语义而非单纯拼写的取舍（如 Gryphius《Es ist alles eitel》第 10 行末的陈述／疑问标点、Fleming《An Sich》的 `wieder`/`wider`）已单独标注为编辑判断。
- **第三批新增的两类特殊内容**，使用时请留意：
  - Fontane《Herr von Ribbeck》含约六行**低地德语（Plattdeutsch）**对白，词汇表中附有标准德语对照小词表；建议由低地德语使用者复核一次。
  - Morgenstern《Der Werwolf》的全部笑点建立在德语疑问代词 `wer` 的四格变化上，**在字面意义上不可译**。本站采取"直译叙事 + 括注构词机制"的策略，已在该诗"译文说明"中明确交代取舍。
- 全部内容均由 AI 辅助完成一次系统性校对与撰写，但**尚未经过人工德语文学专家的最终复核**，这一点已在每首诗的 checklist 中如实标注（"最终人工复核说明"一项为未完成状态）。如果你是德语文学或语言学背景的读者，非常欢迎对照来源检查并指出错误。

## 语料方针（第六批后）

第六批之后，站上已无「一眼可见的结构性空白」。以下两条方针约束后续扩容：

- **★ 配图优先于扩容**：一首有图的诗对学习者的价值，高于一首没图的诗。第五批 17 首 + 第六批 8 首共 25 首中，目前仍有 8 首（第六批）待配图。本站之后**语料扩容应让位于既有条目的深化**（配图、待核项落地、人工复核），直到待配图数量降到个位数为止。
- **★ 选诗必须有不可替代的理由**：后续新增诗歌须在候选记录中回答「它补的是什么」。可接受的理由限于三类：(1) 补上某个语言现象在站内的唯一样本；(2) 与既有页面构成不可替代的对照组；(3) 落实某条已写在站内、却指向站外的断言（如第六批的 _Das Rosenband_ 落实《普罗米修斯》页「Klopstock 开创自由韵律」一说）。**不再按流派清单或 CEFR 分布补诗**——「这位诗人还没收」或「这个流派可以再多一首」不构成充分理由。
