# Spec Bifrost MVP 设计

日期：2026-05-25

## 1. 背景

当前 AI 已经被产品和开发广泛使用，但产品输出到开发输入之间仍然割裂。产品经理常用原型和备注推进需求，开发则需要结构化、可检索、可复用的文字输入，让 AI 和工程流程理解需求。

原型图对人直观，但对 AI 不稳定；开发二次转述也会带来质量差异。Spec Bifrost MVP 通过 Claude Code plugin 形态验证一条更轻量的链路：产品经理通过聊天描述业务系统，Claude Code 编辑本地 JSON，插件根据 JSON 实时渲染原型，并在产品确认后导出面向前端和后端不同关注点裁剪的 Markdown 需求文档。

## 2. 目标与非目标

### 目标

第一版同时验证两个核心假设：

1. 产品经理是否愿意用“聊天 + 实时原型”的方式推进原型设计。
2. 半结构化 JSON 是否能稳定承载页面、字段、规则、交互和流程信息。

目标用户先锁定为产品经理。主路径是不要求产品经理手写 JSON，而是通过 Claude Code 聊天创建和修改原型 JSON 文件。JSON 作为本地项目资产存在，用户可以查看和编辑，但不鼓励手写。

### 非目标

第一版不做：

- AI 生成生产代码。
- 低代码平台能力。
- 多项目或多原型管理。
- 内置版本历史。
- 完整权限系统或复杂业务状态机。
- 高保真视觉设计。
- 真实表单提交校验。
- 后端接口模拟。
- 数据库设计、接口定义、技术架构或任务拆分导出。

一个文件夹默认就是一个原型项目，历史和回退依赖 Claude Code 会话能力。

## 3. 设计定位与边界

Spec Bifrost MVP 是一个面向产品经理的 Claude Code plugin，用于把“聊天描述需求”沉淀成单个本地 JSON 资产，再由该 JSON 驱动校验、实时多页面原型预览，以及前端/后端两份需求文档导出。

第一版的核心不是低代码、不是代码生成，也不是产品文档平台，而是验证一个稳定合约：`spec-bifrost.json` 是否能承载一个完整但相对简单的 B 端系统需求。产品经理主路径仍然是聊天，不要求手写 JSON；但 JSON 是唯一事实来源，所有预览和导出都从它读取。

公开 marketplace 准备态是交付约束：插件目录、manifest、skills、hooks、bin、README、安全说明和示例项目都应按可分发插件设计。但 MVP 不追求完整商业发布能力，不做多项目管理、内置版本历史、权限系统、接口模拟、数据库设计、技术架构或任务拆分导出。

一个工作目录默认就是一个原型项目。第一版只支持一个固定入口文件：`spec-bifrost.json`。该文件内部必须支持多页面 B 端系统，而不是单页或单流程。

## 4. JSON Schema 合约

`spec-bifrost.json` 采用页面驱动结构。第一版不要求产品经理理解业务对象建模，也不把业务对象作为主入口；系统需求先通过多页面、字段、组件、动作、条件、规则和备注表达。后端需要理解的业务概念、字段含义和规则，主要从页面字段与规则中沉淀，再由 Claude 在导出后端需求文档时裁剪组织。

顶层结构保持小而稳定：

```json
{
  "schemaVersion": "1.0",
  "project": {
    "name": "采购申请管理系统",
    "description": "用于创建、审批和跟踪采购申请的内部 B 端系统",
    "actors": ["申请人", "审批人", "采购专员"]
  },
  "optionSets": [],
  "pages": []
}
```

### 顶层字段

`schemaVersion` 表示 schema 版本。

`project` 描述系统名称、系统说明和主要使用角色。

`optionSets` 表示跨页面或跨字段复用的选项集。它不是业务对象，也不是规则库，只用于避免重复写统一口径的选项，例如采购类型、审批状态、供应商等级。只在单个字段使用的一次性选项可以直接写在字段上。

