# 更新日志 / Changelog

## 0.2.0

- 增强需求表达组件，新增 `metricList`、`timeline` 和 `treeList` schema 支持。
- 为 `tabs`、`modal` 和 `drawer` 提供语义化预览渲染。
- 支持表格批量操作保持在工具栏，避免误渲染为行内操作。
- 丰富采购申请管理系统示例，覆盖指标、分组视图、附件抽屉、驳回确认弹窗、审批时间线、品类树和批量导出。
- 同步更新中英文 README、插件 README、schema skill、export skill、导出样例和预览截图。
- Added richer requirement-expression components with `metricList`, `timeline`, and `treeList` schema support.
- Added semantic preview rendering for `tabs`, `modal`, and `drawer`.
- Kept batch table actions in the toolbar instead of rendering them as row actions.
- Expanded the procurement request management example with metrics, tabs, an attachment drawer, a rejection confirmation modal, an approval timeline, a category tree, and batch export.
- Updated Chinese/English README files, plugin README, schema skill, export skill, export samples, and the preview screenshot.

## 0.1.4

- 优化 README 首屏叙事，强化面向产品经理、独立开发者和小团队的开源定位。
- 增加真实预览截图、工作流流程图、ROADMAP、FUNDING 和 GitHub 协作模板。
- 补充 token 成本优势说明，强调结构化 JSON 中间层相比“AI 生成原型再转换”的 token-efficient 工作流。
- Improved the README first screen for product managers, indie developers, small teams, and open source adoption.
- Added a real preview screenshot, workflow diagrams, ROADMAP, FUNDING, and GitHub collaboration templates.
- Added token-efficiency positioning for the structured JSON middle layer compared with prototype-generation-and-conversion workflows.

## 0.1.3

- 修正 Codex 插件清单版本未随发布版本同步的问题。
- 新增版本一致性测试，确保根 package、Claude manifest 和 Codex manifest 版本一致。
- 在 AGENTS.md 中记录版本发布和 README 中英文同步规则，避免发布元数据再次漂移。
- Fixed the Codex plugin manifest version not being synchronized with release versions.
- Added a version consistency test for the root package, Claude manifest, and Codex manifest.
- Documented release version and README language sync rules in AGENTS.md to prevent metadata drift.

## 0.1.2

- 完善导出 skill 输出规范，固定前端版和后端版需求文档的推荐章节结构。
- 基于现有采购申请管理系统示例补充前端版和后端版导出样例。
- 同步更新中文、英文和插件 README 的导出步骤、文档边界与示例路径。
- Refined export skill guidance with stable recommended sections for frontend and backend requirement documents.
- Added frontend and backend export samples based on the existing procurement request management example.
- Updated Chinese, English, and plugin README export steps, document boundaries, and sample paths.

## 0.1.1

- 增强校验诊断输出，补充页面、组件、字段和动作的上下文定位。
- 丰富采购申请管理系统示例，覆盖条件规则、操作反馈、步骤列表和供应商卡片。
- 优化导出 skill 说明，明确前端版和后端版需求文档的结构与边界。
- Improved validation diagnostics with page, component, field, and action context.
- Expanded the procurement request management example with conditions, action feedback, step lists, and supplier cards.
- Refined the export skill guidance for frontend and backend requirement document structure and boundaries.

## 0.1.0

- 发布初始 MVP 插件结构，支持 Claude Code 和 OpenAI Codex marketplace 安装。
- 支持通过 `/spec-bifrost:spec` 创建或修改本地 `spec-bifrost.json`。
- 支持 JSON 语法、schema 和引用完整性校验。
- 支持本地多页面 B 端原型预览，默认绑定 `127.0.0.1:3737`。
- 支持 `/spec-bifrost:stop` 手动排查并释放预览端口。
- 支持导出前端版和后端版 Markdown 需求文档。
- 内置采购申请管理系统示例。
- Published the initial MVP plugin structure with Claude Code and OpenAI Codex marketplace installation support.
- Supports creating or editing local `spec-bifrost.json` files through `/spec-bifrost:spec`.
- Supports JSON syntax, schema, and reference integrity validation.
- Supports local multi-page business-facing prototype previews on `127.0.0.1:3737` by default.
- Supports `/spec-bifrost:stop` for manually inspecting and freeing the preview port.
- Supports exporting frontend and backend Markdown requirement documents.
- Includes a procurement request management example.
