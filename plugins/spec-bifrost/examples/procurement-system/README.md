# 采购申请管理系统示例

这是 Spec Bifrost MVP 的完整小系统示例，用于验证多页面、字段、规则、交互、备注、校验、预览和导出。

## 试跑

复制示例 JSON 到项目根目录：

```bash
cp plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json spec-bifrost.json
```

校验：

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"
```

预览：

```bash
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR}" --host 127.0.0.1 --port 3737
```

导出：

```txt
/spec-bifrost:export
```

## 覆盖能力

- 多页面 B 端系统。
- optionSets：采购类型、审批状态、供应商等级。
- 表单、筛选、表格、详情、步骤、卡片。
- 字段类型：text、textarea、number、currency、date、select、radio、file、department、user、status、tag。
- 条件显示、条件必填、基于字段值的动作跳转。
- 页面、section、组件、字段、动作和按钮备注。

## 边界

本示例不代表技术实现方案，不包含接口定义、数据库设计、实体模型、代码结构或任务拆分。