`pages` 是多页面系统的主结构。导航不单独维护顶层 `navigation`，而是从 `pages[].nav` 自动派生，避免维护两份引用结构。

项目 JSON 不包含 `exportGuidance`。前后端需求文档的导出规则由插件 skill 统一约束，不能混入每个项目的需求事实中。

### optionSets 示例

```json
{
  "optionSets": [
    {
      "id": "purchaseType",
      "label": "采购类型",
      "options": [
        { "value": "office", "label": "办公用品" },
        { "value": "software", "label": "软件服务" },
        { "value": "fixed_asset", "label": "固定资产" }
      ]
    },
    {
      "id": "approvalStatus",
      "label": "审批状态",
      "options": [
        { "value": "draft", "label": "草稿" },
        { "value": "pending", "label": "审批中" },
        { "value": "approved", "label": "已通过" },
        { "value": "rejected", "label": "已驳回" }
      ]
    }
  ]
}
```

字段引用选项集：

```json
{
  "id": "purchaseType",
  "label": "采购类型",
  "type": "select",
  "optionSetId": "purchaseType",
  "required": true,
  "meaning": "用于区分采购申请的业务类别"
}
```

一次性选项可以内联：

```json
{
  "id": "urgency",
  "label": "紧急程度",
  "type": "radio",
  "options": [
    { "value": "normal", "label": "普通" },
    { "value": "urgent", "label": "紧急" }
  ]
}
```

### 页面结构

页面至少包含：

- `id`：页面唯一标识。
- `title`：页面标题。
- `purpose`：页面用途。
- `route`：预览路由。
- `type`：页面类型。
- `nav`：可选导航声明。
- `sections`：页面区域。
- `notes`：页面级产品备注。

示例：

```json
{
  "id": "purchase-list",
  "title": "采购申请列表",
  "purpose": "查看、筛选采购申请，并进入详情或新建申请",
  "route": "/purchases",
  "type": "list",
  "nav": {
    "visible": true,
    "label": "采购申请",
    "group": "采购管理",
    "order": 10
  },
  "sections": []
}
```

### 组件能力

组件能力借鉴 shadcn/ui 和 Ant Design 的 B 端组件分类，但 JSON 不绑定具体 UI 库实现。schema 表达的是 B 端原型语义，不是 React 组件名。

第一版支持的组件类型：

- `pageHeader`
- `section`
- `form`
- `filterBar`
- `table`
- `descriptionList`
- `cardList`
- `steps`
- `tabs`
- `alert`
- `emptyState`
- `modal`
- `drawer`
- `actionBar`
- `textBlock`

第一版暂不支持：

- `chart`
- `tree`
- `calendar`
- `transfer`
- `tour`
- `carousel`
- `rate`
- `colorPicker`
- `qrCode`
- `watermark`

这些能力不是采购申请这类完整小 B 端系统的主路径需求，第一版加入会增加 schema 和 renderer 复杂度。

### 字段能力

字段类型参考 Ant Design Data Entry 和 shadcn/ui Field/Input/Select 思路，保留常见业务字段：

- `text`
- `textarea`
- `number`
- `currency`
- `date`
- `dateRange`
- `time`
- `select`
- `multiSelect`
- `radio`
- `checkbox`
- `switch`
- `user`
- `department`
- `file`
- `status`
- `tag`

其中 `status` 和 `tag` 主要用于表格、详情、审批流展示，不一定是用户输入控件。

第一版暂不支持：

- `richText`
- `cascader`
- `treeSelect`
- `mention`
- `slider`
- `rate`
- `color`
- `otp`
- `password`

`cascader` 和 `treeSelect` 在 B 端常见，但 MVP 暂时可以用 `select` / `multiSelect` 加备注表达，避免第一版处理层级选择逻辑。

字段可包含：

- `label`
- `meaning`
- `required`
- `defaultValue`
- `options`
- `optionSetId`
- `validationRules`
- `displayRules`
- `notes`

### 交互能力

第一版交互以“帮助理解需求”为目标，不模拟后端。

支持的动作类型：

