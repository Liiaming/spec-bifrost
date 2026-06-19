# 更新日志 / Changelog

## 0.4.1

- 优化预览工作台的配色、层级、间距与移动端控件尺寸，降低模板化和装饰性视觉噪声。
- 改进预览可访问性，补充跳转主内容链接、导航与备注切换状态、状态消息语义和减少动态效果支持。
- 更新 README 预览截图以匹配当前渲染效果。
- Refined the preview workspace palette, hierarchy, spacing, and mobile control sizing to reduce templated and decorative visual noise.
- Improved preview accessibility with a skip link, navigation and notes-toggle states, semantic status messages, and reduced-motion support.
- Updated the README preview screenshot to match the current renderer.

## 0.4.0

- 新增 OpenCode 配置入口 `plugins/spec-bifrost/opencode.json`，提供 `/spec-bifrost-*` 命令并复用现有 Spec Bifrost skills。
- 同步更新中文 README、英文 README 和插件 README，说明 OpenCode 通过 `OPENCODE_CONFIG` 使用本仓库配置。
- 将根 package、Claude manifest 和 Codex manifest 版本同步更新到 `0.4.0`。
- Added the OpenCode config entrypoint `plugins/spec-bifrost/opencode.json`, exposing `/spec-bifrost-*` commands that reuse the existing Spec Bifrost skills.
- Updated the Chinese README, English README, and plugin README with OpenCode usage through `OPENCODE_CONFIG`.
- Bumped the root package, Claude manifest, and Codex manifest versions to `0.4.0`.

## 0.3.0

- 扩展 v0.3 需求表达组件，新增可编辑明细表、层级表格、对比表、看板、工作流、向导、进度、结果反馈、图表、日历、甘特、权限矩阵、规则清单、检查清单、审计日志、附件列表、评论串、组织结构、折叠面板和关系图。
- 新增 `relations` 字段，用于表达工作流、关系图、组织结构和甘特等组件内的业务节点关系，并校验关系端点引用。
- 为全部 v0.3 组件提供低噪声 B 端语义化预览渲染。
- 丰富采购申请管理系统示例，覆盖全部 v0.3 组件和前后端导出样例。
- 统一表格、矩阵和清单类组件的标题层级，修正移动端预览间距和多余分割线。
- 同步更新中英文 README、插件 README、schema skill、export skill 和预览截图。
- Expanded v0.3 requirement-expression components with editable tables, tree tables, comparison tables, kanban boards, workflows, wizards, progress trackers, result panels, charts, calendars, gantt plans, permission matrices, rule lists, checklists, audit logs, attachment lists, comment threads, org charts, collapse panels, and relation graphs.
- Added `relations` for business node relationships inside workflows, relation graphs, org charts, and gantt components, with endpoint reference validation.
- Added low-noise B-end semantic preview rendering for all v0.3 components.
- Expanded the procurement request management example to cover every v0.3 component and the frontend/backend export samples.
- Aligned title hierarchy for table, matrix, and list components while fixing mobile preview spacing and redundant dividers.
- Updated Chinese/English README files, plugin README, schema skill, export skill, and the preview screenshot.

## 0.2.1

- 收敛预览页视觉风格，改为更克制、低干扰的 B 端工作台界面。
- 去除装饰性网格背景和偏暖纸色调，降低阴影、字重和按钮动效。
- 补充可访问焦点态、数字等宽显示和更清晰的表单占位文案。
- 更新 README 预览截图以匹配当前渲染效果。
- Refined the preview UI into a quieter, lower-noise B-end workspace style.
- Removed the decorative grid background and warm paper palette, while reducing shadows, font weight, and button motion.
- Added clearer focus states, tabular numeric rendering, and clearer form placeholder copy.
- Updated the README preview screenshot to match the current renderer.

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
