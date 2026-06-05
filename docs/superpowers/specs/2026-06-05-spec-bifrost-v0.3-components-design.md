# Spec Bifrost v0.3 组件增强设计

## 背景

Spec Bifrost v0.2.1 已完成 Claude Code marketplace 分发、基础校验、预览、导出、端口释放命令、开源增长叙事和更克制的 B 端预览视觉。当前 schema 支持常见页面、表单、筛选、表格、详情、卡片、步骤、指标、分组、弹窗、抽屉、时间线、树形列表、备注、条件和动作。

下一步目标是让产品经理能描述更多真实 B 端系统，而不是只覆盖采购系统的基础 CRUD 与审批场景。v0.3 将扩展需求表达组件，使同一份 `spec-bifrost.json` 能承载更复杂的表格、流程、计划、权限、协作和治理类需求。

## 目标

- 一次性把 P0 和 P1 候选组件纳入 v0.3 范围。
- 保持插件边界：产出需求原型和需求文档，不产出生产代码、接口定义、数据库设计、技术架构或任务拆分。
- 保持 renderer 无框架依赖，继续输出原生 HTML/CSS/JS。
- 在现有采购申请管理系统示例上丰富组件，不新增第二个示例目录。
- 每个新增组件都必须被 schema、validate、renderer、export skill、README 和测试覆盖。

## 非目标

- 不引入 React、Ant Design、shadcn/ui、Recharts、D3、Mermaid 或图形布局引擎作为运行时依赖。
- 不做真实图表交互、拖拽看板、甘特图排程算法、日历选择器、权限计算器或工作流执行器。
- 不新增持久化、接口 mock、后端模拟、鉴权或用户输入保存。
- 不在 v0.3 同时扩展字段类型；`treeSelect`、`cascader`、`transfer`、`slider`、`percent`、`email`、`phone`、`url`、`richText` 等字段类型后续单独评估。

## 设计原则

新增组件是“B 端需求语义”，不是 UI 库组件名。renderer 的职责是让人能快速理解需求形状；导出 skill 的职责是让 Claude Code 或 Codex 把这些结构化事实裁剪成前后端需求文档。

组件数据优先复用现有字段：

- `fields`：表单字段、明细行字段、矩阵维度字段。
- `columns`：表格列、对比列、审计记录列。
- `items`：组件条目、节点、卡片、事件、阶段、规则。
- `actions`：用户可见操作、行操作、批量操作、流转动作。
- `emptyState`：无数据、未配置或未满足条件时的说明。
- `notes`：暂不稳定结构化的产品事实。

为关系类组件新增一个最小通用字段：

```ts
relations?: RelationSpec[];

interface RelationSpec {
  sourceId: string;
  targetId: string;
  label?: string;
  type?: string;
  notes?: Notes;
}
```

`relations` 用于表达节点关系，不表达技术依赖。它服务 `workflowDiagram`、`relationGraph`、`orgChart` 和 `gantt`。validate 需要检查 `sourceId` 与 `targetId` 都能引用当前组件 `items[].id`。

## 新增组件

### 数据与表格组

#### `editableTable`

表达可编辑明细行，例如采购清单、报价行、费用拆分、预算分摊和可增删行的表格。使用 `columns` 描述每行字段，`items` 描述示例行，`actions` 描述新增行、删除行、复制行、批量导入、保存草稿等需求。

renderer 展示为带行号、可编辑输入态和表格工具栏的预览，不保存输入。export 时前端版强调列、行操作、校验反馈；后端版强调明细项口径、汇总规则和提交结果。

#### `treeTable`

表达层级表格，例如组织、预算科目、采购类目、权限资源和项目分解结构。使用 `columns` 描述字段，`items[].children` 描述层级。

renderer 展示为带缩进和展开视觉的表格。validate 不做递归业务完整性，只保证 `items` 是数组，字段结构合法。

#### `comparisonTable`

表达横向对比，例如供应商对比、方案对比、报价对比、套餐对比和审批前后差异。使用 `columns` 表达对比维度或候选项，`items` 表达指标行。

renderer 展示为横向对比表，支持高亮 `recommended`、`difference` 或 `status` 字段。export 时强调对比口径、推荐原因和决策备注。

### 流程与状态组

#### `kanbanBoard`

表达按状态分组的业务流转，例如采购申请、商机、工单、招聘候选人或内容审核。`items` 的一级条目表示列，列下 `children` 表示卡片。

renderer 展示为横向看板列，不支持拖拽。export 时说明状态分组、卡片字段、允许动作和状态流转约束。

#### `workflowDiagram`

表达状态机、审批流、节点跳转、异常路径和退回路径。`items` 表示节点，`relations` 表示节点之间的流转。

renderer 展示为简化流程图。它不需要自动布局复杂图，只要按 `items` 顺序排布并画出可读连线或关系列表。export 时后端版重点保留节点、结果、条件和例外路径。

#### `wizard`

表达多步骤创建、分步审批、分段配置或复杂表单流程。`items` 表示步骤，步骤内可用 `fields`、`description`、`notes` 表达每步要求。