- `navigate`
- `openModal`
- `closeModal`
- `openDrawer`
- `closeDrawer`
- `setFieldValue`
- `submitPrototype`
- `resetFields`
- `showMessage`

条件能力：

- `visibleWhen`
- `enabledWhen`
- `requiredWhen`
- `actionWhen`

条件操作符：

- `equals`
- `notEquals`
- `in`
- `notIn`
- `empty`
- `notEmpty`
- `greaterThan`
- `greaterThanOrEqual`
- `lessThan`
- `lessThanOrEqual`
- `contains`

条件组合：

- `all`
- `any`

条件示例：

```json
{
  "fieldId": "purchaseType",
  "operator": "equals",
  "value": "fixed_asset"
}
```

### 引用完整性

第一版必须校验以下引用：

- `pageId` 必须能引用到已有页面。
- `fieldId` 必须能引用到当前页面或当前表单范围内字段。
- `optionSetId` 必须能引用到 `optionSets`。
- `action.targetPageId` 必须存在。
- 条件中引用字段必须存在。
- 可导航页面的 `nav` 声明必须合法。

schema 是稳定合约，但不是完整建模语言。它负责让多页面原型和需求沉淀稳定运行；无法稳定结构化的内容先放进产品备注和规则文本里。

### notes 通用备注

`notes` 是承载无法稳定结构化内容的通用字段，不只属于页面。第一版应允许页面、section、组件、字段、动作和按钮都带 `notes`。

这类内容包括：

- 产品经理对页面或区域的解释。
- 组件旁的业务说明。
- 字段口径、特殊边界、历史原因。
- 按钮点击前后的业务注意事项。
- 暂时不适合结构化为条件、校验或动作的需求补充。

`notes` 只承载需求事实和产品语义，不承载实现建议。renderer 可以把 notes 作为可切换的旁注展示；导出 Markdown 时，Claude 应根据 notes 所在节点把它裁剪到对应章节。

示例：

```json
{
  "id": "submitPurchase",
  "type": "button",
  "label": "提交审批",
  "action": {
    "type": "submitPrototype"
  },
  "notes": [
    "提交后申请人不能再修改采购明细，只能撤回后重新编辑。",
    "如果采购金额超过 50000，需要在审批页突出展示预算说明。"
  ]
}
```

## 5. 校验 hook 与错误闭环

Validation hook 的目标是保证 `spec-bifrost.json` 作为唯一事实来源不破坏后续流程。它不理解复杂业务语义，不自动修复文件，只做结构性校验，并把明确错误事实反馈给 Claude Code，让 Claude 继续修改 JSON 直到通过。

校验触发范围只包含固定入口文件 `spec-bifrost.json`。其他 Markdown、README、示例说明或插件源码变更不走这个业务 JSON hook。

校验内容分三层：

1. JSON 语法校验。文件必须能被标准 JSON parser 解析。不允许注释、尾随逗号或非 JSON 格式。
2. Schema 校验。校验顶层结构、必要字段、组件类型、字段类型、动作类型、条件操作符、数组/对象类型、枚举值等。
3. 引用完整性校验。校验 `targetPageId`、`fieldId`、`optionSetId`、条件引用字段、弹窗/drawer 引用内容等是否存在。

错误反馈面向 Claude 定位问题，但不包含修复建议：

```txt
Spec Bifrost validation failed.

- path: pages[1].sections[0].components[2].fields[3].optionSetId
  type: reference_error
  message: optionSetId "purchaseStatus" does not exist.
  value: "purchaseStatus"

- path: pages[2].actions[0].targetPageId
  type: reference_error
  message: targetPageId "approval-detail" does not match any page id.
  value: "approval-detail"
```

hook 失败后不撤销文件，因为 Claude Code hook 无法安全回滚写入。因此 renderer 必须采用 last known good 策略：当前 JSON 导致预览不可用时继续展示上一版有效原型，并在预览里显示简短错误状态。

## 6. 预览 renderer 与交互行为

