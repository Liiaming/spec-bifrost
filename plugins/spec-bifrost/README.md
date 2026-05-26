# Spec Bifrost

Spec Bifrost 是一个 Claude Code 插件，用于基于本地 `spec-bifrost.json` 创建页面驱动的 B 端需求原型。

Spec Bifrost is a Claude Code plugin for creating page-driven B-end requirement prototypes from a local `spec-bifrost.json` file.

## 能做什么 / What It Does

- 通过聊天指导 Claude 创建和修改 `spec-bifrost.json`。
- Guides Claude to create and modify `spec-bifrost.json` through chat.
- 校验 JSON 语法、schema 和引用完整性。
- Validates JSON syntax, schema, and references.
- 启动多页面 B 端原型的本地预览。
- Starts a local preview for multi-page B-end prototypes.
- 在预览中用临时字段值驱动条件显示、条件必填、条件禁用和条件动作跳转。
- Uses temporary preview field values for conditional display, required state, disabled state, and action navigation.
- 当前 JSON 无法渲染时，保留上一版有效预览。
- Keeps last known good preview output when the current JSON cannot render.
- 指导 Claude 导出前端和后端 Markdown 需求文档。
- Guides Claude to export frontend and backend Markdown requirement documents.

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
```

## 本地 CLI / Local CLI

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR}" --host 127.0.0.1 --port 3737
spec-bifrost refresh --cwd "${CLAUDE_PROJECT_DIR}"
```

## 示例 / Example

使用 `examples/procurement-system/spec-bifrost.json` 试跑完整流程。

Use `examples/procurement-system/spec-bifrost.json` to try the full flow.
