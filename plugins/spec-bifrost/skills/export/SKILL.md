---
name: export
description: Export frontend and backend Markdown requirement documents from spec-bifrost.json.
---

# Spec Bifrost Export

1. Run `spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR:-$PWD}"`.
2. If validation passes, read `${CLAUDE_PROJECT_DIR:-$PWD}/spec-bifrost.json`.
3. Generate both files:
   - `docs/spec-bifrost/frontend-requirements.md`
   - `docs/spec-bifrost/backend-requirements.md`
4. Keep both files as requirement documents.
5. Do not include API definitions, database tables, technical architecture, code structure, task breakdowns, entity models, or implementation advice.
6. Prefer stable headings and concise requirement language over narrative prose.

## 输出结构 / Output Structure

Use these headings unless the user explicitly asks for a different format.

### `frontend-requirements.md`

1. `# <project.name> 前端需求说明`
2. `## 文档边界`
3. `## 页面清单`
4. `## 页面流程`
5. `## 页面级说明`
6. `## 字段级说明`
7. `## 操作反馈`
8. `## 前端导出自检`

### `backend-requirements.md`

1. `# <project.name> 后端需求说明`
2. `## 文档边界`
3. `## 业务对象与字段口径`
4. `## 业务规则`
5. `## 流程结果`
6. `## 例外与备注`
7. `## 后端导出自检`

## 前端版 / Frontend Document

`frontend-requirements.md` should focus on what users see and do:

- 页面清单：list each page title, purpose, route, and visible navigation behavior.
- 页面流程：describe how users move between pages through actions and conditional actions.
- 页面级说明：summarize sections, components, tables, editable tables, tree tables, comparison tables, cards, steps, tabs, modals, drawers, metricList, charts, calendars, gantt plans, kanban boards, workflows, wizards, permission matrices, rules, checklists, audit logs, attachment lists, comment threads, relation graphs, empty states, and notes by page.
- 字段级说明：describe field labels, meanings, required state, validation rules, display rules, conditional visibility, conditional enabled state, and conditional required state.
- 字段与交互规则：keep conditions and validation rules close to the field or action they affect.
- 操作反馈：describe button labels, batch actions, modal/drawer open-close behavior, navigation outcomes, prototype messages, and business-facing notes.

不要把前端版写成实现方案。Do not include component library choices, code structure, state management, styling implementation, framework advice, or task breakdowns.

## 后端版 / Backend Document

`backend-requirements.md` should focus on business facts and process rules that backend engineers need to understand:

- 业务对象与字段口径：describe business objects and important field meanings in plain requirement language, based on pages, fields, and notes.
- 业务规则：summarize validation rules, approval conditions, status meanings, role expectations, and conditional flows.
- 业务规则与治理：preserve ruleList, permissionMatrix, auditLog, workflowDiagram, relationGraph, attachmentList, and commentThread facts when they affect business meaning, permissions, traceability, or exception handling.
- 数据口径：describe what each important field means to the business and when it matters.
- 流程结果：describe what should be true after submission, approval, rejection, batch operation, modal confirmation, drawer follow-up, or navigation in business terms.
- 例外与备注：include notes that affect product behavior or engineering understanding.

不要把后端版写成接口定义、数据库表、实体模型、技术架构、代码结构或实现建议。

## 导出自检 / Export Checklist

Before finishing, check both documents:

- Both files were written to `docs/spec-bifrost/`.
- Every visible page appears in the frontend page list.
- Important conditional visibility, enabled state, required state, and conditional actions are described.
- Important tabs, metricList, timeline, treeList, editableTable, workflowDiagram, permissionMatrix, relationGraph, modal, drawer, file, and batch action requirements are preserved when present.
- Notes from pages, sections, components, fields, and actions are preserved when they affect requirements.
- The frontend document does not contain implementation choices.
- The backend document does not contain API definitions, database tables, entity models, or architecture.