Preview renderer 是本地预览服务，负责把 `spec-bifrost.json` 渲染成中保真、多页面 B 端原型。它不替代 Claude Code 的编辑能力，也不保存业务数据；它只读取 JSON、渲染，并在 JSON 变化时刷新浏览器中的原型。

renderer 不重复承担 hook 的 schema 校验主职责，但它承担渲染期诊断与错误反馈职责。hook 校验通过只能说明 JSON 结构有效，不保证语义组合一定可渲染。比如某个组件结构合法但缺少 renderer 必需的数据、某个条件组合导致渲染异常、表格列引用格式不匹配，这些都可能在 renderer 阶段暴露。

文件变化后的流程：

1. renderer 读取 `spec-bifrost.json`。
2. JSON 无法解析或基础结构不可读时，保留 last known good，并记录错误事实。
3. 基础结构可读后，尝试渲染当前 JSON。
4. 如果渲染成功，更新 last known good 并刷新浏览器。
5. 如果渲染失败，保留 last known good，同时生成面向 Claude 的渲染错误事实。
6. Claude Code 背后的 AI 根据插件 skill、schema 约定和当前 JSON 自行修复。

renderer 不直接修改 `spec-bifrost.json`，也不输出修复建议。修复策略完全交给 Claude Code 背后的 AI。

renderer 错误格式：

```txt
Spec Bifrost render failed.

- pageId: purchase-detail
  componentId: approvalTimeline
  type: component_render_error
  jsonPath: pages[2].sections[1].components[0]
  message: timeline component cannot render without items or emptyState.
```

预览目标是 B 端多页面系统，而不是单页流程图。第一版预览应支持：

- 左侧或顶部导航，导航从 `pages[].nav` 自动派生。
- 页面标题、页面说明、页面备注。
- 列表页、表单页、详情页、审批/处理页、基础信息页。
- 页面内 section 分组。
- 表单、筛选区、表格、详情描述、卡片列表、步骤条、标签页、提示、空状态、弹窗、抽屉、操作区、文本说明。
- 字段旁展示产品备注、规则、必填、默认值、可选项。
- 页面、section、组件、字段、动作和按钮级备注可切换显示，避免默认干扰主界面。

第一版支持临时交互状态：

- 用户可以在预览里输入或选择字段值。
- 字段值只存在浏览器内存里，不写回 JSON，不持久化。
- 条件显示根据临时字段值生效。
- 条件必填、条件禁用可以在 UI 上体现。
- 按钮或链接可以根据字段值触发不同跳转。
- `submitPrototype` 只表现为“保存/提交/审批通过/驳回”等产品动作，可展示提示文案或跳转，不调用接口。

第一版不做：

- 真实表单提交校验。
- 后端接口模拟。
- 数据持久化。
- 登录、权限、复杂异步状态。
- 复杂表格能力，如真实分页、排序、筛选联动、批量操作落库。
- 高保真视觉设计。

交互的判断原则是：只实现能帮助产品经理和研发理解需求的行为。比如“采购金额大于 50000 时显示预算说明字段”应该支持；“保存后生成真实采购单编号”不支持，只能作为产品规则展示和导出。

预览服务启动以 AI 自动判断为主。AI 应在创建或大幅修改原型 JSON 后主动判断是否需要启动预览服务并打开浏览器，减少产品经理手动操作。插件仍提供手动预览和刷新能力。

预览服务的用户提示应克制：错误细节主要反馈给 Claude Code 修复，浏览器里只显示适合产品经理理解的简短状态。详细错误可在服务日志或 Claude Code hook/renderer 输出中查看。

## 7. Markdown 需求文档导出

Markdown 导出是把 `spec-bifrost.json` 中沉淀的需求事实，裁剪成两份面向不同研发角色的需求文档。导出结果是需求文档，不是技术设计、视觉设计或实现方案。

导出由 Claude Code 背后的 AI 基于 JSON 生成，而不是由程序模板确定性拼接。插件提供导出技能、章节结构和禁止内容；Claude 根据这些约束读取 JSON 并生成文件。

