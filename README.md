# Spec Bifrost

[English](README.en.md)

面向产品经理、独立开发者和小团队的 AI 需求协作插件：把聊天里的产品想法沉淀为本地 `spec-bifrost.json`，实时预览多页面 B 端需求原型，并导出面向前端和后端的两份 Markdown 需求文档。

Spec Bifrost 不是又一个“让 AI 直接写一篇需求文档”的提示词集合。它把需求先落到一个可校验、可预览、可迭代的 JSON 中间层，再让 AI 基于这个结构化上下文继续修改、预览和导出。

> 状态：MVP。当前目标是把“聊天 + 本地 JSON + 实时原型 + 角色裁剪需求文档”做成可信、可演示、可参与的开源工作流。

![Spec Bifrost preview](docs/assets/spec-bifrost-preview.png)

## 适合谁

- 面向产品经理：用自然语言快速形成可预览的 B 端原型和需求说明。
- 面向独立开发者：把零散想法整理成工程师能读的前后端需求文档。
- 面向小团队：在 Claude Code 或 Codex 中围绕同一份本地 JSON 做 AI 需求协作。
- 面向开源贡献者：参与一个聚焦“AI 如何稳定表达产品需求”的早期开源项目。

## 为什么不是直接让 AI 写需求文档

直接让 AI 写文档很快，但每次对话都可能漂移：页面、字段、备注、交互规则和导出侧重点容易不一致。

Spec Bifrost 的核心选择是加一个本地 `spec-bifrost.json` 中间层：

- JSON 可校验：语法、schema 和引用错误会被明确指出。
- JSON 可预览：用户可以先看原型，再决定需求是否正确。
- JSON 可导出：同一份结构化需求可以裁剪成前端版和后端版文档。
- JSON 可追踪：它是本地项目资产，可以进 Git，可以审阅，可以逐步演进。

## Token 成本优势

在 token 成本敏感或预算收紧时，Spec Bifrost 的工作流通常更省 token：产品不需要先让 AI 生成一整套高保真原型，再让开发把原型转换为代码或需求说明。团队围绕一份紧凑的 `spec-bifrost.json` 迭代，预览和导出都复用这份结构化上下文。

这意味着 AI 不必反复读取大段截图描述、页面 HTML、设计稿说明或一次性长文档；它只需要修改可校验的 JSON，再由插件预览和导出。对于频繁修改页面、字段、流程和备注的早期产品阶段，这条路径更适合控制 token 成本。

## 为什么

产品原型对人直观，但对 AI 和工程流程并不稳定。开发通常还需要把原型、备注和口头说明二次转述成结构化文字，质量容易漂移。

Spec Bifrost 试图验证一条更轻量的链路：

1. 产品经理通过 Claude Code 或 Codex 聊天描述完整但相对简单的 B 端系统。
2. Claude Code 或 Codex 创建和修改本地 `spec-bifrost.json`。
3. 插件校验 JSON，并提供本地预览服务。
4. 产品确认后，Claude Code 或 Codex 基于 JSON 导出前端关注版和后端关注版需求文档。

```mermaid
flowchart LR
  A["产品想法 / Chat"] --> B["spec-bifrost.json"]
  B --> C["validate"]
  C --> D["preview"]
  D --> E["产品确认"]
  E --> F["export"]
  F --> G["frontend-requirements.md"]
  F --> H["backend-requirements.md"]
```

## 能做什么

- 通过 Claude Code 或 Codex skills 引导创建和修改 `spec-bifrost.json`。
- 校验 JSON 语法、schema 和引用完整性。
- 提供中保真、多页面 B 端原型预览。
- 支持页面、section、组件、字段、动作和按钮上的 notes。
- 支持表单、筛选、表格、详情、步骤、卡片、空状态等常见 B 端表达。
- 支持字段规则、条件显示、条件必填和页面跳转。
- renderer 使用 last known good 策略，当前 JSON 渲染失败时保留上一版有效预览。
- 指导 Claude Code 或 Codex 导出前端版和后端版 Markdown 需求文档。

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
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── docs/superpowers/
├── plugins/spec-bifrost/
│   ├── .claude-plugin/plugin.json
│   ├── .codex-plugin/plugin.json
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
- `plugins/spec-bifrost/src/hooks`：Claude Code 和 Codex hook 集成。
- `plugins/spec-bifrost/src/renderer`：本地预览服务和 HTML 渲染器。
- `plugins/spec-bifrost/src/cli`：本地 CLI 命令入口。
- `plugins/spec-bifrost/skills`：Claude Code 和 Codex 可加载的技能说明。
- `plugins/spec-bifrost/tests`：按模块组织的测试。

## 环境要求

- 推荐 Node.js 24 LTS。
- 需要 npm。
- 需要支持 plugin 的 Claude Code CLI 或 OpenAI Codex CLI/Desktop。

## 安装

从公开 GitHub marketplace 安装，不需要先 clone 仓库：

```bash
claude plugin marketplace add Liiaming/spec-bifrost
claude plugin install spec-bifrost@spec-bifrost-marketplace
```

