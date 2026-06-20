# Spec Bifrost 首轮推广材料

## 统一事实

- 当前版本：v0.4.1。
- 目标用户：正在从零建设 B 端系统，且产品与开发都在使用 AI 的小公司和大公司。
- 核心问题：产品侧 AI 与开发侧 AI 没有共享上下文，需求被重复转述并发生语义漂移。
- 核心机制：本地、可校验、可预览、可版本化的 `spec-bifrost.json`。
- 核心边界：不生成生产代码、接口定义、数据库设计、技术架构或任务拆分。
- 当前请求：邀请真实产品研发团队完成试用并反馈，而不是征集抽象功能点。

## 不使用的表述

- 不虚构外部团队采用情况，也不声称已经证明能提升效率。
- 不把它描述为低代码平台、AI 编程工具或高保真设计工具。
- 不主打组件数量。
- 不承诺节省固定比例的时间或 token。
- 不使用“颠覆”“革命性”“全自动”等无法验证的词。

## 中文长文

### 产品和开发都在用 AI，为什么需求仍然要重复讲一遍？

很多团队已经不是“要不要用 AI”的阶段了。

产品用 AI 梳理流程、写需求、做原型；开发用 AI 读代码、生成实现、排查问题。但两边的 AI 上下文通常没有联通。产品得到的页面、字段、规则和备注，到了开发侧仍要重新解释一次。第二次转述之后，业务口径、状态流转和例外很容易漂移。

直接让 AI 生成代码也不能解决这个问题。对真实 B 端系统，团队通常不会完全信任一次生成的生产代码；在代码之前，仍需要一份可以检查、讨论和版本化的需求资产。

我在做的 Spec Bifrost 尝试把这层资产固定为本地 `spec-bifrost.json`：

1. 产品通过 Claude Code、Codex 或 OpenCode 描述一个新 B 端系统。
2. AI 生成并修改结构化 JSON。
3. 插件校验 JSON，并渲染多页面需求原型。
4. 产品根据预览修正需求。
5. 开发和开发侧 AI 继续读取同一份 JSON。
6. 团队从同一份资产导出前端版和后端版需求文档。

它刻意不做生产代码、接口、数据库、架构和任务拆分。当前要验证的也不是“还能增加什么组件”，而是产品与开发是否真的能少做一次重复转述。

项目目前是 v0.4.1，包含一个采购申请管理系统示例。现在希望找到正在从零规划内部系统或其他 B 端系统的产品 + 开发组合，实际完成一次流程。

仓库：https://github.com/Liiaming/spec-bifrost

如果你试过，请不要只说“不错”或列功能愿望。更有价值的是告诉我：

- 你们在规划什么类型的 B 端系统；
- 完成到了安装、示例、自有 spec、产品评审、开发评审还是文档导出；
- 它具体减少了什么重复解释，或者在哪一步被阻塞。

结构化反馈入口：https://github.com/Liiaming/spec-bifrost/issues/new?template=adoption_feedback.yml

## 中文短帖

产品和开发都在用 AI，但两边的 AI 上下文通常没有联通。

Spec Bifrost 用一份本地、可校验、可预览、可版本化的 `spec-bifrost.json` 连接产品评审和开发评审，再从同一份需求资产导出前后端需求文档。

它不生成生产代码、接口、数据库或技术架构。当前 v0.4.1 不继续加功能，先找真实 B 端团队验证完整流程。

项目：https://github.com/Liiaming/spec-bifrost

试用反馈：https://github.com/Liiaming/spec-bifrost/issues/new?template=adoption_feedback.yml

## English Show HN

### Show HN: Spec Bifrost – a shared AI-readable requirements artifact before code

Product and engineering teams increasingly use AI on both sides, but the context usually stays disconnected. Product may use AI for flows, requirements, and prototypes; engineering then has to explain the same pages, fields, rules, and exceptions again to its own AI tools.

Spec Bifrost explores a shared artifact between those workflows: a local `spec-bifrost.json` that is validatable, previewable, versionable, and readable by both product-side and engineering-side AI.

The workflow is:

1. Product describes a new business-facing system in Claude Code, Codex, or OpenCode.
2. AI creates and edits `spec-bifrost.json`.
3. The plugin validates it and renders a multi-page requirement prototype.
4. Product reviews and corrects the same artifact.
5. Engineering and engineering-side AI continue from it.
6. The team exports frontend and backend requirement documents from the same source.

It deliberately does not generate production code, APIs, database designs, architecture, or task breakdowns. The current question is whether this reduces repeated explanation and semantic drift before implementation.

The project is at v0.4.1 and includes a procurement-system example. I am looking for product + engineering teams planning a real new internal or business-facing system who are willing to try the full workflow.

Repository: https://github.com/Liiaming/spec-bifrost

Structured trial feedback: https://github.com/Liiaming/spec-bifrost/issues/new?template=adoption_feedback.yml

## English Short Post

Product and engineering both use AI, but their AI context rarely connects.

Spec Bifrost uses one local, validatable, previewable, and versionable `spec-bifrost.json` for product review, engineering review, and frontend/backend requirement exports.

It does not generate production code, APIs, databases, architecture, or task breakdowns. v0.4.1 is now focused on real team trials instead of more features.

Project: https://github.com/Liiaming/spec-bifrost

Trial feedback: https://github.com/Liiaming/spec-bifrost/issues/new?template=adoption_feedback.yml

## 回复模板

### 对方只评价“不错”

谢谢。当前最需要的不是泛泛评价，而是实际试跑证据。如果方便，请告诉我：你是否运行过示例或创建过自己的 spec，完成到了哪个阶段，在哪一步获得价值或被阻塞？

### 对方直接提出功能

我会先记录，但当前不会因为单条功能建议改产品。想确认一下：这个需求来自实际试用中的哪一步？它是否阻止了你完成产品评审、开发评审或文档导出？

### 对方遇到安装问题

请提供 Spec Bifrost 版本、AI 工具、操作系统、执行命令、预期结果和实际输出，并删除路径中的客户名称或敏感信息。如果问题可复现且阻止安装或启动，会按严重缺陷优先处理。

### 对方完成部分流程

请补充项目场景、产品和开发是否都参与、完成阶段，以及最具体的一项价值或阻塞。可以直接使用结构化反馈表单：

https://github.com/Liiaming/spec-bifrost/issues/new?template=adoption_feedback.yml