renderer 展示为步骤导航加当前步骤内容。export 时前端版强调步骤、按钮、校验和返回规则；后端版强调每步提交后业务状态。

#### `progressTracker`

表达阶段完成度、任务完成率、资料补齐度、预算使用进度或审批进度。`items` 表示阶段或指标。

renderer 展示为进度条或阶段进度列表。它只表达静态需求，不计算真实完成率。

#### `resultPanel`

表达提交成功、审批通过、审批驳回、导入完成、部分失败等结果反馈。使用 `emptyState` 或 `items` 描述结果标题、说明、下一步动作和注意事项。

renderer 展示为结果信息块。export 时前端版强调用户反馈和下一步入口；后端版强调业务结果和例外处理。

### 计划与可视化组

#### `chart`

表达金额趋势、状态分布、预算占用、审批效率、分类占比等静态图表需求。`items` 表示数据点或分类项，组件或条目中的 `chartKind` 可用于区分 `bar`、`line`、`pie`、`donut`、`area`，避免占用组件自身的 `type` 字段。

renderer 使用轻量 SVG/CSS 输出静态图形，不引入图表库。validate 只检查组件类型和数组结构，不校验图表数学正确性。

#### `calendar`

表达排期、交付计划、采购节点、预约、周期事件和关键日期。`items` 表示日期事件，可包含 `date`、`startDate`、`endDate`、`status`、`owner`。

renderer 展示为月视图或事件清单结合的静态日历，不做日期选择器。

#### `gantt`

表达项目计划、采购周期、供应商交付、上线里程碑和跨阶段依赖。`items` 表示任务条，`relations` 表示前后依赖。

renderer 展示为横向时间轴任务条。它不计算排期，只展示 JSON 中给定的开始、结束和依赖。

### 治理、协作与结构组

#### `permissionMatrix`

表达角色、页面、操作、字段或数据范围权限。`columns` 可表示权限项，`items` 表示角色或资源行。

renderer 展示为矩阵表。export 时前端版强调可见性、可操作性和字段级限制；后端版强调业务权限口径和例外。

#### `ruleList`

表达业务规则、校验规则、例外规则、SLA、金额阈值、审批条件和跨字段约束。`items` 表示规则条目。

renderer 展示为编号规则列表。export 时前后端文档都必须保留规则文本，但不能把它扩写成实现方案。

#### `checklist`

表达资料清单、上线前检查、审批前置条件、采购申请必备材料和操作前确认项。`items` 表示检查项，可包含 `required`、`status`、`owner`。

renderer 展示为复选清单。它不保存勾选状态。

#### `auditLog`

表达操作记录、审批记录、字段变更历史和系统留痕。它和 `timeline` 接近，但语义更偏审计。`columns` 描述记录字段，`items` 表示日志样例。

renderer 展示为审计表或紧凑日志列表。export 时后端版强调留痕范围、记录口径和可追溯要求。

#### `attachmentList`

表达附件列表、上传状态、审核状态、文件备注、版本和归档要求。`items` 表示附件，`actions` 表示上传、预览、删除、重新提交等操作。

renderer 展示为文件列表，不上传文件。export 时保留文件类型、大小、状态、是否必传和备注。

#### `commentThread`

表达审批意见、协作备注、驳回原因、跟进讨论和内部沟通记录。`items` 表示评论，支持 `author`、`time`、`content`、`status`。

renderer 展示为评论串。它不提供真实输入或持久化。

#### `orgChart`

表达组织结构、汇报关系、审批层级和部门负责人关系。`items` 表示节点，`relations` 或 `children` 表达层级。

renderer 展示为简化组织树。validate 只检查关系端点是否存在，不判断组织环路。

#### `collapsePanel`

表达复杂详情页中的折叠信息组，例如基础信息、财务信息、审批记录、附件、异常说明。`items` 表示折叠面板。

renderer 展示为静态折叠面板，首个默认展开。它用于降噪，不承载复杂交互。

#### `relationGraph`

表达对象关系、上下游依赖、关联单据、主从单据和跨模块引用。`items` 表示节点，`relations` 表示边。

renderer 展示为简化关系图或关系列表。它不做复杂图布局或可视化分析。

## Schema 与校验

需要更新：

- `ComponentSpec`：增加 20 个 `ComponentType`，增加可选 `relations`。
- `RelationSpec`：新增类型定义。
- `SUPPORTED_COMPONENT_TYPES`：同步全部新增组件。
- `validateComponent`：校验 `relations` 是数组。
- `validateRelations`：当 `relations` 存在时，要求每项是对象，`sourceId` 和 `targetId` 是非空字符串；可选 `label`、`type` 是字符串；可选 `notes` 是字符串数组。
- `validateReferences`：对当前组件 `items[].id` 建索引，检查 `relations[].sourceId` 与 `relations[].targetId` 是否存在于同一组件。

