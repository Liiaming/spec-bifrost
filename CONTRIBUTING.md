# 贡献指南 / Contributing

感谢你关注 Spec Bifrost。

Thank you for your interest in Spec Bifrost.

## 项目边界 / Project Scope

Spec Bifrost 是一个 Claude Code 插件，用于把本地 `spec-bifrost.json` 渲染为 B 端需求原型，并导出需求文档。

Spec Bifrost is a Claude Code plugin for rendering local `spec-bifrost.json` files into B-end requirement prototypes and exporting requirement documents.

本项目不生成生产代码、接口定义、数据库设计、技术架构或任务拆分。

This project does not generate production code, API definitions, database designs, technical architecture, or task breakdowns.

## 开发流程 / Development

```bash
npm install
npm run check
```

源码改动后请至少运行：

After source changes, run at least:

```bash
npm run check
```

如果改动插件元数据、命令或 marketplace 配置，也建议运行：

If plugin metadata, commands, or marketplace configuration changed, also consider:

```bash
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

## PR 要求 / Pull Requests

- 保持 PR 小而聚焦。
- 行为变化需要新增或更新测试。
- renderer 可见变化需要附截图或说明人工预览结果。
- 提交信息遵循 Conventional Commits。
- 不提交 secrets、私有 Claude 配置或真实客户原型数据。

- Keep pull requests small and focused.
- Add or update tests for behavior changes.
- Include screenshots or manual preview notes for visible renderer changes.
- Use Conventional Commits.
- Do not commit secrets, private Claude configuration, or real customer prototype data.

提交示例：

Commit examples:

```txt
feat(renderer): 优化 B 端预览渲染体验
fix(core): 修正引用完整性校验
docs: 完善本地安装说明
```

## Issue 建议 / Issues

提交 bug 时，请尽量包含：

When reporting a bug, please include:

- 复现步骤。
- 期望结果与实际结果。
- 相关 `spec-bifrost.json` 片段。请先删除敏感业务信息。
- 运行过的命令和输出。

- Steps to reproduce.
- Expected and actual behavior.
- Relevant `spec-bifrost.json` snippets with sensitive business data removed.
- Commands run and their output.
