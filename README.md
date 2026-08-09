# 德语诗歌学习画册 · Deutsche Gedichte — Ein Lernbuch

**🌐 在线阅读：<https://zydo.github.io/deutsche-gedichte-lernen/>**

一个面向德语学习者与文学爱好者的**数据驱动静态网站**。收录德语经典诗歌，每首诗配有：德文原诗（含可核实出处）、本站学习中译（AI 辅助，明确标注）、逐行注释、重点词汇、动词变位表、语法要点、文学与文化背景、image brief、译文说明、校对记录与上线前 checklist。

视觉风格：纸张质感米白背景 + 优雅衬线字体（德文用 Cormorant/EB Garamond，中文用 Noto Serif SC）+ 暗金/灰蓝点缀，目标是"打开一本文学画册，旁边有位德语老师做精炼注释"的阅读体验。

> **当前状态：共 29 首诗，分三批录入。**
>
> - **第一批（11 首）**：Goethe ×3、Heine ×3、Eichendorff、Mörike、Hölderlin、Rilke ×2 — 已配图。
> - **第二批（9 首）**：Goethe ×2（*Wandrers Nachtlied I*、*Mignon*）、Heine（*Der Tod, das ist die kühle Nacht*）、Rilke（*Archaïscher Torso Apollos*）、Schiller、Novalis、Droste-Hülshoff、Trakl、Claudius — 已配图。
> - **第三批（9 首，新增）**：Brentano、Uhland、Lenau、Hebbel、Storm、C. F. Meyer、Fontane、Hofmannsthal、Morgenstern — 全部为此前未收录的诗人，文本与注释已完成、**配图待生成**（`image_path` 为 `null`，页面显示 image brief 占位）。
>
> 收录诗人现共 20 位，时间跨度自 18 世纪的 Claudius 至 20 世纪初的 Trakl、Hofmannsthal。技术架构支持持续扩充，见下方"如何添加一首新诗"。

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
  - [内容与译文版权注意事项](#内容与译文版权注意事项)
  - [已知局限 / 后续工作](#已知局限--后续工作)

---

## 项目是什么

本项目不是"看起来像真的 AI 内容"，而是希望做到**可信的文学学习资料**：

- 每首诗的德文原文必须有明确、可核实的出处（优先 Wikisource、Zeno.org、textlog.de、deutschelyrik.de、Projekt Gutenberg-DE、维基百科所引权威版本等），并至少用**两个独立来源**交叉核对诗节、行数、标点、新旧拼法与版本差异。
- 中文译文优先说明已有译本的存在，但**不擅自转载受版权保护的现代译本全文**；本站展示的是"本站学习译文（AI 辅助）"，在页面上以徽标明确标注，绝不冒充名家译本。
- 任何不确定的信息（版本差异、缺失的第二来源等）都在页面"校对记录"中如实注明"待核实"，不做主观取舍或美化。
- 每首诗页面末尾附带一份可见的**上线前质量 Checklist**，尚未完成的项目会明确标红（如"生成 AI 配图"——见下文说明）。

**关于配图**：第一、二批共 20 首诗已配有 AI 生成插图（`public/images/`）。**第三批 9 首尚未配图**——当前部署环境未接入可用的图像生成模型，因此这 9 首的 `image_path` 均为 `null`，页面会渲染完整的 image brief（意象、情绪、画面元素、时代感、推荐风格、禁忌内容）作为占位，供你在有图像生成工具时按简报补充；详见[如何添加或替换配图](#如何添加或替换配图)。

---

## 技术栈与目录结构

网站采用**零依赖的 Node.js 静态站点生成器**（未使用 Astro/Vite 等框架），原因是本项目的部署沙箱对 npm 大型依赖树的安装稳定性无法保证，选择用 Node 内置模块（`fs`/`http`）手写一个轻量构建脚本，以确保"真正可运行、可构建"这一硬性要求始终能满足。整体设计仍然遵循"结构化数据 + 可复用模板"的原则，如果你希望迁移到 Astro/11ty 等框架，`data/poems/*.json` 的字段设计可以直接复用，仅需重写 `src/templates.js` 中的渲染逻辑。

```
.
├── data/
│   └── poems/                  # 每首诗一个 JSON 文件，是全站唯一的数据源
│       ├── 01-heidenroeslein.json
│       ├── 02-wandrers-nachtlied.json
│       └── ...                  # 目前共 29 个文件（01–29）
├── public/
│   ├── style.css                # 主样式表（纸张质感 / 衬线字体 / 配色变量）
│   └── images/                  # 配图（目前为第一、二批共 20 首）
├── src/
│   ├── build.js                 # 构建脚本：读取 data/poems/*.json → 生成 dist/
│   ├── templates.js             # 纯字符串 HTML 模板（无第三方模板引擎）
│   └── serve.js                 # 零依赖本地静态文件服务器（预览用）
├── dist/                        # 构建产物（HTML + CSS），可直接部署到任意静态托管
├── package.json
└── README.md（本文件）
```

---

## 如何安装依赖

本项目**不需要安装任何 npm 依赖**（仅使用 Node.js 内置模块），因此没有 `npm install` 这一步。你只需要：

- Node.js ≥ 18（推荐 LTS 版本）

确认版本：

```bash
node -v
```

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
4. 复制样式表到 `dist/theme.css`。

构建产物 `dist/` 是完全独立的静态文件集合，可以直接拖拽到 Netlify / Vercel / GitHub Pages / 任意静态文件服务器上部署，无需服务端运行环境。

> **注意（本沙箱环境特有的实现细节）**：由于本项目开发所在的沙箱环境不允许删除或重命名 `outputs` 目录下已创建的文件，`build.js` 采用"覆盖写入"而非"先清空 dist/ 再重建"的策略；样式表输出文件名是 `theme.css` 而非更直觉的 `style.css`（因为构建过程中一次失败的复制操作意外占用了 `style.css` 这个文件名）。如果你在自己的电脑/服务器上重新克隆本项目运行，这些历史包袱可以随意清理：直接删除 `dist/` 目录后重新构建即可，不受此限制。

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
| `image_prompt`          | `{imagery, mood, elements, era, taboos, style, aspect?}`                                          | image brief；`aspect` 可选，默认 `4:3`（全站统一横版排版）                                       |
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

- **德文原文出处**（`german_sources`）：每条记录包含来源名称、完整 URL（如有）、以及一句话说明该来源在校对中起到的作用（主来源/辅助来源/用于核实某处异文等）。**至少 2 条**，且应为相互独立的信息源（同一网站的镜像/转载不算独立来源）。
- **译文出处**（`translation_sources`）：说明译文性质（公版译本 / 本站学习译文 / 已知存在但因版权未转载的译本名称），不需要 URL（本站学习译文没有外部出处）。
- **校对记录**（`verification_notes`）：自由文本，用于记录交叉核对的具体过程、发现的版本差异、以及尚未解决的疑点。这是最重要的可信度记录，请认真填写，不要留空或写套话。

---

## 内容与译文版权注意事项

- **德文原文**：目前收录的 29 首诗，作者均已去世超过 70 年。逝世最晚的是 Hugo von Hofmannsthal（1929年，其作品自2000年起进入公有领域），其次为 Rilke（1926）、Trakl 与 Morgenstern（均 1914）。所有原始德文文本在德国/欧盟法律下均已进入公有领域，可以自由使用、展示、转载。
- **德文原文的具体录入版本**：即便原诗本身公版，某些出版社/编辑校勘的"具体版本"（如某大学出版社的现代校勘本）本身可能受编辑劳动的版权保护；本站引用的 deutschelyrik.de、textlog.de、Zeno.org、Kalliope、gedichte7.de、维基百科等均为面向公众免费开放阅读的资源，但如果你计划将本项目用于商业用途，建议进一步核实这些网站的转载政策。
- **现代中文/英文译本**：绝大多数广为流传的名家译本（如钱春绮、冯至、杨武能、Stephen Mitchell 等译者的作品）译者去世未满 70 年，仍受版权保护。**本站不转载任何此类译本的原文**，仅在"译文说明"中提及其存在，供读者自行查阅正版出版物。
- **本站学习译文**：由 AI 辅助生成，以贴近原文结构、便于学习为目标，不追求独立文学价值。这些译文可视为本项目的原创内容，采用与本项目其余部分相同的开源/非商业学习用途授权（具体授权条款请项目维护者自行补充选定的 License，例如 CC BY-NC 4.0）。
- **AI 配图**（未来添加时）：生成的图片需在页面中明确标注 "AI-generated illustration inspired by the poem"，并遵循所使用图像生成工具自身的服务条款。

---

## 已知局限 / 后续工作

- 当前共 **29 首、20 位诗人**：Goethe ×5、Heine ×4、Rilke ×3，以及 Eichendorff、Mörike、Hölderlin、Schiller、Novalis、Droste-Hülshoff、Trakl、Claudius、Brentano、Uhland、Lenau、Hebbel、Storm、C. F. Meyer、Fontane、Hofmannsthal、Morgenstern 各 1 首。
- **仍未覆盖的时代**：巴洛克及更早（Gryphius、Fleming、Angelus Silesius、Walther von der Vogelweide）与 20 世纪表现主义（Heym、Stadler、Lasker-Schüler 等，均已公版），是后续扩充最明显的两个方向。
- 部分诗歌（Mondnacht、Er ist's、Hälfte des Lebens、Herbsttag、Du bist wie eine Blume 等）在校对阶段除主来源外，还通过维基百科等第二来源交叉核对；少数校对记录中标注"建议后续补充第三来源"的诗歌，属于本站认为可信度已经足够但仍鼓励进一步验证的情况，请查阅各诗页面底部"校对记录"了解具体细节。
- **第三批 9 首的 AI 配图尚未生成**（见上文说明），是这一批最主要的未完成项；每首诗的 `image_prompt` 已按 4:3 横版写好，可直接用于生成。
- 各批次中**尚未解决的文本疑点**均已写入对应诗页的"校对记录"，并在 checklist 中标为未完成，特此汇总提醒：
  - Novalis《Wenn nicht mehr Zahlen und Figuren》第10、11 行存在两处实质异文（`ewgen`/`wahren`、`vor Einem`/`von einem`），本站从历史批评版，但流通版本异文的来源尚未查明。
  - Claudius《Abendlied》1783 年版第 35 行作 `Laß uns im Himmel kommen`（第三格），按现代语法应为 `in den Himmel`；究竟是 18 世纪用法波动还是排印之误，本站未能确定。
  - Trakl《Ein Winterabend》存两稿且差异极大，本站采第二稿（定稿）并在背景说明中完整引述第一稿；第 9 行 `Wanderer tritt still herein` 的命令式／陈述句歧义按原文保留，未作消歧。
  - Brentano《Der Spinnerin Nachtlied》第 9、14 行存在两处异文（`Als`/`Da`、`Denk' ich wohl dein`/`Gedenk ich dein`），孰为作者定本尚未查明。
  - Fontane《Herr von Ribbeck》共记录 8 类版本差异，其中第 40 行 `ich gew di`（全集本）与 `ick gew di`（通行本）疑为排印之误，需对照原刊核实。
  - Hofmannsthal《Die beiden》第 2 行的 `glich`（单数）与 `glichen`（复数）之争：本站从两个来源共同支持的单数形式，但建议对照历史批评版复核。
  - C. F. Meyer《Der römische Brunnen》现存六至七种稿本，本站仅采 1892 年定稿，早期稿本未逐一核对。
  - 多首诗的具体标点采自数字化转录而非原刊影印件（详见各诗校对记录）。
- **第三批新增的两类特殊内容**，使用时请留意：
  - Fontane《Herr von Ribbeck》含约六行**低地德语（Plattdeutsch）**对白，词汇表中附有标准德语对照小词表；建议由低地德语使用者复核一次。
  - Morgenstern《Der Werwolf》的全部笑点建立在德语疑问代词 `wer` 的四格变化上，**在字面意义上不可译**。本站采取"直译叙事 + 括注构词机制"的策略，已在该诗"译文说明"中明确交代取舍。
- 全部内容均由 AI 辅助完成一次系统性校对与撰写，但**尚未经过人工德语文学专家的最终复核**，这一点已在每首诗的 checklist 中如实标注（"最终人工复核说明"一项为未完成状态）。如果你是德语文学或语言学背景的读者，非常欢迎对照来源检查并指出错误。
