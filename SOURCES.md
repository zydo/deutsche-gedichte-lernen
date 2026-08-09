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

---

## 3. 运营方分组表

校验脚本 `src/validate-sources.js` 依此表判定独立性。**新增来源站点前请先在此登记。**

| 组 ID           | 站点                                                        | 说明                                             |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `possel`        | `gedichte7.de`、`zgedichte.de`                              | **同一运营方**（Heiko Possel）。二者不可互证。   |
| `zeno`          | `zeno.org`                                                  | 数字化全集库，标注纸质版出处。                   |
| `wikimedia`     | `de.wikipedia.org`、`en.wikipedia.org`、`de.wikisource.org` | 维基媒体项目，视为同一组。                       |
| `textlog`       | `textlog.de`                                                | 数字化全集库。                                   |
| `deutschelyrik` | `deutschelyrik.de`                                          | Fritz Stavenhagen 的朗诵与文本站。               |
| `planetlyrik`   | `planetlyrik.de`                                            | 附《德国广播电台抒情诗历》评注，标注纸质版出处。 |
| `liedernet`     | `lieder.net`                                                | LiederNet Archive，标注所据印本。                |
| `kalliope`      | `kalliope.org`                                              | 丹麦 Kalliope 文库。                             |
| `textarchiv`    | `textarchiv.com`、`de.textarchiv.com`                       |                                                  |
| `aphorismen`    | `aphorismen.de`                                             |                                                  |
| `wortwuchs`     | `wortwuchs.net`                                             | 教学解析站，仅作辅助。                           |

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
6. 凡未能亲自查阅原刊影印件的，一律在 `verification_notes` 的"待核实项"中写明。

---

## 8. 待补验证清单（2026 年 8 月）

运行 `npm run check` 可随时得到最新名单。以下是发现问题时的完整快照与**已探明的候选 URL**，
按此清单逐首补验证即可，不必再重新检索。

### 已完成 ✅（5 首）

| # | 诗 | 补入的来源 | 比对结果 |
|---|---|---|---|
| 08 | Er ist's | Zeno（Mörike SW Bd.1, 1967, S.684）**一级** | 一致；第 9 行 `hab`/`hab'` 省字符差异 |
| 25 | Die Stadt | Zeno（Storm SW Bd.1, ⁴1978, S.112）**一级** | 一致；第 7 行 `ohn`/`ohn'`/`ohne` **三方各异** |
| 26 | Der römische Brunnen | deutschelyrik.de | 完全一致，另确证单节排版 |
| 28 | Die Beiden | Zeno（Hofmannsthal GW Bd.1, 1924, S.7）**一级** | **查出本站转录错误**；`glich` 与标题大小写定案 |
| 33 | Weltende | deutschelyrik.de | 用词一致；第 3 行行末逗号异文 |

> **28 Die Beiden 最能说明补验证的价值**：Zeno 的一级来源查出本站把首行行末的破折号误置于第 2 行行首
> —— 这是录入疏忽而非版本差异，已改正并同步更新逐行注释锚点。同时定案了两个悬案：
> 第 2 行确为单数 `glich`（作者生前《全集》本），标题应作大写 `Die Beiden`（`title_de` 已据此修改）。

### 待补 ⏳（12 首）

**已实测有效的 Zeno URL 模式**，可直接套用：

```
http://www.zeno.org/Literatur/M/<作者姓,+名>/Gedichte/<诗集名>/<辑名>/<诗题>
```

诗集名与辑名必须精确，例如 `Gedichte+(Ausgabe+1885)/Erstes+Buch`、`Die+Gedichte:+Ausgabe+1924`。
**猜错只返回空页、几乎不耗成本，可放心批量试**；试不出时用一次 WebSearch 检索
`zeno.org <作者> <诗题> <首行>` 即可拿到准确 URL。

deutschelyrik.de 上**已确认存在**的（URL 摘自该站作者索引）：

| # | 诗 | 候选 URL |
|---|---|---|
| 24 | Herbstbild | `deutschelyrik.de/herbstbild.435.html` |
| 27 | Herr von Ribbeck | `deutschelyrik.de/herr-von-ribbeck-auf-ribbeck-im-havelland.436.html` |

其余需检索的：

| # | 诗 | 建议来源 | 备注 |
|---|---|---|---|
| 16 | Das Mädchen aus der Fremde | deutschelyrik | 现有 zeno，需一个非 zeno 的独立源 |
| 17 | Wenn nicht mehr Zahlen und Figuren | zeno / deutschelyrik | 现有 wikimedia |
| 18 | Am Turme | zeno | 辑名为「Fels, Wald und See」而非「Heidebilder」，本轮试错未中，需检索 |
| 20 | Abendlied | zeno / deutschelyrik | 现有 wikimedia |
| 21 | Der Spinnerin Nachtlied | deutschelyrik | 现有 zeno |
| 22 | Frühlingsglaube | deutschelyrik | 现有 zeno |
| 24 | Herbstbild | zeno | 现有两源均非一级，补 zeno 可同时消两类 WARN |
| 30 | Es ist alles eitel | deutschelyrik | 现有 zeno |
| 31 | Tränen des Vaterlandes | zeno | 现有 wikimedia；zeno 藏有 Gryphius 十四行全集 |
| 32 | An Sich | zeno | 现有两源均非一级 |
| 33 | Weltende | — | 已有 3 源但均非一级；1911 年《Der Demokrat》初刊本待查 |

> **批量策略**：优先 `zeno.org` —— 页面比 `deutschelyrik.de` 紧凑得多（后者每页附全站作者导航），
> 且属一级来源，能一次消除「独立性不足」与「无一级来源」两类 WARN。
