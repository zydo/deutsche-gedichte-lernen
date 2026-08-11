# 来源独立性规范（Quellenrichtlinie）

本文件是本项目**唯一具有约束力的来源标准**。新增或修改任何一首诗时都必须遵守；
`npm run check` 会按本文件的规则做机器校验。

---

## 1. 为什么需要这份文件

本项目的全部价值建立在一句承诺上：**每首诗的德文原文都经过至少两个相互独立的来源交叉核对。**

这句承诺曾经被打破过一次。在第一至三批录入中，`gedichte7.de` 与 `zgedichte.de` 被当作两个来源使用，
而这两个站点的页面 metadata 中 `meta-author` / `meta-copyright` 均为同一人（Heiko Possel），
实为**同一运营方的两个站点**。用它们互相印证等于自证，不构成交叉核对。

问题在第四批录入时被发现。本文件即为此而设：把"什么算独立来源"从口头约定变成可检查的规则。

---

## 2. 核心规则

### 规则 A —— 数量

每首诗的 `german_sources` **至少 2 条**。

### 规则 B —— 独立性

这 2 条**必须分属不同的运营方组**（见第 3 节的分组表）。
同一组内的任意两个站点，无论域名是否相同，**都不算两个来源**。

### 规则 C —— 镜像不算

同一文本的转载、镜像、聚合（如某站点直接抄录 Wikisource 全文）不构成独立来源，
即使域名不同。判断标准是：**这两个来源是否各自独立地录入／校勘过文本**。

### 规则 D —— 优先级

在满足 A、B 的前提下，应尽量包含**至少一个第 4 节的「一级来源」**
（即标注了纸质校勘版出处的数字化全集）。仅有两个二级选本相互印证，可信度偏低，
应在 `verification_notes` 中说明。

### 规则 E —— 如实记录

两个来源之间的任何差异（异文、标点、正字法、分节）都必须写入 `verification_notes`，
并说明本站采用了哪一个、依据是什么。**发现"无差异"也要写明"未发现异文"。**

### 规则 F —— 存档

出处链接不等于出处：网页会改版、下线或被悄悄修改，事后无从复核。
`german_sources` 中的每个 URL 都必须用 `npm run snapshot` 抓取一份**本地存档**，
正本存于 `snapshots/raw/`，抓取时间与 SHA-256 记入 `snapshots/manifest.json`，
并在诗页出处栏以「快照（YYYY-MM-DD）」呈现。抓取失败的来源照实标注为「快照（未能抓取）」，
不得静默跳过。存档只发布纯文本，不镜像对方站点的版式与脚本。

### 规则 G —— 新版规则（编号 ≥34 起适用，更严格）

第五批（编号 34 起）的新增诗采用比规则 A–D 更严格的标准，由 `src/validate-sources.js` 的 v2 分支强制：

- **规则 A+（数量）**：`german_sources` 至少 **3 条**（而非 2 条）。
- **规则 B+（独立性）**：至少 **3 个互相独立的运营方组**。
- **规则 D+（一级来源与版次）**：每条来源显式写 `tier`（1/2/3）；至少一个一级来源；一级来源须写结构化 `citation`，含**纸本版次与页码**（或抄本 folio、或格言集卷次编号 Nr./Buch——按文本类型择一）。
- 三级聚合站（possel 等）只能作辅助，不得独自补足必需的独立来源数。

`npm run check` 对编号 ≥34 的诗执行 v2 校验，对 01–33 沿用 legacy 规则（≥2）。新增内容校验（计数—行号、跨页断言、逐行对齐、公版复算、pending 正文禁入、幽灵 token、Hölderlin 前置第二格回归）见 `EDITORIAL_WORKFLOW.md` 第 8 节。

---

## 3. 运营方分组表

校验脚本 `src/validate-sources.js` 依此表判定独立性。**新增来源站点前请先在此登记。**