Codex CLI 也可以直接注册同一个 GitHub marketplace：

```bash
codex plugin marketplace add Liiaming/spec-bifrost
codex plugin add spec-bifrost@spec-bifrost-marketplace
```

在 Codex Desktop 中，注册同一个 marketplace 后，插件会使用 `.codex-plugin/plugin.json` 的 `interface` 元数据在插件界面中展示。

发布版本需要包含 `plugins/spec-bifrost/dist`，这样 marketplace 安装后的 `spec-bifrost` CLI 可以直接运行。发布前请先运行 `npm run build`，并把生成的 `plugins/spec-bifrost/dist` 一起提交。

## 5 分钟上手

在一个需要沉淀产品原型的新项目目录中启动 Claude Code 或 Codex，然后直接让插件创建第一版 JSON：

```txt
/spec-bifrost:spec
创建一个采购申请管理系统，包含申请单列表、创建申请、审批详情和基础审批流程。
```

生成或修改完成后，校验当前项目中的 `spec-bifrost.json`：

```txt
/spec-bifrost:validate
```

启动本地预览：

```txt
/spec-bifrost:preview
```

默认预览地址是 `http://127.0.0.1:3737`。如果端口没有释放，可以运行：

```txt
/spec-bifrost:stop
```

产品确认后导出两份需求文档：

```txt
/spec-bifrost:export
```

导出结果默认写入：

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

- 前端版需求文档关注页面清单、页面流程、页面级说明、字段级说明和操作反馈。
- 后端版需求文档关注业务对象与字段口径、业务规则、流程结果、例外与备注。
- 两份文档都应保持需求文档属性，不包含接口定义、数据库设计、技术架构、代码结构或任务拆分。

## 本地开发测试安装

克隆仓库并构建插件：

```bash
git clone <repo-url>
cd spec-bifrost
npm install
npm run build
```

在 Claude Code 测试项目中使用 local scope 安装插件，避免修改全局 Claude Code 配置：

```bash
mkdir -p ~/Projects/Private/spec-bifrost-test
cd ~/Projects/Private/spec-bifrost-test
claude plugin marketplace add --scope local /path/to/spec-bifrost
claude plugin install --scope local spec-bifrost@spec-bifrost-marketplace
claude
```

在 Codex CLI 中注册当前仓库作为本地 marketplace，并安装插件：

```bash
codex plugin marketplace add /path/to/spec-bifrost
codex plugin add spec-bifrost@spec-bifrost-marketplace
codex
```

修改插件源码后，先重新构建，再更新测试项目中的本地安装：

```bash
cd /path/to/spec-bifrost
npm run build
cd ~/Projects/Private/spec-bifrost-test
claude plugin update spec-bifrost@spec-bifrost-marketplace --scope local
```

Codex 本地 marketplace 安装后，如需刷新源码改动，重新运行 marketplace add 或 remove/add，以当前 Codex CLI 版本的插件命令为准。

## Claude Code / Codex Skills

```txt
/spec-bifrost:spec
/spec-bifrost:validate
/spec-bifrost:preview
/spec-bifrost:refresh
/spec-bifrost:export
/spec-bifrost:stop
```

- `/spec-bifrost:spec`：引导 Claude Code 或 Codex 创建或修改本地原型 JSON。
- `/spec-bifrost:validate`：校验语法、schema 和引用。
- `/spec-bifrost:preview`：启动本地预览服务。
- `/spec-bifrost:refresh`：让运行中的预览重新读取当前 JSON。
- `/spec-bifrost:export`：引导 Claude Code 或 Codex 写入前端版和后端版需求文档。
- `/spec-bifrost:stop`：排查并手动释放被预览进程占用的 `3737` 端口。

导出文档默认写入：

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

前端版应描述用户看到什么、如何操作、字段如何展示和反馈如何出现；后端版应描述业务对象、字段口径、业务规则和流程结果。两者都不是实现方案。

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

示例目录也包含一组导出样例，可作为输出质量参考：

```txt
plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/frontend-requirements.md
plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/backend-requirements.md
```

## 开发

```bash
npm run build
npm test
npm run check
```

- `npm run build`：编译 TypeScript 到 `plugins/spec-bifrost/dist`。
- `npm test`：运行 `plugins/spec-bifrost/tests` 下的全部测试。
- `npm run check`：同时执行构建和测试。

Claude Code CLI 可用时，也建议验证 Claude 插件包：

```bash
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

Codex CLI 可用时，也建议确认本地 marketplace 能被识别：

```bash
codex plugin marketplace add /path/to/spec-bifrost
codex plugin list --marketplace spec-bifrost-marketplace
```

## 设计原则

- JSON 是本地项目资产，可见可改，但主路径是聊天驱动。
- schema 应保持半结构化：足够稳定以支持校验和预览，也足够灵活以承载产品备注。
- notes 是一等信息，因为 MVP 阶段无法把所有需求细节都安全结构化。
- hook 和 renderer 只报告错误事实；Claude Code 或 Codex 负责按插件约定修复 JSON。
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