默认输出两个固定文件：

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

### 前端关注版需求文档

前端关注版应包含：

- 系统概述和页面清单。
- 各页面用途。
- 页面结构和主要区域。
- 页面字段、字段含义、默认值、可选项、必填和校验规则。
- 按钮、链接、弹窗、抽屉等用户可见操作。
- 页面跳转、条件显示、条件启用、条件必填、条件跳转。
- 空状态、提示文案、错误文案、状态展示。
- 页面、section、组件、字段、动作和按钮上的产品备注和规则说明。

前端版可以描述“用户在页面上看到什么、操作什么、什么情况下出现什么”，但不包含：

- 技术组件库选型。
- CSS、布局实现、动效实现。
- 前端代码结构。
- API 调用设计。
- 状态管理方案。
- 任务拆分。

建议章节：

```md
# 前端需求说明

## 1. 系统概述
## 2. 页面清单
## 3. 页面需求
## 4. 交互与跳转
## 5. 字段与展示规则
## 6. 状态、提示与空状态
## 7. 产品备注
```

### 后端关注版需求文档

后端关注版应包含：

- 系统概述和业务流程。
- 业务概念、字段含义和字段来源页面。
- 字段校验规则、取值范围、必填条件。
- 状态语义、条件分支、流转条件。
- 业务规则、边界条件、异常场景。
- 需要后端理解的提示文案或错误语义。

后端版不包含：

- 页面布局、组件结构、视觉样式。
- 实体模型。
- 领域对象设计。
- 接口定义。
- 数据库表设计。
- 服务拆分或技术架构。
- 代码结构。
- 任务拆分。
- “建议如何实现”的内容。

建议章节：

```md
# 后端需求说明

## 1. 系统概述
## 2. 业务流程
## 3. 业务概念与字段含义
## 4. 校验规则与约束
## 5. 状态与条件分支
## 6. 边界条件与异常场景
## 7. 产品备注
```

如果 JSON 中信息不足，导出文档应明确写“当前需求未说明”，而不是补充实现假设。比如接口字段、数据库设计、权限规则没有写入 JSON，就不应凭空生成。

导出前应先运行 JSON 校验。校验失败时不生成或覆盖 Markdown，避免把坏 JSON 转成看似可信的需求文档。

## 8. 插件结构、命令与公开分发准备态

Spec Bifrost 以 Claude Code plugin 形态交付。插件本体负责提供 skill、hook、CLI 可执行入口、预览服务和示例资产；公开分发则通过 marketplace catalog 暴露给用户安装。

Claude Code plugin 的关键约束：

- plugin manifest 位于 `.claude-plugin/plugin.json`。
- `skills/`、`commands/`、`hooks/`、`bin/` 等目录位于 plugin 根目录，不在 `.claude-plugin/` 目录内。
- 新插件优先使用 `skills/<name>/SKILL.md`。`commands/` 仍可用，但本质上是 flat Markdown skills。
- plugin hooks 的配置放在 `hooks/hooks.json`，或内联到 `plugin.json`。
- `bin/` 里的可执行文件会加入 Bash 工具的 `PATH`。
- marketplace 分发需要 marketplace 根目录下的 `.claude-plugin/marketplace.json`。
- marketplace 安装后 plugin 会被复制到 Claude Code 插件缓存中，不能依赖插件目录外的相对路径。
- hook 和脚本应使用 `${CLAUDE_PLUGIN_ROOT}`、`${CLAUDE_PLUGIN_DATA}`、`${CLAUDE_PROJECT_DIR}` 等变量引用路径。

推荐仓库结构：