| 组 ID             | 站点                                                        | 说明                                                  |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| `possel`          | `gedichte7.de`、`zgedichte.de`                              | **同一运营方**（Heiko Possel）。二者不可互证。        |
| `zeno`            | `zeno.org`                                                  | 数字化全集库，标注纸质版出处。                        |
| `wikimedia`       | `de.wikipedia.org`、`en.wikipedia.org`、`de.wikisource.org` | 维基媒体项目，视为同一组。                            |
| `textlog`         | `textlog.de`                                                | 数字化全集库。                                        |
| `deutschelyrik`   | `deutschelyrik.de`                                          | Fritz Stavenhagen 的朗诵与文本站。                    |
| `planetlyrik`     | `planetlyrik.de`                                            | 附《德国广播电台抒情诗历》评注，标注纸质版出处。      |
| `liedernet`       | `lieder.net`                                                | LiederNet Archive，标注所据印本。                     |
| `kalliope`        | `kalliope.org`                                              | 丹麦 Kalliope 文库。                                  |
| `textarchiv`      | `textarchiv.com`、`de.textarchiv.com`                       |                                                       |
| `aphorismen`      | `aphorismen.de`                                             |                                                       |
| `wortwuchs`       | `wortwuchs.net`                                             | 教学解析站，仅作辅助。                                |
| `augustana`       | `hs-augsburg.de`、`bibliotheca-augustana.net`               | Bibliotheca Augustana，Mhd./早期文本。                |
| `ldm`             | `ldm-digital.de`                                            | BBAW「Lyrik des deutschen Mittelalters」数字化新版。  |
| `liederlexikon`   | `liederlexikon.de`、`deutscheslied.com`                     | Volksliedarchiv 系民歌数据库。                        |
| `gutenberg`       | `projekt-gutenberg.org`、`gutenberg.org`                    | Projekt Gutenberg-DE / Project Gutenberg。            |
| `volksliedarchiv` | `volksliedarchiv.de`                                        | Deutsches Volksliedarchiv。                           |
| `liederprojekt`   | `liederprojekt.org`                                         | 民歌项目。                                            |
| `heidelberg`      | `digi.ub.uni-heidelberg.de`                                 | 海德堡大学图书馆数字化（含 Codex Manesse 抄本原件）。 |
| `dta`             | `deutschestextarchiv.de`                                    | Deutsches Textarchiv（BBAW），印刷本扫描。            |
| `archive`         | `archive.org`                                               | Internet Archive（影印再版）。                        |
| `freiburger`      | `freiburger-anthologie.ub.uni-freiburg.de`                  | 弗莱堡大学德语抒情诗选集（附学术注解）。              |

> **维基媒体各项目算同一组**：de.wikipedia 与 de.wikisource 常互相引用同一底本，
> 不应视为彼此独立。

---

## 4. 来源分级

**一级（首选，可作主来源）** —— 数字化全集／历史批评版，页面标注纸质版出处与页码：
`zeno.org`、`textlog.de`、`kalliope.org`，以及标注了校勘版出处的 Wikipedia 条目。

**二级（可作辅助来源）** —— 有编辑把关、但不标注校勘版出处的文本站：
`deutschelyrik.de`、`planetlyrik.de`、`lieder.net`、`textarchiv.com`、`aphorismen.de`。

**三级（不可单独充当来源）** —— 教学解析站、博客、诗歌聚合站：
`gedichte7.de`、`zgedichte.de`、`wortwuchs.net`、各类 Interpretation 网站。
这类站点只能作为**第三条**补充来源，或用于印证格律／体裁分析。

> **注意**：`gedichte7.de` 在本项目中被大量使用，因为它排版整洁、提供现代化正字法文本，
> 对学习者友好。这一用途是正当的——但它**不能充当两个必需来源之一**，
> 除非另有一个一级或二级来源同时在场。

---

## 5. 巴洛克与早期文本的附加规则

17—18 世纪作品另需遵守：

1. 正文采用**现代化正字法的通行文本**（面向学习者），
2. **原刊形态必须在 `verification_notes` 中逐字给出**，
3. 凡涉及语义而非单纯拼写的取舍（如陈述/疑问标点、`wieder`/`wider`），
   必须单独标注为**编辑判断**而非文献事实。

---

## 6. 机器校验

```bash
npm run check
```

