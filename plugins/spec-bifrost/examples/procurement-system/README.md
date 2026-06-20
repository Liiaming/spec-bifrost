# 采购申请管理系统团队试跑指南

这个示例用于确认 Spec Bifrost v0.4.1 的完整链路：同一份结构化需求资产能否被产品审查、被开发继续理解，并导出两份角色关注点不同但事实一致的需求文档。

运行示例只验证安装、校验和预览是否正常。要形成有效反馈，还需要把同一流程用于一个真实但已脱敏的新 B 端项目。

## 参与角色

- 产品：描述业务目标，检查页面、流程、字段、规则和备注是否准确。
- 开发：检查业务对象、字段口径、流程结果、例外和缺失信息是否足以继续理解需求。

## 第一步：运行现有示例

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

本目录包含一组导出样例，可用于对照 `/spec-bifrost:export` 的输出质量：

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

前端版聚焦页面、流程、字段和操作反馈；后端版聚焦业务对象、字段口径、业务规则和流程结果。两份文档都仍是需求文档。

## 第二步：产品评审

在预览中至少检查：

- 页面是否覆盖申请、审批、采购执行和结果查看。
- 关键字段、必填条件和状态是否符合业务语言。
- 页面跳转、条件显示和操作反馈是否表达清楚。
- notes 是否保留了无法仅靠组件结构表达的规则和例外。

产品应实际修改至少一处 `spec-bifrost.json`，再次运行校验并刷新预览。

## 第三步：开发评审

开发不需要信任或生成生产代码，只需围绕同一份 `spec-bifrost.json` 检查：

- 业务对象和字段口径是否一致。
- 状态流转、成功结果、驳回结果和例外是否可理解。
- 前后页面引用和动作目标是否明确。
- 哪些信息可以直接供开发侧 AI 继续理解，哪些仍需产品重复解释。

开发应记录至少一处明确价值或一处明确阻塞，避免只给“看起来不错”之类评价。

## 第四步：用于自己的新 B 端项目

1. 在一个脱敏项目中运行 `/spec-bifrost:spec`。
2. 生成并修改自己的 `spec-bifrost.json`。
3. 完成产品评审和开发评审。
4. 运行 `/spec-bifrost:export`。
5. 确认两份需求文档事实一致，且都没有进入接口、数据库、架构、代码或任务拆分。

完成或被阻塞后，提交[结构化试用反馈](https://github.com/Liiaming/spec-bifrost/issues/new?template=adoption_feedback.yml)。反馈至少说明团队组合、项目场景、完成阶段，以及具体价值或阻塞。

## 覆盖能力

- 多页面 B 端系统。
- optionSets：采购类型、审批状态、供应商等级。
- 表单、筛选、表格、详情、步骤、卡片。
- v0.3 组件：可编辑明细表、层级表格、供应商对比、看板、工作流、向导、进度、结果反馈、图表、日历、甘特、权限矩阵、规则清单、检查清单、审计日志、附件列表、评论串、组织结构、折叠面板和关系图。
- 字段类型：text、textarea、number、currency、date、select、radio、file、department、user、status、tag。
- 条件显示、条件必填、基于字段值的动作跳转。
- 页面、section、组件、字段、动作和按钮备注。

## 边界

本示例不代表技术实现方案，不包含接口定义、数据库设计、实体模型、代码结构或任务拆分。