```txt
spec-bifrost-marketplace/
  .claude-plugin/
    marketplace.json
  plugins/
    spec-bifrost/
      .claude-plugin/
        plugin.json
      skills/
        spec/
          SKILL.md
          schema.md
          export.md
          examples.md
        preview/
          SKILL.md
        validate/
          SKILL.md
        export/
          SKILL.md
        refresh/
          SKILL.md
      hooks/
        hooks.json
      scripts/
        validate-spec.mjs
        preview-server.mjs
        refresh-preview.mjs
      bin/
        spec-bifrost
      examples/
        procurement-system/
          spec-bifrost.json
          README.md
      README.md
      SECURITY.md
      LICENSE
      CHANGELOG.md
      package.json
      tsconfig.json
```

技能职责：

- `/spec-bifrost:spec`：指导 Claude 创建、修改和修复 `spec-bifrost.json`。这是主技能，说明 schema、编辑原则、错误处理和产品经理主路径。
- `/spec-bifrost:preview`：启动本地预览服务并打开浏览器。
- `/spec-bifrost:validate`：手动运行 JSON 语法、schema 和引用完整性校验。
- `/spec-bifrost:export`：读取 JSON，由 Claude 生成前端和后端两份固定 Markdown 需求文档。
- `/spec-bifrost:refresh`：预览服务已启动时手动触发重新读取 JSON。

hook 配置放在：

```txt
hooks/hooks.json
```

MVP 主校验 hook 使用 `PostToolUse`，匹配 `Write|Edit|MultiEdit`。hook 脚本读取 Claude Code 传入的 hook JSON，判断本次修改的文件是否为项目根目录下的 `spec-bifrost.json`。如果不是，直接通过；如果是，则调用 validator 输出错误事实。

不使用 `FileChanged` 作为主校验 hook，因为它不能承担要求 Claude 继续修复的主闭环。`FileChanged` 可作为后续增强，用于通知或刷新，但不是 MVP 主校验入口。

`bin/spec-bifrost` 是用户或 Claude 可直接在 Bash 中调用的 CLI 入口，内部再分发到脚本：

```txt
spec-bifrost validate
spec-bifrost preview
spec-bifrost refresh
spec-bifrost diagnostics
```

导出不做成确定性 CLI exporter。`spec-bifrost validate` 可以保证 JSON 可用，`/spec-bifrost:export` skill 负责让 Claude 读取 JSON 并写入固定 Markdown 文件。

路径约束：

- 插件脚本引用自身文件时使用 `${CLAUDE_PLUGIN_ROOT}`。
- 需要持久状态时使用 `${CLAUDE_PLUGIN_DATA}`。
- 读写用户项目的 `spec-bifrost.json`、`docs/spec-bifrost/*.md` 时使用 `${CLAUDE_PROJECT_DIR}` 或 hook 输入里的项目路径。

公开分发层面，`marketplace.json` 位于 marketplace 根目录的 `.claude-plugin/` 下，引用 `plugins/spec-bifrost` 作为 plugin source。plugin 自身的 `.claude-plugin/plugin.json` 只描述插件身份、版本、作者、license、keywords，以及必要的组件路径配置。

## 9. 示例系统

公开 marketplace 准备态必须包含一个可直接试跑的示例。示例不是单个流程，而是一个完整但相对简单的 B 端系统，用来验证 `spec-bifrost.json` 是否能稳定承载多页面、字段、规则、交互、状态和导出信息。

示例系统采用采购申请管理系统。

示例文件位置：

```txt
plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json
plugins/spec-bifrost/examples/procurement-system/README.md
```

示例系统目标用户：

- 申请人：创建和查看采购申请。
- 审批人：查看待审批申请并审批通过或驳回。
- 采购专员：查看已通过申请和供应商/品类信息。

示例页面至少包含：

1. 采购申请列表页：用于查看采购申请、筛选状态、进入详情、发起新申请。包含筛选区、表格、状态标签、主要操作按钮、空状态。
2. 新建/编辑采购申请页：用于填写采购类型、申请部门、预算归属、采购明细、期望到货日期、供应商偏好、附件和备注。包含表单、条件字段、字段校验、提交动作。
3. 采购申请详情页：用于查看申请基本信息、采购明细、审批进度、业务规则和操作入口。包含描述列表、表格、步骤条或时间线、提示信息、操作区。
4. 审批处理页：用于审批人查看待处理申请并选择通过或驳回。包含关键字段摘要、审批意见、条件提示、提交动作。
5. 供应商或品类基础信息页：用于展示可选择的供应商或采购品类口径。这是只读参考页，不做真实基础数据管理，避免扩成后台配置系统。