脚本 `src/validate-sources.js` 会逐首检查并报告：

- `ERROR` —— 来源少于 2 条，或全部来源同属一组（违反规则 A / B）
- `WARN` —— 去掉三级来源后独立来源不足 2 条（违反规则 D 的精神）
- `INFO` —— 通过

校验**不会中断构建**（`npm run build` 仍可运行），但发布前应确保没有 `ERROR`。

---

## 7. 新增一首诗时的来源工作流

1. 先在 `zeno.org` / `textlog.de` / `kalliope.org` 找**一级来源**，记下纸质版出处与页码。
2. 再找一个**不同组**的来源（Wikipedia 条目、deutschelyrik.de、lieder.net…）。
3. 逐词逐标点比对，把**所有**差异写进 `verification_notes`。
4. 若要额外附上 `gedichte7.de` 的现代化文本，作为**第三条**列出，并在 `note` 中标明其为三级来源。
5. 运行 `npm run check`，确认无 `ERROR`。
6. 运行 `npm run snapshot` 抓取新来源的网页存档（规则 F），再 `npm run build`。
7. 凡未能亲自查阅原刊影印件的，一律在 `verification_notes` 的"待核实项"中写明。

---

## 8. 补验证清单（2026 年 8 月，本轮已基本完成）

运行 `npm run check` 可随时得到最新名单。当前状态：**0 个 ERROR，1 个 WARN，32 首通过。**

### 已完成 ✅（16 首）

| #   | 诗                                 | 补入的来源                                            | 比对结果                                                                   |
| --- | ---------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| 08  | Er ist's                           | Zeno（Mörike SW Bd.1, 1967, S.684）**一级**           | 一致；`hab`/`hab'` 省字符差异                                              |
| 16  | Das Mädchen aus der Fremde         | deutschelyrik.de                                      | **完全一致，零异文**；确认 `wußte`、`andern`、`glücklichern`               |
| 17  | Wenn nicht mehr Zahlen und Figuren | deutschelyrik.de                                      | ⚠️ 第 10 行 `ewgen` / `wahren` **实词异文**；仍缺一级来源                  |
| 18  | Am Turme                           | Zeno（Droste SW Bd.1, 1973, S.68–69）**一级**         | 实词标点全同；8 处省字符惯例差异；确认属「Fels, Wald und See」辑           |
| 20  | Abendlied                          | Zeno（Claudius《作品单卷本》1976, S.217–218）**一级** | ⚠️ 第 35 行 `im Himmel` / `in Himmel` **实词异文**；另 6 处拼写标点        |
| 21  | Der Spinnerin Nachtlied            | deutschelyrik.de                                      | ⚠️ 疑似**两个传本**：`Als`/`Da`、`Denk' ich wohl`/`Gedenk ich`；题名亦不同 |
| 22  | Frühlingsglaube                    | deutschelyrik.de                                      | **完全一致，零异文**；确认 `Herze`/`Herz` 与第 10 行冒号                   |
| 24  | Herbstbild                         | Zeno（Hebbel SW I, 1911ff, S.232）**一级**            | 一致；5 处 19 世纪正字法；另确认辑目归属                                   |
| 25  | Die Stadt                          | Zeno（Storm SW Bd.1, ⁴1978, S.112）**一级**           | 一致；`ohn`/`ohn'`/`ohne` **三方各异**                                     |
| 26  | Der römische Brunnen               | deutschelyrik.de                                      | 完全一致，另确证单节排版                                                   |
| 27  | Herr von Ribbeck                   | deutschelyrik.de                                      | **查出 Zeno 的转录讹误**，正文已改 `ich gew di` → `ick gew di`             |
| 28  | Die Beiden                         | Zeno（Hofmannsthal GW Bd.1, 1924, S.7）**一级**       | **查出本站转录错误**；`glich` 与标题大小写定案                             |
| 30  | Es ist alles eitel                 | deutschelyrik.de                                      | 实词全同；5 处现代化程度差异（`vor`/`für`、`findt`/`find't` 等）           |
| 31  | Tränen des Vaterlandes             | Zeno（Gryphius GA Bd.1, 1963, S.48）**一级**          | 查得 **1643 年中间稿全文**；见下方限定                                     |
| 32  | An Sich                            | Zeno（Fleming, Lappenberg 1865, S.472）**一级**       | 一致；**发现辑内编号差异**（Lappenberg 26 vs. Olearius 24）                |
| 33  | Weltende                           | deutschelyrik.de                                      | 用词一致；第 3 行行末逗号异文                                              |

