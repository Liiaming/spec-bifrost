# Spec Bifrost

Spec Bifrost 是一个 Claude Code 和 OpenAI Codex 插件，用于基于本地 `spec-bifrost.json` 创建页面驱动的 B 端需求原型。

Spec Bifrost is a Claude Code and OpenAI Codex plugin for creating page-driven B-end requirement prototypes from a local `spec-bifrost.json` file.

## 能做什么 / What It Does

- 通过聊天指导 Claude Code 或 Codex 创建和修改 `spec-bifrost.json`。
- Guides Claude Code or Codex to create and modify `spec-bifrost.json` through chat.
- 校验 JSON 语法、schema 和引用完整性。
- Validates JSON syntax, schema, and references.
- 启动多页面 B 端原型的本地预览。
- Starts a local preview for multi-page B-end prototypes.
- 在预览中用临时字段值驱动条件显示、条件必填、条件禁用和条件动作跳转。
- Uses temporary preview field values for conditional display, required state, disabled state, and action navigation.
- 当前 JSON 无法渲染时，保留上一版有效预览。
- Keeps last known good preview output when the current JSON cannot render.
- 指导 Claude Code 或 Codex 导出前端和后端 Markdown 需求文档。
- Guides Claude Code or Codex to export frontend and backend Markdown requirement documents.

## 不做什么 / What It Does Not Do

- 不生成生产代码。
- It does not generate production code.
- 不创建接口定义。
- It does not create API definitions.
- 不创建数据库表。
- It does not create database tables.
- 不创建技术架构。
- It does not create technical architecture.
- 不创建任务拆分。
- It does not create task breakdowns.
- 不持久化预览输入数据。
- It does not persist preview input data.
- 不上传需求数据。
- It does not upload requirement data.

## 命令 / Commands

```txt
/spec-bifrost:spec
/spec-bifrost:validate
/spec-bifrost:preview
/spec-bifrost:refresh
/spec-bifrost:export
/spec-bifrost:stop
```

## 安装 / Install

```bash
claude plugin marketplace add Liiaming/spec-bifrost
claude plugin install spec-bifrost@spec-bifrost-marketplace
```

```bash
codex plugin marketplace add Liiaming/spec-bifrost
codex plugin add spec-bifrost@spec-bifrost-marketplace
```

发布版本必须包含 `dist`，安装后 CLI 才能直接运行。

Published versions must include `dist` so the CLI can run immediately after install.

## 5 分钟上手 / 5-Minute Quick Start

```txt
/spec-bifrost:spec
创建一个采购申请管理系统，包含申请单列表、创建申请、审批详情和基础审批流程。
```

```txt
/spec-bifrost:validate
/spec-bifrost:preview
/spec-bifrost:export
```

默认预览地址是 `http://127.0.0.1:3737`。如果端口没有释放，运行 `/spec-bifrost:stop`。

The default preview URL is `http://127.0.0.1:3737`. If the port is still occupied, run `/spec-bifrost:stop`.

导出文档默认写入：

Exported documents are expected at:

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

## 本地安装 / Local Install

```bash
codex plugin marketplace add /path/to/spec-bifrost
codex plugin add spec-bifrost@spec-bifrost-marketplace
```

## 本地 CLI / Local CLI

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR:-$PWD}"
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR:-$PWD}" --host 127.0.0.1 --port 3737
spec-bifrost refresh --cwd "${CLAUDE_PROJECT_DIR:-$PWD}"
```

## 示例 / Example

使用 `examples/procurement-system/spec-bifrost.json` 试跑完整流程。

Use `examples/procurement-system/spec-bifrost.json` to try the full flow.
