# Repository Guidelines

## Project Structure & Module Organization
- 本仓库是 Spec Bifrost Claude Code 插件的私有 npm 工作区。
- 根目录 `package.json` 提供统一的构建、测试和本地 CLI 脚本。
- 插件主体在 `plugins/spec-bifrost`。
- 插件清单在 `plugins/spec-bifrost/.claude-plugin/plugin.json`。
- 本地 marketplace 清单在 `.claude-plugin/marketplace.json`。
- Claude 命令技能在 `plugins/spec-bifrost/skills`。
- hook 配置在 `plugins/spec-bifrost/hooks/hooks.json`。
- 可执行入口在 `plugins/spec-bifrost/bin`。
- TypeScript 源码在 `plugins/spec-bifrost/src`。
- 核心读取、诊断和校验逻辑在 `plugins/spec-bifrost/src/core`。
- hook 集成在 `plugins/spec-bifrost/src/hooks`。
- 预览渲染器在 `plugins/spec-bifrost/src/renderer`。
- CLI 路由在 `plugins/spec-bifrost/src/cli`。
- 测试在 `plugins/spec-bifrost/tests`，按 `core`、`hooks`、`renderer`、`cli` 等领域分组。
- 示例原型项目在 `plugins/spec-bifrost/examples`。
- 产品规格和执行计划在 `docs/superpowers/specs` 与 `docs/superpowers/plans`。
- 构建产物在 `plugins/spec-bifrost/dist`，不要手写修改。

## Architecture Overview
- Spec Bifrost 将本地 `spec-bifrost.json` 渲染为多页面 B 端需求原型。
- Claude Code 负责编辑 JSON；插件提供 skills、commands、hooks、校验、预览和导出约束。
- 校验逻辑由 TypeScript core 实现，并被 CLI 与 Claude hook 复用。
- hook 只报告结构性诊断，不修改文件，也不提供修复建议。
- renderer 渲染有效 spec；渲染失败时保留 last known good 预览。
- renderer 错误应指出页面、组件或 JSON 路径，由 Claude Code 按插件约定修复。
- Markdown 导出由 Claude 基于 JSON 生成，不使用确定性模板程序。
- 前端版和后端版导出仍是需求文档，不包含实现方案。

## Build, Test, and Development Commands
- `npm install`：安装项目依赖。
- `npm run build`：编译 TypeScript 到 `plugins/spec-bifrost/dist`。
- `npm test`：用 Node test runner 和 `tsx` 运行全部测试。
- `npm run check`：执行构建和测试，是提交前的默认验证命令。
- `npm run spec-bifrost -- validate --cwd plugins/spec-bifrost/examples/procurement-system`：校验示例原型 JSON。
- `npm run spec-bifrost -- preview --cwd plugins/spec-bifrost/examples/procurement-system --host 127.0.0.1 --port 3737`：启动本地预览服务。
- `claude plugin validate plugins/spec-bifrost`：验证插件目录，适用于 Claude Code CLI 可用时。
- `claude plugin validate .`：验证本地 marketplace，适用于 packaging 或 marketplace 改动。
- 本地项目测试插件且不改全局配置：

```bash
cd ~/Projects/Private/spec-bifrost-test
claude plugin marketplace add --scope local ~/Projects/Private/spec-bifrost
claude plugin install --scope local spec-bifrost@spec-bifrost-marketplace
```

- 源码改动后，先在本仓库 `npm run build`，再在测试项目执行：

```bash
claude plugin update spec-bifrost@spec-bifrost-marketplace --scope local
```

## Coding Style & Naming Conventions
- 使用 TypeScript、ES modules 和 NodeNext module resolution。
- 保持 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes` 兼容。
- TypeScript、JSON、Markdown 示例统一使用 2 空格缩进。
- 沿用现有格式：双引号、分号、显式 import。
- 变量和函数使用 `camelCase`。
- 导出的类型和接口使用 `PascalCase`。
- 真正常量使用 `UPPER_SNAKE_CASE`。
- 文件名应贴合主职责，例如 `readSpec.ts`、`renderHtml.ts`。
- 测试文件使用 `*.test.ts`。
- 不要手写修改 `plugins/spec-bifrost/dist`。
- 不要为单次使用增加抽象或新依赖。
- 注释只解释不明显的决策，不复述代码。
- 用户可见的插件文档如果已有中英双语风格，应继续保持双语。

## Testing Guidelines
- 测试框架是 Node 内置 test runner，运行入口是 `npm test`。
- 新测试放在 `plugins/spec-bifrost/tests/<area>/*.test.ts`。
- 校验逻辑变更要覆盖 JSON shape、schema 错误和引用完整性。
- hook 变更要覆盖 Claude hook payload、退出码和诊断输出。
- renderer 变更要覆盖关键 HTML 结构、备注显示和 last known good 行为。
- CLI 变更要覆盖成功与失败输出，不依赖全局机器状态。
- 目前没有硬性覆盖率阈值；每个行为变更都应有回归测试。
- 完成前至少运行 `npm run check`。
- 插件元数据、命令或 marketplace 改动后，尽量运行 Claude CLI 的 plugin validate。
- 可见 UI 改动需要截图或人工预览确认。

## Commit & Pull Request Guidelines
- 提交信息遵循 Conventional Commits。
- 本仓库优先使用简洁中文描述。
- 示例：

```txt
feat(renderer): 优化 B 端预览渲染体验
fix(hooks): 修正 JSON 编辑后的诊断输出
docs: 完善插件本地测试说明
test(core): 覆盖条件跳转引用校验
```

- 一次提交只表达一个逻辑主题。
- 不提交无关本地改动。
- PR 应说明问题、方案、验证命令和剩余风险。
- 有关联 issue、spec 或讨论记录时应链接。
- renderer 可见变化需要附截图或短录屏。
- 影响安装、hook、预览、导出约束的改动要在 PR 中明确说明。

## Security & Configuration Tips
- 预览服务默认绑定 `127.0.0.1`，除非任务明确要求不要改成公网地址。
- 不上传用户原型数据；MVP 假设 `spec-bifrost.json` 是本地资产。
- 真实客户或公司原型 JSON 视为敏感数据。
- 不提交 secrets、tokens、私有 Claude 配置或无意的本机路径。
- 测试项目如 `~/Projects/Private/spec-bifrost-test` 应留在仓库外。
- 手动测试优先使用 `--scope local`，避免污染全局 Claude Code 配置。
- 安全相关行为变化时，同步更新 `plugins/spec-bifrost/SECURITY.md`。

## Agent-Specific Instructions
- 保留本文件顶部已有指令。
- 编辑前说明假设，并定义可验证的成功标准。
- 变更要精准，确保每一行都能追溯到用户请求。
- 优先选择满足目标的最简单实现。
- 搜索文件或文本时优先使用 `rg` 或 `rg --files`。
- 手动编辑文件使用 `apply_patch`。
- 不要回退用户已有改动，除非用户明确要求。
- JSON schema、命令、hook 或 renderer 行为变化时，同步更新对应 skill 或文档。
- 牢记产品边界：插件产出需求原型和需求文档，不产出生产代码、接口定义、数据库设计、技术架构或任务拆分。

## Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## Simplicity First
Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