### 本轮最有价值的三个发现

**1. 27 Herr von Ribbeck —— 一级来源也会错。** Zeno 的《冯塔纳全集》第 20 卷第 40 行作
`ich gew di`，而 deutschelyrik.de 与 gedichte7.de 均作 `ick`。此处是梨树以低地德语说的引语，
同诗第 10 行即为 `ick hebb 'ne Birn`，Zeno 自身不自洽。三来源二比一 + 内证 ⇒ 判为 Zeno 转录讹误，
**本站正文已据此修订**。这说明"一级来源优先"是概率判断而非教条，遇到内证冲突时必须让位于校勘学推理。

**2. 28 Die Beiden —— 补验证查出的是我们自己的错。** 详见该诗 `verification_notes`。

**3. 三首诗查出了真正的版本问题（17、20、21）。** 这三处都是实词层面的差异，
无法用正字法或标点解释。本站一律**不擅改正文**，而是在 `verification_notes` 中并列两读、
说明各自的来源与倾向、列为待核实项。这正是"两个来源"制度存在的意义——
它的产出不是"确认无误"，而是"确认哪里还不确定"。

### 仍未了结的问题 ⏳

| #   | 诗                                 | 问题                                                                                                                          | 下一步                                                                                         |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 33  | Weltende                           | **唯一的 WARN**：planetlyrik + possel + deutschelyrik，三源皆非一级                                                           | 查 1911 年《Der Demokrat》初刊，或 de.wikipedia 的 Weltende 条目（wikimedia 组，且常引校勘版） |
| 31  | Tränen des Vaterlandes             | 机器判通过，但 Zeno 给的是 **1643 年稿**，本站正文用的 1663 年最后手定版仍只有 Wikipedia 一家转录                             | 找一个独立转录 1663 年版的一级来源                                                             |
| 17  | Wenn nicht mehr Zahlen und Figuren | 第 10 行 `ewgen` / `wahren`；三来源中无一级来源                                                                               | Novalis 历史批评版（Kluckhohn / Samuel 编）                                                    |
| 20  | Abendlied                          | 第 35 行 `im` / `in Himmel`（Zeno 的 `in` 是"较难读法"，更可能是原貌）；另本站正文正字法不自洽（保留 `seyn` 却用现代的 `im`） | 1779 年《Musenalmanach》初刊或 1783 年《Asmus》第四部影印件                                    |
| 21  | Der Spinnerin Nachtlied            | 两个传本并存，尚不能判定孰先孰后                                                                                              | 1801 年《戈德维》原刊或 Frankfurter Brentano-Ausgabe                                           |

> ⚠️ **31 的限定仍然有效**：`npm run check` 会判本诗通过，这一点上机器判定优于实情。

### 检索经验（已实测）

- **Zeno 先抓目录页**。直接猜诗题命中率约三分之一，猜错只返回空页、成本极低；
  但目录页一次给出该作者全部诗作的准确 URL，且能顺带确认辑目归属（18 Am Turme 即由此纠正）。
- **deutschelyrik.de 可以直接猜 slug**：`https://www.deutschelyrik.de/<诗题小写连字符>.html`，
  变音字母转写为 `ae/oe/ue`。本轮 5 次猜测中 4 次命中。少数诗另有数字后缀（如 Ribbeck 的 `.436`），
  猜不中时抓作者页（`schiller.html`、`brentano.html`…）即可拿到全部准确链接。
- **注意题名可能不同**：21 在 deutschelyrik.de 上题作「Der Spinnerin **Lied**」，按 Nachtlied 猜会落空。
- deutschelyrik.de 单页体积约为 Zeno 的 2–3 倍（附全站作者导航），检索时应有预期。
