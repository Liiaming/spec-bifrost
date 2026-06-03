# 更新日志 / Changelog

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