示例必须覆盖的 schema 能力：

- 多页面导航：至少 5 个页面，其中多个页面出现在导航中。
- `optionSets`：采购类型、审批状态、供应商等级等。
- 表单字段：`text`、`textarea`、`number`、`currency`、`date`、`select`、`radio`、`file`、`department`、`user`。
- 展示字段：`status`、`tag`。
- 表格：列表页和采购明细。
- 条件显示：例如采购类型为固定资产时显示资产用途字段。
- 条件必填：例如金额超过 50000 时预算说明必填。
- 条件跳转：例如提交后根据金额进入不同提示或处理路径。
- 备注和规则：页面、section、组件、字段、动作和按钮级都至少有一个示例。
- 错误和提示文案：至少覆盖必填、金额范围、附件要求、审批驳回说明。

示例不包含：

- 登录和权限系统。
- 真实接口。
- 数据库或实体设计。
- 真实表单提交。
- 复杂供应商管理。
- 报表、看板、图表。
- 多租户或组织架构维护。

示例 README 应说明：

- 这是一个用于验证插件能力的完整小系统样例。
- 如何复制示例 JSON 到项目根目录。
- 如何运行 `/spec-bifrost:validate`。
- 如何运行 `/spec-bifrost:preview`。
- 如何运行 `/spec-bifrost:export`。
- 示例覆盖了哪些 schema 能力。
- 示例不代表技术实现方案。

## 10. 安全、权限与数据边界

Spec Bifrost 处理的是产品需求资产，因此安全边界要写清楚，尤其是公开 marketplace 准备态下，用户需要知道插件会读写什么、启动什么、不会做什么。

插件允许做的事：

- 读取当前项目根目录下的 `spec-bifrost.json`。
- 在用户要求或 Claude 判断需要时，创建或修改当前项目根目录下的 `spec-bifrost.json`。
- 读取插件自带的 schema、skill、示例和渲染资源。
- 启动本地预览服务。
- 在本地浏览器打开预览地址。
- 将导出文档写入当前项目内的固定目录：

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

- 在插件持久数据目录中保存非需求内容的运行状态，例如预览服务端口、进程状态或缓存。这里应使用 Claude Code 插件机制提供的 `${CLAUDE_PLUGIN_DATA}`。

插件不应该做的事：

- 不上传 `spec-bifrost.json` 或导出文档到远程服务。
- 不读取 `.env`、密钥、凭证、`.git` 内部文件或用户主目录中的无关文件。
- 不扫描整个项目来推断业务需求，除非用户明确要求。
- 不修改生产代码。
- 不生成生产代码。
- 不安装或启动数据库、后端服务、低代码运行时。
- 不把预览中的临时输入写回 JSON。
- 不自动提交 git。
- 不创建接口定义、数据库设计、技术架构或任务拆分文档。

hook 安全边界：

- hook 只在 `PostToolUse` 中监听 `Write|Edit|MultiEdit`。
- hook 只关心目标文件是否为当前项目根目录下的 `spec-bifrost.json`。
- hook 校验失败时输出错误事实，不输出修复建议，不改文件。
- hook 不执行网络请求。
- hook 不读取项目中除 `spec-bifrost.json` 之外的业务文件。

renderer 安全边界：

- renderer 只监听 `spec-bifrost.json`。
- renderer 只服务本地预览地址，默认绑定 localhost。
- renderer 不上传需求数据。
- renderer 不持久化用户在预览中输入的业务数据。
- renderer 遇到渲染错误时只输出错误事实，不写回 JSON。
- renderer 使用 last known good 防止坏 JSON 破坏当前可见原型。

依赖与安装边界：

