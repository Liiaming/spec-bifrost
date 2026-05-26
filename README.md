# Spec Bifrost

[English](README.en.md)

Spec Bifrost 是一个 Claude Code 插件，用于把产品经理的自然语言需求沉淀为本地 `spec-bifrost.json`，基于该 JSON 实时预览多页面 B 端需求原型，并导出面向前端和后端的两份 Markdown 需求文档。

> 状态：MVP。当前重点是验证“聊天 + 本地 JSON + 实时原型 + 角色裁剪需求文档”的工作流。

## 为什么

产品原型对人直观，但对 AI 和工程流程并不稳定。开发通常还需要把原型、备注和口头说明二次转述成结构化文字，质量容易漂移。

Spec Bifrost 试图验证一条更轻量的链路：

1. 产品经理通过 Claude Code 聊天描述完整但相对简单的 B 端系统。
2. Claude Code 创建和修改本地 `spec-bifrost.json`。
3. 插件校验 JSON，并提供本地预览服务。
4. 产品确认后，Claude 基于 JSON 导出前端关注版和后端关注版需求文档。

## 能做什么

- 通过 Claude Code skills 引导创建和修改 `spec-bifrost.json`。
- 校验 JSON 语法、schema 和引用完整性。
- 提供中保真、多页面 B 端原型预览。
- 支持页面、section、组件、字段、动作和按钮上的 notes。
- 支持表单、筛选、表格、详情、步骤、卡片、空状态等常见 B 端表达。
- 支持字段规则、条件显示、条件必填和页面跳转。
- renderer 使用 last known good 策略，当前 JSON 渲染失败时保留上一版有效预览。
- 指导 Claude 导出前端版和后端版 Markdown 需求文档。

## 不做什么

- 不生成生产代码。
- 不提供低代码平台能力。
- 不模拟后端接口。
- 不持久化预览中的用户输入。
- 不导出接口定义、数据库设计、技术架构、代码结构或任务拆分。
- 不把后端文档写成实体模型或实现方案。
- 不上传 `spec-bifrost.json` 或导出文档。

## 仓库结构

```txt
.
├── .claude-plugin/marketplace.json
├── docs/superpowers/
├── plugins/spec-bifrost/
│   ├── .claude-plugin/plugin.json
│   ├── bin/spec-bifrost
│   ├── examples/procurement-system/
│   ├── hooks/hooks.json
│   ├── skills/
│   ├── src/
│   │   ├── cli/
│   │   ├── core/
│   │   ├── hooks/
│   │   └── renderer/
│   └── tests/
├── package.json
└── tsconfig.json
```

- `plugins/spec-bifrost/src/core`：JSON 读取、诊断、schema 和引用校验。
- `plugins/spec-bifrost/src/hooks`：Claude Code hook 集成。
- `plugins/spec-bifrost/src/renderer`：本地预览服务和 HTML 渲染器。
- `plugins/spec-bifrost/src/cli`：本地 CLI 命令入口。
- `plugins/spec-bifrost/skills`：Claude Code 命令和工作流说明。
- `plugins/spec-bifrost/tests`：按模块组织的测试。

## 环境要求

- 推荐 Node.js 20 或更高版本。
- 需要 npm。
- 需要支持 plugin 的 Claude Code CLI。

## 本地测试安装

克隆仓库并构建插件：

```bash
git clone <repo-url>
cd spec-bifrost
npm install
npm run build
```

在测试项目中使用 local scope 安装插件，避免修改全局 Claude Code 配置：

```bash
mkdir -p ~/Projects/Private/spec-bifrost-test
cd ~/Projects/Private/spec-bifrost-test
claude plugin marketplace add --scope local /path/to/spec-bifrost
claude plugin install --scope local spec-bifrost@spec-bifrost-marketplace
claude
```

修改插件源码后，先重新构建，再更新测试项目中的本地安装：

```bash
cd /path/to/spec-bifrost
npm run build
cd ~/Projects/Private/spec-bifrost-test
claude plugin update spec-bifrost@spec-bifrost-marketplace --scope local
```

## Claude 命令

```txt
/spec-bifrost:spec
/spec-bifrost:validate
/spec-bifrost:preview
/spec-bifrost:refresh
/spec-bifrost:export
```

- `/spec-bifrost:spec`：引导 Claude 创建或修改本地原型 JSON。
- `/spec-bifrost:validate`：校验语法、schema 和引用。
- `/spec-bifrost:preview`：启动本地预览服务。
- `/spec-bifrost:refresh`：让运行中的预览重新读取当前 JSON。
- `/spec-bifrost:export`：引导 Claude 写入前端版和后端版需求文档。

导出文档默认写入：

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

## 本地 CLI

构建后可以通过本地 CLI 校验和预览示例项目：

```bash
npm run spec-bifrost -- validate --cwd plugins/spec-bifrost/examples/procurement-system
npm run spec-bifrost -- preview --cwd plugins/spec-bifrost/examples/procurement-system --host 127.0.0.1 --port 3737
```

## 示例

采购申请管理系统示例展示了一个小型多页面 B 端系统：

```txt
plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json
```

它覆盖 optionSets、表单、筛选、表格、详情、步骤、卡片、条件显示、条件必填、导航动作和 notes。

## 开发

```bash
npm run build
npm test
npm run check
```

- `npm run build`：编译 TypeScript 到 `plugins/spec-bifrost/dist`。
- `npm test`：运行 `plugins/spec-bifrost/tests` 下的全部测试。
- `npm run check`：同时执行构建和测试。

Claude Code CLI 可用时，也建议验证插件包：

```bash
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

## 设计原则

- JSON 是本地项目资产，可见可改，但主路径是聊天驱动。
- schema 应保持半结构化：足够稳定以支持校验和预览，也足够灵活以承载产品备注。
- notes 是一等信息，因为 MVP 阶段无法把所有需求细节都安全结构化。
- hook 和 renderer 只报告错误事实；Claude Code 负责按插件约定修复 JSON。
- 导出的文档必须保持需求文档属性，不进入实现方案。

## 安全

Spec Bifrost 围绕本地文件工作：

- 预览服务默认绑定 `127.0.0.1`。
- 预览中的输入值只保存在浏览器内存中，不写回 JSON。
- 插件不会上传 `spec-bifrost.json` 或导出的 Markdown 文件。
- 真实产品原型可能包含敏感业务信息；发布前请检查示例和测试数据。

更多信息见 `plugins/spec-bifrost/SECURITY.md`。

## 贡献

贡献应保持 MVP 聚焦、实用和可验证：

- 优先提交小而聚焦的 PR。
- 行为变化需要新增或更新测试。
- 提交前运行 `npm run check`。
- renderer 可见变化需要附截图。
- 提交信息遵循 Conventional Commits。

提交示例：

```txt
feat(renderer): 优化 B 端预览渲染体验
fix(core): 修正引用完整性校验
docs: 完善本地安装说明
```

## 许可证

MIT