暂不对每个组件做强 shape 校验。理由是 v0.3 的重点是扩展表达能力，过早把每类组件的 `items` 形状固化会降低产品经理和 AI 迭代弹性。强约束只放在通用字段、字段数组、动作数组、关系端点和已存在的引用完整性上。

## Renderer

renderer 需要新增每个组件的语义化渲染函数。目标是“看得懂这个需求组件在表达什么”，不是还原真实生产 UI。

建议按现有 `renderHtml.ts` 风格实现：

- 每个组件一个 `renderXxx` 函数。
- 共用 `normalizeRecords`、`renderComponentTitle`、`renderActionBar`、`renderNotesBlock`、`renderTableCell`。
- 新增少量通用渲染 helper：`renderRelationList`、`renderCompactMeta`、`renderProgressBar`。
- CSS 继续保持低干扰 B 端工作台风格，不引入装饰性背景或重动效。

如果 `renderHtml.ts` 因新增组件继续膨胀，需要在 v0.3 内做一次针对 renderer 的小范围拆分，例如把组件渲染函数移到 `renderComponents.ts`，但不改变对外 API。

## Export Skill

`/spec-bifrost:export` 需要把新增组件写入前后端需求文档约束：

- 前端版：页面结构、用户可见组件、字段、操作、反馈、分组、流程、权限呈现、评论和附件体验。
- 后端版：业务对象口径、明细行、规则、流程结果、权限口径、审计留痕、附件约束、关系和例外。

导出仍然不能包含接口定义、数据库设计、技术架构、代码结构、状态管理、组件库选型或任务拆分。

## 示例

继续丰富现有示例：

```txt
plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json
```

示例应覆盖全部新增组件，但可以分散在现有页面或少量新增页面中。优先让采购系统变成一个更完整的“从申请、审批、预算、供应商、交付、权限到留痕”的演示，而不是堆砌组件展板。

示例导出样例需要同步：

```txt
plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/frontend-requirements.md
plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/backend-requirements.md
```

## 文档

用户可见文档需要同步：

- `README.md`
- `README.en.md`
- `plugins/spec-bifrost/README.md`
- `plugins/spec-bifrost/skills/spec/schema.md`
- `plugins/spec-bifrost/skills/export/SKILL.md`
- `plugins/spec-bifrost/skills/spec/export.md`
- `plugins/spec-bifrost/CHANGELOG.md`

README 需要说明 v0.3 新增组件让产品经理能覆盖更复杂 B 端系统，同时继续强调 token 成本优势和本地 JSON 中间层。

## 测试

需要新增或更新测试：

- core：新增组件通过校验；`relations` shape 错误会报 schema error；关系端点缺失会报 reference error。
- renderer：每个新增组件渲染为明确语义结构，不回落为通用 simple component。
- example：采购系统示例覆盖全部新增组件。
- config/skills：Claude 与 Codex 插件描述、schema skill、export skill 包含新增组件重点。
- docs/version guard：继续确保 README 同步规则和版本一致性不被破坏。

最终验证：

```bash
npm run check
npm run spec-bifrost -- validate --cwd plugins/spec-bifrost/examples/procurement-system
npm run spec-bifrost -- preview --cwd plugins/spec-bifrost/examples/procurement-system --host 127.0.0.1 --port 3737
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

可见 UI 改动需要更新并检查 `docs/assets/spec-bifrost-preview.png`。

## 实现顺序

v0.3 对外作为一个版本发布，对内按四组小提交推进：

1. 数据与表格组：`editableTable`、`treeTable`、`comparisonTable`。
2. 流程与状态组：`kanbanBoard`、`workflowDiagram`、`wizard`、`progressTracker`、`resultPanel`。
3. 计划与可视化组：`chart`、`calendar`、`gantt`。
4. 治理、协作与结构组：`permissionMatrix`、`ruleList`、`checklist`、`auditLog`、`attachmentList`、`commentThread`、`orgChart`、`collapsePanel`、`relationGraph`。

每组都按相同顺序完成：

1. 更新类型、常量和校验。
2. 更新 renderer。
3. 更新示例。
4. 更新 tests。
5. 更新 skills 和 README。

## 风险与控制

- 范围较大：通过四组提交控制 review 和回归范围。
- `renderHtml.ts` 可能继续变大：必要时只拆 renderer 组件渲染函数，不做全局重构。
- 组件 shape 过早固化：v0.3 只约束通用结构和关系引用，保留 `items` 的半结构化弹性。
- 示例可能变成组件展板：必须把新增组件嵌入采购系统真实流程。
- UI 可能重新出现 AI 味：实现时应按 B 端工作台风格做低噪声渲染，并通过截图检查。

## 验收标准

- 20 个新增组件都可被 validate 接受。
- `relations` 支持并有引用完整性校验。
- 20 个新增组件都有语义化 preview。
- 采购系统示例覆盖全部新增组件且仍能通过 validate。
- 前后端导出样例保留新增组件的关键需求事实。
- 中英文 README 与插件 README 对新增能力表达一致。
- `npm run check` 通过。
- 可见预览截图已更新并人工检查。