公开 marketplace 准备态下，需要明确插件依赖 Node.js 运行时。若插件需要 npm 依赖，不能依赖安装目录外的相对路径；marketplace 安装后插件会被复制到 Claude Code 插件缓存中。持久依赖或缓存应放在 `${CLAUDE_PLUGIN_DATA}`，插件自带脚本和资源应通过 `${CLAUDE_PLUGIN_ROOT}` 引用。

README 和 SECURITY 必须明确：

- 插件读取和写入哪些文件。
- 本地预览服务的默认端口与绑定地址。
- 插件不会上传需求数据。
- hook 和预览服务都不会自动修改 `spec-bifrost.json`。
- Claude Code 背后的 AI 才是 JSON 修改者，修改仍遵循用户授权和本地文件编辑流程。

## 11. 成功标准与验收

MVP 成功标准围绕两个核心假设：产品经理是否愿意用“聊天 + 实时原型”推进原型设计；`spec-bifrost.json` 是否能稳定承载一个完整但相对简单的 B 端系统需求。

### 功能验收

- 插件能以公开 marketplace 准备态结构被 Claude Code 识别和加载。
- 插件提供可调用技能：
  - `/spec-bifrost:spec`
  - `/spec-bifrost:preview`
  - `/spec-bifrost:validate`
  - `/spec-bifrost:export`
  - `/spec-bifrost:refresh`
- 用户可以通过聊天让 Claude 创建或修改项目根目录下的 `spec-bifrost.json`。
- `spec-bifrost.json` 使用固定单文件入口，内部支持多页面 B 端系统。
- 示例采购申请管理系统可校验通过。
- 示例采购申请管理系统可启动预览并展示多页面原型。
- 预览支持临时输入、条件显示、条件必填、条件禁用和条件跳转。
- 预览在 JSON 错误时保留 last known good。
- hook 能在 `spec-bifrost.json` 被 Claude 修改后发现语法、schema、引用完整性错误。
- hook 错误只包含错误事实，不包含修复建议。
- renderer 能发现 hook 通过后仍可能出现的渲染期错误。
- renderer 错误只包含错误事实，不包含修复建议。
- Claude 能基于 hook 或 renderer 的错误事实修复 JSON。
- `/spec-bifrost:export` 能生成两份固定 Markdown 需求文档：
  - `docs/spec-bifrost/frontend-requirements.md`
  - `docs/spec-bifrost/backend-requirements.md`

### 文档验收

- 前端需求文档包含页面、字段、展示规则、用户操作、跳转、条件交互、提示文案和产品备注。
- 后端需求文档包含业务流程、业务概念与字段含义、校验规则、状态语义、条件分支、边界条件和产品备注。
- 导出文档不包含接口定义、数据库表设计、技术架构、代码结构、任务拆分或实现建议。
- 后端文档不把需求概念包装成实体模型或领域对象设计。
- README 说明安装、启用、校验、预览、刷新、导出和示例试跑。
- SECURITY 说明数据边界、本地服务、文件读写、无上传承诺和 hook/renderer 不改 JSON 的原则。

### 非目标验收

- 不生成生产代码。
- 不做低代码平台。
- 不做多项目或多原型管理。
- 不做内置版本历史。
- 不做权限系统。
- 不做接口模拟。
- 不做数据库设计。
- 不做技术架构导出。
- 不做高保真视觉设计。
- 不持久化预览输入数据。

### 可用性验收

- 产品经理不需要手写 JSON 即可通过聊天完成示例级系统原型。
- JSON 可读、可见、可版本管理，但不是主操作界面。
- 当用户完成需求确认后，前端和后端都能从导出文档中找到各自需要评审的需求信息。
- 示例系统能展示插件主路径：聊天创建或修改 JSON、校验、预览、修复、导出。

## 12. 参考资料

- [Claude Code plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference)
- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [shadcn/ui components](https://ui.shadcn.com/docs/components)
- [Ant Design components overview](https://ant.design/components/overview/)
